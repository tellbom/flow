# Dashboard Porting Patch Plan

**Version:** 1.0  
**Target:** Vue 3 + TypeScript  
**Scope:** Port `Dashboard.html / dashboard.jsx` main content into production Vue components connected to real APIs.

---

## Patch Index

| Patch | File | Action |
|-------|------|--------|
| PATCH-D01 | `src/styles/workflow-dashboard-tokens.scss` | New — design tokens & shared CSS ported from Dashboard.html |
| PATCH-D02 | `src/views/backend/dashboard/components/DashboardKpiCard.vue` | New — single KPI card (presentational) |
| PATCH-D03 | `src/views/backend/dashboard/components/DashboardKpiSection.vue` | New — 4-card KPI row (presentational) |
| PATCH-D04 | `src/views/backend/dashboard/components/DashboardAuditTrend.vue` | New — stacked bar chart + summary (presentational) |
| PATCH-D05 | `src/views/backend/dashboard/components/DashboardStatusDistribution.vue` | New — SVG donut + legend (presentational) |
| PATCH-D06 | `src/views/backend/dashboard/components/DashboardPendingTasks.vue` | New — pending task list (presentational) |
| PATCH-D07 | `src/views/backend/dashboard/components/DashboardActivityFeed.vue` | New — audit activity feed (presentational) |
| PATCH-D08 | `src/views/backend/dashboard/components/DashboardProcessList.vue` | New — process table with filter/pagination (presentational) |
| PATCH-D09 | `src/views/backend/dashboard/components/DashboardEmptyState.vue` | New — reusable empty state |
| PATCH-D10 | `src/views/backend/dashboard/components/DashboardErrorState.vue` | New — reusable error state |
| PATCH-D11 | `src/views/backend/dashboard/ProcessDashboard.vue` | New — parent orchestrator: calls all APIs, passes props |
| PATCH-D12 | `src/router/static/adminBase.ts` (or equivalent static routes file) | Add route `/admin/dashboard` → `ProcessDashboard.vue` |

---

## PATCH-D01 — `src/styles/workflow-dashboard-tokens.scss`

Create this file. It provides CSS custom properties scoped to `.process-dashboard-page` so they do not leak into the global host shell.

```scss
// workflow-dashboard-tokens.scss
// All tokens ported from Dashboard.html :root block.
// Scoped under .process-dashboard-page to avoid collision with host app.

.process-dashboard-page {
  // ── Colour palette ──────────────────────────────────────────
  --c-primary:        #0066cc;
  --c-primary-focus:  #0071e3;
  --c-ink:            #1d1d1f;
  --c-ink-80:         #333333;
  --c-ink-48:         #7a7a7a;
  --c-divider-soft:   #f0f0f0;
  --c-hairline:       #e0e0e0;
  --c-canvas:         #ffffff;
  --c-parchment:      #f5f5f7;
  --c-pearl:          #fafafc;

  // ── Semantic status colours (restrained default) ────────────
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

  // ── Radii ────────────────────────────────────────────────────
  --r-sm:   8px;
  --r-md:   11px;
  --r-lg:   18px;
  --r-pill: 9999px;

  // ── Borders ─────────────────────────────────────────────────
  --hairline: 1px solid var(--c-hairline);

  // ── Typography (font families only; sizes declared inline) ──
  --font-text:    "SF Pro Text", "PingFang SC", system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  --font-display: "SF Pro Display", "PingFang SC", system-ui, -apple-system, sans-serif;
  --font-mono:    "SF Mono", ui-monospace, "Menlo", "Consolas", monospace;
}
```

---

## PATCH-D02 — `DashboardKpiCard.vue`

**Path:** `src/views/backend/dashboard/components/DashboardKpiCard.vue`

```vue
<template>
  <div class="kpi">
    <div class="kpi-head">
      <div>
        <div class="kpi-label">{{ label }}</div>
        <div class="api-trace" style="margin-top: 8px">
          <span class="dot" :style="{ background: `var(--s-${tone})` }"></span>
          {{ api }}
        </div>
      </div>
      <div
        class="kpi-icon"
        :style="{
          background: `var(--s-${tone}-tint)`,
          color: `var(--s-${tone})`,
        }"
      >
        <!-- icon slot -->
        <slot name="icon" />
      </div>
    </div>

    <div class="kpi-value-row">
      <div class="kpi-value">{{ formattedValue }}</div>
      <div v-if="unit" class="kpi-unit">{{ unit }}</div>
      <div v-if="delta" :class="['kpi-delta', deltaTone]">{{ delta }}</div>
    </div>

    <div v-if="foot && foot.length" class="kpi-foot">
      <div v-for="(f, i) in foot" :key="i" class="seg" style="flex: 1">
        <div class="v">{{ f.v }}</div>
        <div class="l">{{ f.l }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface FootItem { v: string | number; l: string }

const props = defineProps<{
  tone: string          // 'running' | 'completed' | 'failed' | 'warning' | 'terminated'
  label: string
  value: number
  unit?: string
  delta?: string
  deltaTone?: string    // 'up' | 'down' | 'flat'
  api: string
  foot?: FootItem[]
}>()

const formattedValue = computed(() => props.value.toLocaleString())
</script>

<style scoped>
/* All selectors are already defined in workflow-dashboard-tokens.scss
   via the parent .process-dashboard-page scope.
   Scoped styles here only add component-local overrides. */
</style>
```

---

## PATCH-D03 — `DashboardKpiSection.vue`

**Path:** `src/views/backend/dashboard/components/DashboardKpiSection.vue`

