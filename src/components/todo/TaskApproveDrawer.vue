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

        <div class="header-actions" v-if="!readonly">
          <el-button
            type="success" :icon="CircleCheck"
            :loading="submitting === 'approve'"
            :disabled="iframeLocked"
            @click="openApproveDialog"
          >
            <span v-if="iframeLocked">等待表单…</span>
            <span v-else>同意</span>
          </el-button>
          <el-button
            v-if="taskInfo?.canReject"
            type="danger" :icon="CircleClose"
            :loading="submitting === 'reject'"
            @click="openRejectDialog"
          >驳回</el-button>
          <el-button
            v-if="taskInfo?.canReassign"
            :icon="Switch"
            plain
            @click="reassignDialogVisible = true"
          >转派</el-button>
        </div>

        <div class="header-readonly-badge" v-else>
          <el-tag type="info" effect="plain" :icon="View">查看模式</el-tag>
        </div>
      </div>
    </template>

    <!-- ══ 主体 ══ -->
    <div class="drawer-body">
      <el-tabs v-model="activeTab" class="drawer-tabs">

        <!-- ─── Tab1：业务表单 + 选人区 ─── -->
        <el-tab-pane label="审批表单" name="form">
          <div class="tab-form-content">

            <!-- ── iframe 区域 ── -->
            <div ref="iframeSectionEl" class="iframe-section" :class="{ 'is-fullscreen': iframeFullscreen }">
              <div v-if="iframeLoading" class="iframe-loading">
                <el-icon class="spin"><Loading /></el-icon>
                <span>加载业务表单…</span>
              </div>

              <!-- 全屏 / 退出全屏 按钮 -->
              <button
                v-if="taskInfo?.pageUrl && !iframeLoading && !iframeError"
                class="iframe-fs-btn"
                :title="iframeFullscreen ? '退出全屏' : '全屏查看'"
                @click="toggleIframeFullscreen"
              >
                <svg v-if="!iframeFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              </button>

              <iframe
                v-if="taskInfo?.pageUrl"
                ref="iframeEl"
                :key="iframeKey"
                :src="taskInfo.pageUrl"
                class="task-iframe"
                :class="{ 'iframe-hidden': iframeLoading }"
                frameborder="0"
                allowfullscreen
                @load="handleIframeLoad"
                @error="handleIframeError"
              />
              <IframeErrorFallback
                v-if="!taskInfo?.pageUrl || iframeError"
                :title="iframeError ? '页面加载失败' : '暂无业务表单'"
                :desc="iframeError ? '业务表单加载出错，请刷新重试或联系管理员' : '当前节点未配置业务表单页面'"
                :show-retry="iframeError"
                @retry="reloadIframe"
              />
            </div>

            <!-- ── 选人区：手风琴收起 ── -->
            <div
              v-if="!readonly && (gatewayGroups.length || activeSlots.length)"
              class="slot-section"
              :class="{ 'is-collapsed': slotCollapsed }"
            >
              <!-- 折叠头 -->
              <button class="slot-collapse-toggle" @click="slotCollapsed = !slotCollapsed">
                <span class="slot-collapse-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  下一节点处理人
                  <span v-if="totalSelectedCount" class="slot-selected-badge">已选 {{ totalSelectedCount }} 人</span>
                  <span v-if="hasUnfilledRequired" class="slot-required-badge">有未填项</span>
                </span>
                <svg
                  class="slot-collapse-arrow"
                  :class="{ 'is-open': !slotCollapsed }"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" width="16" height="16"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              <!-- 折叠内容 -->
              <div class="slot-collapse-body">
                <div
                  v-for="group in gatewayGroups"
                  :key="group.variable"
                  class="gateway-choice"
                >
                  <div class="gateway-choice__head">
                    <span class="gateway-choice__title">{{ group.label }}</span>
                    <span class="gateway-choice__hint">请选择后查看对应推荐人员</span>
                  </div>
                  <div class="gateway-choice__options">
                    <button
                      v-for="option in group.options"
                      :key="option.value"
                      type="button"
                      class="gateway-choice__option"
                      :class="{ 'is-active': String(flowVars[group.variable] ?? '') === option.value }"
                      @click="selectGatewayOption(group.variable, option.value)"
                    >
                      <span class="gateway-choice__option-main">{{ option.label }}</span>
                      <span v-if="option.slotLabels.length" class="gateway-choice__option-sub">
                        {{ option.slotLabels.join(' / ') }}
                      </span>
                    </button>
                  </div>
                </div>

                <div
                  v-for="slot in activeSlots"
                  :key="slot.slotKey"
                  class="slot-item"
                >
                  <SelectedUserBar
                    :users="slotSelections[slot.slotKey] || []"
                    :label="slot.label + (slot.required ? ' *' : '')"
                    :restrict-to-recommended="slot.restrictToRecommended"
                    :required="slot.required"
                    @remove="removeSlotUser(slot.slotKey, $event)"
                    @click-add="openSlotSelector(slot)"
                  />
                  <DefaultAssigneeBar
                    v-if="getSlotCandidates(slot).length"
                    :candidates="getSlotCandidates(slot)"
                    :used-ids="(slotSelections[slot.slotKey] || []).map(u => u.workNo ?? u.id)"
                    :restrict-to-recommended="slot.restrictToRecommended"
                    :label="slot.label"
                    @use-one="useSlotCandidate(slot.slotKey, $event)"
                    @use-all="useAllSlotCandidates(slot.slotKey)"
                  />
                </div>
              </div>
            </div>

          </div>
        </el-tab-pane>

        <!-- ─── Tab2：流程进度 ─── -->
        <el-tab-pane label="流程进度" name="flow">
          <div class="tab-pane-content flow-tab-content">
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
            <FlowGraph :data="flowRenderData" :loading="flowDataLoading" :error="flowDataError" />
          </div>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- ══ 审批意见 Dialog ══ -->
    <el-dialog
      v-model="approveDialogVisible"
      title="填写审批意见"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
      class="approve-comment-dialog"
    >
      <div class="approve-comment-body">
        <!-- 快捷意见下拉 -->
        <div class="approve-quick-label">快捷意见</div>
        <div class="approve-quick-list">
          <button
            v-for="(q, i) in quickComments"
            :key="i"
            class="approve-quick-item"
            :class="{ 'is-active': approveComment === q }"
            @click="approveComment = q"
          >{{ q }}</button>
        </div>

        <div class="approve-quick-label" style="margin-top: 16px">
          审批意见
          <span class="approve-comment-hint">（选填，最多 500 字）</span>
        </div>
        <el-input
          v-model="approveComment"
          type="textarea"
          :rows="4"
          placeholder="可直接选择上方快捷意见，或在此自行填写…"
          maxlength="500"
          show-word-limit
          resize="none"
        />
      </div>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button
          type="success"
          :icon="CircleCheck"
          :loading="submitting === 'approve'"
          @click="handleApprove"
        >确认同意</el-button>
      </template>
    </el-dialog>

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
          type="warning" :closable="false" show-icon style="margin-bottom: 16px"
        >
          <template #title>{{ rejectOptions[0].label }}</template>
          <template v-if="rejectOptions[0].description" #default>{{ rejectOptions[0].description }}</template>
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

    <!-- ══ 选人 Dialog ══ -->
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { CircleCheck, CircleClose, Switch, View, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAdminInfo } from '/@/stores/adminInfo'
import ContactSelector     from '/@/components/ContactSelector.vue'
import FlowGraph           from './Flowgraph.vue'
import IframeErrorFallback from './IframeErrorFallback.vue'
import SelectedUserBar     from './SelectedUserBar.vue'
import DefaultAssigneeBar  from './Defaultassigneebar.vue'
import { completeTask, reassignTask } from '/@/api/workflow/processApi'
import { statusTagType, statusLabel, formatDate } from '/@/workflow-shared/workflowUtils.js'
import { businessTypeMap, priorityMap } from '/@/components/todo/workflowConstants'
import { mockOrgList, mockUserList } from '/@/components/todo/mockData.js'
import { onIframeEvent } from '/@/utils/iframeBridge'

