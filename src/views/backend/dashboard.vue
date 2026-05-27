<template>
  <div class="pd-page">

    <!-- ══ KPI 行 + 审计趋势 + 甜甜圈 + 待办 + 活动流 ══ -->
    <DashboardCard
      :pending-tasks="pendingTasks"
      :status-counts="statusCounts"
      :activity-feed="activityFeed"
      :pending-loading="pendingLoading"
      :counts-loading="countsLoading"
      :audit-loading="auditLoading"
      :pending-error="pendingError"
      :counts-error="countsError"
      :audit-error="auditError"
      @handle-task="handleTask"
      @retry-pending="loadPending"
      @retry-counts="loadCounts"
      @retry-audit="loadAudit"
    >
      <template #chart>
        <DashboardChart
          :audit-data="auditTrendData"
          :loading="auditLoading"
          :error="auditError"
          @retry="loadAudit"
        />
      </template>
    </DashboardCard>

    <!-- ══ 近期流程表格 ══ -->
    <DashboardTable
      :rows="processRows"
      :total="processTotal"
      :current-page="processPage"
      :page-size="processPageSize"
      :status-filter="processStatusFilter"
      :loading="processLoading"
      :error="processError"
      @filter-change="onFilterChange"
      @page-change="onPageChange"
      @view-detail="viewDetail"
      @view-flow="viewFlow"
      @retry="loadProcessList"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteLocationRaw, RouteRecordName } from 'vue-router'

import DashboardCard  from './components/DashboardCard.vue'
import DashboardChart from './components/DashboardChart.vue'
import DashboardTable from './components/DashboardTable.vue'
import { routePush } from '/@/utils/router'
import { useNavTabs } from '/@/stores/navTabs'

import {
  getPendingTasks,
  getProcessList,
  getAuditHistory,
  type PendingTaskDto,
  type ProcessListItem,
  type AuditRecordDto,
} from '/@/api/workflow/processApi'

const router = useRouter()
const navTabs = useNavTabs()

// ─────────────────────────────────────────────
//  类型
// ─────────────────────────────────────────────

export interface StatusCounts {
  running:         number
  completed:       number
  terminated:      number
  callback_failed: number
}

export interface ActivityEntry {
  id:           number
  action:       string   // 'approve' | 'reject' | 'reassign' | 'terminate'
  operatorId:   string
  businessId:   string
  nodeSemantic: string
  operatedAt:   string
  slotLabel?:   string
  rejectReason?: string
}

export interface DailyAuditPoint {
  d:        string   // 'MM/DD'
  approve:  number
  reject:   number
  reassign: number
}

interface DashboardMenuRoute {
  path: string
  name?: RouteRecordName | null
  component?: unknown
  children?: DashboardMenuRoute[]
}

// ─────────────────────────────────────────────
//  待办
// ─────────────────────────────────────────────

const pendingTasks   = ref<PendingTaskDto[]>([])
const pendingLoading = ref(false)
const pendingError   = ref(false)

async function loadPending() {
  pendingLoading.value = true
  pendingError.value   = false
  try {
    const res = await getPendingTasks({ pageSize: 50 })
    pendingTasks.value = res.items
  } catch {
    pendingError.value = true
  } finally {
    pendingLoading.value = false
  }
}

// ─────────────────────────────────────────────
//  各状态流程计数（KPI + 甜甜圈）
//  四条请求并发，任一失败不影响其余
// ─────────────────────────────────────────────

const statusCounts  = ref<StatusCounts>({ running: 0, completed: 0, terminated: 0, callback_failed: 0 })
const countsLoading = ref(false)
const countsError   = ref(false)

