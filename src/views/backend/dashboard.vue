<template>
  <div class="home-page">

    <!-- ① Banner + KPI -->
    <StatsBanner
      :user-name="userName"
      :kpi-list="kpiList"
    />

    <!-- ② 快捷入口 -->
    <!-- <QuickEntry
      :entries="quickEntries"
      @entry-click="handleEntryClick"
    /> -->

    <!-- ③ 第一行：统计图 + 待办列表 -->
    <div class="row row-main">
      <div class="col col-chart">
        <InspectionChart :plan-data="PLAN_DATA" :rectify-data="RECTIFY_DATA" />
      </div>
      <div class="col col-todo">
        <TodoList
          :todo-list="todoList"
          @item-click="handleTodoClick"
          @view-all="handleTodoViewAll"
        />
      </div>
    </div>

    <!-- ④ 第二行：资源共享 + 履职情况 + 企业开展 -->
    <div class="row row-bottom">
      <div class="col col-resource">
        <ResourceShare :resource-data="resourceData" @item-click="handleResourceClick" @more="handleResourceMore" />
      </div>
      <div class="col col-duty">
        <DutyStatus
          :pinned-notices="pinnedNotices"
          :meeting-list="meetingList"
          :pinned-meetings="pinnedMeetings"
          @notice-click="handleDutyNoticeClick"
          @meeting-click="handleMeetingClick"
          @more="handleDutyMore"
        />
      </div>
      <div class="col col-company">
        <CompanyProgress :companies="companyList" @news-click="handleNewsClick" @more="handleCompanyMore" />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Odometer, DataAnalysis, Finished, Warning,
  Calendar, DocumentChecked, Bell, UserFilled,
  List, Setting, Search, TrendCharts,
} from '@element-plus/icons-vue'
import { useAdminInfo } from '/@/stores/adminInfo'

import StatsBanner     from '/@/components/home/StatsBanner.vue'
import QuickEntry      from '/@/components/home/QuickEntry.vue'
import InspectionChart from '/@/components/home/InspectionChart.vue'
import TodoList        from '/@/components/home/TodoList.vue'
import ResourceShare   from '/@/components/home/ResourceShare.vue'
import CompanyProgress from '/@/components/home/CompanyProgress.vue'
import DutyStatus from '/@/components/home/DutyStatus.vue'

import { PLAN_DATA, RECTIFY_DATA } from './InspectionChartMockData.js'

const router = useRouter()

// ════════════════════════════════════════════════
//  用户信息
// ════════════════════════════════════════════════

const adminInfo = useAdminInfo()
const userName = adminInfo.nickname

// ════════════════════════════════════════════════
//  顶部 KPI
// ════════════════════════════════════════════════
const kpiList = ref([
  {
    label:  '年度巡察计划',
    value:  28,
    unit:   '项',
    delta:  12,
    icon:   Calendar,
    iconBg: 'rgba(255,255,255,.18)',
  },
  {
    label:  '整改完成率',
    value:  '96',
    unit:   '%',
    delta:  3,
    icon:   Finished,
    iconBg: 'rgba(255,255,255,.18)',
  },
  {
    label:  '待办事项',
    value:  7,
    unit:   '条',
    delta:  -2,
    icon:   Bell,
    iconBg: 'rgba(255,255,255,.18)',
  },
  {
    label:  '全覆盖率',
    value:  '100',
    unit:   '%',
    delta:  undefined,
    icon:   DataAnalysis,
    iconBg: 'rgba(255,255,255,.18)',
  },
])

// ════════════════════════════════════════════════
//  快捷入口
// ════════════════════════════════════════════════
const quickEntries = ref([
  { key: 'plan',     label: '巡察计划', icon: Calendar,        bg: 'rgba(198,47,47,.1)',   color: '#c62f2f', badge: null },
  { key: 'prepare',  label: '巡前准备', icon: DocumentChecked, bg: 'rgba(255,149,0,.1)',   color: '#ff9500', badge: null },
  { key: 'impl',     label: '巡察实施', icon: TrendCharts,     bg: 'rgba(52,199,89,.1)',   color: '#34c759', badge: 3 },
  { key: 'daily',    label: '日常监督', icon: Search,          bg: 'rgba(0,122,255,.1)',   color: '#007aff', badge: null },
  { key: 'rectify',  label: '整改管理', icon: Setting,         bg: 'rgba(88,86,214,.1)',   color: '#5856d6', badge: 2 },
  { key: 'talent',   label: '人才管理', icon: UserFilled,      bg: 'rgba(255,45,85,.1)',   color: '#ff2d55', badge: null },
  { key: 'report',   label: '工作报告', icon: List,            bg: 'rgba(90,200,250,.15)', color: '#0094c6', badge: null },
  { key: 'todo',     label: '我的待办', icon: Bell,            bg: 'rgba(252,218,80,.2)',  color: '#b8860b', badge: 7 },
])

