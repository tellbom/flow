<template>
  <div class="my-application-page">
    <!-- ══ 页头 Banner ══ -->
    <div class="page-banner">
      <div class="banner-bg-circle banner-circle-1"></div>
      <div class="banner-bg-circle banner-circle-2"></div>
      <div class="banner-content">
        <div class="banner-left">
          <div class="banner-icon-wrap">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div>
            <div class="banner-title">我的申请</div>
            <div class="banner-sub">
              共 <b>{{ appList.length }}</b> 条申请记录
            </div>
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

    <!-- ══ KPI 卡片行 ══ -->
    <div class="kpi-row">
      <div
        v-for="k in kpiCards"
        :key="k.label"
        class="kpi-card"
        :class="{ 'kpi-active': activeStatusFilter === k.status }"
        @click="toggleStatusFilter(k.status)"
      >
        <div class="kpi-icon-wrap" :style="{ background: k.bgColor }">
          <el-icon :size="22" :color="k.color"
            ><component :is="k.icon"
          /></el-icon>
        </div>
        <div>
          <div class="kpi-val" :style="{ color: k.color }">{{ k.val }}</div>
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
      :table-data="pagedList"
      :columns="tableColumns"
      :total="filteredList.length"
      :current-page="pagination.page"
      :page-size="pagination.size"
      :show-operation="true"
      :operation-width="160"
      storage-key="my-application-columns"
      row-key="processInstanceId"
      @page-change="pagination.page = $event"
      @size-change="pagination.size = $event"
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
          >{{
            businessTypeMap[row.businessType]?.label || row.businessType
          }}</el-tag
        >
      </template>

      <!-- 流程状态列 -->
      <template #status="{ row }">
        <div class="status-cell">
          <span class="status-dot" :class="`s-${row.status}`"></span>
          <el-tag :type="statusTagType(row.status)" size="small" round>
            {{ statusLabel(row.status) }}
          </el-tag>
        </div>
      </template>

      <!-- 当前节点列 -->
      <template #currentNodes="{ row }">
        <template
          v-if="row.status === 'running' && row.currentNodeNames?.length"
        >
          <el-tag
            v-for="n in row.currentNodeNames"
            :key="n"
            type="primary"
            size="small"
            round
            style="margin-right: 4px"
            >{{ n }}</el-tag
          >
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
          >查看</el-button
        >
        <el-button
          v-if="row.status === 'running'"
          type="danger"
          size="small"
          link
          :icon="RefreshLeft"
          @click="confirmWithdraw(row)"
          >撤回</el-button
        >
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
import { ref, computed, reactive, onMounted } from "vue";
import {
  Document,
  View,
  RefreshLeft,
  CircleCheck,
  Clock,
  Warning,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import Commonsearch from "/@/components/claudetable/Commonsearch.vue";
import Commontable from "/@/components/claudetable/Commontable.vue";
import ApplicationViewDrawer from "/@/components/todo/ApplicationViewDrawer.vue";
import {
  businessTypeMap,
  apiGetApplicationList,
  apiGetFlowRender,
  apiTerminateProcess,
  apiGetApplicationDetail,
} from "/@/components/todo/mockData.js";

// ── 状态 ──────────────────────────────────────
const appList = ref([]);
const searchParams = ref({});
const pagination = reactive({ page: 1, size: 20 });
const activeStatusFilter = ref("");

// ── KPI 卡片 ──────────────────────────────────
const kpiCards = computed(() => {
  const list = appList.value;
  return [
    {
      label: "审批中",
      status: "running",
      val: list.filter((a) => a.status === "running").length,
      icon: Clock,
      color: "#007aff",
      bgColor: "#eff6ff",
    },
    {
      label: "已完成",
      status: "completed",
      val: list.filter((a) => a.status === "completed").length,
      icon: CircleCheck,
      color: "#34c759",
      bgColor: "#f0fdf4",
    },
    {
      label: "已撤回",
      status: "terminated",
      val: list.filter((a) => a.status === "terminated").length,
      icon: Warning,
      color: "#9ca3af",
      bgColor: "#f9fafb",
    },
  ];
});

const bannerStats = computed(() => {
  const list = appList.value;
  return [
    {
      label: "本月新增",
      val: list.filter((a) => {
        const d = new Date(a.createdTime);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }).length,
      color: "#fcda50",
    },
    {
      label: "并行审批",
      val: list.filter((a) => (a.currentNodeNames?.length || 0) > 1).length,
      color: "#c7d2fe",
    },
  ];
});

const toggleStatusFilter = (status) => {
  activeStatusFilter.value = activeStatusFilter.value === status ? "" : status;
  pagination.page = 1;
};

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
    options: Object.entries(businessTypeMap).map(([k, v]) => ({
      value: k,
      label: v.label,
    })),
  },
  {
    prop: "status",
    label: "流程状态",
    type: "select",
    width: "140px",
    options: [
      { value: "running", label: "审批中" },
      { value: "completed", label: "已完成" },
      { value: "terminated", label: "已撤回" },
    ],
  },
  {
    prop: "dateRange",
    label: "发起时间",
    type: "daterange",
    width: "260px",
  },
];

