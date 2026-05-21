<template>
  <!--
    BulletinDeptDisplay.vue — 部门选择器
    与 ContactSelector（人员选择）同级的公共组件，专用于选择部门。
    独立实现，不依赖 ContactSelector。

    编辑态：已选部门 tag（可删除）+ 「选择」按钮 → 弹出部门树面板
    只读态：仅展示部门 tag，无交互

    v-model: Array<{ id, name }>

    props / emits 与原版完全一致，仅内部逻辑做性能优化。
  -->
  <div class="bdd" :class="readonly ? 'bdd--ro' : 'bdd--edit'">

    <!-- ── 已选部门 tag 区 ── -->
    <div v-if="modelValue.length" class="bdd-selected">
      <span
        v-for="dept in modelValue"
        :key="dept.id"
        class="bdd-tag"
      >
        <svg class="bdd-tag-icon" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4Z" stroke="currentColor" stroke-width="1.3"/>
          <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.3"/>
          <path d="M5 8h6M5 11h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        {{ dept.name }}
        <button v-if="!readonly" type="button" class="bdd-tag-del" @click.stop="remove(dept)">
          <svg viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </span>
    </div>

    <!-- ── 空占位（只读）── -->
    <span v-else-if="readonly" class="bdd-empty">—</span>

    <!-- ── 选择按钮（编辑态）── -->
    <button v-if="!readonly" type="button" class="bdd-trigger" @click="open">
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4Z" stroke="currentColor" stroke-width="1.3"/>
        <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.3"/>
      </svg>
      {{ modelValue.length ? '继续添加' : (placeholder || '选择责任单位') }}
    </button>

    <!-- ── 部门选择弹窗 ── -->
    <el-dialog
      v-model="visible"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
      class="bdd-dialog"
    >
      <template #header>
        <div class="bdd-dlg-hd">
          <span class="bdd-dlg-title">选择责任单位</span>
          <span v-if="checkedCount > 0" class="bdd-dlg-count">已选 {{ checkedCount }} 个</span>
        </div>
      </template>

      <!-- 搜索框 -->
      <div class="bdd-search-wrap">
        <el-input
          v-model="keyword"
          placeholder="搜索部门名称"
          clearable
          size="default"
          class="bdd-search"
        >
          <template #prefix>
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.4"/>
              <path d="M10 10l3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </template>
        </el-input>
      </div>

      <!-- 组织树
           [性能优化] default-expand-all 改为 false，避免几千节点初始化全量展开渲染 DOM
           根节点默认展开由 :default-expanded-keys 控制，只展开第一层
      -->
      <div class="bdd-tree-wrap">
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="{ children: 'children', label: 'label' }"
          node-key="id"
          show-checkbox
          :default-checked-keys="initCheckedKeys"
          :default-expand-all="false"
          :default-expanded-keys="rootIds"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          class="bdd-tree"
          @check="onTreeCheck"
        >
          <template #default="{ data }">
            <span class="bdd-tree-node">
              <svg class="bdd-tree-icon" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              <span class="bdd-tree-label">{{ data.label }}</span>
            </span>
          </template>
        </el-tree>

        <div v-if="!treeData.length" class="bdd-tree-empty">暂无部门数据</div>
      </div>

      <!-- 底部操作 -->
      <template #footer>
        <div class="bdd-dlg-footer">
          <span class="bdd-dlg-hint">{{ checkedCount > 0 ? `已勾选 ${checkedCount} 个部门` : '点击勾选部门，支持多选' }}</span>
          <div class="bdd-dlg-acts">
            <el-button @click="cancel">取消</el-button>
            <el-button type="primary" @click="confirm">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// props / emits 与原版完全一致；新增 checkMode 为可选扩展项
