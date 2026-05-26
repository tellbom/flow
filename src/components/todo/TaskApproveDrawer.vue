<template>
  <el-drawer
    v-model="drawerVisible"
    :size="drawerWidth"
    direction="rtl"
    destroy-on-close
    :before-close="handleClose"
    class="task-approve-drawer"
  >
    <!-- ══ Header ══ -->
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
              v-if="!readonly"
              :type="priorityMap[taskInfo?.priority]?.type || ''"
              size="small" round
            >{{ priorityMap[taskInfo?.priority]?.label || '普通' }}</el-tag>
            <span class="header-bid">{{ taskInfo?.businessId }}</span>
          </div>
        </div>

        <!-- 右：操作按钮（审批模式）-->
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

    <!-- ══ 主体 ══ -->
    <div class="drawer-body">
      <el-tabs v-model="activeTab" class="drawer-tabs">

        <!-- ─── Tab1：业务表单（iframe）─── -->
        <el-tab-pane label="审批表单" name="form">
          <div class="tab-iframe-wrap">

            <!-- iframe 加载中遮罩 -->
            <div v-if="iframeLoading" class="iframe-loading">
              <el-icon class="spin"><Loading /></el-icon>
              <span>加载业务表单…</span>
            </div>

            <!-- 有 pageUrl：渲染 iframe -->
            <iframe
              v-if="taskInfo?.pageUrl"
              :key="iframeKey"
              :src="taskInfo.pageUrl"
              class="task-iframe"
              :class="{ 'iframe-hidden': iframeLoading }"
              frameborder="0"
              allowfullscreen
              @load="iframeLoading = false"
              @error="handleIframeError"
            />

            <!-- 无 pageUrl 或加载失败：降级占位 -->
            <IframeErrorFallback
              v-if="!taskInfo?.pageUrl || iframeError"
              :title="iframeError ? '页面加载失败' : '暂无业务表单'"
              :desc="iframeError
                ? '业务表单加载出错，请刷新重试或联系管理员'
                : '当前节点未配置业务表单页面'"
              :show-retry="iframeError"
              @retry="reloadIframe"
            />

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
              <span class="fmb-sep" />
              <span class="fmb-item">
                <span class="fmb-label">发起时间</span>
                <span class="fmb-val">{{ formatDate(flowRenderData.createdTime) }}</span>
              </span>
              <span class="fmb-sep" />
              <span class="fmb-item">
                <span class="fmb-label">流程状态</span>
                <el-tag :type="statusTagType(flowRenderData.status)" size="small" round>
                  {{ statusLabel(flowRenderData.status) }}
                </el-tag>
              </span>
            </div>

            <FlowGraph
              :data="flowRenderData"
              :loading="flowDataLoading"
              :error="flowDataError"
            />

          </div>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- ══ 驳回 Dialog ══ -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="填写驳回原因"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-position="top">

        <el-form-item v-if="rejectOptions.length > 1" label="驳回方式" prop="rejectCode">
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

        <el-alert
          v-else-if="rejectOptions.length === 1"
          type="warning" :closable="false" show-icon
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
            type="textarea" :rows="4"
            placeholder="请填写驳回原因（必填）"
            maxlength="500" show-word-limit
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

    <!-- ══ 转派 Dialog ══ -->
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

  </el-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CircleCheck, CircleClose, Switch, View, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAdminInfo } from '/@/stores/adminInfo'
import ContactSelector       from '/@/components/ContactSelector.vue'
import FlowGraph             from './Flowgraph.vue'
import IframeErrorFallback   from './IframeErrorFallback.vue'
import { completeTask, reassignTask } from '/@/api/workflow/processApi'
import { statusTagType, statusLabel, formatDate } from '/@/workflow-shared/workflowUtils.js'
import { businessTypeMap, priorityMap } from '/@/components/todo/workflowConstants'
import { mockOrgList, mockUserList } from '/@/components/todo/mockData.js'

const adminInfo = useAdminInfo()

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  readonly:        { type: Boolean, default: false },
  /**
   * taskInfo — 来自 PendingTaskDto，关键字段：
   *   taskId / taskName / businessId / businessType /
   *   nodeSemantic / pageUrl / priority / createTime /
   *   canReject / rejectOptions
   */
  taskInfo:        { type: Object,  default: null  },
  flowRenderData:  { type: Object,  default: null  },
  flowDataLoading: { type: Boolean, default: false },
  flowDataError:   { type: String,  default: ''    },
})

const emit = defineEmits(['update:modelValue', 'approved', 'rejected', 'reassigned'])

// ── 转派用临时人员数据（方案B：联调期间用 mock，后续接口替换）──
const orgList  = mockOrgList
const userList = mockUserList

// ── Visible ────────────────────────────────────────────────────
const drawerWidth   = '900px'
const drawerVisible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const activeTab = ref('form')

// ── iframe 状态 ────────────────────────────────────────────────
const iframeLoading = ref(true)
const iframeError   = ref(false)
// iframeKey 用于重新加载：+1 触发 Vue 重新渲染 iframe
const iframeKey     = ref(0)

function handleIframeError() {
  iframeLoading.value = false
  iframeError.value   = true
}

function reloadIframe() {
  iframeError.value   = false
  iframeLoading.value = true
  iframeKey.value++
}

