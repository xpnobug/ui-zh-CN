/**
 * 模型配置页面视图
 * 左侧侧边栏 + 右侧配置内容的布局
 */
import { html, nothing } from "lit";
import { renderConfigSidebar } from "../components/config-sidebar";
import { renderProvidersContent } from "../components/providers-content";
import { renderAgentContent } from "../components/agent-content";
import { renderGatewayContent } from "../components/gateway-content";
import { renderChannelsContent } from "../components/channels-content";
import {
  renderWorkspaceContent,
  type WorkspaceFileInfo,
} from "../components/workspace-content";
import {
  renderPermissionsContent,
  type ExecApprovalsSnapshot,
  type ExecApprovalsFile,
  type AgentOption,
} from "../components/permissions-content";
import type {
  ExecApprovalsTarget,
  ExecApprovalsTargetNode,
} from "../controllers/model-config";
import type { ChannelsConfigData } from "../types/channel-config";
import type {
  ToolPolicyConfig,
  ToolsConfig,
  AgentWithTools,
  PermissionsTabId,
  SessionsListResult,
} from "../controllers/model-config";

// 中文标签
const LABELS = {
  save: "保存配置",
  apply: "保存并应用",
  reload: "重新加载",
  saving: "保存中...",
  applying: "应用中...",
  loading: "加载中...",
};

// 类型定义
export type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  api: "openai-completions" | "anthropic-messages";
  models: ModelConfig[];
};

export type ModelConfig = {
  id: string;
  name: string;
  reasoning: boolean;
  input: string[];
  contextWindow: number;
  maxTokens: number;
  cost?: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
};

export type AgentDefaults = {
  maxConcurrent?: number;
  subagents?: {
    maxConcurrent?: number;
  };
  workspace?: string;
  model?: {
    primary?: string;
  };
  contextPruning?: {
    mode?: string;
    ttl?: string;
  };
  compaction?: {
    mode?: string;
  };
};

export type GatewayConfig = {
  port?: number;
  bind?: string;
  auth?: {
    mode?: string;
    token?: string;
  };
};

