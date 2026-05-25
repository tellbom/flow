<template>
  <el-drawer
    v-model="drawerVisible"
    size="860px"
    direction="rtl"
    destroy-on-close
    class="avd-drawer"
  >
    <!-- ══ Header ══ -->
    <template #header>
      <div class="avd-header">
        <div class="avd-header-left">
          <div class="avd-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="avd-header-text">
            <div class="avd-title">{{ appInfo?.title || '申请详情' }}</div>
            <div class="avd-meta">
              <span>{{ appInfo?.applicant }}</span>
              <span v-if="appInfo?.department" class="avd-sep">·</span>
              <span v-if="appInfo?.department">{{ appInfo?.department }}</span>
              <span class="avd-sep">·</span>
              <span>{{ appInfo?.createdTime }}</span>
            </div>
          </div>
        </div>
        <StatusTag
          :status="appInfo?.status"
          size="large"
          class="avd-status-tag"
        />
      </div>
    </template>

    <!-- ══ Body ══ -->
    <div class="avd-body">

      <!-- ── 流程图 ── -->
      <div class="avd-section-card">
        <div class="avd-section-title">
          <el-icon><Share /></el-icon>流程进度
        </div>
        <div class="avd-flow-wrap">
          <div v-if="flowLoading" class="avd-loading">
            <el-icon class="spin"><Loading /></el-icon>加载流程图…
          </div>
          <FlowGraph v-else-if="flowData" :data="flowData" class="avd-flow-graph" />
          <div v-else class="avd-empty-sm">暂无流程数据</div>
        </div>
      </div>

      <!-- ── 节点 Tabs ── -->
      <div class="avd-section-card">
        <div class="avd-section-title">
          <el-icon><List /></el-icon>各节点填写情况
        </div>

        <!-- 节点列表加载中 -->
        <div v-if="nodesLoading" class="avd-loading">
          <el-icon class="spin"><Loading /></el-icon>加载节点信息…
        </div>

        <!-- 无节点 -->
        <div v-else-if="!nodes.length" class="avd-empty">
          <el-icon><Tickets /></el-icon>
          <span>暂无节点数据</span>
        </div>

        <!-- Tabs -->
        <el-tabs
          v-else
          v-model="activeTab"
          class="avd-tabs"
          type="card"
        >
          <el-tab-pane
            v-for="node in nodes"
            :key="node.nodeKey"
            :name="node.nodeKey"
          >
            <!-- ── Tab 标签 ── -->
            <template #label>
              <div class="tab-label">
                <span class="tab-dot" :class="node.completedAt ? 'dot-done' : 'dot-pending'" />
                <span>{{ node.nodeName }}</span>
                <span v-if="node.operator" class="tab-operator">{{ node.operator }}</span>
              </div>
            </template>

            <!-- ── Tab 内容 ── -->
            <div class="tab-content">

              <!-- 未完成：占位，不挂载表单组件 -->
              <div v-if="!node.completedAt" class="snap-pending">
                <div class="sp-icon-wrap"><el-icon><Clock /></el-icon></div>
                <div class="sp-text">该节点尚未完成</div>
                <div class="sp-hint">流程当前正在此节点处理中</div>
              </div>

              <!-- 已完成：信息条 + 表单组件 -->
              <template v-else>
                <!-- 节点信息条 -->
                <div class="snap-info-bar">
                  <div class="sib-item">
                    <el-icon><User /></el-icon>
                    <span>{{ node.operator }}</span>
                  </div>
                  <div class="sib-sep" />
                  <div class="sib-item">
                    <el-icon><Clock /></el-icon>
                    <span>{{ node.completedAt }}</span>
                  </div>
                  <template v-if="node.approveComment">
                    <div class="sib-sep" />
                    <div class="sib-item sib-comment">
                      <el-icon><ChatDotRound /></el-icon>
                      <span>{{ node.approveComment }}</span>
                    </div>
                  </template>
                </div>

                <!-- 无对应组件 -->
                <div v-if="!getComponent(node.viewComponentPath)" class="avd-empty-sm">
                  暂无表单组件
                </div>

                <!-- 表单只读渲染区 -->
                <div v-else class="view-form-wrap">
                  <component
                    :is="getComponent(node.viewComponentPath)"
                    :ref="el => setNodeRef(el, node.nodeKey)"
                    :task-info="{ taskId: node.nodeKey, taskName: node.nodeName, businessId: appInfo?.businessId ?? '' }"
                    :readonly="true"
                  />
                </div>

              </template>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import {
  Document, Share, List, Loading, Tickets,
  User, Clock, ChatDotRound,
} from '@element-plus/icons-vue'
import FlowGraph from './Flowgraph.vue'
import StatusTag from '/@/workflow-shared/StatusTag.vue'
import { resolveComponent } from '/@/router/componentRegistry.js'

