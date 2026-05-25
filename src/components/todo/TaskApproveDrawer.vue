<template>
  <el-drawer
    v-model="drawerVisible"
    :size="drawerWidth"
    direction="rtl"
    destroy-on-close
    :before-close="handleClose"
    class="task-approve-drawer"
  >
    <!-- ══ 自定义 Header ══ -->
    <template #header>
      <div class="drawer-header">
        <!-- 左：标题区 -->
        <div class="header-title-block">
          <div class="header-task-name">{{ taskInfo?.taskName || '审批任务' }}</div>
          <div class="header-meta">
            <el-tag
              :type="businessTypeMap[taskInfo?.businessType]?.color || 'info'"
              size="small" round effect="plain"
            >{{ businessTypeMap[taskInfo?.businessType]?.label || taskInfo?.businessType }}</el-tag>
            <el-tag
              :type="priorityMap[taskInfo?.priority]?.type || ''"
              size="small" round
              v-if="!readonly"
            >{{ priorityMap[taskInfo?.priority]?.label || '普通' }}</el-tag>
            <span class="header-bid">{{ taskInfo?.businessId }}</span>
          </div>
        </div>

        <!-- 右：操作按钮（审批模式才显示） -->
        <div class="header-actions" v-if="!readonly">
          <el-button
            type="success" :icon="CircleCheck"
            :loading="submitting === 'approve'"
            @click="handleApprove"
          >同意</el-button>
          <el-button
            v-if="taskInfo?.canReject"
            type="danger" :icon="CircleClose"
            :loading="submitting === 'reject'"
            @click="openRejectDialog"
          >驳回</el-button>
          <el-button :icon="Switch" plain @click="reassignDialogVisible = true">转派</el-button>
        </div>

        <!-- 只读标识 -->
        <div class="header-readonly-badge" v-else>
          <el-tag type="info" effect="plain" :icon="View">查看模式</el-tag>
        </div>
      </div>
    </template>

    <!-- ══ 主体内容 ══ -->
    <div class="drawer-body">

      <!-- ══ 标签页 ══ -->
      <el-tabs v-model="activeTab" class="drawer-tabs">

        <!-- ─── Tab1：审批表单 ─── -->
        <el-tab-pane label="审批表单" name="form">
          <div class="tab-pane-content">

            <!-- 业务表单区 -->
            <component
              :is="bizFormComponent"
              ref="approveFormRef"
              :task-info="taskInfo"
              :readonly="readonly"
              :org-list="orgList"
              :user-list="userList"
            />

            <!-- ── 审批意见（审批模式专属）── -->
            <template v-if="!readonly">
              <el-divider content-position="left">
                <span class="divider-text">审批意见</span>
              </el-divider>
              <el-input
                v-model="approveComment"
                type="textarea"
                :rows="3"
                placeholder="填写审批意见（选填）"
                maxlength="500"
                show-word-limit
                class="comment-input"
              />

              <!-- ── 流程变量选择区（有变量定义时才渲染）── -->
              <template v-if="flowVarDefs.length">
                <el-divider content-position="left">
                  <span class="divider-text">流程选项</span>
                </el-divider>
                <div class="flow-var-section">
                  <div
                    v-for="def in flowVarDefs"
                    :key="def.key"
                    class="flow-var-item"
                  >
                    <div class="flow-var-label">{{ def.label }}</div>
                    <el-radio-group
                      v-if="def.component === 'radio'"
                      v-model="flowVars[def.key]"
                    >
                      <el-radio
                        v-for="opt in def.options"
                        :key="String(opt.value)"
                        :value="opt.value"
                      >{{ opt.label }}</el-radio>
                    </el-radio-group>
                    <el-select
                      v-else-if="def.component === 'select'"
                      v-model="flowVars[def.key]"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="opt in def.options"
                        :key="String(opt.value)"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </div>
                </div>
              </template>

              <!-- ── 选人区（激活 Slot 列表）── -->
              <template v-if="activeSlots.length">
                <el-divider content-position="left">
                  <span class="divider-text">选择处理人</span>
                </el-divider>
                <div class="slot-assignee-section">
                  <div
                    v-for="slot in activeSlots"
                    :key="slot.slotKey"
                    class="slot-item"
                  >
                    <SelectedUserBar
                      :users="slotSelections[slot.slotKey] || []"
                      :label="slot.label + (slot.required ? ' *' : '')"
                      @remove="removeSlotUser(slot.slotKey, $event)"
                      @click-add="openSlotSelector(slot)"
                    />
                    <!-- 推荐候选人（表单组件通过 getSlotCandidates 提供）-->
                    <DefaultAssigneeBar
                      v-if="slotCandidates[slot.slotKey]?.length"
                      :candidates="slotCandidates[slot.slotKey]"
                      :used-ids="(slotSelections[slot.slotKey] || []).map(u => u.id ?? u.workNo)"
                      @use-one="useSlotCandidate(slot.slotKey, $event)"
                      @use-all="useAllSlotCandidates(slot.slotKey)"
                    />
                  </div>
                </div>
              </template>
            </template>

            <!-- ── 历史审批记录（只读模式）── -->
            <template v-else>
              <el-divider content-position="left">
                <span class="divider-text">审批记录</span>
              </el-divider>
              <ApprovalHistory :records="flowRenderData?.completedRecords || []" />
            </template>

          </div>
        </el-tab-pane>

        <!-- ─── Tab2：流程进度 ─── -->
        <el-tab-pane label="流程进度" name="flow">
          <div class="tab-pane-content flow-tab-content">

            <!-- 发起信息条 -->
            <div class="flow-meta-bar" v-if="flowRenderData">
              <span class="fmb-item">
                <span class="fmb-label">发起人</span>
                <span class="fmb-val">{{ flowRenderData.createdBy }}</span>
              </span>
              <span class="fmb-sep"></span>
              <span class="fmb-item">
                <span class="fmb-label">发起时间</span>
                <span class="fmb-val">{{ formatDate(flowRenderData.createdTime) }}</span>
              </span>
              <span class="fmb-sep"></span>
              <span class="fmb-item">
                <span class="fmb-label">流程状态</span>
                <StatusTag :status="flowRenderData.status" :show-dot="false" />
              </span>
            </div>

            <!-- ★ 独立流程图子组件 ★ -->
            <FlowGraph
              :data="flowRenderData"
              :loading="flowDataLoading"
              :error="flowDataError"
            />

          </div>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- ══ 驳回对话框 ══ -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="填写驳回原因"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-position="top">

        <!-- 多个驳回选项时展示单选组 -->
        <el-form-item
          v-if="rejectOptions.length > 1"
          label="驳回方式"
          prop="rejectCode"
        >
          <div class="reject-options-list">
            <div
              v-for="opt in rejectOptions"
              :key="opt.rejectCode"
              class="reject-option-item"
              :class="{ 'is-selected': rejectForm.rejectCode === opt.rejectCode }"
              @click="rejectForm.rejectCode = opt.rejectCode"
            >
              <div class="ro-radio">
                <div v-if="rejectForm.rejectCode === opt.rejectCode" class="ro-dot" />
              </div>
              <div class="ro-info">
                <div class="ro-label">{{ opt.label }}</div>
                <div v-if="opt.description" class="ro-desc">{{ opt.description }}</div>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- 仅一个选项时静默预选，展示说明提示 -->
        <el-alert
          v-else-if="rejectOptions.length === 1"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        >
          <template #title>{{ rejectOptions[0].label }}</template>
          <template v-if="rejectOptions[0].description" #default>
            {{ rejectOptions[0].description }}
          </template>
        </el-alert>

        <el-form-item label="驳回原因" prop="rejectReason">
          <el-input
            v-model="rejectForm.rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请填写驳回原因（必填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitting === 'reject'" @click="handleReject">
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <!-- ══ 转派对话框 ══ -->
    <el-dialog
      v-model="reassignDialogVisible"
      title="转派任务"
      width="780px"
      append-to-body
      :close-on-click-modal="false"
      class="reassign-dialog"
    >
      <div class="reassign-tip">
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>转派后，该任务将从您的待办中移除，由新处理人继续审批</template>
        </el-alert>
      </div>
      <ContactSelector
        :org-list="orgList"
        :user-list="userList"
        :multiple="false"
        @confirm="handleReassignConfirm"
        @cancel="reassignDialogVisible = false"
      />
      <template #footer>
        <el-button @click="reassignDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting === 'reassign'"
          :disabled="!reassignTarget"
          @click="handleReassignSubmit"
        >确认转派给 {{ reassignTarget?.name || '' }}</el-button>
      </template>
    </el-dialog>

    <!-- ══ 选人对话框（Slot 选人，Drawer 统一管理）══ -->
    <el-dialog
      v-model="selectorVisible"
      :title="`选择「${activeSelectorSlot?.label || '处理人'}」`"
      width="860px"
      append-to-body
      :close-on-click-modal="false"
      class="slot-selector-dialog"
    >
      <ContactSelector
        :org-list="orgList"
        :user-list="userList"
        :multiple="activeSelectorSlot?.mode === 'multiple'"
        @confirm="handleSlotSelectorConfirm"
        @cancel="selectorVisible = false"
      />
    </el-dialog>

  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, shallowRef } from 'vue'
