/**
 * processApi.ts
 * 流程中心所有接口封装
 *
 * 路径建议：src/api/workflow/processApi.ts
 * 依赖：./processAxios
 *
 * PATCH-R05 变更（对齐 C# DTO，清理旧机制残留）：
 *
 * DTO 修正：
 *   PendingTaskDto
 *     + pageUrl: string | null        — iframe 直用 URL，后端已拼好上下文参数
 *     + isAfterConvergencePoint: bool — 是否过不可撤回节点
 *     - requiredSlots 移除（后端注释"前端可以忽略"，新架构不需要）
 *     createTime 字段名与后端保持一致（C# DateTime → JSON string）
 *
 *   CompleteTaskRequest
 *     nextSlotSelections 改为可选且默认空数组（全自动架构不传）
 *     businessVariables  改为可选（全自动架构不传）
 *
 *   AuditRecordDto
 *     + pageCode: string              — 节点页面编码快照（供历史 iframe 拼 URL）
 *     + rejectCode: string | null
 *     + rejectTargetNodeKey: string | null
 *     + hasOutOfRecommendedRange: bool | null
 *     + recommendedUsersSnapshot: Record<string,string[]>
 *     + restrictToRecommendedSnapshot: Record<string,bool>
 *     slotSelections 类型改为 SlotSelectionRecordDto[]（字段更精确）
 *
 *   FlowRenderDto — 对齐 ProcessFlowRenderDto.cs 实际字段名
 *     nodes 元素类型改为 FlowNodeDto（含 state / assignees / isMultiInstance）
 *     edges 元素类型改为 FlowEdgeDto（含 state / label）
 *     activeTaskRenders → activeTasks: ActiveTaskRenderDto[]
 *     completedRecords 类型改为 CompletedRecordRenderDto
 *     + rejectHistory: RejectHistoryRenderDto[]
 *     + hasRejectHistory: bool
 *     + walkedNodeIds: string[]
 *     移除旧 bpmnXml（FlowRenderDto 无此字段）
 *
 *   移除（前端全自动架构不再使用）：
 *     SlotDefinition（选人由 assigneeContract 后端注入，前端不感知）
 *     AssigneeContract / RoleAssignment / LoopAssignment / LoopItem
 *     AuditHistoryItem（getAuditHistory 复用 AuditRecordDto，无需独立类型）
 */

import { createProcessRequest } from './processAxios'

// ══════════════════════════════════════════════════════════════
//  公共
// ══════════════════════════════════════════════════════════════

export interface PageResult<T> {
  items:     T[]
  total:     number
  pageIndex: number
  pageSize:  number
}

// ══════════════════════════════════════════════════════════════
//  BPMN 部署
// ══════════════════════════════════════════════════════════════

export interface DeployNodeSummary {
  taskDefinitionKey: string
  nodeSemantic:      string
  pageCode:          string
  roleKey:           string
  assigneeMode:      string   // 'single' | 'multiple'
  callbackUrl:       string
  slotCount:         number
}

export interface DeployBpmnResponse {
  deploymentId:         string
  processDefinitionKey: string
  nodes:                DeployNodeSummary[]
}

export interface NodeConfigDetail {
  taskDefinitionKey: string
  nodeSemantic:      string
  pageCode:          string
  roleKey:           string
  assigneeMode:      string
  callbackUrl:       string
  canReject:         boolean
  rejectOptions:     RejectOption[]
  isRejectTarget:    boolean
  rejectCode:        string
}

// ══════════════════════════════════════════════════════════════
//  驳回选项（PendingTaskDto / NodeConfigDetail 共用）
// ══════════════════════════════════════════════════════════════

export interface RejectOption {
  rejectCode:   string
  label:        string
  description?: string
}

// ══════════════════════════════════════════════════════════════
//  待办任务
//  对齐 PendingTaskDto.cs（Phase 10 修正版）
// ══════════════════════════════════════════════════════════════

export interface PendingTaskDto {
  /** Flowable Task ID，并行场景 complete 时传入 */
  taskId:       string

  /** 任务名称（来自 BPMN userTask name） */
  taskName:     string

  /** 业务 ID */
  businessId:   string

  /** 业务类型 */
  businessType: string

  /**
   * 节点业务语义
   * 示例：GROUP_LEADER_CONFIRM / INSPECTION_OFFICE_REVIEW
   */
  nodeSemantic: string

