<template>
  <teleport to="body">
    <div class="modal-mask" :class="{ open: modelValue }" @click="$emit('update:modelValue', false)">
      <div class="modal" @click.stop>

        <!-- 头部 -->
        <div class="modal-head">
          <div class="micon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
              <path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <h2>今日重点关注</h2>
            <div class="h-sub">{{ todayStr }} · {{ total }} 项待处理事项</div>
          </div>
          <button class="close" @click="$emit('update:modelValue', false)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- 搜索 + 分页工具栏（父组件驱动） -->
        <div class="toolbar">
          <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
              <path d="M20 20l-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <input
              class="search-input"
              type="text"
              placeholder="搜索问题对象或描述..."
              :value="searchKeyword"
              @input="$emit('search', $event.target.value)"
            />
            <button
              v-if="searchKeyword"
              class="search-clear"
              @click="$emit('search', '')"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="toolbar-right">
            <span class="result-hint">
              {{ searchKeyword ? `共 ${total} 条结果` : `第 ${pageStart}–${pageEnd} 条，共 ${total} 条` }}
            </span>
          </div>
        </div>

        <!-- 列头 -->
        <div class="tbl-head">
          <span class="tc tc--no">序号</span>
          <span class="tc tc--time">统计时间</span>
          <span class="tc tc--cat">问题类别</span>
          <span class="tc tc--obj">问题对象</span>
          <span class="tc tc--desc">问题描述</span>
        </div>

        <!-- 数据区 -->
        <div class="tbl-body">
          <div
            v-for="(item, i) in focusData"
            :key="item.id ?? i"
            class="tbl-row"
            :class="i % 2 === 1 ? 'tbl-row--alt' : ''"
          >
            <span class="tc tc--no">
              <span class="idx">{{ pageStart + i }}</span>
            </span>
            <span class="tc tc--time">{{ item.statsTime || item.when || '—' }}</span>
            <span class="tc tc--cat">
              <span class="pill" :class="catK(item.category || item.label)">
                <span class="pip"></span>{{ item.category || item.label || '—' }}
              </span>
            </span>
            <span class="tc tc--obj" :title="item.target || item.title">
              {{ item.target || item.title || '—' }}
            </span>
            <span class="tc tc--desc" :title="item.description || item.desc">
              {{ item.description || item.desc || '—' }}
            </span>
          </div>

          <div v-if="!focusData.length" class="tbl-empty">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="4" y="8" width="28" height="20" rx="2.5" stroke="#cbd5e1" stroke-width="1.5"/>
              <path d="M4 14h28" stroke="#cbd5e1" stroke-width="1.5"/>
              <path d="M10 21h16M10 25h10" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <span>{{ searchKeyword ? '未找到匹配的记录' : '暂无待处理事项' }}</span>
          </div>
        </div>

        <!-- 分页条（父组件驱动） -->
        <div class="pager" v-if="totalPages > 1">
          <button class="pg-btn" :disabled="currentPage <= 1" @click="$emit('page-change', currentPage - 1)">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M5 1L1 5l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="pg-dots">
            <template v-for="(d, di) in dotList" :key="di">
              <span
                v-if="d.type === 'page'"
                class="pg-dot"
                :class="{ 'pg-dot--active': d.idx === currentPage, 'pg-dot--sm': d.sm }"
                @click="$emit('page-change', d.idx)"
              ></span>
              <span v-else class="pg-ell">···</span>
            </template>
          </div>

          <button class="pg-btn" :disabled="currentPage >= totalPages" @click="$emit('page-change', currentPage + 1)">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <span class="pg-info">{{ currentPage }} / {{ totalPages }}</span>
        </div>

      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'

// 子组件只负责展示，所有数据状态由父组件维护
const props = defineProps({
  modelValue:     { type: Boolean, default: false },
  focusData:      { type: Array,   default: () => [] },  // 当前页数据（已过滤/分页）
  todayStr:       { type: String,  default: '' },
  searchKeyword:  { type: String,  default: '' },
  currentPage:    { type: Number,  default: 1 },
  pageSize:       { type: Number,  default: 8 },
  total:          { type: Number,  default: 0 },         // 总条数（过滤后）
})