const adminInfo = useAdminInfo()

// ── Props ──────────────────────────────────────────────────────
const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  readonly:        { type: Boolean, default: false },
  taskInfo:        { type: Object,  default: null  },
  flowRenderData:  { type: Object,  default: null  },
  flowDataLoading: { type: Boolean, default: false },
  flowDataError:   { type: String,  default: ''    },
})

const emit = defineEmits(['update:modelValue', 'approved', 'rejected', 'reassigned'])

const orgList  = mockOrgList
const userList = mockUserList

// ── Visible ────────────────────────────────────────────────────
const drawerWidth   = '920px'
const drawerVisible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const activeTab = ref('form')

// ── iframe 状态 ────────────────────────────────────────────────
const iframeLoading    = ref(true)
const iframeError      = ref(false)
const iframeKey        = ref(0)
const iframeEl         = ref(null)
const iframeSectionEl  = ref(null)
const iframeFullscreen = ref(false)
const iframeLocked     = ref(false)
const iframeFormVars   = ref({})
const iframeFormError  = ref('')
const bridgeUnsubs     = ref([])

function resetBridgeState() {
  bridgeUnsubs.value.forEach(fn => fn())
  bridgeUnsubs.value    = []
  iframeLocked.value    = false
  iframeFormVars.value  = {}
  iframeFormError.value = ''
}

