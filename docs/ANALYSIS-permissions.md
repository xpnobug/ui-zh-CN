# 权限管理功能分析

对比 UI 实现 (`changeoradd/components/permissions-content.ts`) 与后端实现 (`src/infra/exec-approvals.ts`)，分析功能是否符合逻辑。

## 1. 数据结构对比

### 后端 (`src/infra/exec-approvals.ts`)

```typescript
ExecApprovalsFile = {
  version: 1;
  socket?: { path?: string; token?: string };
  defaults?: ExecApprovalsDefaults;
  agents?: Record<string, ExecApprovalsAgent>;
};

ExecApprovalsDefaults = {
  security?: ExecSecurity;     // "deny" | "allowlist" | "full"
  ask?: ExecAsk;               // "off" | "on-miss" | "always"
  askFallback?: ExecSecurity;
  autoAllowSkills?: boolean;
};

ExecApprovalsAgent = ExecApprovalsDefaults & {
  allowlist?: ExecAllowlistEntry[];
};

ExecAllowlistEntry = {
  id?: string;
  pattern: string;
  lastUsedAt?: number;
  lastUsedCommand?: string;
  lastResolvedPath?: string;
};
```

### UI (`permissions-content.ts`)

```typescript
ExecApprovalsFile = {
  version?: number;
  socket?: { path?: string };      // 不含 token（安全考虑）
  defaults?: ExecApprovalsDefaults;
  agents?: Record<string, ExecApprovalsAgent>;
};

ExecApprovalsDefaults = {
  security?: string;               // 类型稍宽松
  ask?: string;
  askFallback?: string;
  autoAllowSkills?: boolean;
};
```

**结论**: ✅ 结构基本一致，UI 正确排除了敏感的 `socket.token`

---

## 2. 功能逻辑分析

### 2.1 安全模式 (Security Mode)

| 值 | 后端行为 | UI 描述 |
|----|----------|---------|
| `deny` | 拒绝所有命令执行 | "拒绝 - 拒绝所有命令执行" ✅ |
| `allowlist` | 仅允许白名单中的命令 | "允许列表 - 仅允许白名单中的命令" ✅ |
| `full` | 允许所有命令执行 | "完全允许 - 允许所有命令执行" ✅ |

**默认值**: 后端 `DEFAULT_SECURITY = "deny"`, UI 默认也是 `"deny"` ✅

### 2.2 用户确认 (Ask Mode)

| 值 | 后端行为 | UI 描述 |
|----|----------|---------|
| `off` | 不提示用户确认 | "关闭 - 不提示用户确认" ✅ |
| `on-miss` | 命令不在白名单时提示 | "未匹配时 - 命令不在白名单时提示" ✅ |
| `always` | 每次执行都提示确认 | "总是 - 每次执行都提示确认" ✅ |

**默认值**: 后端 `DEFAULT_ASK = "on-miss"`, UI 默认也是 `"on-miss"` ✅

### 2.3 确认失败回退 (Ask Fallback)

当 UI 确认不可用时的处理方式。

**后端逻辑** (`requiresExecApproval`):
```typescript
// 当需要确认但无法获得确认时，使用 askFallback 作为安全策略
// askFallback 决定是 deny 还是 allowlist/full
```

**UI 实现**: 提供 `deny`/`allowlist`/`full` 三个选项 ✅

### 2.4 自动允许技能 CLI (Auto Allow Skills)

**后端逻辑** (`evaluateSegments`):
```typescript
const allowSkills = params.autoAllowSkills === true && (params.skillBins?.size ?? 0) > 0;
// 如果启用且有注册的技能可执行文件，自动允许
const skillAllow = allowSkills && segment.resolution?.executableName
  ? params.skillBins?.has(segment.resolution.executableName)
  : false;
return Boolean(match || safe || skillAllow);
```

**UI 实现**: 提供开关控制 ✅

---

## 3. 作用域设计分析

### 3.1 全局默认 vs Agent 特定

**后端解析逻辑** (`resolveExecApprovalsFromFile`):
```typescript
const defaults = file.defaults ?? {};
const agentKey = params.agentId ?? DEFAULT_AGENT_ID;
const agent = file.agents?.[agentKey] ?? {};
const wildcard = file.agents?.["*"] ?? {};

// 解析顺序: agent > wildcard > defaults
const resolvedAgent: Required<ExecApprovalsDefaults> = {
  security: normalizeSecurity(
    agent.security ?? wildcard.security ?? resolvedDefaults.security,
    resolvedDefaults.security,
  ),
  // ...
};
```

**UI 实现**:
- "全局默认" → 编辑 `defaults` 字段
- "Agent 选项卡" → 编辑 `agents[agentId]` 字段

**问题**: ⚠️ UI 没有支持通配符 `*` Agent 的配置

### 3.2 允许列表作用域

**后端设计**:
- `defaults` 只有 `security`, `ask`, `askFallback`, `autoAllowSkills`
- `agents[agentId]` 才有 `allowlist`

**UI 实现**:
```typescript
// 允许列表（仅非默认 Agent 显示）
${!isDefaults ? renderAllowlistSection(props, form, selectedScope) : nothing}
```

**结论**: ✅ 正确！UI 只为特定 Agent 显示 allowlist，符合后端设计

---

## 4. 发现的问题

### 4.1 ⚠️ Agent 列表来源不明确

**当前实现**:
```typescript
// permissions-content.ts
${props.agents.map((agent) => { ... })}
```

