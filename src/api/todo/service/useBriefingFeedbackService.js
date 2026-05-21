/**
 * useBriefingFeedbackService.js
 *
 * 巡前通报 — 行管部门反馈节点 数据服务
 *
 * 职责：
 *   1. fetchTaskData(row)        → 供 MyTodo 打开抽屉前调用，返回完整 extraData
 *   2. fetchViewData(nodeKey, nodeName, businessId) → 供 MyApplication 查看时按需加载
 *
 * 原则：
 *   - 所有 API import 在本文件，MyTodo / MyApplication 完全不知道用了哪个接口
 *   - 数据组装逻辑（字段映射、合并、默认值）全在这里
 *   - 组件（BriefingFeedbackForm）只消费 props.taskInfo.extraData，不关心来源
 *
 * ─────────────────────────────────────────────────
 */

// TODO: 替换为真实 API 模块
// import { BriefingApi } from '/@/api/inspection/briefing.js'
import { apiGetNodeFormData } from '/@/components/todo/mockData.js'

export function useBriefingFeedbackService() {
  /**
   * MyTodo 打开审批抽屉时调用
   *
   * 返回的对象会被合并进 taskInfo.extraData，组件直接消费：
   *   - plan                  计划基本信息（含 inspectionObjects / BriefingTime）
   *   - objectFeedbacks[]     驳回重填时的历史数据（首次填写为 []）
   *   - viewComponentPath     组件路径（保持不变，透传）
   *
   * @param {object} row - 待办任务行（来自 apiGetTodoList）
   * @returns {Promise<object>} extraData
   */
  async function fetchTaskData(row) {
    const taskKey = row.taskKey ?? row.taskId

    // TODO: 替换为真实接口
    // const res = await BriefingApi.getNodeFormData({
    //   businessId:      row.businessId,
    //   currentNodeName: row.taskName,   // 后端按业务ID + 当前节点名定位数据
    // })
    const res = await apiGetNodeFormData(taskKey)
    const serverData = res.formData ?? {}

    return {
      // 保留 row 自带的 extraData（含 viewComponentPath / title 等路由信息）
      ...row.extraData,

      // 后端业务数据覆盖（优先级更高，确保数据最新）
      plan:            serverData.plan            ?? row.extraData?.plan ?? null,
      objectFeedbacks: serverData.objectFeedbacks ?? [],   // 驳回回填数据
    }
  }

  /**
   * MyApplication 查看历史节点时调用（ApplicationViewDrawer.fetchFormData）
   *
   * 与 MyTodo 的区别：只读，不需要校验，返回的数据直接给组件 readonly 展示。
   * 接口可能不同（如 GET /node-snapshot 历史快照接口）。
   *
   * @param {string} nodeKey    - 节点唯一 key（ApplicationViewDrawer 的 Tab key）
   * @param {string} nodeName   - 节点名称（后端契约：用于定位数据）
   * @param {string} businessId - 业务ID
   * @returns {Promise<object>} formData（直接展开进 extraData）
   */
  async function fetchViewData(nodeKey, nodeName, businessId) {
    // TODO: 替换为真实接口
    // const res = await BriefingApi.getNodeSnapshot({
    //   businessId,
    //   nodeName,
    // })
    // return res.data
    const res = await apiGetNodeFormData(nodeKey)
    return res.formData ?? {}
  }

  return { fetchTaskData, fetchViewData }
}