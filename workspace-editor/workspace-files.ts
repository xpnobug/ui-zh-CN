/**
 * Workspace file operations for the workspace-editor plugin.
 * 工作区文件操作
 *
 * Supports reading, writing and listing bootstrap files in the agent workspace.
 * 支持读取、写入和列出 agent 工作区中的启动文件
 *
 * Access is restricted to a whitelist of known filenames.
 * 访问仅限于已知文件名的白名单
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

import type { MoltbotConfig } from "clawdbot/plugin-sdk";

// ───────────────────────────────────────────────────────────────────────────
// Whitelist of allowed workspace filenames
// 允许访问的工作区文件白名单
// ───────────────────────────────────────────────────────────────────────────

const ALLOWED_FILES = new Set([
  "SOUL.md",       // Agent 灵魂/核心人格定义
  "IDENTITY.md",   // Agent 身份信息
  "TOOLS.md",      // Agent 工具说明
  "USER.md",       // 用户信息
  "HEARTBEAT.md",  // 心跳/定时任务配置
  "BOOTSTRAP.md",  // 启动配置
  "MEMORY.md",     // 记忆文件（大写）
  "memory.md",     // 记忆文件（小写）
  "AGENTS.md",     // 多 Agent 配置
]);

// ───────────────────────────────────────────────────────────────────────────
// Type definitions / 类型定义
// ───────────────────────────────────────────────────────────────────────────

/**
 * Information about a workspace file
 * 工作区文件信息
 */
export type WorkspaceFileInfo = {
  name: string;           // 文件名 / Filename
  path: string;           // 完整路径 / Full path
  exists: boolean;        // 是否存在 / Whether file exists
  size: number;           // 文件大小（字节）/ File size in bytes
  modifiedAt: number | null; // 最后修改时间戳 / Last modified timestamp
};

/**
 * Result of listing workspace files
 * 列出工作区文件的结果
 */
export type WorkspaceFilesListResult = {
  workspaceDir: string;   // 工作区目录 / Workspace directory
  agentId: string;        // Agent ID
  files: WorkspaceFileInfo[]; // 文件列表 / File list
};

/**
 * Result of reading a workspace file
 * 读取工作区文件的结果
 */
export type WorkspaceFileReadResult = {
  name: string;           // 文件名 / Filename
  path: string;           // 完整路径 / Full path
  exists: boolean;        // 是否存在 / Whether file exists
  content: string;        // 文件内容 / File content
};

/**
 * Result of writing a workspace file
 * 写入工作区文件的结果
 */
export type WorkspaceFileWriteResult = {
  ok: boolean;            // 是否成功 / Whether successful
  path: string;           // 完整路径 / Full path
  bytesWritten: number;   // 写入字节数 / Bytes written
};

// ───────────────────────────────────────────────────────────────────────────
// Resolve workspace directory / 解析工作区目录
// ───────────────────────────────────────────────────────────────────────────

/**
 * Get default workspace directory based on profile
 * 根据 profile 获取默认工作区目录
 */
function resolveDefaultWorkspaceDir(): string {
  const profile = process.env.CLAWDBOT_PROFILE?.trim();
  if (profile && profile.toLowerCase() !== "default") {
    return path.join(os.homedir(), `clawd-${profile}`);
  }
  return path.join(os.homedir(), "clawd");
}

/**
 * Resolve workspace directory for a specific agent
 * 解析特定 agent 的工作区目录
 *
 * @param config - Moltbot configuration / Moltbot 配置
 * @param agentId - Optional agent ID / 可选的 agent ID
 * @returns Workspace directory and resolved agent ID / 工作区目录和解析后的 agent ID
 */
