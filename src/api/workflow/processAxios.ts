/**
 * processAxios.ts
 * 流程中心专用 Axios 实例
 *
 * 设计原则：
 *   - 独立于 '/@/utils/axios' 的主站实例，避免互相污染
 *   - baseURL 读取 VITE_PROCESS_BASE_URL，走独立反向代理
 *   - 响应格式：{ success: boolean, data: T, message: string, errorCode?: string }
 *   - HTTP 200 但 success=false → 业务异常，ElNotification 展示 message
 *   - HTTP 非 200 → 网络/网关异常，按状态码展示友好提示
 *   - X-User-Id 自动从 adminInfo.userid 注入
 */

import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElNotification, ElLoading } from 'element-plus'
import { useAdminInfo } from '/@/stores/adminInfo'

// ──────────────────────────────────────────────────────────────
//  类型定义
// ──────────────────────────────────────────────────────────────

/** 流程中心统一响应体 */
export interface ProcessApiResponse<T = any> {
  success: boolean
  message: string
  data: T
  errorCode?: string
}

/** createProcessRequest options */
export interface ProcessRequestOptions {
  /** 是否显示全屏 loading，默认 false */
  loading?: boolean
  /** 成功时是否 toast，默认 false */
  showSuccessMessage?: boolean
  /** 失败时是否 toast，默认 true */
  showErrorMessage?: boolean
}

// ──────────────────────────────────────────────────────────────
//  Base URL
// ──────────────────────────────────────────────────────────────

const getProcessBaseUrl = (): string => {
  if (import.meta.env.DEV) return '/process-api'

  const val = import.meta.env.VITE_PROCESS_BASE_URL as string
  if (!val || val === 'getCurrentDomain') {
    return window.location.protocol + '//' + window.location.host
  }
  return val
}

// ──────────────────────────────────────────────────────────────
//  Loading 计数器（复用 Element Plus 全屏 loading）
// ──────────────────────────────────────────────────────────────

let loadingCount = 0
let loadingTarget: ReturnType<typeof ElLoading.service> | null = null

function openLoading() {
  loadingCount++
  if (loadingCount === 1) {
    loadingTarget = ElLoading.service({
      lock: true,
      text: '处理中...',
      background: 'rgba(0, 0, 0, 0.45)',
    })
  }
}

function closeLoading() {
  if (loadingCount > 0) loadingCount--
  if (loadingCount === 0 && loadingTarget) {
    loadingTarget.close()
    loadingTarget = null
  }
}

// ──────────────────────────────────────────────────────────────
//  HTTP 错误提示
// ──────────────────────────────────────────────────────────────

const HTTP_ERROR_MAP: Record<number, string> = {
  400: '请求参数有误',
  401: '未授权，请重新登录',
  403: '无权限执行此操作',
  404: '接口地址不存在',
  408: '请求超时',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂时不可用',
  504: '网关超时',
}

function showHttpError(status?: number, url?: string) {
  let msg = HTTP_ERROR_MAP[status ?? 0]
  if (!msg) {
    msg = status === 404 ? `接口不存在：${url}` : '网络异常，请稍后重试'
  }
  ElNotification({ type: 'error', message: msg, zIndex: 9999, duration: 4500 })
}

// ──────────────────────────────────────────────────────────────
//  核心请求函数
// ──────────────────────────────────────────────────────────────

/**
 * 流程中心专用请求
 *
 * @example
 * const data = await createProcessRequest<PendingTaskListDto>({
 *   url: '/api/tasks/pending',
 *   method: 'GET',
 *   params: { employeeId: 'EMP_001' }
 * })
 * // data 是 response.data.data（已解包）
 * // 失败时抛出 ProcessApiError
 */
export async function createProcessRequest<T = any>(
  axiosConfig: AxiosRequestConfig,
  options: ProcessRequestOptions = {}
): Promise<T> {
  const {
    loading = false,
    showSuccessMessage = false,
    showErrorMessage = true,
  } = options

  if (loading) openLoading()

  const instance = axios.create({
    baseURL: getProcessBaseUrl(),
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  })

  // ── 请求拦截：注入 Authorization ──
  instance.interceptors.request.use((config) => {
    try {
      const adminInfo = useAdminInfo()
      const token = adminInfo.token || ''
      if (token) {
        config.headers = config.headers ?? {}
        ;(config.headers as any)['Authorization'] = `Bearer ${token}`
      }
    } catch {
      // store 未就绪时跳过（如登录前调用）
    }
    return config
  })

  // ── 响应拦截 ──
  instance.interceptors.response.use(
    (response: AxiosResponse<ProcessApiResponse<T>>) => response,
    (error) => {
      if (loading) closeLoading()
      const status = error?.response?.status
      const url = error?.config?.url
      if (showErrorMessage) showHttpError(status, url)
      return Promise.reject(error)
    }
  )

  try {
    const response = await instance(axiosConfig)
    if (loading) closeLoading()

    const body: ProcessApiResponse<T> = response.data

    if (!body.success) {
      if (showErrorMessage) {
        ElNotification({
          type: 'error',
          message: body.message || '操作失败',
          zIndex: 9999,
          duration: 4500,
        })
      }
      const err = new ProcessApiError(body.message, body.errorCode)
      return Promise.reject(err)
    }

    if (showSuccessMessage && body.message) {
      ElNotification({ type: 'success', message: body.message, zIndex: 9999 })
    }

    return body.data
  } catch (e) {
    if (loading) closeLoading()
    throw e
  }
}

/** 流程中心业务异常（success=false 时抛出）*/
export class ProcessApiError extends Error {
  errorCode?: string

  constructor(message: string, errorCode?: string) {
    super(message)
    this.name = 'ProcessApiError'
    this.errorCode = errorCode
  }
}