defineEmits(['update:modelValue', 'search', 'page-change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

// 当前页展示范围
const pageStart = computed(() => props.total === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1)
const pageEnd   = computed(() => Math.min(props.currentPage * props.pageSize, props.total))

// 点式分页器逻辑
const dotList = computed(() => {
  const total = totalPages.value
  const cur   = props.currentPage
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({ type: 'page', idx: i + 1, sm: false }))
  }
  const show = new Set([1, total, cur, cur - 1, cur + 1].filter(x => x >= 1 && x <= total))
  const sorted = [...show].sort((a, b) => a - b)
  const res = []; let prev = 0
  for (const idx of sorted) {
    if (prev && idx - prev > 1) res.push({ type: 'ellipsis' })
    res.push({ type: 'page', idx, sm: Math.abs(idx - cur) > 1 && idx !== 1 && idx !== total })
    prev = idx
  }
  return res
})

const catK = c => ({
  '实物故障': 'risk', 'risk': 'risk',
  '审核问题': 'warn', 'warn': 'warn',
  '现场监督': 'good', 'good': 'good',
  '管理提醒': 'info', 'info': 'info',
})[c] ?? 'info'
</script>

<style scoped>
.modal-mask {
  position: fixed; inset: 0;
  background: rgba(11,21,48,0.35);
  backdrop-filter: blur(6px);
  display: grid; place-items: center;
  opacity: 0; pointer-events: none;
  transition: opacity .2s ease;
  z-index: 9000;
}
.modal-mask.open { opacity: 1; pointer-events: auto; }

.modal {
  width: 760px; max-width: calc(100vw - 48px);
  max-height: 84vh;
  background: #fff; border-radius: 20px;
  box-shadow: 0 40px 80px -20px rgba(11,21,48,0.4), 0 8px 24px -8px rgba(11,21,48,0.2);
  overflow: hidden;
  transform: scale(0.96) translateY(8px);
  transition: transform .25s cubic-bezier(.16,1,.3,1);
  display: flex; flex-direction: column;
}
.modal-mask.open .modal { transform: scale(1) translateY(0); }