function handleIframeLoad() {
  iframeLoading.value = false
  resetBridgeState()
  if (!iframeEl.value) return

  const unsubLoading = onIframeEvent(iframeEl.value, 'formLoading', () => {
    iframeLocked.value    = true
    iframeFormError.value = ''
  })
  const unsubReady = onIframeEvent(iframeEl.value, 'formReady', (payload) => {
    iframeLocked.value    = false
    iframeFormError.value = ''
    if (payload?.variables && typeof payload.variables === 'object') {
      iframeFormVars.value = payload.variables
    }
  })
  const unsubError = onIframeEvent(iframeEl.value, 'formError', (payload) => {
    iframeLocked.value    = false
    iframeFormError.value = payload?.reason || '业务表单存在错误，请检查后重试'
  })
  bridgeUnsubs.value = [unsubLoading, unsubReady, unsubError]
}

function handleIframeError() {
  iframeLoading.value = false
  iframeError.value   = true
  resetBridgeState()
}

function reloadIframe() {
  iframeError.value      = false
  iframeLoading.value    = true
  iframeFullscreen.value = false
  resetBridgeState()
  iframeKey.value++
}

function getFullscreenElement() {
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
}

async function enterIframeFullscreen() {
  const el = iframeSectionEl.value
  if (!el) {
    iframeFullscreen.value = true
    return
  }

  const requestFullscreen =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.msRequestFullscreen

  if (requestFullscreen) {
    await requestFullscreen.call(el)
  }
  iframeFullscreen.value = true
}

async function exitIframeFullscreen() {
  const exitFullscreen =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen

  if (getFullscreenElement() && exitFullscreen) {
    await exitFullscreen.call(document)
  }
  iframeFullscreen.value = false
}

async function toggleIframeFullscreen() {
  try {
    if (iframeFullscreen.value) {
      await exitIframeFullscreen()
    } else {
      await enterIframeFullscreen()
    }
  } catch {
    iframeFullscreen.value = !iframeFullscreen.value
  }
}

function syncIframeFullscreenState() {
  iframeFullscreen.value = getFullscreenElement() === iframeSectionEl.value
}

watch(() => props.taskInfo?.pageUrl, () => {
  iframeLoading.value    = true
  iframeError.value      = false
  iframeFullscreen.value = false
  resetBridgeState()
})

// ── 选人区折叠 ─────────────────────────────────────────────────
const slotCollapsed = ref(true)

// ══════════════════════════════════════════════════════════════
//  选人区逻辑
// ══════════════════════════════════════════════════════════════

function evaluateCondition(condition, variables) {
  if (!condition) return true
  try {
    const negate = condition.startsWith('!')
    const expr   = negate ? condition.slice(1) : condition
    const eqIdx  = expr.indexOf('==') >= 0 ? expr.indexOf('==') : expr.indexOf('=')
    const eqLen  = expr.indexOf('==') >= 0 ? 2 : 1
    if (eqIdx < 0) {
      const exists = variables[expr.trim()] != null
      return negate ? !exists : exists
    }
    const varName  = expr.slice(0, eqIdx).trim()
    const expected = expr.slice(eqIdx + eqLen).trim()
    const actual   = String(variables[varName] ?? '')
    const boolMap  = { true: true, false: false }
    const eLower   = expected.toLowerCase()
    const aLower   = actual.toLowerCase()
    const matched  = (eLower in boolMap && aLower in boolMap)
      ? boolMap[aLower] === boolMap[eLower]
      : aLower === eLower
    return negate ? !matched : matched
  } catch { return true }
}

