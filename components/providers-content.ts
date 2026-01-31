/**
 * 模型供应商配置内容组件
 * 右侧面板 - 供应商管理
 */
import { html, nothing } from "lit";
import type { ProviderConfig, ModelConfig, ModelApi, AuthMode } from "../views/model-config";

// SVG 图标
const icons = {
  provider: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  add: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  trash: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  chevron: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  settings: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  info: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
};

// API 协议配置
const API_PROTOCOLS: Array<{ value: ModelApi; label: string; hint: string }> = [
  { value: "openai-completions", label: "OpenAI Completions", hint: "OpenAI 兼容 API（大多数供应商）" },
  { value: "openai-responses", label: "OpenAI Responses", hint: "OpenAI 新版 Responses API" },
  { value: "anthropic-messages", label: "Anthropic Messages", hint: "Anthropic Claude API" },
  { value: "google-generative-ai", label: "Google Generative AI", hint: "Google Gemini API" },
  { value: "github-copilot", label: "GitHub Copilot", hint: "GitHub Copilot 模型" },
  { value: "bedrock-converse-stream", label: "AWS Bedrock", hint: "AWS Bedrock Converse API" },
];

// 认证模式配置
const AUTH_MODES: Array<{ value: AuthMode; label: string; hint: string }> = [
  { value: "api-key", label: "API Key", hint: "标准 API 密钥认证" },
  { value: "aws-sdk", label: "AWS SDK", hint: "使用 AWS 凭证（IAM / 环境变量）" },
  { value: "oauth", label: "OAuth", hint: "OAuth 令牌认证" },
  { value: "token", label: "Bearer Token", hint: "Bearer Token 认证" },
];

// 中文标签
const LABELS = {
  providersTitle: "模型供应商",
  providersDesc: "配置 LLM 模型供应商，支持 OpenAI、Anthropic、Google、AWS Bedrock 等",
  addProvider: "添加供应商",
  providerName: "供应商名称",
  providerBaseUrl: "API 地址",
  providerApiKey: "API 密钥",
  providerProtocol: "API 协议",
  providerAuth: "认证方式",
  providerHeaders: "自定义 Headers",
  headersHint: "可选：添加额外的请求头",
  addHeader: "添加 Header",
  headerKey: "Header 名称",
  headerValue: "Header 值",
  noProviders: "尚未配置任何模型供应商",
  modelId: "模型 ID",
  modelName: "显示名称",
  modelReasoning: "推理模型",
  modelContext: "上下文",
  modelMaxTokens: "最大输出",
  modelInput: "输入类型",
  inputText: "文本",
  inputImage: "图片",
  addModel: "添加模型",
  modelCount: "个模型",
  advancedConfig: "高级配置",
  showAdvanced: "显示高级选项",
  hideAdvanced: "隐藏高级选项",
  modelCost: "成本配置",
  costInput: "输入",
  costOutput: "输出",
  costCacheRead: "缓存读",
  costCacheWrite: "缓存写",
  costUnit: "$/M tokens",
  modelCompat: "兼容性配置",
  compatStore: "Store",
  compatDeveloper: "Developer Role",
  compatReasoning: "Reasoning Effort",
  compatMaxTokens: "max_tokens 字段",
  maxTokensField: "max_tokens",
  maxCompletionTokensField: "max_completion_tokens",
};

export type ProvidersContentProps = {
  providers: Record<string, ProviderConfig>;
  expandedProviders: Set<string>;
  onProviderToggle: (key: string) => void;
  onProviderAdd: () => void;
  onProviderRemove: (key: string) => void;
  onProviderRename: (oldKey: string, newKey: string) => void;
  onProviderUpdate: (key: string, field: string, value: unknown) => void;
  onModelAdd: (providerKey: string) => void;
  onModelRemove: (providerKey: string, modelIndex: number) => void;
  onModelUpdate: (providerKey: string, modelIndex: number, field: string, value: unknown) => void;
};

/**
 * 渲染模型行
 */