  /**
   * 原始页面配置编码
   * 对 iframe 流程：为业务系统 URL，流程中心拼好 pageUrl
   * 对组件化流程：为组件编码（当前架构已废弃组件化模式）
   */
  pageCode:     string

  /**
   * iframe 直用的完整 URL
   * 后端已追加 businessId / taskId / businessType / nodeId 等上下文参数
   * null 表示 PageCode 不是 URL（当前架构下不应出现此情况）
   */
  pageUrl:      string | null

  /** 是否已过不可撤回节点（收敛点后不允许撤回） */
  isAfterConvergencePoint: boolean

  /** 任务创建时间（UTC ISO 字符串） */
  createTime:   string

  /** 任务优先级（来自 Flowable） */
  priority:     number

  /** 当前节点是否可以驳回 */
  canReject:    boolean

  /** 驳回配置列表 */
  rejectOptions: RejectOption[]

  // requiredSlots 已移除 — 后端注释"前端可以忽略"，全自动架构不需要
}

export interface GetPendingTasksParams {
  employeeId?:  string
  businessType?: string
  pageIndex?:   number
  pageSize?:    number
}

// ══════════════════════════════════════════════════════════════
//  完成任务
// ══════════════════════════════════════════════════════════════

export interface CompleteTaskRequest {
  /** 业务 ID */
  businessId:   string

  /**
   * Flowable Task ID
   * 并行节点时必传，用于精确指定完成哪个任务
   * 串行节点可不传（后端自动定位）
   */
  taskId?:      string

  /** 1=通过  2=驳回 */
  action:       1 | 2

  /** 审批意见（选填） */
  comment?:     string

  /**
   * 下一节点处理人选择
   * 全自动架构：传空数组 []（人员由 assigneeContract 后端注入）
   * 保留字段兼容业务系统仍有手动选人的边缘场景
   */
  nextSlotSelections?: Array<{ slotKey: string; users: string[] }>

  /**
   * 业务变量
   * 全自动架构：传空对象 {} 或不传
   */
  businessVariables?:  Record<string, any>

  /** action=2 时必传：驳回配置编码 */
  rejectCode?:         string

  /** action=2 时必传：驳回原因 */
  rejectReason?:       string
}

// ══════════════════════════════════════════════════════════════
//  转派任务
// ══════════════════════════════════════════════════════════════

export interface ReassignTaskRequest {
  businessId:   string
  /** 并行节点时必传 */
  taskId?:      string
  /** 新处理人工号列表（转派场景通常只有一人） */
  newAssignees: string[]
  reason?:      string
  /** 操作人工号，由前端注入 adminInfo.userid */
  operatorId?:  string
}

// ══════════════════════════════════════════════════════════════
//  启动流程（业务系统调用，流程中心前端一般不直接发起）
// ══════════════════════════════════════════════════════════════

export interface StartProcessCallback {
  url:             string
  timeoutSeconds?: number
}

export interface StartProcessRequest {
  businessType:       string
  businessId:         string
  businessVariables?: Record<string, any>
  callback:           StartProcessCallback
  // assigneeContract / loopAssignments 等由业务系统后端传入，前端不构造
}

export interface StartProcessResponse {
  processInstanceId: string
  businessId:        string
  firstTaskId:       string
  firstNodeSemantic: string
  firstPageCode:     string
}

// ══════════════════════════════════════════════════════════════
//  终止流程
// ══════════════════════════════════════════════════════════════

export interface TerminateProcessRequest {
  businessId: string
  reason:     string
}

// ══════════════════════════════════════════════════════════════
//  流程进度（ProcessProgressDto.cs）
// ══════════════════════════════════════════════════════════════

/** 当前活动节点（实时来自 Flowable） */
export interface CurrentNodeDto {
  /** Flowable Task ID */
  taskId:        string
  /** taskDefinitionKey */
  nodeId:        string
  nodeName:      string
  nodeSemantic:  string
  pageCode:      string
  /** 已认领则有值，候选人模式为 null */
  assignee:      string | null
  candidateUsers: string[]
  createTime:    string
  recommendedUsers:      Record<string, string[]>
  restrictToRecommended: Record<string, boolean>
}

/** 选人快照（AuditRecordDto.SlotSelections 元素，对齐 SlotSelectionRecordDto.cs） */
export interface SlotSelectionRecordDto {
  slotKey: string
  label:   string
  users:   string[]
}

/**
 * 审批历史记录（来自 ES ProcessAuditRecord）
 * 对齐 AuditRecordDto.cs
 */
export interface AuditRecordDto {
  /** taskDefinitionKey */
  taskDefinitionKey: string

