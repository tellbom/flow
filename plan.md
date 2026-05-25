好，基于完整的代码阅读和架构理解，现在输出前端改造节点清单。节点设计原则：每个节点独立可交付、边界清晰、Codex 可直接执行。

---

# 前端重构改造节点清单

**技术栈**：Vue 3 Composition API + Element Plus + SCSS  
**浏览器基线**：Chrome 109（所有样式与脚本必须完全兼容 Chrome 109，不得擅自使用超过该版本支持范围的 CSS/JS 特性）  
**不考虑**：大屏、移动端  
**颜色基准**：DESIGN.md（`#0066cc` Action Blue / `#1d1d1f` Ink / `#f5f5f7` Canvas Parchment）

---

## NODE-F01｜建立全局 Design Token 文件

**目标**：创建 `src/styles/workflow-tokens.scss`，作为后续所有节点的颜色/间距/圆角唯一来源。

**交付物**：一个新增的 SCSS 文件。

**内容规范**：

```scss
// === Color Tokens ===
:root {
  --wf-primary:          #0066cc;   // Action Blue
  --wf-primary-hover:    #0071e3;   // Focus Blue
  --wf-primary-light:    #e8f0fb;   // Primary 浅背景（替换旧 #edf2ff / #eff6ff）

  --wf-ink:              #1d1d1f;   // 主文字
  --wf-ink-2:            #4e5969;   // 次要文字（替换旧 #4e5969）
  --wf-ink-3:            #7a7a7a;   // 辅助文字（替换旧 #86909c）
  --wf-ink-disabled:     #c0c4cc;

  --wf-canvas:           #ffffff;
  --wf-bg:               #f5f5f7;   // 页面背景（替换旧 #f5f7fa）
  --wf-bg-card:          #fafafa;   // 卡片内嵌背景
  --wf-border:           #e0e0e0;   // Hairline（替换旧 #e4e7ed）
  --wf-divider:          #f0f0f0;   // Divider Soft

  // === Semantic Status Colors ===
  --wf-success:          #34c759;
  --wf-success-bg:       #d1fae5;
  --wf-warning:          #f59e0b;
  --wf-warning-bg:       #fef3c7;
  --wf-danger:           #ef4444;
  --wf-danger-bg:        #fee2e2;

  // === Spacing ===
  --wf-space-xs:         4px;
  --wf-space-sm:         8px;
  --wf-space-md:         16px;
  --wf-space-lg:         24px;
  --wf-space-xl:         32px;

  // === Radius ===
  --wf-radius-sm:        6px;    // 紧凑元素（tag、badge、小按钮）
  --wf-radius-md:        10px;   // 卡片内嵌区域
  --wf-radius-lg:        14px;   // 卡片主体
  --wf-radius-xl:        18px;   // 页面级容器
  --wf-radius-pill:      100px;  // Chip、状态圆点容器

  // === Shadow（仅限内容卡片，不用于按钮）===
  --wf-shadow-card:      0 1px 4px rgba(0,0,0,0.06);
  --wf-shadow-drawer:    -8px 0 32px rgba(0,0,0,0.10);

  // === Typography（企业后台适配，非 Apple 官网 56px）===
  --wf-font-xs:          11px;
  --wf-font-sm:          12px;
  --wf-font-base:        13px;
  --wf-font-md:          14px;
  --wf-font-lg:          16px;
  --wf-font-xl:          20px;
}
```

**无前置依赖**

---

## NODE-F02｜改造 Commonsearch.vue

**目标**：去掉渐变按钮和装饰阴影，统一到 Token，对齐 Action Blue。

**改造点**：
1. `:deep(.el-button--primary)` — 移除 `linear-gradient` 和 `box-shadow`，改为纯色 `background: var(--wf-primary)`
2. `:deep(.el-button--primary:hover)` — 移除 `translateY(-1px)` 和加重阴影，改为 `background: var(--wf-primary-hover)`
3. `:deep(.el-button--primary:active)` — 保留 `transform: scale(0.95)`（DESIGN.md 明确推荐）
4. `.common-search` 容器 `box-shadow` — 移除 hover 加重阴影，只保留 `var(--wf-shadow-card)`
5. `.search-form` 内 `border-radius` 统一为 `var(--wf-radius-sm)`
6. `:deep(.el-input__wrapper.is-focus)` — 颜色改为 `var(--wf-primary)`

