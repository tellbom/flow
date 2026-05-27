<template>
  <div>

    <!-- ══════════════════════════════════════════════════
         KPI 四张卡
    ══════════════════════════════════════════════════ -->
    <div class="pd-kpi-row">

      <!-- loading 骨架 -->
      <template v-if="countsLoading || pendingLoading">
        <div v-for="n in 4" :key="n" class="pd-kpi pd-skeleton" style="min-height:160px"></div>
      </template>

      <!-- 全部失败 -->
      <template v-else-if="countsError && pendingError">
        <div class="pd-kpi" style="grid-column:1/-1">
          <div class="pd-state-box">
            数据加载失败
            <button class="pd-btn pd-btn-pearl" @click="$emit('retry-counts'); $emit('retry-pending')">重试</button>
          </div>
        </div>
      </template>

      <template v-else>
        <!-- 卡1：我的待办 -->
        <div class="pd-kpi">
          <div class="pd-kpi-head">
            <div>
              <div class="pd-kpi-label">我的待办</div>
              <div class="pd-api-trace" style="margin-top:8px">
                <span class="dot" style="background:var(--s-running)"></span>GET /api/tasks/pending
              </div>
            </div>
            <div class="pd-kpi-icon" style="background:var(--s-running-tint);color:var(--s-running)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
          </div>
          <div class="pd-kpi-value-row">
            <div class="pd-kpi-value">{{ pendingTasks.length.toLocaleString() }}</div>
            <div class="pd-kpi-unit">项</div>
          </div>
          <div class="pd-kpi-foot">
            <div class="seg"><div class="v">{{ pendingBuckets.fresh }}</div><div class="l">≤ 24h</div></div>
            <div class="seg"><div class="v">{{ pendingBuckets.aging }}</div><div class="l">24–72h</div></div>
            <div class="seg"><div class="v">{{ pendingBuckets.overdue }}</div><div class="l">&gt; 72h</div></div>
          </div>
        </div>

        <!-- 卡2：运行中流程 -->
        <div class="pd-kpi">
          <div class="pd-kpi-head">
            <div>
              <div class="pd-kpi-label">运行中流程</div>
              <div class="pd-api-trace" style="margin-top:8px">
                <span class="dot" style="background:var(--s-running)"></span>GET /api/processes?status=running
              </div>
            </div>
            <div class="pd-kpi-icon" style="background:var(--s-running-tint);color:var(--s-running)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
              </svg>
            </div>
          </div>
          <div class="pd-kpi-value-row">
            <div class="pd-kpi-value">{{ statusCounts.running.toLocaleString() }}</div>
            <div class="pd-kpi-unit">条</div>
          </div>
          <div class="pd-kpi-foot">
            <div class="seg"><div class="v">—</div><div class="l">业务类型</div></div>
            <div class="seg"><div class="v">—</div><div class="l">今日新增</div></div>
            <div class="seg"><div class="v">—</div><div class="l">按期推进</div></div>
          </div>
        </div>

        <!-- 卡3：已完成 -->
        <div class="pd-kpi">
          <div class="pd-kpi-head">
            <div>
              <div class="pd-kpi-label">已完成</div>
              <div class="pd-api-trace" style="margin-top:8px">
                <span class="dot" style="background:var(--s-completed)"></span>GET /api/processes?status=completed
              </div>
            </div>
            <div class="pd-kpi-icon" style="background:var(--s-completed-tint);color:var(--s-completed)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </div>
          </div>
          <div class="pd-kpi-value-row">
            <div class="pd-kpi-value">{{ statusCounts.completed.toLocaleString() }}</div>
            <div class="pd-kpi-unit">条 · 累计</div>
          </div>
          <div class="pd-kpi-foot">
            <div class="seg"><div class="v">—</div><div class="l">平均时长</div></div>
            <div class="seg"><div class="v">—</div><div class="l">驳回率</div></div>
            <div class="seg"><div class="v">—</div><div class="l">转派率</div></div>
          </div>
        </div>

        <!-- 卡4：异常流程 -->
        <div class="pd-kpi">
          <div class="pd-kpi-head">
            <div>
              <div class="pd-kpi-label">异常流程</div>
              <div class="pd-api-trace" style="margin-top:8px">
                <span class="dot" style="background:var(--s-failed)"></span>status=terminated · callback_failed
              </div>
            </div>
            <div class="pd-kpi-icon" style="background:var(--s-failed-tint);color:var(--s-failed)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 9v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>
                <path d="M10.3 3.7 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/>
              </svg>
            </div>
          </div>
          <div class="pd-kpi-value-row">
            <div class="pd-kpi-value">{{ anomaly.toLocaleString() }}</div>
            <div class="pd-kpi-unit">条 · 需关注</div>
          </div>
          <div class="pd-kpi-foot">
            <div class="seg"><div class="v">{{ statusCounts.terminated }}</div><div class="l">已终止</div></div>
            <div class="seg"><div class="v">{{ statusCounts.callback_failed }}</div><div class="l">回调失败</div></div>
            <div class="seg"><div class="v">—</div><div class="l">孤儿实例</div></div>
          </div>
        </div>
      </template>
    </div><!-- /kpi-row -->


    <!-- ══════════════════════════════════════════════════
         row-2-1：审计趋势（左）+ 甜甜圈（右）
         父组件把 DashboardChart 填入 #chart slot。
    ══════════════════════════════════════════════════ -->
    <div class="pd-row-2-1">
      <slot name="chart" />

      <div class="pd-card">
      <div class="pd-card-header">
        <div class="pd-card-title">
          <span>流程状态分布</span>
          <span class="pd-api-trace"><span class="dot"></span>GET /api/processes?status=*</span>
        </div>
        <span class="pd-link">查看全部 →</span>
      </div>

      <div v-if="countsLoading" class="pd-state-box" style="padding:48px 0">
        <div class="pd-skeleton" style="width:160px;height:160px;border-radius:50%"></div>
      </div>
      <div v-else-if="countsError" class="pd-state-box">
        状态分布加载失败
        <button class="pd-btn pd-btn-pearl" @click="$emit('retry-counts')">重试</button>
      </div>
      <div v-else class="pd-donut-wrap">
        <svg width="200" height="200" viewBox="0 0 200 200" style="flex-shrink:0">
          <circle cx="100" cy="100" :r="R" fill="none" stroke="var(--c-pearl)" stroke-width="22"/>
          <circle
            v-for="(seg, i) in donutSegments" :key="i"
            cx="100" cy="100" :r="R"
            fill="none"
            :stroke="seg.color"
            stroke-width="22"
            :stroke-dasharray="seg.dash"
            stroke-dashoffset="0"
            :transform="`rotate(${seg.rot} 100 100)`"
            stroke-linecap="butt"
          />
          <text x="100" y="96" text-anchor="middle" fill="var(--c-ink)"
            font-size="32" font-weight="600"
            style="font-feature-settings:'tnum' 1;letter-spacing:-1px">
            {{ donutTotal.toLocaleString() }}
          </text>
          <text x="100" y="120" text-anchor="middle" fill="var(--c-ink-48)"
            font-size="12" letter-spacing="0.5">流程总数</text>
        </svg>
        <div class="pd-donut-legend">
          <div v-for="it in donutItems" :key="it.key" class="row">
            <span class="sw" :style="{ background: it.color }"></span>
            <span class="lbl">{{ it.label }}</span>
            <span class="val">{{ it.val.toLocaleString() }}</span>
            <span class="pct">{{ donutTotal > 0 ? (it.val / donutTotal * 100).toFixed(1) : '0.0' }}%</span>
          </div>
        </div>
      </div>
      </div><!-- /donut card -->
    </div><!-- /pd-row-2-1 -->


    <!-- ══════════════════════════════════════════════════
         row-3-2：待办（左）+ 活动流（右）
    ══════════════════════════════════════════════════ -->
    <div class="pd-row-3-2">

      <!-- 我的待办 -->
      <div class="pd-card">
        <div class="pd-card-header">
          <div class="pd-card-title">
            <span>我的待办</span>
            <span class="pd-api-trace"><span class="dot"></span>GET /api/tasks/pending</span>
          </div>
          <div class="pd-seg-control">
            <button
              v-for="[id, lbl] in taskFilters" :key="id"
              :class="{ 'is-active': taskFilter === id }"
              @click="taskFilter = id"
            >{{ lbl }}</button>
          </div>
        </div>

        <div v-if="pendingLoading">
          <div v-for="n in 4" :key="n" class="pd-skeleton" style="height:52px;margin-bottom:1px;border-radius:4px"></div>
        </div>
        <div v-else-if="pendingError" class="pd-state-box">
          待办加载失败
          <button class="pd-btn pd-btn-pearl" @click="$emit('retry-pending')">重试</button>
        </div>
        <div v-else-if="filteredTasks.length === 0" class="pd-muted pd-t-caption" style="text-align:center;padding:28px 0">
          当前筛选下暂无待办
        </div>
        <div v-else class="pd-task-list">
          <div v-for="t in filteredTasks" :key="t.taskId" class="pd-task-row">
            <div class="pd-task-marker">
              <div class="day">{{ dayOf(t.createTime) }}</div>
              <div class="mo">{{ monthOf(t.createTime) }}</div>
            </div>
            <div class="pd-task-body">
              <div class="name">{{ t.taskName }}</div>
              <div class="meta">
                <span class="biz-id">{{ t.businessId }}</span>
                <span>· {{ bizLabel(t.businessType) }}</span>
                <span>· {{ t.nodeSemantic }}</span>
                <span v-if="t.canReject" class="pd-chip pd-chip-warning" style="padding:2px 8px;font-size:11px">可驳回</span>
              </div>
            </div>
            <div :class="['pd-task-age', ageBucket(t.createTime)]">{{ fmtAge(t.createTime) }}</div>
            <button class="pd-btn pd-btn-primary" style="padding:8px 18px;font-size:14px" @click="$emit('handle-task', t)">
              处理
            </button>
          </div>
        </div>
      </div><!-- /待办卡 -->

      <!-- 实时审计动态 -->
      <div class="pd-card">
        <div class="pd-card-header">
          <div class="pd-card-title">
            <span>实时审计动态</span>
            <span class="pd-api-trace"><span class="dot"></span>auditHistory · last 24h</span>
          </div>
          <span class="pd-link">查看完整审计 →</span>
        </div>

        <div v-if="auditLoading">
          <div v-for="n in 5" :key="n" class="pd-skeleton" style="height:44px;margin-bottom:1px;border-radius:4px"></div>
        </div>
        <div v-else-if="auditError" class="pd-state-box">
          审计动态加载失败
          <button class="pd-btn pd-btn-pearl" @click="$emit('retry-audit')">重试</button>
        </div>
        <div v-else-if="activityFeed.length === 0" class="pd-muted pd-t-caption" style="text-align:center;padding:28px 0">
          暂无审计动态
        </div>
        <div v-else class="pd-feed">
          <div v-for="a in activityFeed" :key="a.id" class="pd-feed-row">
            <div
              class="pd-feed-icon"
              :style="{ background: feedTone(a.action).bg, color: feedTone(a.action).c }"
              v-html="feedIcon(a.action)"
            ></div>
            <div class="pd-feed-body">
              <span class="who">{{ a.operatorId }}</span>
              在节点 <span style="color:var(--c-ink-80)">{{ a.nodeSemantic }}</span> 上
              <span :style="{ color: feedTone(a.action).c, fontWeight: 600 }">{{ actionLabel(a.action) }}</span>
              <div class="meta">
                <span class="biz">{{ a.businessId }}</span>
                <span v-if="a.action === 'approve' && a.slotLabel"> · 已选 {{ a.slotLabel }}</span>
                <span v-if="a.action === 'reject' && a.rejectReason"> · {{ a.rejectReason }}</span>
              </div>
            </div>
            <div class="pd-feed-when">{{ fmtTime(a.operatedAt) }}</div>
          </div>
        </div>
      </div><!-- /活动流卡 -->

    </div><!-- /pd-row-3-2 -->

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PendingTaskDto } from '/@/api/workflow/processApi'
import type { StatusCounts, ActivityEntry } from '../dashboard.vue'

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  pendingTasks:   PendingTaskDto[]
  statusCounts:   StatusCounts
  activityFeed:   ActivityEntry[]
  pendingLoading: boolean
  countsLoading:  boolean
  auditLoading:   boolean
  pendingError:   boolean
  countsError:    boolean
  auditError:     boolean
}>()

