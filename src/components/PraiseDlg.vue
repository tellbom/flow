<template>
  <teleport to="body">
    <div class="modal-mask" :class="{ open: modelValue }" @click="$emit('update:modelValue', false)">
      <div class="modal" @click.stop>

        <div class="modal-head">
          <div class="micon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <h2>质量点赞</h2>
            <div class="h-sub">{{ todayStr }} · {{ currentItems.length }} 条荣誉记录 · 共同营造质量文化</div>
          </div>
          <button class="close" @click="$emit('update:modelValue', false)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <div class="modal-tabs">
          <button :class="{ active: tab === 'today' }" @click="switchTab('today')">今日点赞</button>
          <button :class="{ active: tab === 'month' }" @click="switchTab('month')">本月点赞</button>
        </div>

        <!-- 固定高度列表区 -->
        <div class="modal-body">
          <div
            v-for="(h, i) in pagedItems" :key="tab + '-' + page + '-' + i"
            class="honor"
          >
            <div class="avatar" :style="{ background: AVATAR_GRADS[globalIndex(i) % AVATAR_GRADS.length] }">
              {{ h.glyph || h.dept?.[0] || '?' }}
              <div class="badge" :style="{ background: tierBadge(h.tier).bg }">{{ tierBadge(h.tier).glyph }}</div>
            </div>
            <div class="body">
              <div class="top">
                <span class="nm">{{ h.name || h.dept }}</span>
                <span class="tag">{{ h.tag || h.dept }}</span>
              </div>
              <div class="desc">{{ h.desc || h.content }}</div>
            </div>
            <span class="time">{{ h.time }}</span>
          </div>

          <!-- 占位行：保持高度稳定不跳动 -->
          <div
            v-for="n in (PER_PAGE - pagedItems.length)"
            :key="'ph-' + n"
            class="honor-placeholder"
          ></div>

          <div v-if="currentItems.length === 0" class="empty-state">暂无荣誉记录</div>
        </div>

        <!-- 分页条 -->
        <div class="pager" v-if="totalPages > 1">
          <button class="pg-btn" :disabled="page === 0" @click="page--">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M5 1L1 5l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="pg-dots">
            <template v-for="(d, di) in dotList" :key="di">
              <span
                v-if="d.type === 'page'"
                class="pg-dot"
                :class="{ 'pg-dot--active': d.idx === page, 'pg-dot--sm': d.sm }"
                @click="page = d.idx"
              ></span>
              <span v-else class="pg-ell">···</span>
            </template>
          </div>

          <button class="pg-btn" :disabled="page >= totalPages - 1" @click="page++">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <span class="pg-info">{{ page + 1 }} / {{ totalPages }}</span>
        </div>

      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  praiseData: { type: Array,   default: () => [] },
  todayStr:   { type: String,  default: '' },
})
defineEmits(['update:modelValue'])

const PER_PAGE = 5
const tab  = ref('today')
const page = ref(0)

const AVATAR_GRADS = [
  'linear-gradient(135deg,#4c5fbf,#2f3f87)',
  'linear-gradient(135deg,#7c8be0,#4c5fbf)',
  'linear-gradient(135deg,#5b6cff,#1d2a5a)',
  'linear-gradient(135deg,#2f3f87,#131f44)',
  'linear-gradient(135deg,#6577d4,#3a4c9d)',
]

