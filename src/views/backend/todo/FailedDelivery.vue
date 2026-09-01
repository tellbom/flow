<template>
    <div class="failed-delivery-page">
        <!-- ══ Hero 横幅 ══ -->
        <section class="hero">
            <div class="hero-content">
                <div class="hero-left">
                    <div class="hero-badge">
                        <span class="badge-dot"></span>
                        <span>死信任务中心 (DeadLetter)</span>
                    </div>
                    <h1 class="hero-title">失败投递管理</h1>
                </div>
                <div class="hero-stats">
                    <div v-for="s in heroStats" :key="s.label" class="stat-card">
                        <span class="stat-label">{{ s.label }}</span>
                        <div class="stat-value-row">
                            <span class="stat-value" :style="{ color: s.tone }">{{ s.value }}</span>
                            <span v-if="s.sub" class="stat-sub">{{ s.sub }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ══ 处理说明 ══ -->
        <section class="info-banner">
            <div class="info-icon">
                <el-icon :size="20"><Warning /></el-icon>
            </div>
            <div class="info-body">
                <div class="info-title-row">
                    <span class="info-title">死信任务处理说明</span>
                    <span class="info-tag">Flowable Async Job</span>
                </div>
                <p class="info-text">
                    当末尾流程完成回调多次重试均失败后，该任务会进入 Flowable
                    死信表（DeadLetter）。运维人员可根据业务排查结果选择<strong>【重试投递】</strong>（重新入列执行）或<strong>【终止流程】</strong>（终结相关流程实例并记录终止原因）。
                </p>
            </div>
        </section>

        <!-- ══ 筛选 ══ -->
        <section class="filter-card">
            <el-form class="filter-form" @submit.prevent>
                <div class="filter-field">
                    <span class="field-label">业务单号 (businessId)</span>
                    <el-input v-model="filters.businessId" placeholder="例如 PZ_001" clearable @keyup.enter="handleSearch" />
                </div>
                <div class="filter-field">
                    <span class="field-label">流程实例 (processInstanceId)</span>
                    <el-input v-model="filters.processInstanceId" placeholder="例如 proc-inst-1f9c2a01" clearable @keyup.enter="handleSearch" />
                </div>
                <div class="filter-field filter-field--select">
                    <span class="field-label">死信状态 (status)</span>
                    <el-select v-model="filters.status" placeholder="全部状态">
                        <el-option label="全部状态" value="" />
                        <el-option label="dead_letter (死信)" value="dead_letter" />
                        <el-option label="executable (已准备)" value="executable" />
                        <el-option label="terminated (已终止)" value="terminated" />
                    </el-select>
                </div>
                <div class="filter-actions">
                    <el-button type="primary" class="fd-btn-primary" :loading="loading" @click="handleSearch">
                        <el-icon v-if="!loading" class="btn-inner-icon"><Search /></el-icon>
                        <span>查询</span>
                    </el-button>
                    <el-button class="fd-btn-plain" @click="handleReset">重置</el-button>
                </div>
            </el-form>
        </section>

        <!-- ══ 数据表 ══ -->
        <section class="table-card">
            <el-table
                ref="tableRef"
                v-loading="loading"
                :data="rows"
                row-key="deliveryId"
                class="fd-table"
                empty-text="未找到符合筛选条件的失败投递死信记录"
                @expand-change="handleExpandChange"
            >
                <el-table-column type="expand" width="30">
                    <template #default="{ row }">
                        <div class="expand-panel">
                            <!-- 左：执行上下文 -->
                            <div class="expand-context">
                                <span class="context-eyebrow">FLOWABLE 执行上下文</span>
                                <h4 class="context-title">流程与任务节点信息</h4>
                                <div class="context-field">
                                    <span class="context-label">流程实例 (processInstanceId)</span>
                                    <span
                                        class="context-value context-value--copy"
                                        title="点击复制 processInstanceId"
                                        @click="copyText(row.processInstanceId, 'processInstanceId')"
                                        >{{ row.processInstanceId }}</span
                                    >
                                </div>
                                <div class="context-field">
                                    <span class="context-label">当前节点 (activityId)</span>
                                    <span class="context-value">{{ row.activityId }}</span>
                                </div>
                                <div class="context-field">
                                    <span class="context-label">任务来源与类型</span>
                                    <span class="context-value">{{ row.source }} · {{ row.deliveryType }}</span>
                                </div>
                                <div class="context-note">
                                    <div class="context-note-title">
                                        <el-icon :size="14"><InfoFilled /></el-icon>
                                        <span>死信持久化机制说明</span>
                                    </div>
                                    Flowable Async Job 进入死信后，异常上下文记录在 Stacktrace 中。HTTP
                                    响应码及重试频次未独立持久化在死信主记录表，排查请详见右侧完整 Stacktrace。
                                </div>
                            </div>

                            <!-- 右：异常堆栈 -->
                            <div class="expand-stack">
                                <div class="expand-stack-header">
                                    <div class="expand-stack-header-left">
                                        <span class="expand-stack-title">完整异常堆栈 (Exception Stacktrace)</span>
                                        <span class="expand-stack-api">GET /failed-deliveries/{{ row.deliveryId }}</span>
                                    </div>
                                    <el-button
                                        link
                                        class="stack-copy-btn"
                                        :loading="stackLoadingMap[row.deliveryId]"
                                        @click="copyText(stackOf(row), '异常堆栈')"
                                        >复制堆栈</el-button
                                    >
                                </div>
                                <div v-loading="stackLoadingMap[row.deliveryId]" class="terminal">
                                    <div class="terminal-bar">
                                        <div class="terminal-bar-left">
                                            <span class="term-dot term-dot--red"></span>
                                            <span class="term-dot term-dot--amber"></span>
                                            <span class="term-dot term-dot--green"></span>
                                            <span class="terminal-file">stacktrace.log</span>
                                        </div>
                                        <span class="terminal-side">Flowable Async Executor</span>
                                    </div>
                                    <pre class="terminal-body">{{ stackOf(row) }}</pre>
                                </div>
                                <p class="expand-stack-tip">提示：堆栈展示 Flowable 捕获的完整 Exception 信息，反映内部回调执行失败原因。</p>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <!-- 投递业务名称 / ID -->
                <el-table-column label="投递业务名称 / ID" min-width="230">
                    <template #default="{ row }">
                        <div class="biz-cell">
                            <div class="biz-title">{{ row.businessTitle || businessTitleFallback(row) }}</div>
                            <div class="biz-meta">
                                <span class="biz-id" title="点击复制 deliveryId" @click="copyText(row.deliveryId, 'Delivery ID')">{{
                                    row.deliveryId
                                }}</span>
                                <span class="biz-sep">|</span>
                                <span class="biz-business">
                                    businessId:
                                    <strong v-if="row.businessId">{{ row.businessId }}</strong>
                                    <span v-else class="biz-null">null</span>
                                </span>
                            </div>
                            <el-button link class="expand-toggle" @click="toggleExpand(row)">
                                <span>{{ isExpanded(row) ? '收起诊断与堆栈' : '查看异常堆栈与诊断' }}</span>
                                <el-icon :class="{ 'expand-toggle-icon--open': isExpanded(row) }"><ArrowDown /></el-icon>
                            </el-button>
                        </div>
                    </template>
                </el-table-column>

                <!-- 事件类型 -->
                <el-table-column label="事件类型" width="172">
                    <template #default="{ row }">
                        <span class="delivery-type">{{ row.deliveryType }}</span>
                    </template>
                </el-table-column>

                <!-- 流程状态 -->
                <el-table-column label="流程状态" width="100">
                    <template #default="{ row }">
                        <span class="state-pill" :class="`state-pill--${row.processState}`">
                            {{ processStateMap[row.processState]?.label || row.processState }}
                        </span>
                    </template>
                </el-table-column>

                <!-- 回调目标地址 -->
                <el-table-column label="回调目标地址 (Target)" min-width="180">
                    <template #default="{ row }">
                        <span class="target-url" :title="row.target" @click="copyText(row.target, '回调地址')">{{ row.target }}</span>
                    </template>
                </el-table-column>

                <!-- 死信状态 -->
                <el-table-column label="死信状态" width="146">
                    <template #default="{ row }">
                        <span class="status-pill" :class="`status-pill--${row.status}`">
                            <span class="status-dot"></span>
                            <span>{{ statusMap[row.status]?.label || row.status }}</span>
                        </span>
                    </template>
                </el-table-column>

                <!-- 创建时间 -->
                <el-table-column label="创建时间" width="162">
                    <template #default="{ row }">
                        <span class="created-time">{{ formatTime(row.createdAt) }}</span>
                    </template>
                </el-table-column>

                <!-- 操作 -->
                <el-table-column label="操作" width="186" align="right">
                    <template #default="{ row }">
                        <div class="action-group">
                            <el-button
                                v-if="row.availableActions?.includes('retry_delivery')"
                                class="action-btn action-btn--retry"
                                @click="openRetryDialog(row)"
                                >重试投递</el-button
                            >
                            <el-button
                                v-if="row.availableActions?.includes('terminate_process')"
                                class="action-btn action-btn--terminate"
                                @click="openTerminateDialog(row)"
                                >终止流程</el-button
                            >
                            <span v-if="!row.availableActions || row.availableActions.length === 0" class="action-none">无可用操作</span>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="table-footer">
                <span class="table-footer-count">
                    共 <strong>{{ total }}</strong> 条死信记录 · Source: flowable_async_job
                </span>
                <el-pagination
                    v-model:current-page="pagination.pageIndex"
                    v-model:page-size="pagination.pageSize"
                    :total="total"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next"
                    small
                    background
                    @current-change="loadList"
                    @size-change="handleSizeChange"
                />
            </div>
        </section>

        <!-- ══ 重试投递弹窗 ══ -->
        <el-dialog v-model="retryDialog.visible" width="460px" :show-close="true" append-to-body class="fd-dialog" @closed="retryDialog.reason = ''">
            <div class="dialog-head">
                <div class="dialog-icon dialog-icon--primary">
                    <el-icon :size="20"><RefreshRight /></el-icon>
                </div>
                <div>
                    <h3 class="dialog-title">确认重试投递</h3>
                    <p class="dialog-desc">
                        将此 DeadLetter 移回 Executable 作业列，由 Flowable Async Executor 重新尝试回调。不会重复跑已完成的用户任务。
                    </p>
                </div>
            </div>

            <div v-if="retryDialog.target" class="dialog-info-box">
                <div class="dialog-info-id">{{ retryDialog.target.deliveryId }}</div>
                <div class="dialog-info-sub">{{ retryDialog.target.target }}</div>
            </div>

            <div class="dialog-field">
                <span class="dialog-field-label">重试原因说明（可选 · 记入审计日志）</span>
                <el-input v-model="retryDialog.reason" placeholder="例如：接收方网络服务已恢复，手动触发重试" />
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button class="fd-btn-plain" @click="retryDialog.visible = false">取消</el-button>
                    <el-button type="primary" class="fd-btn-primary" :loading="retryDialog.submitting" @click="confirmRetry">确认重试投递</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- ══ 终止流程弹窗 ══ -->
        <el-dialog v-model="terminateDialog.visible" width="460px" :show-close="true" append-to-body class="fd-dialog" @closed="resetTerminateDialog">
            <div class="dialog-head">
                <div class="dialog-icon dialog-icon--danger">
                    <el-icon :size="20"><Warning /></el-icon>
                </div>
                <div>
                    <h3 class="dialog-title">确认终止流程实例</h3>
                    <p class="dialog-desc">直接终止该死信对应的 Flowable 流程实例，生命周期转换为 Terminated。此操作不可撤销。</p>
                </div>
            </div>

            <div v-if="terminateDialog.target" class="dialog-info-box">
                <div class="dialog-info-id">{{ terminateDialog.target.processInstanceId }}</div>
                <div class="dialog-info-sub">businessId: {{ terminateDialog.target.businessId ?? 'null' }}</div>
            </div>

            <div class="dialog-field">
                <span class="dialog-field-label"> 终止原因 <span class="required-star">*</span>（必填） </span>
                <el-input
                    v-model="terminateDialog.reason"
                    type="textarea"
                    :rows="3"
                    resize="none"
                    :class="{ 'is-error': terminateDialog.error }"
                    placeholder="例如：业务确认数据异常无需重新投递，关单并手动终止"
                    @input="terminateDialog.error = !terminateDialog.reason.trim()"
                />
                <span v-if="terminateDialog.error" class="dialog-field-error"> 必须填写终止原因方可执行终止操作 </span>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button class="fd-btn-plain" @click="terminateDialog.visible = false">取消</el-button>
                    <el-button class="fd-btn-danger" :loading="terminateDialog.submitting" @click="confirmTerminate">确认终止流程</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Search, ArrowDown, RefreshRight, InfoFilled } from '@element-plus/icons-vue'