const flowVars = ref({})

function parseGatewayCondition(condition) {
  if (!condition) return null
  const expr  = condition.startsWith('!') ? condition.slice(1) : condition
  const eqIdx = expr.indexOf('==') >= 0 ? expr.indexOf('==') : expr.indexOf('=')
  const eqLen = expr.indexOf('==') >= 0 ? 2 : 1
  if (eqIdx < 0) return null
  const variable = expr.slice(0, eqIdx).trim()
  const value    = expr.slice(eqIdx + eqLen).trim()
  if (!variable || !value) return null
  return { variable, value }
}

function gatewayValueLabel(value) {
  const n = String(value).toLowerCase()
  if (n === 'true') return '是'
  if (n === 'false') return '否'
  return String(value)
}

function coerceGatewayValue(value) {
  const n = String(value).toLowerCase()
  if (n === 'true') return true
  if (n === 'false') return false
  return value
}

const gatewayGroups = computed(() => {
  const groupMap = new Map()
  ;(props.taskInfo?.requiredSlots ?? []).forEach(slot => {
    const parsed = parseGatewayCondition(slot.conditionalOn)
    if (!parsed) return
    if (!groupMap.has(parsed.variable)) {
      groupMap.set(parsed.variable, {
        variable: parsed.variable,
        label: `分支选择：${parsed.variable}`,
        options: new Map(),
      })
    }
    const group = groupMap.get(parsed.variable)
    if (!group.options.has(parsed.value)) {
      group.options.set(parsed.value, { value: parsed.value, label: gatewayValueLabel(parsed.value), slotLabels: [] })
    }
    const option = group.options.get(parsed.value)
    const slotLabel = slot.label || slot.slotKey
    if (slotLabel && !option.slotLabels.includes(slotLabel)) option.slotLabels.push(slotLabel)
  })
  return Array.from(groupMap.values()).map(g => ({ ...g, options: Array.from(g.options.values()) }))
})

function selectGatewayOption(variable, value) {
  flowVars.value = { ...flowVars.value, [variable]: coerceGatewayValue(value) }
}

const activeSlots = computed(() =>
  (props.taskInfo?.requiredSlots ?? [])
    .filter(s => evaluateCondition(s.conditionalOn, flowVars.value))
    .map(s => ({
      ...s,
      restrictToRecommended:
        s.restrictToRecommended ?? props.taskInfo?.restrictToRecommended?.[s.slotKey] ?? false,
    }))
)

function getSlotCandidates(slot) {
  const rec    = props.taskInfo?.slotRecommendedUsers ?? {}
  const rawIds = rec[slot.slotKey] ?? []
  const ids    = Array.isArray(rawIds) ? rawIds : []
  return ids.map(id => {
    const workNo = String(id)
    return userList.find(u => u.workNo === workNo || u.id === workNo) ?? { id: workNo, workNo, name: workNo, position: '推荐人员' }
  })
}

// ── 已选人数统计 ──────────────────────────────────────────────
const totalSelectedCount = computed(() =>
  activeSlots.value.reduce((sum, s) => sum + (slotSelections.value[s.slotKey]?.length ?? 0), 0)
)

const hasUnfilledRequired = computed(() =>
  activeSlots.value.some(s => s.required && !(slotSelections.value[s.slotKey]?.length))
)

const slotSelections = ref({})

watch(() => props.taskInfo, () => {
  const init = {}
  ;(props.taskInfo?.requiredSlots ?? []).forEach(s => { init[s.slotKey] = [] })
  slotSelections.value = init
  flowVars.value       = {}
  slotCollapsed.value  = true
  resetBridgeState()
}, { immediate: true })