**前置依赖**：NODE-F01

---

## NODE-F03｜改造 Commontable.vue

**目标**：去掉 OA 网格感，改为现代干净表格；统一色到 Token。

**改造点**：
1. `el-table` — 移除 `stripe` 和 `border` 属性（通过 props 传入，改默认值为 `false`）；`header-cell-style` 背景从 `#f5f7fa` 改为 `var(--wf-bg)`，文字从 `#606266` 改为 `var(--wf-ink-2)`
2. `.common-table` — `border-radius` 改为 `var(--wf-radius-lg)`；`box-shadow` 改为 `var(--wf-shadow-card)`
3. `.pagination-container` — `el-pagination` 主色用 CSS 变量覆盖 `--el-pagination-button-color: var(--wf-primary)`
4. `:deep(.el-button--primary)` — 移除 `background-color: #409EFF` 硬编码，改为 `var(--wf-primary)`
5. 列设置 Drawer 标题颜色 `color: var(--wf-ink)`
6. `column-item` 分隔线颜色 `var(--wf-divider)`

**前置依赖**：NODE-F01

---

## NODE-F04｜改造 MyTodo.vue 页头与布局

**目标**：将强渐变 Banner + 装饰圆 替换为 Apple 风格的干净页头区。

**改造点**：
1. **完全移除** `.page-banner` 的 `linear-gradient`、`box-shadow`、`.banner-bg-circle` 装饰圆 DOM 元素
2. 新页头结构：纯白背景 `var(--wf-canvas)`，底部 `1px` hairline `var(--wf-divider)`，左侧图标 + 标题文字，右侧统计数字
3. 页面背景 `background: var(--wf-bg)`
4. KPI 卡片：移除 `hover transform translateY(-2px)`（过于跳动），保留 `border: 2px solid transparent` → active 时 `border-color: var(--wf-primary)`；`kpi-icon-wrap border-radius` 改为 `var(--wf-radius-md)`
5. `.kpi-card box-shadow` 改为 `var(--wf-shadow-card)`
6. 优先级状态点颜色 `.p-3 / .p-2 / .p-1` 保持语义色（红/橙/灰），不受 Token 影响

**前置依赖**：NODE-F01, NODE-F02, NODE-F03

---

## NODE-F05｜改造 MyApplication.vue 页头与布局

**目标**：与 MyTodo.vue 保持一致的页头语言，移除蓝色渐变 Banner。

**改造点**：与 NODE-F04 完全对称，差异只在：
1. 页头图标用 `Document` 而非 `Bell`
2. KPI 卡片颜色语义保留（`running=蓝 / completed=绿 / terminated=灰`），只统一圆角和阴影
3. 状态点动画 `.s-running` 保留 pulse（表示进行中）

**前置依赖**：NODE-F01, NODE-F02, NODE-F03

---

## NODE-F06｜改造 TaskApproveDrawer.vue 主题色

**目标**：将所有 `#c62f2f`（旧党政红）替换为 `var(--wf-primary)`；统一 Drawer 基础结构样式。

**改造点**：
1. Tab 激活色：`:deep(.el-tabs__item.is-active) color` → `var(--wf-primary)`；`el-tabs__active-bar background` → `var(--wf-primary)`
2. Header 同意按钮：保持 `type="success"`（绿色语义，表示"通过"，不改）；驳回按钮保持 `type="danger"`（红色语义，表示"拒绝"，不改）——此处主色改造**不适用**于操作按钮，语义色保留
3. `.reassign-dialog` / `.slot-selector-dialog` `:deep(.el-dialog)` `border-radius` → `var(--wf-radius-lg)`
4. 驳回选项 `.reject-option-item.is-selected` → `border-color: var(--wf-primary)` / `background: var(--wf-primary-light)`；`.ro-dot` → `background: var(--wf-primary)`
5. 全局 `<style>` 中 Drawer `top: 48px !important` 保留（这是布局约束，不是样式问题）
6. `.fmb-sep` 分隔线颜色 → `var(--wf-border)`

**前置依赖**：NODE-F01

---

## NODE-F07｜改造 ApplicationViewDrawer.vue 主题色

**目标**：将所有 `#c62f2f` 替换为 `var(--wf-primary)`；section 卡片统一圆角。

