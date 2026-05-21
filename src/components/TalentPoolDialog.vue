<template>
  <el-dialog
    v-model="visible"
    title=""
    width="1100px"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
    class="tp-dialog"
  >
    <!-- 自定义 header -->
    <template #header>
      <div class="tp-header">
        <div class="tp-header-icon"><el-icon><Briefcase /></el-icon></div>
        <div>
          <div class="tp-header-title">人才库</div>
          <div class="tp-header-sub">从人才库中多选人员加入「{{ targetGroupName }}」</div>
        </div>
        <div class="tp-header-stat">
          已选 <b>{{ checkedRows.length }}</b> 人
        </div>
      </div>
    </template>

    <div class="tp-body">
      <!-- 搜索区 -->
      <Commonsearch
        :fields="searchFields"
        :collapsible="true"
        :collapse-count="3"
        @search="handleSearch"
        @reset="handleReset"
      />

      <!-- 表格区 -->
      <Commontable
        :table-data="pagedData"
        :columns="columns"
        :total="filteredData.length"
        :current-page="page"
        :page-size="pageSize"
        :show-selection="true"
        :show-operation="false"
        row-key="userId"
        storage-key="talent-pool-table"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <!-- 姓名列：点击查看详情 -->
        <template #userName="{ row }">
          <span class="tp-name-link" @click="$emit('view-detail', row)">
            {{ row.userName }}
          </span>
        </template>

        <!-- 三年绩效：彩色徽章 -->
        <template #threeYearPerf="{ row }">
          <div class="tp-perf-tags">
            <span
              v-for="(p, i) in parsePerf(row.threeYearPerf)"
              :key="i"
              class="tp-perf-tag"
              :class="perfClass(p)"
            >{{ p }}</span>
          </div>
        </template>

        <!-- 人员类别 -->
        <template #category="{ row }">
          <el-tag :type="categoryType(row.category)" size="small" round>
            {{ row.category }}
          </el-tag>
        </template>

        <!-- 已在组中提示 -->
        <template #workNo="{ row }">
          <span :class="isAssigned(row.userId) ? 'tp-assigned' : ''">
            {{ row.workNo }}
            <el-tag v-if="isAssigned(row.userId)" size="small" type="warning" style="margin-left:4px">已分组</el-tag>
          </span>
        </template>
      </Commontable>
    </div>

    <template #footer>
      <div class="tp-footer">
        <span class="tp-footer-tip">
          <el-icon><InfoFilled /></el-icon>
          已在其他组的人员仍可选择，加入后将自动从原组移出
        </span>
        <div class="tp-footer-btns">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="danger" :disabled="!checkedRows.length" @click="handleConfirm">
            加入「{{ targetGroupName }}」（{{ checkedRows.length }}人）
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Briefcase, InfoFilled } from '@element-plus/icons-vue'
import Commonsearch from '/@/components/claudetable/Commonsearch.vue'
import Commontable  from '/@/components/claudetable/Commontable.vue'

// ─────────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────────
const props = defineProps({
  /** 当前已分配到任意组的所有 userId 集合，用于显示「已分组」标记 */
  assignedUserIds: { type: Array, default: () => [] },
  /** 目标巡察组名称，展示在标题和确认按钮上 */
  targetGroupName: { type: String, default: '巡察组' },
  /** 人才库数据，由父组件传入（含业务数据） */
  poolData: { type: Array, default: () => [] },
})

const emit = defineEmits(['confirm', 'view-detail'])

// ─────────────────────────────────────────────────
//  弹窗显隐（通过 defineExpose 控制）
// ─────────────────────────────────────────────────
const visible = ref(false)

// ─────────────────────────────────────────────────
//  搜索
// ─────────────────────────────────────────────────
const searchParams = ref({})

const searchFields = [
  { prop: 'workNo',   label: '工号',     type: 'input',  placeholder: '请输入工号', width: '160px' },
  { prop: 'userName', label: '姓名',     type: 'input',  placeholder: '请输入姓名', width: '160px' },
  { prop: 'category', label: '人员类别', type: 'select', width: '160px', options: [
    { label: '巡察干部', value: '巡察干部' },
    { label: '业务专家', value: '业务专家' },
    { label: '财务审计', value: '财务审计' },
    { label: '纪检监察', value: '纪检监察' },
  ]},
  { prop: 'specialty', label: '擅长领域', type: 'input', placeholder: '请输入', width: '200px' },
]

const handleSearch = (params) => {
  searchParams.value = params
  page.value = 1
}

const handleReset = () => {
  searchParams.value = {}
  page.value = 1
}

// ─────────────────────────────────────────────────
//  过滤 + 分页
// ─────────────────────────────────────────────────
const page     = ref(1)
const pageSize = ref(10)

const filteredData = computed(() => {
  let list = [...props.poolData]
  const p = searchParams.value
  if (p.workNo)    list = list.filter(r => r.workNo?.includes(p.workNo))
  if (p.userName)  list = list.filter(r => r.userName?.includes(p.userName))
  if (p.category)  list = list.filter(r => r.category === p.category)
  if (p.specialty) list = list.filter(r => r.specialty?.includes(p.specialty))
  return list
})

const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const handlePageChange = (p) => { page.value = p }
const handleSizeChange = (s) => { pageSize.value = s; page.value = 1 }

