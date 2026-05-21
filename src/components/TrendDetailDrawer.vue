<template>
  <teleport to="body">
    <div
      class="drawer-mask"
      :class="{ open: modelValue }"
      @click="$emit('update:modelValue', false)"
    ></div>

    <div class="drawer" :class="{ open: modelValue }">

      <!-- 头部 -->
      <div class="drawer-hd">
        <div class="drawer-hd-left">
          <div class="drawer-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/>
              <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div class="drawer-title">质量问题明细</div>
            <div class="drawer-sub">{{ date || '—' }} · {{ filteredTotal }} 条记录</div>
          </div>
        </div>
        <button class="drawer-close" @click="$emit('update:modelValue', false)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- 搜索工具栏 -->
      <div class="toolbar">
        <div class="search-wrap" :class="{ focused: searchFocused }">
          <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/>
            <path d="M20 20l-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="search"
            class="search-input"
            type="text"
            placeholder="搜索项目、事件或类别..."
            @focus="searchFocused = true"
            @blur="searchFocused = false"
            @input="onSearch"
          />
          <button v-if="search" class="search-clear" @click="clearSearch">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <span class="result-hint">
          {{ filteredTotal ? `第 ${pageStart}–${pageEnd} / 共 ${filteredTotal} 条` : (search ? '无匹配结果' : '暂无数据') }}
        </span>
      </div>

      <!-- 列头 -->
      <div class="tbl-head">
        <span class="tc tc--no">序号</span>
        <span class="tc tc--time">发生时间</span>
        <span class="tc tc--cat">类别</span>
        <span class="tc tc--proj">项目 / 班组</span>
        <span class="tc tc--event">事件描述</span>
        <span class="tc tc--score">扣分</span>
      </div>

      <!-- 数据区 -->
      <div class="tbl-body">
        <template v-if="pagedItems.length">
          <div
            v-for="(row, i) in pagedItems"
            :key="row._key || i"
            class="tbl-row"
            :class="i % 2 === 1 ? 'tbl-row--alt' : ''"
          >
            <span class="tc tc--no">
              <span class="idx">{{ pageStart + i }}</span>
            </span>
            <span class="tc tc--time">{{ row.occurTime || '—' }}</span>
            <span class="tc tc--cat">
              <span class="pill" :class="catK(row.category)">
                <span class="pip"></span>{{ row.category || '—' }}
              </span>
            </span>
            <span class="tc tc--proj" :title="row.project || row.responsibleTeam || ''">
              {{ row.project || row.responsibleTeam || '—' }}
            </span>
            <span class="tc tc--event" :title="row.event || ''">{{ row.event || '—' }}</span>
            <span class="tc tc--score">
              <span v-if="row.projectScore != null && row.projectScore !== ''" class="score-badge">
                -{{ row.projectScore }}
              </span>
              <span v-else class="score-dash">—</span>
            </span>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="tbl-empty">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="9" width="32" height="23" rx="3" stroke="#cbd5e1" stroke-width="1.5"/>
            <path d="M4 16h32" stroke="#cbd5e1" stroke-width="1.5"/>
            <path d="M12 25h16M12 30h10" stroke="#cbd5e1" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <span>{{ search ? '未找到匹配的记录' : '该日无质量问题记录' }}</span>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pager" v-if="totalPages > 1">
        <button class="pg-btn" :disabled="page <= 1" @click="page--">
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

        <button class="pg-btn" :disabled="page >= totalPages" @click="page++">
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M1 1l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <span class="pg-info">{{ page }} / {{ totalPages }}</span>
      </div>

    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  date:       { type: String,  default: '' },
  items:      { type: Array,   default: () => [] },
})
defineEmits(['update:modelValue'])

// ── 内部搜索 + 分页状态 ────────────────────────────────────────
const PAGE_SIZE     = 8
const search        = ref('')
const page          = ref(1)
const searchFocused = ref(false)
const searchInputRef = ref(null)

// 打开时重置，关闭时也重置避免残留
watch(() => props.modelValue, (open) => {
  if (open) {
    search.value = ''
    page.value   = 1
  }
})

function onSearch() {
  page.value = 1  // 搜索内容变化时回到第一页
}

function clearSearch() {
  search.value = ''
  page.value   = 1
  searchInputRef.value?.focus()
}

// ── 安全过滤（props.items 可能是 null/undefined） ─────────────
const safeItems = computed(() => {
  if (!Array.isArray(props.items)) return []
  return props.items
})

const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase()
  if (!kw) return safeItems.value
  return safeItems.value.filter(row => {
    if (!row || typeof row !== 'object') return false
    const proj  = String(row.project          || row.responsibleTeam || '').toLowerCase()
    const event = String(row.event            || '').toLowerCase()
    const cat   = String(row.category         || '').toLowerCase()
    return proj.includes(kw) || event.includes(kw) || cat.includes(kw)
  })
})

const filteredTotal = computed(() => filtered.value.length)
const totalPages    = computed(() => Math.max(1, Math.ceil(filteredTotal.value / PAGE_SIZE)))

// 翻页越界保护
watch(totalPages, (n) => {
  if (page.value > n) page.value = n
})

const pageStart  = computed(() => filteredTotal.value === 0 ? 0 : (page.value - 1) * PAGE_SIZE + 1)
const pageEnd    = computed(() => Math.min(page.value * PAGE_SIZE, filteredTotal.value))
const pagedItems = computed(() => {
  const s = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(s, s + PAGE_SIZE)
})