export type ModelConfigProps = {
  loading: boolean;
  saving: boolean;
  applying: boolean;
  connected: boolean;
  hasChanges: boolean;

  // 模型供应商数据
  providers: Record<string, ProviderConfig>;
  // Agent 默认设置
  agentDefaults: AgentDefaults;
  // Gateway 配置
  gatewayConfig: GatewayConfig;
  // 可用模型列表（用于下拉选择）
  availableModels: Array<{ id: string; name: string; provider: string }>;

  // 通道配置
  channelsConfig: ChannelsConfigData;
  selectedChannel: string | null;

  // 展开状态
  expandedProviders: Set<string>;

  // 当前选中的配置区块
  activeSection?: string;

  // 会话管理相关 (用于 Agent 设置页)
  agentSessionsLoading: boolean;
  agentSessionsResult: SessionsListResult | null;
  agentSessionsError: string | null;
  onAgentSessionsRefresh: () => void;
  onAgentSessionModelChange: (sessionKey: string, model: string | null) => void;
  onAgentSessionNavigate: (sessionKey: string) => void;

  // 工作区文件相关 / Workspace file props
  workspaceFiles: WorkspaceFileInfo[];
  workspaceDir: string;
  workspaceAgentId: string;
  workspaceSelectedFile: string | null;
  workspaceEditorContent: string;
  workspaceOriginalContent: string;
  workspaceLoading: boolean;
  workspaceSaving: boolean;
  workspaceError: string | null;
  workspaceEditorMode: "edit" | "preview" | "split";
  expandedFolders?: Set<string>;
  onWorkspaceFileSelect: (fileName: string) => void;
  onWorkspaceContentChange: (content: string) => void;
  onWorkspaceFileSave: () => void;
  onWorkspaceRefresh: () => void;
  onWorkspaceModeChange: (mode: "edit" | "preview" | "split") => void;
  onWorkspaceFileCreate: (fileName: string) => void;
  onFolderToggle?: (folderName: string) => void;

  // 权限管理相关 / Permissions props
  permissionsLoading: boolean;
  permissionsSaving: boolean;
  permissionsDirty: boolean;
  execApprovalsSnapshot: ExecApprovalsSnapshot | null;
  execApprovalsForm: ExecApprovalsFile | null;
  permissionsSelectedAgent: string | null;
  permissionsAgents: AgentOption[];

  // Exec Approvals 目标选择
  execTarget: ExecApprovalsTarget;
  execTargetNodeId: string | null;
  execTargetNodes: ExecApprovalsTargetNode[];
  onExecTargetChange: (target: ExecApprovalsTarget, nodeId: string | null) => void;

  // 工具权限相关
  toolsConfig: ToolsConfig | null;
  agentToolsConfigs: AgentWithTools[];
  toolsAgents: AgentOption[];
  toolsSelectedAgent: string | null;
  toolsExpanded: boolean;

  // 回调函数
  onReload: () => void;
  onSave: () => void;
  onApply: () => void;
  onSectionChange?: (sectionId: string) => void;
  onProviderToggle: (key: string) => void;
  onProviderAdd: () => void;
  onProviderRemove: (key: string) => void;
  onProviderRename: (oldKey: string, newKey: string) => void;
  onProviderUpdate: (key: string, field: string, value: unknown) => void;
  onModelAdd: (providerKey: string) => void;
  onModelRemove: (providerKey: string, modelIndex: number) => void;
  onModelUpdate: (providerKey: string, modelIndex: number, field: string, value: unknown) => void;
  onAgentDefaultsUpdate: (path: string[], value: unknown) => void;
  onGatewayUpdate: (path: string[], value: unknown) => void;
  onNavigateToChannels: () => void;
  onChannelSelect: (channelId: string) => void;
  onChannelConfigUpdate: (channelId: string, field: string, value: unknown) => void;
  // 权限管理回调
  permissionsActiveTab: PermissionsTabId;
  onPermissionsTabChange: (tab: PermissionsTabId) => void;
  onPermissionsLoad: () => void;
  onPermissionsSave: () => void;
  onPermissionsSelectAgent: (agentId: string | null) => void;
  onPermissionsAddAgent: (agentId: string) => void;
  onPermissionsRemoveAgent: (agentId: string) => void;
  onPermissionsPatch: (path: Array<string | number>, value: unknown) => void;
  onPermissionsRemove: (path: Array<string | number>) => void;
  onPermissionsAddAllowlistEntry: (agentId: string) => void;
  onPermissionsRemoveAllowlistEntry: (agentId: string, index: number) => void;
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

/**
 * 渲染右侧配置内容
 */
function renderContentSection(props: ModelConfigProps, section: string) {
  switch (section) {
    case "providers":
      return renderProvidersContent({
        providers: props.providers,
        expandedProviders: props.expandedProviders,
        onProviderToggle: props.onProviderToggle,
        onProviderAdd: props.onProviderAdd,
        onProviderRemove: props.onProviderRemove,
        onProviderRename: props.onProviderRename,
        onProviderUpdate: props.onProviderUpdate,
        onModelAdd: props.onModelAdd,
        onModelRemove: props.onModelRemove,
        onModelUpdate: props.onModelUpdate,
      });

    case "agent":
      return renderAgentContent({
        // Agent 默认设置
        agentDefaults: props.agentDefaults,
        availableModels: props.availableModels,
        onAgentDefaultsUpdate: props.onAgentDefaultsUpdate,
        // 会话管理
        sessionsLoading: props.agentSessionsLoading,
        sessionsResult: props.agentSessionsResult,
        sessionsError: props.agentSessionsError,
        onSessionsRefresh: props.onAgentSessionsRefresh,
        onSessionModelChange: props.onAgentSessionModelChange,
        onSessionNavigate: props.onAgentSessionNavigate,
      });

    case "gateway":
      return renderGatewayContent({
        gatewayConfig: props.gatewayConfig,
        onGatewayUpdate: props.onGatewayUpdate,
      });

    case "channels":
      return renderChannelsContent({
        channelsConfig: props.channelsConfig,
        selectedChannel: props.selectedChannel,
        onChannelSelect: props.onChannelSelect,
        onChannelConfigUpdate: props.onChannelConfigUpdate,
        onNavigateToChannels: props.onNavigateToChannels,
      });

    case "workspace":
      // 工作区文件管理 / Workspace file management
      return renderWorkspaceContent({
        files: props.workspaceFiles,
        workspaceDir: props.workspaceDir,
        agentId: props.workspaceAgentId,
        selectedFile: props.workspaceSelectedFile,
        editorContent: props.workspaceEditorContent,
        originalContent: props.workspaceOriginalContent,
        loading: props.workspaceLoading,
        saving: props.workspaceSaving,
        error: props.workspaceError,
        editorMode: props.workspaceEditorMode,
        expandedFolders: props.expandedFolders,
        onFileSelect: props.onWorkspaceFileSelect,
        onContentChange: props.onWorkspaceContentChange,
        onFileSave: props.onWorkspaceFileSave,
        onRefresh: props.onWorkspaceRefresh,
        onModeChange: props.onWorkspaceModeChange,
        onFileCreate: props.onWorkspaceFileCreate,
        onFolderToggle: props.onFolderToggle,
      });

    case "permissions":
      return renderPermissionsContent({
        loading: props.permissionsLoading,
        saving: props.permissionsSaving,
        dirty: props.permissionsDirty,
        connected: props.connected,
        activeTab: props.permissionsActiveTab,
        onTabChange: props.onPermissionsTabChange,
        // Exec Approvals 目标选择
        execTarget: props.execTarget,
        execTargetNodeId: props.execTargetNodeId,
        execTargetNodes: props.execTargetNodes,
        onExecTargetChange: props.onExecTargetChange,
        // Exec Approvals 数据
        execApprovalsSnapshot: props.execApprovalsSnapshot,
        execApprovalsForm: props.execApprovalsForm,
        selectedAgent: props.permissionsSelectedAgent,
        agents: props.permissionsAgents,
        onLoad: props.onPermissionsLoad,
        onSave: props.onPermissionsSave,
        onSelectAgent: props.onPermissionsSelectAgent,
        onAddAgent: props.onPermissionsAddAgent,
        onRemoveAgent: props.onPermissionsRemoveAgent,
        onPatch: props.onPermissionsPatch,
        onRemove: props.onPermissionsRemove,
        onAddAllowlistEntry: props.onPermissionsAddAllowlistEntry,
        onRemoveAllowlistEntry: props.onPermissionsRemoveAllowlistEntry,
        // 工具权限
        toolsConfig: props.toolsConfig,
        agentToolsConfigs: props.agentToolsConfigs,
        toolsAgents: props.toolsAgents,
        toolsSelectedAgent: props.toolsSelectedAgent,
        toolsExpanded: props.toolsExpanded,
        onToolsSelectAgent: props.onToolsSelectAgent,
        onToolsToggleExpanded: props.onToolsToggleExpanded,
        onToolsUpdateGlobal: props.onToolsUpdateGlobal,
        onToolsUpdateAgent: props.onToolsUpdateAgent,
        onToolsAddGlobalDeny: props.onToolsAddGlobalDeny,
        onToolsRemoveGlobalDeny: props.onToolsRemoveGlobalDeny,
        onToolsAddAgentDeny: props.onToolsAddAgentDeny,
        onToolsRemoveAgentDeny: props.onToolsRemoveAgentDeny,
        onToolsToggleDeny: props.onToolsToggleDeny,
      });

    default:
      return renderProvidersContent({
        providers: props.providers,
        expandedProviders: props.expandedProviders,
        onProviderToggle: props.onProviderToggle,
        onProviderAdd: props.onProviderAdd,
        onProviderRemove: props.onProviderRemove,
        onProviderRename: props.onProviderRename,
        onProviderUpdate: props.onProviderUpdate,
        onModelAdd: props.onModelAdd,
        onModelRemove: props.onModelRemove,
        onModelUpdate: props.onModelUpdate,
      });
  }
}

/**
 * 主渲染函数 - 带侧边栏布局
 */
export function renderModelConfig(props: ModelConfigProps) {
  const activeSection = props.activeSection ?? "providers";

  return html`
    <div class="mc-layout mc-layout--sidebar">
      <!-- 左侧侧边栏 -->
      ${renderConfigSidebar({
        activeSection,
        onSectionChange: props.onSectionChange ?? (() => {}),
        hasChanges: props.hasChanges,
        connected: props.connected,
      })}

      <!-- 右侧主内容区 -->
      <div class="mc-main">
        <!-- 操作栏 -->
        <div class="mc-actions">
          <div class="mc-actions__left">
            ${props.hasChanges
              ? html`<span class="mc-changes-badge">有未保存的更改</span>`
              : html`<span class="mc-status">配置已同步</span>`}
          </div>
          <div class="mc-actions__right">
            <button
              class="btn btn--sm"
              ?disabled=${props.loading}
              @click=${props.onReload}
            >
              ${props.loading ? LABELS.loading : LABELS.reload}
            </button>
            <button
              class="btn btn--sm"
              ?disabled=${!props.hasChanges || props.saving || props.applying || !props.connected}
              @click=${props.onSave}
            >
              ${props.saving ? LABELS.saving : LABELS.save}
            </button>
            <button
              class="btn btn--sm primary"
              ?disabled=${!props.hasChanges || props.saving || props.applying || !props.connected}
              @click=${props.onApply}
              title="保存配置并重启相关服务"
            >
              ${props.applying ? LABELS.applying : LABELS.apply}
            </button>
          </div>
        </div>

        <!-- 配置内容 -->
        <div class="mc-content">
          ${renderContentSection(props, activeSection)}
        </div>
      </div>
    </div>
  `;
}