// ════════════════════════════════════════════════
//  统计图数据（每条携带 year / company 字段供过滤）
// ════════════════════════════════════════════════
const chartData = ref({
  month: [
    // 2025 全部企业汇总
    { label: '1月',  planned: 3,  completed: 3,  rate: 100, year: '2025', company: '全部' },
    { label: '2月',  planned: 2,  completed: 2,  rate: 100, year: '2025', company: '全部' },
    { label: '3月',  planned: 4,  completed: 3,  rate: 75,  year: '2025', company: '全部' },
    { label: '4月',  planned: 3,  completed: 3,  rate: 100, year: '2025', company: '全部' },
    { label: '5月',  planned: 2,  completed: 2,  rate: 100, year: '2025', company: '全部' },
    { label: '6月',  planned: 3,  completed: 2,  rate: 67,  year: '2025', company: '全部' },
    { label: '7月',  planned: 2,  completed: 1,  rate: 50,  year: '2025', company: '全部' },
    { label: '8月',  planned: 3,  completed: 3,  rate: 100, year: '2025', company: '全部' },
    { label: '9月',  planned: 2,  completed: 2,  rate: 100, year: '2025', company: '全部' },
    { label: '10月', planned: 2,  completed: 1,  rate: 50,  year: '2025', company: '全部' },
    { label: '11月', planned: 1,  completed: 1,  rate: 100, year: '2025', company: '全部' },
    { label: '12月', planned: 1,  completed: 0,  rate: 0,   year: '2025', company: '全部' },
    // 2024 历史数据
    { label: '1月',  planned: 2,  completed: 2,  rate: 100, year: '2024', company: '全部' },
    { label: '2月',  planned: 3,  completed: 3,  rate: 100, year: '2024', company: '全部' },
    { label: '3月',  planned: 2,  completed: 1,  rate: 50,  year: '2024', company: '全部' },
    { label: '4月',  planned: 3,  completed: 3,  rate: 100, year: '2024', company: '全部' },
    { label: '5月',  planned: 4,  completed: 4,  rate: 100, year: '2024', company: '全部' },
    { label: '6月',  planned: 2,  completed: 2,  rate: 100, year: '2024', company: '全部' },
    { label: '7月',  planned: 1,  completed: 1,  rate: 100, year: '2024', company: '全部' },
    { label: '8月',  planned: 2,  completed: 2,  rate: 100, year: '2024', company: '全部' },
    { label: '9月',  planned: 3,  completed: 2,  rate: 67,  year: '2024', company: '全部' },
    { label: '10月', planned: 2,  completed: 2,  rate: 100, year: '2024', company: '全部' },
    { label: '11月', planned: 2,  completed: 2,  rate: 100, year: '2024', company: '全部' },
    { label: '12月', planned: 2,  completed: 2,  rate: 100, year: '2024', company: '全部' },
  ],
  quarter: [
    { label: 'Q1', planned: 9,  completed: 8,  rate: 89, year: '2025', company: '全部' },
    { label: '第二季度', planned: 8,  completed: 7,  rate: 88, year: '2025', company: '全部' },
    { label: '第三季度', planned: 7,  completed: 6,  rate: 86, year: '2025', company: '全部' },
    { label: '第四季度', planned: 4,  completed: 1,  rate: 25, year: '2025', company: '全部' },
    { label: 'Q1', planned: 7,  completed: 6,  rate: 86, year: '2024', company: '全部' },
    { label: '第二季度', planned: 9,  completed: 9,  rate: 100, year: '2024', company: '全部' },
    { label: '第三季度', planned: 6,  completed: 5,  rate: 83, year: '2024', company: '全部' },
    { label: '第四季度', planned: 6,  completed: 6,  rate: 100, year: '2024', company: '全部' },
  ],
})

// InspectionChart 已内置统计计算，chartSummary 保留供其他地方使用
const chartSummary = ref([
  { label: '年度计划',   value: '28',  color: '#c62f2f' },
  { label: '已完成',     value: '22',  color: '#34c759' },
  { label: '进行中',     value: '3',   color: '#ff9500' },
  { label: '整体完成率', value: '96%', color: '#007aff' },
])

// 企业列表传给图表组件做单位过滤
const chartCompanyList = ref(['全部'])