watch(activeSlots, (slots) => {
  const activeKeys = new Set(slots.map(s => s.slotKey))
  const cleaned    = {}
  Object.keys(slotSelections.value).forEach(key => {
    cleaned[key] = activeKeys.has(key) ? slotSelections.value[key] : []
  })
  slotSelections.value = cleaned
})

function removeSlotUser(slotKey, user) {
  slotSelections.value[slotKey] =
    (slotSelections.value[slotKey] ?? []).filter(u => (u.workNo ?? u.id) !== (user.workNo ?? user.id))
}

function useSlotCandidate(slotKey, candidate) {
  const current = slotSelections.value[slotKey] ?? []
  const uid = candidate.workNo ?? candidate.id
  if (current.some(u => (u.workNo ?? u.id) === uid)) return
  slotSelections.value[slotKey] = [...current, candidate]
}

function useAllSlotCandidates(slotKey) {
  const slot       = activeSlots.value.find(s => s.slotKey === slotKey)
  if (!slot) return
  const candidates = getSlotCandidates(slot)
  const current    = slotSelections.value[slotKey] ?? []
  const usedIds    = new Set(current.map(u => u.workNo ?? u.id))
  const toAdd      = candidates.filter(c => !usedIds.has(c.workNo ?? c.id))
  slotSelections.value[slotKey] = [...current, ...toAdd]
}

const selectorVisible    = ref(false)
const activeSelectorSlot = ref(null)

function openSlotSelector(slot) {
  if (slot.restrictToRecommended) return
  activeSelectorSlot.value = slot
  selectorVisible.value    = true
}

function handleSlotSelectorConfirm(users) {
  if (!activeSelectorSlot.value) return
  slotSelections.value[activeSelectorSlot.value.slotKey] = users
  selectorVisible.value = false
}

// ── 审批：同意 ────────────────────────────────────────────────
const submitting          = ref('')
const approveComment      = ref('')
const approveDialogVisible = ref(false)

// 常用快捷审批意见
const quickComments = [
  '同意',
  '情况属实，同意',
  '已审阅，同意办理',
  '符合规定，同意',
  '经核实，同意',
]

// 点"同意"按钮：先做前置校验，通过后弹意见框
function openApproveDialog() {
  // bridge 错误拦截
  if (iframeFormError.value) {
    ElMessage.warning(iframeFormError.value)
    return
  }

  // 网关校验（需要在意见框之前，避免用户填完意见才发现分支没选）
  for (const group of gatewayGroups.value) {
    if (flowVars.value[group.variable] == null || flowVars.value[group.variable] === '') {
      ElMessage.warning(`请选择「${group.label}」`)
      return
    }
  }

  // 选人校验
  for (const slot of activeSlots.value) {
    const selected = slotSelections.value[slot.slotKey] ?? []
    if (slot.required && selected.length === 0) {
      // 有未填项时自动展开选人区
      slotCollapsed.value = false
      ElMessage.warning(`「${slot.label}」至少需要选择 1 人`)
      return
    }
    if (slot.restrictToRecommended && selected.length > 0) {
      const candidateIds = new Set(getSlotCandidates(slot).map(u => u.workNo ?? u.id))
      const invalid = selected.filter(u => !candidateIds.has(u.workNo ?? u.id))
      if (invalid.length > 0) {
        slotCollapsed.value = false
        ElMessage.warning(`「${slot.label}」只能从推荐人中选择，请移除：${invalid.map(u => u.name).join('、')}`)
        return
      }
    }
  }

  // 所有前置校验通过，弹审批意见框
  approveComment.value       = ''
  approveDialogVisible.value = true
}

