# 供应商名称可编辑设计方案

## 需求

用户希望能够修改供应商的名称（key），例如：
- `"modelscope"` → `"custom-openai"`
- `"new-provider"` → `"deepseek"`

## 当前实现分析

### 数据结构

```typescript
// views/model-config.ts
export type ProviderConfig = {
  baseUrl: string;
  apiKey: string;
  api: "openai-completions" | "anthropic-messages";
  models: ModelConfig[];
};

// 状态中的存储方式
modelConfigProviders: Record<string, ProviderConfig>
// 例如: { "modelscope": { baseUrl: "...", ... } }
```

### 当前 UI

```
┌──────────────────────────────────────────────┐
│  [图标] modelscope              [删除] [展开] │  ← key 是静态文本
│         OpenAI 兼容 · 3 个模型               │
├──────────────────────────────────────────────┤
│  API 地址: [________________]                │
│  API 密钥: [________________]                │
│  协议类型: [OpenAI 兼容 ▼]                   │
│  ...                                         │
└──────────────────────────────────────────────┘
```

### 问题

1. 供应商名称（key）直接作为卡片标题显示，不可编辑
2. 重命名需要删除旧的 key，创建新的 key，保留所有配置

---

## 设计方案

### 方案 A: 直接编辑 Key（推荐）

在卡片头部添加可编辑的名称输入框。

#### UI 设计

```
┌──────────────────────────────────────────────┐
│  [图标] [modelscope____] [重命名] [删除] [展开] │  ← 可编辑输入框
│         OpenAI 兼容 · 3 个模型               │
├──────────────────────────────────────────────┤
```

或者（展开后显示）:

```
┌──────────────────────────────────────────────┐
│  [图标] modelscope              [删除] [展开] │  ← 点击展开
│         OpenAI 兼容 · 3 个模型               │
├──────────────────────────────────────────────┤
│  供应商名称: [modelscope________]            │  ← 新增字段
│  API 地址:   [________________]              │
│  API 密钥:   [________________]              │
│  协议类型:   [OpenAI 兼容 ▼]                 │
└──────────────────────────────────────────────┘
```

#### 实现步骤

**1. 添加重命名函数到 controller**

```typescript
// controllers/model-config.ts

/**
 * 重命名供应商
 */
export function renameProvider(
  state: ModelConfigState,
  oldKey: string,
  newKey: string,
): void {
  // 验证新名称
  if (!newKey.trim()) return;
  if (oldKey === newKey) return;
  if (state.modelConfigProviders[newKey]) {
    // 名称已存在，可以设置错误提示
    state.lastError = `供应商名称 "${newKey}" 已存在`;
    return;
  }

  // 获取旧配置
  const provider = state.modelConfigProviders[oldKey];
  if (!provider) return;

  // 创建新的 providers 对象，保持顺序
  const newProviders: Record<string, ProviderConfig> = {};
  for (const [key, value] of Object.entries(state.modelConfigProviders)) {
    if (key === oldKey) {
      newProviders[newKey] = value;
    } else {
      newProviders[key] = value;
    }
  }

  state.modelConfigProviders = newProviders;

  // 更新展开状态
  const expanded = new Set(state.modelConfigExpandedProviders);
  if (expanded.has(oldKey)) {
    expanded.delete(oldKey);
    expanded.add(newKey);
  }
  state.modelConfigExpandedProviders = expanded;
}
```

**2. 更新 ProvidersContentProps**

```typescript
// components/providers-content.ts

export type ProvidersContentProps = {
  providers: Record<string, ProviderConfig>;
  expandedProviders: Set<string>;
  onProviderToggle: (key: string) => void;
  onProviderAdd: () => void;
  onProviderRemove: (key: string) => void;
  onProviderRename: (oldKey: string, newKey: string) => void;  // 新增
  onProviderUpdate: (key: string, field: string, value: unknown) => void;
  // ...
};
```

**3. 更新卡片渲染**