// ════════════════════════════════════════════════
//  整改完成情况数据
//  字段说明：
//    total     — 问题总数
//    rectified — 已整改数
//    rate      — 整改率（%）
//    overdue   — 逾期未整改数（可选，用于摘要条）
//    year / company — 过滤键（同 chartData）
// ════════════════════════════════════════════════
const rectifyChartData = ref({
  month: [
    { label: '1月',  total: 12, rectified: 12, rate: 100, overdue: 0, year: '2025', company: '全部' },
    { label: '2月',  total: 8,  rectified: 8,  rate: 100, overdue: 0, year: '2025', company: '全部' },
    { label: '3月',  total: 15, rectified: 13, rate: 87,  overdue: 1, year: '2025', company: '全部' },
    { label: '4月',  total: 10, rectified: 10, rate: 100, overdue: 0, year: '2025', company: '全部' },
    { label: '5月',  total: 9,  rectified: 8,  rate: 89,  overdue: 0, year: '2025', company: '全部' },
    { label: '6月',  total: 14, rectified: 11, rate: 79,  overdue: 2, year: '2025', company: '全部' },
    { label: '7月',  total: 11, rectified: 9,  rate: 82,  overdue: 1, year: '2025', company: '全部' },
    { label: '8月',  total: 7,  rectified: 7,  rate: 100, overdue: 0, year: '2025', company: '全部' },
    { label: '9月',  total: 13, rectified: 12, rate: 92,  overdue: 0, year: '2025', company: '全部' },
    { label: '10月', total: 6,  rectified: 5,  rate: 83,  overdue: 1, year: '2025', company: '全部' },
    { label: '11月', total: 8,  rectified: 6,  rate: 75,  overdue: 2, year: '2025', company: '全部' },
    { label: '12月', total: 5,  rectified: 2,  rate: 40,  overdue: 0, year: '2025', company: '全部' },
    // 2024 历史
    { label: '1月',  total: 10, rectified: 10, rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '2月',  total: 7,  rectified: 7,  rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '3月',  total: 12, rectified: 10, rate: 83,  overdue: 1, year: '2024', company: '全部' },
    { label: '4月',  total: 9,  rectified: 9,  rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '5月',  total: 11, rectified: 11, rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '6月',  total: 8,  rectified: 8,  rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '7月',  total: 6,  rectified: 5,  rate: 83,  overdue: 0, year: '2024', company: '全部' },
    { label: '8月',  total: 9,  rectified: 9,  rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '9月',  total: 13, rectified: 11, rate: 85,  overdue: 1, year: '2024', company: '全部' },
    { label: '10月', total: 7,  rectified: 7,  rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '11月', total: 8,  rectified: 8,  rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '12月', total: 10, rectified: 10, rate: 100, overdue: 0, year: '2024', company: '全部' },
  ],
  quarter: [
    { label: '第一季度', total: 35, rectified: 33, rate: 94, overdue: 1, year: '2025', company: '全部' },
    { label: '第二季度', total: 33, rectified: 29, rate: 88, overdue: 2, year: '2025', company: '全部' },
    { label: '第三季度', total: 31, rectified: 28, rate: 90, overdue: 1, year: '2025', company: '全部' },
    { label: '第四季度', total: 19, rectified: 13, rate: 68, overdue: 3, year: '2025', company: '全部' },
    { label: '第一季度', total: 29, rectified: 27, rate: 93, overdue: 1, year: '2024', company: '全部' },
    { label: '第二季度', total: 28, rectified: 28, rate: 100, overdue: 0, year: '2024', company: '全部' },
    { label: '第三季度', total: 28, rectified: 25, rate: 89, overdue: 1, year: '2024', company: '全部' },
    { label: '第四季度', total: 25, rectified: 25, rate: 100, overdue: 0, year: '2024', company: '全部' },
  ],
})

// ════════════════════════════════════════════════
//  待办事项
// ════════════════════════════════════════════════
const todoList = ref([
  { id: 1,  title: '审批"航飞公司2025年度巡察计划"',   type: '巡察计划', priority: 'urgent', from: '王主任',   deadline: '2025-03-06' },
  { id: 2,  title: '完成第三轮巡察整改验收报告',         type: '整改任务', priority: 'urgent', from: '系统提醒', deadline: '2025-03-05' },
  { id: 3,  title: '填报2025年第一季度巡察工作总结',     type: '巡察计划', priority: 'high',   from: '办公室',   deadline: '2025-03-10' },
  { id: 4,  title: '核实长飞公司整改落实情况',           type: '整改任务', priority: 'high',   from: '纪委',     deadline: '2025-03-12' },
  { id: 5,  title: '日常监督巡查记录归档',               type: '日常监督', priority: 'normal', from: '系统',     deadline: '2025-03-15' },
  { id: 6,  title: '专项巡察方案审批',                   type: '审批流程', priority: 'urgent', from: '领导',     deadline: '2025-03-07' },
  { id: 7,  title: '提交民航产业园区巡察底稿',           type: '巡察计划', priority: 'normal', from: '组长',     deadline: '2025-03-18' },
])

