/**
 * 工作区文件控制器
 * Workspace file controller
 *
 * 管理工作区文件的加载、读取、编辑、保存逻辑
 * Manages workspace file loading, reading, editing, and saving logic
 */
import type { WorkspaceFileInfo } from "../components/workspace-content";

// ─── 类型定义 / Types ──────────────────────────────────────────────────────

/**
 * Gateway 客户端接口（精简）
 * Gateway client interface (minimal)
 */
export type WorkspaceClient = {
  request: (method: string, params: Record<string, unknown>) => Promise<unknown>;
};

/**
 * 工作区状态
 * Workspace state
 */
export type WorkspaceState = {
  /** Gateway 客户端 / Gateway client */
  client: WorkspaceClient | null;
  /** 是否已连接 / Connected */
  connected: boolean;

  /** 文件列表 / File list */
  workspaceFiles: WorkspaceFileInfo[];
  /** 工作区目录 / Workspace directory */
  workspaceDir: string;
  /** Agent ID */
  workspaceAgentId: string;
  /** 当前选中的文件 / Currently selected file */
  workspaceSelectedFile: string | null;
  /** 编辑器内容 / Editor content */
  workspaceEditorContent: string;
  /** 原始内容（保存时的内容）/ Original content (content at save time) */
  workspaceOriginalContent: string;
  /** 是否正在加载文件列表 / Loading file list */
  workspaceLoading: boolean;
  /** 是否正在保存文件 / Saving file */
  workspaceSaving: boolean;
  /** 错误信息 / Error message */
  workspaceError: string | null;
  /** 编辑器模式 / Editor mode */
  workspaceEditorMode: "edit" | "preview" | "split";
};

/**
 * 创建工作区初始状态
 * Create initial workspace state
 */
export function createWorkspaceState(): WorkspaceState {
  return {
    client: null,
    connected: false,
    workspaceFiles: [],
    workspaceDir: "",
    workspaceAgentId: "main",
    workspaceSelectedFile: null,
    workspaceEditorContent: "",
    workspaceOriginalContent: "",
    workspaceLoading: false,
    workspaceSaving: false,
    workspaceError: null,
    workspaceEditorMode: "edit",
  };
}

// ─── 类型守卫 / Type guards ──────────────────────────────────────────────────

type FilesListResponse = {
  workspaceDir: string;
  agentId: string;
  files: WorkspaceFileInfo[];
};

type FileReadResponse = {
  name: string;
  path: string;
  exists: boolean;
  content: string;
};

type FileWriteResponse = {
  ok: boolean;
  path: string;
  bytesWritten: number;
};

// ─── 操作函数 / Actions ─────────────────────────────────────────────────────

/**
 * 加载工作区文件列表
 * Load workspace file list
 */
export async function loadWorkspaceFiles(
  state: WorkspaceState,
  requestUpdate: () => void,
): Promise<void> {
  if (!state.client || !state.connected) return;

  state.workspaceLoading = true;
  state.workspaceError = null;
  requestUpdate();

  try {
    const res = (await state.client.request("workspace.files.list", {
      agentId: state.workspaceAgentId || undefined,
    })) as FilesListResponse;

    state.workspaceFiles = res.files;
    state.workspaceDir = res.workspaceDir;
    state.workspaceAgentId = res.agentId;
  } catch (err) {
    state.workspaceError = `加载文件列表失败: ${String(err)}`;
  } finally {
    state.workspaceLoading = false;
    requestUpdate();
  }
}

/**
 * 选择并读取文件
 * Select and read a file
 */
export async function selectWorkspaceFile(
  state: WorkspaceState,
  fileName: string,
  requestUpdate: () => void,
): Promise<void> {
  if (!state.client || !state.connected) return;

  state.workspaceSelectedFile = fileName;
  state.workspaceLoading = true;
  state.workspaceError = null;
  requestUpdate();

  try {
    const res = (await state.client.request("workspace.file.read", {
      fileName,
      agentId: state.workspaceAgentId || undefined,
    })) as FileReadResponse;

    state.workspaceEditorContent = res.content;
    state.workspaceOriginalContent = res.content;

    if (!res.exists) {
      // 文件不存在，显示提示 / File does not exist
      state.workspaceError = "文件不存在，编辑后保存将自动创建";
    }
  } catch (err) {
    state.workspaceError = `读取文件失败: ${String(err)}`;
  } finally {
    state.workspaceLoading = false;
    requestUpdate();
  }
}

/**
 * 更新编辑器内容
 * Update editor content
 */
export function updateWorkspaceContent(
  state: WorkspaceState,
  content: string,
  requestUpdate: () => void,
): void {
  state.workspaceEditorContent = content;
  requestUpdate();
}

/**
 * 保存当前文件
 * Save current file
 */
export async function saveWorkspaceFile(
  state: WorkspaceState,
  requestUpdate: () => void,
): Promise<void> {
  if (!state.client || !state.connected || !state.workspaceSelectedFile) return;

  state.workspaceSaving = true;
  state.workspaceError = null;
  requestUpdate();

  try {
    (await state.client.request("workspace.file.write", {
      fileName: state.workspaceSelectedFile,
      content: state.workspaceEditorContent,
      agentId: state.workspaceAgentId || undefined,
    })) as FileWriteResponse;

    // 保存成功后更新原始内容 / Update original content after successful save
    state.workspaceOriginalContent = state.workspaceEditorContent;

    // 刷新文件列表以更新大小和修改时间 / Refresh file list to update size and modification time
    await loadWorkspaceFiles(state, requestUpdate);
  } catch (err) {
    state.workspaceError = `保存文件失败: ${String(err)}`;
  } finally {
    state.workspaceSaving = false;
    requestUpdate();
  }
}

/**
 * 切换编辑器模式
 * Toggle editor mode
 */
export function setWorkspaceEditorMode(
  state: WorkspaceState,
  mode: "edit" | "preview" | "split",
  requestUpdate: () => void,
): void {
  state.workspaceEditorMode = mode;
  requestUpdate();
}

/**
 * 创建新文件（通过选择并保存空内容）
 * Create new file (by selecting and saving empty content)
 */
export async function createWorkspaceFile(
  state: WorkspaceState,
  fileName: string,
  requestUpdate: () => void,
): Promise<void> {
  state.workspaceSelectedFile = fileName;
  state.workspaceEditorContent = "";
  state.workspaceOriginalContent = "";
  state.workspaceError = "文件不存在，编辑后保存将自动创建";
  requestUpdate();
}

/**
 * 检查工作区是否有未保存的变更
 * Check if workspace has unsaved changes
 */
export function hasWorkspaceChanges(state: WorkspaceState): boolean {
  return state.workspaceEditorContent !== state.workspaceOriginalContent;
}