```typescript
// components/providers-content.ts

function renderProviderCard(
  key: string,
  provider: ProviderConfig,
  expanded: boolean,
  props: ProvidersContentProps,
) {
  return html`
    <div class="mc-provider-card ${expanded ? "mc-provider-card--expanded" : ""}">
      <div class="mc-provider-card__header" @click=${() => props.onProviderToggle(key)}>
        <!-- ... -->
      </div>

      ${expanded
        ? html`
            <div class="mc-provider-card__content">
              <div class="mc-form-section">
                <!-- 新增：供应商名称字段 -->
                <div class="mc-form-row">
                  <label class="mc-field">
                    <span class="mc-field__label">供应商名称</span>
                    <input
                      type="text"
                      class="mc-input"
                      .value=${key}
                      @blur=${(e: Event) => {
                        const newKey = (e.target as HTMLInputElement).value.trim();
                        if (newKey && newKey !== key) {
                          props.onProviderRename(key, newKey);
                        }
                      }}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.key === "Enter") {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                    />
                  </label>
                </div>
                <!-- 原有字段 -->
                <div class="mc-form-row">
                  <label class="mc-field">
                    <span class="mc-field__label">${LABELS.providerBaseUrl}</span>
                    <!-- ... -->
                  </label>
                </div>
                <!-- ... -->
              </div>
            </div>
          `
        : nothing}
    </div>
  `;
}
```

**4. 更新 app-render.ts 绑定**

```typescript
// app-render.ts

onProviderRename: (oldKey, newKey) => renameProvider(state, oldKey, newKey),
```

**5. 更新 views/model-config.ts Props**

```typescript
export type ModelConfigProps = {
  // ...
  onProviderRename: (oldKey: string, newKey: string) => void;  // 新增
  // ...
};
```

---

### 方案 B: 弹窗编辑

点击名称或编辑按钮弹出对话框进行重命名。

```
┌────────────────────────────┐
│  重命名供应商              │
│                            │
│  新名称: [modelscope___]   │
│                            │
│  [取消]         [确认]     │
└────────────────────────────┘
```

**优点**: 更明确的操作意图
**缺点**: 需要额外的 Modal 组件

---

### 方案 C: 双击编辑

双击名称进入编辑模式。

**优点**: 简洁，类似文件重命名
**缺点**: 不够直观，用户可能不知道可以双击

---

## 推荐方案

**推荐方案 A**：在展开的卡片内添加"供应商名称"字段。

理由：
1. 与现有 UI 风格一致（表单字段）
2. 实现简单，改动较小
3. 用户操作直观，像编辑其他字段一样

---

## 实现清单

### 需要修改的文件

| 文件 | 修改内容 |
|------|----------|
| `controllers/model-config.ts` | 添加 `renameProvider` 函数 |
| `components/providers-content.ts` | 添加名称输入框，更新 Props |
| `views/model-config.ts` | 更新 `ModelConfigProps` 类型 |
| `app-render.ts` | 添加 `onProviderRename` 回调绑定 |

### 代码变更量估计

- `controllers/model-config.ts`: +25 行
- `components/providers-content.ts`: +20 行
- `views/model-config.ts`: +2 行
- `app-render.ts`: +1 行

**总计**: 约 50 行

---

## 验证要点

1. 重命名后配置正确保存
2. 重命名后展开状态保持
3. 重命名不影响模型列表
4. 名称冲突时显示错误提示
5. 空名称不允许保存

---

## 扩展考虑

### Agent 模型引用更新

如果 `agentDefaults.model.primary` 引用了供应商（如 `"modelscope/qwen-max"`），重命名后需要同步更新：

```typescript
// 可选：自动更新引用
if (state.modelConfigAgentDefaults.model?.primary?.startsWith(`${oldKey}/`)) {
  const modelId = state.modelConfigAgentDefaults.model.primary.replace(`${oldKey}/`, `${newKey}/`);
  state.modelConfigAgentDefaults = {
    ...state.modelConfigAgentDefaults,
    model: {
      ...state.modelConfigAgentDefaults.model,
      primary: modelId,
    },
  };
}
```

### 会话模型覆盖更新

同理，会话中的模型覆盖也可能需要更新。

---

**最后更新**: 2026-01-29