// ════════════════════════════════════════════════
//  资源共享数据
// ════════════════════════════════════════════════
const resourceData = ref({
  regulation: [
    { id: 1, title: '2025年12月份整治争秀文化工作制度', department: '巡察办', date: '12-30',
      summary: '本制度旨在规范2025年12月巡察工作中的廉洁文化建设要求，明确各责任主体的履职边界。',
      content: `<h2>一、总则</h2><p style="text-indent:2em">为深入推进廉洁文化建设，根据上级有关部署，结合本单位实际，制定本制度。</p><h2>二、主要内容</h2><p style="text-indent:2em">各部门须在本月内完成廉洁文化学习教育活动，重点围绕以下三个方面开展：</p><ol><li>组织全体干部职工参加廉洁从业专题培训，培训时长不少于4课时；</li><li>开展廉洁文化主题征文或演讲活动，每单位提交不少于2篇优秀作品；</li><li>完善廉洁风险防控台账，对新增高风险岗位进行登记备案。</li></ol><h2>三、工作要求</h2><p style="text-indent:2em">各单位须于本月25日前将活动开展情况总结报送巡察办，逾期未报视为未完成。</p><blockquote>本制度自发布之日起执行，由巡察工作领导小组办公室负责解释。</blockquote>` },
    { id: 2, title: '2025年11月份落实思想文化工作制度', department: '纪委', date: '11-28',
      content: `<p style="text-indent:2em">本制度是11月份思想文化工作落实的规范性文件，主要涵盖党员教育管理、廉洁文化宣传、巡察整改跟踪三个模块。</p><h2>一、党员教育管理</h2><p style="text-indent:2em">各支部须按时完成11月"三会一课"任务，支部书记亲自讲党课，不得委托他人代讲。</p><h2>二、廉洁文化宣传</h2><p style="text-indent:2em">利用宣传栏、内部网站等渠道，每周发布不少于1篇廉洁文化主题内容。</p>` },
    { id: 3, title: '2025年四季度传播思想文化工作指南', department: '党委', date: '10-15',
      content: `<p style="text-indent:2em">本指南适用于四季度全系统思想文化传播工作，重点指导基层单位规范开展相关活动。</p>` },
    { id: 4, title: '2025年9月份党务传播思想文化工作制度', department: '巡察办', date: '09-20',
      content: `<p style="text-indent:2em">本制度明确9月份党务工作中思想文化传播的具体要求和考核标准。</p>` },
    { id: 5, title: '2025年6月份党务传播思想文化工作制度', department: '纪委', date: '06-18',
      content: `<p style="text-indent:2em">6月份制度要求各单位结合党史学习教育，深入推进廉洁文化进基层活动。</p>` },
    { id: 6, title: '巡察工作保密规定及操作规程', department: '办公室', date: '05-10',
      summary: '本规程规定了巡察工作全过程的保密要求，适用于巡察准备、实施、反馈各阶段。',
      content: `<h2>第一章 总则</h2><p style="text-indent:2em">为维护巡察工作秩序，防止巡察信息泄露，依据有关保密法规，制定本规定。</p><h2>第二章 保密范围</h2><p style="text-indent:2em">下列事项属于巡察工作秘密：</p><ol><li>巡察对象名单及巡察时间安排；</li><li>巡察工作方案及重点检查事项；</li><li>巡察过程中掌握的问题线索及证据材料；</li><li>巡察报告及反馈意见。</li></ol><h2>第三章 操作规程</h2><p style="text-indent:2em">巡察人员须严格遵守以下操作规程：不得在非保密场所讨论巡察工作；不得使用个人设备存储巡察材料；不得向无关人员透露巡察进展。</p>` },
  ],
  speech: [
    { id: 7, title: '书记在2025年巡察工作会议上的讲话', department: '党委', date: '01-15',
      summary: '书记在年度巡察工作会议上就深化政治巡察、强化整改落实、压实主体责任等问题作出重要指示。',
      content: `<p style="text-indent:2em">同志们：</p><p style="text-indent:2em">今天，我们召开2025年度巡察工作会议，主要任务是总结2024年工作，部署2025年重点任务。</p><h2>一、2024年工作成效</h2><p style="text-indent:2em">过去一年，巡察工作取得了积极成效。全年完成巡察计划28项，整改率达到96%，较上年提升3个百分点。</p><h2>二、2025年重点任务</h2><p style="text-indent:2em">2025年，我们要重点做好以下几项工作：</p><ol><li><strong>深化政治巡察</strong>：紧紧围绕"两个维护"，聚焦政治问题，发挥政治监督作用；</li><li><strong>强化整改落实</strong>：建立整改台账，逐项对账销号，确保整改工作见底见效；</li><li><strong>压实主体责任</strong>：各级党委要把巡察工作纳入党建考核，一级抓一级，层层传导压力。</li></ol><blockquote>巡察工作任重道远，我们要以高度的政治责任感，扎实推进各项工作落实。</blockquote>` },
    { id: 8, title: '纪委书记关于加强日常监督的重要指示', department: '纪委', date: '02-20',
      content: `<p style="text-indent:2em">关于加强日常监督工作，纪委书记强调：日常监督是巡察工作的基础，要把监督融入日常、抓在经常，不能等问题积累了才去处理。</p>` },
    { id: 9, title: '巡察组组长在整改推进会上的发言', department: '巡察组', date: '03-05',
      content: `<p style="text-indent:2em">在整改推进会上，巡察组组长通报了当前整改工作进展，重点提示了几个共性问题的整改难点，并提出了下一步工作建议。</p>` },
  ],
  report: [
    { id: 10, title: '关于传达贯彻上级巡察精神的通知', department: '办公室', date: '12-01',
      content: `<p style="text-indent:2em">近期，上级巡察工作领导小组召开专题会议，对下一阶段巡察工作作出重要部署。现将有关精神传达如下，请各单位认真学习贯彻。</p>` },
    { id: 11, title: '中央巡视组2024年度工作报告要点', department: '纪委', date: '11-10',
      summary: '本报告提炼了中央巡视组2024年度工作的主要成效、典型做法及下一步部署要求。',
      content: `<h2>一、2024年主要工作成效</h2><p style="text-indent:2em">2024年，中央巡视组共完成X轮次巡视，覆盖单位X个，发现问题X个，推动解决重大问题X件。</p><h2>二、典型经验做法</h2><p style="text-indent:2em">各巡视组在工作中积累了宝贵经验，主要包括：坚持政治巡视定位、注重发现问题线索、强化成果运用转化三个方面。</p><h2>三、2025年工作要求</h2><p style="text-indent:2em">2025年，各地区各部门要认真落实巡视整改要求，确保问题件件有着落、条条有回音。</p>` },
  ],
  training: [
    { id: 12, title: '巡察工作实务操作培训材料（第三期）', department: '培训中心', date: '10-08',
      summary: '本期培训材料聚焦巡察工作中的档案管理、谈话技巧、问题线索处置三个实务模块。',
      content: `<h2>模块一：巡察档案管理规范</h2><p style="text-indent:2em">档案是巡察成果的重要载体，规范的档案管理是依法依规开展巡察工作的基本要求。本模块介绍档案的收集、整理、归档、保管全流程规范。</p><h2>模块二：谈话技巧与方法</h2><p style="text-indent:2em">谈话是巡察工作的重要手段。本模块从谈话前准备、谈话中把控、谈话后总结三个维度，提供实用操作指导。</p><h2>模块三：问题线索处置流程</h2><p style="text-indent:2em">问题线索处置须严格按照"收、查、报、移"四步流程进行，每一环节均有明确的时限要求和责任主体。</p>` },
    { id: 13, title: '新入职巡察干部岗前培训手册', department: '人事处', date: '09-01',
      content: `<p style="text-indent:2em">本手册适用于新入职巡察干部，涵盖岗位职责、工作纪律、业务规范、廉洁从业四个板块，是岗前培训的必读材料。</p>` },
  ],
  notice: [
    { id: 14, title: '关于开展2025年专项巡察工作的通知', department: '党委', date: '12-25',
      summary: '本通知明确了2025年专项巡察的工作目标、范围对象、时间安排和工作要求。',
      content: `<p style="text-indent:2em">各单位：</p><p style="text-indent:2em">根据年度工作部署，经研究决定，于2025年开展专项巡察工作。现将有关事项通知如下。</p><h2>一、工作目标</h2><p style="text-indent:2em">通过专项巡察，深入了解各单位贯彻落实党中央决策部署情况，推动全面从严治党向纵深发展。</p><h2>二、巡察对象</h2><p style="text-indent:2em">本次专项巡察对象为集团公司所属各一级单位，共计6个。</p><h2>三、时间安排</h2><p style="text-indent:2em">专项巡察工作于2025年3月启动，6月底前全部完成。</p><h2>四、工作要求</h2><p style="text-indent:2em">各单位要高度重视、积极配合，如实反映情况，不得干扰巡察工作正常开展。</p>` },
    { id: 15, title: '关于加强巡察档案管理的公告', department: '档案室', date: '11-30',
      content: `<p style="text-indent:2em">为进一步规范巡察档案管理工作，确保巡察成果有据可查、有案可循，现就有关事项公告如下：一是各单位须在巡察结束后30日内完成档案移交；二是电子档案须同步上传至档案管理系统；三是涉密档案须按保密规定单独保管。</p>` },
  ],
  special: [
    { id: 16, title: '关于开展廉洁文化建设专项行动的通知', department: '纪委', date: '12-18',
      content: `<p style="text-indent:2em">为深入推进廉洁文化建设，营造风清气正的政治生态，决定在全系统开展廉洁文化建设专项行动，重点从廉洁教育、制度建设、正风肃纪三个方面发力。</p>` },
    { id: 17, title: '关于整改"四风"问题专项督查通知', department: '巡察办', date: '12-05',
      content: `<p style="text-indent:2em">本次专项督查重点核查各单位"四风"问题整改落实情况，督查内容涵盖公务用车管理、办公用房使用、公务接待规范、节假日廉洁过节要求执行情况等。</p>` },
  ],
})

