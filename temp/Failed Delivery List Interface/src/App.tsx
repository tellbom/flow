import { Fragment, useMemo, useState } from "react";
import heroBanner from "@/imports/process_backend.png";

/* ------------------------------------------------------------------ */
/* Types & seed data (modeled on 9.3 Failed Delivery / DeadLetter API) */
/* ------------------------------------------------------------------ */

type DeliveryAction = "retry_delivery" | "terminate_process";

type Delivery = {
  deliveryId: string;
  source: "flowable_async_job";
  sourceId: string;
  deliveryType: "process_completed";
  businessId: string | null;
  businessTitle: string;
  processInstanceId: string;
  processState: "running" | "not_active" | "terminated";
  activityId: string;
  target: string;
  status: "dead_letter" | "executable" | "terminated";
  lastHttpStatus: number | null;
  lastError: string;
  createdAt: string;
  availableActions: DeliveryAction[];
};

const SEED: Delivery[] = [
  {
    deliveryId: "dl-8f21c07a-9b44",
    source: "flowable_async_job",
    sourceId: "dl-8f21c07a-9b44",
    deliveryType: "process_completed",
    businessId: "PZ_001",
    businessTitle: "质量归口问题归零（V3 本地）",
    processInstanceId: "proc-inst-1f9c2a01",
    processState: "running",
    activityId: "st07_framework_callback",
    target: "https://business.example/api/callback",
    status: "dead_letter",
    lastHttpStatus: null,
    lastError:
      "业务系统通知失败: HTTP 500 Internal Server Error\n" +
      "  at FlowableWrapper.Application.Services.ProcessCallbackAppService.NotifyBusinessAsync(ProcessCallbackDto dto)\n" +
      "  at FlowableWrapper.Infrastructure.Http.FrameworkCallbackClient.PostAsync(String url, String payload)\n" +
      "  at Flowable.Async.HttpServiceTask.Execute(JobExecutionContext ctx)\n" +
      "  at Flowable.Job.Async.AsyncExecutorJobHandler.Run() [DeadLetter after R5/PT10M]",
    createdAt: "2026-09-01T01:17:46.981Z",
    availableActions: ["retry_delivery", "terminate_process"],
  },
  {
    deliveryId: "dl-27b1e4d5-0c8e",
    source: "flowable_async_job",
    sourceId: "dl-27b1e4d5-0c8e",
    deliveryType: "process_completed",
    businessId: "SEMI_AUTO_014",
    businessTitle: "2026 年第 3 批人员选调审批",
    processInstanceId: "proc-inst-3a77bd12",
    processState: "running",
    activityId: "st07_framework_callback",
    target: "https://hr.example/workflow/notify",
    status: "dead_letter",
    lastHttpStatus: null,
    lastError:
      "HTTP 503 Service Unavailable — 接收方网关暂时不可用\n" +
      "Upstream connect error or disconnect/reset before headers.\n" +
      "  at Flowable.Async.HttpServiceTask.Execute(JobExecutionContext ctx)",
    createdAt: "2026-08-31T22:04:11.210Z",
    availableActions: ["retry_delivery", "terminate_process"],
  },
  {
    deliveryId: "dl-b90ac13f-77a2",
    source: "flowable_async_job",
    sourceId: "dl-b90ac13f-77a2",
    deliveryType: "process_completed",
    businessId: "FULL_AUTO_009",
    businessTitle: "巡察组人员回避确认审批",
    processInstanceId: "proc-inst-77e0aa54",
    processState: "running",
    activityId: "st07_framework_callback",
    target: "https://audit.example/api/flow-callback",
    status: "dead_letter",
    lastHttpStatus: null,
    lastError:
      "java.net.SocketTimeoutException: Read timed out\n" +
      "连接建立后 30s 内未收到响应，Async Executor 重试耗尽。\n" +
      "  at java.net.SocketInputStream.socketRead0(Native Method)\n" +
      "  at Flowable.Async.HttpServiceTask.Execute(JobExecutionContext ctx)",
    createdAt: "2026-08-31T15:41:59.004Z",
    availableActions: ["retry_delivery", "terminate_process"],
  },
  {
    deliveryId: "dl-5c3d81ee-42b0",
    source: "flowable_async_job",
    sourceId: "dl-5c3d81ee-42b0",
    deliveryType: "process_completed",
    businessId: null,
    businessTitle: "元数据缺失流程（孤儿实例）",
    processInstanceId: "proc-inst-90fd1c37",
    processState: "not_active",
    activityId: "st07_framework_callback",
    target: "https://business.example/api/callback",
    status: "dead_letter",
    lastHttpStatus: null,
    lastError:
      "HTTP 404 Not Found — 回调地址不存在；ES 流程元数据缺失，businessId 无法补全。\n" +
      "  at Flowable.Async.HttpServiceTask.Execute(JobExecutionContext ctx)",
    createdAt: "2026-08-30T09:12:33.500Z",
    availableActions: ["retry_delivery"],
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/* ------------------------------------------------------------------ */
/* Apple-inspired Tag / Pill Components (Single-line, High Contrast)   */
/* ------------------------------------------------------------------ */

function StatusPill({ status }: { status: Delivery["status"] }) {
  const map = {
    dead_letter: {
      label: "死信 DeadLetter",
      bg: "rgba(224, 65, 58, 0.10)",
      fg: "#d92d20",
      border: "rgba(224, 65, 58, 0.22)",
      dot: "#e0413a",
    },
    executable: {
      label: "已准备重试",
      bg: "rgba(217, 138, 0, 0.10)",
      fg: "#b56900",
      border: "rgba(217, 138, 0, 0.25)",
      dot: "#d98a00",
    },
    terminated: {
      label: "已终止",
      bg: "#f1f3f9",
      fg: "#525f7f",
      border: "rgba(100, 116, 139, 0.22)",
      dot: "#64748b",
    },
  }[status];

  return (
    <span
      className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight transition-all"
      style={{
        backgroundColor: map.bg,
        color: map.fg,
        border: `1px solid ${map.border}`,
      }}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: map.dot }}
      />
      <span>{map.label}</span>
    </span>
  );
}

