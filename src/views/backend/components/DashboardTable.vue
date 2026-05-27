<template>
  <div class="pd-card">

    <!-- ── 卡头 ─────────────────────────────────────────────── -->
    <div class="pd-card-header">
      <div class="pd-card-title">
        <span>近期流程</span>
        <span class="pd-api-trace"><span class="dot"></span>GET /api/processes</span>
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        <div class="pd-seg-control">
          <button
            v-for="[id, lbl] in statusOptions" :key="id"
            :class="{ 'is-active': statusFilter === id }"
            @click="$emit('filter-change', id)"
          >{{ lbl }}</button>
        </div>
      </div>
    </div>

    <!-- ── loading ───────────────────────────────────────────── -->
    <template v-if="loading">
      <div v-for="n in 6" :key="n"
        class="pd-skeleton"
        style="height:44px;margin-bottom:2px;border-radius:4px"
      ></div>
    </template>

    <!-- ── error ─────────────────────────────────────────────── -->
    <div v-else-if="error" class="pd-state-box">
      流程列表加载失败
      <button class="pd-btn pd-btn-pearl" @click="$emit('retry')">重试</button>
    </div>

    <!-- ── empty ─────────────────────────────────────────────── -->
    <div v-else-if="!rows.length" class="pd-state-box">
      暂无流程数据
    </div>

    <!-- ── 表格 ───────────────────────────────────────────────── -->
    <template v-else>
      <table class="pd-tbl">
        <thead>
          <tr>
            <th style="width:14%">businessId</th>
            <th style="width:14%">业务类型</th>
            <th style="width:10%">状态</th>
            <th style="width:22%">当前节点 / 处理人</th>
            <th style="width:18%">推进进度</th>
            <th style="width:12%">发起人 · 时间</th>
            <th style="width:10%;text-align:right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.businessId">

            <!-- businessId -->
            <td class="biz-id">{{ r.businessId }}</td>

            <!-- 业务类型 -->
            <td>{{ bizLabel(r.businessType) }}</td>

            <!-- 状态 chip -->
            <td>
              <span :class="['pd-chip', chipClass(r.status)]">{{ statusLabel(r.status) }}</span>
            </td>

            <!-- 当前节点 / 处理人
                 ProcessListItem 只有 currentNodeNames[]，无 assignee / semantic -->
            <td>
              <div class="node-mini">
                <div>
                  <div style="color:var(--c-ink);font-weight:500">
                    {{ r.currentNodeNames?.length ? r.currentNodeNames.join(' / ') : '—' }}
                  </div>
                  <div class="pd-muted" style="font-size:12px">— · —</div>
                </div>
              </div>
            </td>

            <!-- 推进进度（API 不提供，展示 —） -->
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="progress">
                  <div class="bar" style="width:0%"></div>
                </div>
                <span class="pd-t-num" style="font-size:12px;color:var(--c-ink-80);min-width:32px">—</span>
              </div>
            </td>

            <!-- 发起人 · 时间 -->
            <td>
              <div style="color:var(--c-ink-80)">{{ r.createdBy }}</div>
              <div class="pd-muted" style="font-size:12px">{{ fmtDateTime(r.createdTime) }}</div>
            </td>

            <!-- 操作 -->
            <td style="text-align:right">
              <span class="pd-link" @click="$emit('view-detail', r)">查看</span>
              <span style="margin:0 8px;color:var(--c-divider-soft)">·</span>
              <span class="pd-link" @click="$emit('view-flow', r)">流程图</span>
            </td>

          </tr>
        </tbody>
      </table>

      <!-- ── 表格 footer / 分页 ──────────────────────────────── -->
      <div class="pd-tbl-foot">
        <span>共 {{ total }} 条 · 当前展示 {{ rows.length }} 条</span>
        <div class="pd-pagination">
          <button :disabled="currentPage <= 1" @click="$emit('page-change', currentPage - 1)">‹</button>
          <template v-for="p in visiblePages" :key="p">
            <button
              v-if="typeof p === 'number'"
              :class="{ 'is-active': p === currentPage }"
              @click="$emit('page-change', p)"
            >{{ p }}</button>
            <span v-else class="pd-pagination-ellipsis">...</span>
          </template>
          <button :disabled="currentPage >= totalPages" @click="$emit('page-change', currentPage + 1)">›</button>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProcessListItem } from '/@/api/workflow/processApi'

// ─── Props / Emits ───────────────────────────────────────────────
const props = defineProps<{
  rows:         ProcessListItem[]
  total:        number
  currentPage:  number
  pageSize:     number
  statusFilter: string
  loading:      boolean
  error:        boolean
}>()

defineEmits<{
  (e: 'filter-change', status: string): void
  (e: 'page-change',   page: number):   void
  (e: 'view-detail',   row: ProcessListItem): void
  (e: 'view-flow',     row: ProcessListItem): void
  (e: 'retry'): void
}>()

// ─── 筛选选项 ─────────────────────────────────────────────────────
const statusOptions: [string, string][] = [
  ['all',            '全部'],
  ['running',        '进行中'],
  ['completed',      '已完成'],
  ['callback_failed','回调失败'],
  ['terminated',     '已终止'],
]

// ─── 分页 ─────────────────────────────────────────────────────────
const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.total / props.pageSize))
)

type PageItem = number | 'ellipsis-prev' | 'ellipsis-next'

const visiblePages = computed<PageItem[]>(() => {
  const cur  = props.currentPage
  const last = totalPages.value
  const pages: PageItem[] = []

  // 始终显示第 1 页
  pages.push(1)

  if (cur > 3) pages.push('ellipsis-prev')

  for (let p = Math.max(2, cur - 1); p <= Math.min(last - 1, cur + 1); p++) {
    pages.push(p)
  }

  if (cur < last - 2) pages.push('ellipsis-next')

  // 始终显示最后一页（若超过 1 页）
  if (last > 1) pages.push(last)

  return pages
})

// ─── Helpers ──────────────────────────────────────────────────────
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
  // callback_failed → chip-failed；其余直接拼
  const key = s === 'callback_failed' ? 'failed' : s
  return `pd-chip-${key}`
}

function fmtDateTime(iso: string) {
  const d   = new Date(iso)
  const mm  = String(d.getMonth() + 1).padStart(2, '0')
  const dd  = String(d.getDate()).padStart(2, '0')
  const hh  = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} · ${hh}:${min}`
}
</script>

<style scoped>
.pd-pagination-ellipsis {
  min-width: 22px;
  text-align: center;
  color: var(--c-ink-48);
  font-size: 13px;
}
</style>