// 确认同意（意见框里提交）
const handleApprove = async () => {
  // 合并 iframe 业务变量
  if (Object.keys(iframeFormVars.value).length) {
    flowVars.value = { ...iframeFormVars.value, ...flowVars.value }
  }

  submitting.value = 'approve'
  try {
    await completeTask({
      businessId:   props.taskInfo.businessId,
      taskId:       props.taskInfo.taskId,
      action:       1,
      comment:      approveComment.value || undefined,
      nextSlotSelections: activeSlots.value.map(slot => ({
        slotKey: slot.slotKey,
        users:   (slotSelections.value[slot.slotKey] ?? []).map(u => u.workNo ?? u.id),
      })),
      businessVariables: Object.keys(flowVars.value).length ? { ...flowVars.value } : undefined,
    })
    ElMessage.success('审批成功')
    approveDialogVisible.value = false
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
  rejectForm.value.rejectCode   = rejectOptions.value.length === 1 ? rejectOptions.value[0].rejectCode : ''
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

const handleReassignConfirm = (users) => { reassignTarget.value = users[0] || null }

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
  approveDialogVisible.value    = false
  rejectForm.value.rejectCode   = ''
  rejectForm.value.rejectReason = ''
  reassignTarget.value          = null
  reassignDialogVisible.value   = false
  selectorVisible.value         = false
  activeSelectorSlot.value      = null
  slotSelections.value          = {}
  flowVars.value                = {}
  iframeLoading.value           = true
  iframeError.value             = false
  if (getFullscreenElement() === iframeSectionEl.value) {
    exitIframeFullscreen()
  }
  iframeFullscreen.value        = false
  slotCollapsed.value           = true
  resetBridgeState()
  activeTab.value               = 'form'
  done()
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncIframeFullscreenState)
  document.addEventListener('webkitfullscreenchange', syncIframeFullscreenState)
  document.addEventListener('MSFullscreenChange', syncIframeFullscreenState)
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncIframeFullscreenState)
  document.removeEventListener('webkitfullscreenchange', syncIframeFullscreenState)
  document.removeEventListener('MSFullscreenChange', syncIframeFullscreenState)
  if (getFullscreenElement() === iframeSectionEl.value) {
    exitIframeFullscreen()
  }
  resetBridgeState()
})
</script>

<style>
.task-approve-drawer {
  top: 48px !important;
  height: calc(100% - 48px) !important;
}
/* 审批意见 dialog 圆角 */
.approve-comment-dialog .el-dialog { border-radius: 14px; }
.task-approve-drawer .el-drawer__header {
  padding: 0;
  margin-bottom: 0 !important;
  border-bottom: 1px solid var(--wf-divider);
  min-height: 85px;
  flex-shrink: 0;
}
.task-approve-drawer .el-drawer__body {
  padding: 0 !important;
  overflow: hidden !important;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

</style>

<style scoped>
/* ── Drawer 结构 ── */
:deep(.el-drawer__body)   { padding: 0; overflow: hidden; display: flex; flex-direction: column; }

/* ── Header ── */
.drawer-header      { display: flex; align-items: center; justify-content: space-between; padding: 8px 20px; gap: var(--wf-space-16); width: 100%; min-height: 68px; }
.header-title-block { flex: 1; min-width: 0; }
.header-task-name   { font-size: var(--wf-font-lg); font-weight: var(--wf-font-weight-bold); color: var(--wf-ink); margin-bottom: 2px; letter-spacing: -0.3px; line-height: 1.25; }
.header-meta        { display: flex; align-items: center; gap: var(--wf-space-8); flex-wrap: wrap; }
.header-bid         { font-size: var(--wf-font-sm); color: var(--wf-ink-disabled); font-family: 'SF Mono', 'Consolas', monospace; }
.header-actions     { display: flex; align-items: center; gap: var(--wf-space-8); flex-shrink: 0; }
:deep(.header-actions .el-button) { border-radius: var(--wf-radius-sm); font-weight: var(--wf-font-weight-semibold); }

/* ── 主体 ── */
.drawer-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }

/* ── Tabs ── */
.drawer-tabs { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
:deep(.drawer-tabs > .el-tabs__header)      { margin: 0; padding: 0 20px; background: var(--wf-canvas); border-bottom: 1px solid var(--wf-divider); flex-shrink: 0; }
:deep(.drawer-tabs > .el-tabs__header .el-tabs__nav-wrap) { min-height: 34px; }
:deep(.drawer-tabs > .el-tabs__header .el-tabs__item) { height: 34px; line-height: 34px; }
:deep(.drawer-tabs > .el-tabs__content)     { flex: 1; min-height: 0; overflow: hidden; padding: 0; }
:deep(.drawer-tabs .el-tab-pane)            { height: 100%; min-height: 0; }
:deep(.drawer-tabs .el-tabs__item.is-active){ color: var(--wf-primary); font-weight: var(--wf-font-weight-bold); }
:deep(.drawer-tabs .el-tabs__active-bar)    { background: var(--wf-primary); }

/* ── Tab1 整体 ── */
.tab-form-content {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;        /* 必须 hidden，子区块在容器内部分配高度，不允许父容器自身撑高 */
}

/* ── iframe 区域 ──
   flex:1 撑满父容器剩余空间。
   选人区(flex-shrink:0 固定高度)展开时 iframe 自动缩小让出空间；
   选人区不存在或收起时 iframe 占满全部高度。
   min-height 防止选人区过高把 iframe 完全挤没。
── */
.iframe-section {
  position: relative;
  flex: 1 1 0;
  min-height: 220px;
  width: 100%;
  background: var(--wf-bg);
  overflow: hidden;
}

/* 全屏：覆盖 drawer body 范围 */
.iframe-section.is-fullscreen,
.iframe-section:fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  background: var(--wf-canvas);
}

