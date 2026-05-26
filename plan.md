# 重构计划 — iframe 架构修正

## 核心发现（来自 C# 源码）

**`PendingTaskDto.PageUrl`**（第 84 行）：流程中心已在后端实现 URL 拼接，当 `PageCode` 是 `http/https` URL 时自动追加 `businessId / taskId / businessType / nodeId` 等上下文参数，前端直接把 `PageUrl` 塞进 `<iframe src>` 即可。

**`AuditRecordDto.PageCode`**（第 153 行）：历史节点的 `PageCode` 在审批完成时快照写入 ES，不随后续部署变更。历史节点查看时，前端用同样逻辑把 `PageCode` + 历史上下文参数拼成只读 iframe URL。

**`AuditRecordDto` 无 `PageUrl` 字段**：历史节点没有现成的 `PageUrl`，只有 `PageCode`。前端需要自行拼接：`PageCode + ?businessId=xxx&mode=readonly&taskDefinitionKey=xxx`

---

## 删除文件清单（告知 Codex 直接删除）

```
src/components/todo/MockApproveForm.vue
src/api/todo/useTaskService.js
src/api/todo/service/useBriefingFeedbackService.js
src/api/workflow/processProgressAdapter.js
src/router/Componentregistry.js          ← 整个组件注册表，新架构不需要
src/components/todo/SelectedUserBar.vue  ← 选人由 assigneeContract 后端注入，前端无感知
src/components/todo/Defaultassigneebar.vue ← 推荐候选人展示，新架构无此概念
```

---

## 改造节点计划

### PATCH-R01｜`TaskApproveDrawer.vue` iframe 化重写

**目标**：删除旧机制全部代码，Tab1 表单区替换为 iframe。

**Script 删除**：
- `bizFormComponent / approveFormRef / shallowRef / resolveComponent` 全部移除
- `evaluateCondition / flowVarDefs / flowVars / slotCandidates / slotSelections / activeSlots` 全部移除
- `openSlotSelector / handleSlotSelectorConfirm / removeSlotUser / useSlotCandidate / useAllSlotCandidates` 全部移除
- `handleApprove` 简化：去掉 `submitBusiness` 调用，直接调 `completeTask`，`nextSlotSelections` 传 `[]`
- `handleReject` 同上简化
- `handleReassignSubmit` 保留，`reassignTask` 调用不变
- `handleClose` 中清理旧状态的代码一并移除

**新增 props**：
- `pageUrl: String` — 待办任务的 iframe URL（来自 `PendingTaskDto.PageUrl`）

**Template 变化**：
- Tab1 内容区替换为：
  ```
  <iframe v-if="pageUrl" :src="pageUrl" class="task-iframe" />
  <IframeErrorFallback v-else />      ← PageUrl 为空时的降级展示
  ```
- 移除 `SelectedUserBar / DefaultAssigneeBar / ContactSelector（选人用途）` 插槽区
- 保留 `ContactSelector` 用于**转派**（单选人，逻辑不变）
- 保留驳回 Dialog（`rejectOptions / rejectForm`，逻辑不变）
- 保留流程进度 Tab（`FlowGraph`，不变）

**新增组件**：`IframeErrorFallback.vue`（简单的占位提示，`PageUrl` 为空时展示）

---

### PATCH-R02｜`ApplicationViewDrawer.vue` 历史节点 iframe 化

**目标**：删除 Vue 组件动态加载链路，Tab 内容改为 iframe。

**Script 删除**：
- `nodeRefs / setNodeRef / initializedKeys / resolveComponent / getComponent` 全部移除
- `watch(nodeRefs, ...)` 初始化表单的 watch 移除
- `loadAuditHistory / auditHistoryMap / auditLoading` 可保留（用于补全 Tab 信息条数据）