function renderModelRow(
  providerKey: string,
  index: number,
  model: ModelConfig,
  props: ProvidersContentProps,
) {
  const hasText = model.input?.includes("text") ?? true;
  const hasImage = model.input?.includes("image") ?? false;

  const handleInputChange = (type: "text" | "image", checked: boolean) => {
    const currentInput = model.input ?? ["text"];
    let newInput: Array<"text" | "image">;
    if (checked) {
      newInput = [...new Set([...currentInput, type])];
    } else {
      newInput = currentInput.filter((t) => t !== type);
      if (newInput.length === 0) newInput = ["text"]; // 至少保留文本
    }
    props.onModelUpdate(providerKey, index, "input", newInput);
  };

  return html`
    <div class="mc-model-row">
      <div class="mc-model-row__main">
        <div class="mc-model-row__field mc-model-row__field--id">
          <label class="mc-field mc-field--sm">
            <span class="mc-field__label">${LABELS.modelId}</span>
            <input
              type="text"
              class="mc-input mc-input--sm"
              .value=${model.id}
              @input=${(e: Event) =>
                props.onModelUpdate(providerKey, index, "id", (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        <div class="mc-model-row__field mc-model-row__field--name">
          <label class="mc-field mc-field--sm">
            <span class="mc-field__label">${LABELS.modelName}</span>
            <input
              type="text"
              class="mc-input mc-input--sm"
              .value=${model.name}
              @input=${(e: Event) =>
                props.onModelUpdate(providerKey, index, "name", (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        <div class="mc-model-row__field mc-model-row__field--context">
          <label class="mc-field mc-field--sm">
            <span class="mc-field__label">${LABELS.modelContext}</span>
            <input
              type="number"
              class="mc-input mc-input--sm"
              .value=${String(model.contextWindow)}
              @input=${(e: Event) =>
                props.onModelUpdate(
                  providerKey,
                  index,
                  "contextWindow",
                  Number((e.target as HTMLInputElement).value),
                )}
            />
          </label>
        </div>
        <div class="mc-model-row__field mc-model-row__field--tokens">
          <label class="mc-field mc-field--sm">
            <span class="mc-field__label">${LABELS.modelMaxTokens}</span>
            <input
              type="number"
              class="mc-input mc-input--sm"
              .value=${String(model.maxTokens)}
              @input=${(e: Event) =>
                props.onModelUpdate(
                  providerKey,
                  index,
                  "maxTokens",
                  Number((e.target as HTMLInputElement).value),
                )}
            />
          </label>
        </div>
        <div class="mc-model-row__field mc-model-row__field--input">
          <div class="mc-field mc-field--sm">
            <span class="mc-field__label">${LABELS.modelInput}</span>
            <div class="mc-checkbox-group">
              <label class="mc-checkbox">
                <input
                  type="checkbox"
                  .checked=${hasText}
                  @change=${(e: Event) => handleInputChange("text", (e.target as HTMLInputElement).checked)}
                />
                <span>${LABELS.inputText}</span>
              </label>
              <label class="mc-checkbox">
                <input
                  type="checkbox"
                  .checked=${hasImage}
                  @change=${(e: Event) => handleInputChange("image", (e.target as HTMLInputElement).checked)}
                />
                <span>${LABELS.inputImage}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="mc-model-row__field mc-model-row__field--reasoning">
          <label class="mc-toggle-field">
            <span class="mc-toggle-field__label">${LABELS.modelReasoning}</span>
            <div class="mc-toggle">
              <input
                type="checkbox"
                .checked=${model.reasoning}
                @change=${(e: Event) =>
                  props.onModelUpdate(
                    providerKey,
                    index,
                    "reasoning",
                    (e.target as HTMLInputElement).checked,
                  )}
              />
              <span class="mc-toggle__track"></span>
            </div>
          </label>
        </div>
      </div>
      <button
        class="mc-icon-btn mc-icon-btn--danger mc-model-row__remove"
        title="删除模型"
        @click=${() => props.onModelRemove(providerKey, index)}
      >
        ${icons.trash}
      </button>
    </div>
    ${renderModelAdvanced(providerKey, index, model, props)}
  `;
}