  /** 节点语义 */
  nodeSemantic:      string

  /**
   * 节点页面编码快照
   * 写入时固化，不随后续部署变更。
   * 前端用此字段构造历史节点只读 iframe URL：
   *   pageCode + ?businessId=xxx&taskDefinitionKey=xxx&mode=readonly
   */
  pageCode:          string

  /** 'approve' | 'reject' */
  action:            string

  /** 操作人工号 */
  operatorId:        string

  /** 审批意见 */
  comment:           string | null

  /** 驳回原因（action=reject 时有值） */
  rejectReason:      string | null

  /** 驳回配置编码 */
  rejectCode:        string | null

  /** 驳回目标节点 Key */
  rejectTargetNodeKey: string | null

  /** 操作时间（UTC ISO） */
  operatedAt:        string

  /** 本次选人快照 */
  slotSelections:    SlotSelectionRecordDto[]

  /** 是否有超出推荐范围的选人，null=不适用 */
  hasOutOfRecommendedRange: boolean | null

  /** 完成任务时推荐人快照（按 slotKey） */
  recommendedUsersSnapshot:      Record<string, string[]>

  /** 完成任务时限制推荐范围快照（按 slotKey） */
  restrictToRecommendedSnapshot: Record<string, boolean>
}

export interface ProcessProgressDto {
  businessId:           string
  processInstanceId:    string
  processDefinitionKey: string
  businessType:         string
  /** running | completed | rejected | terminated | callback_failed */
  status:               string
  createdBy:            string
  createdTime:          string
  completedTime:        string | null
  currentNodes:         CurrentNodeDto[]
  /** 按操作时间升序 */
  auditHistory:         AuditRecordDto[]
}

// ══════════════════════════════════════════════════════════════
//  流程图渲染（ProcessFlowRenderDto.cs）
// ══════════════════════════════════════════════════════════════

/**
 * 流程图节点
 * state: completed | active | rejected | pending | skipped
 */
export interface FlowNodeDto {
  id:             string
  label:          string
  /** userTask | serviceTask | startEvent | endEvent | parallelGateway | exclusiveGateway | inclusiveGateway */
  nodeType:       string
  /** completed | active | rejected | pending | skipped */
  state:          string
  assignees:      string[]
  completedAt:    string | null
  isMultiInstance: boolean
  x:              number | null
  y:              number | null
  width:          number | null
  height:         number | null
}

/**
 * 流程图边
 * state: walked | active | pending | rejected
 */
export interface FlowEdgeDto {
  id:     string
  source: string
  target: string
  /** walked | active | pending | rejected */
  state:  string
  /** 排他网关分支标签 */
  label:  string | null
}

/** 当前活动任务渲染（实时来自 Flowable） */
export interface ActiveTaskRenderDto {
  taskId:         string
  nodeId:         string
  nodeName:       string
  assignee:       string
  candidateUsers: string[]
  createdAt:      string
  waitingSeconds: number
}

/** 已完成审批记录渲染（来自 ES） */
export interface CompletedRecordRenderDto {
  taskId:          string
  nodeId:          string
  nodeName:        string
  operatorId:      string
  startTime:       string
  endTime:         string
  durationSeconds: number
  /** approved | rejected_terminate | rejected_return */
  outcome:         string
  rejectReason:    string | null
  comment:         string | null
  round:           number
}

/** 驳回轨迹渲染 */
export interface RejectHistoryRenderDto {
  rejectId:       string
  rejectBy:       string
  rejectNodeId:   string
  rejectNodeName: string
  targetNodeId:   string
  targetNodeName: string
  rejectReason:   string
  rejectTime:     string
}

/** 流程图渲染完整 DTO */
export interface FlowRenderDto {
  businessId:           string
  processInstanceId:    string
  processDefinitionKey: string
  businessType:         string
  /** running | completed | rejected | terminated | callback_failed */
  status:               string
  createdBy:            string
  createdTime:          string
  completedTime:        string | null
  /** 是否有驳回历史（控制前端"驳回轨迹"区域显示） */
  hasRejectHistory:     boolean
  /** 已走过节点 ID 列表（用于边染色） */
  walkedNodeIds:        string[]
  nodes:                FlowNodeDto[]
  edges:                FlowEdgeDto[]
  /** 当前活动任务 */
  activeTasks:          ActiveTaskRenderDto[]
  /** 已完成审批记录 */
  completedRecords:     CompletedRecordRenderDto[]
  /** 驳回轨迹列表 */
  rejectHistory:        RejectHistoryRenderDto[]
}

