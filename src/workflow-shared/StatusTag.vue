<template>
  <div class="wf-status-cell">
    <span
      v-if="showDot"
      class="wf-status-dot"
      :class="`dot-${status}`"
    />
    <el-tag
      :type="tagType"
      :size="size"
      round
    >{{ label }}</el-tag>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { statusTagType, statusLabel } from './workflowUtils.js'

const props = defineProps({
  status:  { type: String,  default: ''      },
  size:    { type: String,  default: 'small' },
  showDot: { type: Boolean, default: true    },
})

const tagType = computed(() => statusTagType(props.status))
const label   = computed(() => statusLabel(props.status))
</script>

<style scoped>
.wf-status-cell {
  display: inline-flex;
  align-items: center;
  gap: var(--wf-space-6);
}

.wf-status-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-running {
  background: var(--wf-status-running);
  animation: wf-pulse 1.8s infinite;
}

.dot-completed  { background: var(--wf-success); }
.dot-terminated { background: var(--wf-neutral); }
.dot-rejected   { background: var(--wf-danger); }

@keyframes wf-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
