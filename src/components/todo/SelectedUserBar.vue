<!-- SelectedUserBar.vue — 已选人员展示条 -->
<template>
  <div class="selected-user-bar">
    <div class="bar-label-text">{{ label }}</div>
    <div class="bar-body">
      <div
        v-for="user in users"
        :key="user.id"
        class="user-chip"
      >
        <div class="chip-avatar">{{ user.name[0] }}</div>
        <span class="chip-name">{{ user.name }}</span>
        <span class="chip-meta">{{ user.position }}</span>
        <el-icon class="chip-remove" @click="$emit('remove', user)"><Close /></el-icon>
      </div>

      <div class="add-btn" @click="$emit('click-add')">
        <el-icon><Plus /></el-icon>
        <span>{{ users.length ? '修改' : '选择' }}</span>
      </div>
    </div>
    <div class="bar-empty" v-if="!users.length">
      <el-icon class="empty-icon"><UserFilled /></el-icon>
      <span>请选择处理人</span>
    </div>
  </div>
</template>

<script setup>
import { Close, Plus, UserFilled } from '@element-plus/icons-vue'
defineProps({ users: { type: Array, default: () => [] }, label: { type: String, default: '处理人' } })
defineEmits(['remove', 'click-add'])
</script>

<style scoped>
.selected-user-bar { margin-bottom: var(--wf-space-4); }

.bar-label-text {
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-3);
  font-weight: var(--wf-font-weight-semibold);
  margin-bottom: var(--wf-space-8);
  letter-spacing: 0.3px;
}

.bar-body {
  display: flex;
  flex-wrap: wrap;
  gap: var(--wf-space-8);
  align-items: center;
}

/* ── 人员 Chip ── */
.user-chip {
  display: flex;
  align-items: center;
  gap: var(--wf-space-6);
  padding: 5px 10px 5px 6px;
  background: var(--wf-primary-light);
  border: 1px solid var(--wf-primary-border);
  border-radius: var(--wf-radius-pill);
  font-size: var(--wf-font-base);
}

.chip-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--wf-primary), var(--wf-primary-hover));
  color: #fff;
  font-size: var(--wf-font-xs);
  font-weight: var(--wf-font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chip-name { font-weight: var(--wf-font-weight-semibold); color: var(--wf-ink); }
.chip-meta { font-size: var(--wf-font-xs); color: var(--wf-ink-3); }

.chip-remove {
  color: var(--wf-primary-border);
  cursor: pointer;
  font-size: 14px;
  transition: color var(--wf-transition-fast);
}
.chip-remove:hover { color: var(--wf-primary); }

/* ── 添加触发按钮 ── */
.add-btn {
  display: flex;
  align-items: center;
  gap: var(--wf-space-4);
  padding: 5px 12px;
  border: 1.5px dashed var(--wf-primary-border);
  border-radius: var(--wf-radius-pill);
  font-size: var(--wf-font-base);
  color: var(--wf-primary);
  cursor: pointer;
  transition: background var(--wf-transition-fast),
              border-color var(--wf-transition-fast),
              transform    var(--wf-transition-fast);
}
.add-btn:hover  { background: var(--wf-primary-light); border-color: var(--wf-primary); }
.add-btn:active { transform: scale(0.95); }

/* ── 空状态提示 ── */
.bar-empty {
  display: flex;
  align-items: center;
  gap: var(--wf-space-6);
  font-size: var(--wf-font-sm);
  color: var(--wf-ink-disabled);
  margin-top: var(--wf-space-4);
}
.empty-icon { font-size: 14px; }
</style>
