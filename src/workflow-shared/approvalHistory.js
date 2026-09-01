export function getApprovalRecordOperator(record) {
    return record?.operatorId ?? ''
}

export function buildAuditHistoryMap(items) {
    const map = {}
    ;(items ?? []).forEach((item) => {
        if (item?.taskId) map[item.taskId] = item
    })
    return map
}

export function buildApplicationHistoryNodes(auditHistory) {
    const roundCounter = {}

    return (auditHistory ?? []).map((record) => {
        const nodeId = record.taskDefinitionKey
        roundCounter[nodeId] = (roundCounter[nodeId] ?? 0) + 1
        const round = roundCounter[nodeId]

        return {
            nodeKey: record.taskId,
            nodeId,
            nodeName: record.nodeName ?? nodeId,
            nodeSemantic: record.nodeSemantic ?? '',
            operator: getApprovalRecordOperator(record),
            completedAt: record.operatedAt ?? null,
            approveComment: record.comment ?? null,
            pageCode: record.pageCode ?? null,
            slotSelections: record.slotSelections ?? [],
            outcome: record.action === 'approve' ? 'approved' : record.action === 'reject' ? 'rejected_return' : '',
            round,
        }
    })
}
