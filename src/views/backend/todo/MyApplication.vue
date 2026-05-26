<template>
  <div class="my-application-page">

    <!-- ══ 页头（替换原渐变 Banner）══ -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <el-icon :size="20"><Document /></el-icon>
        </div>
        <div class="page-header-text">
          <h1 class="page-title">我的申请</h1>
          <p class="page-subtitle">
            共 <span class="count-highlight">{{ total }}</span> 条申请记录
          </p>
        </div>
      </div>

      <!-- 统计数字组（替换原 banner-stats）-->
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

    <!-- ══ KPI 卡片行 ══ -->
    <div class="kpi-row">
      <div
        v-for="k in kpiCards"
        :key="k.label"
        class="kpi-card"
        :class="{ 'kpi-active': activeStatusFilter === k.status }"
        @click="toggleStatusFilter(k.status)"
      >
        <div class="kpi-icon-wrap" :class="k.iconCls">
          <el-icon :size="20"><component :is="k.icon" /></el-icon>
        </div>
        <div class="kpi-body">
          <div class="kpi-val" :class="k.valCls">{{ k.val }}</div>
          <div class="kpi-label">{{ k.label }}</div>
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
      :table-data="appList"
      :columns="tableColumns"
      :total="total"
      :current-page="pagination.pageIndex"
      :page-size="pagination.pageSize"
      :show-operation="true"
      :operation-width="160"
      storage-key="my-application-columns"
      row-key="processInstanceId"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <!-- 申请标题列 -->
      <template #title="{ row }">
        <div class="app-title-cell">
          <div class="app-main">{{ row.businessId }}</div>
          <div class="app-sub">{{ row.createdBy }}</div>
        </div>
      </template>

      <!-- 业务类型列 -->
      <template #businessType="{ row }">
        <el-tag
          :type="businessTypeMap[row.businessType]?.color || 'info'"
          size="small"
          round
          effect="plain"
        >{{ businessTypeMap[row.businessType]?.label || row.businessType }}</el-tag>
      </template>

      <!-- 流程状态列 -->
      <template #status="{ row }">
        <StatusTag :status="row.status" />
      </template>

      <!-- 当前节点列 -->
      <template #currentNodes="{ row }">
        <template v-if="row.status === 'running' && row.currentNodeNames?.length">
          <el-tag
            v-for="n in row.currentNodeNames"
            :key="n"
            type="primary"
            size="small"
            round
            style="margin-right: 4px"
          >{{ n }}</el-tag>
        </template>
        <span v-else class="text-muted">-</span>
      </template>

      <!-- 操作列 -->
      <template #operation="{ row }">
        <el-button
          type="primary"
          size="small"
          link
          :icon="View"
          @click="openViewDrawer(row)"
        >查看</el-button>
        <el-button
          v-if="row.status === 'running'"
          type="danger"
          size="small"
          link
          :icon="RefreshLeft"
          @click="confirmWithdraw(row)"
        >撤回</el-button>
      </template>
    </Commontable>

    <!-- ══ 查看抽屉（只读）══ -->
    <ApplicationViewDrawer
      v-model="drawerVisible"
      :app-info="currentAppInfo"
      :flow-data="currentFlowData"
      :flow-loading="flowLoading"
      :nodes="currentNodes"
      :nodes-loading="nodesLoading"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from "vue"
import {
  Document,
  View,
  RefreshLeft,
  CircleCheck,
  Clock,
  Warning,
} from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { useAdminInfo } from "/@/stores/adminInfo"
import Commonsearch         from "/@/components/claudetable/Commonsearch.vue"
import Commontable          from "/@/components/claudetable/Commontable.vue"
import ApplicationViewDrawer from "/@/components/todo/ApplicationViewDrawer.vue"
import StatusTag from "/@/workflow-shared/StatusTag.vue"
import {
  getProcessList,
  getFlowRender,
  getProcessProgress,
  terminateProcess,
} from "/@/api/workflow/processApi"
import { businessTypeMap } from "/@/components/todo/workflowConstants"

const adminInfo = useAdminInfo()

// ── 状态 ──────────────────────────────────────
const appList           = ref([])
const total             = ref(0)
const searchParams      = ref({})
const pagination        = reactive({ pageIndex: 1, pageSize: 20 })
const activeStatusFilter = ref("")
const loading           = ref(false)

