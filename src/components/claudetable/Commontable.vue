<template>
  <div class="common-table">
    <!-- 表格操作栏 -->
    <div class="table-toolbar">
      <!-- 左侧操作按钮插槽 -->
      <div class="toolbar-left">
        <slot name="toolbar-left" :selection="selectedRows"></slot>
      </div>
      
      <!-- 右侧工具按钮 -->
      <div class="toolbar-right">
        <slot name="toolbar-right"></slot>
        <el-button 
          type="primary" 
          :icon="Setting" 
          circle 
          @click="columnSettingVisible = true"
          title="字段设置"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
      ref="tableRef"
      :data="tableData"
      stripe
      border
      style="width: 100%"
      :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      @selection-change="handleSelectionChange"
    >
      <!-- 多选列 -->
      <el-table-column 
        v-if="showSelection" 
        type="selection" 
        width="55" 
        align="center"
        fixed="left"
      />
      
      <!-- 单选列 -->
      <el-table-column 
        v-if="showRadio" 
        label="选择" 
        width="55" 
        align="center"
        fixed="left"
      >
        <template #default="scope">
          <el-radio 
            v-model="radioSelected" 
            :label="scope.row[rowKey]"
            @change="handleRadioChange(scope.row)"
          >
            &nbsp;
          </el-radio>
        </template>
      </el-table-column>

      <!-- 动态列渲染 -->
      <template v-for="column in visibleColumns" :key="column.prop">
        <el-table-column
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :align="column.align || 'left'"
          :show-overflow-tooltip="false"
        >
          <template #default="scope">
            <!-- 使用插槽自定义显示 -->
            <slot :name="column.prop" :row="scope.row" :column="column">
              <!-- ✅ 修复：根据列配置决定是否显示自定义tooltip -->
              <template v-if="column.showOverflowTooltip === false">
                <!-- 不使用 tooltip，直接显示 -->
                <div class="cell-text">
                  {{ scope.row[column.prop] }}
                </div>
              </template>
              <template v-else>
                <!-- 使用自定义 tooltip 带复制功能 -->
                <el-tooltip
                  placement="top"
                  :disabled="!needTooltip(scope.row[column.prop], column)"
                  popper-class="cell-tooltip-popper"
                >
                  <template #content>
                    <div class="tooltip-content-wrapper">
                      <span class="tooltip-text">{{ String(scope.row[column.prop] || '') }}</span>
                      <el-button
                        v-if="showCopyIcon(scope.row[column.prop])"
                        type="primary"
                        text
                        size="small"
                        class="tooltip-copy-btn"
                        @click="handleCopy(scope.row[column.prop])"
                      >
                        复制
                      </el-button>
                    </div>
                  </template>
                  <div class="cell-text">
                    {{ scope.row[column.prop] }}
                  </div>
                </el-tooltip>
              </template>
            </slot>
          </template>
        </el-table-column>
      </template>

      <!-- 操作列 - 完全由父组件控制 -->
      <el-table-column 
        v-if="showOperation"
        label="操作" 
        fixed="right" 
        :width="operationWidth"
      >
        <template #default="scope">
          <slot name="operation" :row="scope.row" :index="scope.$index"></slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 字段显示设置对话框 -->
    <el-drawer
      v-model="columnSettingVisible"
      title="字段显示设置"
      direction="rtl"
      size="400px"
    >
      <div class="column-setting">
        <el-checkbox-group v-model="selectedColumns" @change="handleColumnChange">
          <div v-for="column in allColumns" :key="column.prop" class="column-item">
            <el-checkbox :label="column.prop">
              {{ column.label }}
            </el-checkbox>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="resetColumns">重置</el-button>
        <el-button type="primary" @click="columnSettingVisible = false">
          确定
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Setting, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// Props定义
const props = defineProps({
  // 表格数据
  tableData: {
    type: Array,
    default: () => []
  },
  // 所有列配置
  columns: {
    type: Array,
    required: true
  },
  // 分页总数
  total: {
    type: Number,
    default: 0
  },
  // 当前页码
  currentPage: {
    type: Number,
    default: 1
  },
  // 每页条数
  pageSize: {
    type: Number,
    default: 20
  },
  // 是否显示多选框
  showSelection: {
    type: Boolean,
    default: false
  },
  // 是否显示单选框
  showRadio: {
    type: Boolean,
    default: false
  },
  // 行数据的唯一标识字段名
  rowKey: {
    type: String,
    default: 'id'
  },
  // 是否显示操作列
  showOperation: {
    type: Boolean,
    default: true
  },
  // 操作列宽度
  operationWidth: {
    type: Number,
    default: 180
  },
  // LocalStorage键名（用于保存列显示状态）
  storageKey: {
    type: String,
    default: 'table-column-setting'
  }
})