import { getFailedDeliveries, getFailedDeliveryDetail, retryFailedDelivery, terminateFailedDelivery } from '/@/api/workflow/failedDeliveryApi'

// ── 状态映射（展示层固定映射，动作按钮只认 availableActions） ──
const statusMap = {
    dead_letter: { label: '死信 DeadLetter' },
    executable: { label: '已准备重试' },
    terminated: { label: '已终止' },
}
const processStateMap = {
    running: { label: '运行中' },
    not_active: { label: '非活动' },
    terminated: { label: '已终止' },
}

// ── 列表状态 ──
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const filters = reactive({ businessId: '', processInstanceId: '', status: '' })
const pagination = reactive({ pageIndex: 1, pageSize: 20 })

const tableRef = ref(null)
const expandedKeys = ref([])
// 展开行详情堆栈缓存：deliveryId -> 完整 stacktrace
const stackMap = reactive({})
const stackLoadingMap = reactive({})

// ── Hero 统计 ──
const heroStats = computed(() => [
    {
        label: '待处理死信',
        value: rows.value.filter((r) => r.status === 'dead_letter').length,
        tone: 'var(--wf-danger)',
        sub: '需人工干预',
    },
    {
        label: '流程运行中',
        value: rows.value.filter((r) => r.processState === 'running').length,
        tone: 'var(--wf-primary)',
        sub: '实例处于 Active',
    },
    {
        label: '总记录',
        value: total.value,
        tone: '#334155',
        sub: '',
    },
])