// ── KPI 卡片 ──────────────────────────────────
const kpiCards = computed(() => {
  const list = appList.value
  return [
    {
      label:   "审批中",
      status:  "running",
      val:     list.filter(a => a.status === "running").length,
      icon:    Clock,
      iconCls: "icon-running",
      valCls:  "val-running",
    },
    {
      label:   "已完成",
      status:  "completed",
      val:     list.filter(a => a.status === "completed").length,
      icon:    CircleCheck,
      iconCls: "icon-completed",
      valCls:  "val-completed",
    },
    {
      label:   "已撤回",
      status:  "terminated",
      val:     list.filter(a => a.status === "terminated").length,
      icon:    Warning,
      iconCls: "icon-terminated",
      valCls:  "val-terminated",
    },
  ]
})

// ── 页头统计 ──────────────────────────────────
const headerStats = computed(() => {
  const list = appList.value
  return [
    {
      label: "本月新增",
      val: list.filter(a => {
        const d = new Date(a.createdTime)
        const now = new Date()
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      }).length,
      cls: "val-primary",
    },
    {
      label: "并行审批",
      val: list.filter(a => (a.currentNodeNames?.length || 0) > 1).length,
      cls: "val-neutral",
    },
  ]
})

const toggleStatusFilter = (status) => {
  activeStatusFilter.value = activeStatusFilter.value === status ? "" : status
  pagination.pageIndex = 1
  loadAppList()
}

// ── 搜索字段 ──────────────────────────────────
const searchFields = [
  {
    prop: "keyword",
    label: "关键词",
    type: "input",
    placeholder: "申请标题 / 业务ID",
    width: "220px",
  },
  {
    prop: "businessType",
    label: "业务类型",
    type: "select",
    width: "160px",
    options: Object.entries(businessTypeMap).map(([k, v]) => ({ value: k, label: v.label })),
  },
  {
    prop: "status",
    label: "流程状态",
    type: "select",
    width: "140px",
    options: [
      { value: "running",    label: "审批中" },
      { value: "completed",  label: "已完成" },
      { value: "terminated", label: "已撤回" },
    ],
  },
  {
    prop: "dateRange",
    label: "发起时间",
    type: "daterange",
    width: "260px",
  },
]

// ── 表格列 ────────────────────────────────────
const tableColumns = [
  { prop: "title",         label: "申请标题", minWidth: 200 },
  { prop: "businessType",  label: "业务类型", width: 120   },
  { prop: "businessId",    label: "业务ID",   width: 148   },
  { prop: "status",        label: "流程状态", width: 110   },
  { prop: "currentNodes",  label: "当前节点", width: 180   },
  { prop: "createdTime",   label: "发起时间", width: 170   },
  { prop: "completedTime", label: "完成时间", width: 170   },
]