defineEmits<{
  (e: 'handle-task',    task: PendingTaskDto): void
  (e: 'retry-pending'): void
  (e: 'retry-counts'):  void
  (e: 'retry-audit'):   void
}>()

// ─── KPI 衍生 ─────────────────────────────────────────────────────────────────
const anomaly = computed(() =>
  props.statusCounts.terminated + props.statusCounts.callback_failed
)
const pendingBuckets = computed(() => {
  let fresh = 0, aging = 0, overdue = 0
  for (const t of props.pendingTasks) {
    const b = ageBucket(t.createTime)
    if (b === 'fresh') fresh++
    else if (b === 'aging') aging++
    else overdue++
  }
  return { fresh, aging, overdue }
})

// ─── Donut ────────────────────────────────────────────────────────────────────
const R = 78
const C = 2 * Math.PI * R
const GAP = 4

const donutItems = computed(() => [
  { key: 'running',         label: '进行中',   val: props.statusCounts.running,         color: 'var(--s-running)' },
  { key: 'completed',       label: '已完成',   val: props.statusCounts.completed,       color: 'var(--s-completed)' },
  { key: 'terminated',      label: '已终止',   val: props.statusCounts.terminated,      color: 'var(--s-terminated)' },
  { key: 'callback_failed', label: '回调失败', val: props.statusCounts.callback_failed, color: 'var(--s-failed)' },
])
const donutTotal = computed(() => donutItems.value.reduce((a, b) => a + b.val, 0))
const donutSegments = computed(() => {
  let offset = 0
  return donutItems.value.map(it => {
    const frac = donutTotal.value > 0 ? it.val / donutTotal.value : 0
    const len  = Math.max(0, frac * C - GAP)
    const dash = `${len} ${C - len}`
    const rot  = -90 + (offset / C) * 360
    offset += frac * C
    return { color: it.color, dash, rot }
  })
})