function resolveAgentWorkspaceDir(
  config: MoltbotConfig,
  agentId?: string,
): { workspaceDir: string; resolvedAgentId: string } {
  const agents = config.agents as
    | { list?: Array<{ id?: string; workspace?: string; default?: boolean }> }
    | undefined;
  const list = agents?.list ?? [];

  // Find the specified agent or the default one
  // 查找指定的 agent 或默认 agent
  let agent = agentId
    ? list.find((a) => a.id === agentId)
    : list.find((a) => a.default) ?? list[0];

  if (!agent) {
    // Fallback to default workspace / 回退到默认工作区
    return {
      workspaceDir: resolveDefaultWorkspaceDir(),
      resolvedAgentId: agentId ?? "main",
    };
  }

  // Resolve workspace path (may contain ~ for home directory)
  // 解析工作区路径（可能包含 ~ 表示主目录）
  let workspaceDir = agent.workspace?.trim() || resolveDefaultWorkspaceDir();
  if (workspaceDir.startsWith("~")) {
    workspaceDir = path.join(os.homedir(), workspaceDir.slice(1));
  }

  return {
    workspaceDir,
    resolvedAgentId: agent.id ?? "main",
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Security: validate filename / 安全性：验证文件名
// ───────────────────────────────────────────────────────────────────────────

/**
 * Validate filename against whitelist and path traversal attacks
 * 验证文件名是否在白名单内，并防止路径遍历攻击
 *
 * @param fileName - Filename to validate / 要验证的文件名
 * @throws Error if filename is invalid / 如果文件名无效则抛出错误
 */
function validateFileName(fileName: string): void {
  // Reject path traversal / 拒绝路径遍历
  if (fileName.includes("/") || fileName.includes("\\") || fileName === "..") {
    throw new Error(`Invalid filename: ${fileName}`);
  }
  // Must be in whitelist / 必须在白名单内
  if (!ALLOWED_FILES.has(fileName)) {
    throw new Error(
      `File not allowed: ${fileName}. Allowed files: ${[...ALLOWED_FILES].join(", ")}`,
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────
// List workspace files / 列出工作区文件
// ───────────────────────────────────────────────────────────────────────────

/**
 * List all workspace files (from whitelist)
 * 列出所有工作区文件（从白名单）
 *
 * Returns information about each file, including whether it exists.
 * 返回每个文件的信息，包括是否存在。
 *
 * @param config - Moltbot configuration / Moltbot 配置
 * @param agentId - Optional agent ID / 可选的 agent ID
 * @returns List result with files / 包含文件的列表结果
 */
export async function listWorkspaceFiles(
  config: MoltbotConfig,
  agentId?: string,
): Promise<WorkspaceFilesListResult> {
  const { workspaceDir, resolvedAgentId } = resolveAgentWorkspaceDir(
    config,
    agentId,
  );

  const files: WorkspaceFileInfo[] = [];

  // Check each file in the whitelist / 检查白名单中的每个文件
  for (const name of ALLOWED_FILES) {
    const filePath = path.join(workspaceDir, name);
    let exists = false;
    let size = 0;
    let modifiedAt: number | null = null;

    try {
      const stat = await fs.stat(filePath);
      exists = stat.isFile();
      size = stat.size;
      modifiedAt = stat.mtimeMs;
    } catch {
      // File does not exist / 文件不存在
    }

    files.push({
      name,
      path: filePath,
      exists,
      size,
      modifiedAt,
    });
  }

  // Sort: existing files first, then alphabetically
  // 排序：已存在的文件优先，然后按字母顺序
  files.sort((a, b) => {
    if (a.exists && !b.exists) return -1;
    if (!a.exists && b.exists) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    workspaceDir,
    agentId: resolvedAgentId,
    files,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Read workspace file / 读取工作区文件
// ───────────────────────────────────────────────────────────────────────────

/**
 * Read content of a workspace file
 * 读取工作区文件内容
 *
 * @param config - Moltbot configuration / Moltbot 配置
 * @param fileName - Name of file to read / 要读取的文件名
 * @param agentId - Optional agent ID / 可选的 agent ID
 * @returns Read result with content / 包含内容的读取结果
 */
export async function readWorkspaceFile(
  config: MoltbotConfig,
  fileName: string,
  agentId?: string,
): Promise<WorkspaceFileReadResult> {
  // Validate filename against whitelist / 验证文件名是否在白名单内
  validateFileName(fileName);

  const { workspaceDir } = resolveAgentWorkspaceDir(config, agentId);
  const filePath = path.join(workspaceDir, fileName);

  let exists = false;
  let content = "";

  try {
    content = await fs.readFile(filePath, "utf-8");
    exists = true;
  } catch (err) {
    const anyErr = err as { code?: string };
    if (anyErr.code !== "ENOENT") {
      throw err;
    }
    // File does not exist - return empty content
    // 文件不存在 - 返回空内容
  }

  return {
    name: fileName,
    path: filePath,
    exists,
    content,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Write workspace file / 写入工作区文件
// ───────────────────────────────────────────────────────────────────────────

/**
 * Write content to a workspace file
 * 写入内容到工作区文件
 *
 * Creates the file if it doesn't exist, or overwrites if it does.
 * 如果文件不存在则创建，如果存在则覆盖。
 *
 * @param config - Moltbot configuration / Moltbot 配置
 * @param fileName - Name of file to write / 要写入的文件名
 * @param content - Content to write / 要写入的内容
 * @param agentId - Optional agent ID / 可选的 agent ID
 * @returns Write result / 写入结果
 */
export async function writeWorkspaceFile(
  config: MoltbotConfig,
  fileName: string,
  content: string,
  agentId?: string,
): Promise<WorkspaceFileWriteResult> {
  // Validate filename against whitelist / 验证文件名是否在白名单内
  validateFileName(fileName);

  const { workspaceDir } = resolveAgentWorkspaceDir(config, agentId);
  const filePath = path.join(workspaceDir, fileName);

  // Ensure directory exists / 确保目录存在
  await fs.mkdir(workspaceDir, { recursive: true });

  // Write file / 写入文件
  await fs.writeFile(filePath, content, "utf-8");

  return {
    ok: true,
    path: filePath,
    bytesWritten: Buffer.byteLength(content, "utf-8"),
  };
}
