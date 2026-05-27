# 业务流程运行管理平台

## 待办审批 iframe 通信协议

待办审批页由主容器 `TaskApproveDrawer.vue` 渲染业务表单 iframe，并由主容器顶部的“同意”按钮提交流程中心 `completeTask`。业务表单如果需要在提交前异步保存或返回流程变量，可以通过 `window.parent.postMessage` 主动通知主容器。

协议采用“子页面主动推送”模式：

| child → parent 消息 | 含义 |
| --- | --- |
| `{ type: 'WF_EVENT', event: 'formLoading' }` | 业务表单正在异步处理，请主容器锁住“同意”按钮 |
| `{ type: 'WF_EVENT', event: 'formReady', payload: { variables? } }` | 业务表单已准备好，可以提交，可携带业务变量 |
| `{ type: 'WF_EVENT', event: 'formError', payload: { reason } }` | 业务表单校验失败或保存失败，主容器解锁按钮但提交时阻断 |

三方业务表单不实现该协议时，主容器收不到消息，“同意”按钮全程可点击，保持原有无感知行为。

### 状态机

```text
iframe load 完成
  └─ parent 注册监听器，等待 child 主动推送

child 推送 formLoading  → iframeLocked = true
child 推送 formReady    → iframeLocked = false，缓存 variables
child 推送 formError    → iframeLocked = false，记录 reason

用户点同意：
  ├─ iframeFormError 非空 → 提示错误并阻断
  ├─ iframeFormVars 非空  → 合并进 flowVars，且不覆盖用户已选网关变量
  └─ 继续原有 gateway / slot 校验 → completeTask
```

### 子页面示例

```js
window.parent.postMessage({ type: 'WF_EVENT', event: 'formLoading' }, '*')

try {
  await saveForm()
  window.parent.postMessage({
    type: 'WF_EVENT',
    event: 'formReady',
    payload: {
      variables: {
        approval_route: 'A',
      },
    },
  }, '*')
} catch (error) {
  window.parent.postMessage({
    type: 'WF_EVENT',
    event: 'formError',
    payload: {
      reason: error?.message || '业务表单保存失败',
    },
  }, '*')
}
```

主容器侧使用 `src/utils/iframeBridge.js` 监听消息，并校验 `event.source === iframe.contentWindow`，只接收当前业务 iframe 的事件。
