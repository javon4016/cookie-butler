# 未提交内容审查问题清单

> 审查时间: 2024-01-XX
> 提交: `6635397` feat(ui): 重构前端为 iOS 玻璃拟态风格

## 中等
- 状态提示逻辑被“切断”：`updateStatus` 现在只写控制台、仅在 `error` 时弹 Toast，`success/info` 对用户不可见，导致扫码/确认等状态缺少 UI 反馈（见 `public/script.js:244` 及多处调用如 `public/script.js:87`）。
- 新增状态指示 UI 未接入逻辑：`#status-dot/#status-text` 在页面中存在（`public/index.html:85`、`public/index.html:86`），但 JS 未更新它们；CSS 仍残留 `.status-message ~ .status-indicator`（`public/style.css:28`）而页面已无对应结构，说明改造不完整。

### 3. `qrcode-overlay` 的 `hidden`/`flex` 类冲突
- **文件**: `public/index.html:75-79`
- **问题**: `#qrcode-overlay` 同时有 `hidden` 和 `flex-col` 类，`hidden` (display:none) 会覆盖 flex
- **影响**: 当 JS 移除 `hidden` 时，元素变成 `block` 而非预期的 `flex`，加载动画布局可能错乱

---

## 低
- 加载动画使用 `border-3`（`public/index.html:78`），Tailwind 默认不支持该类，可能导致样式异常或不可见。
- 外链 Google Fonts：在受限网络环境可能加载失败导致字体回退不可控（`public/index.html:8`）。
- 未使用的 CSS 规则：`.status-message ~ .status-indicator`（`public/style.css:28-30`）无对应 HTML 元素。
- 未使用的 CSS 动画：`fade-in-up`（`public/style.css:7-16`）已定义但未应用。
- 文件末尾缺少换行符：`public/index.html`、`public/style.css`。

---

## ✅ 已确认无问题
- `.gitignore` 添加 `.ace-tool/` - 合理的忽略规则
- DaisyUI 依赖移除 - 减少外部依赖
- Tailwind 内联配置 - iOS 风格颜色和阴影定义合理