```vue
<template>
  <div class="kpi-row">
    <!-- KPI 1: My Pending Tasks -->
    <DashboardKpiCard
      tone="running"
      label="我的待办"
      :value="pendingTotal"
      unit="项"
      api="GET /api/tasks/pending"
      :foot="pendingFoot"
    >
      <template #icon>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M9 11l3 3 8-8"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      </template>
    </DashboardKpiCard>

    <!-- KPI 2: Running processes -->
    <DashboardKpiCard
      tone="running"
      label="运行中流程"
      :value="statusCounts.running"
      unit="条"
      api="GET /api/processes?status=running"
      :foot="runningFoot"
    >
      <template #icon>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 3"/>
        </svg>
      </template>
    </DashboardKpiCard>

    <!-- KPI 3: Completed processes -->
    <DashboardKpiCard
      tone="completed"
      label="已完成"
      :value="statusCounts.completed"
      unit="条 · 累计"
      api="GET /api/processes?status=completed"
      :foot="completedFoot"
    >
      <template #icon>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M5 12l5 5L20 7"/>
        </svg>
      </template>
    </DashboardKpiCard>

    <!-- KPI 4: Anomalies -->
    <DashboardKpiCard
      tone="failed"
      label="异常流程"
      :value="anomalyCount"
      unit="条 · 需关注"
      api="status=terminated · status=callback_failed"
      :foot="anomalyFoot"
    >
      <template #icon>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 9v4"/>
          <circle cx="12" cy="17" r=".6" fill="currentColor"/>
          <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/>
        </svg>
      </template>
    </DashboardKpiCard>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardKpiCard from './DashboardKpiCard.vue'

interface StatusCounts {
  running: number
  completed: number
  terminated: number
  callback_failed: number
}

interface AgeBuckets {
  fresh: number
  aging: number
  overdue: number
}

const props = defineProps<{
  statusCounts: StatusCounts
  pendingTotal: number
  pendingBuckets: AgeBuckets
}>()

const anomalyCount = computed(
  () => props.statusCounts.terminated + props.statusCounts.callback_failed
)

const pendingFoot = computed(() => [
  { v: props.pendingBuckets.fresh,   l: '≤ 24h' },
  { v: props.pendingBuckets.aging,   l: '24–72h' },
  { v: props.pendingBuckets.overdue, l: '> 72h' },
])

const runningFoot = computed(() => [
  { v: '—', l: '业务类型' },
  { v: '—', l: '今日新增' },
  { v: '—', l: '按期推进' },
])

const completedFoot = computed(() => [
  { v: '—', l: '平均时长' },
  { v: '—', l: '驳回率' },
  { v: '—', l: '转派率' },
])

const anomalyFoot = computed(() => [
  { v: props.statusCounts.terminated,      l: '已终止' },
  { v: props.statusCounts.callback_failed, l: '回调失败' },
  { v: '—',                                l: '孤儿实例' },
])
</script>
```

> **Note on `runningFoot` / `completedFoot`**: The design shows computed aggregates (avg duration, rejection rate, etc.) that are not directly returned by the current API surface. Use `'—'` as placeholders. If the backend later exposes these, the parent can compute and pass them as additional props.

---

## PATCH-D04 — `DashboardAuditTrend.vue`

**Path:** `src/views/backend/dashboard/components/DashboardAuditTrend.vue`

```vue
<template>
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">
          <span>流程审计趋势</span>
          <span class="api-trace">
            <span class="dot"></span>GET /api/processes/{id}/audit-history
          </span>
        </div>
        <div class="muted t-caption" style="margin-top: 6px">
          按 <code style="font-family: var(--font-mono)">action ∈ { approve, reject, reassign }</code> 按日聚合
        </div>
      </div>
      <div class="seg-control" role="tablist">
        <button
          v-for="[id, label] in rangeOptions"
          :key="id"
          :class="{ 'is-active': range === id }"
          @click="range = id"
        >{{ label }}</button>
      </div>
    </div>

    <!-- Empty state -->
    <DashboardEmptyState v-if="!displayData.length" message="暂无审计数据" />

    <template v-else>
      <div style="display: grid; grid-template-columns: 1fr 200px; gap: 32px; align-items: start">
        <!-- Bar chart -->
        <div>
          <div class="chart-legend" style="margin-bottom: 8px">
            <span class="lg"><span class="sw" style="background: var(--s-completed)"></span>审批通过 · {{ totals.approve }}</span>
            <span class="lg"><span class="sw" style="background: var(--s-failed)"></span>驳回 · {{ totals.reject }}</span>
            <span class="lg"><span class="sw" style="background: var(--s-warning)"></span>转派 · {{ totals.reassign }}</span>
            <span style="margin-left: auto" class="muted t-caption">合计 {{ grandTotal }} 次操作</span>
          </div>
          <svg :viewBox="`0 0 ${W} ${H}`" width="100%" preserveAspectRatio="none" style="display: block">
            <!-- Grid lines -->
            <g class="chart-grid">
              <line
                v-for="(t, i) in ticks" :key="i"
                :x1="PAD_L" :x2="W - PAD_R"
                :y1="yOf(t)" :y2="yOf(t)"
              />
            </g>
            <!-- Y axis labels -->
            <g class="chart-y-axis">
              <text
                v-for="(t, i) in ticks" :key="i"
                :x="PAD_L - 8" :y="yOf(t) + 4"
                text-anchor="end"
              >{{ t }}</text>
            </g>
            <!-- Stacked bars -->
            <g v-for="(d, i) in displayData" :key="i">
              <rect :x="barX(i)" :y="yOf(d.approve)" :width="barW" :height="barH(d.approve)" rx="3" fill="var(--s-completed)" />
              <rect :x="barX(i)" :y="yOf(d.approve + d.reject)" :width="barW" :height="barH(d.reject)" rx="2" fill="var(--s-failed)" />
              <rect :x="barX(i)" :y="yOf(d.approve + d.reject + d.reassign)" :width="barW" :height="barH(d.reassign)" rx="2" fill="var(--s-warning)" />
              <text
                :x="barX(i) + barW / 2"
                :y="yOf(d.approve + d.reject + d.reassign) - 6"
                text-anchor="middle"
                fill="#1d1d1f"
                font-size="11"
                font-weight="600"
                style="font-feature-settings: 'tnum' 1"
              >{{ d.approve + d.reject + d.reassign }}</text>
            </g>
            <!-- X axis labels -->
            <g class="chart-x-axis">
              <text
                v-for="(d, i) in displayData" :key="i"
                :x="barX(i) + barW / 2 + (colW - barW) / 2"
                :y="H - 14"
                text-anchor="middle"
              >{{ d.d }}</text>
            </g>
          </svg>
        </div>

        <!-- Side summary (static design values; extend via props if API provides) -->
        <div>
          <div class="card-eyebrow">本周关键指标</div>
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 4px">
            <div>
              <div class="t-num" style="font-size: 32px; font-weight: 600; line-height: 1">
                —<span style="font-size: 16px; color: var(--c-ink-48); margin-left: 4px">天</span>
              </div>
              <div class="muted t-caption" style="margin-top: 4px">流程平均时长（已完成）</div>
            </div>
            <div class="dotted-divider" style="margin: 0"></div>
            <div>
              <div class="t-num" style="font-size: 32px; font-weight: 600; line-height: 1">
                —<span style="font-size: 16px; color: var(--c-ink-48); margin-left: 4px">%</span>
              </div>
              <div class="muted t-caption" style="margin-top: 4px">驳回率</div>
            </div>
            <div class="dotted-divider" style="margin: 0"></div>
            <div>
              <div class="t-num" style="font-size: 32px; font-weight: 600; line-height: 1">
                —<span style="font-size: 16px; color: var(--c-ink-48); margin-left: 4px">%</span>
              </div>
              <div class="muted t-caption" style="margin-top: 4px">越界提交 · hasOutOfRecommendedRange</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DashboardEmptyState from './DashboardEmptyState.vue'

export interface DailyAuditPoint {
  d: string      // e.g. "05/27"
  approve: number
  reject: number
  reassign: number
}

const props = defineProps<{
  auditData: DailyAuditPoint[]  // full 30-day dataset from parent
}>()

const rangeOptions: [string, string][] = [['7d', '近 7 天'], ['14d', '近 14 天'], ['30d', '近 30 天']]
const range = ref('14d')

const displayData = computed(() => {
  const n = range.value === '7d' ? 7 : range.value === '14d' ? 14 : 30
  return props.auditData.slice(-n)
})

const totals = computed(() =>
  displayData.value.reduce(
    (acc, d) => ({ approve: acc.approve + d.approve, reject: acc.reject + d.reject, reassign: acc.reassign + d.reassign }),
    { approve: 0, reject: 0, reassign: 0 }
  )
)
const grandTotal = computed(() => totals.value.approve + totals.value.reject + totals.value.reassign)

// Chart geometry
const W = 980, H = 280, PAD_L = 40, PAD_R = 12, PAD_T = 20, PAD_B = 36
const innerW = W - PAD_L - PAD_R
const innerH = H - PAD_T - PAD_B

const niceMax = computed(() => {
  const maxTotal = Math.max(...displayData.value.map(d => d.approve + d.reject + d.reassign), 1)
  return Math.ceil(maxTotal / 10) * 10
})

const ticks = computed(() => {
  const m = niceMax.value
  return [0, m / 4, m / 2, (m * 3) / 4, m]
})

const colW = computed(() => innerW / (displayData.value.length || 1))
const barW = computed(() => Math.min(28, colW.value * 0.55))

function yOf(val: number) {
  return PAD_T + innerH - (val / niceMax.value) * innerH
}
function barH(val: number) {
  return (val / niceMax.value) * innerH
}
function barX(i: number) {
  return PAD_L + colW.value * i + (colW.value - barW.value) / 2
}
</script>
```