function tierBadge(tier) {
  if (tier === 'gold')   return { bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', glyph: '★' }
  if (tier === 'silver') return { bg: 'linear-gradient(135deg,#cbd5e1,#94a3b8)', glyph: '★' }
  return { bg: 'linear-gradient(135deg,#fcd34d,#fbbf24)', glyph: '·' }
}

function switchTab(t) {
  tab.value = t
  page.value = 0
}

const currentItems = computed(() =>
  props.praiseData.filter(d => tab.value === 'today' ? d.tab !== 'month' : true)
)
const totalPages = computed(() => Math.max(1, Math.ceil(currentItems.value.length / PER_PAGE)))
const pagedItems = computed(() => {
  const s = page.value * PER_PAGE
  return currentItems.value.slice(s, s + PER_PAGE)
})
const globalIndex = i => page.value * PER_PAGE + i

watch(totalPages, (n) => { if (page.value >= n) page.value = Math.max(0, n - 1) })

const dotList = computed(() => {
  const total = totalPages.value, cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => ({ type: 'page', idx: i, sm: false }))
  const show = new Set([0, total - 1, cur, cur - 1, cur + 1].filter(x => x >= 0 && x < total))
  const sorted = [...show].sort((a, b) => a - b)
  const res = []; let prev = -1
  for (const idx of sorted) {
    if (prev !== -1 && idx - prev > 1) res.push({ type: 'ellipsis' })
    res.push({ type: 'page', idx, sm: Math.abs(idx - cur) > 1 && idx !== 0 && idx !== total - 1 })
    prev = idx
  }
  return res
})
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
  width: 560px; max-width: calc(100vw - 48px);
  background: #fff; border-radius: 20px;
  box-shadow: 0 40px 80px -20px rgba(11,21,48,0.4), 0 8px 24px -8px rgba(11,21,48,0.2);
  overflow: hidden;
  transform: scale(0.96) translateY(8px);
  transition: transform .25s cubic-bezier(.16,1,.3,1);
  display: flex; flex-direction: column;
}
.modal-mask.open .modal { transform: scale(1) translateY(0); }

.modal-head {
  padding: 22px 24px 16px;
  display: flex; align-items: flex-start; gap: 14px;
  border-bottom: 1px solid rgba(15,23,42,0.06);
  flex-shrink: 0;
}
.micon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg,#4c5fbf,#2f3f87);
  color: #fff; display: grid; place-items: center;
  flex-shrink: 0; box-shadow: 0 8px 20px -8px rgba(47,63,135,0.5);
}
.modal-head h2 { margin: 0 0 4px; font-size: 18px; font-weight: 700; color: #0f172a; }
.h-sub { font-size: 12px; color: #94a3b8; }
.close {
  margin-left: auto; width: 32px; height: 32px; border-radius: 8px;
  border: 0; background: transparent; cursor: pointer; color: #94a3b8;
  display: grid; place-items: center; transition: background .15s, color .15s;
}
.close:hover { background: rgba(15,23,42,0.05); color: #0f172a; }

.modal-tabs {
  display: flex; padding: 0 24px; gap: 0;
  border-bottom: 1px solid rgba(15,23,42,0.06);
  flex-shrink: 0;
}
.modal-tabs button {
  border: 0; background: transparent;
  padding: 12px 16px; cursor: pointer;
  font-size: 13px; color: #475569;
  font-family: inherit;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color .15s, border-color .15s;
}
.modal-tabs button.active {
  color: #1d2a5a; border-bottom-color: #2f3f87; font-weight: 600;
}

/* 固定高度列表区：5行 × 72px = 360px */
.modal-body {
  flex-shrink: 0;
  height: 360px;
  padding: 0 16px;
  overflow: hidden;
  position: relative;
}

.honor {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 12px 4px; border-radius: 14px;
  height: 72px; box-sizing: border-box;
  transition: background .15s; cursor: default;
}
.honor:hover { background: #f5f6ff; border-radius: 12px; }

.honor-placeholder { height: 72px; }

.avatar {
  width: 44px; height: 44px; border-radius: 14px;
  display: grid; place-items: center;
  color: #fff; font-weight: 600; font-size: 16px;
  flex-shrink: 0; position: relative;
  box-shadow: 0 4px 14px -6px rgba(47,63,135,0.5);
}
.badge {
  position: absolute; right: -4px; bottom: -4px;
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #fff;
  display: grid; place-items: center;
  font-size: 9px; color: #fff;
}
.body { flex: 1; min-width: 0; }
.top  { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.nm   { font-size: 14px; font-weight: 600; color: #0f172a; }
.tag  { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #f5f6ff; color: #1d2a5a; font-weight: 500; }
.desc { font-size: 12px; color: #475569; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.time { font-size: 11px; color: #94a3b8; flex-shrink: 0; padding-top: 2px; }

.empty-state {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: #94a3b8; font-size: 14px;
}

/* 分页 */
.pager {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 0 18px; flex-shrink: 0;
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
.pg-ell { font-size: 11px; color: #94a3b8; letter-spacing: .05em; user-select: none; }

.pg-info { font-size: 12px; color: #94a3b8; margin-left: 4px; font-variant-numeric: tabular-nums; }
</style>