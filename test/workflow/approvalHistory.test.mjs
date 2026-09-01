import test from 'node:test'
import assert from 'node:assert/strict'

import { buildApplicationHistoryNodes, buildAuditHistoryMap, getApprovalRecordOperator } from '../../src/workflow-shared/approvalHistory.js'

test('审批记录始终显示该任务自己的 operatorId', () => {
    const record = {
        taskId: 'task-second-round',
        operatorId: 'EMP_SECOND',
        assignee: 'EMP_FIRST',
    }

    assert.equal(getApprovalRecordOperator(record), 'EMP_SECOND')
})

test('同一节点驳回重走后按 taskId 保留各轮历史', () => {
    const history = [
        {
            taskId: 'task-a-1',
            taskDefinitionKey: 'node-a',
            operatorId: 'EMP_A1',
            operatedAt: '2026-08-31T01:00:00Z',
            action: 'approve',
            slotSelections: [],
        },
        {
            taskId: 'task-b-1',
            taskDefinitionKey: 'node-b',
            operatorId: 'EMP_B1',
            operatedAt: '2026-08-31T02:00:00Z',
            action: 'reject',
            slotSelections: [],
        },
        {
            taskId: 'task-a-2',
            taskDefinitionKey: 'node-a',
            operatorId: 'EMP_A2',
            operatedAt: '2026-08-31T03:00:00Z',
            action: 'approve',
            slotSelections: [],
        },
    ]

    const nodes = buildApplicationHistoryNodes(history)
    const map = buildAuditHistoryMap(history)

    assert.deepEqual(
        nodes.map((node) => ({
            nodeKey: node.nodeKey,
            nodeId: node.nodeId,
            operator: node.operator,
            round: node.round,
        })),
        [
            { nodeKey: 'task-a-1', nodeId: 'node-a', operator: 'EMP_A1', round: 1 },
            { nodeKey: 'task-b-1', nodeId: 'node-b', operator: 'EMP_B1', round: 1 },
            { nodeKey: 'task-a-2', nodeId: 'node-a', operator: 'EMP_A2', round: 2 },
        ]
    )
    assert.equal(map['task-a-1'].operatorId, 'EMP_A1')
    assert.equal(map['task-a-2'].operatorId, 'EMP_A2')
})
