/**
 * processApi.ts
 * 流程中心所有接口封装
 *
 * 接口来源：process.md（V1.2 最终定稿）
 */

import { createProcessRequest } from './processAxios'

// ══════════════════════════════════════════════════════════════
//  DTO 类型定义（与后端 C# DTO 字段名一一对应）
// ══════════════════════════════════════════════════════════════

export interface PageResult<T> {
  items: T[]
  total: number
  pageIndex: number
  pageSize: number
}

export interface DeployNodeSummary {
  taskDefinitionKey: string
  nodeSemantic: string
  pageCode: string
  roleKey: string
  assigneeMode: string
  callbackUrl: string
  slotCount: number
}

export interface DeployBpmnResponse {
  deploymentId: string
  processDefinitionKey: string
  nodes: DeployNodeSummary[]
}

export interface NodeConfigDetail {
  taskDefinitionKey: string
  nodeSemantic: string
  pageCode: string
  roleKey: string
  assigneeMode: string
  callbackUrl: string
  canReject: boolean
  rejectOptions: RejectOption[]
  isRejectTarget: boolean
  rejectCode: string
  slots: SlotDefinition[]
}

export interface SlotDefinition {
  slotKey: string
  label: string
  mode: string
  variableName: string
  required: boolean
  conditionalOn?: string
  restrictToRecommended: boolean
}

export interface RejectOption {
  rejectCode: string
  label: string
  description?: string
}

export interface SlotSelection {
  slotKey: string
  users: string[]
}

export interface RoleAssignment {
  roleKey: string
  users: string[]
}

export interface AssigneeContract {
  roles: RoleAssignment[]
}

export interface LoopItem {
  users: string[]
}

export interface LoopAssignment {
  loopVariable: string
  items: LoopItem[]
}

export interface StartProcessCallback {
  url: string
  timeoutSeconds?: number
}

export interface StartProcessRequest {
  businessType: string
  businessId: string
  initialSlotSelections?: SlotSelection[]
  assigneeContract?: AssigneeContract
  loopAssignments?: LoopAssignment[]
  businessVariables?: Record<string, any>
  callback: StartProcessCallback
}

export interface StartProcessResponse {
  processInstanceId: string
  businessId: string
  firstTaskId: string
  firstNodeSemantic: string
  firstPageCode: string
}

export interface TerminateProcessRequest {
  businessId: string
  reason: string
}

export interface PendingTaskDto {
  taskId: string
  taskName: string
  businessId: string
  businessType: string
  nodeSemantic: string
  pageCode: string
  canReject: boolean
  rejectOptions: RejectOption[]
  requiredSlots: SlotDefinition[]
  createTime: string
  priority?: number
}

export interface GetPendingTasksParams {
  employeeId?: string
  businessType?: string
  pageIndex?: number
  pageSize?: number
}

export interface CompleteTaskRequest {
  businessId: string
  taskId?: string
  action: 1 | 2
  comment?: string
  nextSlotSelections?: SlotSelection[]
  businessVariables?: Record<string, any>
  rejectCode?: string
  rejectReason?: string
}

export interface ReassignTaskRequest {
  businessId: string
  taskId?: string
  newAssignees: string[]
  reason?: string
  operatorId?: string
}

export interface CurrentNodeDto {
  taskId: string
  nodeId: string
  nodeName: string
  nodeSemantic: string
  pageCode: string
  assignee: string
  candidateUsers: string[]
  createTime: string
  recommendedUsers: Record<string, string[]>
  restrictToRecommended: Record<string, boolean>
}

export interface AuditRecordDto {
  taskDefinitionKey: string
  nodeSemantic: string
  action: string
  operatorId: string
  comment: string | null
  rejectReason: string | null
  operatedAt: string
  slotSelections: SlotSelection[]
}

export interface ProcessProgressDto {
  businessId: string
  processInstanceId: string
  processDefinitionKey: string
  status: string
  createdBy: string
  createdTime: string
  completedTime: string | null
  currentNodes: CurrentNodeDto[]
  auditHistory: AuditRecordDto[]
}