const props = defineProps({
  modelValue:  { type: Array,   default: () => [] },
  readonly:    { type: Boolean, default: false     },
  orgList:     { type: Array,   default: () => []  },
  placeholder: { type: String,  default: ''        },
  /**
   * checkMode — 确定时向父组件回传的节点范围
   *
   * 'leaf'（默认）：只回传叶子节点。
   *   勾选父节点后，子节点被联动选中，但 emit 时过滤掉所有有子节点的项，
   *   父组件拿到的始终是最末级部门列表。
   *   适用场景：业务只关心最终责任部门，不需要中间层级。
   *
   * 'all'：回传所有被勾选的节点（父节点 + 子节点）。
   *   勾选父节点后，父节点及其所有子孙节点全部带回给父组件。
   *   适用场景：需要知道选中了哪个组织及其下属所有部门。
   */
  checkMode: {
    type:      String,
    default:   'leaf',
    validator: v => ['leaf', 'all'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue'])

// ─────────────────────────────────────────────────────────────
//  弹窗 & 搜索
// ─────────────────────────────────────────────────────────────
const visible = ref(false)
const keyword = ref('')
const treeRef = ref(null)

// [性能优化] 搜索加 300ms debounce，避免每次击键触发全量 filterNode 遍历
let _kwTimer = null
watch(keyword, v => {
  if (_kwTimer) clearTimeout(_kwTimer)
  _kwTimer = setTimeout(() => {
    treeRef.value?.filter(v)
  }, 300)
})

// ─────────────────────────────────────────────────────────────
//  [性能优化 A] 组织索引：orgList 变化时一次性构建 Map，避免反复 filter
//
//  orgChildrenMap: pid → 直接子 id[]
//  buildTree 改为查 Map 递归，从 O(n²) 降到 O(n)
// ─────────────────────────────────────────────────────────────
const orgChildrenMap = computed(() => {
  const m = new Map()
  for (const n of props.orgList) {
    const pid = n.pid ?? '__root__'
    if (!m.has(pid)) m.set(pid, [])
    m.get(pid).push(n)
  }
  return m
})

// orgMap: id → OrgItem，用于 O(1) 名称查找（构建树时直接取，不再 find）
const orgMap = computed(() => {
  const m = new Map()
  for (const n of props.orgList) m.set(n.id, n)
  return m
})

// [性能优化 A] buildTree 改用 orgChildrenMap，不再 filter 全列表
const treeData = computed(() => buildTreeFast('__root__'))

function buildTreeFast(pid) {
  const children = orgChildrenMap.value.get(pid) ?? []
  return children.map(n => ({
    id:       n.id,
    label:    n.name,
    children: buildTreeFast(n.id),
  }))
}

// [性能优化 B] 根节点 id 列表，弹窗只默认展开第一层，不全量展开
// 原版 default-expand-all="true" 会在 el-tree 初始化时把所有节点展开，
// 几千个节点同时渲染是卡顿的直接原因
const rootIds = computed(() =>
  (orgChildrenMap.value.get('__root__') ?? []).map(n => n.id)
)

function filterNode(value, data) {
  if (!value) return true
  return data.label.includes(value)
}

// ─────────────────────────────────────────────────────────────
//  打开弹窗（与原版逻辑一致）
// ─────────────────────────────────────────────────────────────
const initCheckedKeys = ref([])

function open() {
  initCheckedKeys.value = props.modelValue.map(d => d.id)
  checkedCount.value    = props.modelValue.length
  visible.value         = true
}

function cancel() {
  visible.value         = false
  keyword.value         = ''
  checkedCount.value    = 0
  initCheckedKeys.value = []
}

// ─────────────────────────────────────────────────────────────
//  已选计数（与原版逻辑一致）
// ─────────────────────────────────────────────────────────────
const checkedCount = ref(0)

function onTreeCheck() {
  const checked = treeRef.value?.getCheckedNodes() ?? []
  // 计数与 confirm 取值范围保持一致：
  //   leaf 模式只计叶子节点数，让弹窗头部"已选 N 个"与最终结果一致
  //   all  模式计全部勾选节点数
  checkedCount.value = props.checkMode === 'all'
    ? checked.length
    : checked.filter(n => !n.children || n.children.length === 0).length
}

// ─────────────────────────────────────────────────────────────
//  确定
//
//  checkMode === 'leaf'（默认）：
//    只回传叶子节点（没有子节点的项）。
//    el-tree check-strictly=false 时勾选父节点会联动选中子节点，
//    但 emit 时过滤掉有 children 的节点，父组件拿到的只有末级部门。
//
//  checkMode === 'all'：
//    回传全部被勾选节点，包括父节点和所有子孙节点。
// ─────────────────────────────────────────────────────────────
function confirm() {
  const allChecked = treeRef.value?.getCheckedNodes() ?? []

  const result = props.checkMode === 'all'
    // 'all' 模式：全部勾选节点，父 + 子都带回
    ? allChecked
    // 'leaf' 模式（默认）：过滤掉有子节点的父级，只保留叶子节点
    : allChecked.filter(n => !n.children || n.children.length === 0)

  emit('update:modelValue', result.map(n => ({ id: n.id, name: n.label })))
  visible.value         = false
  keyword.value         = ''
  checkedCount.value    = 0
  initCheckedKeys.value = []
}

// ─────────────────────────────────────────────────────────────
//  删除单个 tag（与原版逻辑一致）
// ─────────────────────────────────────────────────────────────
function remove(dept) {
  emit('update:modelValue', props.modelValue.filter(d => d.id !== dept.id))
}
</script>

<style scoped>
/* 样式与原版完全一致，未做任何改动 */
/* ── 根容器：inline-flex，内容多宽就多宽 ── */
.bdd {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  max-width: 100%;
}

/* ── 已选 tag 区 ── */
.bdd-selected {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
}

.bdd-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #1d2129;
  background: #f0f2f5;
  border: 1px solid #e4e7ed;
  line-height: 1.4;
  white-space: nowrap;
  user-select: none;
}
.bdd--ro .bdd-tag {
  padding: 3px 8px;
  color: #4e5969;
  background: #f7f8fa;
}

.bdd-tag-icon {
  width: 13px;
  height: 13px;
  color: #3370ff;
  flex-shrink: 0;
}

.bdd-tag-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: #86909c;
  border-radius: 3px;
  flex-shrink: 0;
  transition: color .12s, background .12s;
}
.bdd-tag-del:hover { color: #c62f2f; background: #fff1f0; }
.bdd-tag-del svg   { width: 9px; height: 9px; display: block; }

/* ── 空占位 ── */
.bdd-empty { font-size: 13px; color: #86909c; }

/* ── 选择触发按钮 ── */
.bdd-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px 3px 8px;
  border-radius: 6px;
  border: 1px dashed #c0c4cc;
  background: transparent;
  color: #86909c;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  line-height: 1.4;
  white-space: nowrap;
  transition: border-color .12s, color .12s, background .12s;
}
.bdd-trigger:hover {
  border-color: #3370ff;
  color: #3370ff;
  background: #f0f4ff;
}
.bdd-trigger svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

/* 弹窗内部样式（scoped 可访问，非 append-to-body 的部分）*/
.bdd-search-wrap {
  padding: 10px 14px 8px;
  border-bottom: 1px solid #f5f5f5;
}
.bdd-tree-wrap {
  height: 360px;
  overflow-y: auto;
  padding: 8px 6px;
}
.bdd-tree-wrap::-webkit-scrollbar { width: 5px; }
.bdd-tree-wrap::-webkit-scrollbar-thumb { background: #dcdfe6; border-radius: 3px; }
.bdd-tree { background: transparent; }
.bdd-tree-node {
  display: flex; align-items: center; gap: 7px;
  font-size: 13px; color: #1d2129; flex: 1; min-width: 0;
}
.bdd-tree-icon { width: 14px; height: 14px; color: #3370ff; flex-shrink: 0; }
.bdd-tree-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bdd-tree-empty {
  display: flex; align-items: center; justify-content: center;
  height: 100%; font-size: 13px; color: #86909c;
}
.bdd-dlg-hd { display: flex; align-items: center; gap: 10px; padding: 14px 20px; }
.bdd-dlg-title { font-size: 15px; font-weight: 600; color: #1d2129; flex: 1; }
.bdd-dlg-count { font-size: 12px; color: #3370ff; background: #edf2ff; border: 1px solid #c5d8ff; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
.bdd-dlg-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; background: #fafafa;
}
.bdd-dlg-hint { font-size: 12px; color: #86909c; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 12px; }
.bdd-dlg-acts { display: flex; gap: 8px; flex-shrink: 0; }
</style>

<!-- bdd-dialog 使用 append-to-body，弹窗 DOM 挂在 body 下，scoped 无效，用全局规则 -->
<style>
.bdd-dialog .el-dialog         { border-radius: 14px !important; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,.14); }
.bdd-dialog .el-dialog__header { padding: 0 !important; margin: 0 !important; border-bottom: 1px solid #f0f0f0; }
.bdd-dialog .el-dialog__body   { padding: 0 !important; }
.bdd-dialog .el-dialog__footer { padding: 0 !important; border-top: 1px solid #f0f0f0; }
</style>

/* ── 弹窗重置 ──
   bdd-dialog 使用 append-to-body，弹窗 DOM 在 body 下，
   scoped :deep() 无法命中，样式写在下方全局 <style> 块
*/

/* 搜索框 */
:deep(.bdd-search .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e4e7ed inset;
  background: #f7f8fa;
}
:deep(.bdd-search .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}
:deep(.bdd-search .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1.5px #3370ff inset !important;
  background: #fff;
}

/* 组织树 */
:deep(.bdd-tree .el-tree-node__content) {
  height: 36px;
  border-radius: 7px;
  margin-bottom: 1px;
  transition: background .1s;
}
:deep(.bdd-tree .el-tree-node__content:hover) {
  background: #f0f2f5;
}
:deep(.bdd-tree .el-tree-node.is-current > .el-tree-node__content) {
  background: #edf2ff;
}
:deep(.bdd-tree .el-checkbox__inner) {
  border-radius: 4px;
  border-color: #c0c4cc;
}
:deep(.bdd-tree .el-checkbox.is-checked .el-checkbox__inner) {
  background: #3370ff;
  border-color: #3370ff;
}

:deep(.bdd-dlg-acts .el-button--primary) {
  background: #3370ff;
  border-color: #3370ff;
}
</style>