import {
  CircleCheck, CircleClose, Switch, View
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAdminInfo } from '/@/stores/adminInfo'
import ContactSelector    from '/@/components/ContactSelector.vue'
import MockApproveForm    from './MockApproveForm.vue'
import SelectedUserBar    from './SelectedUserBar.vue'
import DefaultAssigneeBar from './Defaultassigneebar.vue'
import ApprovalHistory    from './ApprovalHistory.vue'
import FlowGraph          from './Flowgraph.vue'
import StatusTag          from '/@/workflow-shared/StatusTag.vue'
import { formatDate }     from '/@/workflow-shared/workflowUtils.js'
import { completeTask, reassignTask } from '/@/api/workflow/processApi'
import { businessTypeMap, priorityMap } from '/@/components/todo/workflowConstants'
import { resolveComponent } from '/@/router/componentRegistry.js'

const adminInfo = useAdminInfo()

const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  readonly:        { type: Boolean, default: false },
  taskInfo:        { type: Object,  default: null  },
  flowRenderData:  { type: Object,  default: null  },
  flowDataLoading: { type: Boolean, default: false },
  flowDataError:   { type: String,  default: ''    },
  orgList:         { type: Array,   default: () => [] },
  userList:        { type: Array,   default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'approved', 'rejected', 'reassigned'])