---

## PATCH-D05 — `DashboardStatusDistribution.vue`

**Path:** `src/views/backend/dashboard/components/DashboardStatusDistribution.vue`

```vue
<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <span>流程状态分布</span>
        <span class="api-trace"><span class="dot"></span>GET /api/processes?status=*</span>
      </div>
      <span class="link" @click="$emit('view-all')">查看全部 →</span>
    </div>

    <DashboardEmptyState v-if="total === 0" message="暂无流程数据" />

    <div v-else class="donut-wrap">
      <svg width="200" height="200" viewBox="0 0 200 200" style="flex-shrink: 0">
        <!-- Track -->
        <circle cx="100" cy="100" :r="R" fill="none" stroke="var(--c-pearl)" stroke-width="22" />
        <!-- Segments -->
        <circle
          v-for="(seg, i) in segments" :key="i"
          cx="100" cy="100" :r="R"
          fill="none"
          :stroke="seg.color"
          stroke-width="22"
          :stroke-dasharray="seg.dash"
          stroke-dashoffset="0"
          :transform="`rotate(${seg.rot} 100 100)`"
          stroke-linecap="butt"
        />
        <!-- Centre text -->
        <text x="100" y="96" text-anchor="middle" fill="var(--c-ink)" font-size="32" font-weight="600"
          style="font-feature-settings: 'tnum' 1; letter-spacing: -1px">{{ total.toLocaleString() }}</text>
        <text x="100" y="120" text-anchor="middle" fill="var(--c-ink-48)" font-size="12" letter-spacing="0.5">流程总数</text>
      </svg>

      <div class="donut-legend">
        <div v-for="(it, i) in items" :key="i" class="row">
          <span class="sw" :style="{ background: it.color }"></span>
          <span class="label">{{ it.label }}</span>
          <span class="val">{{ it.val.toLocaleString() }}</span>
          <span class="pct">{{ pct(it.val) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardEmptyState from './DashboardEmptyState.vue'

interface StatusCounts {
  running: number
  completed: number
  terminated: number
  callback_failed: number
}

const props = defineProps<{ statusCounts: StatusCounts }>()
defineEmits<{ (e: 'view-all'): void }>()

const items = computed(() => [
  { key: 'running',         label: '进行中',   val: props.statusCounts.running,         color: 'var(--s-running)' },
  { key: 'completed',       label: '已完成',   val: props.statusCounts.completed,       color: 'var(--s-completed)' },
  { key: 'terminated',      label: '已终止',   val: props.statusCounts.terminated,      color: 'var(--s-terminated)' },
  { key: 'callback_failed', label: '回调失败', val: props.statusCounts.callback_failed, color: 'var(--s-failed)' },
])

const total = computed(() => items.value.reduce((a, b) => a + b.val, 0))

const R = 78
const C = computed(() => 2 * Math.PI * R)
const GAP = 4

const segments = computed(() => {
  let offset = 0
  return items.value.map(it => {
    const frac = total.value > 0 ? it.val / total.value : 0
    const len = frac * C.value - GAP
    const dash = `${Math.max(0, len)} ${C.value - Math.max(0, len)}`
    const rot = -90 + (offset / C.value) * 360
    offset += frac * C.value
    return { color: it.color, dash, rot }
  })
})

function pct(val: number) {
  return total.value > 0 ? ((val / total.value) * 100).toFixed(1) : '0.0'
}
</script>
```