// Emits定义
const emit = defineEmits([
  'selection-change',
  'radio-change',
  'page-change',
  'size-change',
  'update:currentPage',
  'update:pageSize'
])

// 响应式数据
const tableRef = ref(null)
const columnSettingVisible = ref(false)
const selectedColumns = ref([])
const allColumns = ref([])
const currentPage = ref(props.currentPage)
const pageSize = ref(props.pageSize)
const selectedRows = ref([])
const radioSelected = ref('')

// 计算可见列
const visibleColumns = computed(() => {
  return allColumns.value.filter(col => selectedColumns.value.includes(col.prop))
})

// 初始化列配置
const initColumns = () => {
  allColumns.value = props.columns
  
  // 从localStorage读取保存的列显示状态
  const savedColumns = localStorage.getItem(props.storageKey)
  
  if (savedColumns) {
    try {
      selectedColumns.value = JSON.parse(savedColumns)
      // 确保选中的列在当前列配置中存在
      selectedColumns.value = selectedColumns.value.filter(col => 
        allColumns.value.some(c => c.prop === col)
      )
    } catch (e) {
      // 如果解析失败，使用默认显示
      selectedColumns.value = allColumns.value.map(col => col.prop)
    }
  } else {
    // 默认显示所有列
    selectedColumns.value = allColumns.value.map(col => col.prop)
  }
}

// 列显示状态改变
const handleColumnChange = (value) => {
  localStorage.setItem(props.storageKey, JSON.stringify(value))
}

// 重置列显示
const resetColumns = () => {
  selectedColumns.value = allColumns.value.map(col => col.prop)
  localStorage.removeItem(props.storageKey)
  ElMessage.success('已重置为默认显示')
}

// 多选改变
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

// 单选改变
const handleRadioChange = (row) => {
  emit('radio-change', row)
}

// ✅ 修复：改进 tooltip 判断逻辑
const needTooltip = (content, column) => {
  if (!content) return false
  const str = String(content)
  
  // 如果列配置指定了 tooltipLength，使用该值
  const maxLength = column.tooltipLength || 20
  
  // 字符串长度超过限制或包含换行则显示 tooltip
  return str.length > maxLength || str.includes('\n')
}

// 判断是否显示复制图标
const showCopyIcon = (content) => {
  if (!content) return false
  return String(content).length > 0
}

// 复制内容到剪贴板
const handleCopy = async (content) => {
  try {
    await navigator.clipboard.writeText(String(content))
    ElMessage.success('复制成功')
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = String(content)
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('复制成功')
    } catch (e) {
      ElMessage.error('复制失败')
    }
    document.body.removeChild(textarea)
  }
}

// 清空选择
const clearSelection = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
  radioSelected.value = ''
}

// 每页条数改变
const handleSizeChange = (val) => {
  pageSize.value = val
  emit('update:pageSize', val)
  emit('size-change', val)
}

// 当前页改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  emit('update:currentPage', val)
  emit('page-change', val)
}

// 监听props变化
watch(() => props.currentPage, (val) => {
  currentPage.value = val
})

watch(() => props.pageSize, (val) => {
  pageSize.value = val
})

watch(() => props.columns, () => {
  initColumns()
}, { deep: true })

// 组件挂载时初始化
onMounted(() => {
  initColumns()
})

// 暴露方法供父组件调用
defineExpose({
  clearSelection
})
</script>

<style scoped>
.common-table {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding: 12px 0;
}

.column-setting {
  padding: 0 20px;
}

.column-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.column-item:last-child {
  border-bottom: none;
}

:deep(.el-button--primary) {
  background-color: #409EFF;
  color: #fff;
  border-color: #409EFF;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  color: #409EFF;
  border-color: #66b1ff;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #409EFF;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
}
</style>

<style>
/* Tooltip内容样式 - 使用全局样式 */
.cell-tooltip-popper {
  max-width: 500px !important;
}

.tooltip-content-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tooltip-text {
  flex: 1;
  word-break: break-word;
  line-height: 1.5;
}

.tooltip-copy-btn {
  flex-shrink: 0;
  padding: 4px 8px !important;
  height: auto !important;
  font-size: 12px !important;
}
</style>