<!-- MockApproveForm.vue - 模拟审签表单（业务方替换此组件） -->
<template>
  <div class="mock-form">
    <!-- 业务信息卡 -->
    <div class="info-card">
      <div class="info-card-header">
        <el-icon color="#c62f2f"><Document /></el-icon>
        <span>业务信息</span>
      </div>
      <el-descriptions :column="2" border size="small" class="info-desc">
        <el-descriptions-item label="申请标题">
          {{ taskInfo?.extraData?.title || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="业务ID">
          <span class="mono">{{ taskInfo?.businessId || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="申请部门">
          {{ taskInfo?.extraData?.department || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="申请人">
          {{ taskInfo?.extraData?.applicant || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="当前节点">
          {{ taskInfo?.taskName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ taskInfo?.createTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 表单主体（模拟业务字段，实际由 viewComponentPath 动态替换） -->
    <div class="form-notice">
      <el-alert type="info" :closable="false" show-icon>
        <template #title>
          此区域将根据 <code>extraData.viewComponentPath</code> 动态加载对应业务审签表单
        </template>
        <template #default>
          当前模拟路径：<code>{{ taskInfo?.extraData?.viewComponentPath || '未配置' }}</code>
        </template>
      </el-alert>
    </div>

    <!-- 模拟表单字段 -->
    <el-form label-position="top" class="mock-fields" :disabled="readonly">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="巡察单位">
            <el-input :model-value="taskInfo?.extraData?.department || ''" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="巡察类型">
            <el-select model-value="" placeholder="请选择" style="width:100%">
              <el-option label="例行巡察" value="1" />
              <el-option label="专项巡察" value="2" />
              <el-option label="届中巡察" value="3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="计划开始时间">
            <el-date-picker type="date" placeholder="选择日期" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="计划结束时间">
            <el-date-picker type="date" placeholder="选择日期" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="巡察说明">
        <el-input type="textarea" :rows="3" placeholder="填写巡察说明..." />
      </el-form-item>
      <el-form-item label="附件材料">
        <el-upload action="#" :auto-upload="false" drag :disabled="readonly">
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
        </el-upload>
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup>
import { Document, UploadFilled } from '@element-plus/icons-vue'
defineProps({
  taskInfo: { type: Object, default: null },
  readonly: { type: Boolean, default: false },
})
</script>
<style scoped>
.mock-form      { display: flex; flex-direction: column; gap: 16px; }
.info-card      { background: #fafafa; border-radius: 12px; border: 1px solid #f0f0f0; overflow: hidden; }
.info-card-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; font-size: 14px; font-weight: 600; color: #1a1a1a; background: #fff; border-bottom: 1px solid #f0f0f0; }
.info-desc      { padding: 12px; }
.mono           { font-family: 'SF Mono', Consolas, monospace; font-size: 12px; color: #888; }
.form-notice    { }
.mock-fields    { padding: 4px 0; }
code            { background: #f0f0f0; padding: 1px 5px; border-radius: 4px; font-size: 12px; }
</style>