const drawerWidth = '860px'

const drawerVisible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const activeTab = ref('form')
const approveComment = ref('')
const approveFormRef = ref(null)

const bizFormComponent = shallowRef(MockApproveForm)

watch(
  () => props.taskInfo?.pageCode,
  (pageCode) => {
    bizFormComponent.value = (!pageCode)
      ? MockApproveForm
      : (resolveComponent(pageCode) ?? MockApproveForm)
  },
  { immediate: true }
)

function evaluateCondition(condition, variables) {
  if (!condition) return true
  try {
    const negate = condition.startsWith('!')
    const expr   = negate ? condition.slice(1) : condition
    const sepIdx = expr.indexOf('==') >= 0 ? expr.indexOf('==') : expr.indexOf('=')
    const sepLen = expr.indexOf('==') >= 0 ? 2 : 1
    if (sepIdx < 0) {
      const exists = variables[expr.trim()] != null
      return negate ? !exists : exists
    }
    const varName  = expr.slice(0, sepIdx).trim()
    const expected = expr.slice(sepIdx + sepLen).trim()
    const actual   = String(variables[varName] ?? '')
    const boolMap  = { true: true, false: false }
    const eLower   = expected.toLowerCase()
    const aLower   = actual.toLowerCase()
    const matched  = (eLower in boolMap && aLower in boolMap)
      ? boolMap[aLower] === boolMap[eLower]
      : aLower === eLower
    return negate ? !matched : matched
  } catch {
    return true
  }
}

const flowVarDefs    = ref([])
const flowVars       = ref({})
const slotCandidates = ref({})