---

## PATCH-D06 — `DashboardPendingTasks.vue`

**Path:** `src/views/backend/dashboard/components/DashboardPendingTasks.vue`

```vue
<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <span>我的待办</span>
        <span class="api-trace"><span class="dot"></span>GET /api/tasks/pending</span>
      </div>
      <div class="seg-control">
        <button
          v-for="[id, label] in filterOptions"
          :key="id"
          :class="{ 'is-active': filter === id }"
          @click="filter = id"
        >{{ label }}</button>
      </div>
    </div>

    <DashboardEmptyState v-if="!filtered.length" message="当前筛选下暂无待办" />

    <div v-else class="task-list">
      <div
        v-for="t in filtered"
        :key="t.taskId"
        class="task-row"
      >
        <div class="task-marker">
          <div class="day">{{ dayOf(t.createTime) }}</div>
          <div class="mo">{{ monthOf(t.createTime) }}</div>
        </div>
        <div class="task-body">
          <div class="name">{{ t.taskName }}</div>
          <div class="meta">
            <span class="biz-id">{{ t.businessId }}</span>
            <span>· {{ bizLabel(t.businessType) }}</span>
            <span>· {{ t.nodeSemantic }}</span>
            <span v-if="t.canReject" class="chip chip-warning" style="padding: 2px 8px; font-size: 11px">可驳回</span>
          </div>
        </div>
        <div :class="['task-age', ageBucket(t.createTime)]">{{ fmtAge(t.createTime) }}</div>
        <button class="btn btn-primary" style="padding: 8px 18px; font-size: 14px" @click="$emit('handle-task', t)">
          处理
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DashboardEmptyState from './DashboardEmptyState.vue'
import type { PendingTaskDto } from '/@/api/workflow/processApi'

const props = defineProps<{ tasks: PendingTaskDto[] }>()
defineEmits<{ (e: 'handle-task', task: PendingTaskDto): void }>()

const filterOptions: [string, string][] = [
  ['all', '全部'], ['fresh', '≤ 24h'], ['aging', '24–72h'], ['overdue', '> 72h'],
]
const filter = ref('all')

function ageMs(iso: string) { return Date.now() - new Date(iso).getTime() }

function ageBucket(iso: string) {
  const h = ageMs(iso) / 36e5
  if (h <= 24) return 'fresh'
  if (h <= 72) return 'aging'
  return 'overdue'
}

function fmtAge(iso: string) {
  const h = ageMs(iso) / 36e5
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} 分钟前`
  if (h < 24) return `${Math.round(h)} 小时前`
  return `${Math.round(h / 24)} 天前`
}

function dayOf(iso: string) {
  return String(new Date(iso).getDate()).padStart(2, '0')
}

function monthOf(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { month: 'short' })
}

const BIZ_LABEL: Record<string, string> = {
  personnel_selection_approval: '人员选派审批',
  budget_request:               '预算申请',
  contract_review:              '合同评审',
  travel_request:               '出差申请',
}
function bizLabel(type: string) { return BIZ_LABEL[type] || type }

