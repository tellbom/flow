/**
 * Maps ProcessProgressDto into ApplicationViewDrawer nodes.
 */

export function adaptProgressToNodes(progress, nodeComponentMap = {}) {
  if (!progress) return []

  const historyNodes = buildHistoryNodes(progress.auditHistory ?? [], nodeComponentMap)
  const activeNodes = buildActiveNodes(progress.currentNodes ?? [], nodeComponentMap)

  return [...historyNodes, ...activeNodes]
}

function buildHistoryNodes(auditHistory, nodeComponentMap) {
  return auditHistory.map((record) => {
    const round = record.round ?? 1
    const taskDefinitionKey = record.taskDefinitionKey ?? ''
    const nodeKey = buildNodeKey(taskDefinitionKey, round)

    return {
      nodeKey,
      nodeName: record.nodeName ?? taskDefinitionKey,
      nodeSemantic: record.nodeSemantic ?? '',
      operator: record.operatorId ?? record.assignee ?? '',
      completedAt: record.operatedAt ?? record.endTime ?? null,
      approveComment: record.comment ?? record.rejectReason ?? null,
      viewComponentPath: nodeComponentMap[taskDefinitionKey] ?? record.pageCode ?? null,
      slotSelections: normalizeSlotSelections(record.slotSelections),
      round,
      outcome: normalizeOutcome(record),
      _raw: record,
    }
  })
}

function buildActiveNodes(currentNodes, nodeComponentMap) {
  return currentNodes.map((node) => {
    const nodeId = node.nodeId ?? node.taskId ?? ''

    return {
      nodeKey: nodeId,
      nodeName: node.nodeName ?? nodeId,
      nodeSemantic: node.nodeSemantic ?? '',
      operator: node.assignee ?? '',
      completedAt: null,
      approveComment: null,
      viewComponentPath: nodeComponentMap[nodeId] ?? node.pageCode ?? null,
      slotSelections: [],
      round: 1,
      outcome: '',
      _raw: node,
    }
  })
}

function buildNodeKey(taskDefinitionKey, round) {
  return round > 1 ? `${taskDefinitionKey}__round${round}` : taskDefinitionKey
}

function normalizeOutcome(record) {
  if (record.outcome) return record.outcome
  if (record.action === 'approve') return 'approved'
  if (record.action === 'reject') return 'rejected_terminate'
  return record.action ?? ''
}

function normalizeSlotSelections(slotSelections) {
  if (!Array.isArray(slotSelections)) return []

  return slotSelections.map((slot) => ({
    slotKey: slot.slotKey ?? '',
    label: slot.label ?? slot.slotKey ?? '',
    users: Array.isArray(slot.users) ? slot.users : [],
  }))
}