watch(approveFormRef, async (formRef) => {
  flowVarDefs.value    = []
  flowVars.value       = {}
  slotCandidates.value = {}
  if (!formRef) return

  const context = {
    taskId:       props.taskInfo?.taskId      ?? '',
    businessId:   props.taskInfo?.businessId  ?? '',
    nodeSemantic: props.taskInfo?.nodeSemantic ?? '',
    pageCode:     props.taskInfo?.pageCode     ?? '',
  }
  await formRef.initFormData?.(context)

  const defs = await formRef.getFlowVariableDefs?.() ?? []
  flowVarDefs.value = defs
  const initial = {}
  defs.forEach(d => { initial[d.key] = d.defaultValue ?? null })
  flowVars.value = initial

  const slots = props.taskInfo?.requiredSlots ?? []
  const candidateResults = await Promise.allSettled(
    slots.map(async slot => ({
      slotKey:    slot.slotKey,
      candidates: await formRef.getSlotCandidates?.(slot.slotKey) ?? [],
    }))
  )
  const candidates = {}
  candidateResults.forEach(r => {
    if (r.status === 'fulfilled' && r.value.candidates.length) {
      candidates[r.value.slotKey] = r.value.candidates
    }
  })
  slotCandidates.value = candidates
})

const activeSlots = computed(() =>
  (props.taskInfo?.requiredSlots ?? []).filter(slot =>
    evaluateCondition(slot.conditionalOn, flowVars.value)
  )
)

const slotSelections = ref({})

watch(() => props.taskInfo, () => {
  const initSel = {}
  ;(props.taskInfo?.requiredSlots ?? []).forEach(s => { initSel[s.slotKey] = [] })
  slotSelections.value = initSel
}, { immediate: true })

watch(activeSlots, (slots) => {
  const activeKeys = new Set(slots.map(s => s.slotKey))
  const cleaned = {}
  Object.keys(slotSelections.value).forEach(key => {
    cleaned[key] = activeKeys.has(key) ? slotSelections.value[key] : []
  })
  slotSelections.value = cleaned
})

const selectorVisible    = ref(false)
const activeSelectorSlot = ref(null)

function openSlotSelector(slot) {
  activeSelectorSlot.value = slot
  selectorVisible.value    = true
}

function handleSlotSelectorConfirm(users) {
  if (!activeSelectorSlot.value) return
  slotSelections.value[activeSelectorSlot.value.slotKey] = users
  selectorVisible.value = false
}

function removeSlotUser(slotKey, user) {
  slotSelections.value[slotKey] =
    (slotSelections.value[slotKey] ?? []).filter(u => u.id !== user.id)
}

function useSlotCandidate(slotKey, candidate) {
  const current = slotSelections.value[slotKey] ?? []
  const uid = candidate.id ?? candidate.workNo
  if (current.some(u => (u.id ?? u.workNo) === uid)) return
  slotSelections.value[slotKey] = [...current, candidate]
}

function useAllSlotCandidates(slotKey) {
  const current  = slotSelections.value[slotKey] ?? []
  const usedIds  = new Set(current.map(u => u.id ?? u.workNo))
  const toAdd    = (slotCandidates.value[slotKey] ?? []).filter(
    c => !usedIds.has(c.id ?? c.workNo)
  )
  slotSelections.value[slotKey] = [...current, ...toAdd]
}

const submitting = ref('')

const handleApprove = async () => {
  for (const slot of activeSlots.value) {
    if (slot.required && !(slotSelections.value[slot.slotKey]?.length)) {
      ElMessage.warning(`请为「${slot.label}」选择处理人`)
      return
    }
  }

  const nextSlotSelections = activeSlots.value.map(slot => ({
    slotKey: slot.slotKey,
    users:   (slotSelections.value[slot.slotKey] ?? []).map(u => u.workNo ?? u.id),
  }))

  const flowPayload = {
    taskId:             props.taskInfo?.taskId     ?? '',
    businessId:         props.taskInfo?.businessId ?? '',
    action:             1,
    comment:            approveComment.value,
    nextSlotSelections,
    businessVariables:  { ...flowVars.value },
  }

  submitting.value = 'approve'
  try {
    const ok = await approveFormRef.value?.submitBusiness?.(flowPayload)
    if (ok === false) return
    await completeTask({
      businessId: props.taskInfo.businessId,
      taskId: props.taskInfo.taskId,
      action: 1,
      comment: approveComment.value,
      nextSlotSelections,
      businessVariables: { ...flowVars.value },
    })
    ElMessage.success('审批成功')
    emit('approved')
    drawerVisible.value = false
  } finally {
    submitting.value = ''
  }
}