function ProcessStatePill({ state }: { state: Delivery["processState"] }) {
  const map = {
    running: {
      label: "运行中",
      fg: "#0d7a46",
      bg: "rgba(31, 157, 99, 0.10)",
      border: "rgba(31, 157, 99, 0.25)",
    },
    not_active: {
      label: "非活动",
      fg: "#4a5568",
      bg: "#f1f4f9",
      border: "rgba(74, 85, 104, 0.20)",
    },
    terminated: {
      label: "已终止",
      fg: "#e0413a",
      bg: "rgba(224, 65, 58, 0.08)",
      border: "rgba(224, 65, 58, 0.20)",
    },
  }[state];

  return (
    <span
      className="inline-flex whitespace-nowrap items-center rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-tight"
      style={{
        backgroundColor: map.bg,
        color: map.fg,
        border: `1px solid ${map.border}`,
      }}
    >
      {map.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Apple HIG Stat Cards                                               */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: number;
  tone: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-start rounded-xl border border-slate-200/80 bg-white/90 p-3.5 px-4 shadow-[0_2px_8px_-2px_rgba(20,40,80,0.06)] backdrop-blur-md min-w-[130px]">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">
        {label}
      </span>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className="text-2xl font-bold tracking-tight tabular-nums"
          style={{ color: tone }}
        >
          {value}
        </span>
        {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal Shell                                                        */
/* ------------------------------------------------------------------ */

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all"
      style={{
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.3)] border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main App Component                                                  */
/* ------------------------------------------------------------------ */

export default function App() {
  const [rows, setRows] = useState<Delivery[]>(SEED);
  const [businessId, setBusinessId] = useState("");
  const [processInstanceId, setProcessInstanceId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Delivery["status"]>(
    "all",
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [retryTarget, setRetryTarget] = useState<Delivery | null>(null);
  const [retryReason, setRetryReason] = useState("");
  const [terminateTarget, setTerminateTarget] = useState<Delivery | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [terminateError, setTerminateError] = useState(false);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (
        businessId &&
        !(r.businessId ?? "").toLowerCase().includes(businessId.toLowerCase())
      )
        return false;
      if (
        processInstanceId &&
        !r.processInstanceId
          .toLowerCase()
          .includes(processInstanceId.toLowerCase())
      )
        return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rows, businessId, processInstanceId, statusFilter]);

  const deadCount = rows.filter((r) => r.status === "dead_letter").length;
  const runningCount = rows.filter((r) => r.processState === "running").length;

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    flash(`已复制 ${label} 到剪贴板`);
  };

  const resetFilters = () => {
    setBusinessId("");
    setProcessInstanceId("");
    setStatusFilter("all");
  };

  const confirmRetry = () => {
    if (!retryTarget) return;
    const id = retryTarget.deliveryId;
    setRows((prev) =>
      prev.map((r) =>
        r.deliveryId === id
          ? { ...r, status: "executable", availableActions: [] }
          : r,
      ),
    );
    flash(`已提交重试投递 · ${id}（状态转换为 Executable，等待 Async Executor 执行）`);
    setRetryTarget(null);
    setRetryReason("");
  };

  const confirmTerminate = () => {
    if (!terminateTarget) return;
    if (!terminateReason.trim()) {
      setTerminateError(true);
      return;
    }
    const id = terminateTarget.deliveryId;
    setRows((prev) =>
      prev.map((r) =>
        r.deliveryId === id
          ? {
              ...r,
              status: "terminated",
              processState: "terminated",
              availableActions: [],
            }
          : r,
      ),
    );
    flash(`流程已终止 · ${id}`);
    setTerminateTarget(null);
    setTerminateReason("");
    setTerminateError(false);
  };

  const inputCls =
    "h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:border-[var(--primary)] focus:ring-3 focus:ring-[var(--primary)]/10";

  return (
    <div className="min-h-full bg-[#f4f6fa] text-slate-800 antialiased selection:bg-[var(--primary)]/15">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[var(--brand-nav-strong)]/95 px-6 backdrop-blur-md md:px-10 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 shadow-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7l8-4 8 4v10l-8 4-8-4V7z"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <path d="M12 3v18M4 7l8 4 8-4" stroke="#fff" strokeWidth="1.8" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-bold tracking-tight text-white">
              企业业务流程运行管理平台
            </span>
            <span className="text-[11px] font-medium text-white/70 tracking-wide">
              Flowable Enterprise Engine · DeadLetter Console
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-5 md:flex">
          <div className="flex h-9 w-72 items-center gap-2.5 rounded-full bg-white/12 px-4 text-xs font-medium text-white/90 ring-1 ring-white/15 transition-all hover:bg-white/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="1.8" />
              <path d="M21 21l-4-4" stroke="#fff" strokeWidth="1.8" />
            </svg>
            <span>搜索待办任务 / businessId</span>
            <kbd className="ml-auto rounded bg-white/20 px-1.5 py-0.5 text-[10px] text-white/80">
              ⌘K
            </kbd>
          </div>
          <div className="h-5 w-px bg-white/20" />
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-2 ring-white/30">
              AD
            </div>
            <span className="text-xs font-semibold text-white">
              Bootstrap Admin
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <div className="relative overflow-hidden bg-slate-900">
        <img
          src={heroBanner}
          alt="业务流程运行管理平台"
          className="h-[180px] w-full object-cover object-left opacity-90 transition-opacity md:h-[240px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 mx-auto max-w-[1400px] md:left-10 md:right-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md ring-1 ring-white/25">
                <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                <span>死信任务中心 (DeadLetter)</span>
              </div>
              <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-white md:text-3xl">
                失败投递管理
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <StatCard
                label="待处理死信"
                value={deadCount}
                tone="var(--danger)"
                sub="需人工干预"
              />
              <StatCard
                label="流程运行中"
                value={runningCount}
                tone="var(--primary)"
                sub="实例处于 Active"
              />
              <StatCard
                label="总记录"
                value={rows.length}
                tone="#334155"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 md:px-10">
          {["首页", "待办中心", "权限管理", "失败投递"].map((t) => {
            const active = t === "失败投递";
            return (
              <button
                key={t}
                className="relative py-3.5 text-xs font-semibold tracking-tight transition-colors"
                style={{
                  color: active ? "var(--primary)" : "var(--muted-foreground)",
                }}
              >
                {t}
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="mx-auto max-w-[1400px] px-6 py-6 md:px-10">
        {/* Info Banner */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v5m0 3h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex-1 text-xs leading-relaxed text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">
                  死信任务处理说明
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-600">
                  Flowable Async Job
                </span>
              </div>
              <p className="mt-1">
                当末尾流程完成回调多次重试均失败后，该任务会进入 Flowable 死信表（DeadLetter）。运维人员可根据业务排查结果选择
                <strong className="mx-1 text-slate-900 font-semibold">【重试投递】</strong>（重新入列执行）或
                <strong className="mx-1 text-slate-900 font-semibold">【终止流程】</strong>（终结相关流程实例并记录终止原因）。
              </p>
            </div>
          </div>
        </section>

        {/* Filters Bar */}
        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_200px_auto]">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">
                业务单号 (businessId)
              </span>
              <input
                className={inputCls}
                placeholder="例如 PZ_001"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">
                流程实例 (processInstanceId)
              </span>
              <input
                className={inputCls}
                placeholder="例如 proc-inst-1f9c2a01"
                value={processInstanceId}
                onChange={(e) => setProcessInstanceId(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">
                死信状态 (status)
              </span>
              <select
                className={inputCls}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as typeof statusFilter)
                }
              >
                <option value="all">全部状态</option>
                <option value="dead_letter">dead_letter (死信)</option>
                <option value="executable">executable (已准备)</option>
                <option value="terminated">terminated (已终止)</option>
              </select>
            </label>
            <div className="flex items-end gap-2.5">
              <button
                onClick={() => flash("已按条件筛选记录")}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--primary)] px-5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--primary-strong)] active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" />
                </svg>
                查询
              </button>
              <button
                onClick={resetFilters}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                重置
              </button>
            </div>
          </div>
        </section>

        {/* Data Table */}
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_-4px_rgba(15,23,42,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="px-6 py-3.5">投递业务名称 / ID</th>
                  <th className="px-4 py-3.5">事件类型</th>
                  <th className="px-4 py-3.5">流程状态</th>
                  <th className="px-4 py-3.5">回调目标地址 (Target)</th>
                  <th className="px-4 py-3.5">死信状态</th>
                  <th className="px-4 py-3.5">创建时间</th>
                  <th className="px-6 py-3.5 text-right min-w-[200px]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const isOpen = expanded === r.deliveryId;
                  return (
                    <Fragment key={r.deliveryId}>
                      <tr
                        className={`transition-colors align-top hover:bg-slate-50/60 ${
                          isOpen ? "bg-slate-50/80" : ""
                        }`}
                      >
                        {/* Business Title & IDs */}
                        <td className="px-6 py-4 max-w-[280px]">
                          <div className="font-bold text-slate-900 text-sm leading-snug">
                            {r.businessTitle}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 font-mono">
                            <span
                              onClick={() => copyToClipboard(r.deliveryId, "Delivery ID")}
                              className="cursor-pointer rounded bg-slate-100 px-1.5 py-0.5 transition-colors hover:bg-slate-200 hover:text-slate-800"
                              title="点击复制 deliveryId"
                            >
                              {r.deliveryId}
                            </span>
                            <span className="text-slate-300">|</span>
                            <span>
                              businessId:{" "}
                              {r.businessId ? (
                                <strong className="font-semibold text-slate-700">
                                  {r.businessId}
                                </strong>
                              ) : (
                                <span className="rounded bg-amber-50 px-1 py-0.2 text-amber-700 font-medium">
                                  null
                                </span>
                              )}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              setExpanded(isOpen ? null : r.deliveryId)
                            }
                            className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] transition-colors hover:text-[var(--primary-strong)]"
                          >
                            {isOpen ? "收起诊断与堆栈" : "查看异常堆栈与诊断"}
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              className={`transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            >
                              <path
                                d="M6 9l6 6 6-6"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </td>

                        {/* Delivery Type */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-mono font-medium text-slate-600 border border-slate-200/60">
                            {r.deliveryType}
                          </span>
                        </td>

                        {/* Process State */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <ProcessStatePill state={r.processState} />
                        </td>

                        {/* Target URL */}
                        <td className="px-4 py-4 max-w-[220px]">
                          <span
                            className="block truncate font-mono text-xs text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title={r.target}
                            onClick={() => copyToClipboard(r.target, "回调地址")}
                          >
                            {r.target}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusPill status={r.status} />
                        </td>

                        {/* Created At */}
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                          {formatTime(r.createdAt)}
                        </td>

                        {/* Actions (Horizontal, Crisp, No Word Wrap) */}
                        <td className="px-6 py-4 whitespace-nowrap text-right min-w-[200px]">
                          <div className="flex items-center justify-end gap-2">
                            {r.availableActions.includes("retry_delivery") && (
                              <button
                                onClick={() => {
                                  setRetryTarget(r);
                                  setRetryReason("");
                                }}
                                className="inline-flex whitespace-nowrap h-8 items-center justify-center gap-1 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/25 px-3.5 text-xs font-bold text-[var(--primary)] transition-all hover:bg-[var(--primary)] hover:text-white hover:border-transparent active:scale-[0.97]"
                              >
                                重试投递
                              </button>
                            )}
                            {r.availableActions.includes(
                              "terminate_process",
                            ) && (
                              <button
                                onClick={() => {
                                  setTerminateTarget(r);
                                  setTerminateReason("");
                                  setTerminateError(false);
                                }}
                                className="inline-flex whitespace-nowrap h-8 items-center justify-center gap-1 rounded-xl bg-red-50 border border-red-200 px-3.5 text-xs font-bold text-red-600 transition-all hover:bg-red-600 hover:text-white hover:border-transparent active:scale-[0.97]"
                              >
                                终止流程
                              </button>
                            )}
                            {r.availableActions.length === 0 && (
                              <span className="text-xs text-slate-400 font-medium">
                                无可用操作
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Redesigned Detail / Exception Stacktrace Drawer */}
                      {isOpen && (
                        <tr className="border-t border-slate-200/80 bg-slate-900/3">
                          <td colSpan={7} className="p-5">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="grid gap-6 md:grid-cols-[280px_1fr]">
                                {/* Execution Context & Metadata Panel */}
                                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
                                  <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                      Flowable 执行上下文
                                    </span>
                                    <h4 className="mt-1 text-xs font-bold text-slate-900">
                                      流程与任务节点信息
                                    </h4>
                                  </div>

                                  <div className="space-y-3 text-xs">
                                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                                      <span className="text-slate-400 text-[11px] block">
                                        流程实例 (processInstanceId)
                                      </span>
                                      <span
                                        onClick={() =>
                                          copyToClipboard(
                                            r.processInstanceId,
                                            "processInstanceId",
                                          )
                                        }
                                        className="font-mono font-semibold text-slate-800 break-all cursor-pointer hover:text-[var(--primary)] transition-colors"
                                      >
                                        {r.processInstanceId}
                                      </span>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                                      <span className="text-slate-400 text-[11px] block">
                                        当前节点 (activityId)
                                      </span>
                                      <span className="font-mono font-semibold text-slate-800">
                                        {r.activityId}
                                      </span>
                                    </div>

                                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                                      <span className="text-slate-400 text-[11px] block">
                                        任务来源与类型
                                      </span>
                                      <span className="font-mono font-medium text-slate-700">
                                        {r.source} · {r.deliveryType}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Diagnostic Note regarding Engine Attributes */}
                                  <div className="mt-auto rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-[11px] text-amber-900 leading-relaxed">
                                    <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                      </svg>
                                      <span>死信持久化机制说明</span>
                                    </div>
                                    Flowable Async Job 进入死信后，异常上下文记录在 Stacktrace 中。HTTP 响应码及重试频次未独立持久化在死信主记录表，排查请详见右侧完整 Stacktrace。
                                  </div>
                                </div>

                                {/* Exception Stacktrace Panel */}
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-900">
                                        完整异常堆栈 (Exception Stacktrace)
                                      </span>
                                      <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-700">
                                        GET /failed-deliveries/{r.deliveryId}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        copyToClipboard(r.lastError, "异常堆栈")
                                      }
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                                      </svg>
                                      复制堆栈
                                    </button>
                                  </div>

                                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-inner">
                                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-3.5 py-2 text-[11px] text-slate-400 font-mono">
                                      <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-full bg-red-500/80" />
                                        <span className="size-2.5 rounded-full bg-amber-500/80" />
                                        <span className="size-2.5 rounded-full bg-emerald-500/80" />
                                        <span className="ml-2 text-slate-300">stacktrace.log</span>
                                      </div>
                                      <span>Flowable Async Executor</span>
                                    </div>
                                    <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed text-slate-200">
                                      {r.lastError}
                                    </pre>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    提示：堆栈展示 Flowable 捕获的完整 Exception 信息，反映内部回调执行失败原因。
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-sm text-slate-400"
                    >
                      未找到符合筛选条件的失败投递死信记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 text-xs text-slate-500">
            <span>
              共 <strong>{filtered.length}</strong> 条死信记录 · Source: flowable_async_job
            </span>
            <div className="flex items-center gap-1.5">
              <button className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40">
                ‹
              </button>
              <button className="flex size-7 items-center justify-center rounded-lg bg-[var(--primary)] font-bold text-white shadow-xs">
                1
              </button>
              <button className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40">
                ›
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Retry Modal */}
      {retryTarget && (
        <ModalShell onClose={() => setRetryTarget(null)}>
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[var(--primary)] ring-1 ring-blue-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                确认重试投递
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                将此 DeadLetter 移回 Executable 作业列，由 Flowable Async Executor 重新尝试回调。不会重复跑已完成的用户任务。
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
            <div className="font-mono font-bold text-slate-800">
              {retryTarget.deliveryId}
            </div>
            <div className="mt-1 text-slate-500 truncate font-mono">
              {retryTarget.target}
            </div>
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700">
              重试原因说明（可选 · 记入审计日志）
            </span>
            <input
              className={inputCls}
              placeholder="例如：接收方网络服务已恢复，手动触发重试"
              value={retryReason}
              onChange={(e) => setRetryReason(e.target.value)}
            />
          </label>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              onClick={() => setRetryTarget(null)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={confirmRetry}
              className="h-9 rounded-xl bg-[var(--primary)] px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[var(--primary-strong)] active:scale-[0.98]"
            >
              确认重试投递
            </button>
          </div>
        </ModalShell>
      )}

      {/* Terminate Modal */}
      {terminateTarget && (
        <ModalShell onClose={() => setTerminateTarget(null)}>
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8v5m0 3h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                确认终止流程实例
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                直接终止该死信对应的 Flowable 流程实例，生命周期转换为 Terminated。此操作不可撤销。
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
            <div className="font-mono font-bold text-slate-800">
              {terminateTarget.processInstanceId}
            </div>
            <div className="mt-1 text-slate-500">
              businessId: {terminateTarget.businessId ?? "null"}
            </div>
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700">
              终止原因 <span className="text-red-500">*</span>（必填）
            </span>
            <textarea
              className={`${inputCls} h-20 resize-none py-2.5 ${
                terminateError ? "border-red-500 ring-2 ring-red-100" : ""
              }`}
              placeholder="例如：业务确认数据异常无需重新投递，关单并手动终止"
              value={terminateReason}
              onChange={(e) => {
                setTerminateReason(e.target.value);
                if (e.target.value.trim()) setTerminateError(false);
              }}
            />
            {terminateError && (
              <span className="text-xs font-semibold text-red-500">
                必须填写终止原因方可执行终止操作
              </span>
            )}
          </label>

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              onClick={() => setTerminateTarget(null)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={confirmTerminate}
              className="h-9 rounded-xl bg-red-600 px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98]"
            >
              确认终止流程
            </button>
          </div>
        </ModalShell>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-slate-900/90 px-4.5 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-md border border-slate-700/50 animate-in fade-in slide-in-from-bottom-3 duration-150">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