async function loadCounts() {
  countsLoading.value = true
  countsError.value   = false
  try {
    const [r, c, t, f] = await Promise.allSettled([
      getProcessList({ Status: 'running',         PageSize: 1, PageIndex: 1 }),
      getProcessList({ Status: 'completed',       PageSize: 1, PageIndex: 1 }),
      getProcessList({ Status: 'terminated',      PageSize: 1, PageIndex: 1 }),
      getProcessList({ Status: 'callback_failed', PageSize: 1, PageIndex: 1 }),
    ])
    statusCounts.value = {
      running:         r.status === 'fulfilled' ? r.value.total : 0,
      completed:       c.status === 'fulfilled' ? c.value.total : 0,
      terminated:      t.status === 'fulfilled' ? t.value.total : 0,
      callback_failed: f.status === 'fulfilled' ? f.value.total : 0,
    }
    // 如果四条全部失败才标记 error
    if ([r, c, t, f].every(x => x.status === 'rejected')) {
      countsError.value = true
    }
  } catch {
    countsError.value = true
  } finally {
    countsLoading.value = false
  }
}

// ─────────────────────────────────────────────
//  审计历史 → 趋势数据 + 活动流
//  策略：取最近 20 条流程，并发拉各自的 audit-history
//        在前端聚合成柱状图数据（按日）和活动流（最新 10 条）
// ─────────────────────────────────────────────

const auditTrendData = ref<DailyAuditPoint[]>([])
const activityFeed   = ref<ActivityEntry[]>([])
const auditLoading   = ref(false)
const auditError     = ref(false)

async function loadAudit() {
  auditLoading.value = true
  auditError.value   = false
  try {
    // 取最近 20 条流程拿 businessId
    const listRes   = await getProcessList({ PageSize: 20, PageIndex: 1 })
    const processes = listRes.items

    // 并发拉审批历史，best-effort
    const settled = await Promise.allSettled(
      processes.map(p => getAuditHistory(p.businessId).then(records =>
        records.map(r => ({ ...r, _businessId: p.businessId }))
      ))
    )

    // 打平所有审批记录
    type EnrichedRecord = AuditRecordDto & { _businessId: string }
    const allRecords: EnrichedRecord[] = []
    for (const res of settled) {
      if (res.status === 'fulfilled') allRecords.push(...res.value)
    }

    // 按操作时间降序
    allRecords.sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime())

    // ── 活动流：最新 10 条 ──────────────────────────────────────
    activityFeed.value = allRecords.slice(0, 10).map((r, i): ActivityEntry => {
      const entry: ActivityEntry = {
        id:           i,
        action:       r.action,   // 'approve' | 'reject'（AuditRecordDto.action 已是字符串）
        operatorId:   r.operatorId,
        businessId:   r._businessId,
        nodeSemantic: r.nodeSemantic ?? '—',
        operatedAt:   r.operatedAt,
      }
      if (r.action === 'approve' && r.slotSelections?.length) {
        const s = r.slotSelections[0]
        entry.slotLabel = `${s.label}（${(s.users ?? []).join('、')}）`
      }
      if (r.action === 'reject' && r.rejectReason) {
        entry.rejectReason = r.rejectReason
      }
      return entry
    })

    // ── 趋势数据：按 MM/DD 聚合 ─────────────────────────────────
    const buckets = new Map<string, DailyAuditPoint>()
    for (const r of allRecords) {
      const d   = new Date(r.operatedAt)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
      if (!buckets.has(key)) buckets.set(key, { d: key, approve: 0, reject: 0, reassign: 0 })
      const pt = buckets.get(key)!
      if (r.action === 'approve') pt.approve++
      else if (r.action === 'reject') pt.reject++
      // AuditRecordDto 无 reassign / terminate 字段，reassign 保持 0
    }
    auditTrendData.value = [...buckets.values()].sort((a, b) => a.d.localeCompare(b.d))

    if (allRecords.length === 0 && settled.every(s => s.status === 'rejected')) {
      auditError.value = true
    }
  } catch {
    auditError.value = true
  } finally {
    auditLoading.value = false
  }
}

// ─────────────────────────────────────────────
//  近期流程列表（表格）
// ─────────────────────────────────────────────

const processRows        = ref<ProcessListItem[]>([])
const processTotal       = ref(0)
const processPage        = ref(1)
const processPageSize    = ref(10)
const processStatusFilter = ref('all')
const processLoading     = ref(false)
const processError       = ref(false)

