function emptyFormData() {
  return {
    plan: null,
    objectFeedbacks: [],
  }
}

export function useBriefingFeedbackService() {
  async function fetchTaskData(row) {
    try {
      // TODO: replace with the real endpoint when available.
      // GET /api/inspection/briefing/node-form-data
      // params: { businessId, taskId }
      // response.data: { plan, objectFeedbacks[] }
      // const serverData = await getBriefingNodeFormData({
      //   businessId: row.businessId,
      //   taskId: row.taskId,
      // })
      const serverData = emptyFormData()

      return {
        ...row.extraData,
        plan: serverData.plan ?? row.extraData?.plan ?? null,
        objectFeedbacks: serverData.objectFeedbacks ?? [],
      }
    } catch {
      return row.extraData ?? {}
    }
  }

  async function fetchViewData(nodeKey, _nodeName, businessId) {
    try {
      // TODO: replace with the real endpoint when available.
      // GET /api/inspection/briefing/node-snapshot
      // params: { businessId, taskDefinitionKey }
      // response.data: { plan, objectFeedbacks[] }
      // return await getBriefingNodeSnapshot({
      //   businessId,
      //   taskDefinitionKey: nodeKey.split('__round')[0],
      // })
      void nodeKey
      void businessId
      return emptyFormData()
    } catch {
      return emptyFormData()
    }
  }

  return { fetchTaskData, fetchViewData }
}
