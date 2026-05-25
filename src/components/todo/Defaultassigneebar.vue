<template>
  <div class="dab-wrap" v-if="candidates.length">
    <div class="dab-header">
      <div class="dab-icon"><el-icon><Promotion /></el-icon></div>
      <span class="dab-title">表单推荐处理人</span>
      <span class="dab-hint">由业务表单根据流程规则推荐，可直接使用或手动修改</span>
      <button type="button" class="dab-use-btn" @click="emit('use-all')">
        一键使用
      </button>
    </div>

    <div class="dab-list">
      <div
        v-for="u in candidates"
        :key="u.id ?? u.workNo"
        class="dab-card"
        :class="{ 'dab-card--used': isUsed(u) }"
      >
        <div class="dab-avatar" :style="avatarStyle(u.name ?? u.userName)">
          {{ (u.name ?? u.userName ?? '?')[0] }}
        </div>
        <div class="dab-info">
          <span class="dab-name">{{ u.name ?? u.userName }}</span>
          <span class="dab-pos">{{ u.position ?? u.currentPosition ?? '—' }}</span>
        </div>
        <div class="dab-action">
          <span v-if="isUsed(u)" class="dab-used-tag">
            <el-icon><CircleCheckFilled /></el-icon>已选
          </span>
          <button v-else type="button" class="dab-add-btn" @click="emit('use-one', u)">
            使用
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CircleCheckFilled, Promotion } from '@element-plus/icons-vue'

const props = defineProps({
  candidates: { type: Array, default: () => [] },
  usedIds:    { type: Array, default: () => [] },
})

const emit = defineEmits(['use-one', 'use-all'])

function isUsed(u) {
  const uid = u.id ?? u.workNo ?? u.userId
  return props.usedIds.includes(uid)
}

const GRADS = [
  ['var(--wf-avatar-0-from)', 'var(--wf-avatar-0-to)'],
  ['var(--wf-avatar-1-from)', 'var(--wf-avatar-1-to)'],
  ['var(--wf-avatar-2-from)', 'var(--wf-avatar-2-to)'],
  ['var(--wf-avatar-3-from)', 'var(--wf-avatar-3-to)'],
  ['var(--wf-avatar-4-from)', 'var(--wf-avatar-4-to)'],
  ['var(--wf-avatar-5-from)', 'var(--wf-avatar-5-to)'],
]
function avatarStyle(name) {
  const idx = ((name ?? '').charCodeAt(0) || 0) % GRADS.length
  const [a, b] = GRADS[idx]
  return { background: `linear-gradient(135deg,${a},${b})` }
}
</script>

<style scoped>
.dab-wrap {
  border: 1.5px dashed var(--wf-primary-border);
  border-radius: var(--wf-radius-md);
  background: var(--wf-primary-light);
  overflow: hidden;
  margin-top: var(--wf-space-8);
}

/* ── 头部 ── */
.dab-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  background: var(--wf-primary-light);
  border-bottom: 1px solid var(--wf-primary-border);
}

.dab-icon {
  width: 22px;
  height: 22px;
  border-radius: var(--wf-radius-sm);
  background: var(--wf-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dab-icon .el-icon { font-size: 11px; color: #fff; }

.dab-title {
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-bold);
  color: var(--wf-primary);
  white-space: nowrap;
}

.dab-hint {
  font-size: var(--wf-font-xs);
  color: var(--wf-ink-3);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dab-use-btn {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: var(--wf-radius-pill);
  border: 1px solid var(--wf-primary);
  background: var(--wf-primary);
  color: #fff;
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-semibold);
  cursor: pointer;
  font-family: inherit;
  transition: opacity var(--wf-transition-fast),
              transform var(--wf-transition-fast);
}
.dab-use-btn:hover  { opacity: 0.85; }
.dab-use-btn:active { transform: scale(0.95); }

/* ── 人员列表 ── */
.dab-list {
  display: flex;
  flex-direction: column;
  background: var(--wf-canvas);
}

.dab-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--wf-divider);
  transition: background var(--wf-transition-fast);
}
.dab-card:last-child { border-bottom: none; }
.dab-card:hover      { background: var(--wf-primary-light); }
.dab-card--used      { opacity: 0.65; }

.dab-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  font-size: var(--wf-font-sm);
  font-weight: var(--wf-font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
}

.dab-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.dab-name { font-size: var(--wf-font-base); font-weight: var(--wf-font-weight-semibold); color: var(--wf-ink); }
.dab-pos  { font-size: var(--wf-font-xs); color: var(--wf-ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dab-action { flex-shrink: 0; }

.dab-used-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-semibold);
  color: var(--wf-success);
}
.dab-used-tag .el-icon { font-size: 13px; }

.dab-add-btn {
  padding: 3px 10px;
  border-radius: var(--wf-radius-pill);
  border: 1px solid var(--wf-primary);
  background: transparent;
  color: var(--wf-primary);
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-semibold);
  cursor: pointer;
  font-family: inherit;
  transition: background var(--wf-transition-fast),
              color     var(--wf-transition-fast),
              transform var(--wf-transition-fast);
}
.dab-add-btn:hover  { background: var(--wf-primary); color: #fff; }
.dab-add-btn:active { transform: scale(0.95); }
</style>
