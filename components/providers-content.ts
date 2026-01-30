/**
 * 模型供应商配置内容组件
 * 右侧面板 - 供应商管理
 */
import { html, nothing } from "lit";
import type { ProviderConfig, ModelConfig } from "../views/model-config";

// SVG 图标
const icons = {
  provider: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  add: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  trash: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  chevron: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
};

// 中文标签
const LABELS = {
  providersTitle: "模型供应商",
  providersDesc: "配置 LLM 模型供应商，支持 OpenAI、Anthropic 等协议",
  addProvider: "添加供应商",
  providerName: "供应商名称",
  providerBaseUrl: "API 地址",
  providerApiKey: "API 密钥",
  providerProtocol: "协议类型",
  protocolOpenAI: "OpenAI 兼容",
  protocolAnthropic: "Anthropic 兼容",
  noProviders: "尚未配置任何模型供应商",
  modelId: "模型 ID",
  modelName: "显示名称",
  modelReasoning: "支持推理",
  modelContext: "上下文长度",
  modelMaxTokens: "最大输出",
  addModel: "添加模型",
  modelCount: "个模型",
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
  `;
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
  const protocolLabel =
    provider.api === "anthropic-messages"
      ? LABELS.protocolAnthropic
      : LABELS.protocolOpenAI;

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
                      @input=${(e: Event) =>
                        props.onProviderUpdate(key, "baseUrl", (e.target as HTMLInputElement).value)}
                    />
                  </label>
                </div>
                <div class="mc-form-row mc-form-row--2col">
                  <label class="mc-field">
                    <span class="mc-field__label">${LABELS.providerApiKey}</span>
                    <input
                      type="password"
                      class="mc-input"
                      .value=${provider.apiKey}
                      placeholder="••••••••"
                      @input=${(e: Event) =>
                        props.onProviderUpdate(key, "apiKey", (e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label class="mc-field">
                    <span class="mc-field__label">${LABELS.providerProtocol}</span>
                    <select
                      class="mc-select"
                      .value=${provider.api}
                      @change=${(e: Event) =>
                        props.onProviderUpdate(key, "api", (e.target as HTMLSelectElement).value)}
                    >
                      <option value="openai-completions">${LABELS.protocolOpenAI}</option>
                      <option value="anthropic-messages">${LABELS.protocolAnthropic}</option>
                    </select>
                  </label>
                </div>
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
