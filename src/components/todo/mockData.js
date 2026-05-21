/**
 * mockData.js — 重构测试用精简 Mock
 *
 * 覆盖场景：人员选调流程三条待办
 *   行1: ut01 一把手处理（直接填写路径，当前进行中）
 *   行2: ut02 下属填写（needFeedback=true 路径）
 *   行3: ut03 一把手审批
 *
 * 说明：
 *   - pageCode 对应 componentRegistry 中注册的组件路径
 *   - requiredSlots / canReject / rejectOptions 已按后端 B1 规范补充
 *   - flowRender 无 DI 坐标，Flowgraph 走 dagre 自动布局
 *   - 所有接口函数模拟网络延迟 200ms
 */

// ────────────────────────────────────────────────────────────────
//  静态枚举映射
// ────────────────────────────────────────────────────────────────

export const businessTypeMap = {
  personnel_selection_collection: { label: '人员选调', color: 'danger' },
}

export const priorityMap = {
  50: { label: '普通', type: ''        },
  75: { label: '高',   type: 'warning' },
  99: { label: '紧急', type: 'danger'  },
}

// ────────────────────────────────────────────────────────────────
//  组织架构 & 人员（ContactSelector 所需）
// ────────────────────────────────────────────────────────────────

export const mockOrgList = [
  { id: 'org_001', name: '局办公室',       parentId: null },
  { id: 'org_002', name: '巡察监督管理局', parentId: null },
]

export const mockUserList = [
  { id: 'u_001', name: '王局长',   workNo: 'EMP001', position: '局长',     orgId: 'org_001' },
  { id: 'u_002', name: '陈副局长', workNo: 'EMP002', position: '副局长',   orgId: 'org_001' },
  { id: 'u_003', name: '李主任',   workNo: 'EMP003', position: '主任',     orgId: 'org_002' },
  { id: 'u_004', name: '张巡察',   workNo: 'EMP004', position: '巡察专员', orgId: 'org_002' },
]

// ────────────────────────────────────────────────────────────────
//  待办任务列表（PendingTaskDto 结构）
// ────────────────────────────────────────────────────────────────

const PENDING_TASKS = [
  {
    // 行1：一把手处理节点（有条件 Slot，Drawer 需渲染 needFeedback 变量选择区）
    taskId:       'task-ut01-001',
    taskName:     '相关部门一把手处理',
    businessId:   'BIZ-SELECT-001',
    businessType: 'personnel_selection_collection',
    nodeSemantic: 'DEPT_HEAD_HANDLE',
    pageCode:     'SelectionCollection/DeptHeadHandleForm',
    priority:     50,
    createTime:   '2026-04-15T09:00:00Z',
    isAfterConvergencePoint: false,
    requiredSlots: [
      {
        slotKey:       'feedback_person',
        label:         '下属反馈人',
        mode:          'single',
        variableName:  'feedbackPersonAssignee',
        required:      false,
        conditionalOn: 'needFeedback==true',
      },
      {
        slotKey:       'inspection_office_verifier_path_a',
        label:         '巡察办核实人（自处理路径）',
        mode:          'single',
        variableName:  'inspectionOfficeAssignee',
        required:      false,
        conditionalOn: 'needFeedback==false',
      },
    ],
    canReject: true,
    rejectOptions: [
      {
        rejectCode:  'TO_STARTER',
        label:       '退回发起人重新提交',
        description: '退回至发起人，重新填写表单数据',
      },
    ],
  },
  {
    // 行2：下属填写节点（needFeedback=true 路径，无条件 Slot）
    taskId:       'task-ut02-001',
    taskName:     '下属人员填写',
    businessId:   'BIZ-SELECT-002',
    businessType: 'personnel_selection_collection',
    nodeSemantic: 'ASSIGNEE_FEEDBACK',
    pageCode:     'SelectionCollection/AssigneeFeedbackForm',
    priority:     75,
    createTime:   '2026-04-15T10:30:00Z',
    isAfterConvergencePoint: false,
    requiredSlots: [
      {
        slotKey:       'dept_head_approver',
        label:         '一把手审批人',
        mode:          'single',
        variableName:  'deptHeadAssignee',
        required:      true,
        conditionalOn: null,
      },
    ],
    canReject: true,
    rejectOptions: [
      {
        rejectCode:  'TO_STARTER',
        label:       '退回发起人重新提交',
        description: '退回至发起人，重新发起本轮流程',
      },
    ],
  },
  {
    // 行3：一把手审批节点（无条件 Slot）
    taskId:       'task-ut03-001',
    taskName:     '一把手审批',
    businessId:   'BIZ-SELECT-003',
    businessType: 'personnel_selection_collection',
    nodeSemantic: 'DEPT_HEAD_APPROVE',
    pageCode:     'SelectionCollection/DeptHeadApproveForm',
    priority:     99,
    createTime:   '2026-04-15T11:00:00Z',
    isAfterConvergencePoint: false,
    requiredSlots: [
      {
        slotKey:       'inspection_office_verifier_path_b',
        label:         '巡察办核实人（指派路径）',
        mode:          'single',
        variableName:  'inspectionOfficeAssignee',
        required:      true,
        conditionalOn: null,
      },
    ],
    canReject: true,
    rejectOptions: [
      {
        rejectCode:  'TO_STARTER',
        label:       '退回发起人重新提交',
        description: '退回至发起人，重新发起本轮流程',
      },
    ],
  },
]