const filtered = computed(() => {
  if (filter.value === 'all') return props.tasks
  return props.tasks.filter(t => ageBucket(t.createTime) === filter.value)
})
</script>
```

> **DTO note**: `PendingTaskDto.createTime` maps to `createTime` (C# `DateTime` serialised as ISO string). Confirm the exact casing from the backend response; adjust if the server uses `createTime` vs `CreateTime`.

---

## PATCH-D07 — `DashboardActivityFeed.vue`

**Path:** `src/views/backend/dashboard/components/DashboardActivityFeed.vue`

Activity entries are derived from audit-history records. The parent aggregates audit history across recent processes and passes the flat list.

```vue
<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <span>实时审计动态</span>
        <span class="api-trace"><span class="dot"></span>auditHistory · last 24h</span>
      </div>
      <span class="link" @click="$emit('view-audit')">查看完整审计 →</span>
    </div>

    <DashboardEmptyState v-if="!entries.length" message="暂无审计动态" />

    <div v-else class="feed">
      <div v-for="a in entries" :key="a.id" class="feed-row">
        <div
          class="feed-icon"
          :style="{ background: tone(a.action).bg, color: tone(a.action).c }"
          v-html="iconSvg(a.action)"
        ></div>
        <div class="feed-body">
          <span class="who">{{ a.operatorId }}</span>
          在节点 <span style="color: var(--c-ink-80)">{{ a.nodeSemantic }}</span> 上
          <span :style="{ color: tone(a.action).c, fontWeight: 600 }">{{ actionLabel(a.action) }}</span>
          <div class="meta">
            <span class="biz">{{ a.businessId }}</span>
            <template v-if="a.action === 'approve' && a.slotLabel">
              <span> · 已选 {{ a.slotLabel }}</span>
            </template>
            <template v-else-if="a.action === 'reject' && a.rejectReason">
              <span> · {{ a.rejectReason }}</span>
            </template>
            <template v-else-if="a.action === 'reassign' && a.reassignTo">
              <span> · 转派给 {{ a.reassignTo }}</span>
              <span v-if="a.reason"> · {{ a.reason }}</span>
            </template>
            <template v-else-if="a.action === 'terminate' && a.reason">
              <span> · {{ a.reason }}</span>
            </template>
          </div>
        </div>
        <div class="feed-when">{{ fmtTime(a.operatedAt) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DashboardEmptyState from './DashboardEmptyState.vue'

export interface ActivityEntry {
  id: string | number
  action: 'approve' | 'reject' | 'reassign' | 'terminate'
  operatorId: string
  businessId: string
  nodeSemantic: string
  operatedAt: string        // ISO string
  slotLabel?: string        // e.g. "纪检负责人 (EMP_015)"
  rejectReason?: string
  reassignTo?: string
  reason?: string
}

defineProps<{ entries: ActivityEntry[] }>()
defineEmits<{ (e: 'view-audit'): void }>()

const TONE: Record<string, { c: string; bg: string }> = {
  approve:   { c: 'var(--s-completed)',  bg: 'var(--s-completed-tint)' },
  reject:    { c: 'var(--s-failed)',     bg: 'var(--s-failed-tint)' },
  reassign:  { c: 'var(--s-warning)',    bg: 'var(--s-warning-tint)' },
  terminate: { c: 'var(--s-terminated)', bg: 'var(--s-terminated-tint)' },
}
function tone(action: string) { return TONE[action] ?? TONE.approve }

const ACTION_LABEL: Record<string, string> = {
  approve:   '审批通过',
  reject:    '驳回',
  reassign:  '转派',
  terminate: '终止流程',
}
function actionLabel(action: string) { return ACTION_LABEL[action] ?? action }

const ICONS: Record<string, string> = {
  approve:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12l5 5L20 7"/></svg>`,
  reject:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  reassign:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h13M12 5l7 7-7 7"/></svg>`,
  terminate: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
}
function iconSvg(action: string) { return ICONS[action] ?? ICONS.approve }

function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>
```

---

## PATCH-D08 — `DashboardProcessList.vue`

**Path:** `src/views/backend/dashboard/components/DashboardProcessList.vue`

```vue
<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">
        <span>近期流程</span>
        <span class="api-trace"><span class="dot"></span>GET /api/processes</span>
      </div>
      <div style="display: flex; gap: 12px; align-items: center">
        <div class="seg-control">
          <button
            v-for="[id, label] in statusOptions"
            :key="id"
            :class="{ 'is-active': statusFilter === id }"
            @click="onFilter(id)"
          >{{ label }}</button>
        </div>
      </div>
    </div>

    <DashboardEmptyState v-if="!rows.length && !loading" message="暂无流程数据" />

    <template v-else>
      <table class="tbl">
        <thead>
          <tr>
            <th style="width: 14%">businessId</th>
            <th style="width: 14%">业务类型</th>
            <th style="width: 10%">状态</th>
            <th style="width: 22%">当前节点 / 处理人</th>
            <th style="width: 18%">推进进度</th>
            <th style="width: 12%">发起人 · 时间</th>
            <th style="width: 10%; text-align: right">操作</th>
          </tr>
        </thead>
        <tbody>
          <!-- Skeleton rows while loading -->
          <tr v-if="loading" v-for="n in 5" :key="`sk-${n}`">
            <td colspan="7">
              <div class="skeleton-row"></div>
            </td>
          </tr>
          <tr v-else v-for="r in rows" :key="r.businessId">
            <td class="biz-id">{{ r.businessId }}</td>
            <td>{{ bizLabel(r.businessType) }}</td>
            <td>
              <span :class="['chip', chipClass(r.status)]">{{ statusLabel(r.status) }}</span>
            </td>
            <td>
              <div class="node-mini">
                <span v-if="r.currentAssignee" class="avatar-mini">{{ initials(r.currentAssignee) }}</span>
                <div>
                  <div style="color: var(--c-ink); font-weight: 500">{{ r.currentNodeName || '—' }}</div>
                  <div class="muted" style="font-size: 12px">
                    {{ r.currentAssignee || '—' }} · {{ r.currentNodeSemantic || '—' }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px">
                <div :class="['progress', progressClass(r.status)]">
                  <div class="bar" :style="{ width: progressPct(r) }"></div>
                </div>
                <span class="t-num" style="font-size: 12px; color: var(--c-ink-80); min-width: 32px">
                  {{ progressPct(r) }}
                </span>
              </div>
            </td>
            <td>
              <div style="color: var(--c-ink-80)">{{ r.createdBy }}</div>
              <div class="muted" style="font-size: 12px">{{ fmtDateTime(r.createdTime) }}</div>
            </td>
            <td style="text-align: right">
              <span class="link" @click="$emit('view-detail', r)">查看</span>
              <span style="margin: 0 8px; color: var(--c-divider-soft)">·</span>
              <span class="link" @click="$emit('view-flow', r)">流程图</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="tbl-foot">
        <span>共 {{ total }} 条 · 当前展示 {{ rows.length }} 条</span>
        <div class="pagination">
          <button @click="onPage(currentPage - 1)" :disabled="currentPage <= 1">‹</button>
          <button
            v-for="p in visiblePages" :key="p"
            :class="{ 'is-active': p === currentPage }"
            @click="onPage(p)"
          >{{ p }}</button>
          <button @click="onPage(currentPage + 1)" :disabled="currentPage >= totalPages">›</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardEmptyState from './DashboardEmptyState.vue'
import type { ProcessListItem } from '/@/api/workflow/processApi'

// ProcessListItem from processApi.ts (fields used here):
//   businessId, businessType, status, createdBy, createdTime,
//   currentNodeName?, currentNodeSemantic?, currentAssignee?, progress?

const props = defineProps<{
  rows: ProcessListItem[]
  total: number
  currentPage: number
  pageSize: number
  statusFilter: string
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'filter-change', status: string): void
  (e: 'page-change', page: number): void
  (e: 'view-detail', row: ProcessListItem): void
  (e: 'view-flow', row: ProcessListItem): void
}>()

const statusOptions: [string, string][] = [
  ['all', '全部'],
  ['running', '进行中'],
  ['completed', '已完成'],
  ['callback_failed', '回调失败'],
  ['terminated', '已终止'],
]

function onFilter(id: string) { emit('filter-change', id) }
function onPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  emit('page-change', p)
}

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

const visiblePages = computed(() => {
  const cur = props.currentPage
  const last = totalPages.value
  const pages: number[] = []
  for (let p = Math.max(1, cur - 2); p <= Math.min(last, cur + 2); p++) pages.push(p)
  return pages
})

const BIZ_LABEL: Record<string, string> = {
  personnel_selection_approval: '人员选派审批',
  budget_request:               '预算申请',
  contract_review:              '合同评审',
  travel_request:               '出差申请',
}
function bizLabel(type: string) { return BIZ_LABEL[type] || type }

const STATUS_LABEL: Record<string, string> = {
  running:         '进行中',
  completed:       '已完成',
  terminated:      '已终止',
  callback_failed: '回调失败',
}
function statusLabel(s: string) { return STATUS_LABEL[s] || s }

function chipClass(s: string) {
  return s === 'callback_failed' ? 'chip-failed' : `chip-${s}`
}
function progressClass(s: string) {
  if (s === 'completed')       return 'completed'
  if (s === 'terminated')      return 'terminated'
  if (s === 'callback_failed') return 'failed'
  return ''
}

function progressPct(r: ProcessListItem) {
  const val = (r as any).progress
  if (val == null) return '—'
  return `${(Number(val) * 100).toFixed(0)}%`
}

function initials(id: string) { return id ? id.slice(-3) : '—' }

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} · ${hh}:${min}`
}
</script>

<style scoped>
.skeleton-row {
  height: 18px;
  background: linear-gradient(90deg, var(--c-pearl) 25%, #ececec 50%, var(--c-pearl) 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}
@keyframes shimmer {
  0%   { background-position: 100% 0 }
  100% { background-position: -100% 0 }
}
</style>
```