// ════════════════════════════════════════════════
//  企业开展情况
// ════════════════════════════════════════════════
const companyList = ref([
  {
    id: 'hangfei', name: '航飞',
    metrics: [
      { label: '全覆盖率',     value: '100%', color: '#34c759', percent: 100 },
      { label: '整改完成率',   value: '100%', color: '#007aff', percent: 100 },
      { label: '专职巡察人员', value: '5人',  color: '#c62f2f', percent: 80  },
    ],
    newsList: [
      { id: 1, title: '关于加强高边坡管理有关问题的回答', date: '03-15', company: '航飞',
        content: `<p style="text-indent:2em">针对巡察中发现的高边坡管理问题，公司工程部已组织专项整改，完成了全部8处隐患点的加固处理，并建立了高边坡巡查制度，每季度开展一次专项检查。</p>` },
      { id: 2, title: '关于党组织职责共建工作的若干问题', date: '03-10', company: '航飞',
        content: `<p style="text-indent:2em">为强化党组织建设，航飞公司党委制定了职责共建工作方案，明确党支部与行政部门的协同机制，确保党建工作与生产经营深度融合。</p>` },
      { id: 3, title: '2025年度航飞公司巡察工作全面启动', date: '02-28', company: '航飞',
        summary: '2025年度巡察工作正式启动，将重点检查党委主体责任落实、干部选拔用人、资产管理等情况。',
        content: `<p style="text-indent:2em">2025年2月28日，航飞公司2025年度巡察工作正式启动。本次巡察为期约3个月，将重点检查以下方面：</p><ol><li>党委班子贯彻执行党的路线方针政策情况；</li><li>党风廉政建设和反腐败工作情况；</li><li>干部选拔任用工作情况；</li><li>国有资产管理和财务资金使用情况。</li></ol><p style="text-indent:2em">请各部门积极配合，如实反映情况。</p>` },
      { id: 4, title: '第三批次整改完成情况汇报', date: '02-20', company: '航飞',
        content: `<p style="text-indent:2em">第三批次整改工作已全部完成。共涉及整改事项12项，已全部完成整改并通过验收。主要整改内容包括：财务报销流程规范化、会议记录补充完善、采购合同管理规范等。</p>` },
    ],
  },
  {
    id: 'changfei', name: '长飞',
    metrics: [
      { label: '全覆盖率',     value: '95%',  color: '#34c759', percent: 95 },
      { label: '整改完成率',   value: '88%',  color: '#007aff', percent: 88 },
      { label: '专职巡察人员', value: '4人',  color: '#c62f2f', percent: 70 },
    ],
    newsList: [
      { id: 5, title: '长飞公司2025年巡察工作部署会召开', date: '03-12', company: '长飞',
        content: `<p style="text-indent:2em">3月12日，长飞公司召开2025年巡察工作部署会，传达了上级巡察工作要求，明确了本年度巡察重点和时间节点，各部门负责人参加会议并表态发言。</p>` },
      { id: 6, title: '整改问题台账清单更新公示', date: '03-05', company: '长飞',
        content: `<p style="text-indent:2em">根据巡察整改要求，长飞公司整改工作领导小组对整改台账进行了第三次更新，现将更新后的问题清单予以公示，接受各方监督。尚未完成整改的问题共计8项，将于6月底前全部整改到位。</p>` },
      { id: 7, title: '日常监督典型案例通报', date: '02-25', company: '长飞',
        content: `<p style="text-indent:2em">为发挥典型案例的警示教育作用，现将近期日常监督中发现的2起典型案例予以通报。案例一：某部门负责人未经集体决策擅自动用专项资金；案例二：个别干部违反廉洁从业规定，收受管理对象礼品。</p>` },
    ],
  },
  {
    id: 'minhang', name: '民航',
    metrics: [
      { label: '全覆盖率',     value: '90%',  color: '#34c759', percent: 90 },
      { label: '整改完成率',   value: '92%',  color: '#007aff', percent: 92 },
      { label: '专职巡察人员', value: '3人',  color: '#c62f2f', percent: 60 },
    ],
    newsList: [
      { id: 8, title: '民航产业园区专项巡察完成', date: '03-08', company: '民航',
        content: `<p style="text-indent:2em">经过为期45天的深入巡察，民航产业园区专项巡察工作于3月8日正式完成。巡察组共走访部门18个，开展个别谈话56人次，调阅资料200余份，归纳整理问题线索若干，将依程序移交处理。</p>` },
      { id: 9, title: '关于推进民航廉洁文化建设的意见', date: '02-18', company: '民航',
        content: `<p style="text-indent:2em">为进一步加强廉洁文化建设，民航公司党委提出以下工作意见：一是将廉洁文化纳入企业文化建设总体规划；二是建立廉洁从业积分管理机制；三是每年组织廉洁文化主题活动不少于4次。</p>` },
    ],
  },
  {
    id: 'chanye', name: '产业',
    metrics: [
      { label: '全覆盖率',     value: '85%',  color: '#ff9500', percent: 85 },
      { label: '整改完成率',   value: '78%',  color: '#007aff', percent: 78 },
      { label: '专职巡察人员', value: '3人',  color: '#c62f2f', percent: 60 },
    ],
    newsList: [
      { id: 10, title: '产业集团2025年巡察工作推进会纪要', date: '03-01', company: '产业',
        content: `<p style="text-indent:2em">2025年3月1日，产业集团召开巡察工作推进会，会议通报了2024年巡察整改完成情况，分析了当前存在的主要问题，并对2025年巡察重点工作作出部署。会议强调，要把整改落实作为当前最紧迫的工作任务，逐项销号、不留尾巴。</p>` },
      { id: 11, title: '问题整改专项行动月报（2月）', date: '02-28', company: '产业',
        content: `<p style="text-indent:2em">2025年2月，产业集团问题整改专项行动稳步推进。本月新完成整改事项3项，累计完成率达78%。剩余未完成事项主要集中在制度建设和长效机制建立方面，预计4月底前可全部完成。</p>` },
    ],
  },
  {
    id: 'wurenjj', name: '无人机',
    metrics: [
      { label: '全覆盖率',     value: '80%',  color: '#ff9500', percent: 80 },
      { label: '整改完成率',   value: '75%',  color: '#ff9500', percent: 75 },
      { label: '专职巡察人员', value: '2人',  color: '#c62f2f', percent: 40 },
    ],
    newsList: [
      { id: 12, title: '无人机公司首次巡察工作顺利完成', date: '02-20', company: '无人机',
        content: `<p style="text-indent:2em">无人机公司于2025年2月完成了首次专项巡察。作为新成立的子公司，本次巡察着重检查了党组织建设、廉洁从业制度执行、国有资产管理三个方面，发现问题若干，已制定整改方案，正在有序推进整改。</p>` },
      { id: 13, title: '专项整改进展情况通报', date: '02-10', company: '无人机',
        content: `<p style="text-indent:2em">截至2月10日，无人机公司首次巡察发现问题的整改工作已完成75%。其中，立行立改类问题已全部完成；制度建设类问题正在起草相关规章；深层次问题正在深入研究解决方案。</p>` },
    ],
  },
  {
    id: 'huiyi', name: '会议',
    metrics: [
      { label: '全覆盖率',     value: '100%', color: '#34c759', percent: 100 },
      { label: '整改完成率',   value: '100%', color: '#34c759', percent: 100 },
      { label: '专职巡察人员', value: '2人',  color: '#c62f2f', percent: 40  },
    ],
    newsList: [
      { id: 14, title: '会议中心巡察整改全部完成', date: '01-30', company: '会议',
        content: `<p style="text-indent:2em">经过3个月的努力，会议中心巡察发现的全部问题整改工作已于1月30日完成，整改完成率达到100%。此次整改共涉及15项问题，建立制度规范3项，优化工作流程5项，完善台账管理7项。</p>` },
      { id: 15, title: '廉洁从业专项教育活动总结', date: '01-20', company: '会议',
        content: `<p style="text-indent:2em">会议中心廉洁从业专项教育活动圆满结束。本次活动历时1个月，全员参加率达100%，共开展廉洁教育讲座2场，组织参观警示教育基地1次，征集廉洁从业承诺书全员签署。</p>` },
    ],
  },
])

