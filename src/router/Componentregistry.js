/*
 * @Author: fzq
 * @Date: 2026-03-10 17:23:03
 * @LastEditors: fzq
 * @LastEditTime: 2026-04-17 15:23:53
 * @Description: 
 * @FilePath: \flow\src\router\Componentregistry.js
 */
/**
 * 全局业务表单组件注册中心
 *
 * 规则：
 *   - key   = 后端下发的 viewComponentPath 字符串
 *   - value = 已 import 的组件对象
 *
 * 新增流程只需在此文件追加一行，其他所有地方（TaskApproveDrawer、
 * ApplicationViewDrawer、MyTodo、MyApplication）无需改动。
 *
 * 与 Vue Router 的 routes 数组是同一种思路：
 * 先集中注册，使用时按 key 查找，调用方不感知具体组件。
 */



export const COMPONENT_REGISTRY = {
}

/**
 * 根据后端下发的 viewComponentPath 解析对应的组件对象
 * @param {string} path
 * @returns {object|null} Vue 组件对象，未注册则返回 null
 */
export function resolveComponent(path) {
  if (!path) return null
  const comp = COMPONENT_REGISTRY[path]
  if (!comp) {
    console.warn(`[componentRegistry] 未注册的组件路径: "${path}"，请在 componentRegistry.js 中添加`)
  }
  return comp ?? null
}