// ── 数据加载 ──
async function loadList() {
    loading.value = true
    try {
        const result = await getFailedDeliveries({
            businessId: filters.businessId || undefined,
            processInstanceId: filters.processInstanceId || undefined,
            status: filters.status || undefined,
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
        })
        rows.value = result.items ?? []
        total.value = result.total ?? 0
        expandedKeys.value = []
    } catch {
        // processAxios 已统一提示
    } finally {
        loading.value = false
    }
}

const handleSearch = () => {
    pagination.pageIndex = 1
    loadList()
}
const handleReset = () => {
    filters.businessId = ''
    filters.processInstanceId = ''
    filters.status = ''
    pagination.pageIndex = 1
    loadList()
}
const handleSizeChange = () => {
    pagination.pageIndex = 1
    loadList()
}

// ── 展开行 / 堆栈详情 ──
const isExpanded = (row) => expandedKeys.value.includes(row.deliveryId)

function toggleExpand(row) {
    tableRef.value?.toggleRowExpansion(row, !isExpanded(row))
}

async function handleExpandChange(row, expandedRows) {
    expandedKeys.value = (expandedRows || []).map((r) => r.deliveryId)
    const id = row.deliveryId
    if (isExpanded(row) && stackMap[id] === undefined) {
        // 列表返回摘要，展开时拉取详情拿完整 exception stacktrace
        stackLoadingMap[id] = true
        try {
            const detail = await getFailedDeliveryDetail(id)
            stackMap[id] = detail?.lastError || row.lastError || '（无异常堆栈信息）'
        } catch {
            stackMap[id] = row.lastError || '（详情加载失败，展示列表摘要）'
        } finally {
            stackLoadingMap[id] = false
        }
    }
}