// ════════════════════════════════════════════════
//  事件处理
// ════════════════════════════════════════════════
const handleEntryClick   = item => console.log('快捷入口:', item.key)
const handleTodoClick    = item => console.log('待办点击:', item.title)
const handleTodoViewAll  = ()   => console.log('查看全部待办')
const handleResourceMore = ()   => console.log('资源共享更多')
const handleCompanyMore  = ()   => console.log('企业更多')

/**
 * 资源共享点击 → router.push 到 NewsDetail 路由
 * source: tab key（regulation / speech / report / training / notice / special）
 * related: 同 tab 其他条目（精简为 id/title/date，JSON 序列化传入 query）
 */
function handleResourceClick(item, source = 'resource') {
  const allItems = Object.values(resourceData.value).flat()
  const siblings = allItems
    .filter(s => s.id !== item.id)
    .slice(0, 5)
    .map(s => ({ id: s.id, title: s.title, date: s.date }))

  router.push({
    name:  'NewsDetail',
    query: {
      id:      item.id,
      source:  source || 'resource',
      title:   item.title,
      date:    item.date,
      dept:    item.department ?? '',
      related: JSON.stringify(siblings),
    },
  })
}

/**
 * 企业动态新闻点击 → router.push 到 NewsDetail 路由
 * company: { id, name } — CompanyProgress 传入
 */
