<template>
  <div class="home-page">

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Odometer, DataAnalysis, Finished, Warning,
  Calendar, DocumentChecked, Bell, UserFilled,
  List, Setting, Search, TrendCharts,
} from '@element-plus/icons-vue'
import { useAdminInfo } from '/@/stores/adminInfo'

const router = useRouter()

// ════════════════════════════════════════════════
//  用户信息
// ════════════════════════════════════════════════

const adminInfo = useAdminInfo()
const userName = adminInfo.nickname
</script>

<style scoped>
.home-page {
  padding: 20px 24px;
  background: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

/* 两列行 */
.row {
  display: grid;
  gap: 16px;
}

.row-main {
  grid-template-columns: 1fr 360px;
  align-items: stretch;
}

.row-bottom {
  grid-template-columns: 1fr 1fr 1fr;
  align-items: stretch;
}

.col-duty { min-height: 420px; }

@media (max-width: 1400px) {
  .row-bottom { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 1200px) {
  .row-bottom { grid-template-columns: 1fr; }
}

.col {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 各列高度 */
.col-chart  { min-height: 380px; }
.col-todo   { min-height: 380px; }
.col-resource { min-height: 420px; }
.col-company  { min-height: 420px; }

/* 大屏响应 */
@media (max-width: 1200px) {
  .row-main   { grid-template-columns: 1fr; }
  .row-bottom { grid-template-columns: 1fr; }
}
</style>