/**
 * 渲染模型高级配置（成本和兼容性）
 */
function renderModelAdvanced(
  providerKey: string,
  index: number,
  model: ModelConfig,
  props: ProvidersContentProps,
) {
  const cost = model.cost ?? { input: 0, output: 0 };
  const compat = model.compat ?? {};

  return html`
    <div class="mc-model-advanced">
      <details class="mc-model-advanced__details">
        <summary class="mc-model-advanced__summary">
          ${icons.settings}
          <span>${LABELS.advancedConfig}</span>
        </summary>
        <div class="mc-model-advanced__content">
          <!-- 成本配置 -->
          <div class="mc-model-advanced__section">
            <div class="mc-model-advanced__section-title">${LABELS.modelCost}</div>
            <div class="mc-model-advanced__grid">
              <label class="mc-field mc-field--sm">
                <span class="mc-field__label">${LABELS.costInput}</span>
                <div class="mc-input-with-unit">
                  <input
                    type="number"
                    class="mc-input mc-input--sm"
                    step="0.01"
                    .value=${String(cost.input ?? 0)}
                    @input=${(e: Event) =>
                      props.onModelUpdate(providerKey, index, "cost", {
                        ...cost,
                        input: Number((e.target as HTMLInputElement).value),
                      })}
                  />
                  <span class="mc-input-unit">${LABELS.costUnit}</span>
                </div>
              </label>
              <label class="mc-field mc-field--sm">
                <span class="mc-field__label">${LABELS.costOutput}</span>
                <div class="mc-input-with-unit">
                  <input
                    type="number"
                    class="mc-input mc-input--sm"
                    step="0.01"
                    .value=${String(cost.output ?? 0)}
                    @input=${(e: Event) =>
                      props.onModelUpdate(providerKey, index, "cost", {
                        ...cost,
                        output: Number((e.target as HTMLInputElement).value),
                      })}
                  />
                  <span class="mc-input-unit">${LABELS.costUnit}</span>
                </div>
              </label>
              <label class="mc-field mc-field--sm">
                <span class="mc-field__label">${LABELS.costCacheRead}</span>
                <div class="mc-input-with-unit">
                  <input
                    type="number"
                    class="mc-input mc-input--sm"
                    step="0.01"
                    .value=${String(cost.cacheRead ?? 0)}
                    @input=${(e: Event) =>
                      props.onModelUpdate(providerKey, index, "cost", {
                        ...cost,
                        cacheRead: Number((e.target as HTMLInputElement).value),
                      })}
                  />
                  <span class="mc-input-unit">${LABELS.costUnit}</span>
                </div>
              </label>
              <label class="mc-field mc-field--sm">
                <span class="mc-field__label">${LABELS.costCacheWrite}</span>
                <div class="mc-input-with-unit">
                  <input
                    type="number"
                    class="mc-input mc-input--sm"
                    step="0.01"
                    .value=${String(cost.cacheWrite ?? 0)}
                    @input=${(e: Event) =>
                      props.onModelUpdate(providerKey, index, "cost", {
                        ...cost,
                        cacheWrite: Number((e.target as HTMLInputElement).value),
                      })}
                  />
                  <span class="mc-input-unit">${LABELS.costUnit}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 兼容性配置 -->
          <div class="mc-model-advanced__section">
            <div class="mc-model-advanced__section-title">${LABELS.modelCompat}</div>
            <div class="mc-model-advanced__compat">
              <label class="mc-checkbox">
                <input
                  type="checkbox"
                  .checked=${compat.supportsStore ?? false}
                  @change=${(e: Event) =>
                    props.onModelUpdate(providerKey, index, "compat", {
                      ...compat,
                      supportsStore: (e.target as HTMLInputElement).checked,
                    })}
                />
                <span>${LABELS.compatStore}</span>
              </label>
              <label class="mc-checkbox">
                <input
                  type="checkbox"
                  .checked=${compat.supportsDeveloperRole ?? false}
                  @change=${(e: Event) =>
                    props.onModelUpdate(providerKey, index, "compat", {
                      ...compat,
                      supportsDeveloperRole: (e.target as HTMLInputElement).checked,
                    })}
                />
                <span>${LABELS.compatDeveloper}</span>
              </label>
              <label class="mc-checkbox">
                <input
                  type="checkbox"
                  .checked=${compat.supportsReasoningEffort ?? false}
                  @change=${(e: Event) =>
                    props.onModelUpdate(providerKey, index, "compat", {
                      ...compat,
                      supportsReasoningEffort: (e.target as HTMLInputElement).checked,
                    })}
                />
                <span>${LABELS.compatReasoning}</span>
              </label>
              <div class="mc-compat-select">
                <span class="mc-compat-select__label">${LABELS.compatMaxTokens}:</span>
                <select
                  class="mc-select mc-select--sm"
                  .value=${compat.maxTokensField ?? "max_tokens"}
                  @change=${(e: Event) =>
                    props.onModelUpdate(providerKey, index, "compat", {
                      ...compat,
                      maxTokensField: (e.target as HTMLSelectElement).value as "max_tokens" | "max_completion_tokens",
                    })}
                >
                  <option value="max_tokens">${LABELS.maxTokensField}</option>
                  <option value="max_completion_tokens">${LABELS.maxCompletionTokensField}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  `;
}