**改造点**：
1. `.avd-icon` 背景 `#fff1f0` → `var(--wf-primary-light)`；图标颜色 `color: #c62f2f` → `var(--wf-primary)`
2. `.avd-section-title .el-icon` 颜色 → `var(--wf-primary)`
3. `.avd-section-card border-radius` → `var(--wf-radius-lg)`；`box-shadow` → `var(--wf-shadow-card)`
4. `el-tabs` CSS 变量 `--el-color-primary: var(--wf-primary)` 替换硬编码 `#c62f2f`
5. Tab item `is-active` 背景 `#fff1f0` → `var(--wf-primary-light)`；颜色 → `var(--wf-primary)`
6. `.tab-operator` active 状态背景 `#ffd5d5` → `var(--wf-primary-light)`；颜色 → `var(--wf-primary)`
7. `.avd-body` 背景 `#f4f5f7` → `var(--wf-bg)`

**前置依赖**：NODE-F01

---

## NODE-F08｜改造 DefaultAssigneeBar.vue + SelectedUserBar.vue 主题色

**目标**：将 `#3370ff`（Lark Blue）统一替换为 `var(--wf-primary)`。

**DefaultAssigneeBar.vue 改造点**：
1. `.dab-icon` 背景 `#3370ff` → `var(--wf-primary)`
2. `.dab-title` 颜色 `#3370ff` → `var(--wf-primary)`
3. `.dab-header` 背景 `#edf2ff` → `var(--wf-primary-light)`；border `#c5d8ff` → `var(--wf-border)`
4. `.dab-use-btn` 背景/border `#3370ff` → `var(--wf-primary)`
5. `.dab-add-btn` border/color `#3370ff` → `var(--wf-primary)`；hover 背景 → `var(--wf-primary)`
6. `.dab-wrap` border `#c5d8ff` → `var(--wf-border)`；背景 `#f5f8ff` → `var(--wf-primary-light)`

**SelectedUserBar.vue 改造点**：
1. `.user-chip` 背景 `#f0f7ff` → `var(--wf-primary-light)`；border `#bfdbfe` → `var(--wf-border)`
2. `.chip-avatar` 渐变 `#007aff, #5b8fff` → `var(--wf-primary), var(--wf-primary-hover)`
3. `.chip-name` 颜色 `#1d3a6e` → `var(--wf-ink)`
4. `.add-btn` border `#bfdbfe` → `var(--wf-border)`；color `#007aff` → `var(--wf-primary)`；hover 背景 → `var(--wf-primary-light)`

**前置依赖**：NODE-F01

---

## NODE-F09｜改造 ContactSelector.vue 主题色

**目标**：将 `#007aff`（iOS Blue）替换为 `var(--wf-primary)`；清理少量遗留风格。

**改造点**：
1. 树节点 `.node-icon` 颜色 `#007aff` → `var(--wf-primary)`
2. `:deep(.el-tree-node__content:hover)` 背景 `rgba(0, 122, 255, 0.08)` → `rgba(0, 102, 204, 0.08)`
3. `:deep(.el-tree-node.is-current > .el-tree-node__content)` 背景 `rgba(0, 122, 255, 0.12)` → `rgba(0, 102, 204, 0.12)`
4. `.user-job` 颜色 `#007aff` → `var(--wf-primary)`
5. `.user-item.selected` border `#007aff` → `var(--wf-primary)`；背景 `rgba(0, 122, 255, 0.08)` → `rgba(0, 102, 204, 0.08)`
6. 搜索框 `.search-bar .el-input is-focus` box-shadow `#007aff` → `var(--wf-primary)`
7. 取消/确定按钮 `:deep(.el-button--primary)` → `var(--wf-primary)`
8. `.user-avatar` 渐变 `#667eea, #764ba2` → `var(--wf-primary), var(--wf-primary-hover)`（移除紫色渐变头像）
9. `.section-title` 背景 `#ffffff` → `var(--wf-canvas)`，保持一致

**前置依赖**：NODE-F01

---

## NODE-F10｜改造 BulletinDeptDisplay.vue 主题色

**目标**：将 `#3370ff` 替换为 `var(--wf-primary)`；统一弹窗样式。