> **`progress` field note**: `ProcessListItem` as typed in `processApi.ts` does not include `progress` — it comes from the progress endpoint (`/api/processes/{id}/progress`). The parent component should either (a) skip progress display for the list view, or (b) lazily fetch per-row progress. For dashboard purposes, option (a) is recommended: display `'—'` for progress, and the `progressPct` helper already handles that case.

---

## PATCH-D09 — `DashboardEmptyState.vue`

**Path:** `src/views/backend/dashboard/components/DashboardEmptyState.vue`

```vue
<template>
  <div class="dashboard-empty">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--c-ink-48)" stroke-width="1.4">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
    <span class="muted t-caption">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<style scoped>
.dashboard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--c-ink-48);
}
</style>
```

---

## PATCH-D10 — `DashboardErrorState.vue`

**Path:** `src/views/backend/dashboard/components/DashboardErrorState.vue`

```vue
<template>
  <div class="dashboard-error">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--s-failed)" stroke-width="1.6">
      <path d="M12 9v4"/>
      <circle cx="12" cy="17" r=".6" fill="var(--s-failed)"/>
      <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/>
    </svg>
    <div>
      <div class="muted t-caption">{{ message || '数据加载失败' }}</div>
      <button v-if="showRetry" class="btn btn-pearl" style="margin-top: 10px; font-size: 13px" @click="$emit('retry')">
        重试
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string; showRetry?: boolean }>()
defineEmits<{ (e: 'retry'): void }>()
</script>

<style scoped>
.dashboard-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 36px 0;
  text-align: center;
}
</style>
```

---

## PATCH-D11 — `ProcessDashboard.vue` (Parent Orchestrator)

**Path:** `src/views/backend/dashboard/ProcessDashboard.vue`

This is the only component that calls APIs. All other components receive data via props.