async function loadProcessList() {
  processLoading.value = true
  processError.value   = false
  try {
    const params: Record<string, any> = {
      PageIndex: processPage.value,
      PageSize:  processPageSize.value,
    }
    if (processStatusFilter.value !== 'all') {
      params.Status = processStatusFilter.value
    }
    const res = await getProcessList(params)
    processRows.value  = res.items
    processTotal.value = res.total
  } catch {
    processError.value = true
  } finally {
    processLoading.value = false
  }
}

function onFilterChange(status: string) {
  processStatusFilter.value = status
  processPage.value = 1
  loadProcessList()
}

function onPageChange(page: number) {
  processPage.value = page
  loadProcessList()
}

// ─────────────────────────────────────────────
//  导航
// ─────────────────────────────────────────────

function findMenuRouteByComponent(componentSuffix: string, routeNameFallback: string) {
  const stack: DashboardMenuRoute[] = [...(navTabs.state.tabsViewRoutes as unknown as DashboardMenuRoute[])]
  while (stack.length) {
    const item = stack.shift()!
    const component = typeof item.component === 'string' ? item.component : ''
    if (component.endsWith(componentSuffix)) {
      return item
    }
    if (item.children?.length) stack.push(...item.children)
  }

  if (router.hasRoute(routeNameFallback)) {
    return { path: '', name: routeNameFallback } as DashboardMenuRoute
  }

  return undefined
}

function openMenuRoute(componentSuffix: string, routeNameFallback: string, query: Record<string, string>) {
  const menuRoute = findMenuRouteByComponent(componentSuffix, routeNameFallback)
  if (!menuRoute) return

  const target: RouteLocationRaw = menuRoute.name
    ? { name: menuRoute.name, query }
    : { path: menuRoute.path, query }

  routePush(target)
}

function handleTask(task: PendingTaskDto) {
  openMenuRoute('todo/MyTodo.vue', 'MyTodo', { taskId: task.taskId })
}

function viewDetail(row: ProcessListItem) {
  openMenuRoute('todo/MyApplication.vue', 'MyApplication', { businessId: row.businessId })
}

function viewFlow(row: ProcessListItem) {
  openMenuRoute('todo/MyApplication.vue', 'MyApplication', { businessId: row.businessId, tab: 'flow' })
}

// ─────────────────────────────────────────────
//  初始化：并发加载，互不阻塞
// ─────────────────────────────────────────────

onMounted(() => {
  loadPending()
  loadCounts()
  loadAudit()
  loadProcessList()
})
</script>

<style>
/* ─── Design tokens ───────────────────────────────────────────────────────── */
/* 写在非 scoped 块中，子组件可继承 CSS 变量 */
.pd-page {
  --c-primary:       #0066cc;
  --c-primary-focus: #0071e3;
  --c-ink:           #1d1d1f;
  --c-ink-80:        #333333;
  --c-ink-48:        #7a7a7a;
  --c-divider-soft:  #f0f0f0;
  --c-hairline:      #e0e0e0;
  --c-canvas:        #ffffff;
  --c-parchment:     #f5f5f7;
  --c-pearl:         #fafafc;

  --s-running:          #0066cc;
  --s-completed:        #1d8348;
  --s-terminated:       #7a7a7a;
  --s-failed:           #b8392f;
  --s-warning:          #b27200;
  --s-running-tint:     rgba(0,102,204,0.08);
  --s-completed-tint:   rgba(29,131,72,0.09);
  --s-terminated-tint:  rgba(122,122,122,0.10);
  --s-failed-tint:      rgba(184,57,47,0.10);
  --s-warning-tint:     rgba(178,114,0,0.10);

  --r-sm:   8px;
  --r-md:   11px;
  --r-lg:   18px;
  --r-pill: 9999px;
  --hairline: 1px solid var(--c-hairline);

  --font-text: "SF Pro Text","PingFang SC",system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
  --font-mono: "SF Mono",ui-monospace,"Menlo","Consolas",monospace;
}