/**
 * 渲染 Headers 编辑器
 */
function renderHeadersEditor(
  providerKey: string,
  headers: Record<string, string> | undefined,
  props: ProvidersContentProps,
) {
  const entries = Object.entries(headers ?? {});

  const handleAddHeader = () => {
    const newHeaders = { ...(headers ?? {}), "": "" };
    props.onProviderUpdate(providerKey, "headers", newHeaders);
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...(headers ?? {}) };
    delete newHeaders[key];
    props.onProviderUpdate(providerKey, "headers", Object.keys(newHeaders).length > 0 ? newHeaders : undefined);
  };

  const handleHeaderChange = (oldKey: string, newKey: string, value: string) => {
    const newHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers ?? {})) {
      if (k === oldKey) {
        if (newKey) newHeaders[newKey] = value;
      } else {
        newHeaders[k] = v;
      }
    }
    props.onProviderUpdate(providerKey, "headers", Object.keys(newHeaders).length > 0 ? newHeaders : undefined);
  };

  return html`
    <div class="mc-headers-section">
      <div class="mc-headers-section__header">
        <span class="mc-headers-section__title">${LABELS.providerHeaders}</span>
        <button class="mc-btn mc-btn--sm" @click=${handleAddHeader}>
          ${icons.add} ${LABELS.addHeader}
        </button>
      </div>
      ${entries.length === 0
        ? html`<div class="mc-headers-section__hint">${LABELS.headersHint}</div>`
        : html`
            <div class="mc-headers-list">
              ${entries.map(
                ([key, value]) => html`
                  <div class="mc-header-row">
                    <input
                      type="text"
                      class="mc-input mc-input--sm"
                      placeholder=${LABELS.headerKey}
                      .value=${key}
                      @input=${(e: Event) =>
                        handleHeaderChange(key, (e.target as HTMLInputElement).value, value)}
                    />
                    <input
                      type="text"
                      class="mc-input mc-input--sm"
                      placeholder=${LABELS.headerValue}
                      .value=${value}
                      @input=${(e: Event) =>
                        handleHeaderChange(key, key, (e.target as HTMLInputElement).value)}
                    />
                    <button
                      class="mc-icon-btn mc-icon-btn--danger mc-icon-btn--sm"
                      @click=${() => handleRemoveHeader(key)}
                    >
                      ${icons.trash}
                    </button>
                  </div>
                `,
              )}
            </div>
          `}
    </div>
  `;
}

/**
 * 获取协议标签
 */
function getProtocolLabel(api: ModelApi): string {
  const protocol = API_PROTOCOLS.find((p) => p.value === api);
  return protocol?.label ?? api;
}

/**
 * 渲染供应商卡片
 */
