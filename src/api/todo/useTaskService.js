import { getBpmnNodes } from '/@/api/workflow/processApi'
import { useBriefingFeedbackService } from './service/useBriefingFeedbackService.js'

const SERVICE_REGISTRY = {
  'InspectionBriefing/BriefingFeedbackForm': useBriefingFeedbackService,
}

const FALLBACK_REGISTRY = {
  // inspection_plan: useXxxService,
}

const _nodeConfigCache = new Map()

function useDefaultService() {
  return {
    async fetchTaskData(row) {
      return row.extraData ?? {}
    },
    async fetchViewData() {
      return {}
    },
  }
}

function resolveService(row) {
  const pageCode = typeof row?.pageCode === 'string' ? row.pageCode : null

  if (pageCode && SERVICE_REGISTRY[pageCode]) {
    return SERVICE_REGISTRY[pageCode]()
  }

  if (row?.businessType && FALLBACK_REGISTRY[row.businessType]) {
    return FALLBACK_REGISTRY[row.businessType]()
  }

  return useDefaultService()
}

export async function fetchComponentPath(row) {
  const { processDefinitionKey, taskDefinitionKey, pageCode } = row ?? {}

  if (typeof pageCode === 'string' && pageCode) return pageCode
  if (!processDefinitionKey) return null

  try {
    let nodes = _nodeConfigCache.get(processDefinitionKey)
    if (!nodes) {
      nodes = await getBpmnNodes(processDefinitionKey)
      _nodeConfigCache.set(processDefinitionKey, nodes ?? [])
    }

    const matched = (nodes ?? []).find(node => node.taskDefinitionKey === taskDefinitionKey)
    return matched?.pageCode ?? null
  } catch {
    return null
  }
}

export async function fetchTaskData(row) {
  const service = resolveService(row)
  return service.fetchTaskData(row)
}

export async function fetchNodeSnapshot(row, nodeKey, nodeName) {
  const service = resolveService(row)
  return service.fetchViewData(nodeKey, nodeName, row?.businessId)
}

export { resolveService }
export const fetchTaskExtraData = fetchTaskData