const stackOf = (row) => stackMap[row.deliveryId] ?? row.lastError ?? ''

// ── 复制 ──
async function copyText(text, label) {
    if (!text) return
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text)
        } else {
            const textarea = document.createElement('textarea')
            textarea.value = text
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        }
        ElMessage.success(`已复制 ${label} 到剪贴板`)
    } catch {
        ElMessage.warning('复制失败，请手动选择复制')
    }
}

// ── 重试投递 ──
const retryDialog = reactive({ visible: false, target: null, reason: '', submitting: false })

function openRetryDialog(row) {
    retryDialog.target = row
    retryDialog.reason = ''
    retryDialog.visible = true
}

async function confirmRetry() {
    if (!retryDialog.target) return
    retryDialog.submitting = true
    try {
        const result = await retryFailedDelivery(retryDialog.target.deliveryId, retryDialog.reason || undefined)
        ElMessage.success(
            `已提交重试投递 · ${result?.deliveryId ?? retryDialog.target.deliveryId}（状态转换为 ${result?.status ?? 'executable'}，等待 Async Executor 执行）`
        )
        retryDialog.visible = false
        loadList()
    } catch {
        // processAxios 已统一提示
    } finally {
        retryDialog.submitting = false
    }
}

// ── 终止流程 ──
const terminateDialog = reactive({
    visible: false,
    target: null,
    reason: '',
    error: false,
    submitting: false,
})

function openTerminateDialog(row) {
    terminateDialog.target = row
    terminateDialog.reason = ''
    terminateDialog.error = false
    terminateDialog.visible = true
}

function resetTerminateDialog() {
    terminateDialog.reason = ''
    terminateDialog.error = false
}

