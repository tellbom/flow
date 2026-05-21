<!-- ApprovalHistory.vue - 历史审批记录时间线 -->
<template>
  <div class="approval-history">
    <div v-if="!records.length" class="empty">
      <el-empty description="暂无审批记录" :image-size="60" />
    </div>
    <el-timeline v-else>
      <el-timeline-item
        v-for="r in records"
        :key="r.taskId"
        :type="outcomeType(r.outcome)"
        :timestamp="formatDate(r.endTime)"
        placement="top"
        size="large"
      >
        <div class="record-card">
          <div class="record-top">
            <span class="record-node">{{ r.nodeName }}</span>
            <el-tag :type="outcomeType(r.outcome)" size="small" round>
              {{ outcomeLabel(r.outcome) }}
            </el-tag>
            <el-tag v-if="r.round > 1" type="warning" size="small" round>第{{ r.round }}次</el-tag>
          </div>
          <div class="record-meta">
            <span><el-icon><User /></el-icon>{{ r.assignee }}</span>
            <span><el-icon><Timer /></el-icon>{{ formatDuration(r.durationSeconds) }}</span>
          </div>
          <div v-if="r.rejectReason" class="record-reason">
            <el-icon color="#f59e0b"><Warning /></el-icon>
            {{ r.rejectReason }}
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>
<script setup>
import { User, Timer, Warning } from '@element-plus/icons-vue'
defineProps({ records: { type: Array, default: () => [] } })
const outcomeType  = (o) => ({ approved: 'success', rejected_terminate: 'danger', rejected_return: 'warning' }[o] || 'info')
const outcomeLabel = (o) => ({ approved: '已通过', rejected_terminate: '已驳回终止', rejected_return: '已驳回回退' }[o] || o)
const formatDate = (dt) => dt ? new Date(dt).toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-') : '-'
const formatDuration = (s) => {
  if (!s) return '-'
  if (s < 60)   return `${s}秒`
  if (s < 3600) return `${Math.floor(s/60)}分钟`
  if (s < 86400) return `${Math.floor(s/3600)}小时`
  return `${Math.floor(s/86400)}天`
}
</script>
<style scoped>
.record-card  { background: #fafafa; border-radius: 10px; padding: 10px 14px; border: 1px solid #f0f0f0; }
.record-top   { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.record-node  { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.record-meta  { display: flex; gap: 16px; font-size: 12px; color: #888; margin-bottom: 4px; }
.record-meta span { display: flex; align-items: center; gap: 4px; }
.record-reason { font-size: 12px; color: #b45309; background: #fffbeb; border-radius: 6px; padding: 6px 10px; margin-top: 6px; display: flex; align-items: flex-start; gap: 6px; line-height: 1.5; }
</style>