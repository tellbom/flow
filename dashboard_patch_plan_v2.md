# Dashboard 复刻计划书 v2

目标：将 `Dashboard.html / dashboard.jsx` 的 `<main>` 区域原样复刻为 Vue 页面。  
不重新设计、不抽象设计系统、不拆过细、接受冗余代码、视觉一致性优先。

---

## 文件清单

```
src/views/backend/dashboard/
  ProcessDashboard.vue   ← 父组件：调 API、传 props、布局骨架
  components/
    DashboardCard.vue    ← KPI 卡片 + 状态甜甜圈（纯展示）
    DashboardChart.vue   ← 审计趋势柱状图（纯展示）
    DashboardTable.vue   ← 近期流程表格（纯展示）
```

路由在 `adminBase.ts`（或等价的静态路由文件）里追加一条 `dashboard` 路由指向 `ProcessDashboard.vue`。

---

## PATCH-D01 — `ProcessDashboard.vue`

### 职责
- 页面唯一调 API 的地方
- `onMounted` 并发触发全部请求（`Promise.allSettled`，互不阻塞）
- 维护各模块的 `loading / error / data` 状态
- 用 `<main class="page">` 包裹，直接把 `Dashboard.html` 里 `.page` 的 grid 布局 CSS 写进 `<style>`
- 把数据通过 props 传给三个子组件

### 布局结构（对应 dashboard.jsx `App()`）
```
<main class="page">
  <!-- KPI 四张卡 + 甜甜圈 -->
  <DashboardCard :pending="..." :counts="..." />

  <!-- 审计趋势 -->
  <div class="row-2-1">
    <DashboardChart :audit-data="..." />
    <!-- 甜甜圈也可以放这里，视 DashboardCard 拆分方式而定 -->
  </div>

  <!-- 待办列表 + 活动流 -->
  <div class="row-3-2">
    <!-- 待办和活动流直接在父组件内联渲染，或并入 DashboardCard -->
  </div>

  <!-- 流程表格 -->
  <DashboardTable :rows="..." :total="..." ... />
</main>
```

### API 调用
| 数据 | 接口 |
|---|---|
| 我的待办（总数 + 列表） | `getPendingTasks({ pageSize: 20 })` |
| 各状态流程数量 | `getProcessList` 分别传 `status=running/completed/terminated/callback_failed`，取 `total` 字段，用 `Promise.allSettled` 并发 |
| 近期流程列表 | `getProcessList({ pageIndex, pageSize, status? })` |
| 审计动态 / 趋势 | 取近 20 条流程的 `businessId`，并发调 `getAuditHistory`，结果打平后在前端按日期聚合成柱状图数据，同时取前 10 条作活动流 |

### 注意
- `AuditRecordDto.action` 为数字（1=通过 2=驳回 3=转派 4=终止），需在父组件做映射
- `ProcessListItem` 不含 `currentNodeName / progress` 等字段，表格对应列展示 `—`，不补 mock
- 各模块独立 loading/error，某块失败不影响其他块渲染

---

## PATCH-D02 — `DashboardCard.vue`

### 职责
把 `dashboard.jsx` 里以下几个区块的 HTML + CSS 直接搬进来（纯展示，无 API）：
- `KpiRow`（四张 KPI 卡）
- `StatusDonut`（甜甜圈）
- `PendingTasks`（我的待办列表）
- `ActivityFeed`（实时审计动态）

### Props
```ts
props: {
  pendingTasks: PendingTaskDto[]
  statusCounts: { running, completed, terminated, callback_failed }
  activityFeed: ActivityEntry[]   // 父组件从 auditHistory 聚合
}
```

### Emits
```ts
emit('handle-task', task)   // 点"处理"按钮
```

### 实现要点
- `<style>` 里直接粘贴 `Dashboard.html` 对应的 CSS 块：`.kpi`, `.kpi-row`, `.kpi-*`, `.donut-*`, `.task-*`, `.feed-*`, `.chip-*`, `.seg-control`, `.api-trace` 等
- 甜甜圈用内联 SVG，逻辑照抄 `StatusDonut()` 函数
- `ageBucket / fmtAge` 等 helper 函数直接在组件内声明
- `filter`（全部 / ≤24h / 24-72h / >72h）用 `ref` 在组件内维护，不上报父组件

---

## PATCH-D03 — `DashboardChart.vue`

### 职责
把 `dashboard.jsx` 里 `TrendChart()` 的 HTML + CSS 直接搬进来（纯展示，无 API）。

### Props
```ts
props: {
  auditData: Array<{ d: string, approve: number, reject: number, reassign: number }>
}
```

### 实现要点
- `range`（7d / 14d / 30d）用 `ref` 在组件内维护
- SVG 柱状图逻辑照抄 `TrendChart()` 函数，`viewBox` 用响应式宽度（`width="100%" preserveAspectRatio="none"`）
- `<style>` 里直接粘贴 `.chart-*`, `.dotted-divider` 等 CSS
- 右侧「本周关键指标」三行数字，若 API 不提供则展示 `—`

---

## PATCH-D04 — `DashboardTable.vue`

### 职责
把 `dashboard.jsx` 里 `ProcessTable()` 的 HTML + CSS 直接搬进来（纯展示，无 API）。

### Props
```ts
props: {
  rows:          ProcessListItem[]
  total:         number
  currentPage:   number
  pageSize:      number
  statusFilter:  string
  loading:       boolean
}
```

### Emits
```ts
emit('filter-change', status)
emit('page-change', page)
emit('view-detail', row)
emit('view-flow', row)
```

### 实现要点
- `<style>` 里直接粘贴 `table.tbl`, `.tbl-foot`, `.pagination`, `.progress`, `.node-mini`, `.btn-pearl`, `.seg-control` 等 CSS
- loading 时每行显示简单 shimmer 占位（一个 `background` animation 的 div）
- 分页按钮只渲染当前页附近 ±2 页
- `status` filter 按钮点击后 `emit('filter-change')`，父组件重新调接口

---

## CSS 处理原则

- 所有 CSS **直接从 `Dashboard.html` 复制**，粘贴进对应组件的 `<style>` 块（不加 `scoped`，或加 `scoped` 后在父组件用 `:deep()` 覆盖跨组件样式）
- 设计 token（CSS 变量 `--c-*`, `--s-*`, `--r-*`）统一写在 `ProcessDashboard.vue` 的 `<style>` 里，或追加到项目已有的全局样式文件（`src/styles/index.scss`）
- **不新建设计系统文件**，不做任何 CSS 抽象

---

## 不在本次范围内

- ribbon-tile（HealthRibbon）
- topbar / subnav / hero
- TweaksPanel
- 移动端适配
