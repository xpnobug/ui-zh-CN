/**
 * Gateway 设置配置内容组件
 * 右侧面板 - 网关端口和认证
 */
import { html } from "lit";
import type { GatewayConfig } from "../views/model-config";

// SVG 图标
const icons = {
  gateway: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
};

// 中文标签
const LABELS = {
  gatewayTitle: "Gateway 设置",
  gatewayDesc: "配置网关端口、认证和网络绑定",
  port: "端口",
  bindMode: "绑定模式",
  authMode: "认证模式",
  authToken: "认证令牌",
  bindLoopback: "仅本机 (127.0.0.1)",
  bindLan: "局域网 (0.0.0.0)",
  bindAuto: "自动选择",
  authToken_: "Token 认证",
  authPassword: "密码认证",
  authNone: "无认证",
};

export type GatewayContentProps = {
  gatewayConfig: GatewayConfig;
  onGatewayUpdate: (path: string[], value: unknown) => void;
};

/**
 * 渲染 Gateway 设置内容
 */
export function renderGatewayContent(props: GatewayContentProps) {
  const gateway = props.gatewayConfig;

  return html`
    <div class="config-content">
      <div class="config-content__header">
        <div class="config-content__icon">${icons.gateway}</div>
        <div class="config-content__titles">
          <h2 class="config-content__title">${LABELS.gatewayTitle}</h2>
          <p class="config-content__desc">${LABELS.gatewayDesc}</p>
        </div>
      </div>
      <div class="config-content__body">
        <div class="mc-card">
          <div class="mc-card__content">
            <div class="mc-form-row mc-form-row--2col">
              <label class="mc-field">
                <span class="mc-field__label">${LABELS.port}</span>
                <input
                  type="number"
                  class="mc-input"
                  .value=${String(gateway.port ?? 18789)}
                  min="1"
                  max="65535"
                  @input=${(e: Event) =>
                    props.onGatewayUpdate(["port"], Number((e.target as HTMLInputElement).value))}
                />
              </label>
              <label class="mc-field">
                <span class="mc-field__label">${LABELS.bindMode}</span>
                <select
                  class="mc-select"
                  .value=${gateway.bind ?? "loopback"}
                  @change=${(e: Event) =>
                    props.onGatewayUpdate(["bind"], (e.target as HTMLSelectElement).value)}
                >
                  <option value="loopback">${LABELS.bindLoopback}</option>
                  <option value="lan">${LABELS.bindLan}</option>
                  <option value="auto">${LABELS.bindAuto}</option>
                </select>
              </label>
            </div>
            <div class="mc-form-row mc-form-row--2col">
              <label class="mc-field">
                <span class="mc-field__label">${LABELS.authMode}</span>
                <select
                  class="mc-select"
                  .value=${gateway.auth?.mode ?? "token"}
                  @change=${(e: Event) =>
                    props.onGatewayUpdate(["auth", "mode"], (e.target as HTMLSelectElement).value)}
                >
                  <option value="token">${LABELS.authToken_}</option>
                  <option value="password">${LABELS.authPassword}</option>
                  <option value="none">${LABELS.authNone}</option>
                </select>
              </label>
              <label class="mc-field">
                <span class="mc-field__label">${LABELS.authToken}</span>
                <input
                  type="password"
                  class="mc-input"
                  .value=${gateway.auth?.token ?? ""}
                  placeholder="••••••••"
                  @input=${(e: Event) =>
                    props.onGatewayUpdate(["auth", "token"], (e.target as HTMLInputElement).value)}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