async function confirmTerminate() {
    if (!terminateDialog.target) return
    if (!terminateDialog.reason.trim()) {
        terminateDialog.error = true
        return
    }
    terminateDialog.submitting = true
    try {
        const result = await terminateFailedDelivery(terminateDialog.target.deliveryId, terminateDialog.reason.trim())
        ElMessage.success(`流程已终止 · ${result?.deliveryId ?? terminateDialog.target.deliveryId}`)
        terminateDialog.visible = false
        loadList()
    } catch {
        // processAxios 已统一提示
    } finally {
        terminateDialog.submitting = false
    }
}

// ── 工具 ──
function formatTime(value) {
    if (!value) return '--'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const p = (n) => String(n).padStart(2, '0')
    return (
        `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ` +
        `${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`
    )
}

const businessTitleFallback = (row) => (row.businessId ? `业务流程 ${row.businessId}` : `失败投递 ${row.deliveryId}`)

// ── 初始化 ──
onMounted(() => {
    loadList()
})
</script>

<style scoped>
/* ═══════════════ 页面容器 ═══════════════ */
.failed-delivery-page {
    padding: var(--wf-space-20);
    background: var(--wf-bg);
    min-height: 100%;
    color: var(--wf-ink);
}

/* ═══════════════ Hero 横幅 ═══════════════ */
.hero {
    position: relative;
    border-radius: var(--wf-radius-lg);
    overflow: hidden;
    /* 与平台顶栏（#066bd1 → #0058b8）同系的蓝色渐变主题 */
    background: radial-gradient(900px 320px at 88% -80%, rgba(255, 255, 255, 0.16), transparent 62%),
        radial-gradient(700px 280px at -8% 150%, rgba(0, 22, 60, 0.28), transparent 62%),
        linear-gradient(102deg, #0052ae 0%, #066bd1 55%, #0b7ae0 100%);
    min-height: 150px;
    padding: var(--wf-space-24);
    display: flex;
    align-items: flex-end;
}

.hero-content {
    position: relative;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--wf-space-16);
}

.hero-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--wf-space-8);
    border-radius: var(--wf-radius-pill);
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    padding: 4px 12px;
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-semibold);
    color: #fff;
    backdrop-filter: blur(6px);
}

.badge-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fbbf24;
    animation: fd-dot-pulse 1.6s ease-in-out infinite;
}

@keyframes fd-dot-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.35;
    }
}

.hero-title {
    margin: var(--wf-space-8) 0 0;
    font-size: var(--wf-font-3xl);
    font-weight: var(--wf-font-weight-bold);
    letter-spacing: -0.02em;
    color: #fff;
}

.hero-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--wf-space-12);
}

.stat-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 130px;
    border-radius: var(--wf-radius-md);
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: rgba(255, 255, 255, 0.92);
    padding: 14px 16px;
    box-shadow: 0 2px 8px -2px rgba(20, 40, 80, 0.06);
    backdrop-filter: blur(8px);
}

.stat-label {
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-medium);
    color: var(--wf-ink-3);
}

.stat-value-row {
    margin-top: 4px;
    display: flex;
    align-items: baseline;
    gap: var(--wf-space-6);
}

.stat-value {
    font-size: var(--wf-font-2xl);
    font-weight: var(--wf-font-weight-bold);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
}

.stat-sub {
    font-size: var(--wf-font-2xs);
    color: #94a3b8;
}

/* ═══════════════ 处理说明 ═══════════════ */
.info-banner {
    margin-top: var(--wf-space-16);
    border-radius: var(--wf-radius-lg);
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: var(--wf-canvas);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
    padding: var(--wf-space-20);
    display: flex;
    align-items: flex-start;
    gap: var(--wf-space-16);
}

.info-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: var(--wf-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    color: #d97706;
}

.info-title-row {
    display: flex;
    align-items: center;
    gap: var(--wf-space-8);
}

.info-title {
    font-size: var(--wf-font-md);
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-ink);
}

.info-tag {
    border-radius: var(--wf-radius-sm);
    background: var(--wf-bg-section);
    padding: 2px var(--wf-space-8);
    font-size: var(--wf-font-2xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: var(--wf-font-weight-medium);
    color: var(--wf-ink-2);
}

.info-text {
    margin: var(--wf-space-4) 0 0;
    font-size: var(--wf-font-xs);
    line-height: var(--wf-line-height-loose);
    color: var(--wf-ink-2);
}

.info-text :deep(strong) {
    margin: 0 2px;
    color: var(--wf-ink);
    font-weight: var(--wf-font-weight-semibold);
}

/* ═══════════════ 筛选 ═══════════════ */
.filter-card {
    margin-top: var(--wf-space-16);
    border-radius: var(--wf-radius-lg);
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: var(--wf-canvas);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
    padding: var(--wf-space-16) var(--wf-space-20);
}

.filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: var(--wf-space-16);
}