// ─────────────────────────────────────────────────
//  表格列定义
// ─────────────────────────────────────────────────
const columns = [
  { prop: 'workNo',           label: '工号',           width: 90  },
  { prop: 'userName',         label: '姓名',           width: 80  },
  { prop: 'currentPosition',  label: '职务',           minWidth: 110 },
  { prop: 'phone',            label: '联系电话',       width: 120 },
  { prop: 'specialty',        label: '擅长领域',       minWidth: 130 },
  { prop: 'threeYearPerf',    label: '三年绩效',       width: 160 },
  { prop: 'inspectExp',       label: '巡察工作经历',   minWidth: 140 },
  { prop: 'inspectCount',     label: '参加巡察次数',   width: 100, align: 'center' },
  { prop: 'totalInspectCount',label: '巡视巡察总次数', width: 110, align: 'center' },
  { prop: 'category',         label: '人员类别',       width: 100, align: 'center' },
  { prop: 'annualEval',       label: '年度巡察评价',   minWidth: 120 },
  { prop: 'inspectEval',      label: '巡视评价情况',   minWidth: 120 },
]

// ─────────────────────────────────────────────────
//  多选
// ─────────────────────────────────────────────────
const checkedRows = ref([])
const handleSelectionChange = (rows) => { checkedRows.value = rows }

// ─────────────────────────────────────────────────
//  确认
// ─────────────────────────────────────────────────
const handleConfirm = () => {
  emit('confirm', [...checkedRows.value])
  visible.value = false
  checkedRows.value = []
}

// ─────────────────────────────────────────────────
//  工具
// ─────────────────────────────────────────────────
const isAssigned = (userId) => props.assignedUserIds.includes(userId)

const parsePerf = (str) => str ? String(str).split(/[,，]/).map(s => s.trim()).filter(Boolean) : []

const perfClass = (p) => {
  if (p.includes('优秀') || p === 'A') return 'perf--excellent'
  if (p.includes('良好') || p === 'B') return 'perf--good'
  if (p.includes('合格') || p === 'C') return 'perf--pass'
  return 'perf--other'
}

const categoryType = (c) => {
  const map = { '巡察干部': 'danger', '业务专家': 'warning', '财务审计': 'success', '纪检监察': '' }
  return map[c] || 'info'
}

// ─────────────────────────────────────────────────
//  expose：父组件调用 open() 打开弹窗
// ─────────────────────────────────────────────────
defineExpose({
  open: () => {
    checkedRows.value = []
    searchParams.value = {}
    page.value = 1
    visible.value = true
  }
})
</script>

<style scoped>
/* ══ Dialog 全局覆盖 ══════════════════════════ */
:deep(.tp-dialog .el-dialog__header) { padding: 0; margin: 0; }
:deep(.tp-dialog .el-dialog__body)   { padding: 0; }
:deep(.tp-dialog .el-dialog__footer) { padding: 0; }

/* ══ Header ══════════════════════════════════ */
.tp-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f2f5;
}

.tp-header-icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #c62f2f, #e04545);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.tp-header-icon .el-icon { font-size: 18px; color: #fff; }

.tp-header-title { font-size: 15px; font-weight: 700; color: #1d2129; }
.tp-header-sub   { font-size: 12px; color: #86909c; margin-top: 2px; }

.tp-header-stat {
  margin-left: auto;
  font-size: 13px;
  color: #86909c;
  background: #f7f8fa;
  border: 1px solid #e4e7ed;
  border-radius: 20px;
  padding: 4px 14px;
  flex-shrink: 0;
}
.tp-header-stat b { color: #c62f2f; font-size: 16px; }

/* ══ Body ════════════════════════════════════ */
.tp-body {
  padding: 16px 20px;
  max-height: 62vh;
  overflow-y: auto;
}

/* 搜索区红色主题 */
:deep(.tp-dialog .el-button--primary) {
  background: #c62f2f;
  border-color: #c62f2f;
}
:deep(.tp-dialog .el-button--primary:hover) {
  background: #e04545;
  border-color: #e04545;
}
:deep(.tp-dialog .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #c62f2f inset !important;
}
:deep(.tp-dialog .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #c62f2f;
  border-color: #c62f2f;
}
:deep(.tp-dialog .el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #c62f2f;
}

/* 姓名可点击 */
.tp-name-link {
  color: #3370ff;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
}
.tp-name-link:hover { text-decoration: underline; }

/* 已分组标记 */
.tp-assigned { color: #86909c; }

/* 三年绩效标签 */
.tp-perf-tags { display: flex; gap: 4px; flex-wrap: wrap; }
.tp-perf-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 8px;
}
.perf--excellent { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.perf--good      { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.perf--pass      { background: #fefce8; color: #ca8a04; border: 1px solid #fef08a; }
.perf--other     { background: #f9fafb; color: #6b7280; border: 1px solid #e5e7eb; }

/* ══ Footer ══════════════════════════════════ */
.tp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #f0f2f5;
  background: #fafafa;
}

.tp-footer-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #86909c;
}
.tp-footer-tip .el-icon { color: #f5a623; }

.tp-footer-btns { display: flex; gap: 8px; }

:deep(.tp-footer-btns .el-button--danger) {
  background: #c62f2f;
  border-color: #c62f2f;
}
:deep(.tp-footer-btns .el-button--danger:hover) {
  background: #e04545;
  border-color: #e04545;
}
</style>