function handleNewsClick(item, company) {
  const co = companyList.value.find(c => c.id === company?.id || c.name === company?.name)
  const siblings = (co?.newsList ?? [])
    .filter(s => s.id !== item.id)
    .slice(0, 5)
    .map(s => ({ id: s.id, title: s.title, date: s.date }))

  router.push({
    name:  'NewsDetail',
    query: {
      id:      item.id,
      source:  'company',
      title:   item.title,
      date:    item.date,
      co:      item.company ?? company?.name ?? '',
      related: JSON.stringify(siblings),
    },
  })
}


// 长期公示（领导架构面板下方，permanent 为 true 表示长期有效）
// TODO: 后续通过接口动态传入
const pinnedNotices = ref([
  { id: 'pn1', title: '领导干部廉洁从业承诺书公示（2023—2027年）', dept: '纪委办', date: '2023-01-01', permanent: true },
  { id: 'pn2', title: '现任领导班子任职情况及分工说明',             dept: '党委办', date: '2024-03-15', permanent: true },
  { id: 'pn3', title: '领导班子联系点工作开展情况通报',             dept: '巡察办', date: '2025-01-10', permanent: false },
])

// ════════════════════════════════════════════════
//  履职情况 — 会议精神
// ════════════════════════════════════════════════
// 置顶通知（长期置顶，permanent 为 true 表示长期有效）
// TODO: 后续通过接口动态传入
const pinnedMeetings = ref([
  { id: 'pm1', title: '关于进一步加强巡察工作的若干要求（长期执行）', dept: '党委办', date: '2023-06-01', permanent: true },
  { id: 'pm2', title: '2023—2027年巡察工作五年规划纲要',             dept: '巡察办', date: '2023-01-15', permanent: true },
])