// ─────────────────────────────────────────────────
//  Props / Emits
// ─────────────────────────────────────────────────
const props = defineProps({
  modelValue:   { type: Boolean, default: false },
  /**
   * 申请行基础信息
   * { businessId, title, applicant, createdTime, status }
   */
  appInfo:      { type: Object,  default: null  },
  flowData:     { type: Object,  default: null  },
  flowLoading:  { type: Boolean, default: false },
  /**
   * 节点列表
   * [{
   *   nodeKey, nodeName, viewComponentPath,
   *   operator, completedAt, approveComment
   * }]
   */
  nodes:        { type: Array,   default: () => [] },
  nodesLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const drawerVisible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

// ─────────────────────────────────────────────────
//  组件解析
// ─────────────────────────────────────────────────
function getComponent(path) {
  return resolveComponent(path) ?? null
}

// ─────────────────────────────────────────────────
//  节点表单组件 ref 池
//  key = nodeKey，value = 组件实例（或 null）
//  通过 :ref="el => setNodeRef(el, node.nodeKey)" 收集
// ─────────────────────────────────────────────────
const nodeRefs = ref({})

function setNodeRef(el, nodeKey) {
  if (el) {
    nodeRefs.value[nodeKey] = el
  } else {
    delete nodeRefs.value[nodeKey]
  }
}

const initializedKeys = ref(new Set())

// ─────────────────────────────────────────────────
//  组件挂载后触发 initFormData
//  watch nodeRefs 中每个新增 key，一旦拿到 ref 就调初始化
//  同一个 nodeKey 只初始化一次（已初始化的 key 记录在 initializedKeys）
// ─────────────────────────────────────────────────
watch(nodeRefs, async (refs) => {
  for (const [nodeKey, formRef] of Object.entries(refs)) {
    if (!formRef || initializedKeys.value.has(nodeKey)) continue

    const node = props.nodes.find(n => n.nodeKey === nodeKey)
    if (!node) continue

    initializedKeys.value.add(nodeKey)

    const context = {
      taskId:       nodeKey,
      businessId:   props.appInfo?.businessId ?? '',
      nodeSemantic: node.nodeSemantic ?? '',
      pageCode:     node.viewComponentPath    ?? '',
    }

    await nextTick()
    await formRef.initFormData?.(context)
  }
}, { deep: true })

// 抽屉关闭时重置，确保下次打开重新初始化
watch(() => props.modelValue, (visible) => {
  if (!visible) {
    nodeRefs.value        = {}
    initializedKeys.value = new Set()
    activeTab.value       = ''
  }
})

const activeTab = ref('')

// ─────────────────────────────────────────────────
//  Tab 切换
// ─────────────────────────────────────────────────
watch(
  () => [props.modelValue, props.nodes],
  ([visible, list]) => {
    if (!visible || !list?.length) return
    // 默认选中第一个已完成节点，没有则选第一个
    const first = list.find(n => n.completedAt) ?? list[0]
    activeTab.value = first.nodeKey
  },
  { immediate: true, deep: true }
)

</script>

<style>
.avd-drawer {
  top: 48px !important;
  height: calc(100% - 48px) !important;
}
</style>

<style scoped>
/* ── Drawer 结构 ── */
:deep(.avd-drawer .el-drawer__header) {
  padding: 0;
  margin: 0;
  border-bottom: 1px solid var(--wf-divider);
}

:deep(.avd-drawer .el-drawer__body) {
  padding: 0;
  background: var(--wf-bg);
  overflow-y: auto;
}

/* ── Header ── */
.avd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wf-space-16);
  padding: 14px 20px;
  background: var(--wf-canvas);
}