```vue
<template>
  <div class="process-dashboard-page">
    <!-- ══ KPI Row ══ -->
    <section class="section-block">
      <DashboardErrorState
        v-if="kpiError"
        message="KPI 数据加载失败"
        :show-retry="true"
        @retry="loadKpi"
      />
      <template v-else>
        <!-- Skeleton while loading -->
        <div v-if="kpiLoading" class="kpi-row">
          <div v-for="n in 4" :key="n" class="kpi skeleton-card"></div>
        </div>
        <DashboardKpiSection
          v-else
          :status-counts="statusCounts"
          :pending-total="pendingTasks.length"
          :pending-buckets="pendingBuckets"
        />
      </template>
    </section>

    <!-- ══ Trend + Donut Row ══ -->
    <div class="row-2-1">
      <!-- Trend chart -->
      <div>
        <DashboardErrorState v-if="auditError" message="审计数据加载失败" :show-retry="true" @retry="loadAudit" />
        <div v-else-if="auditLoading" class="card skeleton-card" style="height: 340px"></div>
        <DashboardAuditTrend v-else :audit-data="auditData" />
      </div>
      <!-- Donut -->
      <div>
        <DashboardErrorState v-if="kpiError" message="状态分布加载失败" :show-retry="true" @retry="loadKpi" />
        <div v-else-if="kpiLoading" class="card skeleton-card" style="height: 340px"></div>
        <DashboardStatusDistribution v-else :status-counts="statusCounts" @view-all="goProcessList" />
      </div>
    </div>

    <!-- ══ Pending Tasks + Activity Feed Row ══ -->
    <div class="row-3-2">
      <div>
        <DashboardErrorState v-if="pendingError" message="待办加载失败" :show-retry="true" @retry="loadPending" />
        <div v-else-if="pendingLoading" class="card skeleton-card" style="height: 320px"></div>
        <DashboardPendingTasks v-else :tasks="pendingTasks" @handle-task="handleTask" />
      </div>
      <div>
        <DashboardErrorState v-if="auditError" message="审计动态加载失败" :show-retry="true" @retry="loadAudit" />
        <div v-else-if="auditLoading" class="card skeleton-card" style="height: 320px"></div>
        <DashboardActivityFeed v-else :entries="activityFeed" @view-audit="goAudit" />
      </div>
    </div>

    <!-- ══ Process Table ══ -->
    <section>
      <DashboardErrorState v-if="processListError" message="流程列表加载失败" :show-retry="true" @retry="loadProcessList" />
      <div v-else-if="processListLoading" class="card skeleton-card" style="height: 400px"></div>
      <DashboardProcessList
        v-else
        :rows="processListRows"
        :total="processListTotal"
        :current-page="processListPage"
        :page-size="processListPageSize"
        :status-filter="processStatusFilter"
        :loading="processListLoading"
        @filter-change="onProcessFilterChange"
        @page-change="onProcessPageChange"
        @view-detail="viewProcessDetail"
        @view-flow="viewProcessFlow"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import DashboardKpiSection       from './components/DashboardKpiSection.vue'
import DashboardAuditTrend       from './components/DashboardAuditTrend.vue'
import DashboardStatusDistribution from './components/DashboardStatusDistribution.vue'
import DashboardPendingTasks     from './components/DashboardPendingTasks.vue'
import DashboardActivityFeed     from './components/DashboardActivityFeed.vue'
import DashboardProcessList      from './components/DashboardProcessList.vue'
import DashboardErrorState       from './components/DashboardErrorState.vue'

import {
  getPendingTasks,
  getProcessList,
  getAuditHistory,
  type PendingTaskDto,
  type ProcessListItem,
  type AuditRecordDto,
} from '/@/api/workflow/processApi'
import type { ActivityEntry } from './components/DashboardActivityFeed.vue'
import type { DailyAuditPoint } from './components/DashboardAuditTrend.vue'

// ── Import styles ────────────────────────────────────────────────
import '/@/styles/workflow-dashboard-tokens.scss'

const router = useRouter()

// ═══════════════════════════════════════════════
//  KPI data  (pending + process counts)
// ═══════════════════════════════════════════════
const kpiLoading = ref(false)
const kpiError   = ref(false)

const pendingLoading = ref(false)
const pendingError   = ref(false)
const pendingTasks   = ref<PendingTaskDto[]>([])

interface StatusCounts { running: number; completed: number; terminated: number; callback_failed: number }
const statusCounts = ref<StatusCounts>({ running: 0, completed: 0, terminated: 0, callback_failed: 0 })

const pendingBuckets = computed(() => {
  let fresh = 0, aging = 0, overdue = 0
  for (const t of pendingTasks.value) {
    const h = (Date.now() - new Date(t.createTime).getTime()) / 36e5
    if (h <= 24) fresh++
    else if (h <= 72) aging++
    else overdue++
  }
  return { fresh, aging, overdue }
})

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

async function loadKpi() {
  kpiLoading.value = true
  kpiError.value   = false
  try {
    const [running, completed, terminated, callbackFailed] = await Promise.allSettled([
      getProcessList({ status: 'running',         pageSize: 1, pageIndex: 1 }),
      getProcessList({ status: 'completed',       pageSize: 1, pageIndex: 1 }),
      getProcessList({ status: 'terminated',      pageSize: 1, pageIndex: 1 }),
      getProcessList({ status: 'callback_failed', pageSize: 1, pageIndex: 1 }),
    ])
    statusCounts.value = {
      running:         running.status         === 'fulfilled' ? running.value.total         : 0,
      completed:       completed.status       === 'fulfilled' ? completed.value.total       : 0,
      terminated:      terminated.status      === 'fulfilled' ? terminated.value.total      : 0,
      callback_failed: callbackFailed.status  === 'fulfilled' ? callbackFailed.value.total  : 0,
    }
  } catch {
    kpiError.value = true
  } finally {
    kpiLoading.value = false
  }
}

// ═══════════════════════════════════════════════
//  Audit trend + activity feed
//  Strategy: fetch the 20 most-recent completed/running processes,
//  pull audit-history for each, aggregate into daily buckets.
// ═══════════════════════════════════════════════
const auditLoading = ref(false)
const auditError   = ref(false)
const auditData    = ref<DailyAuditPoint[]>([])
const activityFeed = ref<ActivityEntry[]>([])

async function loadAudit() {
  auditLoading.value = true
  auditError.value   = false
  try {
    // Fetch the 20 most recent processes (any status) to get audit coverage
    const listRes = await getProcessList({ pageSize: 20, pageIndex: 1 })
    const processes = listRes.items

    // Fetch audit history for each process concurrently (best-effort)
    const auditResults = await Promise.allSettled(
      processes.map(p => getAuditHistory(p.businessId))
    )

    // Flatten all audit records
    const allRecords: (AuditRecordDto & { businessId: string })[] = []
    auditResults.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        res.value.forEach(r => allRecords.push({ ...r, businessId: processes[i].businessId }))
      }
    })

    // Sort by operatedAt descending
    allRecords.sort((a, b) => new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime())

    // Build activity feed (latest 10)
    activityFeed.value = allRecords.slice(0, 10).map((r, idx) => {
      const entry: ActivityEntry = {
        id:           idx,
        action:       mapAction(r.action),
        operatorId:   r.operatorId,
        businessId:   r.businessId,
        nodeSemantic: r.nodeSemantic ?? '—',
        operatedAt:   r.operatedAt,
      }
      if (r.action === 1 && r.slotSelections?.length) {
        const slot = r.slotSelections[0]
        entry.slotLabel = `${slot.slotKey} (${(slot.selectedUsers ?? []).join(', ')})`
      }
      if (r.action === 2) entry.rejectReason = r.rejectReason ?? undefined
      return entry
    })

    // Build daily audit points (last 30 days)
    const buckets = new Map<string, DailyAuditPoint>()
    for (const r of allRecords) {
      const d = new Date(r.operatedAt)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
      if (!buckets.has(key)) buckets.set(key, { d: key, approve: 0, reject: 0, reassign: 0 })
      const pt = buckets.get(key)!
      const act = mapAction(r.action)
      if (act === 'approve')  pt.approve++
      if (act === 'reject')   pt.reject++
      if (act === 'reassign') pt.reassign++
    }
    // Sort ascending by date key
    auditData.value = [...buckets.values()].sort((a, b) => a.d.localeCompare(b.d))
  } catch {
    auditError.value = true
  } finally {
    auditLoading.value = false
  }
}

/**
 * AuditRecordDto.action is a number in the C# backend (1=approve, 2=reject, 3=reassign, 4=terminate).
 * Adjust if the serialised value is already a string.
 */
function mapAction(action: number | string): ActivityEntry['action'] {
  if (action === 1 || action === 'approve')   return 'approve'
  if (action === 2 || action === 'reject')    return 'reject'
  if (action === 3 || action === 'reassign')  return 'reassign'
  if (action === 4 || action === 'terminate') return 'terminate'
  return 'approve'
}

// ═══════════════════════════════════════════════
//  Process list (table)
// ═══════════════════════════════════════════════
const processListLoading  = ref(false)
const processListError    = ref(false)
const processListRows     = ref<ProcessListItem[]>([])
const processListTotal    = ref(0)
const processListPage     = ref(1)
const processListPageSize = ref(10)
const processStatusFilter = ref('all')

async function loadProcessList() {
  processListLoading.value = true
  processListError.value   = false
  try {
    const params: Record<string, any> = {
      pageIndex: processListPage.value,
      pageSize:  processListPageSize.value,
    }
    if (processStatusFilter.value !== 'all') params.status = processStatusFilter.value

    const res = await getProcessList(params)
    processListRows.value  = res.items
    processListTotal.value = res.total
  } catch {
    processListError.value = true
  } finally {
    processListLoading.value = false
  }
}

function onProcessFilterChange(status: string) {
  processStatusFilter.value = status
  processListPage.value = 1
  loadProcessList()
}

function onProcessPageChange(page: number) {
  processListPage.value = page
  loadProcessList()
}

// ═══════════════════════════════════════════════
//  Navigation helpers (emit to host router)
// ═══════════════════════════════════════════════
function goProcessList() { router.push('/admin/process') }
function goAudit()       { router.push('/admin/audit') }

function handleTask(task: PendingTaskDto) {
  router.push(`/admin/todo?taskId=${task.taskId}`)
}
function viewProcessDetail(row: ProcessListItem) {
  router.push(`/admin/process/${row.businessId}`)
}
function viewProcessFlow(row: ProcessListItem) {
  router.push(`/admin/process/${row.businessId}/flow`)
}

// ═══════════════════════════════════════════════
//  Bootstrap — concurrent initial load
// ═══════════════════════════════════════════════
onMounted(() => {
  Promise.all([
    loadPending(),
    loadKpi(),
    loadAudit(),
    loadProcessList(),
  ])
})
</script>

<style scoped>
/*
  Page layout — mirrors Dashboard.html .page
  No fixed width; uses max-width + flexible padding.
*/
.process-dashboard-page {
  max-width: 1856px;
  margin: 0 auto;
  padding: 32px 40px 80px;
  display: grid;
  gap: 24px;
  background: var(--c-parchment);
  font-family: var(--font-text);
  color: var(--c-ink);
  -webkit-font-smoothing: antialiased;
}

.section-block { display: contents; }

/* Skeleton loading card */
.skeleton-card {
  background: linear-gradient(90deg, var(--c-pearl) 25%, #ececec 50%, var(--c-pearl) 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--r-lg);
  min-height: 160px;
}
@keyframes shimmer {
  0%   { background-position: 100% 0 }
  100% { background-position: -100% 0 }
}
</style>
```