// ── 表格列 ────────────────────────────────────
const tableColumns = [
  { prop: "title", label: "申请标题", minWidth: 200 },
  { prop: "businessType", label: "业务类型", width: 120 },
  { prop: "businessId", label: "业务ID", width: 148 },
  { prop: "status", label: "流程状态", width: 110 },
  { prop: "currentNodes", label: "当前节点", width: 180 },
  { prop: "createdTime", label: "发起时间", width: 170 },
  { prop: "completedTime", label: "完成时间", width: 170 }
];

// ── 过滤 ──────────────────────────────────────
const filteredList = computed(() => {
  let list = appList.value;
  if (activeStatusFilter.value) {
    list = list.filter((a) => a.status === activeStatusFilter.value);
  }
  return list;
});

const pagedList = computed(() => {
  const s = (pagination.page - 1) * pagination.size;
  return filteredList.value.slice(s, s + pagination.size);
});

// ── 搜索 ──────────────────────────────────────
const handleSearch = async (params) => {
  searchParams.value = params;
  pagination.page = 1;
  const res = await apiGetApplicationList(params);
  appList.value = res.items ?? [];
};
const handleReset = async () => {
  searchParams.value = {};
  activeStatusFilter.value = "";
  const res = await apiGetApplicationList();
  appList.value = res.items ?? [];
};

// ── 查看抽屉 ──────────────────────────────────
const drawerVisible = ref(false);
const currentAppInfo = ref(null);
const currentFlowData = ref(null);
const currentNodes = ref([]);
const flowLoading = ref(false);
const nodesLoading = ref(false);

const openViewDrawer = async (row) => {
  const snapshot = { ...row }

  // 1. 组装基础信息，立即打开抽屉
  currentAppInfo.value = {
    businessId:  snapshot.businessId,
    title:       snapshot.businessId,
    applicant:   snapshot.createdBy || "—",
    createdTime: snapshot.createdTime,
    status:      snapshot.status,
  };
  currentFlowData.value = null;
  currentNodes.value = [];
  drawerVisible.value = true;

  // 2. 并行请求流程图 + 节点列表
  flowLoading.value = true;
  nodesLoading.value = true;

  const [flowRes, nodesRes] = await Promise.allSettled([
    apiGetFlowRender(snapshot.businessId),
    apiGetApplicationDetail(snapshot.businessId),
  ]);

  flowLoading.value = false;
  if (flowRes.status === "fulfilled") {
    currentFlowData.value = flowRes.value;
  }

  nodesLoading.value = false;
  if (nodesRes.status === "fulfilled") {
    currentNodes.value = nodesRes.value?.nodes ?? [];
  }
};

// ── 撤回 ──────────────────────────────────────
const confirmWithdraw = (row) => {
  ElMessageBox.confirm(
    `确认撤回「${row.businessId}」？撤回后流程将终止。`,
    "撤回确认",
    {
      type: "warning",
      confirmButtonText: "确认撤回",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button--danger",
    }
  )
    .then(async () => {
      await apiTerminateProcess({
        businessId: row.businessId,
        reason: "申请人主动撤回",
      });
      ElMessage.success("撤回成功");
      const res = await apiGetApplicationList(searchParams.value);
      appList.value = res.items ?? [];
    })
    .catch(() => {});
};

// ── 工具 ──────────────────────────────────────
const statusTagType = (s) =>
  ({ running: "primary", completed: "success", terminated: "info" }[s] || "");
const statusLabel = (s) =>
  ({ running: "审批中", completed: "已完成", terminated: "已撤回" }[s] || s);

// ── 初始化 ────────────────────────────────────
const loading = ref(false);
onMounted(async () => {
  loading.value = true;
  try {
    const res = await apiGetApplicationList();
    appList.value = res.items ?? [];
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.my-application-page {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

/* ── Banner（蓝色系区分待办）── */
.page-banner {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
  border-radius: 20px;
  padding: 32px 36px;
  margin-bottom: 20px;
  box-shadow: 0 12px 40px rgba(29, 78, 216, 0.28);
}
.banner-bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  pointer-events: none;
}
.banner-circle-1 {
  width: 280px;
  height: 280px;
  top: -80px;
  right: -40px;
}
.banner-circle-2 {
  width: 160px;
  height: 160px;
  bottom: -60px;
  right: 200px;
}
.banner-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.banner-left {
  display: flex;
  align-items: center;
  gap: 20px;
}
.banner-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.banner-title {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1px;
  margin-bottom: 4px;
}
.banner-sub {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}
.banner-sub b {
  color: #fde68a;
  font-size: 18px;
}
.banner-stats {
  display: flex;
  gap: 32px;
}
.bstat {
  text-align: center;
}
.bstat-val {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -1px;
}
.bstat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

/* ── KPI 卡片行 ── */
.kpi-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.kpi-card {
  flex: 1;
  min-width: 180px;
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.18s;
}
.kpi-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.kpi-active {
  border-color: #007aff;
  box-shadow: 0 4px 20px rgba(0, 122, 255, 0.15);
}
.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.kpi-val {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1;
}
.kpi-label {
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

/* ── 表格单元格 ── */
.app-title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.app-main {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}
.app-sub {
  font-size: 12px;
  color: #888;
}
.status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.s-running {
  background: #3b82f6;
  animation: pulse 1.8s infinite;
}
.s-completed {
  background: #34c759;
}
.s-terminated {
  background: #d1d5db;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
.text-muted {
  color: #bbb;
  font-size: 12px;
}

</style>