.filter-field {
    display: flex;
    flex-direction: column;
    gap: var(--wf-space-6);
    flex: 1 1 240px;
    min-width: 220px;
}

.filter-field--select {
    flex: 0 0 200px;
    min-width: 200px;
}

.field-label {
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-ink-2);
}

.filter-actions {
    display: flex;
    align-items: flex-end;
    gap: var(--wf-space-8);
    margin-left: auto;
}

/* 通用按钮 */
.fd-btn-primary {
    height: 32px;
    padding: 0 var(--wf-space-20);
    border-radius: var(--wf-radius-sm);
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-semibold);
}

.fd-btn-primary .btn-inner-icon {
    margin-right: 4px;
}

.fd-btn-plain {
    height: 32px;
    padding: 0 var(--wf-space-16);
    border-radius: var(--wf-radius-sm);
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-ink-2);
}

.fd-btn-danger {
    height: 32px;
    padding: 0 var(--wf-space-20);
    border-radius: var(--wf-radius-sm);
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-bold);
    background: var(--wf-danger);
    border-color: var(--wf-danger);
    color: #fff;
}

.fd-btn-danger:hover,
.fd-btn-danger:focus {
    background: #dc2626;
    border-color: #dc2626;
    color: #fff;
}

/* ═══════════════ 表格卡片 ═══════════════ */
.table-card {
    margin-top: var(--wf-space-16);
    border-radius: var(--wf-radius-lg);
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: var(--wf-canvas);
    box-shadow: 0 2px 10px -4px rgba(15, 23, 42, 0.05);
    overflow: hidden;
}

.fd-table {
    --el-table-header-bg-color: rgba(248, 250, 252, 0.9);
    width: 100%;
}

.fd-table :deep(thead th) {
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-ink-3);
    letter-spacing: 0.04em;
    padding: 10px 12px;
    white-space: nowrap;
}

.fd-table :deep(td) {
    padding: 12px;
    vertical-align: top;
    font-size: var(--wf-font-xs);
}

/* 隐藏默认展开箭头列的图标（由业务名称下的链接控制展开） */
.fd-table :deep(.el-table__expand-icon) {
    display: none;
}

/* ── 业务名称单元格 ── */
.biz-cell {
    max-width: 300px;
}

.biz-title {
    font-size: var(--wf-font-md);
    font-weight: var(--wf-font-weight-bold);
    color: var(--wf-ink);
    line-height: 1.35;
}

.biz-meta {
    margin-top: var(--wf-space-6);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--wf-space-8);
    font-size: var(--wf-font-2xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--wf-ink-3);
}

.biz-id {
    border-radius: var(--wf-radius-sm);
    background: var(--wf-bg-section);
    padding: 2px 6px;
    cursor: pointer;
    transition:
        background var(--wf-transition-fast),
        color var(--wf-transition-fast);
}

.biz-id:hover {
    background: var(--wf-border);
    color: var(--wf-ink-2);
}

.biz-sep {
    color: var(--wf-border);
}

.biz-business strong {
    color: var(--wf-ink-2);
    font-weight: var(--wf-font-weight-semibold);
}

.biz-null {
    border-radius: 4px;
    background: var(--wf-warning-bg);
    padding: 0 4px;
    color: var(--wf-warning-text);
}

.expand-toggle {
    margin-top: var(--wf-space-8);
    margin-left: 0;
    height: auto;
    padding: 0;
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-primary);
}

.expand-toggle :deep(.el-icon) {
    margin-left: 2px;
    transition: transform var(--wf-transition-base);
}

.expand-toggle :deep(.el-icon.expand-toggle-icon--open) {
    transform: rotate(180deg);
}

/* ── 事件类型 ── */
.delivery-type {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    border-radius: var(--wf-radius-sm);
    border: 1px solid rgba(148, 163, 184, 0.25);
    background: var(--wf-bg-section);
    padding: 4px 10px;
    font-size: var(--wf-font-2xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: var(--wf-font-weight-medium);
    color: var(--wf-ink-2);
}

/* ── 流程状态 pill ── */
.state-pill {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
    border-radius: var(--wf-radius-sm);
    padding: 3px 10px;
    font-size: var(--wf-font-2xs);
    font-weight: var(--wf-font-weight-semibold);
    letter-spacing: -0.01em;
}

.state-pill--running {
    color: #0d7a46;
    background: rgba(31, 157, 99, 0.1);
    border: 1px solid rgba(31, 157, 99, 0.25);
}

.state-pill--not_active {
    color: #4a5568;
    background: #f1f4f9;
    border: 1px solid rgba(74, 85, 104, 0.2);
}

.state-pill--terminated {
    color: #e0413a;
    background: rgba(224, 65, 58, 0.08);
    border: 1px solid rgba(224, 65, 58, 0.2);
}

/* ── 回调地址 ── */
.target-url {
    display: block;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--wf-font-xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--wf-ink-2);
    cursor: pointer;
    transition: color var(--wf-transition-fast);
}