.avd-header-left {
  display: flex;
  align-items: center;
  gap: var(--wf-space-12);
  min-width: 0;
}

.avd-header-text { min-width: 0; }

.avd-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--wf-radius-md);
  background: var(--wf-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avd-icon .el-icon {
  font-size: 18px;
  color: var(--wf-primary);
}

.avd-title {
  font-size: var(--wf-font-lg);
  font-weight: var(--wf-font-weight-bold);
  color: var(--wf-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avd-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--wf-space-4);
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  margin-top: 2px;
}

.avd-sep        { color: var(--wf-border); }
.avd-status-tag { flex-shrink: 0; }

.tab-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}

.dot-done      { background: var(--wf-success); }
.dot-pending   { background: var(--wf-neutral); }

/* ── Body ── */
.avd-body {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-12);
  padding: var(--wf-space-16);
}

/* ── Section 卡片 ── */
.avd-section-card {
  background: var(--wf-canvas);
  border-radius: var(--wf-radius-lg);
  padding: var(--wf-space-16);
  box-shadow: var(--wf-shadow-card);
}

.avd-section-title {
  display: flex;
  align-items: center;
  gap: var(--wf-space-6);
  font-size: var(--wf-font-base);
  font-weight: var(--wf-font-weight-bold);
  color: var(--wf-ink-2);
  margin-bottom: 10px;
}

.avd-section-title .el-icon {
  font-size: 14px;
  color: var(--wf-primary);
}

/* ── 流程图区 ── */
.avd-flow-wrap {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avd-flow-graph { width: 100%; }

/* ── Tabs ── */
.avd-tabs {
  --el-color-primary: var(--wf-primary);
}

:deep(.avd-tabs .el-tabs__header) {
  margin-bottom: 0;
  overflow: hidden;
}
:deep(.avd-tabs .el-tabs__nav-wrap)        { overflow: hidden; }
:deep(.avd-tabs .el-tabs__nav-wrap::after) { display: none; }

:deep(.avd-tabs .el-tabs__nav-scroll) {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--wf-border) transparent;
}
:deep(.avd-tabs .el-tabs__nav-scroll::-webkit-scrollbar)       { height: 3px; }
:deep(.avd-tabs .el-tabs__nav-scroll::-webkit-scrollbar-track) { background: transparent; }
:deep(.avd-tabs .el-tabs__nav-scroll::-webkit-scrollbar-thumb) {
  background: var(--wf-border);
  border-radius: 2px;
}

:deep(.avd-tabs.el-tabs--card .el-tabs__nav) {
  border-color: var(--wf-border);
  border-radius: var(--wf-radius-sm) var(--wf-radius-sm) 0 0;
  white-space: nowrap;
  float: none;
  display: inline-flex;
}

:deep(.avd-tabs.el-tabs--card .el-tabs__item) {
  border-color: var(--wf-border);
  font-size: var(--wf-font-base);
  padding: 0 16px;
  height: 40px;
  line-height: 40px;
  color: var(--wf-ink-2);
  transition: background var(--wf-transition-fast),
              color     var(--wf-transition-fast);
  flex-shrink: 0;
}

:deep(.avd-tabs.el-tabs--card .el-tabs__item.is-active) {
  background: var(--wf-primary-light);
  color: var(--wf-primary);
  border-bottom-color: var(--wf-primary-light);
  font-weight: var(--wf-font-weight-semibold);
}

:deep(.avd-tabs.el-tabs--card .el-tabs__item:hover:not(.is-active)) {
  color: var(--wf-primary);
  background: var(--wf-bg);
}

