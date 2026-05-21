<!-- SelectedUserBar.vue - 已选人员展示条 -->
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
      <el-icon color="#bbb"><UserFilled /></el-icon>
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
.selected-user-bar { margin-bottom: 4px; }
.bar-label-text    { font-size: 12px; color: #999; font-weight: 600; margin-bottom: 8px; letter-spacing: .3px; }
.bar-body          { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.user-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px 5px 6px;
  background: #f0f7ff;
  border: 1px solid #bfdbfe;
  border-radius: 100px;
  font-size: 13px;
}
.chip-avatar {
  width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg, #007aff, #5b8fff);
  color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.chip-name  { font-weight: 600; color: #1d3a6e; }
.chip-meta  { font-size: 11px; color: #6b9ed2; }
.chip-remove { color: #93c5fd; cursor: pointer; font-size: 14px; }
.chip-remove:hover { color: #3b82f6; }
.add-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 12px;
  border: 1.5px dashed #bfdbfe;
  border-radius: 100px;
  font-size: 13px; color: #007aff;
  cursor: pointer; transition: all .15s;
}
.add-btn:hover { background: #eff6ff; border-color: #007aff; }
.bar-empty {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #bbb; margin-top: 4px;
}
</style>