.target-url:hover {
    color: var(--wf-ink);
}

/* ── 死信状态 pill ── */
.status-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--wf-space-6);
    white-space: nowrap;
    border-radius: var(--wf-radius-pill);
    padding: 4px 10px;
    font-size: var(--wf-font-2xs);
    font-weight: var(--wf-font-weight-semibold);
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: currentColor;
}

.status-pill--dead_letter {
    color: #d92d20;
    background: rgba(224, 65, 58, 0.1);
    border: 1px solid rgba(224, 65, 58, 0.22);
}

.status-pill--executable {
    color: #b56900;
    background: rgba(217, 138, 0, 0.1);
    border: 1px solid rgba(217, 138, 0, 0.25);
}

.status-pill--terminated {
    color: #525f7f;
    background: #f1f3f9;
    border: 1px solid rgba(100, 116, 139, 0.22);
}

/* ── 创建时间 ── */
.created-time {
    font-size: var(--wf-font-2xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--wf-ink-3);
}

/* ── 操作按钮 ── */
.action-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--wf-space-8);
}

.action-btn {
    height: 30px;
    padding: 0 12px;
    border-radius: var(--wf-radius-sm);
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-bold);
    white-space: nowrap;
}

.action-btn--retry {
    background: rgba(0, 102, 204, 0.08);
    border: 1px solid rgba(0, 102, 204, 0.25);
    color: var(--wf-primary);
}

.action-btn--retry:hover,
.action-btn--retry:focus {
    background: var(--wf-primary);
    border-color: var(--wf-primary);
    color: #fff;
}

.action-btn--terminate {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
}

.action-btn--terminate:hover,
.action-btn--terminate:focus {
    background: #dc2626;
    border-color: #dc2626;
    color: #fff;
}

.action-none {
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-medium);
    color: #94a3b8;
}

/* ═══════════════ 展开面板 ═══════════════ */
.expand-panel {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: var(--wf-space-24);
    padding: var(--wf-space-8) var(--wf-space-12);
}

@media (max-width: 900px) {
    .expand-panel {
        grid-template-columns: 1fr;
    }
}

/* ── 左：执行上下文 ── */
.expand-context {
    display: flex;
    flex-direction: column;
    gap: var(--wf-space-12);
    border-right: 1px solid var(--wf-divider);
    padding-right: var(--wf-space-24);
}

@media (max-width: 900px) {
    .expand-context {
        border-right: none;
        border-bottom: 1px solid var(--wf-divider);
        padding-right: 0;
        padding-bottom: var(--wf-space-16);
    }
}

.context-eyebrow {
    font-size: var(--wf-font-2xs);
    font-weight: var(--wf-font-weight-bold);
    letter-spacing: 0.08em;
    color: #94a3b8;
}

.context-title {
    margin: var(--wf-space-4) 0 0;
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-bold);
    color: var(--wf-ink);
}

.context-field {
    border-radius: var(--wf-radius-sm);
    border: 1px solid var(--wf-divider);
    background: var(--wf-bg-section);
    padding: 10px;
}

.context-label {
    display: block;
    font-size: var(--wf-font-2xs);
    color: #94a3b8;
}

.context-value {
    display: block;
    margin-top: 2px;
    font-size: var(--wf-font-xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-ink-2);
    word-break: break-all;
}

.context-value--copy {
    cursor: pointer;
    transition: color var(--wf-transition-fast);
}

.context-value--copy:hover {
    color: var(--wf-primary);
}

.context-note {
    margin-top: auto;
    border-radius: var(--wf-radius-md);
    border: 1px solid rgba(245, 158, 11, 0.2);
    background: rgba(245, 158, 11, 0.1);
    padding: var(--wf-space-12);
    font-size: var(--wf-font-2xs);
    line-height: var(--wf-line-height-loose);
    color: #78350f;
}

.context-note-title {
    display: flex;
    align-items: center;
    gap: var(--wf-space-6);
    margin-bottom: var(--wf-space-4);
    font-weight: var(--wf-font-weight-bold);
    color: #92400e;
}

