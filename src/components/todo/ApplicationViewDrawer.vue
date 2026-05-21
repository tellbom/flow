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
          <div>
            <div class="avd-title">{{ appInfo?.title || '申请详情' }}</div>
            <div class="avd-meta">
              <span>{{ appInfo?.applicant }}</span>
              <span v-if="appInfo?.department" class="avd-sep">·</span>
              <span>{{ appInfo?.department }}</span>
              <span class="avd-sep">·</span>
              <span>{{ appInfo?.createdTime }}</span>
            </div>
          </div>
        </div>
        <el-tag
          :type="statusTagType(appInfo?.status)"
          size="large" round effect="plain"
          class="avd-status-tag"
        >
          <span class="avd-status-dot" :class="`dot-${appInfo?.status}`" />
          {{ statusLabel(appInfo?.status) }}
        </el-tag>
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

              <!-- 已完成：信息条 + 表单组件（组件挂载后自行调 initFormData 加载数据）-->
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

                <!-- 无对应组件：仅展示信息条，不渲染表单 -->
                <div v-if="!getComponent(node.viewComponentPath)" class="avd-empty-sm">
                  暂无表单组件
                </div>

                <!-- 表单只读渲染区：组件挂载后自行通过 initFormData 加载数据 -->
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
import FlowGraph from './FlowGraph.vue'
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

// ─────────────────────────────────────────────────
//  组件挂载后触发 initFormData
//  watch nodeRefs 中每个新增 key，一旦拿到 ref 就调初始化
//  同一个 nodeKey 只初始化一次（已初始化的 key 记录在 initializedKeys）
// ─────────────────────────────────────────────────
const initializedKeys = ref(new Set())

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
    nodeRefs.value       = {}
    initializedKeys.value = new Set()
    activeTab.value      = ''
  }
})

// ─────────────────────────────────────────────────
//  Tab 切换
// ─────────────────────────────────────────────────
const activeTab = ref('')

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

// ─────────────────────────────────────────────────
//  状态工具
// ─────────────────────────────────────────────────
const statusTagType = s => ({ running: 'primary', completed: 'success', terminated: 'info' }[s] ?? '')
const statusLabel   = s => ({ running: '审批中', completed: '已完成', terminated: '已撤回' }[s] ?? s)
</script>
<style>
.avd-drawer{
   top: 48px !important;
  height: calc(100% - 48px) !important;

}
</style>
<style scoped>
/* ══ Drawer ════════════════════════════════════ */
:deep(.avd-drawer .el-drawer__header) {
  padding: 0; margin: 0;
  border-bottom: 1px solid #f0f2f5;
}
:deep(.avd-drawer .el-drawer__body) {
  padding: 0; background: #f4f5f7; overflow-y: auto;
}