function renderProviderCard(
  key: string,
  provider: ProviderConfig,
  expanded: boolean,
  props: ProvidersContentProps,
) {
  const protocolLabel = getProtocolLabel(provider.api);
  const authMode = provider.auth ?? "api-key";
  const showApiKey = authMode === "api-key" || authMode === "token";

  return html`
    <div class="mc-provider-card ${expanded ? "mc-provider-card--expanded" : ""}">
      <div
        class="mc-provider-card__header"
        @click=${() => props.onProviderToggle(key)}
      >
        <div class="mc-provider-card__info">
          <div class="mc-provider-card__icon">${icons.provider}</div>
          <div class="mc-provider-card__details">
            <div class="mc-provider-card__name">${key}</div>
            <div class="mc-provider-card__meta">
              <span class="mc-provider-card__protocol">${protocolLabel}</span>
              <span class="mc-provider-card__count">${provider.models.length} ${LABELS.modelCount}</span>
            </div>
          </div>
        </div>
        <div class="mc-provider-card__actions">
          <button
            class="mc-icon-btn mc-icon-btn--danger"
            title="删除供应商"
            @click=${(e: Event) => {
              e.stopPropagation();
              props.onProviderRemove(key);
            }}
          >
            ${icons.trash}
          </button>
          <span class="mc-provider-card__chevron ${expanded ? "mc-provider-card__chevron--open" : ""}">
            ${icons.chevron}
          </span>
        </div>
      </div>

      ${expanded
        ? html`
            <div class="mc-provider-card__content">
              <div class="mc-form-section">
                <div class="mc-form-row">
                  <label class="mc-field">
                    <span class="mc-field__label">${LABELS.providerName}</span>
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
                <div class="mc-form-row">
                  <label class="mc-field">
                    <span class="mc-field__label">${LABELS.providerBaseUrl}</span>
                    <input
                      type="text"
                      class="mc-input"
                      .value=${provider.baseUrl}
                      placeholder="https://api.example.com/v1"
                      @input=${(e: Event) =>
                        props.onProviderUpdate(key, "baseUrl", (e.target as HTMLInputElement).value)}
                    />
                  </label>
                </div>
                <div class="mc-form-row mc-form-row--2col">
                  <label class="mc-field">
                    <span class="mc-field__label">${LABELS.providerProtocol}</span>
                    <select
                      class="mc-select"
                      .value=${provider.api}
                      @change=${(e: Event) =>
                        props.onProviderUpdate(key, "api", (e.target as HTMLSelectElement).value)}
                    >
                      ${API_PROTOCOLS.map(
                        (p) => html`<option value=${p.value} title=${p.hint}>${p.label}</option>`,
                      )}
                    </select>
                  </label>
                  <label class="mc-field">
                    <span class="mc-field__label">${LABELS.providerAuth}</span>
                    <select
                      class="mc-select"
                      .value=${authMode}
                      @change=${(e: Event) =>
                        props.onProviderUpdate(key, "auth", (e.target as HTMLSelectElement).value)}
                    >
                      ${AUTH_MODES.map(
                        (a) => html`<option value=${a.value} title=${a.hint}>${a.label}</option>`,
                      )}
                    </select>
                  </label>
                </div>
                ${showApiKey
                  ? html`
                      <div class="mc-form-row">
                        <label class="mc-field">
                          <span class="mc-field__label">${LABELS.providerApiKey}</span>
                          <input
                            type="password"
                            class="mc-input"
                            .value=${provider.apiKey ?? ""}
                            placeholder="sk-... 或 ${`\${ENV_VAR}`}"
                            @input=${(e: Event) =>
                              props.onProviderUpdate(key, "apiKey", (e.target as HTMLInputElement).value)}
                          />
                        </label>
                      </div>
                    `
                  : nothing}
                ${renderHeadersEditor(key, provider.headers, props)}
              </div>

              <div class="mc-models-section">
                <div class="mc-models-header">
                  <span class="mc-models-title">模型列表</span>
                  <button
                    class="mc-btn mc-btn--sm"
                    @click=${() => props.onModelAdd(key)}
                  >
                    ${icons.add}
                    <span>${LABELS.addModel}</span>
                  </button>
                </div>
                <div class="mc-models-list">
                  ${provider.models.map((model, idx) =>
                    renderModelRow(key, idx, model, props),
                  )}
                </div>
              </div>
            </div>
          `
        : nothing}
    </div>
  `;
}

