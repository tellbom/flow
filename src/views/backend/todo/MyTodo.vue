<template>
  <div class="my-todo-page">

    <!-- ══ 页头 ══ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon :size="20"><Bell /></el-icon>
        </div>
        <div class="page-header-text">
          <h1 class="page-title">我的待办</h1>
          <p class="page-subtitle">
            共 <span class="count-highlight">{{ total }}</span> 条任务等待处理
          </p>
        </div>
      </div>

      <div class="page-header-stats">
        <div
          v-for="s in headerStats"
          :key="s.label"
          class="stat-item"
        >
          <div class="stat-val" :class="s.cls">{{ s.val }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- ══ 搜索 ══ -->
    <Commonsearch
      :fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- ══ 表格 ══ -->
    <Commontable
      v-loading="loading"
      :table-data="todoList"
      :columns="tableColumns"
      :total="total"
      :current-page="pagination.pageIndex"
      :page-size="pagination.pageSize"
      :show-operation="true"
      :operation-width="140"
      storage-key="my-todo-columns"
      row-key="taskId"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <!-- 任务名称列 -->
      <template #taskName="{ row }">
        <div class="task-name-cell">
          <div class="task-main">{{ row.taskName }}</div>
          <div class="task-sub">{{ row.businessId }}</div>
        </div>
      </template>

      <!-- 业务类型列 -->
      <template #businessType="{ row }">
        <el-tag
          :type="businessTypeMap[row.businessType]?.color || 'info'"
          size="small" round effect="plain"
        >{{ businessTypeMap[row.businessType]?.label || row.businessType }}</el-tag>
      </template>

      <!-- 优先级列 -->
      <template #priority="{ row }">
        <el-tag
          :type="priorityMap[row.priority]?.type || ''"
          size="small" round effect="light"
        >
          <span class="priority-dot" :class="`p-${row.priority}`"></span>
          {{ priorityMap[row.priority]?.label || '普通' }}
        </el-tag>
      </template>

      <!-- 操作列 -->
      <template #operation="{ row }">
        <el-button
          type="primary" size="small" link
          :icon="Edit"
          @click="openApproveDrawer(row)"
        >处理</el-button>

      </template>
    </Commontable>

    <!-- ══ 审批抽屉 ══ -->
    <TaskApproveDrawer
      v-model="drawerVisible"
      :readonly="false"
      :task-info="currentTask"
      :flow-render-data="currentFlowData"
      :flow-data-loading="flowDataLoading"
      @approved="handleTaskDone"
      @rejected="handleTaskDone"
    />

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bell, Edit } from '@element-plus/icons-vue'
import { useAdminInfo } from '/@/stores/adminInfo'
import Commonsearch from '/@/components/claudetable/Commonsearch.vue'
import Commontable  from '/@/components/claudetable/Commontable.vue'
import TaskApproveDrawer from '/@/components/todo/TaskApproveDrawer.vue'
import { getPendingTasks, getFlowRender } from '/@/api/workflow/processApi'
import { businessTypeMap, priorityMap } from '/@/components/todo/workflowConstants'

const adminInfo = useAdminInfo()
const route = useRoute()

// ── 状态 ──────────────────────────────────────
const todoList     = ref([])
const total        = ref(0)
const searchParams = ref({})
const pagination   = reactive({ pageIndex: 1, pageSize: 20 })
const loading      = ref(false)

const normalizeQueryValue = (value) => Array.isArray(value) ? value[0] : value

function syncSearchFromRoute() {
  const keyword = normalizeQueryValue(route.query.keyword)
  const taskId = normalizeQueryValue(route.query.taskId)
  const businessId = normalizeQueryValue(route.query.businessId)
  const businessType = normalizeQueryValue(route.query.businessType)

  searchParams.value = {
    ...(keyword ? { keyword } : {}),
    ...(taskId ? { taskId } : {}),
    ...(businessId ? { businessId } : {}),
    ...(businessType ? { businessType } : {}),
  }
}

// ── 搜索字段配置 ──────────────────────────────
const searchFields = [
  {
    prop: 'keyword', label: '关键词', type: 'input',
    placeholder: '任务名称 / 业务ID / 标题', width: '220px',
  },
  {
    prop: 'businessType', label: '业务类型', type: 'select', width: '160px',
    options: Object.entries(businessTypeMap).map(([k, v]) => ({ value: k, label: v.label })),
  },
  {
    prop: 'priority', label: '优先级', type: 'select', width: '120px',
    options: Object.entries(priorityMap).map(([k, v]) => ({ value: k, label: v.label })),
  },
  {
    prop: 'dateRange', label: '创建时间', type: 'daterange', width: '260px',
  },
]

// ── 表格列配置 ────────────────────────────────
const tableColumns = [
  { prop: 'taskName',         label: '任务名称',  minWidth: 200 },
  { prop: 'businessType',     label: '业务类型',  width: 120    },
  { prop: 'businessId',       label: '业务ID',    width: 148    },
  { prop: 'priority',         label: '优先级',    width: 90     },
  { prop: 'createTime',       label: '创建时间',  width: 170    },
]