/* 全屏按钮 */
.iframe-fs-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: rgba(0,0,0,0.45);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
  padding: 0;
}
.iframe-section:hover .iframe-fs-btn { opacity: 1; }
.iframe-section.is-fullscreen .iframe-fs-btn { opacity: 1; }
.iframe-fs-btn:hover { background: rgba(0,0,0,0.65); }

.task-iframe            { width: 100%; height: 100%; border: none; display: block; background: var(--wf-canvas); }
.task-iframe.iframe-hidden { visibility: hidden; position: absolute; }

.iframe-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: var(--wf-space-12);
  background: var(--wf-bg);
  font-size: var(--wf-font-base); color: var(--wf-ink-3); z-index: 10;
}
.spin { animation: rotate 0.7s linear infinite; font-size: 24px; color: var(--wf-primary); }
@keyframes rotate { to { transform: rotate(360deg); } }

/* ── 选人区手风琴 ──
   flex-shrink:0 不参与压缩，固定占据自身高度；
   展开上限收小，给 iframe 留出足够空间。
── */
.slot-section {
  flex-shrink: 0;
  border-top: 1px solid var(--wf-divider);
  background: var(--wf-canvas);
  overflow: hidden;
  transition: max-height 0.28s ease;
  max-height: 206px;    /* 展开上限；收起时覆盖为 42px */
}
.slot-section.is-collapsed {
  max-height: 55px;         /* 只露出折叠头 */
}

/* 折叠头 */
.slot-collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px;
  height: 42px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  border-bottom: 1px solid var(--wf-divider);
  flex-shrink: 0;
}
.slot-section.is-collapsed .slot-collapse-toggle { border-bottom-color: transparent; }
.slot-collapse-toggle:hover { background: var(--wf-bg-card); }

.slot-collapse-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink-3);
  letter-spacing: 0.3px;
}
.slot-selected-badge {
  background: var(--wf-primary-light);
  color: var(--wf-primary);
  border-radius: 9999px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
}
.slot-required-badge {
  background: #fff3cd;
  color: #856404;
  border-radius: 9999px;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
}
.slot-collapse-arrow {
  transition: transform 0.22s ease;
  color: var(--wf-ink-3);
  flex-shrink: 0;
}
.slot-collapse-arrow.is-open { transform: rotate(180deg); }

/* 折叠内容 */
.slot-collapse-body {
  padding: var(--wf-space-8) var(--wf-space-20) var(--wf-space-12);
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-8);
  overflow-y: auto;
  max-height: calc(206px - 42px);   /* 与 slot-section 展开上限对齐 */
}

.slot-item { display: flex; flex-direction: column; gap: var(--wf-space-4); }

/* ── 审批意见 Dialog 内容 ── */
.approve-comment-body   { display: flex; flex-direction: column; gap: 8px; }
.approve-quick-label    { font-size: 13px; font-weight: 600; color: var(--wf-ink-3); }
.approve-comment-hint   { font-weight: 400; color: var(--wf-ink-disabled); margin-left: 4px; }
.approve-quick-list     { display: flex; flex-wrap: wrap; gap: 8px; }
.approve-quick-item {
  padding: 5px 14px;
  border: 1.5px solid var(--wf-border);
  border-radius: 9999px;
  background: var(--wf-canvas);
  color: var(--wf-ink-80, var(--wf-ink));
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  white-space: nowrap;
}
.approve-quick-item:hover   { border-color: var(--wf-primary-border); background: var(--wf-primary-light); }
.approve-quick-item.is-active {
  border-color: var(--wf-primary);
  background: var(--wf-primary-light);
  color: var(--wf-primary);
  font-weight: 600;
}