export interface FlowNodeDto {
  id: string
  name: string
  type: string
  x: number
  y: number
  width: number
  height: number
}

export interface FlowEdgeDto {
  id: string
  sourceId: string
  targetId: string
}

export interface ActiveTaskRender {
  taskId: string
  nodeId: string
  assignee: string
  status: string
}

export interface CompletedRecordRender {
  nodeId: string
  operatorId: string
  outcome: string
  comment: string | null
  round: number
}

export interface FlowRenderDto {
  businessId: string
  bpmnXml: string | null
  nodes: FlowNodeDto[]
  edges: FlowEdgeDto[]
  activeTaskRenders: ActiveTaskRender[]
  completedRecords: CompletedRecordRender[]
  createdBy?: string
  createdTime?: string
  status?: string
}

export interface ProcessStatusDto {
  businessId: string
  processInstanceId: string
  status: string
}

export interface ProcessListItem {
  businessId: string
  businessType: string
  processInstanceId: string
  status: string
  createdBy: string
  createdTime: string
  completedTime: string | null
  currentNodeNames: string[]
}

export interface GetProcessListParams {
  businessType?: string
  status?: string
  pageIndex?: number
  pageSize?: number
}

export interface AuditHistoryItem extends AuditRecordDto {
  taskId: string
  nodeName: string
  endTime: string
  durationSeconds: number
  round: number
  outcome: string
  rejectReason: string | null
  assignee: string
}

// ══════════════════════════════════════════════════════════════
//  API 函数
// ══════════════════════════════════════════════════════════════

export function deployBpmn(formData: FormData) {
  return createProcessRequest<DeployBpmnResponse>(
    {
      url: '/api/flowable/bpmn/deploy',
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    },
    { showSuccessMessage: true }
  )
}

export function getBpmnNodes(processDefinitionKey: string) {
  return createProcessRequest<NodeConfigDetail[]>({
    url: `/api/flowable/bpmn/${processDefinitionKey}/nodes`,
    method: 'GET',
  })
}

export function startProcess(data: StartProcessRequest) {
  return createProcessRequest<StartProcessResponse>(
    {
      url: '/api/processes/start',
      method: 'POST',
      data,
    },
    { loading: true, showSuccessMessage: false }
  )
}

export function terminateProcess(data: TerminateProcessRequest) {
  return createProcessRequest<null>(
    {
      url: '/api/processes/terminate',
      method: 'POST',
      data,
    },
    { showSuccessMessage: true }
  )
}

export function getPendingTasks(params: GetPendingTasksParams = {}) {
  return createProcessRequest<PageResult<PendingTaskDto>>({
    url: '/api/tasks/pending',
    method: 'GET',
    params,
  })
}

export function completeTask(data: CompleteTaskRequest) {
  return createProcessRequest<null>(
    {
      url: '/api/tasks/complete',
      method: 'POST',
      data,
    },
    { loading: true, showSuccessMessage: true }
  )
}

export function reassignTask(data: ReassignTaskRequest) {
  return createProcessRequest<null>(
    {
      url: '/api/tasks/reassign',
      method: 'POST',
      data,
    },
    { showSuccessMessage: true }
  )
}

export function getProcessProgress(businessId: string) {
  return createProcessRequest<ProcessProgressDto>({
    url: `/api/processes/${businessId}/progress`,
    method: 'GET',
  })
}

export function getFlowRender(businessId: string) {
  return createProcessRequest<FlowRenderDto>({
    url: `/api/processes/${businessId}/flow-render`,
    method: 'GET',
  })
}

export function getAuditHistory(businessId: string) {
  return createProcessRequest<AuditHistoryItem[]>({
    url: `/api/processes/${businessId}/audit-history`,
    method: 'GET',
  })
}

export function getProcessStatus(businessId: string) {
  return createProcessRequest<ProcessStatusDto>({
    url: `/api/processes/${businessId}/status`,
    method: 'GET',
  })
}

export function getProcessList(params: GetProcessListParams = {}) {
  return createProcessRequest<PageResult<ProcessListItem>>({
    url: '/api/processes',
    method: 'GET',
    params,
  })
}
