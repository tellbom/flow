/**
 * Workflow utility helpers shared by todo/application workflow views.
 */

export const statusTagType = (status) =>
  ({
    running:    'primary',
    completed:  'success',
    terminated: 'info',
    rejected:   'danger',
  }[status] ?? '')

export const statusLabel = (status) =>
  ({
    running:    '审批中',
    completed:  '已完成',
    terminated: '已撤回',
    rejected:   '已驳回',
  }[status] ?? status ?? '')

export const outcomeTagType = (outcome) =>
  ({
    approved:           'success',
    rejected_terminate: 'danger',
    rejected_return:    'warning',
  }[outcome] ?? 'info')

export const outcomeLabel = (outcome) =>
  ({
    approved:           '已通过',
    rejected_terminate: '已驳回终止',
    rejected_return:    '已驳回回退',
  }[outcome] ?? outcome ?? '')

export const formatDate = (dt) => {
  if (!dt) return '-'
  return new Date(dt)
    .toLocaleString('zh-CN', { hour12: false })
    .replace(/\//g, '-')
}

export const formatDateOnly = (dt) => {
  if (!dt) return '-'
  return new Date(dt)
    .toLocaleDateString('zh-CN')
    .replace(/\//g, '-')
}

export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '-'
  if (seconds < 60)    return `${seconds}秒`
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}分钟`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
  return `${Math.floor(seconds / 86400)}天`
}