/* ── 右：异常堆栈 ── */
.expand-stack {
    display: flex;
    flex-direction: column;
    gap: var(--wf-space-8);
    min-width: 0;
}

.expand-stack-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--wf-space-12);
}

.expand-stack-header-left {
    display: flex;
    align-items: center;
    gap: var(--wf-space-8);
    min-width: 0;
}

.expand-stack-title {
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-bold);
    color: var(--wf-ink);
}

.expand-stack-api {
    flex-shrink: 0;
    border-radius: var(--wf-radius-sm);
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    padding: 2px var(--wf-space-8);
    font-size: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: var(--wf-font-weight-semibold);
    color: #1d4ed8;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.stack-copy-btn {
    height: auto;
    padding: 0;
    font-size: var(--wf-font-2xs);
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-ink-3);
}

.stack-copy-btn:hover {
    color: var(--wf-ink);
}

/* ── 终端风堆栈 ── */
.terminal {
    border-radius: var(--wf-radius-md);
    border: 1px solid #1e293b;
    background: #0f172a;
    overflow: hidden;
}

.terminal-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #1e293b;
    background: rgba(2, 6, 23, 0.6);
    padding: 8px 14px;
    font-size: var(--wf-font-2xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: #94a3b8;
}

.terminal-bar-left {
    display: flex;
    align-items: center;
    gap: var(--wf-space-6);
}

.term-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.term-dot--red {
    background: rgba(239, 68, 68, 0.8);
}
.term-dot--amber {
    background: rgba(245, 158, 11, 0.8);
}
.term-dot--green {
    background: rgba(52, 211, 153, 0.8);
}

.terminal-file {
    margin-left: var(--wf-space-8);
    color: #cbd5e1;
}

.terminal-body {
    margin: 0;
    padding: var(--wf-space-16);
    max-height: 320px;
    overflow: auto;
    font-size: var(--wf-font-xs);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    line-height: var(--wf-line-height-loose);
    color: #e2e8f0;
    white-space: pre-wrap;
    word-break: break-all;
}

.expand-stack-tip {
    margin: 0;
    font-size: var(--wf-font-2xs);
    color: #94a3b8;
}

/* ═══════════════ 表格底部分页 ═══════════════ */
.table-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--wf-space-12);
    border-top: 1px solid var(--wf-divider);
    background: rgba(248, 250, 252, 0.6);
    padding: 14px var(--wf-space-24);
}

.table-footer-count {
    font-size: var(--wf-font-xs);
    color: var(--wf-ink-3);
}

.table-footer-count strong {
    color: var(--wf-ink-2);
}

/* ═══════════════ 弹窗 ═══════════════ */
.dialog-head {
    display: flex;
    align-items: flex-start;
    gap: var(--wf-space-12);
}

.dialog-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dialog-icon--primary {
    background: #eff6ff;
    border: 1px solid #dbeafe;
    color: var(--wf-primary);
}

.dialog-icon--danger {
    background: #fef2f2;
    border: 1px solid #fee2e2;
    color: var(--wf-danger);
}

.dialog-title {
    margin: 0;
    font-size: var(--wf-font-lg);
    font-weight: var(--wf-font-weight-bold);
    color: var(--wf-ink);
}

.dialog-desc {
    margin: var(--wf-space-4) 0 0;
    font-size: var(--wf-font-xs);
    line-height: var(--wf-line-height-loose);
    color: var(--wf-ink-3);
}

.dialog-info-box {
    margin-top: var(--wf-space-16);
    border-radius: var(--wf-radius-md);
    border: 1px solid var(--wf-divider);
    background: var(--wf-bg-section);
    padding: var(--wf-space-12) var(--wf-space-16);
    font-size: var(--wf-font-xs);
}

.dialog-info-id {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: var(--wf-font-weight-bold);
    color: var(--wf-ink-2);
    word-break: break-all;
}

.dialog-info-sub {
    margin-top: var(--wf-space-4);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--wf-ink-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dialog-field {
    margin-top: var(--wf-space-16);
    display: flex;
    flex-direction: column;
    gap: var(--wf-space-6);
}

.dialog-field-label {
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-ink-2);
}

.required-star {
    color: var(--wf-danger);
}

.dialog-field-error {
    font-size: var(--wf-font-xs);
    font-weight: var(--wf-font-weight-semibold);
    color: var(--wf-danger);
}

.dialog-field :deep(.is-error .el-textarea__inner) {
    border-color: var(--wf-danger);
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.12);
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--wf-space-8);
}
</style>