/* ─── Page grid（对应 Dashboard.html .page）──────────────────────────────── */
.pd-page {
  max-width: 1856px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
  font-family: var(--font-text);
  color: var(--c-ink);
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

/* ─── 共用布局行 ─────────────────────────────────────────────────────────── */
.pd-row-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 24px;}
.pd-row-3-2 { display: grid; grid-template-columns: 3fr 2fr; gap: 24px;padding: 20px 0}

/* ─── 共用 Card 壳 ───────────────────────────────────────────────────────── */
.pd-card {
  background: var(--c-canvas);
  border: var(--hairline);
  border-radius: var(--r-lg);
  padding: 24px;
}
.pd-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.pd-card-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.374px;
  color: var(--c-ink);
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}
.pd-card-eyebrow {
  font-size: 12px;
  color: var(--c-ink-48);
  letter-spacing: 0.4px;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.pd-api-trace {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--c-pearl);
  border: 1px solid var(--c-divider-soft);
  border-radius: var(--r-pill);
  padding: 3px 9px 3px 8px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--c-ink-48);
  white-space: nowrap;
}
.pd-api-trace .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--s-running);
  flex-shrink: 0;
}
.pd-link {
  color: var(--c-primary);
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.pd-link:hover { color: var(--c-primary-focus); }

.pd-muted { color: var(--c-ink-48); }
.pd-t-caption { font-size: 14px; line-height: 1.43; }
.pd-t-num { font-feature-settings: "tnum" 1; }
.pd-dotted-divider { border-top: 1px dashed var(--c-divider-soft); margin: 14px 0; }

/* ─── Buttons ────────────────────────────────────────────────────────────── */
.pd-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  cursor: pointer;
  font-family: var(--font-text);
  white-space: nowrap;
  transition: transform .12s ease, background-color .15s ease;
}
.pd-btn:active { transform: scale(0.96); }
.pd-btn-primary {
  background: var(--c-primary);
  color: #fff;
  border-radius: var(--r-pill);
  padding: 11px 22px;
  font-size: 17px;
}
.pd-btn-primary:hover { background: var(--c-primary-focus); }
.pd-btn-pearl {
  background: var(--c-pearl);
  color: var(--c-ink-80);
  border: 1px solid var(--c-divider-soft);
  border-radius: var(--r-md);
  padding: 8px 14px;
  font-size: 14px;
}