const headerStats = computed(() => {
  const list = todoList.value
  return [
    { label: '紧急', val: list.filter(t => t.priority === 3).length, cls: 'val-danger' },
    { label: '高优先级', val: list.filter(t => t.priority === 2).length, cls: 'val-warning' },
    {
      label: '今日新增',
      val: list.filter(t => {
        const d = new Date(t.createTime)
        const now = new Date()
        return d.toDateString() === now.toDateString()
      }).length,
      cls: 'val-primary',
    },
  ]
})

// ── 数据加载 ──────────────────────────────────
async function loadTodoList() {
  loading.value = true
  try {
    const result = await getPendingTasks({
      employeeId: adminInfo.userid,
      keyword: searchParams.value.keyword || undefined,
      taskId: searchParams.value.taskId || undefined,
      businessId: searchParams.value.businessId || undefined,
      businessType: searchParams.value.businessType || undefined,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    })
    todoList.value = result.items ?? []
    total.value = result.total ?? 0
  } catch {
    // processAxios 已统一提示
  } finally {
    loading.value = false
  }
}

// ── 搜索 ──────────────────────────────────────
const handleSearch = (params) => {
  searchParams.value = params
  pagination.pageIndex = 1
  loadTodoList()
}
const handleReset = () => {
  searchParams.value = {}
  pagination.pageIndex = 1
  loadTodoList()
}
const handlePageChange = (page) => {
  pagination.pageIndex = page
  loadTodoList()
}
const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.pageIndex = 1
  loadTodoList()
}

// ── 打开审批抽屉 ──────────────────────────────
const drawerVisible   = ref(false)
const currentTask     = ref(null)
const currentFlowData = ref(null)
const flowDataLoading = ref(false)

const openApproveDrawer = async (row) => {
  currentFlowData.value = null
  currentTask.value = {
    taskId:        row.taskId,
    taskName:      row.taskName,
    businessId:    row.businessId,
    businessType:  row.businessType,
    nodeSemantic:  row.nodeSemantic,
    roleKey:       row.roleKey ?? '',
    pageCode:      row.pageCode,
    pageUrl:       row.pageUrl ?? null,
    priority:      row.priority,
    createTime:    row.createTime,
    isAfterConvergencePoint: row.isAfterConvergencePoint ?? false,
    canReject:     row.canReject      ?? false,
    rejectOptions: row.rejectOptions  ?? [],
    requiredSlots: row.requiredSlots  ?? [],
    slotRecommendedUsers: row.slotRecommendedUsers ?? {},
    restrictToRecommended: row.restrictToRecommended ?? {},
  }
  drawerVisible.value = true

  flowDataLoading.value = true
  try {
    currentFlowData.value = await getFlowRender(row.businessId)
  } catch {
    // 流程图加载失败不影响审批操作
  } finally {
    flowDataLoading.value = false
  }
}

// ── 任务完成回调 ──────────────────────────────
const handleTaskDone = async () => {
  loadTodoList()
}

// ── 初始化 ────────────────────────────────────
onMounted(() => {
  syncSearchFromRoute()
  loadTodoList()
})

watch(
  () => route.query,
  () => {
    syncSearchFromRoute()
    pagination.pageIndex = 1
    loadTodoList()
  }
)
</script>

<style scoped>
.my-todo-page {
  padding: var(--wf-space-24);
  background: var(--wf-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wf-space-24);
  background: var(--wf-canvas);
  border-radius: var(--wf-radius-lg);
  padding: var(--wf-space-20) var(--wf-space-24);
  margin-bottom: var(--wf-space-16);
  box-shadow: var(--wf-shadow-card);
}

.page-header-left {
  display: flex;
  align-items: center;
  gap: var(--wf-space-16);
}

.page-header-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--wf-radius-md);
  background: var(--wf-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--wf-primary);
}

.page-title {
  font-size: var(--wf-font-xl);
  font-weight: var(--wf-font-weight-bold);
  color: var(--wf-ink);
  letter-spacing: 0;
  margin: 0 0 var(--wf-space-2);
  line-height: var(--wf-line-height-tight);
}

.page-subtitle {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  margin: 0;
  line-height: var(--wf-line-height-base);
}

.count-highlight {
  font-weight: var(--wf-font-weight-bold);
  color: var(--wf-primary);
  font-size: var(--wf-font-md);
}

.page-header-stats {
  display: flex;
  gap: var(--wf-space-32);
  flex-shrink: 0;
}

.stat-item {
  text-align: center;
}

.stat-val {
  font-size: var(--wf-font-2xl);
  font-weight: var(--wf-font-weight-black);
  letter-spacing: 0;
  line-height: 1;
  margin-bottom: var(--wf-space-4);
}

.stat-label {
  font-size: var(--wf-font-xs);
  color: var(--wf-ink-3);
  white-space: nowrap;
}

.val-danger { color: var(--wf-danger); }
.val-warning { color: var(--wf-warning); }
.val-primary { color: var(--wf-primary); }
.val-success { color: var(--wf-success); }
.val-neutral { color: var(--wf-ink-2); }

.task-name-cell {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-2);
}

.task-main {
  font-size: var(--wf-font-md);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink);
}

.task-sub {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
}

.priority-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
  flex-shrink: 0;
}

.p-3 { background: var(--wf-danger); }
.p-2 { background: var(--wf-warning); }
.p-1 { background: var(--wf-ink-3); }
.p-0 { background: var(--wf-neutral); }
</style>