**历史节点 iframe URL 拼接规则**（前端自行拼接，因为 `AuditRecordDto` 只有 `PageCode`）：
```js
// PageCode 是 http/https URL 时直接追加参数
function buildReadonlyUrl(pageCode, businessId, taskDefinitionKey) {
  if (!pageCode?.startsWith('http')) return null   // 非 URL：无 iframe
  const url = new URL(pageCode)
  url.searchParams.set('businessId',        businessId)
  url.searchParams.set('taskDefinitionKey', taskDefinitionKey)
  url.searchParams.set('mode',              'readonly')
  return url.toString()
}
```

**Tab 内容替换为**：
```
<iframe v-if="buildReadonlyUrl(node.pageCode, ...)" :src="..." class="history-iframe" />
<div v-else class="snap-info-only">  ← PageCode 非 URL 时纯文字展示（操作人+时间+意见）
```

**`resolvedNodes` computed 简化**：去掉 `viewComponentPath / nodeComponentMap` 字段，只保留 `pageCode` 字段（来自 `AuditRecordDto.PageCode`）。

---

### PATCH-R03｜`MyTodo.vue` props 修正

**目标**：`openApproveDrawer` 把 `row.pageUrl` 传给 `TaskApproveDrawer`。

**变化**：
- `currentTask` 中新增 `pageUrl: row.pageUrl`
- `TaskApproveDrawer` 新增 `:page-url="currentTask?.pageUrl"` prop 传递
- 删除 `orgList / userList` 在 `TaskApproveDrawer` 上的传递（选人仅剩转派用，转派的 `orgList/userList` 可以内置在 ContactSelector 里或由独立接口提供）

---

### PATCH-R04｜`MyApplication.vue` nodes 结构简化

**目标**：`openViewDrawer` 中的 progress → nodes 映射去掉 `viewComponentPath`，改为保留 `pageCode`。

**变化**：
```js
// 旧：historyNodes 映射里有 viewComponentPath: null
// 新：改为 pageCode: r.pageCode（直接从 AuditRecordDto 取）
const historyNodes = (progress.auditHistory ?? []).map(r => ({
  nodeKey:       r.taskDefinitionKey,
  nodeName:      r.taskDefinitionKey,
  nodeSemantic:  r.nodeSemantic,
  operator:      r.operatorId,
  completedAt:   r.operatedAt,
  approveComment: r.comment,
  pageCode:      r.pageCode,           // ← 改为 pageCode
  slotSelections: r.slotSelections ?? [],
  round:         1,
}))
```

---

### PATCH-R05｜`processApi.ts` DTO 修正

**目标**：前端 TS 类型定义与实际后端 DTO 对齐。

**变化**：
- `PendingTaskDto` 新增 `pageUrl: string | null`
- `PendingTaskDto` 移除 `requiredSlots`（后端注释为"前端可以忽略"）
- `AuditRecordDto` 确认有 `pageCode: string`（已有，无需改）
- `CompleteTaskRequest.nextSlotSelections` 改为可选且默认空数组（新架构不传）
- 移除 `SlotDefinition / AssigneeContract / LoopAssignment` 等前端用不到的类型（新架构 assigneeContract 在后端处理，前端无需感知）

---

### PATCH-R06｜`useTaskService.js` 废弃后的 `mockData.js` 清理

**目标**：`mockData.js` 中 `mockOrgList / mockUserList` 是否还需要取决于转派功能如何获取人员数据。

**待确认**：转派时 `ContactSelector` 的 `orgList / userList` 从哪来？
- 方案A：业务系统有独立的组织接口，前端调真实接口
- 方案B：联调期间先保留 `mockOrgList / mockUserList`，后续替换

如果是方案A，`mockData.js` 可以整体删除；方案B则保留文件但只保留这两个导出。

---

## 节点执行顺序

```
删除文件（Codex 执行）
    ↓
PATCH-R05  processApi.ts DTO 修正（最先，其他节点依赖类型）
    ↓
PATCH-R01  TaskApproveDrawer iframe 化（核心）
PATCH-R02  ApplicationViewDrawer iframe 化（核心）
    ↓
PATCH-R03  MyTodo pageUrl 传递修正
PATCH-R04  MyApplication nodes 结构修正
    ↓
PATCH-R06  mockData.js 最终清理（待转派数据来源确认后执行）
```