/* ══ Header ════════════════════════════════════ */
.avd-header {
  display: flex; align-items: center;
  justify-content: space-between;
  gap: 16px; padding: 14px 20px; background: #fff;
}
.avd-header-left {
  display: flex; align-items: center; gap: 12px; min-width: 0;
}
.avd-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: #fff1f0;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.avd-icon .el-icon { font-size: 18px; color: #c62f2f; }
.avd-title {
  font-size: 15px; font-weight: 700; color: #1d2129;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.avd-meta {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 4px; font-size: 12px; color: #86909c; margin-top: 2px;
}
.avd-sep     { color: #c9cdd4; }
.avd-status-tag { flex-shrink: 0; }

/* 状态圆点 */
.avd-status-dot, .tab-dot {
  display: inline-block;
  width: 6px; height: 6px; border-radius: 50%;
  margin-right: 5px; vertical-align: middle;
}
.dot-running   { background: #3370ff; }
.dot-completed,
.dot-done      { background: #27ae60; }
.dot-terminated,
.dot-pending   { background: #c0c4cc; }

/* ══ Body ══════════════════════════════════════ */
.avd-body {
  display: flex; flex-direction: column; gap: 12px; padding: 16px;
}

/* ══ Section 卡片 ═══════════════════════════════ */
.avd-section-card {
  background: #fff; border-radius: 12px;
  padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.avd-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: #4e5969; margin-bottom: 10px;
}
.avd-section-title .el-icon { font-size: 14px; color: #c62f2f; }

/* ══ 流程图区 ════════════════════════════════════ */
.avd-flow-wrap {
  min-height: 120px;
  display: flex; align-items: center; justify-content: center;
}
.avd-flow-graph { width: 100%; }

/* ══ Tabs ════════════════════════════════════════ */
.avd-tabs { --el-color-primary: #c62f2f; }

/* Tab 头部：允许横向滚动 */
:deep(.avd-tabs .el-tabs__header) {
  margin-bottom: 0;
  overflow: hidden;
}
:deep(.avd-tabs .el-tabs__nav-wrap) {
  overflow: hidden;
}
:deep(.avd-tabs .el-tabs__nav-wrap::after) {
  display: none;
}
/* el-tabs 自带滚动容器，让它可以横向滚动 */
:deep(.avd-tabs .el-tabs__nav-scroll) {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #e4e7ed transparent;
}
:deep(.avd-tabs .el-tabs__nav-scroll::-webkit-scrollbar) {
  height: 3px;
}
:deep(.avd-tabs .el-tabs__nav-scroll::-webkit-scrollbar-track) {
  background: transparent;
}
:deep(.avd-tabs .el-tabs__nav-scroll::-webkit-scrollbar-thumb) {
  background: #e4e7ed; border-radius: 2px;
}
/* nav 本身不换行，超出由滚动容器处理 */
:deep(.avd-tabs.el-tabs--card .el-tabs__nav) {
  border-color: #e4e7ed;
  border-radius: 8px 8px 0 0;
  white-space: nowrap;
  float: none;
  display: inline-flex;
}
:deep(.avd-tabs.el-tabs--card .el-tabs__item) {
  border-color: #e4e7ed;
  font-size: 13px; padding: 0 16px;
  height: 40px; line-height: 40px; color: #4e5969;
  transition: background .12s, color .12s;
  flex-shrink: 0;
}
:deep(.avd-tabs.el-tabs--card .el-tabs__item.is-active) {
  background: #fff1f0; color: #c62f2f;
  border-bottom-color: #fff1f0; font-weight: 600;
}
:deep(.avd-tabs.el-tabs--card .el-tabs__item:hover:not(.is-active)) {
  color: #c62f2f; background: #fafafa;
}

/* Tab 标签内部 */
.tab-label {
  display: flex; align-items: center; gap: 5px; white-space: nowrap;
}
.tab-operator {
  font-size: 11px; color: #86909c;
  background: #f0f2f5; padding: 1px 6px;
  border-radius: 8px; font-weight: 400;
}
:deep(.avd-tabs.el-tabs--card .el-tabs__item.is-active .tab-operator) {
  background: #ffd5d5; color: #c62f2f;
}

/* ══ Tab 内容区 ════════════════════════════════ */
.tab-content {
  border: 1px solid #e4e7ed; border-top: none;
  border-radius: 0 0 8px 8px; background: #fff; overflow: hidden;
}

/* 节点信息条 */
.snap-info-bar {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 4px; padding: 10px 16px;
  background: #f7f8fa; border-bottom: 1px solid #f0f2f5;
  font-size: 12px; color: #4e5969;
}
.sib-item { display: flex; align-items: center; gap: 4px; }
.sib-item .el-icon { font-size: 13px; color: #86909c; }
.sib-sep  { width: 1px; height: 12px; background: #c9cdd4; margin: 0 4px; }
.sib-comment { flex: 1; min-width: 0; font-style: italic; }

/* 未完成占位 */
.snap-pending {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; padding: 48px 20px;
}
.sp-icon-wrap {
  width: 52px; height: 52px; border-radius: 50%;
  background: #f0f2f5;
  display: flex; align-items: center; justify-content: center;
}
.sp-icon-wrap .el-icon { font-size: 24px; color: #c0c4cc; }
.sp-text { font-size: 14px; font-weight: 600; color: #4e5969; }
.sp-hint { font-size: 12px; color: #86909c; }

/* formData 加载中：骨架屏 */
.form-skeleton-wrap {
  padding: 20px 16px;
}

/* formData 加载失败 */
.form-error {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 40px;
  font-size: 13px; color: #c62f2f;
}
.form-error .el-icon { font-size: 16px; }

/* ══ 表单只读区 ════════════════════════════════════
   屏蔽所有 el- 输入控件的交互。
   自定义 div/button（成员卡片、PersonCard 等）
   不在 el- 前缀范围内，天然不受影响，无需额外处理。
═══════════════════════════════════════════════════ */
.view-form-wrap :deep(.el-input__wrapper),
.view-form-wrap :deep(.el-textarea__wrapper) {
  pointer-events: none;
  background: #f7f8fa !important;
  box-shadow: 0 0 0 1px #e4e7ed inset !important;
}
.view-form-wrap :deep(.el-input__inner),
.view-form-wrap :deep(.el-textarea__inner) {
  -webkit-text-fill-color: #1d2129 !important;
  color: #1d2129 !important;
  cursor: default;
}
.view-form-wrap :deep(.el-select),
.view-form-wrap :deep(.el-date-editor),
.view-form-wrap :deep(.el-date-picker) {
  pointer-events: none;
}
.view-form-wrap :deep(.el-select__wrapper),
.view-form-wrap :deep(.el-select .el-input__wrapper) {
  background: #f7f8fa !important;
  box-shadow: 0 0 0 1px #e4e7ed inset !important;
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
/* 豁免：需要保持可点击的 el-button 加 .avd-allow */
.view-form-wrap :deep(.avd-allow) {
  pointer-events: auto !important;
  opacity: 1 !important;
}

/* ══ 异步组件占位 ════════════════════════════════ */
:deep(.async-loading) {
  padding: 32px; text-align: center;
  font-size: 13px; color: #86909c;
}
:deep(.async-error) {
  padding: 32px; text-align: center;
  font-size: 13px; color: #c62f2f;
}

/* ══ 通用 ════════════════════════════════════ */
.avd-loading {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 32px; font-size: 13px; color: #86909c;
}
.avd-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; padding: 48px; font-size: 13px; color: #c0c4cc;
}
.avd-empty .el-icon { font-size: 32px; }
.avd-empty-sm {
  font-size: 13px; color: #c0c4cc; padding: 20px; text-align: center;
}
.spin { animation: rotate .7s linear infinite; }
@keyframes rotate { to { transform: rotate(360deg); } }
</style>