/* 头部 */
.modal-head {
  padding: 22px 24px 16px;
  display: flex; align-items: flex-start; gap: 14px;
  border-bottom: 1px solid rgba(15,23,42,0.06);
  flex-shrink: 0;
}
.micon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg,#fbbf24,#f59e0b);
  color: #fff; display: grid; place-items: center;
  flex-shrink: 0; box-shadow: 0 8px 20px -8px rgba(245,158,11,0.5);
}
.modal-head h2 { margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #0f172a; }
.h-sub { font-size: 12px; color: #94a3b8; }
.close {
  margin-left: auto; width: 32px; height: 32px; border-radius: 8px;
  border: 0; background: transparent; cursor: pointer; color: #94a3b8;
  display: grid; place-items: center; transition: background .15s, color .15s;
}
.close:hover { background: rgba(15,23,42,0.05); color: #0f172a; }

/* 工具栏 */
.toolbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(15,23,42,0.06);
  flex-shrink: 0;
  background: #fafbfd;
}
.search-wrap {
  display: flex; align-items: center; gap: 8px;
  flex: 1; max-width: 320px;
  background: #fff;
  border: 1px solid rgba(15,23,42,0.1);
  border-radius: 10px;
  padding: 0 10px;
  height: 34px;
  transition: border-color .15s, box-shadow .15s;
}
.search-wrap:focus-within {
  border-color: #4c5fbf;
  box-shadow: 0 0 0 3px rgba(76,95,191,0.1);
}
.search-icon { color: #94a3b8; flex-shrink: 0; }
.search-input {
  flex: 1; border: 0; outline: 0; background: transparent;
  font-size: 13px; color: #0f172a; font-family: inherit;
}
.search-input::placeholder { color: #cbd5e1; }
.search-clear {
  width: 18px; height: 18px; border-radius: 50%;
  border: 0; background: rgba(15,23,42,0.07);
  display: grid; place-items: center;
  cursor: pointer; color: #94a3b8; flex-shrink: 0;
  transition: background .12s, color .12s;
}
.search-clear:hover { background: rgba(15,23,42,0.12); color: #475569; }

.toolbar-right { margin-left: auto; }
.result-hint { font-size: 12px; color: #94a3b8; white-space: nowrap; }

/* 列头 */
.tbl-head {
  display: flex; align-items: center;
  padding: 0 20px; height: 34px; flex-shrink: 0;
  background: #f8fafc;
  border-bottom: 1px solid rgba(15,23,42,0.08);
}
.tbl-head .tc { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }

/* 数据区 */
.tbl-body { overflow-y: auto; flex: 1; min-height: 0; }
.tbl-body::-webkit-scrollbar { width: 4px; }
.tbl-body::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.1); border-radius: 3px; }

/* 行 */
.tbl-row {
  display: flex; align-items: flex-start;
  padding: 11px 20px;
  border-bottom: 1px solid rgba(15,23,42,0.04);
  min-height: 46px; transition: background .12s;
}
.tbl-row:hover { background: #f5f6ff; }
.tbl-row--alt  { background: rgba(15,23,42,0.015); }
.tbl-row--alt:hover { background: #f5f6ff; }

/* 列 */
.tc { font-size: 13px; color: #0f172a; flex-shrink: 0; display: flex; align-items: center; padding-right: 12px; }
.tc--no   { width: 44px; justify-content: center; padding-right: 0; }
.tc--time { width: 142px; color: #475569; font-size: 12px; }
.tc--cat  { width: 100px; }
.tc--obj  { width: 160px; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: block; padding-top: 3px; line-height: 1.4; }
.tc--desc { flex: 1; color: #475569; font-size: 12px; line-height: 1.55; white-space: normal; word-break: break-all; display: block; padding-top: 3px; padding-right: 0; }

.idx {
  width: 22px; height: 22px; border-radius: 6px;
  background: rgba(15,23,42,0.05); color: #475569;
  font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  font-variant-numeric: tabular-nums;
}

.pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 500;
  padding: 3px 8px; border-radius: 999px; white-space: nowrap;
}
.pill.risk { background: #fff1f3; color: #e11d48; }
.pill.warn { background: #fffaeb; color: #f59e0b; }
.pill.good { background: #ecfdf5; color: #16a34a; }
.pill.info { background: #eff6ff; color: #3b82f6; }
.pip { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

.tbl-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 0; color: #94a3b8; font-size: 14px;
}

/* 分页 */
.pager {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 0 16px; flex-shrink: 0;
  border-top: 1px solid rgba(15,23,42,0.06);
}
.pg-btn {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1px solid rgba(15,23,42,0.1); background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #475569; transition: all .12s;
}
.pg-btn:hover:not(:disabled) { border-color: #2f3f87; color: #2f3f87; background: #f5f6ff; }
.pg-btn:disabled { opacity: .3; cursor: not-allowed; }

.pg-dots { display: flex; align-items: center; gap: 5px; }
.pg-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #cbd5e1; cursor: pointer;
  transition: width .22s ease, border-radius .22s ease, background .15s;
}
.pg-dot--active { width: 22px; border-radius: 4px; background: #2f3f87; cursor: default; }
.pg-dot--sm     { width: 5px; height: 5px; }
.pg-dot:hover:not(.pg-dot--active) { background: #94a3b8; }
.pg-ell { font-size: 11px; color: #94a3b8; user-select: none; }
.pg-info { font-size: 12px; color: #94a3b8; margin-left: 4px; font-variant-numeric: tabular-nums; }
</style>