先读完新版 README。关键信息读完。README 第 5.2 节已明确写出 fallback 规则：

> `recommendedUsers[task.roleKey] ?? recommendedUsers[slot.slotKey] ?? []`

`task.roleKey` 是 `PendingTaskDto` 根级新增字段（第 286 行已确认），`requiredSlots[]` 每个 slot 不含 `roleKey`。规则完全清晰，现在制定补丁计划。

---

# 推荐确认模式补丁计划（PATCH-S 系列）

---

## PATCH-S01｜`processApi.ts` — DTO 修正（恢复 + 新增字段）

**目标**：恢复被错误删除的字段，补充推荐人相关字段，对齐新版 README。

**`PendingTaskDto` 变更**：

| 字段 | 操作 | 说明 |
|---|---|---|
| `roleKey: string` | **新增** | 节点级角色 Key，用于 `recommendedUsers[task.roleKey]` 查推荐人 |
| `requiredSlots: SlotDefinition[]` | **恢复** | PATCH-R05 错误删除，推荐确认模式必须 |
| `recommendedUsers: Record<string,string[]>` | **新增** | key=roleKey，value=推荐人工号列表 |
| `restrictToRecommended: Record<string,boolean>` | **新增** | key=slotKey，value=是否限制只能选推荐人 |

**`SlotDefinition` 接口**（恢复）：

```ts
export interface SlotDefinition {
  slotKey:               string
  label:                 string
  mode:                  'single' | 'multiple'
  variableName:          string
  required:              boolean
  conditionalOn?:        string
  restrictToRecommended: boolean
  // 注：slot 级无 roleKey 字段，roleKey 在 PendingTaskDto 根级
}
```

**`CompleteTaskRequest` 变更**：

| 字段 | 操作 | 说明 |
|---|---|---|
| `nextSlotSelections` | **改为必传（非可选）** | 推荐确认模式始终传，无槽位时传 `[]` |
| `taskId` | **改为必传** | README 第7条要求，并行场景必须 |

---

## PATCH-S02｜恢复 `SelectedUserBar.vue`

**目标**：恢复为推荐确认模式专用版本（非旧版完全复原）。

**与旧版的区别**：

| 特性 | 旧版 | 新版 |
|---|---|---|
| 触发选人弹窗 | 有（`@click-add`） | 有，但受 `restrictToRecommended` 控制是否可以触发 |
| 样式 | 旧硬编码色 | Token 规范色（PATCH-F08 版本为基础） |
| `readonly` prop | 无 | **新增**，`restrictToRecommended=true` 时禁用"选择/修改"按钮 |

**新增 props**：

```
readonly:    Boolean  — true 时隐藏"选择/修改"按钮（限制范围时不允许新增人员）
required:    Boolean  — 用于 aria 标记，实际校验在 TaskApproveDrawer 层
```

---

## PATCH-S03｜重写 `DefaultAssigneeBar.vue`

**目标**：从"表单推荐人"展示组件重新设计为"推荐确认模式"下的完整推荐人区，支持 `restrictToRecommended` 状态感知。

**新增 props**：

```
candidates:            Array   — 推荐候选人列表（由 TaskApproveDrawer 计算后传入）
usedIds:               Array   — 已选人员 id/workNo 集合（来自 SelectedUserBar 的当前选择）
restrictToRecommended: Boolean — true=锁定范围，UI 显示"范围已限定"标记
label:                 String  — 槽位标签（如"巡察办审核人"）
```

**与旧版 Defaultassigneebar.vue（上传版）的区别**：
- 新增 `restrictToRecommended` 标识展示（锁定图标 + 提示文字）
- 头部提示文字随 `restrictToRecommended` 变化："仅可从以下推荐人中选择" / "以下为推荐人，可自行修改"
- "一键使用"在 `restrictToRecommended=true` 时改为"全部确认使用"（语义更清晰）
- 颜色全部 Token 化（移除 `#3370ff` 硬编码）

---

## PATCH-S04｜重写 `TaskApproveDrawer.vue` 选人区

**目标**：在 PATCH-R01 iframe 化基础上，恢复选人区 UI 和逻辑，实现推荐确认模式完整交互。

**Tab1 新结构**：