/* ── 流程进度 Tab ── */
.tab-pane-content { padding: var(--wf-space-20); }
.flow-tab-content { display: flex; flex-direction: column; gap: 14px; overflow-y: auto; height: 100%; }
.flow-meta-bar    { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 20px; padding: 10px 16px; background: var(--wf-bg-card); border-radius: var(--wf-radius-md); border: 1px solid var(--wf-divider); font-size: var(--wf-font-base); flex-shrink: 0; }
.fmb-item  { display: flex; align-items: center; gap: 7px; }
.fmb-label { color: var(--wf-ink-3); white-space: nowrap; }
.fmb-val   { color: var(--wf-ink); font-weight: var(--wf-font-weight-semibold); }
.fmb-sep   { width: 1px; height: 14px; background: var(--wf-border); }

/* ── Dialogs ── */
:deep(.reassign-dialog .el-dialog)       { border-radius: var(--wf-radius-xl); }
:deep(.slot-selector-dialog .el-dialog)  { border-radius: var(--wf-radius-xl); }
.reject-options-list  { display: flex; flex-direction: column; gap: var(--wf-space-8); }
.reject-option-item   { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border: 1.5px solid var(--wf-border); border-radius: var(--wf-radius-md); cursor: pointer; background: var(--wf-canvas); transition: border-color var(--wf-transition-fast), background var(--wf-transition-fast); }
.reject-option-item:hover        { border-color: var(--wf-ink-disabled); background: var(--wf-bg-card); }
.reject-option-item.is-selected  { border-color: var(--wf-primary); background: var(--wf-primary-light); }
.ro-radio { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--wf-ink-disabled); flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: border-color var(--wf-transition-fast); }
.reject-option-item.is-selected .ro-radio { border-color: var(--wf-primary); }
.ro-dot  { width: 8px; height: 8px; border-radius: 50%; background: var(--wf-primary); }
.ro-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.ro-label { font-size: var(--wf-font-base); font-weight: var(--wf-font-weight-semibold); color: var(--wf-ink); }
.ro-desc  { font-size: var(--wf-font-xs); color: var(--wf-ink-3); }
.reassign-tip { margin-bottom: var(--wf-space-12); }

/* ── 网关选择 ── */
.gateway-choice           { display: flex; flex-direction: column; gap: var(--wf-space-8); padding: var(--wf-space-12); border: 1px solid var(--wf-border); border-radius: var(--wf-radius-md); background: var(--wf-bg-section); }
.gateway-choice__head     { display: flex; align-items: center; justify-content: space-between; gap: var(--wf-space-12); }
.gateway-choice__title    { font-size: var(--wf-font-sm); font-weight: var(--wf-font-weight-bold); color: var(--wf-ink); }
.gateway-choice__hint     { font-size: var(--wf-font-xs); color: var(--wf-ink-3); white-space: nowrap; }
.gateway-choice__options  { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--wf-space-8); }
.gateway-choice__option   { min-height: 52px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; padding: var(--wf-space-8) var(--wf-space-12); border: 1px solid var(--wf-border); border-radius: var(--wf-radius-sm); background: var(--wf-canvas); color: var(--wf-ink); cursor: pointer; font-family: inherit; text-align: left; transition: border-color var(--wf-transition-fast), background var(--wf-transition-fast), box-shadow var(--wf-transition-fast); }
.gateway-choice__option:hover    { border-color: var(--wf-primary-border); background: var(--wf-primary-light); }
.gateway-choice__option.is-active{ border-color: var(--wf-primary); background: var(--wf-primary-light); box-shadow: 0 0 0 2px var(--wf-primary-border); }
.gateway-choice__option-main { font-size: var(--wf-font-base); font-weight: var(--wf-font-weight-bold); line-height: var(--wf-line-height-tight); }
.gateway-choice__option-sub  { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--wf-font-xs); color: var(--wf-ink-3); }
</style>