// ────────────────────────────────────────────────────────────────
//  流程图渲染数据（ProcessFlowRenderDto 结构，无 DI 坐标）
//  x/y 全为 null → Flowgraph 走 dagre 自动布局
// ────────────────────────────────────────────────────────────────

const ALL_NODES_DEF = [
  { id: 'start_event',                   nodeType: 'startEvent',        label: '开始' },
  { id: 'ut00_starter_submit',            nodeType: 'userTask',          label: '发起人提交' },
  { id: 'ut01_dept_head_handle',          nodeType: 'userTask',          label: '一把手处理' },
  { id: 'gateway_feedback',              nodeType: 'exclusiveGateway',  label: '' },
  { id: 'ut02_assignee_feedback',         nodeType: 'userTask',          label: '下属填写' },
  { id: 'ut04_inspection_office_verify',  nodeType: 'userTask',          label: '巡察办核实' },
  { id: 'ut03_dept_head_approve',         nodeType: 'userTask',          label: '一把手审批' },
  { id: 'end_event',                     nodeType: 'endEvent',          label: '结束' },
]

const ALL_EDGES_DEF = [
  { id: 'e01', source: 'start_event',                  target: 'ut00_starter_submit',           label: '' },
  { id: 'e02', source: 'ut00_starter_submit',           target: 'ut01_dept_head_handle',          label: '' },
  { id: 'e03', source: 'ut01_dept_head_handle',         target: 'gateway_feedback',               label: '' },
  { id: 'e04', source: 'gateway_feedback',             target: 'ut02_assignee_feedback',          label: '需要下属填写' },
  { id: 'e05', source: 'gateway_feedback',             target: 'ut04_inspection_office_verify',   label: '直接核实' },
  { id: 'e06', source: 'ut02_assignee_feedback',        target: 'ut04_inspection_office_verify',   label: '' },
  { id: 'e07', source: 'ut04_inspection_office_verify', target: 'ut03_dept_head_approve',          label: '' },
  { id: 'e08', source: 'ut03_dept_head_approve',        target: 'end_event',                      label: '' },
]

// 已完成节点（发起人提交节点始终为已完成）
const COMPLETED_NODE_IDS = new Set(['start_event', 'ut00_starter_submit'])