/* Tab 标签内部 */
.tab-label {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.tab-operator {
  font-size: var(--wf-font-xs);
  color: var(--wf-ink-3);
  background: var(--wf-bg-section);
  padding: 1px 6px;
  border-radius: var(--wf-radius-pill);
  font-weight: var(--wf-font-weight-normal);
}

:deep(.avd-tabs.el-tabs--card .el-tabs__item.is-active .tab-operator) {
  background: var(--wf-primary-light);
  color: var(--wf-primary);
}

/* ── Tab 内容区 ── */
.tab-content {
  border: 1px solid var(--wf-border);
  border-top: none;
  border-radius: 0 0 var(--wf-radius-sm) var(--wf-radius-sm);
  background: var(--wf-canvas);
  overflow: hidden;
}

/* 节点信息条 */
.snap-info-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--wf-space-4);
  padding: 10px 16px;
  background: var(--wf-bg-section);
  border-bottom: 1px solid var(--wf-divider);
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-2);
}

.sib-item             { display: flex; align-items: center; gap: var(--wf-space-4); }
.sib-item .el-icon    { font-size: 13px; color: var(--wf-ink-3); }
.sib-sep              { width: 1px; height: 12px; background: var(--wf-border); margin: 0 var(--wf-space-4); }
.sib-comment          { flex: 1; min-width: 0; font-style: italic; }

/* 未完成占位 */
.snap-pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--wf-space-8);
  padding: var(--wf-space-48) var(--wf-space-20);
}

.sp-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--wf-bg-section);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sp-icon-wrap .el-icon { font-size: 24px; color: var(--wf-ink-disabled); }
.sp-text               { font-size: var(--wf-font-md); font-weight: var(--wf-font-weight-semibold); color: var(--wf-ink-2); }
.sp-hint               { font-size: var(--wf-font-sm); color: var(--wf-ink-3); }

/* ── 表单只读区 ── */
.view-form-wrap :deep(.el-input__wrapper),
.view-form-wrap :deep(.el-textarea__wrapper) {
  pointer-events: none;
  background: var(--wf-bg-section) !important;
  box-shadow: 0 0 0 1px var(--wf-border) inset !important;
}

.view-form-wrap :deep(.el-input__inner),
.view-form-wrap :deep(.el-textarea__inner) {
  -webkit-text-fill-color: var(--wf-ink) !important;
  color: var(--wf-ink) !important;
  cursor: default;
}

.view-form-wrap :deep(.el-select),
.view-form-wrap :deep(.el-date-editor),
.view-form-wrap :deep(.el-date-picker) {
  pointer-events: none;
}

.view-form-wrap :deep(.el-select__wrapper),
.view-form-wrap :deep(.el-select .el-input__wrapper) {
  background: var(--wf-bg-section) !important;
  box-shadow: 0 0 0 1px var(--wf-border) inset !important;
}

.view-form-wrap :deep(.el-select__caret),
.view-form-wrap :deep(.el-input__suffix),
.view-form-wrap :deep(.el-range__close-icon) {
  display: none !important;
}

.view-form-wrap :deep(.el-button) {
  pointer-events: none;
  opacity: 0.4;
}

.view-form-wrap :deep(.avd-allow) {
  pointer-events: auto !important;
  opacity: 1 !important;
}

/* ── 异步组件占位 ── */
:deep(.async-loading) {
  padding: var(--wf-space-32);
  text-align: center;
  font-size: var(--wf-font-base);
  color: var(--wf-ink-3);
}

:deep(.async-error) {
  padding: var(--wf-space-32);
  text-align: center;
  font-size: var(--wf-font-base);
  color: var(--wf-danger);
}

/* ── 错误提示 ── */
.form-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--wf-space-8);
  padding: 40px;
  font-size: var(--wf-font-base);
  color: var(--wf-danger);
}
.form-error .el-icon { font-size: 16px; }

/* ── 通用工具样式 ── */
.avd-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--wf-space-8);
  padding: var(--wf-space-32);
  font-size: var(--wf-font-base);
  color: var(--wf-ink-3);
}

.avd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: var(--wf-space-48);
  font-size: var(--wf-font-base);
  color: var(--wf-ink-disabled);
}
.avd-empty .el-icon { font-size: 32px; }

.avd-empty-sm {
  font-size: var(--wf-font-base);
  color: var(--wf-ink-disabled);
  padding: var(--wf-space-20);
  text-align: center;
}

.spin { animation: rotate 0.7s linear infinite; }
@keyframes rotate { to { transform: rotate(360deg); } }
</style>