/* ─── Seg control ────────────────────────────────────────────────────────── */
.pd-seg-control {
  display: inline-flex;
  background: var(--c-pearl);
  border: 1px solid var(--c-divider-soft);
  border-radius: var(--r-pill);
  padding: 3px;
}
.pd-seg-control button {
  border: 0;
  background: transparent;
  color: var(--c-ink-48);
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 13px;
  cursor: pointer;
  font-family: var(--font-text);
  white-space: nowrap;
}
.pd-seg-control button.is-active {
  background: #fff;
  color: var(--c-ink);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* ─── Status chips ───────────────────────────────────────────────────────── */
.pd-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.pd-chip::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.pd-chip-running    { color: var(--s-running);    background: var(--s-running-tint); }
.pd-chip-completed  { color: var(--s-completed);  background: var(--s-completed-tint); }
.pd-chip-terminated { color: var(--s-terminated); background: var(--s-terminated-tint); }
.pd-chip-failed     { color: var(--s-failed);     background: var(--s-failed-tint); }
.pd-chip-warning    { color: var(--s-warning);    background: var(--s-warning-tint); }

/* ─── KPI row ────────────────────────────────────────────────────────────── */
.pd-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;padding: 20px 0; }
.pd-kpi {
  background: var(--c-canvas);
  border: var(--hairline);
  border-radius: var(--r-lg);
  padding: 24px 26px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color .2s ease;
}
.pd-kpi:hover { border-color: #cfd2d6; }
.pd-kpi-head { display: flex; align-items: center; justify-content: space-between; }
.pd-kpi-label { font-size: 14px; color: var(--c-ink-48); letter-spacing: -0.224px; white-space: nowrap; }
.pd-kpi-icon { width: 36px; height: 36px; border-radius: var(--r-md); display: grid; place-items: center; flex-shrink: 0; }
.pd-kpi-value-row { display: flex; align-items: baseline; gap: 12px; }
.pd-kpi-value { font-size: 44px; font-weight: 600; line-height: 1; color: var(--c-ink); font-feature-settings: "tnum" 1; letter-spacing: -1px; }
.pd-kpi-unit { font-size: 14px; color: var(--c-ink-48); }
.pd-kpi-delta { font-size: 13px; padding: 3px 8px; border-radius: var(--r-pill); display: inline-flex; align-items: center; gap: 4px; }
.pd-kpi-delta.up   { background: var(--s-completed-tint); color: var(--s-completed); }
.pd-kpi-delta.down { background: var(--s-failed-tint);    color: var(--s-failed); }
.pd-kpi-delta.flat { background: var(--s-terminated-tint);color: var(--s-terminated); }
.pd-kpi-foot { display: flex; gap: 14px; margin-top: 4px; padding-top: 14px; border-top: 1px dashed var(--c-divider-soft); }
.pd-kpi-foot .seg { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.pd-kpi-foot .seg .v { font-size: 17px; font-weight: 600; color: var(--c-ink); font-feature-settings: "tnum" 1; }
.pd-kpi-foot .seg .l { font-size: 12px; color: var(--c-ink-48); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ─── Donut ──────────────────────────────────────────────────────────────── */
.pd-donut-wrap { display: flex; align-items: center; gap: 22px; }
.pd-donut-legend { display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0; }
.pd-donut-legend .row { display: flex; align-items: center; gap: 10px; font-size: 14px; padding: 6px 0; border-bottom: 1px dashed var(--c-divider-soft); }
.pd-donut-legend .row:last-child { border-bottom: 0; }
.pd-donut-legend .sw  { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.pd-donut-legend .lbl { color: var(--c-ink-80); flex: 1; }
.pd-donut-legend .val { color: var(--c-ink); font-weight: 600; font-feature-settings: "tnum" 1; min-width: 48px; text-align: right; }
.pd-donut-legend .pct { color: var(--c-ink-48); font-size: 12px; min-width: 44px; text-align: right; }

/* ─── Task list ──────────────────────────────────────────────────────────── */
.pd-task-list { display: flex; flex-direction: column; }
.pd-task-row {
  display: grid;
  grid-template-columns: 56px 1fr auto auto;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--c-divider-soft);
}
.pd-task-row:last-child { border-bottom: 0; }
.pd-task-row:hover { background: rgba(0,102,204,0.02); }
.pd-task-marker { width: 56px; padding: 6px 0; text-align: center; border-radius: var(--r-md); background: var(--c-pearl); }
.pd-task-marker .day { font-size: 18px; font-weight: 600; color: var(--c-ink); line-height: 1; font-feature-settings: "tnum" 1; }
.pd-task-marker .mo  { font-size: 11px; color: var(--c-ink-48); margin-top: 2px; letter-spacing: 0.5px; }
.pd-task-body .name { font-size: 15px; font-weight: 600; color: var(--c-ink); letter-spacing: -0.2px; }
.pd-task-body .meta { font-size: 12px; color: var(--c-ink-48); margin-top: 4px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
.pd-task-body .meta .biz-id { font-family: var(--font-mono); }
.pd-task-age { font-size: 12px; padding: 4px 10px; border-radius: 9999px; }
.pd-task-age.fresh   { color: var(--c-ink-48); background: var(--c-pearl); }
.pd-task-age.aging   { color: var(--s-warning); background: var(--s-warning-tint); }
.pd-task-age.overdue { color: var(--s-failed);  background: var(--s-failed-tint); }

/* ─── Activity feed ──────────────────────────────────────────────────────── */
.pd-feed { display: flex; flex-direction: column; }
.pd-feed-row { display: grid; grid-template-columns: 30px 1fr auto; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--c-divider-soft); }
.pd-feed-row:last-child { border-bottom: 0; }
.pd-feed-icon { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; }
.pd-feed-body { font-size: 14px; color: var(--c-ink); letter-spacing: -0.2px; line-height: 1.45; }
.pd-feed-body .who { font-weight: 600; }
.pd-feed-body .biz { font-family: var(--font-mono); font-size: 12px; color: var(--c-ink-80); }
.pd-feed-body .meta { font-size: 12px; color: var(--c-ink-48); margin-top: 2px; }
.pd-feed-when { font-size: 12px; color: var(--c-ink-48); white-space: nowrap; padding-top: 2px; font-feature-settings: "tnum" 1; }

/* ─── Chart ──────────────────────────────────────────────────────────────── */
.pd-chart-legend { display: flex; gap: 18px; font-size: 13px; color: var(--c-ink-80); }
.pd-chart-legend .lg { display: inline-flex; align-items: center; gap: 6px; }
.pd-chart-legend .sw { width: 10px; height: 10px; border-radius: 3px; }

/* ─── Table ──────────────────────────────────────────────────────────────── */
table.pd-tbl { width: 100%; border-collapse: collapse; }
table.pd-tbl th,
table.pd-tbl td { text-align: left; padding: 14px 12px; font-size: 14px; }
table.pd-tbl thead th {
  color: var(--c-ink-48);
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--c-hairline);
  background: var(--c-pearl);
}
table.pd-tbl thead th:first-child { border-top-left-radius: 11px; }
table.pd-tbl thead th:last-child  { border-top-right-radius: 11px; }
table.pd-tbl tbody tr { border-bottom: 1px solid var(--c-divider-soft); }
table.pd-tbl tbody tr:hover { background: rgba(0,102,204,0.02); }
table.pd-tbl tbody tr:last-child { border-bottom: 0; }
table.pd-tbl td.biz-id { font-family: var(--font-mono); font-size: 13px; color: var(--c-ink); }
table.pd-tbl td .progress {
  height: 6px;
  background: var(--c-pearl);
  border-radius: 9999px;
  overflow: hidden;
  width: 140px;
}
table.pd-tbl td .progress .bar { height: 100%; background: var(--s-running); border-radius: 9999px; }
table.pd-tbl td .progress.completed .bar { background: var(--s-completed); }
table.pd-tbl td .progress.terminated .bar { background: var(--s-terminated); }
table.pd-tbl td .progress.failed     .bar { background: var(--s-failed); }
table.pd-tbl td .node-mini { display: flex; gap: 6px; align-items: center; }
table.pd-tbl td .node-mini .avatar-mini {
  width: 22px; height: 22px; border-radius: 50%;
  background: #d2d2d7; color: var(--c-ink);
  display: grid; place-items: center;
  font-size: 10px; font-weight: 600;
  flex-shrink: 0;
}
.pd-tbl-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--c-divider-soft);
  color: var(--c-ink-48);
  font-size: 13px;
}
.pd-pagination { display: inline-flex; gap: 4px; align-items: center; }
.pd-pagination button {
  width: 30px; height: 30px;
  border-radius: 9999px;
  border: 1px solid var(--c-hairline);
  background: #fff;
  color: var(--c-ink-80);
  cursor: pointer;
  font-family: var(--font-text);
  font-size: 13px;
}
.pd-pagination button.is-active { background: var(--c-primary); color: #fff; border-color: var(--c-primary); }
.pd-pagination button:hover:not(.is-active) { border-color: var(--c-primary); color: var(--c-primary); }
.pd-pagination button:disabled { opacity: 0.35; cursor: default; pointer-events: none; }

/* ─── Skeleton shimmer ───────────────────────────────────────────────────── */
.pd-skeleton {
  background: linear-gradient(90deg, var(--c-pearl) 25%, #ececec 50%, var(--c-pearl) 75%);
  background-size: 400% 100%;
  animation: pd-shimmer 1.4s infinite;
  border-radius: var(--r-lg);
}
@keyframes pd-shimmer {
  0%   { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

/* ─── Error / empty inline states ───────────────────────────────────────── */
.pd-state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 36px 0;
  color: var(--c-ink-48);
  font-size: 14px;
  text-align: center;
}
</style>
