<template>
  <div class="pd-card pd-chart-card">
    <div class="pd-card-header">
      <div class="pd-card-title">
        <span>审计趋势</span>
        <span class="pd-api-trace"><span class="dot"></span>auditHistory · by day</span>
      </div>
      <div class="pd-chart-legend">
        <span class="lg"><span class="sw approve"></span>审批通过</span>
        <span class="lg"><span class="sw reject"></span>驳回</span>
      </div>
    </div>

    <div v-if="loading" class="pd-chart-shell">
      <div class="pd-skeleton pd-chart-skeleton"></div>
      <div class="pd-chart-side">
        <div v-for="n in 3" :key="n" class="pd-skeleton pd-chart-stat-skeleton"></div>
      </div>
    </div>

    <div v-else-if="error" class="pd-state-box pd-chart-state">
      审计趋势加载失败
      <button class="pd-btn pd-btn-pearl" @click="$emit('retry')">重试</button>
    </div>

    <div v-else-if="auditData.length === 0" class="pd-state-box pd-chart-state">
      暂无审计趋势数据
    </div>

    <div v-else class="pd-chart-shell">
      <div ref="chartEl" class="pd-chart-canvas"></div>
      <div class="pd-chart-side">
        <div class="pd-chart-stat">
          <span class="label">审批通过次数</span>
          <span class="value approve">{{ totals.approve.toLocaleString() }}</span>
        </div>
        <div class="pd-chart-stat">
          <span class="label">驳回次数</span>
          <span class="value reject">{{ totals.reject.toLocaleString() }}</span>
        </div>
        <div class="pd-chart-stat">
          <span class="label">合计</span>
          <span class="value">{{ totals.total.toLocaleString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  type GridComponentOption,
  type LegendComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ComposeOption, ECharts } from 'echarts/core'

import type { DailyAuditPoint } from '../dashboard.vue'

type ChartOption = ComposeOption<
  BarSeriesOption | GridComponentOption | LegendComponentOption | TooltipComponentOption
>

const APPROVE_COLOR = '#1d8348'
const REJECT_COLOR = '#b8392f'

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  auditData: DailyAuditPoint[]
  loading: boolean
  error: boolean
}>()

defineEmits<{
  (e: 'retry'): void
}>()

const chartEl = ref<HTMLDivElement>()
const chart = shallowRef<ECharts>()
let resizeObserver: ResizeObserver | undefined

const totals = computed(() => {
  const approve = props.auditData.reduce((sum, item) => sum + item.approve, 0)
  const reject = props.auditData.reduce((sum, item) => sum + item.reject, 0)
  return { approve, reject, total: approve + reject }
})

function buildOption(): ChartOption {
  const days = props.auditData.map(item => item.d)
  const approve = props.auditData.map(item => item.approve)
  const reject = props.auditData.map(item => item.reject)

  return {
    color: [APPROVE_COLOR, REJECT_COLOR],
    grid: { left: 8, right: 10, top: 28, bottom: 4, containLabel: true },
    legend: { show: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: value => Number(value || 0).toLocaleString(),
    },
    xAxis: {
      type: 'category',
      data: days,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#d2d2d7' } },
      axisLabel: { color: '#6e6e73', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#e8e8ed', type: 'dashed' } },
      axisLabel: { color: '#6e6e73', fontSize: 12 },
    },
    series: [
      {
        name: '审批通过',
        type: 'bar',
        stack: 'total',
        barWidth: 24,
        data: approve,
        itemStyle: { color: APPROVE_COLOR },
        emphasis: { focus: 'series' },
      },
      {
        name: '驳回',
        type: 'bar',
        stack: 'total',
        barWidth: 24,
        data: reject,
        itemStyle: {
          color: REJECT_COLOR,
          borderRadius: [3, 3, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#1d1d1f',
          fontSize: 12,
          formatter: params => {
            const index = params.dataIndex ?? 0
            return String((approve[index] || 0) + (reject[index] || 0))
          },
        },
        emphasis: { focus: 'series' },
      },
    ],
  }
}

async function renderChart() {
  if (props.loading || props.error || props.auditData.length === 0) return
  await nextTick()
  if (!chartEl.value) return

  if (!chart.value) {
    chart.value = echarts.init(chartEl.value, null, { renderer: 'canvas' })
    resizeObserver = new ResizeObserver(() => chart.value?.resize())
    resizeObserver.observe(chartEl.value)
  }

  chart.value.setOption(buildOption(), true)
  chart.value.resize()
}

watch(
  () => [props.auditData, props.loading, props.error] as const,
  () => {
    if (props.loading || props.error || props.auditData.length === 0) {
      chart.value?.dispose()
      chart.value = undefined
      resizeObserver?.disconnect()
      resizeObserver = undefined
      return
    }
    renderChart()
  },
  { deep: true, immediate: true }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart.value?.dispose()
})
</script>

<style scoped>
.pd-chart-card {
  min-width: 0;
}

.pd-chart-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 170px;
  gap: 22px;
  align-items: stretch;
  min-height: 260px;
}

.pd-chart-canvas {
  min-width: 0;
  min-height: 260px;
}

.pd-chart-side {
  display: grid;
  gap: 12px;
  align-content: center;
}

.pd-chart-stat {
  border: 1px solid var(--c-divider-soft);
  border-radius: var(--r-md);
  padding: 14px;
  background: var(--c-pearl);
}

.pd-chart-stat .label {
  display: block;
  color: var(--c-ink-48);
  font-size: 12px;
  line-height: 1.4;
}

.pd-chart-stat .value {
  display: block;
  margin-top: 6px;
  color: var(--c-ink);
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  font-feature-settings: "tnum" 1;
}

.pd-chart-stat .value.approve {
  color: #1d8348;
}

.pd-chart-stat .value.reject {
  color: #b8392f;
}

.pd-chart-legend .sw.approve {
  background: #1d8348;
}

.pd-chart-legend .sw.reject {
  background: #b8392f;
}

.pd-chart-skeleton {
  min-height: 260px;
}

.pd-chart-stat-skeleton {
  height: 78px;
  border-radius: var(--r-md);
}

.pd-chart-state {
  min-height: 260px;
  justify-content: center;
}

@media (max-width: 900px) {
  .pd-chart-shell {
    grid-template-columns: 1fr;
  }

  .pd-chart-side {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 640px) {
  .pd-card-header {
    align-items: flex-start;
    gap: 12px;
    flex-direction: column;
  }

  .pd-chart-side {
    grid-template-columns: 1fr;
  }
}
</style>