**改造点**：
1. `.bdd-tag-icon` 颜色 `#3370ff` → `var(--wf-primary)`
2. `.bdd-trigger:hover` border/color `#3370ff` → `var(--wf-primary)`；背景 `#f0f4ff` → `var(--wf-primary-light)`
3. `.bdd-dlg-count` 背景/颜色/border `#3370ff` → `var(--wf-primary)` 系列
4. `:deep(.bdd-tree .el-checkbox.is-checked .el-checkbox__inner)` → `var(--wf-primary)`
5. `:deep(.bdd-dlg-acts .el-button--primary)` → `var(--wf-primary)`
6. 搜索框 focus 状态 `3370ff` → `var(--wf-primary)`

**前置依赖**：NODE-F01

---

## NODE-F11｜改造 ApprovalHistory.vue

**目标**：统一时间线样式，outcome 颜色对齐 Token。

**改造点**：
1. `.record-card` `background: #fafafa` → `var(--wf-bg-card)`；`border: 1px solid #f0f0f0` → `var(--wf-divider)`；`border-radius` → `var(--wf-radius-md)`
2. `.record-node` 颜色 → `var(--wf-ink)`
3. `.record-meta` 颜色 → `var(--wf-ink-3)`
4. `.record-reason` 背景 `#fffbeb` → `var(--wf-warning-bg)`；颜色 `#b45309` → `var(--wf-warning)`（使用语义色 Token 而非硬编码）

**前置依赖**：NODE-F01

---

## NODE-F12｜提取公共工具层（StatusTag + WorkflowUtils）

**目标**：将散落在 4+ 个组件内的重复代码提取为公共文件，消除维护分叉风险。

**交付物**：

**`src/workflow-shared/workflowUtils.js`**：
```javascript
// 提取自 TaskApproveDrawer / ApplicationViewDrawer / MyApplication / MyTodo
export const statusTagType = (s) =>
  ({ running: 'primary', completed: 'success', terminated: 'info', rejected: 'danger' }[s] || '')

export const statusLabel = (s) =>
  ({ running: '审批中', completed: '已完成', terminated: '已撤回', rejected: '已驳回' }[s] || s)

export const formatDate = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
}

export const formatDuration = (s) => {
  if (!s) return '-'
  if (s < 60)   return `${s}秒`
  if (s < 3600) return `${Math.floor(s/60)}分钟`
  if (s < 86400) return `${Math.floor(s/3600)}小时`
  return `${Math.floor(s/86400)}天`
}
```

**`src/workflow-shared/StatusTag.vue`**：
```vue
<!-- 统一流程状态标签，替换各组件内联的 statusTagType + statusLabel -->
<template>
  <div class="wf-status-cell">
    <span class="wf-status-dot" :class="`dot-${status}`" />
    <el-tag :type="tagType" size="small" round>{{ label }}</el-tag>
  </div>
</template>
```

**各使用组件**（MyTodo、MyApplication、TaskApproveDrawer、ApplicationViewDrawer）的对应 `statusTagType` / `statusLabel` 方法替换为 import，inline 实现删除。

**前置依赖**：NODE-F01

---

## 节点执行顺序

```
NODE-F01  ← 必须首先完成（所有节点的前置）
    ↓
NODE-F02  NODE-F03  NODE-F06  NODE-F07  NODE-F08  NODE-F09  NODE-F10  NODE-F11  NODE-F12
（可并行执行，互不干扰）
    ↓
NODE-F04  NODE-F05
（依赖 F02 + F03 完成后再做页面级改造）
```

## 节点汇总表

| 节点 | 文件 | 类型 | 前置 |
|---|---|---|---|
| F01 | workflow-tokens.scss（新建） | Token 基础 | 无 |
| F02 | Commonsearch.vue | 样式清理 | F01 |
| F03 | Commontable.vue | 样式清理 | F01 |
| F04 | MyTodo.vue | 布局改造 | F01+F02+F03 |
| F05 | MyApplication.vue | 布局改造 | F01+F02+F03 |
| F06 | TaskApproveDrawer.vue | 主题色 | F01 |
| F07 | ApplicationViewDrawer.vue | 主题色 | F01 |
| F08 | DefaultAssigneeBar + SelectedUserBar | 主题色 | F01 |
| F09 | ContactSelector.vue | 主题色 | F01 |
| F10 | BulletinDeptDisplay.vue | 主题色 | F01 |
| F11 | ApprovalHistory.vue | 样式清理 | F01 |
| F12 | workflowUtils.js + StatusTag.vue（新建） | 公共层提取 | F01 |