const meetingList = ref([
  { id: 'm1', title: '2025年第一季度巡察工作推进会会议纪要',   dept: '巡察办', day: '15', month: '04月', type: 'important', typeLabel: '重要' },
  { id: 'm2', title: '党委扩大会议精神传达提纲（2025年3月）',  dept: '党委办', day: '28', month: '03月', type: 'important', typeLabel: '重要' },
  { id: 'm3', title: '整改工作专题会议纪要',                   dept: '纪委办', day: '20', month: '03月', type: 'special',   typeLabel: '专项' },
  { id: 'm4', title: '廉洁文化建设工作部署会要点',             dept: '党委办', day: '10', month: '03月', type: 'regular',   typeLabel: '例会' },
  { id: 'm5', title: '巡察反馈问题整改销号审核会议纪要',       dept: '巡察办', day: '05', month: '03月', type: 'special',   typeLabel: '专项' },
])

// 事件处理
const handleDutyNoticeClick = item => console.log('履职公告:', item.title)
const handleMeetingClick    = item => console.log('会议精神:', item.title)
const handleDutyMore        = ()   => console.log('履职情况更多')
</script>

<style scoped>
.home-page {
  padding: 20px 24px;
  background: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

/* 两列行 */
.row {
  display: grid;
  gap: 16px;
}

.row-main {
  grid-template-columns: 1fr 360px;
  align-items: stretch;
}

.row-bottom {
  grid-template-columns: 1fr 1fr 1fr;
  align-items: stretch;
}

.col-duty { min-height: 420px; }

@media (max-width: 1400px) {
  .row-bottom { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 1200px) {
  .row-bottom { grid-template-columns: 1fr; }
}

.col {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 各列高度 */
.col-chart  { min-height: 380px; }
.col-todo   { min-height: 380px; }
.col-resource { min-height: 420px; }
.col-company  { min-height: 420px; }

/* 大屏响应 */
@media (max-width: 1200px) {
  .row-main   { grid-template-columns: 1fr; }
  .row-bottom { grid-template-columns: 1fr; }
}
</style>