/**
 * 权限管理内容组件
 * 管理命令执行权限和访问控制
 */
import { html, nothing } from "lit";
import type {
  ToolProfileId,
  ToolPolicyConfig,
  ToolsConfig,
  AgentWithTools,
  PermissionsTabId,
  ExecApprovalsTarget,
  ExecApprovalsTargetNode,
} from "../controllers/model-config";

// 类型定义
export type ExecSecurity = "deny" | "allowlist" | "full";
export type ExecAsk = "off" | "on-miss" | "always";

export type ExecApprovalsDefaults = {
  security?: string;
  ask?: string;
  askFallback?: string;
  autoAllowSkills?: boolean;
};

export type ExecApprovalsAllowlistEntry = {
  id?: string;
  pattern: string;
  lastUsedAt?: number;
  lastUsedCommand?: string;
  lastResolvedPath?: string;
};

export type ExecApprovalsAgent = ExecApprovalsDefaults & {
  allowlist?: ExecApprovalsAllowlistEntry[];
};

export type ExecApprovalsFile = {
  version?: number;
  socket?: { path?: string };
  defaults?: ExecApprovalsDefaults;
  agents?: Record<string, ExecApprovalsAgent>;
};

export type ExecApprovalsSnapshot = {
  path: string;
  exists: boolean;
  hash: string;
  file: ExecApprovalsFile;
};

export type AgentOption = {
  id: string;
  name?: string;
  isDefault?: boolean;
};

export type PermissionsContentProps = {
  // 加载状态
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  connected: boolean;

  // 标签页状态
  activeTab: PermissionsTabId;
  onTabChange: (tab: PermissionsTabId) => void;

  // Exec Approvals 目标选择
  execTarget: ExecApprovalsTarget;
  execTargetNodeId: string | null;
  execTargetNodes: ExecApprovalsTargetNode[];
  onExecTargetChange: (target: ExecApprovalsTarget, nodeId: string | null) => void;

  // Exec Approvals 数据
  execApprovalsSnapshot: ExecApprovalsSnapshot | null;
  execApprovalsForm: ExecApprovalsFile | null;
  selectedAgent: string | null;
  agents: AgentOption[];

  // 回调函数
  onLoad: () => void;
  onSave: () => void;
  onSelectAgent: (agentId: string | null) => void;
  onAddAgent: (agentId: string) => void;
  onRemoveAgent: (agentId: string) => void;
  onPatch: (path: Array<string | number>, value: unknown) => void;
  onRemove: (path: Array<string | number>) => void;
  onAddAllowlistEntry: (agentId: string) => void;
  onRemoveAllowlistEntry: (agentId: string, index: number) => void;

  // 工具权限数据
  toolsConfig: ToolsConfig | null;
  agentToolsConfigs: AgentWithTools[];
  toolsAgents: AgentOption[];
  toolsSelectedAgent: string | null;
  toolsExpanded: boolean;

  // 工具权限回调
  onToolsSelectAgent: (agentId: string | null) => void;
  onToolsToggleExpanded: () => void;
  onToolsUpdateGlobal: (field: keyof ToolPolicyConfig, value: unknown) => void;
  onToolsUpdateAgent: (agentId: string, field: keyof ToolPolicyConfig, value: unknown) => void;
  onToolsAddGlobalDeny: (entry: string) => void;
  onToolsRemoveGlobalDeny: (entry: string) => void;
  onToolsAddAgentDeny: (agentId: string, entry: string) => void;
  onToolsRemoveAgentDeny: (agentId: string, entry: string) => void;
  onToolsToggleDeny: (tool: string, denied: boolean) => void;
};

// 常量
const EXEC_APPROVALS_DEFAULT_SCOPE = "__defaults__";

const SECURITY_OPTIONS: Array<{ value: ExecSecurity; label: string; description: string }> = [
  { value: "deny", label: "拒绝", description: "拒绝所有命令执行" },
  { value: "allowlist", label: "允许列表", description: "仅允许白名单中的命令" },
  { value: "full", label: "完全允许", description: "允许所有命令执行" },
];

const ASK_OPTIONS: Array<{ value: ExecAsk; label: string; description: string }> = [
  { value: "off", label: "关闭", description: "不提示用户确认" },
  { value: "on-miss", label: "未匹配时", description: "命令不在白名单时提示" },
  { value: "always", label: "总是", description: "每次执行都提示确认" },
];