const rejectOptions = computed(() => props.taskInfo?.rejectOptions ?? [])

const rejectDialogVisible = ref(false)
const rejectFormRef       = ref(null)
const rejectForm          = ref({ rejectCode: '', rejectReason: '' })
const rejectRules         = {
  rejectCode:   [{ required: true, message: '请选择驳回方式',  trigger: 'change' }],
  rejectReason: [{ required: true, message: '请填写驳回原因',  trigger: 'blur'   }],
}

function openRejectDialog() {
  rejectForm.value.rejectCode   = rejectOptions.value.length === 1
    ? rejectOptions.value[0].rejectCode
    : ''
  rejectForm.value.rejectReason = ''
  rejectDialogVisible.value = true
}

const handleReject = async () => {
  await rejectFormRef.value?.validate()

  const rejectPayload = {
    taskId:             props.taskInfo?.taskId     ?? '',
    businessId:         props.taskInfo?.businessId ?? '',
    action:             2,
    rejectCode:         rejectForm.value.rejectCode,
    rejectReason:       rejectForm.value.rejectReason,
    comment:            rejectForm.value.rejectReason,
    nextSlotSelections: [],
    businessVariables:  {},
  }

  submitting.value = 'reject'
  try {
    const ok = await approveFormRef.value?.submitBusiness?.(rejectPayload)
    if (ok === false) return
    await completeTask({
      businessId: props.taskInfo.businessId,
      taskId: props.taskInfo.taskId,
      action: 2,
      rejectCode: rejectForm.value.rejectCode,
      rejectReason: rejectForm.value.rejectReason,
      comment: rejectForm.value.rejectReason,
    })
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    emit('rejected')
    drawerVisible.value = false
  } finally {
    submitting.value = ''
  }
}

const reassignDialogVisible = ref(false)
const reassignTarget        = ref(null)

const handleReassignConfirm = (users) => {
  reassignTarget.value = users[0] || null
}

const handleReassignSubmit = async () => {
  if (!reassignTarget.value) return
  submitting.value = 'reassign'
  try {
    await reassignTask({
      businessId:   props.taskInfo.businessId,
      taskId:       props.taskInfo.taskId,
      newAssignees: [reassignTarget.value.workNo],
      operatorId:   adminInfo.userid,
    })
    ElMessage.success(`已转派给 ${reassignTarget.value.name}`)
    reassignDialogVisible.value = false
    emit('reassigned', reassignTarget.value)
    drawerVisible.value = false
  } finally {
    submitting.value = ''
  }
}

const handleClose = (done) => {
  approveComment.value          = ''
  rejectForm.value.rejectCode   = ''
  rejectForm.value.rejectReason = ''
  flowVarDefs.value             = []
  flowVars.value                = {}
  slotSelections.value          = {}
  slotCandidates.value          = {}
  selectorVisible.value         = false
  activeSelectorSlot.value      = null
  reassignTarget.value          = null
  activeTab.value               = 'form'
  done()
}

</script>

<style>
.task-approve-drawer {
  top: 48px !important;
  height: calc(100% - 48px) !important;
}
</style>

<style scoped>
/* ── 抽屉整体 ── */
:deep(.el-drawer__header) {
  padding: 0;
  margin-bottom: 0;
  border-bottom: 1px solid var(--wf-divider);
}
:deep(.el-drawer__body) {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  gap: var(--wf-space-16);
  width: 100%;
}

.header-title-block { flex: 1; min-width: 0; }

.header-task-name {
  font-size: var(--wf-font-lg);
  font-weight: var(--wf-font-weight-bold);
  color: var(--wf-ink);
  margin-bottom: var(--wf-space-6);
  letter-spacing: 0;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: var(--wf-space-8);
  flex-wrap: wrap;
}