// ══════════════════════════════════════════════════════════════
//  流程状态（轻量查询）
// ══════════════════════════════════════════════════════════════

export interface ProcessStatusDto {
  businessId:        string
  processInstanceId: string
  status:            string
}

// ══════════════════════════════════════════════════════════════
//  流程列表（我的申请）
// ══════════════════════════════════════════════════════════════

export interface ProcessListItem {
  businessId:        string
  businessType:      string
  processInstanceId: string
  status:            string
  createdBy:         string
  createdTime:       string
  completedTime:     string | null
  currentNodeNames:  string[]
}

export interface GetProcessListParams {
  businessType?: string
  status?:       string
  pageIndex?:    number
  pageSize?:     number
}

// ══════════════════════════════════════════════════════════════
//  API 函数
// ══════════════════════════════════════════════════════════════

// ── BPMN 部署 ─────────────────────────────────────────────────

/** POST /api/flowable/bpmn/deploy */
export function deployBpmn(formData: FormData) {
  return createProcessRequest<DeployBpmnResponse>(
    {
      url:     '/api/flowable/bpmn/deploy',
      method:  'POST',
      data:    formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    },
    { showSuccessMessage: true }
  )
}

/** GET /api/flowable/bpmn/{processDefinitionKey}/nodes */
export function getBpmnNodes(processDefinitionKey: string) {
  return createProcessRequest<NodeConfigDetail[]>({
    url:    `/api/flowable/bpmn/${processDefinitionKey}/nodes`,
    method: 'GET',
  })
}

// ── 流程生命周期 ──────────────────────────────────────────────

/** POST /api/processes/start */
export function startProcess(data: StartProcessRequest) {
  return createProcessRequest<StartProcessResponse>(
    { url: '/api/processes/start', method: 'POST', data },
    { loading: true }
  )
}

/** POST /api/processes/terminate */
export function terminateProcess(data: TerminateProcessRequest) {
  return createProcessRequest<null>(
    { url: '/api/processes/terminate', method: 'POST', data },
    { showSuccessMessage: true }
  )
}

// ── 任务操作 ──────────────────────────────────────────────────

/** GET /api/tasks/pending */
export function getPendingTasks(params: GetPendingTasksParams = {}) {
  return createProcessRequest<PageResult<PendingTaskDto>>({
    url:    '/api/tasks/pending',
    method: 'GET',
    params,
  })
}

/**
 * POST /api/tasks/complete
 * action=1 通过，action=2 驳回
 * 全自动架构：nextSlotSelections=[] / businessVariables={}
 */
export function completeTask(data: CompleteTaskRequest) {
  return createProcessRequest<null>(
    { url: '/api/tasks/complete', method: 'POST', data },
    { loading: true, showSuccessMessage: true }
  )
}

/** POST /api/tasks/reassign */
export function reassignTask(data: ReassignTaskRequest) {
  return createProcessRequest<null>(
    { url: '/api/tasks/reassign', method: 'POST', data },
    { showSuccessMessage: true }
  )
}

// ── 流程查询 ──────────────────────────────────────────────────

/** GET /api/processes/{businessId}/progress */
export function getProcessProgress(businessId: string) {
  return createProcessRequest<ProcessProgressDto>({
    url:    `/api/processes/${businessId}/progress`,
    method: 'GET',
  })
}

/** GET /api/processes/{businessId}/flow-render */
export function getFlowRender(businessId: string) {
  return createProcessRequest<FlowRenderDto>({
    url:    `/api/processes/${businessId}/flow-render`,
    method: 'GET',
  })
}

/**
 * GET /api/processes/{businessId}/audit-history
 * 返回完整 AuditRecordDto[]（包含 pageCode 快照，供 ApplicationViewDrawer 构造历史 iframe URL）
 */
export function getAuditHistory(businessId: string) {
  return createProcessRequest<AuditRecordDto[]>({
    url:    `/api/processes/${businessId}/audit-history`,
    method: 'GET',
  })
}

/** GET /api/processes/{businessId}/status */
export function getProcessStatus(businessId: string) {
  return createProcessRequest<ProcessStatusDto>({
    url:    `/api/processes/${businessId}/status`,
    method: 'GET',
  })
}

/** GET /api/processes */
export function getProcessList(params: GetProcessListParams = {}) {
  return createProcessRequest<PageResult<ProcessListItem>>({
    url:    '/api/processes',
    method: 'GET',
    params,
  })
}
