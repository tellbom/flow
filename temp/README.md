`ProcessListItem` 有 `currentNodeNames: string[]`，没有 `currentAssignee` / `currentNodeSemantic` / `progress`，这几列展示 `—`。PATCH-D04 完成。几个实现说明：

**字段缺口处理**：`ProcessListItem` 只有 `currentNodeNames: string[]`，没有 `currentAssignee` / `currentNodeSemantic` / `progress`。当前节点列把 `currentNodeNames` 用 ` / ` 拼接展示（多并行节点场景），assignee 和 semantic 显示 `—`；进度列进度条宽度 `0%` + 文字 `—`，视觉上保持列结构完整。

**分页**：`visiblePages` 实现了「首页 · 省略号 · 当前页 ±1 · 省略号 · 末页」的经典分页样式，与原稿 `‹ 1 2 3 … 184 ›` 视觉一致，`‹` / `›` 按钮在边界时 `disabled`。

**filter 点击直接 emit**，不在组件内维护状态——filter 变更需要重新调 API，由父组件 `ProcessDashboard` 统一处理。

**CSS 全部复用** `ProcessDashboard.vue` `<style>` 里已有的 `pd-tbl` / `pd-tbl-foot` / `pd-pagination` / `pd-chip-*` / `.node-mini` / `.progress` 等类，`DashboardTable.vue` 无需再写 `<style>` 块。