/**
 * 渲染供应商配置内容
 */
export function renderProvidersContent(props: ProvidersContentProps) {
  const providerKeys = Object.keys(props.providers);

  return html`
    <div class="config-content">
      <div class="config-content__header">
        <div class="config-content__icon">${icons.provider}</div>
        <div class="config-content__titles">
          <h2 class="config-content__title">${LABELS.providersTitle}</h2>
          <p class="config-content__desc">${LABELS.providersDesc}</p>
        </div>
        <button class="mc-btn mc-btn--primary" @click=${props.onProviderAdd}>
          ${icons.add}
          <span>${LABELS.addProvider}</span>
        </button>
      </div>

      <!-- 字段说明提示卡 -->
      <details class="cron-tip-card cron-tip-card--collapsible">
        <summary class="cron-tip-card__title">
          ${icons.info}
          <span>配置说明</span>
          ${icons.chevron}
        </summary>
        <div class="cron-tip-card__content">
          <div class="cron-tip-card__section">
            <div class="cron-tip-card__section-title">供应商配置</div>
            <table class="cron-tip-card__table">
              <tr>
                <td class="cron-tip-card__term">API 地址</td>
                <td class="cron-tip-card__def">供应商的 API 端点 URL，如 <b>https://api.openai.com/v1</b></td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">API 协议</td>
                <td class="cron-tip-card__def">选择 API 格式：<b>OpenAI</b>（大多数兼容）、<b>Anthropic</b>、<b>Google</b>、<b>Bedrock</b> 等</td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">认证方式</td>
                <td class="cron-tip-card__def"><b>API Key</b>（标准密钥）、<b>AWS SDK</b>（IAM 凭证）、<b>OAuth</b>、<b>Token</b></td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">API 密钥</td>
                <td class="cron-tip-card__def">填入密钥或使用 <b>\${ENV_VAR}</b> 引用环境变量</td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">自定义 Headers</td>
                <td class="cron-tip-card__def">可选，添加额外请求头（如 <b>x-api-version</b>）</td>
              </tr>
            </table>
          </div>
          <div class="cron-tip-card__section">
            <div class="cron-tip-card__section-title">模型配置</div>
            <table class="cron-tip-card__table">
              <tr>
                <td class="cron-tip-card__term">模型 ID</td>
                <td class="cron-tip-card__def">发送给 API 的模型标识符，如 <b>gpt-4o</b>、<b>claude-3-opus</b></td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">显示名称</td>
                <td class="cron-tip-card__def">在 UI 中展示的友好名称</td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">上下文窗口</td>
                <td class="cron-tip-card__def">模型支持的最大上下文长度（tokens）</td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">最大输出</td>
                <td class="cron-tip-card__def">单次请求的最大输出 tokens 数</td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">输入类型</td>
                <td class="cron-tip-card__def">模型支持的输入：<b>文本</b>（必选）、<b>图片</b>（多模态）</td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">推理模型</td>
                <td class="cron-tip-card__def">启用后支持 reasoning effort 参数（如 o1/o3 系列）</td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">成本配置</td>
                <td class="cron-tip-card__def">每百万 tokens 的价格（输入/输出/缓存读/缓存写）</td>
              </tr>
              <tr>
                <td class="cron-tip-card__term">兼容性</td>
                <td class="cron-tip-card__def">API 特性支持：Store、Developer Role、max_tokens 字段名</td>
              </tr>
            </table>
          </div>
        </div>
      </details>

      <div class="config-content__body">
        ${providerKeys.length === 0
          ? html`<div class="mc-empty">${LABELS.noProviders}</div>`
          : html`
              <div class="mc-providers-grid">
                ${providerKeys.map((key) =>
                  renderProviderCard(
                    key,
                    props.providers[key],
                    props.expandedProviders.has(key),
                    props,
                  ),
                )}
              </div>
            `}
      </div>
    </div>
  `;
}