function buildFlowRender(businessId) {
  const activeNodeMap = {
    'BIZ-SELECT-001': 'ut01_dept_head_handle',
    'BIZ-SELECT-002': 'ut02_assignee_feedback',
    'BIZ-SELECT-003': 'ut03_dept_head_approve',
  }
  const activeNodeId = activeNodeMap[businessId] ?? 'ut01_dept_head_handle'

  const nodes = ALL_NODES_DEF.map(n => ({
    ...n,
    x: null, y: null, width: null, height: null,
    assignees:       [],
    completedAt:     COMPLETED_NODE_IDS.has(n.id) ? '2026-04-15T08:30:00Z' : null,
    isMultiInstance: false,
    state: COMPLETED_NODE_IDS.has(n.id)
      ? 'completed'
      : n.id === activeNodeId
        ? 'active'
        : 'pending',
  }))

  const edges = ALL_EDGES_DEF.map(e => ({
    ...e,
    state: COMPLETED_NODE_IDS.has(e.source) && COMPLETED_NODE_IDS.has(e.target)
      ? 'walked'
      : e.source === 'ut00_starter_submit' && e.target === activeNodeId
        ? 'active'
        : 'pending',
  }))

  return {
    businessId,
    processInstanceId:    `pi-${businessId}`,
    processDefinitionKey: 'personnel_selection_collection',
    businessType:         'personnel_selection_collection',
    status:               'running',
    createdBy:            'EMP_STARTER_01',
    createdTime:          '2026-04-15T08:00:00Z',
    completedTime:        null,
    hasRejectHistory:     false,
    walkedNodeIds:        [...COMPLETED_NODE_IDS],
    nodes,
    edges,
    activeTasks: [
      {
        taskId:         `task-active-${activeNodeId}`,
        nodeId:         activeNodeId,
        nodeName:       ALL_NODES_DEF.find(n => n.id === activeNodeId)?.label ?? '',
        assignee:       'EMP001',
        candidateUsers: [],
        createdAt:      '2026-04-15T09:00:00Z',
        waitingSeconds: 3600,
      },
    ],
    completedRecords: [
      {
        taskId:          'task-ut00-done',
        nodeId:          'ut00_starter_submit',
        nodeName:        '发起人提交',
        operatorId:      'EMP_STARTER_01',
        startTime:       '2026-04-15T08:00:00Z',
        endTime:         '2026-04-15T08:30:00Z',
        durationSeconds: 1800,
        outcome:         'approved',
        rejectReason:    null,
        comment:         '选调信息已填写，请审批',
        round:           1,
      },
    ],
    rejectHistory: [],
  }
}

// ────────────────────────────────────────────────────────────────
//  Mock 接口函数（统一 200ms 延迟）
// ────────────────────────────────────────────────────────────────

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

export async function apiGetTodoList(params = {}) {
  await delay()
  let list = [...PENDING_TASKS]
  if (params.businessType) {
    list = list.filter(t => t.businessType === params.businessType)
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(t =>
      t.taskName.toLowerCase().includes(kw) ||
      t.businessId.toLowerCase().includes(kw)
    )
  }
  return { items: list, total: list.length, pageIndex: 1, pageSize: 20 }
}

export async function apiGetFlowRender(businessId) {
  await delay()
  // return buildFlowRender(businessId)
  // 当前测试阶段：所有 businessId 都返回同一份带驳回历史的流程进度
  return {
    ...FLOW_RENDER_MOCK,
    businessId,
    processInstanceId: `pi-${businessId}`,
  }
}

export async function apiGetApplicationList(params = {}) {
  await delay()
  const list = [
    {
      processInstanceId:    'pi-BIZ-SELECT-001',
      businessId:           'BIZ-SELECT-001',
      businessType:         'personnel_selection_collection',
      processDefinitionKey: 'personnel_selection_collection',
      status:               'running',
      createdBy:            'EMP_STARTER_01',
      createdTime:          '2026-04-15T08:00:00Z',
      completedTime:        null,
      currentNodeNames:     ['一把手处理'],
    },
  ]
  return { items: list, total: list.length, pageIndex: 1, pageSize: 20 }
}

export async function apiTerminateProcess(payload) {
  await delay()
  // payload: { businessId, reason }
  return { success: true }
}

export async function apiGetApplicationDetail(businessId) {
  await delay()
  return {
    nodes: [
      {
        nodeKey:           'ut00_starter_submit',
        nodeName:          '发起人提交',
        viewComponentPath: 'SelectionCollection/StarterSubmitForm',
        nodeSemantic:      'STARTER_SUBMIT',
        operator:          'EMP_STARTER_01',
        completedAt:       '2026-04-15 08:30',
        approveComment:    '选调信息已填写，请审批',
      },
      {
        nodeKey:           'ut01_dept_head_handle',
        nodeName:          '一把手处理',
        viewComponentPath: 'SelectionCollection/DeptHeadHandleForm',
        nodeSemantic:      'DEPT_HEAD_HANDLE',
        operator:          'EMP001',
        completedAt:       '2026-04-15 10:20',
        approveComment:    '已推荐人员，请审批',
      },
      {
        nodeKey:           'ut03_dept_head_approve',
        nodeName:          '一把手审批',
        viewComponentPath: 'SelectionCollection/DeptHeadApproveForm',
        nodeSemantic:      'DEPT_HEAD_APPROVE',
        operator:          null,
        completedAt:       null,
        approveComment:    null,
      },
    ],
  }
}