// pageUrl 变化时重置 iframe 状态
watch(
  () => props.taskInfo?.pageUrl,
  () => {
    iframeLoading.value = true
    iframeError.value   = false
  }
)

// ── 审批：同意 ────────────────────────────────────────────────
const submitting     = ref('')
const approveComment = ref('')

const handleApprove = async () => {
  submitting.value = 'approve'
  try {
    await completeTask({
      businessId:          props.taskInfo.businessId,
      taskId:              props.taskInfo.taskId,
      action:              1,
      comment:             approveComment.value || undefined,
      nextSlotSelections:  [],   // 全自动模式：选人由 assigneeContract 后端注入
      businessVariables:   {},
    })
    ElMessage.success('审批成功')
    emit('approved')
    drawerVisible.value = false
  } finally {
    submitting.value = ''
  }
}

// ── 审批：驳回 ────────────────────────────────────────────────
const rejectOptions       = computed(() => props.taskInfo?.rejectOptions ?? [])
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
  rejectDialogVisible.value     = true
}

const handleReject = async () => {
  await rejectFormRef.value?.validate()
  submitting.value = 'reject'
  try {
    await completeTask({
      businessId:         props.taskInfo.businessId,
      taskId:             props.taskInfo.taskId,
      action:             2,
      rejectCode:         rejectForm.value.rejectCode,
      rejectReason:       rejectForm.value.rejectReason,
      comment:            rejectForm.value.rejectReason,
      nextSlotSelections: [],
      businessVariables:  {},
    })
    ElMessage.success('已驳回')
    rejectDialogVisible.value = false
    emit('rejected')
    drawerVisible.value = false
  } finally {
    submitting.value = ''
  }
}

// ── 转派 ──────────────────────────────────────────────────────
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

// ── 关闭重置 ──────────────────────────────────────────────────
const handleClose = (done) => {
  approveComment.value          = ''
  rejectForm.value.rejectCode   = ''
  rejectForm.value.rejectReason = ''
  reassignTarget.value          = null
  reassignDialogVisible.value   = false
  iframeLoading.value           = true
  iframeError.value             = false
  activeTab.value               = 'form'
  done()
}
</script>

<!-- ── 全局：Drawer 布局约束 ── -->
<style>
.task-approve-drawer {
  top: 48px !important;
  height: calc(100% - 48px) !important;
}
</style>

<style scoped>
/* ── Drawer 结构 ── */
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
  letter-spacing: -0.3px;
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
  overflow: hidden;
  padding: 0;
}

:deep(.drawer-tabs .el-tab-pane) {
  height: 100%;
}

:deep(.drawer-tabs .el-tabs__item.is-active) {
  color: var(--wf-primary);
  font-weight: var(--wf-font-weight-bold);
}

:deep(.drawer-tabs .el-tabs__active-bar) {
  background: var(--wf-primary);
}

/* ── iframe Tab 容器 ── */
.tab-iframe-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--wf-bg);
}

/* iframe 本体：撑满容器，无边框，无滚动条（业务页面自行处理） */
.task-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: var(--wf-canvas);
}

/* iframe 加载中时隐藏（避免白屏闪烁），但保持渲染以触发 onload */
.task-iframe.iframe-hidden {
  visibility: hidden;
  position: absolute;
}

/* ── iframe 加载中遮罩 ── */
.iframe-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--wf-space-12);
  background: var(--wf-bg);
  font-size: var(--wf-font-base);
  color: var(--wf-ink-3);
  z-index: 10;
}

.spin { animation: rotate 0.7s linear infinite; font-size: 24px; color: var(--wf-primary); }
@keyframes rotate { to { transform: rotate(360deg); } }

/* ── 流程进度 Tab ── */
.tab-pane-content { padding: var(--wf-space-20); }

.flow-tab-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  height: 100%;
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

/* ── 驳回选项 ── */
:deep(.reassign-dialog .el-dialog) { border-radius: var(--wf-radius-xl); }

.reject-options-list { display: flex; flex-direction: column; gap: var(--wf-space-8); }

.reject-option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  border: 1.5px solid var(--wf-border);
  border-radius: var(--wf-radius-md);
  cursor: pointer;
  background: var(--wf-canvas);
  transition: border-color var(--wf-transition-fast), background var(--wf-transition-fast);
}
.reject-option-item:hover      { border-color: var(--wf-ink-disabled); background: var(--wf-bg-card); }
.reject-option-item.is-selected { border-color: var(--wf-primary); background: var(--wf-primary-light); }

.ro-radio {
  width: 16px; height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--wf-ink-disabled);
  flex-shrink: 0; margin-top: 2px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color var(--wf-transition-fast);
}
.reject-option-item.is-selected .ro-radio { border-color: var(--wf-primary); }
.ro-dot   { width: 8px; height: 8px; border-radius: 50%; background: var(--wf-primary); }
.ro-info  { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.ro-label { font-size: var(--wf-font-base); font-weight: var(--wf-font-weight-semibold); color: var(--wf-ink); }
.ro-desc  { font-size: var(--wf-font-xs); color: var(--wf-ink-3); }

/* ── 转派 ── */
.reassign-tip { margin-bottom: var(--wf-space-12); }
</style>