**问题**: `props.agents` 的来源是什么？如果 `exec-approvals.json` 中没有预先配置的 agents，UI 将无法显示任何 Agent 选项卡。

**后端 Gateway 返回的数据**:
```typescript
// exec-approvals.ts
respond(true, {
  path: snapshot.path,
  exists: snapshot.exists,
  hash: snapshot.hash,
  file: redactExecApprovals(snapshot.file),
}, undefined);
```

Gateway 只返回文件内容，不包含"可用 Agent 列表"。

**建议**: 从 `agents.list` 或会话列表获取 Agent 列表，而不是仅依赖 exec-approvals 文件中已有的 agents。

### 4.2 ⚠️ 无法添加新 Agent

**当前 UI**: 只能在已存在的 Agent 之间切换，无法添加新的 Agent 配置。

**解决方案**: 添加"添加 Agent"按钮，或自动从活跃会话中获取 Agent 列表。

### 4.3 ⚠️ 通配符 Agent (*) 支持

**后端支持**:
```typescript
const wildcard = file.agents?.["*"] ?? {};
```

**UI 状态**: 未支持 `*` 通配符 Agent 的配置

### 4.4 🐛 类型不严格

**UI 类型**:
```typescript
export type ExecApprovalsDefaults = {
  security?: string;  // 应该是 ExecSecurity
  ask?: string;       // 应该是 ExecAsk
  askFallback?: string;
};
```

**建议**: 使用更严格的联合类型

---

## 5. API 调用流程

### 5.1 加载权限 (`loadPermissions`)

```typescript
const res = await state.client.request("exec.approvals.get", {});
// 返回: { path, exists, hash, file }
state.execApprovalsSnapshot = res;
state.execApprovalsForm = res?.file;
```

✅ 正确调用 `exec.approvals.get`

### 5.2 保存权限 (`savePermissions`)

```typescript
const baseHash = state.execApprovalsSnapshot?.hash;
const file = state.execApprovalsForm ?? state.execApprovalsSnapshot?.file ?? {};
await state.client.request("exec.approvals.set", { file, baseHash });
```

✅ 正确使用乐观并发控制（baseHash）

---

## 6. 工具权限分析

### 6.1 数据结构

**UI 类型**:
```typescript
ToolPolicyConfig = {
  profile?: ToolProfileId;  // "minimal" | "coding" | "messaging" | "full"
  allow?: string[];
  alsoAllow?: string[];
  deny?: string[];
};
```

### 6.2 工具分组

UI 定义了 9 个工具组：
- `group:fs` - 文件系统 (read, write, edit, apply_patch)
- `group:runtime` - 运行时 (exec, process)
- `group:web` - 网络 (web_search, web_fetch)
- `group:ui` - 界面 (browser, canvas)
- `group:sessions` - 会话管理 (5 个工具)
- `group:memory` - 记忆 (memory_search, memory_get)
- `group:automation` - 自动化 (cron, gateway)
- `group:messaging` - 消息 (message)
- `group:nodes` - 设备 (nodes)

**独立工具**: tts, image, agents_list

### 6.3 禁用逻辑

```typescript
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
```

✅ 逻辑正确：支持单个工具禁用和按组禁用

---

## 7. 总结

### 符合逻辑的部分 ✅

1. **数据结构** - UI 类型与后端 ExecApprovalsFile 结构一致
2. **安全模式选项** - deny/allowlist/full 三种模式正确
3. **确认模式选项** - off/on-miss/always 三种模式正确
4. **作用域设计** - 全局默认 vs Agent 特定区分正确
5. **允许列表位置** - 正确地只为 Agent 显示，不在全局默认显示
6. **API 调用** - 正确使用 get/set 接口和 baseHash 并发控制
7. **工具权限** - 分组和禁用逻辑正确

### 需要改进的部分 ⚠️

| 问题 | 严重程度 | 建议 |
|------|----------|------|
| Agent 列表来源 | 中 | 从 agents.list 获取活跃 Agent |
| 无法添加新 Agent | 中 | 添加"新建 Agent 配置"功能 |
| 通配符 (*) Agent | 低 | 添加通配符 Agent 支持 |
| 类型不严格 | 低 | 使用联合类型替代 string |

### 兼容性风险 🔴

**无重大风险** - UI 的数据结构与后端完全兼容，保存的配置可以被后端正确解析和使用。

---

## 8. 建议的改进

### 8.1 从 Gateway 获取 Agent 列表

```typescript
// 在 loadPermissions 中同时获取 agents
const [approvalsRes, agentsRes] = await Promise.all([
  state.client.request("exec.approvals.get", {}),
  state.client.request("agents.list", {}),
]);

// 合并已配置的 agents 和活跃 agents
const configuredAgents = Object.keys(approvalsRes?.file?.agents ?? {});
const activeAgents = agentsRes?.agents ?? [];
const allAgents = [...new Set([...configuredAgents, ...activeAgents.map(a => a.id)])];
```

### 8.2 添加新 Agent 配置功能

```typescript
// 在 renderAgentSelector 中添加
<button class="permissions-tab" @click=${() => props.onAddAgent()}>
  + 添加 Agent
</button>
```

### 8.3 支持通配符 Agent

```typescript
const SPECIAL_AGENTS = [
  { id: "*", name: "通配符 (*)", description: "匹配所有 Agent" },
];
```

---

**分析日期**: 2026-01-29
**分析版本**: changeoradd 模块当前实现