// ── 加载列表 ──────────────────────────────────
async function loadAppList() {
  loading.value = true
  try {
    const result = await getProcessList({
      createdBy: adminInfo.userid || undefined,
      businessId: searchParams.value.keyword || undefined,
      businessType: searchParams.value.businessType || undefined,
      status: activeStatusFilter.value || searchParams.value.status || undefined,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    })
    appList.value = result.items ?? []
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
  loadAppList()
}

const handleReset = () => {
  searchParams.value = {}
  activeStatusFilter.value = ""
  pagination.pageIndex = 1
  loadAppList()
}

const handlePageChange = (page) => {
  pagination.pageIndex = page
  loadAppList()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.pageIndex = 1
  loadAppList()
}

// ── 查看抽屉 ──────────────────────────────────
const drawerVisible   = ref(false)
const currentAppInfo  = ref(null)
const currentFlowData = ref(null)
const currentNodes    = ref([])
const flowLoading     = ref(false)
const nodesLoading    = ref(false)

const openViewDrawer = async (row) => {
  const snapshot = { ...row }

  currentAppInfo.value = {
    businessId:  snapshot.businessId,
    title:       snapshot.businessId,
    applicant:   snapshot.createdBy || "—",
    createdTime: snapshot.createdTime,
    status:      snapshot.status,
  }
  currentFlowData.value = null
  currentNodes.value    = []
  drawerVisible.value   = true

  flowLoading.value  = true
  nodesLoading.value = true

  const [flowRes, nodesRes] = await Promise.allSettled([
    getFlowRender(snapshot.businessId),
    getProcessProgress(snapshot.businessId),
  ])

  flowLoading.value = false
  if (flowRes.status === "fulfilled") currentFlowData.value = flowRes.value

  nodesLoading.value = false
  if (nodesRes.status !== "fulfilled") return

  const progress = nodesRes.value
  const roundCounter = {}

  const historyNodes = (progress.auditHistory ?? []).map((record) => {
    const baseKey = record.taskDefinitionKey
    roundCounter[baseKey] = (roundCounter[baseKey] ?? 0) + 1
    const round = roundCounter[baseKey]
    const nodeKey = round > 1 ? `${baseKey}__round${round}` : baseKey

    return {
      nodeKey,
      nodeName:       record.nodeName ?? baseKey,
      nodeSemantic:   record.nodeSemantic ?? "",
      operator:       record.operatorId ?? "",
      completedAt:    record.operatedAt ?? null,
      approveComment: record.comment ?? null,
      pageCode:       record.pageCode ?? null,
      slotSelections: record.slotSelections ?? [],
      outcome:        record.action === "approve"
        ? "approved"
        : record.action === "reject"
          ? "rejected_terminate"
          : "",
      round,
    }
  })

  const activeNodes = (progress.currentNodes ?? []).map((node) => ({
    nodeKey:        node.nodeId ?? node.taskId ?? "",
    nodeName:       node.nodeName ?? "",
    nodeSemantic:   node.nodeSemantic ?? "",
    operator:       node.assignee ?? "",
    completedAt:    null,
    approveComment: null,
    pageCode:       node.pageCode ?? null,
    slotSelections: [],
    outcome:        "",
    round:          1,
  }))

  currentNodes.value = [...historyNodes, ...activeNodes]
}

// ── 撤回 ──────────────────────────────────────
const confirmWithdraw = (row) => {
  ElMessageBox.confirm(
    `确认撤回「${row.businessId}」？撤回后流程将终止。`,
    "撤回确认",
    {
      type: "warning",
      confirmButtonText: "确认撤回",
      cancelButtonText:  "取消",
      confirmButtonClass: "el-button--danger",
    }
  )
    .then(async () => {
      await terminateProcess({ businessId: row.businessId, reason: "申请人主动撤回" })
      ElMessage.success("撤回成功")
      loadAppList()
    })
    .catch(() => {})
}

// ── 初始化 ────────────────────────────────────
onMounted(() => {
  loadAppList()
})
</script>

<style scoped>
.my-application-page {
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

.val-primary  { color: var(--wf-primary);  }
.val-neutral  { color: var(--wf-ink-2);    }
.val-danger   { color: var(--wf-danger);   }
.val-warning  { color: var(--wf-warning);  }
.val-success  { color: var(--wf-success);  }

.kpi-row {
  display: flex;
  gap: var(--wf-space-16);
  margin-bottom: var(--wf-space-16);
}

.kpi-card {
  flex: 1;
  min-width: 160px;
  background: var(--wf-canvas);
  border-radius: var(--wf-radius-lg);
  padding: var(--wf-space-16) var(--wf-space-20);
  display: flex;
  align-items: center;
  gap: var(--wf-space-16);
  box-shadow: var(--wf-shadow-card);
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: border-color var(--wf-transition-base),
              box-shadow    var(--wf-transition-base);
}

.kpi-card:hover {
  border-color: var(--wf-primary-border);
}

.kpi-card.kpi-active {
  border-color: var(--wf-primary);
  background: var(--wf-primary-light);
}

.kpi-card:active {
  transform: scale(0.98);
}

.kpi-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--wf-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-running    { background: var(--wf-status-running-bg); color: var(--wf-status-running); }
.icon-completed  { background: var(--wf-success-bg);        color: var(--wf-success);        }
.icon-terminated { background: var(--wf-neutral-bg);        color: var(--wf-neutral-text);   }

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-4);
}

.kpi-val {
  font-size: var(--wf-font-2xl);
  font-weight: var(--wf-font-weight-black);
  letter-spacing: 0;
  line-height: 1;
}

.val-running    { color: var(--wf-status-running); }
.val-completed  { color: var(--wf-success);        }
.val-terminated { color: var(--wf-neutral-text);   }

.kpi-label {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  white-space: nowrap;
}

.app-title-cell {
  display: flex;
  flex-direction: column;
  gap: var(--wf-space-2);
}

.app-main {
  font-size: var(--wf-font-md);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-ink);
}

.app-sub {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
}

.text-muted {
  color: var(--wf-ink-disabled);
  font-size: var(--wf-font-sm);
}
</style>