.header-bid {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-disabled);
  font-family: 'SF Mono', 'Consolas', monospace;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--wf-space-8);
  flex-shrink: 0;
}

:deep(.header-actions .el-button) {
  border-radius: var(--wf-radius-sm);
  font-weight: var(--wf-font-weight-semibold);
}

/* ── 主体 ── */
.drawer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Tabs ── */
.drawer-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.drawer-tabs > .el-tabs__header) {
  margin: 0;
  padding: 0 20px;
  background: var(--wf-canvas);
  border-bottom: 1px solid var(--wf-divider);
  flex-shrink: 0;
}

:deep(.drawer-tabs > .el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

:deep(.drawer-tabs .el-tab-pane)   { height: 100%; }
:deep(.drawer-tabs .el-tabs__item) { font-size: var(--wf-font-md); font-weight: var(--wf-font-weight-medium); }

:deep(.drawer-tabs .el-tabs__item.is-active) {
  color: var(--wf-primary);
  font-weight: var(--wf-font-weight-bold);
}

:deep(.drawer-tabs .el-tabs__active-bar) {
  background: var(--wf-primary);
}

.tab-pane-content { padding: var(--wf-space-20); }

/* ── 审批意见 ── */
.divider-text {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  font-weight: var(--wf-font-weight-semibold);
  letter-spacing: 0.5px;
}

:deep(.el-divider__text) { background: transparent; }

.comment-input { margin-top: var(--wf-space-4); }

:deep(.comment-input .el-textarea__inner) {
  border-radius: var(--wf-radius-md);
}

/* ── 流程变量选择区 ── */
.flow-var-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: var(--wf-space-4);
}

.flow-var-item  { display: flex; flex-direction: column; gap: var(--wf-space-6); }
.flow-var-label {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  font-weight: var(--wf-font-weight-semibold);
  letter-spacing: 0.3px;
}

/* ── 选人区 ── */
.slot-assignee-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: var(--wf-space-4);
}

.slot-item { display: flex; flex-direction: column; gap: var(--wf-space-4); }

/* ── 对话框 ── */
:deep(.reassign-dialog .el-dialog__body)      { padding: 12px 20px; }
:deep(.reassign-dialog .el-dialog)            { border-radius: var(--wf-radius-lg); }
:deep(.slot-selector-dialog .el-dialog)       { border-radius: var(--wf-radius-lg); }

.reassign-tip { margin-bottom: var(--wf-space-12); }

/* ── 驳回选项列表 ── */
.reject-options-list {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-8);
}

.reject-option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border: 1.5px solid var(--wf-border);
  border-radius: var(--wf-radius-md);
  cursor: pointer;
  background: var(--wf-canvas);
  transition: border-color var(--wf-transition-fast),
              background   var(--wf-transition-fast);
}

.reject-option-item:hover {
  border-color: var(--wf-ink-disabled);
  background: var(--wf-bg-card);
}

.reject-option-item.is-selected {
  border-color: var(--wf-primary);
  background: var(--wf-primary-light);
}

.ro-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--wf-ink-disabled);
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color var(--wf-transition-fast);
}

.reject-option-item.is-selected .ro-radio {
  border-color: var(--wf-primary);
}

.ro-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--wf-primary);
}

.ro-info  { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.ro-label { font-size: var(--wf-font-base); font-weight: var(--wf-font-weight-semibold); color: var(--wf-ink); }
.ro-desc  { font-size: var(--wf-font-xs); color: var(--wf-ink-3); }

/* ── 流程进度 Tab ── */
.flow-tab-content {
  padding: var(--wf-space-16) var(--wf-space-20);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.flow-meta-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 20px;
  padding: 10px 16px;
  background: var(--wf-bg-card);
  border-radius: var(--wf-radius-md);
  border: 1px solid var(--wf-divider);
  font-size: var(--wf-font-base);
  flex-shrink: 0;
}

.fmb-item  { display: flex; align-items: center; gap: 7px; }
.fmb-label { color: var(--wf-ink-3); white-space: nowrap; }
.fmb-val   { color: var(--wf-ink); font-weight: var(--wf-font-weight-semibold); }

.fmb-sep   { width: 1px; height: 14px; background: var(--wf-border); }
</style>
