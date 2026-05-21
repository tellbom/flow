<template>
  <div class="my-todo-page">

    <!-- ══ 页头 Banner ══ -->
    <div class="page-banner">
      <div class="banner-bg-circle banner-circle-1"></div>
      <div class="banner-bg-circle banner-circle-2"></div>
      <div class="banner-content">
        <div class="banner-left">
          <div class="banner-icon-wrap"><el-icon :size="32"><Bell /></el-icon></div>
          <div>
            <div class="banner-title">我的待办</div>
            <div class="banner-sub">共 <b>{{ todoList.length }}</b> 条任务等待处理</div>
          </div>
        </div>
        <div class="banner-stats">
          <div class="bstat" v-for="s in bannerStats" :key="s.label">
            <div class="bstat-val" :style="{ color: s.color }">{{ s.val }}</div>
            <div class="bstat-label">{{ s.label }}</div>
          </div>
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
      :table-data="pagedList"
      :columns="tableColumns"
      :total="todoList.length"
      :current-page="pagination.page"
      :page-size="pagination.size"
      :show-operation="true"
      :operation-width="140"
      storage-key="my-todo-columns"
      row-key="taskId"
      @page-change="pagination.page = $event"
      @size-change="pagination.size = $event"
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
      :org-list="orgList"
      :user-list="userList"
      @approved="handleTaskDone"
      @rejected="handleTaskDone"
    />

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { Bell, Edit } from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import Commonsearch from '/@/components/claudetable/Commonsearch.vue'
import Commontable  from '/@/components/claudetable/Commontable.vue'
import TaskApproveDrawer from '/@/components/todo/TaskApproveDrawer.vue'
import {
  mockOrgList, mockUserList,
  businessTypeMap, priorityMap,
  apiGetTodoList, apiGetFlowRender,
} from '/@/components/todo/mockData.js'

// ── 静态数据 ──────────────────────────────────
const orgList  = mockOrgList
const userList = mockUserList

// ── 状态 ──────────────────────────────────────
const todoList     = ref([])
const searchParams = ref({})
const pagination   = reactive({ page: 1, size: 20 })
const loading      = ref(false)

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

// ── 计算 ──────────────────────────────────────
const pagedList = computed(() => {
  const s = (pagination.page - 1) * pagination.size
  return todoList.value.slice(s, s + pagination.size)
})

const bannerStats = computed(() => {
  const list = todoList.value
  return [
    { label: '紧急', val: list.filter(t => t.priority === 3).length, color: '#ef4444' },
    { label: '高优先级', val: list.filter(t => t.priority === 2).length, color: '#f59e0b' },
    { label: '今日新增', val: list.filter(t => {
      const d = new Date(t.createTime); const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length, color: '#007aff' },
  ]
})

// ── 搜索 ──────────────────────────────────────
const handleSearch = async (params) => {
  searchParams.value = params
  pagination.page = 1
  loading.value = true
  try {
    const res = await apiGetTodoList(params)
    todoList.value = res.items ?? []
  } finally {
    loading.value = false
  }
}
const handleReset = async () => {
  searchParams.value = {}
  pagination.page = 1
  loading.value = true
  try {
    const res = await apiGetTodoList()
    todoList.value = res.items ?? []
  } finally {
    loading.value = false
  }
}

// ── 打开审批抽屉 ──────────────────────────────
const drawerVisible   = ref(false)
const currentTask     = ref(null)
const currentFlowData = ref(null)

const openApproveDrawer = async (row) => {
  const loadingInstance = ElLoading.service({
    lock: true, text: '正在加载…', background: 'rgba(0,0,0,.45)',
  })
  try {
    currentFlowData.value = null

    const [flowRes] = await Promise.allSettled([
      apiGetFlowRender(row.businessId),
    ])
    currentFlowData.value = flowRes.status === 'fulfilled' ? flowRes.value : null

    // 直接映射 PendingTaskDto 字段，不推断任何流程决策
    currentTask.value = {
      taskId:        row.taskId,
      taskName:      row.taskName,
      businessId:    row.businessId,
      businessType:  row.businessType,
      nodeSemantic:  row.nodeSemantic,
      pageCode:      row.pageCode,
      priority:      row.priority,
      createTime:    row.createTime,
      // 选人契约：Drawer 根据此列表渲染选人区（PATCH-04 消费）
      requiredSlots: row.requiredSlots  ?? [],
      // 驳回配置：Drawer 根据此控制驳回按钮与弹窗选项（PATCH-05 消费）
      canReject:     row.canReject      ?? false,
      rejectOptions: row.rejectOptions  ?? [],
    }

    drawerVisible.value = true
  } catch (e) {
    ElMessage.error('加载任务数据失败，请重试')
  } finally {
    loadingInstance.close()
  }
}

// ── 任务完成回调 ──────────────────────────────
const handleTaskDone = async () => {
  loading.value = true
  try {
    const res = await apiGetTodoList(searchParams.value)
    todoList.value = res.items ?? []
  } finally {
    loading.value = false
  }
}

// ── 初始化 ────────────────────────────────────
onMounted(async () => {
  loading.value = true
  try {
    const res = await apiGetTodoList()
    todoList.value = res.items ?? []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.my-todo-page { padding: 24px; background: #f5f7fa; min-height: 100vh; }

/* ── Banner ── */
.page-banner {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #c62f2f 0%, #e05252 100%);
  border-radius: 20px;
  padding: 32px 36px;
  margin-bottom: 20px;
  box-shadow: 0 12px 40px rgba(198, 47, 47, .28);
}
.banner-bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,.06);
  pointer-events: none;
}
.banner-circle-1 { width: 280px; height: 280px; top: -80px; right: -40px; }
.banner-circle-2 { width: 160px; height: 160px; bottom: -60px; right: 200px; }

.banner-content {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
}
.banner-left  { display: flex; align-items: center; gap: 20px; }
.banner-icon-wrap {
  width: 60px; height: 60px; border-radius: 16px;
  background: rgba(255,255,255,.18);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.banner-title { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -1px; margin-bottom: 4px; }
.banner-sub   { font-size: 14px; color: rgba(255,255,255,.8); }
.banner-sub b { color: #fcda50; font-size: 18px; }

.banner-stats { display: flex; gap: 32px; }
.bstat       { text-align: center; }
.bstat-val   { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
.bstat-label { font-size: 12px; color: rgba(255,255,255,.7); margin-top: 2px; }

/* ── 任务名称单元格 ── */
.task-name-cell { display: flex; flex-direction: column; gap: 2px; }
.task-main      { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.task-sub       { font-size: 12px; color: #888; }

/* ── 优先级点 ── */
.priority-dot {
  display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 5px; vertical-align: middle;
}
.p-3 { background: #ef4444; }
.p-2 { background: #f59e0b; }
.p-1 { background: #6b7280; }
.p-0 { background: #d1d5db; }

/* ── 进度触发 ── */

</style>