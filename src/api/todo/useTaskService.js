/**
 * useTaskService.js
 *
 * 任务数据服务注册中心 + 调度层
 *
 * 架构职责：
 *   - MyTodo / MyApplication 只调用本层，完全不知道具体业务 API
 *   - 每个业务流程在独立的 useXxxService.js 里实现自己的逻辑
 *   - 注册表以 viewComponentPath（或 businessType）为 key
 *
 * 数据流：
 *   MyTodo.openApproveDrawer(row)
 *     → resolveService(row)        // 按优先级查找对应 service
 *     → service.fetchTaskData(row) // 调业务 API，组装 extraData
 *     → 返回完整 taskInfo，赋给 currentTask
 *
 * ─────────────────────────────────────────────────
 */

// ── 懒加载各业务 service（避免循环依赖）─────────────
// 实际项目中可改为动态 import() 按需加载
import { useBriefingFeedbackService }     from './service/useBriefingFeedbackService.js'
// import { useBriefingFeedbackViewService } from './useBriefingFeedbackViewService.js'
// import { usePersonnelSelectionService }   from './usePersonnelSelectionService.js'
// import { useXxxService } from './useXxxService.js'   ← 新业务在此添加

/**
 * 注册表：viewComponentPath → service 工厂函数
 *
 * key 规则：与 componentRegistry.js 保持一致
 * 优先级：viewComponentPath 精确匹配 > businessType 兜底
 */
const SERVICE_REGISTRY = {
  // ── 巡前通报流程 ────────────────────────────────
  'InspectionBriefing/BriefingFeedbackForm':      useBriefingFeedbackService,
//   'InspectionBriefing/BriefingFeedbackViewForm':  useBriefingFeedbackViewService,
//   // 分管领导审批、巡察主管审核：复用 FeedbackView 的数据结构（只读上游 + 填本节点意见）
//   'InspectionBriefing/BriefingLeaderApprovalForm': useBriefingFeedbackViewService,
//   'InspectionBriefing/BriefingChiefReviewForm':    useBriefingFeedbackViewService,

//   // ── 人才选调流程 ────────────────────────────────
//   'PersonnelSelection/DeptRecommendForm':         usePersonnelSelectionService,
//   'PersonnelSelection/PersonDetailForm':          usePersonnelSelectionService,
//   'PersonnelSelection/InspectionGroupForm':       usePersonnelSelectionService,
//   'PersonnelSelection/InspectionReviewForm':      usePersonnelSelectionService,
//   'PersonnelSelection/InspectionReviewViewForm':  usePersonnelSelectionService,
}

// ── 兜底注册表：businessType → service ────────────────────────
const FALLBACK_REGISTRY = {
  // inspection_plan: useXxxService,
}
 
// ── 默认 service（未注册的任务兜底）──────────────────────────
function useDefaultService() {
  return {
    async fetchTaskData(row)                          { return row.extraData ?? {} },
    async fetchViewData(nodeKey, nodeName, businessId) { return {} },
  }
}
 
/**
 * 内部：根据 row 找到对应 service 实例
 *
 * 查找优先级：
 *   1. viewComponentPath 字符串精确匹配注册表
 *   2. businessType 匹配兜底注册表
 *   3. 默认 service
 *
 * 注意：viewComponentPath 是组件对象时（mockData 开发模式），
 * 无法用作注册表 key，此时 path 为 object，走 businessType 兜底。
 */
function resolveService(row) {
  const path = row?.extraData?.viewComponentPath
 
  if (typeof path === 'string' && SERVICE_REGISTRY[path]) {
    return SERVICE_REGISTRY[path]()
  }
 
  if (row?.businessType && FALLBACK_REGISTRY[row.businessType]) {
    return FALLBACK_REGISTRY[row.businessType]()
  }
 
  return useDefaultService()
}
 
// ══════════════════════════════════════════════════════════════
//  对外三函数
// ══════════════════════════════════════════════════════════════
 
/**
 * [第一阶段] 获取组件路径
 *
 * 现阶段 MOCK：直接从 row.extraData.viewComponentPath 取，无需请求。
 * 正式对接时：
 *   // TODO: 替换为真实接口
 *   // const res = await NodeApi.getComponentPath({
 *   //   businessId:      row.businessId,
 *   //   currentNodeName: row.taskName,
 *   // })
 *   // return res.viewComponentPath
 *
 * @param {object} row
 * @returns {Promise<string|object|null>} viewComponentPath
 */
export async function fetchComponentPath(row) {
  // MOCK: 直接从 row.extraData 读取，正式对接时替换为 API 调用
  return row?.extraData?.viewComponentPath ?? null
}
 
/**
 * [第二阶段] 获取表单初始化数据（MyTodo 专用）
 *
 * @param {object} row
 * @returns {Promise<object>} extraData，注入 taskInfo.extraData
 */
export async function fetchTaskData(row) {
  const service = resolveService(row)
  return service.fetchTaskData(row)
}
 
/**
 * [MyApplication Tab 点击] 获取历史节点快照数据
 *
 * @param {object} row        - 当前申请行（已快照，不受后续点击影响）
 * @param {string} nodeKey    - Tab key
 * @param {string} nodeName   - 节点名称
 * @returns {Promise<object>} formData，注入 buildTaskInfo
 */
export async function fetchNodeSnapshot(row, nodeKey, nodeName) {
  const service = resolveService(row)
  return service.fetchViewData(nodeKey, nodeName, row?.businessId)
}
 
// ── 保留旧导出兼容性（过渡期，后续删除）─────────────────────
// TODO: 正式对接稳定后，删除以下两行，所有调用方改用上方三函数
export { resolveService }
export const fetchTaskExtraData = fetchTaskData