// 点式分页器
const dotList = computed(() => {
  const total = totalPages.value
  const cur   = page.value
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({ type: 'page', idx: i + 1, sm: false }))
  }
  const show   = new Set([1, total, cur, cur - 1, cur + 1].filter(x => x >= 1 && x <= total))
  const sorted = [...show].sort((a, b) => a - b)
  const res = []; let prev = 0
  for (const idx of sorted) {
    if (prev && idx - prev > 1) res.push({ type: 'ellipsis' })
    res.push({ type: 'page', idx, sm: Math.abs(idx - cur) > 1 && idx !== 1 && idx !== total })
    prev = idx
  }
  return res
})

// 类别映射
const catK = c => ({
  '实物故障': 'risk',
  '审核问题': 'warn',
  '现场监督': 'good',
})[c] ?? 'info'
</script>

<style scoped>
.drawer-mask {
  position: fixed; inset: 0;
  background: rgba(11,21,48,0.2);
  opacity: 0; pointer-events: none;
  transition: opacity .25s ease;
  z-index: 8990;
}
.drawer-mask.open { opacity: 1; pointer-events: auto; }

.drawer {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 680px; max-width: calc(100vw - 32px);
  background: #fff;
  box-shadow: -8px 0 40px rgba(11,21,48,0.12), -2px 0 8px rgba(11,21,48,0.06);
  transform: translateX(100%);
  transition: transform .28s cubic-bezier(.16,1,.3,1);
  z-index: 8999;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.drawer.open { transform: translateX(0); }

/* ── 头部 ── */
.drawer-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(15,23,42,0.06);
  flex-shrink: 0;
}
.drawer-hd-left { display: flex; align-items: center; gap: 14px; }
.drawer-icon {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(135deg,#4c5fbf,#2f3f87);
  color: #fff; display: grid; place-items: center; flex-shrink: 0;
  box-shadow: 0 6px 16px -6px rgba(47,63,135,0.5);
}
.drawer-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
.drawer-sub   { font-size: 12px; color: #94a3b8; }
.drawer-close {
  width: 32px; height: 32px; border-radius: 8px;
  border: 0; background: transparent; cursor: pointer; color: #94a3b8;
  display: grid; place-items: center; transition: background .15s, color .15s;
}
.drawer-close:hover { background: rgba(15,23,42,0.05); color: #0f172a; }

/* ── 工具栏 ── */
.toolbar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px;
  border-bottom: 1px solid rgba(15,23,42,0.06);
  flex-shrink: 0;
  background: #fafbfd;
}
.search-wrap {
  display: flex; align-items: center; gap: 8px;
  flex: 1;
  background: #fff; border: 1px solid rgba(15,23,42,0.1);
  border-radius: 10px; padding: 0 10px; height: 34px;
  transition: border-color .15s, box-shadow .15s;
}
.search-wrap.focused {
  border-color: #4c5fbf;
  box-shadow: 0 0 0 3px rgba(76,95,191,0.1);
}
.search-icon  { color: #94a3b8; flex-shrink: 0; }
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
  transition: background .12s;
}
.search-clear:hover { background: rgba(15,23,42,0.13); color: #475569; }
.result-hint { font-size: 12px; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }

/* ── 列头 ── */
.tbl-head {
  display: flex; align-items: center;
  padding: 0 20px; height: 34px; flex-shrink: 0;
  background: #f8fafc; border-bottom: 1px solid rgba(15,23,42,0.08);
}
.tbl-head .tc { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }

/* ── 数据区 ── */
.tbl-body { flex: 1; overflow-y: auto; min-height: 0; }
.tbl-body::-webkit-scrollbar { width: 4px; }
.tbl-body::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.1); border-radius: 3px; }

.tbl-row {
  display: flex; align-items: flex-start;
  padding: 11px 20px; border-bottom: 1px solid rgba(15,23,42,0.04);
  min-height: 46px; transition: background .12s;
}
.tbl-row:hover  { background: #f5f6ff; }
.tbl-row--alt   { background: rgba(15,23,42,0.015); }
.tbl-row--alt:hover { background: #f5f6ff; }

/* ── 列尺寸 ── */
.tc        { font-size: 13px; color: #0f172a; flex-shrink: 0; display: flex; align-items: center; padding-right: 10px; }
.tc--no    { width: 40px; justify-content: center; padding-right: 0; }
.tc--time  { width: 110px; color: #475569; font-size: 12px; }
.tc--cat   { width: 88px; }
.tc--proj  { width: 140px; font-weight: 500; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display: block; line-height: 1.4; padding-top: 3px; }
.tc--event { flex: 1; color: #475569; font-size: 12px; line-height: 1.55; white-space: normal; word-break: break-all; display: block; padding-top: 3px; padding-right: 10px; }
.tc--score { width: 60px; justify-content: flex-end; padding-right: 0; flex-shrink: 0; }

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

.score-badge { font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; background: #fff1f3; color: #e11d48; padding: 2px 7px; border-radius: 999px; }
.score-dash  { color: #cbd5e1; font-size: 13px; }

.tbl-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; height: 220px; color: #94a3b8; font-size: 14px;
}

/* ── 分页 ── */
.pager {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 0 14px; flex-shrink: 0;
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
.pg-dot  {
  width: 8px; height: 8px; border-radius: 50%;
  background: #cbd5e1; cursor: pointer;
  transition: width .22s ease, border-radius .22s ease, background .15s;
}
.pg-dot--active { width: 22px; border-radius: 4px; background: #2f3f87; cursor: default; }
.pg-dot--sm     { width: 5px; height: 5px; }
.pg-dot:hover:not(.pg-dot--active) { background: #94a3b8; }
.pg-ell  { font-size: 11px; color: #94a3b8; user-select: none; }
.pg-info { font-size: 12px; color: #94a3b8; margin-left: 4px; font-variant-numeric: tabular-nums; }
</style>