/**
 * failedDeliveryApi.ts
 * 失败投递（Flowable DeadLetter）管理接口封装
 *
 * 契约依据：流程中心 README §9.3 Failed Delivery / Flowable DeadLetter 管理 API
 *   GET    /api/admin/failed-deliveries                    分页查询
 *   GET    /api/admin/failed-deliveries/{deliveryId}       详情（lastError 为完整堆栈）
 *   POST   /api/admin/failed-deliveries/{deliveryId}/retry           重试投递
 *   POST   /api/admin/failed-deliveries/{deliveryId}/terminate-process 终止流程
 *
 * 约束（§9.3.7）：
 *   - availableActions 由后端计算，前端禁止根据 source / status 自行推导动作
 *   - V3 仅支持 status=dead_letter / source=flowable_async_job / deliveryType=process_completed
 */

import { createProcessRequest } from './processAxios'

// ══════════════════════════════════════════════════════════════
//  DTO（对齐 §9.3.7 字段语义）
// ══════════════════════════════════════════════════════════════

export type DeliverySource = 'flowable_async_job'
export type DeliveryType = 'process_completed'
export type DeliveryStatus = 'dead_letter' | 'executable' | 'terminated'
export type DeliveryProcessState = 'running' | 'not_active' | 'terminated'
export type DeliveryAction = 'retry_delivery' | 'terminate_process'

export interface FailedDeliveryDto {
    deliveryId: string
    source: DeliverySource
    sourceId: string
    deliveryType: DeliveryType
    /** ES 元数据补全，元数据缺失时为 null */
    businessId: string | null
    processInstanceId: string
    processState: DeliveryProcessState
    activityId: string
    /** 启动流程时保存的业务回调 URL */
    target: string
    status: DeliveryStatus
    /** Flowable DeadLetter 无法还原，返回 null */
    attemptCount: number | null
    lastHttpStatus: number | null
    /** 列表为摘要，详情为完整 exception stacktrace */
    lastError: string
    createdAt: string
    lastFailedAt: string | null
    /** 后端计算，前端只按此渲染按钮 */
    availableActions: DeliveryAction[]
}

export interface FailedDeliveryListDto {
    items: FailedDeliveryDto[]
    total: number
    pageIndex: number
    pageSize: number
}

export interface DeliveryActionResultDto {
    deliveryId: string
    action: DeliveryAction
    status: DeliveryStatus
}

// ══════════════════════════════════════════════════════════════
//  查询参数
// ══════════════════════════════════════════════════════════════

export interface GetFailedDeliveriesParams {
    businessId?: string
    processInstanceId?: string
    source?: string
    status?: string
    deliveryType?: string
    pageIndex?: number
    pageSize?: number
}

// ══════════════════════════════════════════════════════════════
//  接口
// ══════════════════════════════════════════════════════════════

/** GET /api/admin/failed-deliveries — 分页查询失败投递列表 */
export function getFailedDeliveries(params: GetFailedDeliveriesParams = {}) {
    return createProcessRequest<FailedDeliveryListDto>({
        url: '/api/admin/failed-deliveries',
        method: 'GET',
        params,
    })
}

/** GET /api/admin/failed-deliveries/{deliveryId} — 详情（含完整异常堆栈） */
export function getFailedDeliveryDetail(deliveryId: string) {
    return createProcessRequest<FailedDeliveryDto>({
        url: `/api/admin/failed-deliveries/${encodeURIComponent(deliveryId)}`,
        method: 'GET',
    })
}

/** POST /api/admin/failed-deliveries/{deliveryId}/retry — 重试投递（reason 可选） */
export function retryFailedDelivery(deliveryId: string, reason?: string) {
    return createProcessRequest<DeliveryActionResultDto>({
        url: `/api/admin/failed-deliveries/${encodeURIComponent(deliveryId)}/retry`,
        method: 'POST',
        data: { reason: reason || undefined },
    })
}

/** POST /api/admin/failed-deliveries/{deliveryId}/terminate-process — 终止流程（reason 必填） */
export function terminateFailedDelivery(deliveryId: string, reason: string) {
    return createProcessRequest<DeliveryActionResultDto>({
        url: `/api/admin/failed-deliveries/${encodeURIComponent(deliveryId)}/terminate-process`,
        method: 'POST',
        data: { reason },
    })
}