// 工具描述定义
const TOOL_DESCRIPTIONS: Record<string, string> = {
  // 文件操作
  read: "读取文件内容（文本或图片），支持分页读取大文件",
  write: "创建或覆盖文件，自动创建父目录",
  edit: "精确替换文件中的文本内容",
  apply_patch: "应用补丁文件修改",
  // 命令执行
  exec: "执行 Shell 命令，支持后台运行和交互式终端",
  process: "管理运行中的进程（列表/状态/日志/终止）",
  // 网络访问
  web_search: "使用 Brave 搜索 API 进行网络搜索",
  web_fetch: "抓取 URL 内容并转换为 Markdown",
  browser: "控制浏览器（打开/导航/截图/操作）",
  // 设备与展示
  nodes: "管理配对设备（通知/拍照/录制/定位）",
  canvas: "展示内容到画布（演示/截图/执行JS）",
  // 定时任务
  cron: "管理定时任务（添加/修改/删除/执行）",
  // 消息通信
  message: "发送消息到指定目标或广播",
  tts: "文字转语音，返回音频文件",
  // 图像分析
  image: "使用视觉模型分析图片内容",
  // 系统管理
  gateway: "系统管理（重启/配置/更新）",
  // 会话管理
  sessions_list: "列出所有会话",
  sessions_history: "获取会话的消息历史",
  sessions_send: "向其他会话发送消息",
  sessions_spawn: "启动子代理执行任务",
  session_status: "查看/设置会话状态",
  agents_list: "列出可用于 spawn 的代理",
  // 记忆系统
  memory_search: "语义搜索记忆文件",
  memory_get: "读取记忆文件指定行",
};

// 工具分组定义
const TOOL_GROUPS: Record<string, { label: string; desc: string; tools: string[] }> = {
  "group:fs": { label: "文件系统", desc: "文件读写和编辑操作", tools: ["read", "write", "edit", "apply_patch"] },
  "group:runtime": { label: "运行时", desc: "命令执行和进程管理", tools: ["exec", "process"] },
  "group:web": { label: "网络", desc: "网络搜索和内容抓取", tools: ["web_search", "web_fetch"] },
  "group:ui": { label: "界面", desc: "浏览器和画布控制", tools: ["browser", "canvas"] },
  "group:sessions": { label: "会话", desc: "会话和子代理管理", tools: ["sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status"] },
  "group:memory": { label: "记忆", desc: "记忆搜索和读取", tools: ["memory_search", "memory_get"] },
  "group:automation": { label: "自动化", desc: "定时任务和系统管理", tools: ["cron", "gateway"] },
  "group:messaging": { label: "消息", desc: "消息发送和广播", tools: ["message"] },
  "group:nodes": { label: "设备", desc: "配对设备控制", tools: ["nodes"] },
};

const STANDALONE_TOOLS: Array<{ id: string; label: string }> = [
  { id: "tts", label: "语音合成" },
  { id: "image", label: "图像分析" },
  { id: "agents_list", label: "代理列表" },
];

const TOOL_PROFILES: Array<{ value: ToolProfileId; label: string; description: string }> = [
  { value: "minimal", label: "最小", description: "仅 session_status" },
  { value: "coding", label: "编程", description: "文件+运行时+会话+记忆+image" },
  { value: "messaging", label: "消息", description: "消息+部分会话工具" },
  { value: "full", label: "完整", description: "所有工具" },
];

const TOOLS_DEFAULT_SCOPE = "__global__";

// 辅助函数
function normalizeSecurity(value?: string): ExecSecurity {
  if (value === "allowlist" || value === "full" || value === "deny") return value;
  return "deny";
}

function normalizeAsk(value?: string): ExecAsk {
  if (value === "always" || value === "off" || value === "on-miss") return value;
  return "on-miss";
}

function resolveDefaults(form: ExecApprovalsFile | null): {
  security: ExecSecurity;
  ask: ExecAsk;
  askFallback: ExecSecurity;
  autoAllowSkills: boolean;
} {
  const defaults = form?.defaults ?? {};
  return {
    security: normalizeSecurity(defaults.security),
    ask: normalizeAsk(defaults.ask),
    askFallback: normalizeSecurity(defaults.askFallback ?? "deny"),
    autoAllowSkills: Boolean(defaults.autoAllowSkills ?? false),
  };
}