---

## PATCH-D12 — Route Registration

**File:** `src/router/static/adminBase.ts` (or whichever file registers backend admin static routes)

Add the following route entry to the existing `adminRoutes` array:

```typescript
{
  path: 'dashboard',                   // resolves to /admin/dashboard
  name: 'ProcessDashboard',
  component: () => import('/@/views/backend/dashboard/ProcessDashboard.vue'),
  meta: {
    title: '流程中心首页',
    requiresAuth: true,
  },
},
```

If the project uses a dedicated home/index route, replace or alias the existing home component with `ProcessDashboard.vue`.

---

## Global Styles Reference

The following CSS classes are already defined in `workflow-dashboard-tokens.scss` (PATCH-D01) and in the global scope via `:root` in `Dashboard.html`. They are referenced by child components using the parent `.process-dashboard-page` scope:

| Class group | Used by |
|---|---|
| `.kpi`, `.kpi-row`, `.kpi-*` | DashboardKpiCard, DashboardKpiSection |
| `.card`, `.card-header`, `.card-title`, `.card-eyebrow` | All card components |
| `.api-trace`, `.dot` | DashboardKpiCard, DashboardAuditTrend, etc. |
| `.chip`, `.chip-running`, `.chip-completed`, `.chip-failed`, `.chip-terminated` | DashboardProcessList |
| `.row-2-1`, `.row-3-2` | ProcessDashboard layout |
| `.task-list`, `.task-row`, `.task-marker`, `.task-body`, `.task-age` | DashboardPendingTasks |
| `.feed`, `.feed-row`, `.feed-icon`, `.feed-body`, `.feed-when` | DashboardActivityFeed |
| `.donut-wrap`, `.donut-legend` | DashboardStatusDistribution |
| `.chart-legend`, `.chart-grid`, `.chart-y-axis`, `.chart-x-axis` | DashboardAuditTrend |
| `.seg-control` | DashboardPendingTasks, DashboardProcessList, DashboardAuditTrend |
| `.tbl`, `.tbl-foot`, `.pagination` | DashboardProcessList |
| `.btn`, `.btn-primary`, `.btn-pearl` | DashboardPendingTasks, DashboardProcessList |
| `.muted`, `.t-caption`, `.t-num` | Multiple components |
| `.dotted-divider` | DashboardAuditTrend |
| `.link` | DashboardStatusDistribution, DashboardActivityFeed, DashboardProcessList |

**These CSS classes must be added to a globally-imported stylesheet** (e.g. `src/styles/workflow-dashboard-tokens.scss` imported in `ProcessDashboard.vue`) because they are used inside child components that have `<style scoped>`. Since scoped styles cannot style child component internals, declare the shared classes in the parent-level import.

Alternatively, move the class definitions to `src/styles/index.scss` (already globally imported in `main.ts`) under the `.process-dashboard-page` scope block.

---

## Implementation Notes for Codex

1. **`AuditRecordDto` field mapping**: The `action` field is serialised as a number from the C# `ApprovalAction` enum. The `mapAction()` function in `ProcessDashboard.vue` handles both numeric and string forms. Verify the actual JSON output from the `.NET 8` backend and adjust if needed.

2. **`PendingTaskDto.createTime`**: This field name must match exactly what the backend serialises. The C# DTO uses `createTime` (camelCase via `JsonNamingPolicy.CamelCase`). If the project's axios instance does not apply camelCase conversion, the raw field name may be `CreateTime`. Confirm and adjust `DashboardPendingTasks.vue` accordingly.

3. **`ProcessListItem` missing fields**: The `currentNodeName`, `currentNodeSemantic`, `currentAssignee`, and `progress` fields shown in the dashboard design are not in the base `ProcessListItem` DTO (which comes from the ES lightweight list query). The table will show `'—'` for these. Do not add fake data.

4. **Audit data aggregation**: The current API has no dedicated dashboard aggregation endpoint. The parent loads the 20 most-recent processes and fetches their audit histories concurrently (best-effort). This is the correct approach per the existing API surface. If the backend later adds a `/api/dashboard/summary` endpoint, the parent can be updated.

5. **Route paths**: `/admin/todo?taskId=`, `/admin/process`, `/admin/audit`, and `/admin/process/:id/flow` are illustrative. Replace with the actual registered route names/paths from your project's `adminBase.ts`.

6. **No `ribbon-tile` component is included** per the explicit scope exclusion in the task requirements.

7. **`workflow-dashboard-tokens.scss` import**: Add `@import '/@/styles/workflow-dashboard-tokens.scss';` to `src/styles/index.scss` so the CSS variables and shared classes are available globally. This avoids the scoped-CSS inheritance problem entirely.