// ────────────────────────────────────────────────────────────────
//  流程进度渲染数据（统一返回同一份，专门测试驳回场景）
//  所有待办点击后都展示这份流程进度
// ────────────────────────────────────────────────────────────────

const FLOW_RENDER_MOCK = {
  businessId: 'TEST_REJECT_001',
  processInstanceId: 'pi-test-reject-001',
  processDefinitionKey: 'personnel_selection_collection',
  businessType: 'personnel_selection_collection',
  status: 'running',
  createdBy: 'EMP_STARTER_01',
  createdTime: '2026-04-13T13:12:07.3197629Z',
  completedTime: null,
  hasRejectHistory: true,

  // 这里可以先不依赖 walkedNodeIds 着色，保持空数组即可
  walkedNodeIds: [],

  // 不写 DI 坐标，让 Flowgraph 自动布局
  nodes: [
    {
      id: 'ut00_starter_submit',
      nodeType: 'userTask',
      label: '发起人提交',
      x: null,
      y: null,
      width: null,
      height: null,
      assignees: [],
      completedAt: '2026-04-13T13:18:32.282Z',
      isMultiInstance: false,
      state: 'completed',
    },
    {
      id: 'ut01_dept_head_handle',
      nodeType: 'userTask',
      label: '一把手处理',
      x: null,
      y: null,
      width: null,
      height: null,
      assignees: [],
      completedAt: '2026-04-13T13:18:37.170Z',
      isMultiInstance: false,
      state: 'completed',
    },
    {
      id: 'ut02_assignee_feedback',
      nodeType: 'userTask',
      label: '下属填写',
      x: null,
      y: null,
      width: null,
      height: null,
      assignees: [],
      completedAt: '2026-04-13T13:18:43.671Z',
      isMultiInstance: false,
      state: 'completed',
    },
    {
      id: 'ut03_dept_head_approve',
      nodeType: 'userTask',
      label: '一把手审批',
      x: null,
      y: null,
      width: null,
      height: null,
      assignees: [],
      completedAt: '2026-04-13T13:19:00.000Z',
      isMultiInstance: false,
      state: 'completed',
    },
    {
      id: 'ut04_inspection_office_verify',
      nodeType: 'userTask',
      label: '巡察办核实',
      x: null,
      y: null,
      width: null,
      height: null,
      assignees: ['EMP_INSPECTION_01'],
      completedAt: null,
      isMultiInstance: false,
      state: 'active',
    },
  ],

  edges: [
    { id: 'e01', source: 'ut00_starter_submit', target: 'ut01_dept_head_handle', label: '', state: 'walked' },
    { id: 'e02', source: 'ut01_dept_head_handle', target: 'ut02_assignee_feedback', label: '', state: 'walked' },
    { id: 'e03', source: 'ut02_assignee_feedback', target: 'ut03_dept_head_approve', label: '', state: 'walked' },
    { id: 'e04', source: 'ut03_dept_head_approve', target: 'ut00_starter_submit', label: '驳回重填', state: 'walked' },
    { id: 'e05', source: 'ut00_starter_submit', target: 'ut01_dept_head_handle', label: '重新提交', state: 'walked' },
    { id: 'e06', source: 'ut01_dept_head_handle', target: 'ut02_assignee_feedback', label: '', state: 'walked' },
    { id: 'e07', source: 'ut02_assignee_feedback', target: 'ut03_dept_head_approve', label: '', state: 'walked' },
    { id: 'e08', source: 'ut03_dept_head_approve', target: 'ut04_inspection_office_verify', label: '', state: 'active' },
  ],

  activeTasks: [
    {
      taskId: 'task-ut04-active-001',
      nodeId: 'ut04_inspection_office_verify',
      nodeName: '巡察办核实',
      assignee: 'EMP_INSPECTION_01',
      candidateUsers: [],
      createdAt: '2026-04-13T13:19:06.061Z',
      waitingSeconds: 327785,
    },
  ],

  completedRecords: [
    {
      taskId: 'task-ut00-round1',
      nodeId: 'ut00_starter_submit',
      nodeName: 'STARTER_SUBMIT',
      operatorId: 'EMP_STARTER_01',
      startTime: '2026-04-13T13:17:39.254Z',
      endTime: '2026-04-13T13:18:32.282Z',
      durationSeconds: 53,
      outcome: 'approved',
      rejectReason: null,
      comment: '选调信息已填写提交',
      round: 1,
    },
    {
      taskId: 'task-ut01-round1',
      nodeId: 'ut01_dept_head_handle',
      nodeName: 'DEPT_HEAD_HANDLE',
      operatorId: 'EMP_DEPT_HEAD_01',
      startTime: '2026-04-13T13:18:32.282Z',
      endTime: '2026-04-13T13:18:37.170Z',
      durationSeconds: 4,
      outcome: 'approved',
      rejectReason: null,
      comment: '指派下属填写',
      round: 1,
    },
    {
      taskId: 'task-ut02-round1',
      nodeId: 'ut02_assignee_feedback',
      nodeName: 'ASSIGNEE_FEEDBACK',
      operatorId: 'EMP_FEEDBACK_01',
      startTime: '2026-04-13T13:18:37.171Z',
      endTime: '2026-04-13T13:18:43.671Z',
      durationSeconds: 6,
      outcome: 'approved',
      rejectReason: null,
      comment: '个人情况已如实填写',
      round: 1,
    },
    {
      taskId: 'task-ut03-round1-reject',
      nodeId: 'ut03_dept_head_approve',
      nodeName: 'DEPT_HEAD_APPROVE',
      operatorId: 'EMP_DEPT_HEAD_01',
      startTime: '2026-04-13T13:18:44.000Z',
      endTime: '2026-04-13T13:19:00.000Z',
      durationSeconds: 16,
      outcome: 'rejected_return',
      rejectReason: '下属反馈内容有误，退回发起人重新处理',
      comment: null,
      round: 1,
    },
    {
      taskId: 'task-ut00-round2',
      nodeId: 'ut00_starter_submit',
      nodeName: 'STARTER_SUBMIT',
      operatorId: 'EMP_STARTER_01',
      startTime: '2026-04-13T13:19:10.000Z',
      endTime: '2026-04-13T13:19:30.000Z',
      durationSeconds: 20,
      outcome: 'approved',
      rejectReason: null,
      comment: '选调信息重新提交',
      round: 2,
    },
    {
      taskId: 'task-ut01-round2',
      nodeId: 'ut01_dept_head_handle',
      nodeName: 'DEPT_HEAD_HANDLE',
      operatorId: 'EMP_DEPT_HEAD_01',
      startTime: '2026-04-13T13:19:31.000Z',
      endTime: '2026-04-13T13:19:40.000Z',
      durationSeconds: 9,
      outcome: 'approved',
      rejectReason: null,
      comment: '再次指派下属填写',
      round: 2,
    },
    {
      taskId: 'task-ut02-round2',
      nodeId: 'ut02_assignee_feedback',
      nodeName: 'ASSIGNEE_FEEDBACK',
      operatorId: 'EMP_FEEDBACK_01',
      startTime: '2026-04-13T13:19:41.000Z',
      endTime: '2026-04-13T13:19:55.000Z',
      durationSeconds: 14,
      outcome: 'approved',
      rejectReason: null,
      comment: '个人情况已重新填写',
      round: 2,
    },
    {
      taskId: 'task-ut03-round2-approve',
      nodeId: 'ut03_dept_head_approve',
      nodeName: 'DEPT_HEAD_APPROVE',
      operatorId: 'EMP_DEPT_HEAD_01',
      startTime: '2026-04-13T13:19:56.000Z',
      endTime: '2026-04-13T13:20:10.000Z',
      durationSeconds: 14,
      outcome: 'approved',
      rejectReason: null,
      comment: '下属反馈内容真实，审批通过',
      round: 2,
    },
  ],

  rejectHistory: [
    {
      rejectId: 'reject-001',
      rejectBy: 'EMP_DEPT_HEAD_01',
      rejectNodeId: 'ut03_dept_head_approve',
      rejectNodeName: 'ut03_dept_head_approve',
      targetNodeId: 'ut00_starter_submit',
      targetNodeName: 'ut00_starter_submit',
      rejectReason: '下属反馈内容有误，退回发起人重新处理',
      rejectTime: '2026-04-13T13:16:53.7110031Z',
    },
  ],
}

export async function apiGetNodeFormData(taskKey) {
  await delay()
  return {}
}

export async function apiReassignTask(payload) {
  await delay()
  // payload: { businessId, newAssignees: [workNo] }
  return { success: true }
}