// ─── 待办筛选 ─────────────────────────────────────────────────────────────────
const taskFilters: [string, string][] = [
  ['all', '全部'], ['fresh', '≤ 24h'], ['aging', '24–72h'], ['overdue', '> 72h'],
]
const taskFilter = ref('all')
const filteredTasks = computed(() => {
  if (taskFilter.value === 'all') return props.pendingTasks
  return props.pendingTasks.filter(t => ageBucket(t.createTime) === taskFilter.value)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ageBucket(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 36e5
  if (h <= 24) return 'fresh'
  if (h <= 72) return 'aging'
  return 'overdue'
}
function fmtAge(iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 36e5
  if (h < 1)  return `${Math.max(1, Math.round(h * 60))} 分钟前`
  if (h < 24) return `${Math.round(h)} 小时前`
  return `${Math.round(h / 24)} 天前`
}
function dayOf(iso: string)   { return String(new Date(iso).getDate()).padStart(2, '0') }
function monthOf(iso: string) { return new Date(iso).toLocaleString('zh-CN', { month: 'short' }) }
function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const BIZ_LABEL: Record<string, string> = {
  personnel_selection_approval: '人员选派审批',
  budget_request:               '预算申请',
  contract_review:              '合同评审',
  travel_request:               '出差申请',
}
function bizLabel(t: string) { return BIZ_LABEL[t] || t }

// ─── Activity feed ────────────────────────────────────────────────────────────
const FEED_TONE: Record<string, { c: string; bg: string }> = {
  approve:   { c: 'var(--s-completed)',  bg: 'var(--s-completed-tint)' },
  reject:    { c: 'var(--s-failed)',     bg: 'var(--s-failed-tint)' },
  reassign:  { c: 'var(--s-warning)',    bg: 'var(--s-warning-tint)' },
  terminate: { c: 'var(--s-terminated)', bg: 'var(--s-terminated-tint)' },
}
function feedTone(action: string) { return FEED_TONE[action] ?? FEED_TONE.approve }

const FEED_ICON: Record<string, string> = {
  approve:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12l5 5L20 7"/></svg>`,
  reject:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  reassign:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h13M12 5l7 7-7 7"/></svg>`,
  terminate: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
}
function feedIcon(action: string) { return FEED_ICON[action] ?? FEED_ICON.approve }

const ACTION_LABEL: Record<string, string> = {
  approve: '审批通过', reject: '驳回', reassign: '转派', terminate: '终止流程',
}
function actionLabel(action: string) { return ACTION_LABEL[action] ?? action }
</script>