```
Tab1：审批表单
├── <iframe :src="taskInfo.pageUrl" />   ← 业务表单（不变）
│
├── ── 分隔线："下一节点处理人"（activeSlots 存在时渲染）──
│
└── 选人区（v-if="activeSlots.length"）
    └── v-for slot in activeSlots
        ├── SelectedUserBar
        │     :users="slotSelections[slot.slotKey]"
        │     :readonly="slot.restrictToRecommended"   ← 限制范围时禁止新增
        │     @remove="removeSlotUser"
        │     @click-add="openSlotSelector(slot)"       ← restrictToRecommended=false 才触发
        └── DefaultAssigneeBar
              :candidates="getSlotCandidates(slot)"    ← roleKey 优先 fallback slotKey
              :used-ids="slotSelections[slot.slotKey].map(u => u.workNo)"
              :restrict-to-recommended="slot.restrictToRecommended"
              :label="slot.label"
              @use-one="useSlotCandidate(slot.slotKey, $event)"
              @use-all="useAllSlotCandidates(slot.slotKey)"
```

**新增 Script 逻辑**：

```js
// 推荐候选人查找（README 5.2 fallback 规则）
function getSlotCandidates(slot) {
  const rec = taskInfo.recommendedUsers ?? {}
  const ids  = rec[taskInfo.roleKey] ?? rec[slot.slotKey] ?? []
  // ids 是工号数组，需要映射为用户对象（从 userList 查）
  return ids.map(workNo => userList.find(u => u.workNo === workNo)).filter(Boolean)
}

// conditionalOn 条件求值（从旧版恢复）
function evaluateCondition(condition, variables) { ... }

// activeSlots：满足条件的 slot（conditionalOn 过滤）
const activeSlots = computed(() =>
  (taskInfo?.requiredSlots ?? []).filter(s =>
    evaluateCondition(s.conditionalOn, flowVars.value)
  )
)
```

**`handleApprove` 校验逻辑**：

```js
// 点同意时校验
for (const slot of activeSlots.value) {
  const selected = slotSelections.value[slot.slotKey] ?? []
  if (slot.required && selected.length === 0) {
    ElMessage.warning(`「${slot.label}」至少选择 1 人`)
    return
  }
  if (slot.restrictToRecommended) {
    const candidateIds = getSlotCandidates(slot).map(u => u.workNo)
    const invalid = selected.filter(u => !candidateIds.includes(u.workNo))
    if (invalid.length) {
      ElMessage.warning(`「${slot.label}」只能从推荐人中选择`)
      return
    }
  }
}
```

**选人弹窗**：`restrictToRecommended=true` 时不弹 `ContactSelector`（整个 `openSlotSelector` 做前置 guard），`SelectedUserBar` 的"选择/修改"按钮由 `readonly` prop 禁用。

**`completeTask` 提交**：

```js
await completeTask({
  businessId:         taskInfo.businessId,
  taskId:             taskInfo.taskId,    // 必传
  action:             1,
  comment:            approveComment.value || undefined,
  nextSlotSelections: activeSlots.value.map(slot => ({
    slotKey: slot.slotKey,
    users:   (slotSelections.value[slot.slotKey] ?? []).map(u => u.workNo),
  })),
  businessVariables:  {},
})
```

---

## PATCH-S05｜iframe 高度调整

**目标**：Tab1 的 iframe 在有选人区时与无选人区时采用不同高度策略，避免选人区被遮挡。

**方案**：Tab1 整体改为 `overflow-y: auto` 滚动容器，iframe 固定高度，选人区在 iframe 下方展开，不互相遮挡。

```css
/* Tab1 内容区：可滚动 */
.tab-form-content {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* iframe 固定高度（有选人区时适当压缩，无选人区时撑满）*/
.task-iframe {
  flex-shrink: 0;
  height: v-bind(iframeHeight);   /* computed：有 activeSlots 时 500px，无时 100% */
}

/* 选人区 */
.slot-section {
  flex-shrink: 0;
  padding: 16px 20px;
  border-top: 1px solid var(--wf-divider);
}
```

---

## 执行顺序

```
PATCH-S01  processApi.ts DTO（最先，其余依赖类型）
    ↓
PATCH-S02  SelectedUserBar.vue（独立）
PATCH-S03  DefaultAssigneeBar.vue（独立）
    ↓
PATCH-S04  TaskApproveDrawer.vue（依赖 S01 / S02 / S03）
    ↓
PATCH-S05  TaskApproveDrawer iframe 高度（依赖 S04）
```

---

**计划完成，等待确认后开始输出 PATCH-S01。**