function formatAgo(ts: number | null | undefined): string {
  if (!ts) return "从未";
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

/**
 * 渲染权限管理内容
 */
export function renderPermissionsContent(props: PermissionsContentProps) {
  return html`
    <div class="permissions-content">
      <!-- 顶部标签切换 -->
      <div class="permissions-tabs-header">
        <button
          class="permissions-main-tab ${props.activeTab === "exec" ? "permissions-main-tab--active" : ""}"
          @click=${() => props.onTabChange("exec")}
        >
          <span class="permissions-main-tab__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </span>
          <span class="permissions-main-tab__text">命令执行权限</span>
        </button>
        <button
          class="permissions-main-tab ${props.activeTab === "tools" ? "permissions-main-tab--active" : ""}"
          @click=${() => props.onTabChange("tools")}
        >
          <span class="permissions-main-tab__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </span>
          <span class="permissions-main-tab__text">工具权限</span>
        </button>
      </div>

      <!-- 内容区域 -->
      ${props.activeTab === "exec"
        ? renderExecPermissionsContent(props)
        : renderToolsPermissionsSection(props)}
    </div>
  `;
}

/**
 * 渲染执行目标选择器
 */
function renderExecTargetSection(props: PermissionsContentProps) {
  const isGateway = props.execTarget === "gateway";
  const hasNodes = props.execTargetNodes.length > 0;

  return html`
    <div class="permissions-section permissions-target-section">
      <div class="permissions-section__header">
        <div>
          <h4 class="permissions-section__title">执行目标</h4>
          <p class="permissions-section__desc">
            选择要配置的执行目标：本地网关或远程节点。
          </p>
        </div>
      </div>

      <div class="permissions-target">
        <!-- 目标类型选择 -->
        <div class="permissions-target__type">
          <label class="permissions-target__label">目标类型</label>
          <div class="permissions-target__options">
            <label class="permissions-radio">
              <input
                type="radio"
                name="exec-target"
                value="gateway"
                .checked=${isGateway}
                @change=${() => {
                  if (props.dirty) {
                    const confirmed = confirm("有未保存的更改，切换目标将丢失这些更改。是否继续？");
                    if (!confirmed) return;
                  }
                  props.onExecTargetChange("gateway", null);
                }}
              />
              <span class="permissions-radio__mark"></span>
              <span class="permissions-radio__text">本地网关</span>
            </label>
            <label class="permissions-radio">
              <input
                type="radio"
                name="exec-target"
                value="node"
                .checked=${!isGateway}
                ?disabled=${!hasNodes}
                @change=${() => {
                  if (props.dirty) {
                    const confirmed = confirm("有未保存的更改，切换目标将丢失这些更改。是否继续？");
                    if (!confirmed) return;
                  }
                  const firstNode = props.execTargetNodes[0]?.id ?? null;
                  props.onExecTargetChange("node", firstNode);
                }}
              />
              <span class="permissions-radio__mark"></span>
              <span class="permissions-radio__text">远程节点</span>
              ${!hasNodes ? html`<span class="permissions-radio__hint">（无可用节点）</span>` : nothing}
            </label>
          </div>
        </div>

        <!-- 节点选择（仅在远程节点模式下显示） -->
        ${!isGateway
          ? html`
              <div class="permissions-target__node">
                <label class="permissions-target__label">选择节点</label>
                <select
                  class="permissions-select"
                  ?disabled=${props.saving || !hasNodes}
                  @change=${(event: Event) => {
                    const target = event.target as HTMLSelectElement;
                    const nodeId = target.value || null;
                    if (props.dirty) {
                      const confirmed = confirm("有未保存的更改，切换节点将丢失这些更改。是否继续？");
                      if (!confirmed) {
                        target.value = props.execTargetNodeId ?? "";
                        return;
                      }
                    }
                    props.onExecTargetChange("node", nodeId);
                  }}
                >
                  ${props.execTargetNodes.map(
                    (node) =>
                      html`<option value=${node.id} ?selected=${props.execTargetNodeId === node.id}>
                        ${node.label}
                      </option>`,
                  )}
                </select>
              </div>
            `
          : nothing}

        <!-- 目标说明 -->
        <div class="permissions-target__info">
          ${isGateway
            ? html`
                <div class="permissions-info-box">
                  <span class="permissions-info-box__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  <span class="permissions-info-box__text">
                    <strong>本地网关</strong>：配置在本机执行命令的权限。所有通过此网关执行的命令都将受此配置控制。
                  </span>
                </div>
              `
            : html`
                <div class="permissions-info-box">
                  <span class="permissions-info-box__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  <span class="permissions-info-box__text">
                    <strong>远程节点</strong>：配置在远程设备执行命令的权限。选择的节点必须支持 exec approvals 功能。
                  </span>
                </div>
              `}
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染命令执行权限内容
 */
function renderExecPermissionsContent(props: PermissionsContentProps) {
  const form = props.execApprovalsForm ?? props.execApprovalsSnapshot?.file ?? null;
  const ready = Boolean(form);
  const defaults = resolveDefaults(form);
  const selectedScope = props.selectedAgent ?? EXEC_APPROVALS_DEFAULT_SCOPE;
  const isDefaults = selectedScope === EXEC_APPROVALS_DEFAULT_SCOPE;

  return html`
    <!-- 头部说明 -->
    <div class="permissions-header">
      <h3 class="permissions-title">命令执行权限</h3>
      <p class="permissions-desc">
        配置命令执行的安全策略、用户确认方式和允许列表。这些设置控制 Agent 执行系统命令的权限。
      </p>
    </div>

    <!-- 目标选择器 -->
    ${renderExecTargetSection(props)}

    ${!ready
      ? html`
          <div class="permissions-empty">
            ${props.loading
              ? html`<p>正在加载权限配置...</p>`
              : html`<p>权限配置加载中，请稍候...</p>`}
          </div>
        `
      : html`
          <!-- Agent 选择器 -->
          ${renderAgentSelector(props, selectedScope)}

          <!-- 策略配置 -->
          ${renderPolicySection(props, form, defaults, selectedScope, isDefaults)}

          <!-- 允许列表（仅非默认 Agent 显示） -->
          ${!isDefaults ? renderAllowlistSection(props, form, selectedScope) : nothing}
        `}
  `;
}

/**
 * 渲染 Agent 选择器
 */
function renderAgentSelector(props: PermissionsContentProps, selectedScope: string) {
  const form = props.execApprovalsForm ?? props.execApprovalsSnapshot?.file ?? null;
  const hasWildcard = form?.agents?.["*"] != null;
  const isWildcardSelected = selectedScope === "*";

  return html`
    <div class="permissions-section">
      <div class="permissions-section__header">
        <div>
          <h4 class="permissions-section__title">作用域</h4>
          <p class="permissions-section__desc">选择要配置的 Agent，或配置全局默认设置。</p>
        </div>
        <div class="permissions-section__actions">
          ${!hasWildcard
            ? html`
                <button
                  class="mc-btn mc-btn--sm"
                  ?disabled=${props.saving}
                  @click=${() => props.onAddAgent("*")}
                  title="添加通配符规则，匹配所有 Agent"
                >
                  + 通配符 (*)
                </button>
              `
            : nothing}
          <button
            class="mc-btn mc-btn--sm"
            ?disabled=${props.saving}
            @click=${() => {
              const id = prompt("请输入 Agent ID:");
              if (id?.trim()) {
                props.onAddAgent(id.trim());
              }
            }}
          >
            + 新建 Agent
          </button>
        </div>
      </div>
      <div class="permissions-tabs">
        <button
          class="permissions-tab ${selectedScope === EXEC_APPROVALS_DEFAULT_SCOPE ? "permissions-tab--active" : ""}"
          @click=${() => props.onSelectAgent(null)}
        >
          全局默认
        </button>
        ${hasWildcard
          ? html`
              <button
                class="permissions-tab permissions-tab--wildcard ${isWildcardSelected ? "permissions-tab--active" : ""}"
                @click=${() => props.onSelectAgent("*")}
              >
                * 通配符
                <span class="permissions-tab__badge">匹配所有</span>
              </button>
            `
          : nothing}
        ${props.agents
          .filter((agent) => agent.id !== "*")
          .map((agent) => {
            const label = agent.name?.trim() ? `${agent.name} (${agent.id})` : agent.id;
            const isActive = selectedScope === agent.id;
            const hasConfig = form?.agents?.[agent.id] != null;
            return html`
              <button
                class="permissions-tab ${isActive ? "permissions-tab--active" : ""}"
                @click=${() => props.onSelectAgent(agent.id)}
              >
                ${label}
                ${agent.isDefault ? html`<span class="permissions-tab__badge">默认</span>` : nothing}
                ${hasConfig && !agent.isDefault
                  ? html`<span class="permissions-tab__badge permissions-tab__badge--config">已配置</span>`
                  : nothing}
              </button>
            `;
          })}
      </div>
    </div>
  `;
}

/**
 * 渲染策略配置
 */
function renderPolicySection(
  props: PermissionsContentProps,
  form: ExecApprovalsFile | null,
  defaults: ReturnType<typeof resolveDefaults>,
  selectedScope: string,
  isDefaults: boolean,
) {
  const agent = !isDefaults
    ? ((form?.agents ?? {})[selectedScope] as Record<string, unknown> | undefined) ?? {}
    : {};
  const basePath = isDefaults ? ["defaults"] : ["agents", selectedScope];

  const agentSecurity = typeof agent.security === "string" ? agent.security : undefined;
  const agentAsk = typeof agent.ask === "string" ? agent.ask : undefined;
  const agentAskFallback = typeof agent.askFallback === "string" ? agent.askFallback : undefined;

  const securityValue = isDefaults ? defaults.security : agentSecurity ?? "__default__";
  const askValue = isDefaults ? defaults.ask : agentAsk ?? "__default__";
  const askFallbackValue = isDefaults ? defaults.askFallback : agentAskFallback ?? "__default__";

  const autoOverride = typeof agent.autoAllowSkills === "boolean" ? agent.autoAllowSkills : undefined;
  const autoEffective = autoOverride ?? defaults.autoAllowSkills;
  const autoIsDefault = autoOverride == null;

  // 判断是否可以删除此 Agent 配置
  const hasAgentConfig = !isDefaults && form?.agents?.[selectedScope] != null;
  const isWildcard = selectedScope === "*";

  return html`
    <div class="permissions-section">
      <div class="permissions-section__header">
        <div>
          <h4 class="permissions-section__title">安全策略</h4>
          <p class="permissions-section__desc">
            ${isDefaults
              ? "配置全局默认的安全策略。"
              : isWildcard
                ? "配置通配符规则，匹配所有未单独配置的 Agent。"
                : `配置 ${selectedScope} Agent 的安全策略。`}
          </p>
        </div>
        ${hasAgentConfig
          ? html`
              <button
                class="mc-btn mc-btn--sm mc-btn--danger"
                ?disabled=${props.saving}
                @click=${() => {
                  if (confirm(`确定要删除 ${isWildcard ? "通配符" : selectedScope} 的配置吗？`)) {
                    props.onRemoveAgent(selectedScope);
                  }
                }}
              >
                删除配置
              </button>
            `
          : nothing}
      </div>

      <div class="permissions-policy-grid">
        <!-- 安全模式 -->
        <div class="permissions-policy-item">
          <div class="permissions-policy-item__header">
            <span class="permissions-policy-item__title">安全模式</span>
            <span class="permissions-policy-item__desc">
              ${isDefaults ? "默认的安全级别。" : `默认: ${defaults.security}`}
            </span>
          </div>
          <select
            class="permissions-select"
            ?disabled=${props.saving}
            @change=${(event: Event) => {
              const target = event.target as HTMLSelectElement;
              const value = target.value;
              if (!isDefaults && value === "__default__") {
                props.onRemove([...basePath, "security"]);
              } else {
                props.onPatch([...basePath, "security"], value);
              }
            }}
          >
            ${!isDefaults
              ? html`<option value="__default__" ?selected=${securityValue === "__default__"}>
                  使用默认 (${defaults.security})
                </option>`
              : nothing}
            ${SECURITY_OPTIONS.map(
              (option) =>
                html`<option value=${option.value} ?selected=${securityValue === option.value}>
                  ${option.label} - ${option.description}
                </option>`,
            )}
          </select>
        </div>

        <!-- 用户确认 -->
        <div class="permissions-policy-item">
          <div class="permissions-policy-item__header">
            <span class="permissions-policy-item__title">用户确认</span>
            <span class="permissions-policy-item__desc">
              ${isDefaults ? "何时提示用户确认。" : `默认: ${defaults.ask}`}
            </span>
          </div>
          <select
            class="permissions-select"
            ?disabled=${props.saving}
            @change=${(event: Event) => {
              const target = event.target as HTMLSelectElement;
              const value = target.value;
              if (!isDefaults && value === "__default__") {
                props.onRemove([...basePath, "ask"]);
              } else {
                props.onPatch([...basePath, "ask"], value);
              }
            }}
          >
            ${!isDefaults
              ? html`<option value="__default__" ?selected=${askValue === "__default__"}>
                  使用默认 (${defaults.ask})
                </option>`
              : nothing}
            ${ASK_OPTIONS.map(
              (option) =>
                html`<option value=${option.value} ?selected=${askValue === option.value}>
                  ${option.label} - ${option.description}
                </option>`,
            )}
          </select>
        </div>

        <!-- 确认失败回退 -->
        <div class="permissions-policy-item">
          <div class="permissions-policy-item__header">
            <span class="permissions-policy-item__title">确认失败回退</span>
            <span class="permissions-policy-item__desc">
              ${isDefaults ? "UI 确认不可用时的处理方式。" : `默认: ${defaults.askFallback}`}
            </span>
          </div>
          <select
            class="permissions-select"
            ?disabled=${props.saving}
            @change=${(event: Event) => {
              const target = event.target as HTMLSelectElement;
              const value = target.value;
              if (!isDefaults && value === "__default__") {
                props.onRemove([...basePath, "askFallback"]);
              } else {
                props.onPatch([...basePath, "askFallback"], value);
              }
            }}
          >
            ${!isDefaults
              ? html`<option value="__default__" ?selected=${askFallbackValue === "__default__"}>
                  使用默认 (${defaults.askFallback})
                </option>`
              : nothing}
            ${SECURITY_OPTIONS.map(
              (option) =>
                html`<option value=${option.value} ?selected=${askFallbackValue === option.value}>
                  ${option.label}
                </option>`,
            )}
          </select>
        </div>

        <!-- 自动允许技能 CLI -->
        <div class="permissions-policy-item">
          <div class="permissions-policy-item__header">
            <span class="permissions-policy-item__title">自动允许技能 CLI</span>
            <span class="permissions-policy-item__desc">
              ${isDefaults
                ? "自动允许 Gateway 注册的技能可执行文件。"
                : autoIsDefault
                  ? `使用默认 (${defaults.autoAllowSkills ? "开启" : "关闭"})`
                  : `覆盖 (${autoEffective ? "开启" : "关闭"})`}
            </span>
          </div>
          <div class="permissions-checkbox-row">
            <label class="permissions-checkbox">
              <input
                type="checkbox"
                ?disabled=${props.saving}
                .checked=${autoEffective}
                @change=${(event: Event) => {
                  const target = event.target as HTMLInputElement;
                  props.onPatch([...basePath, "autoAllowSkills"], target.checked);
                }}
              />
              <span>启用</span>
            </label>
            ${!isDefaults && !autoIsDefault
              ? html`
                  <button
                    class="mc-btn mc-btn--sm"
                    ?disabled=${props.saving}
                    @click=${() => props.onRemove([...basePath, "autoAllowSkills"])}
                  >
                    使用默认
                  </button>
                `
              : nothing}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染允许列表
 */
function renderAllowlistSection(
  props: PermissionsContentProps,
  form: ExecApprovalsFile | null,
  selectedScope: string,
) {
  const agent = (form?.agents ?? {})[selectedScope] as ExecApprovalsAgent | undefined;
  const allowlist = Array.isArray(agent?.allowlist) ? agent.allowlist : [];

  return html`
    <div class="permissions-section">
      <div class="permissions-section__header">
        <div>
          <h4 class="permissions-section__title">命令允许列表</h4>
          <p class="permissions-section__desc">
            配置允许执行的命令模式。使用 glob 模式匹配命令（不区分大小写）。
          </p>
        </div>
        <button
          class="mc-btn mc-btn--sm"
          ?disabled=${props.saving}
          @click=${() => props.onAddAllowlistEntry(selectedScope)}
        >
          添加规则
        </button>
      </div>

      <div class="permissions-allowlist">
        ${allowlist.length === 0
          ? html`
              <div class="permissions-allowlist__empty">
                <p>暂无允许列表规则。</p>
                <p class="muted">点击"添加规则"来添加允许执行的命令模式。</p>
              </div>
            `
          : allowlist.map((entry, index) =>
              renderAllowlistEntry(props, entry, selectedScope, index),
            )}
      </div>
    </div>
  `;
}

/**
 * 渲染允许列表条目
 */
function renderAllowlistEntry(
  props: PermissionsContentProps,
  entry: ExecApprovalsAllowlistEntry,
  selectedScope: string,
  index: number,
) {
  const lastUsed = formatAgo(entry.lastUsedAt);
  const pattern = entry.pattern?.trim() || "";

  return html`
    <div class="permissions-allowlist__item">
      <div class="permissions-allowlist__item-main">
        <div class="permissions-allowlist__item-pattern">
          <input
            type="text"
            class="permissions-input"
            placeholder="例如: git *, npm run *, /usr/bin/*"
            .value=${pattern}
            ?disabled=${props.saving}
            @input=${(event: Event) => {
              const target = event.target as HTMLInputElement;
              props.onPatch(
                ["agents", selectedScope, "allowlist", index, "pattern"],
                target.value,
              );
            }}
          />
        </div>
        <div class="permissions-allowlist__item-meta">
          <span class="muted">最后使用: ${lastUsed}</span>
          ${entry.lastUsedCommand
            ? html`<span class="mono muted" title=${entry.lastUsedCommand}>
                ${entry.lastUsedCommand.length > 50
                  ? entry.lastUsedCommand.slice(0, 50) + "..."
                  : entry.lastUsedCommand}
              </span>`
            : nothing}
        </div>
      </div>
      <div class="permissions-allowlist__item-actions">
        <button
          class="mc-btn mc-btn--sm mc-btn--danger"
          ?disabled=${props.saving}
          @click=${() => props.onRemoveAllowlistEntry(selectedScope, index)}
        >
          删除
        </button>
      </div>
    </div>
  `;
}

// ============================================
// 工具权限管理相关函数
// ============================================

/**
 * 渲染工具权限管理区块
 */
function renderToolsPermissionsSection(props: PermissionsContentProps) {
  const selectedScope = props.toolsSelectedAgent ?? TOOLS_DEFAULT_SCOPE;
  const isGlobal = selectedScope === TOOLS_DEFAULT_SCOPE;

  // 获取当前作用域的配置
  const globalConfig = props.toolsConfig ?? {};
  const agentConfig = !isGlobal
    ? props.agentToolsConfigs.find((a) => a.id === selectedScope)?.tools ?? {}
    : {};
  const currentConfig = isGlobal ? globalConfig : agentConfig;

  return html`
    <div class="permissions-header">
      <h3 class="permissions-title">工具权限</h3>
      <p class="permissions-desc">
        配置 Agent 可以使用的工具。可以选择预设配置档案，或单独控制每个工具的启用/禁用状态。
      </p>
    </div>

    <!-- 工具作用域选择器 -->
    ${renderToolsScopeSelector(props, selectedScope)}

    <!-- 配置档案选择 -->
    ${renderToolsProfileSection(props, currentConfig, selectedScope, isGlobal, globalConfig)}

    <!-- 工具列表（带开关） -->
    ${renderToolsListSection(props, currentConfig, selectedScope, isGlobal)}
  `;
}

/**
 * 渲染工具作用域选择器
 */
function renderToolsScopeSelector(props: PermissionsContentProps, selectedScope: string) {
  return html`
    <div class="permissions-section">
      <div class="permissions-section__header">
        <div>
          <h4 class="permissions-section__title">作用域</h4>
          <p class="permissions-section__desc">选择要配置的 Agent，或配置全局默认设置。</p>
        </div>
      </div>
      <div class="permissions-tabs">
        <button
          class="permissions-tab ${selectedScope === TOOLS_DEFAULT_SCOPE ? "permissions-tab--active" : ""}"
          @click=${() => props.onToolsSelectAgent(null)}
        >
          全局默认
        </button>
        ${props.toolsAgents.map((agent) => {
          const label = agent.name?.trim() ? `${agent.name} (${agent.id})` : agent.id;
          const isActive = selectedScope === agent.id;
          return html`
            <button
              class="permissions-tab ${isActive ? "permissions-tab--active" : ""}"
              @click=${() => props.onToolsSelectAgent(agent.id)}
            >
              ${label}
              ${agent.isDefault ? html`<span class="permissions-tab__badge">默认</span>` : nothing}
            </button>
          `;
        })}
      </div>
    </div>
  `;
}

/**
 * 渲染配置档案选择
 */
function renderToolsProfileSection(
  props: PermissionsContentProps,
  currentConfig: ToolPolicyConfig,
  selectedScope: string,
  isGlobal: boolean,
  globalConfig: ToolPolicyConfig,
) {
  const profileValue = currentConfig.profile ?? (isGlobal ? undefined : "__default__");
  const globalProfile = globalConfig.profile;

  return html`
    <div class="permissions-section">
      <div class="permissions-section__header">
        <div>
          <h4 class="permissions-section__title">配置档案</h4>
          <p class="permissions-section__desc">
            ${isGlobal
              ? "选择预设的工具配置档案，或留空使用默认配置。"
              : globalProfile
                ? `全局档案: ${globalProfile}`
                : "全局未设置档案，使用系统默认"}
          </p>
        </div>
      </div>
      <div class="permissions-policy-grid">
        <div class="permissions-policy-item">
          <div class="permissions-policy-item__header">
            <span class="permissions-policy-item__title">工具档案</span>
            <span class="permissions-policy-item__desc">
              选择预设的工具权限集合
            </span>
          </div>
          <select
            class="permissions-select"
            ?disabled=${props.saving}
            @change=${(event: Event) => {
              const target = event.target as HTMLSelectElement;
              const value = target.value;
              if (isGlobal) {
                props.onToolsUpdateGlobal("profile", value || undefined);
              } else if (value === "__default__") {
                props.onToolsUpdateAgent(selectedScope, "profile", undefined);
              } else {
                props.onToolsUpdateAgent(selectedScope, "profile", value || undefined);
              }
            }}
          >
            ${!isGlobal
              ? html`<option value="__default__" ?selected=${profileValue === "__default__"}>
                  使用全局设置${globalProfile ? ` (${globalProfile})` : ""}
                </option>`
              : html`<option value="" ?selected=${!profileValue}>
                  未设置（使用系统默认）
                </option>`}
            ${TOOL_PROFILES.map(
              (profile) =>
                html`<option value=${profile.value} ?selected=${profileValue === profile.value}>
                  ${profile.label} - ${profile.description}
                </option>`,
            )}
          </select>
        </div>
      </div>
    </div>
  `;
}

/**
 * 渲染工具列表（带开关）
 */
function renderToolsListSection(
  props: PermissionsContentProps,
  currentConfig: ToolPolicyConfig,
  selectedScope: string,
  isGlobal: boolean,
) {
  const denyList = currentConfig.deny ?? [];
  const totalTools = Object.values(TOOL_GROUPS).reduce(
    (sum, group) => sum + group.tools.length,
    0,
  ) + STANDALONE_TOOLS.length;

  // 检查工具是否被禁用
  const isToolDenied = (toolId: string): boolean => {
    // 直接禁用
    if (denyList.includes(toolId)) return true;
    // 通过分组禁用
    for (const [groupId, group] of Object.entries(TOOL_GROUPS)) {
      if (group.tools.includes(toolId) && denyList.includes(groupId)) {
        return true;
      }
    }
    return false;
  };

  // 检查分组是否被禁用
  const isGroupDenied = (groupId: string): boolean => {
    return denyList.includes(groupId);
  };

  // 切换工具禁用状态
  const handleToolToggle = (toolId: string, currentlyDenied: boolean) => {
    if (currentlyDenied) {
      // 启用工具（从 deny 列表移除）
      if (isGlobal) {
        props.onToolsRemoveGlobalDeny(toolId);
      } else {
        props.onToolsRemoveAgentDeny(selectedScope, toolId);
      }
    } else {
      // 禁用工具（添加到 deny 列表）
      if (isGlobal) {
        props.onToolsAddGlobalDeny(toolId);
      } else {
        props.onToolsAddAgentDeny(selectedScope, toolId);
      }
    }
  };

  // 切换分组禁用状态
  const handleGroupToggle = (groupId: string, currentlyDenied: boolean) => {
    if (currentlyDenied) {
      if (isGlobal) {
        props.onToolsRemoveGlobalDeny(groupId);
      } else {
        props.onToolsRemoveAgentDeny(selectedScope, groupId);
      }
    } else {
      if (isGlobal) {
        props.onToolsAddGlobalDeny(groupId);
      } else {
        props.onToolsAddAgentDeny(selectedScope, groupId);
      }
    }
  };

  return html`
    <div class="permissions-section">
      <div class="permissions-section__header">
        <div>
          <h4 class="permissions-section__title">工具列表</h4>
          <p class="permissions-section__desc">
            共 ${totalTools} 个工具，使用开关控制启用/禁用状态。
          </p>
        </div>
        <button
          class="mc-btn mc-btn--sm"
          @click=${props.onToolsToggleExpanded}
        >
          ${props.toolsExpanded ? "收起" : "展开"}
        </button>
      </div>

      ${props.toolsExpanded
        ? html`
            <div class="tools-list">
              ${Object.entries(TOOL_GROUPS).map(([groupId, group]) => {
                const groupDenied = isGroupDenied(groupId);
                return html`
                  <div class="tools-group ${groupDenied ? "tools-group--denied" : ""}">
                    <div class="tools-group__header">
                      <div class="tools-group__info">
                        <span class="tools-group__name">${group.label}</span>
                        <span class="tools-group__desc">${group.desc}</span>
                      </div>
                      <div class="tools-group__toggle">
                        <span class="tools-group__count">${group.tools.length} 个工具</span>
                        <label class="mc-toggle">
                          <input
                            type="checkbox"
                            .checked=${!groupDenied}
                            ?disabled=${props.saving}
                            @change=${() => handleGroupToggle(groupId, groupDenied)}
                          />
                          <span class="mc-toggle__track"></span>
                        </label>
                      </div>
                    </div>
                    <div class="tools-group__items">
                      ${group.tools.map((toolId) => {
                        const denied = isToolDenied(toolId);
                        const desc = TOOL_DESCRIPTIONS[toolId] ?? "";
                        return html`
                          <div class="tools-item ${denied ? "tools-item--denied" : ""}">
                            <div class="tools-item__info">
                              <span class="tools-item__name">${toolId}</span>
                              <span class="tools-item__desc">${desc}</span>
                            </div>
                            <label class="mc-toggle mc-toggle--sm">
                              <input
                                type="checkbox"
                                .checked=${!denied}
                                ?disabled=${props.saving || groupDenied}
                                @change=${() => handleToolToggle(toolId, denied)}
                              />
                              <span class="mc-toggle__track"></span>
                            </label>
                          </div>
                        `;
                      })}
                    </div>
                  </div>
                `;
              })}

              <!-- 独立工具 -->
              <div class="tools-group">
                <div class="tools-group__header">
                  <div class="tools-group__info">
                    <span class="tools-group__name">独立工具</span>
                    <span class="tools-group__desc">不属于任何分组的工具</span>
                  </div>
                  <div class="tools-group__toggle">
                    <span class="tools-group__count">${STANDALONE_TOOLS.length} 个工具</span>
                  </div>
                </div>
                <div class="tools-group__items">
                  ${STANDALONE_TOOLS.map((tool) => {
                    const denied = isToolDenied(tool.id);
                    const desc = TOOL_DESCRIPTIONS[tool.id] ?? "";
                    return html`
                      <div class="tools-item ${denied ? "tools-item--denied" : ""}">
                        <div class="tools-item__info">
                          <span class="tools-item__name">${tool.id}</span>
                          <span class="tools-item__label">${tool.label}</span>
                          <span class="tools-item__desc">${desc}</span>
                        </div>
                        <label class="mc-toggle mc-toggle--sm">
                          <input
                            type="checkbox"
                            .checked=${!denied}
                            ?disabled=${props.saving}
                            @change=${() => handleToolToggle(tool.id, denied)}
                          />
                          <span class="mc-toggle__track"></span>
                        </label>
                      </div>
                    `;
                  })}
                </div>
              </div>
            </div>
          `
        : nothing}
    </div>
  `;
}
