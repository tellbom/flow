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
        <!-- 头像 -->
        <div class="dab-avatar" :style="avatarStyle(u.name ?? u.userName)">
          {{ (u.name ?? u.userName ?? '?')[0] }}
        </div>
        <!-- 信息 -->
        <div class="dab-info">
          <span class="dab-name">{{ u.name ?? u.userName }}</span>
          <span class="dab-pos">{{ u.position ?? u.currentPosition ?? '—' }}</span>
        </div>
        <!-- 状态 / 操作 -->
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
/**
 * DefaultAssigneeBar.vue — 表单推荐处理人展示条
 *
 * 职责：
 *   展示由业务表单 getDefaultAssignees() 返回的推荐人员，
 *   提供「使用」（单个）和「一键使用」（全部）操作，
 *   已被选中的人员显示"已选"状态。
 *
 * Props:
 *   candidates  — 推荐人员列表 [{ id/workNo, name/userName, position/currentPosition }]
 *   usedIds     — 当前已选人员的 id/workNo 集合，用于标记已使用
 *
 * Emits:
 *   use-one(user)  — 使用单个推荐人
 *   use-all        — 一键使用全部推荐人
 */
import { CircleCheckFilled, Promotion } from '@element-plus/icons-vue'

const props = defineProps({
  candidates: { type: Array,  default: () => [] },
  usedIds:    { type: Array,  default: () => [] },
})

const emit = defineEmits(['use-one', 'use-all'])

function isUsed(u) {
  const uid = u.id ?? u.workNo ?? u.userId
  return props.usedIds.includes(uid)
}

const GRADS = [
  ['#c62f2f','#e04545'], ['#f5a623','#e8940f'],
  ['#27ae60','#2ecc71'], ['#3370ff','#5a8fff'],
  ['#8e44ad','#9b59b6'], ['#16a085','#1abc9c'],
]
function avatarStyle(name) {
  const idx = ((name ?? '').charCodeAt(0) || 0) % GRADS.length
  const [a, b] = GRADS[idx]
  return { background: `linear-gradient(135deg,${a},${b})` }
}
</script>

<style scoped>
.dab-wrap {
  border: 1.5px dashed #c5d8ff;
  border-radius: 10px;
  background: #f5f8ff;
  overflow: hidden;
  margin-top: 10px;
}

/* ── 头部 ── */
.dab-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  background: #edf2ff;
  border-bottom: 1px solid #c5d8ff;
}
.dab-icon {
  width: 22px; height: 22px;
  border-radius: 6px;
  background: #3370ff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dab-icon .el-icon { font-size: 11px; color: #fff; }
.dab-title { font-size: 12px; font-weight: 700; color: #3370ff; white-space: nowrap; }
.dab-hint  { font-size: 11px; color: #86909c; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dab-use-btn {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #3370ff;
  background: #3370ff;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity .12s;
}
.dab-use-btn:hover { opacity: .85; }

/* ── 人员列表 ── */
.dab-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.dab-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 14px;
  border-bottom: 1px solid #dce7ff;
  transition: background .1s;
}
.dab-card:last-child  { border-bottom: none; }
.dab-card:hover       { background: #edf2ff; }
.dab-card--used       { opacity: .65; }

.dab-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0,0,0,.12);
}
.dab-info {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 1px;
}
.dab-name { font-size: 13px; font-weight: 600; color: #1d2129; }
.dab-pos  { font-size: 11px; color: #86909c; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dab-action { flex-shrink: 0; }

.dab-used-tag {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; font-weight: 600; color: #27ae60;
}
.dab-used-tag .el-icon { font-size: 13px; }

.dab-add-btn {
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #3370ff;
  background: transparent;
  color: #3370ff;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background .1s, color .1s;
}
.dab-add-btn:hover { background: #3370ff; color: #fff; }
</style>