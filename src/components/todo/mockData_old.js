/*
 * @Author: fzq
 * @Date: 2026-03-05 15:06:21
 * @LastEditors: fzq
 * @LastEditTime: 2026-03-30 15:33:11
 * @Description: 
 * @FilePath: \flow\src\components\todo\mockData.js
 */
/**
 * mockData.js
 * 我的待办 / 我的申请 全部模拟数据
 * 所有字段与 FlowableWrapper API 对齐
 */

// 本地开发：直接 import 业务表单组件，赋给 viewComponentPath 字段
import PersonDetailForm from '/@/views/backend/inspection/secondment/todo/PersonDetailForm.vue'
import Deptpersonform from '/@/views/backend/inspection/secondment/todo/Deptpersonform.vue'
import InspectionGroupForm from '/@/views/backend/inspection/secondment/todo/InspectionGroupForm.vue'
import InspectionReviewForm from '/@/views/backend/inspection/secondment/todo/InspectionReviewForm.vue'
import MockApproveForm from './MockApproveForm.vue'

// ────────────────────────────────────────────────────────────────
//  通报正文 HTML（UMO 编辑器输出，main.js 中需全局引入）：
//    import '/@/assets/styles/umo-html-output.css'
//  附件/视频节点由 patchUmoHtml() 补丁处理
// ────────────────────────────────────────────────────────────────
const BULLETIN_HTML = `
<p style="text-align:center;font-size:17px;font-weight:bold;letter-spacing:2px;margin-bottom:18px">
  关于开展2026年度第一期日常监督工作的通报
</p>
<p style="text-indent:2em;line-height:2;margin-bottom:10px">
  根据年度日常监督工作计划，巡察监督管理局对下属各单位开展了2026年度第一期日常监督，
  现将发现的主要问题通报如下，请各接收单位认真对照，逐项填报问题条目并说明处置情况，
  于 <strong>2026年4月10日</strong> 前完成填报并提交审核。
</p>
<p style="text-indent:2em;line-height:2;margin-bottom:10px">
  本次监督重点关注以下方面：
</p>
<ol style="padding-left:2em;line-height:2;margin-bottom:14px">
  <li>党委班子成员执行政治纪律、政治规矩情况；</li>
  <li>重大财务事项审批程序合规情况；</li>
  <li>纪检监察工作台账管理及问题线索办理情况；</li>
  <li>干部选拔任用程序规范情况。</li>
</ol>
<p style="text-indent:2em;line-height:2;margin-bottom:18px">
  请各单位实事求是、如实填报，不得隐瞒、虚报或漏报，
  对填报内容的真实性负责。
</p>
<p style="text-align:right;line-height:2">巡察监督管理局</p>
<p style="text-align:right;line-height:2">2026年3月25日</p>
`
// ────────────────────────────────────────────────────────────────
//  各单位填写的问题条目（第1节点 BulletinIssueForm submit 后产出）
// ────────────────────────────────────────────────────────────────
const ISSUES_PARTY_OFFICE = [
  {
    issueId: 'I_P_001',
    issueSource: '2026年3月20日开展党委班子成员廉政谈话专项监督',
    issueDetail: '发现党委副书记在2025年度存在1次"三重一大"事项未经集体研究、个人直接拍板决策的情形，涉及一项金额超过300万元的办公楼翻新工程采购，违反"三重一大"集体决策制度规定。',
    responsibleDepts: [
      { id: 'ORG_PARTY', name: '党委办公室' },
      { id: 'ORG_INFRA', name: '基建管理部' },
    ],
    disposalStatus: '已就上述问题约谈党委副书记，责令作出书面检查并在班子会议上专题通报整改情况，建立健全集体决策台账，每月上报一次执行情况。',
    rectifyStatus: 'rectifying',
    attachments: [
      { name: '廉政谈话记录.pdf', size: 156000, url: '/mock/files/talk1.pdf' },
    ],
  },
  {
    issueId: 'I_P_002',
    issueSource: '2026年3月22日查阅近三年个人重大事项报告材料',
    issueDetail: '该同志2024年度申报表中未如实填报配偶名下投资经营情况，漏报事项涉及一家有限责任公司持股，违反个人重大事项如实申报规定。',
    responsibleDepts: [
      { id: 'ORG_PARTY', name: '党委办公室' },
    ],
    disposalStatus: '已责令于2026年4月底前补报，并纳入廉洁档案动态核查管理。',
    rectifyStatus: 'pending',
    attachments: [],
  },
  {
    issueId: 'I_P_003',
    issueSource: '2026年3月15日检查干部选拔任用档案',
    issueDetail: '发现1名中层干部提拔材料中缺少职工代表大会审议记录，提拔程序存在瑕疵。',
    responsibleDepts: [
      { id: 'ORG_PARTY', name: '党委办公室' },
      { id: 'ORG_HR', name: '人力资源部' },
    ],
    disposalStatus: '已暂停该干部到岗，重新启动任前公示程序并补充相关手续。',
    rectifyStatus: 'done',
    attachments: [],
  },
]

const ISSUES_FINANCE = [
  {
    issueId: 'I_F_001',
    issueSource: '2026年3月18日查阅2025年度财务报表及费用报销凭证',
    issueDetail: '2025年度存在48笔费用报销单据附件缺失，合计金额约12.6万元，其中餐饮类32笔、差旅类16笔，均未按规定附完整原始凭证。',
    responsibleDepts: [
      { id: 'ORG_FINANCE', name: '财务部' },
    ],
    disposalStatus: '已启动自查整改，对问题报销单据要求补充原始凭证，制度修订进行中，预计4月底完成。',
    rectifyStatus: 'rectifying',
    attachments: [
      { name: '费用报销问题明细清单.xlsx', size: 75600, url: '/mock/files/expense.xlsx' },
      { name: '整改方案.docx', size: 52000, url: '/mock/files/plan.docx' },
    ],
  },
  {
    issueId: 'I_F_002',
    issueSource: '2026年3月18日查阅工程款拨付审批记录',
    issueDetail: '发现2笔共计150万元的工程款拨付手续不完整，拨付时未附竣工验收报告，存在较高廉洁风险。',
    responsibleDepts: [
      { id: 'ORG_FINANCE', name: '财务部' },
      { id: 'ORG_INFRA', name: '基建管理部' },
    ],
    disposalStatus: '工程款问题已移交工程管理部门补办手续，同步核查经办人是否与施工方存在利益关联。',
    rectifyStatus: 'rectifying',
    attachments: [],
  },
  {
    issueId: 'I_F_003',
    issueSource: '2026年3月19日查阅公务用车使用台账',
    issueDetail: '2025年度公务用车费用较预算超支约23%，缺少超支审批记录，存在管理漏洞。',
    responsibleDepts: [
      { id: 'ORG_FINANCE', name: '财务部' },
      { id: 'ORG_ADMIN', name: '综合办公室' },
    ],
    disposalStatus: '已书面说明超支原因，完善用车审批流程，加强月度费用预算管控。',
    rectifyStatus: 'done',
    attachments: [],
  },
  {
    issueId: 'I_F_004',
    issueSource: '2026年3月20日查阅内部审计底稿',
    issueDetail: '2025年度内部审计发现的3个问题整改情况未按要求在年底前全部完成，尚有1个问题整改超期。',
    responsibleDepts: [
      { id: 'ORG_FINANCE', name: '财务部' },
    ],
    disposalStatus: '已制定补充整改计划，明确责任人和完成时限，督促加快整改进度。',
    rectifyStatus: 'overdue',
    attachments: [],
  },
]

const ISSUES_DISCIPLINE = [
  {
    issueId: 'I_D_001',
    issueSource: '2026年3月21日查阅信访举报台账及问题线索办理情况',
    issueDetail: '2025年度收到信访举报件37件，已办结32件，另有5件超期未办结，最长积压时间达9个月，违反信访办理时限规定。',
    responsibleDepts: [
      { id: 'ORG_DISCIPLINE', name: '纪检监察室' },
    ],
    disposalStatus: '已提交整改承诺书，承诺于2026年4月底前完成5件积压案件的处理，并建立案件督办台账。',
    rectifyStatus: 'rectifying',
    attachments: [
      { name: '信访举报件超期清单.xlsx', size: 41200, url: '/mock/files/letters.xlsx' },
    ],
  },
  {
    issueId: 'I_D_002',
    issueSource: '2026年3月21日查阅问题线索移送记录',
    issueDetail: '4件问题线索移送上级纪委的程序记录不完整，缺少书面移送函，不符合规范要求。',
    responsibleDepts: [
      { id: 'ORG_DISCIPLINE', name: '纪检监察室' },
    ],
    disposalStatus: '已补充完善4件移送函件，并修订完善问题线索移送操作规程。',
    rectifyStatus: 'done',
    attachments: [],
  },
]
// ────────────────────────────────────────────────────────────────
//  共用人员数据（两个任务复用）
// ────────────────────────────────────────────────────────────────
const SHARED_PLAN_INFO = {
  PlanName: '第二十届巡察人才选调计划',
  InspectionSession: '第二十届',
  InspectionYear: '2026',
  InspectionDepartMent: '组织部、财务部、纪检监察室、信息技术部',
  InspectionTime: '2026-04-01 至 2026-06-30',
  InspectionClassName: '第一巡察组、第二巡察组',
  InspectionObject: '党委委员、处级以上干部',
  InspectionContent: '重点巡察干部选拔任用、廉洁自律、贯彻执行上级决策部署等情况',
  CreateUser: '督察办',
  CreateTime: '2026-03-10 11:00:00',
}

const SHARED_GROUPS = [
  {
    groupName: '第一巡察组',
    members: [
      {
        userId: 'U001', userName: '赵一鸣', workNo: 'EMP001',
        currentPosition: '组织部科员', fromPool: false,
        phone: '138-0000-0001', specialty: '党政管理', nation: '汉族',
        healthStatus: '良好', partyJoinTime: '2015-06', workStartTime: '2013-07',
        fullTimeEducation: '本科', fullTimeDegree: '学士',
        fullTimeGraduateSchool: '武汉大学行政管理专业',
        professionalTitle: '助理政工师', annualAssessment: '近三年优秀',
        rewardPunishment: '无',
        resume: '2013-07—2016-06  组织部  助理\n2016-06—至今  组织部  科员',
      },
      {
        userId: 'P001', userName: '张志伟', workNo: 'P001',
        currentPosition: '审计部高级审计师', fromPool: true,
        phone: '139-1111-0001', specialty: '财务审计', nation: '汉族',
        healthStatus: '良好', partyJoinTime: '2012-09', workStartTime: '2010-07',
        fullTimeEducation: '本科', fullTimeDegree: '学士',
        fullTimeGraduateSchool: '中央财经大学审计专业',
        professionalTitle: '注册会计师', annualAssessment: '近三年优秀',
        rewardPunishment: '无',
        resume: '2010-07—2015-06  审计处  助理\n2015-06—至今  审计部  高级审计师',
      },
    ],
  },
  {
    groupName: '第二巡察组',
    members: [
      {
        userId: 'U002', userName: '李建国', workNo: 'EMP002',
        currentPosition: '财务部主管会计', fromPool: false,
        phone: '138-0000-0002', specialty: '财务审计', nation: '汉族',
        healthStatus: '良好', partyJoinTime: '2010-06', workStartTime: '2008-07',
        fullTimeEducation: '本科', fullTimeDegree: '学士',
        fullTimeGraduateSchool: '中南大学会计专业',
        professionalTitle: '高级会计师', annualAssessment: '近三年优秀',
        rewardPunishment: '无',
        resume: '2008-07—2013-06  财务处  会计\n2013-06—至今  财务部  主管会计',
      },
      {
        userId: 'U003', userName: '王晓燕', workNo: 'EMP003',
        currentPosition: '纪检监察室副主任', fromPool: false,
        phone: '138-0000-0003', specialty: '纪检监察', nation: '汉族',
        healthStatus: '良好', partyJoinTime: '2011-07', workStartTime: '2009-07',
        fullTimeEducation: '本科', fullTimeDegree: '学士',
        fullTimeGraduateSchool: '郑州大学法学专业',
        professionalTitle: '政工师', annualAssessment: '近三年良好',
        rewardPunishment: '2023年获优秀党员称号',
        resume: '2009-07—2014-05  综合办  干事\n2020-03—至今  纪检监察室  副主任',
      },
      {
        userId: 'U004', userName: '陈志勇', workNo: 'EMP004',
        currentPosition: '信息技术部高级工程师', fromPool: false,
        phone: '138-0000-0004', specialty: '信息安全', nation: '汉族',
        healthStatus: '良好', partyJoinTime: '2013-06', workStartTime: '2011-07',
        fullTimeEducation: '本科', fullTimeDegree: '学士',
        fullTimeGraduateSchool: '华中科技大学计算机专业',
        professionalTitle: '高级工程师', annualAssessment: '近三年优秀',
        rewardPunishment: '无',
        resume: '2011-07—2016-08  信息部  工程师\n2016-08—至今  信息技术部  高级工程师',
      },
    ],
  },
]

// ══════════════════════════════════════════════════════
//  完整人员详情（三条记录，供 task_014 和 MOCK_FORM_DATA 共用）
// ══════════════════════════════════════════════════════
const MOCK_RECOMMENDED_PERSONS = [
  {
    userId: 'U001',
    userName: '赵一鸣',
    workNo: 'EMP001',
    phone: '138-0000-0001',
    orgId: 'ORG002',
    orgName: '组织部',
    position: '组织部科员',
    currentPosition: '组织部科员',
    nation: '汉族',
    nativePlace: '湖北武汉',
    birthPlace: '湖北武汉',
    healthStatus: '良好',
    partyJoinTime: '2015-06',
    workStartTime: '2013-07',
    professionalTitle: '助理政工师',
    specialty: '党政管理、组织工作',
    fullTimeEducation: '本科',
    fullTimeDegree: '学士',
    fullTimeGraduateSchool: '武汉大学行政管理专业',
    onJobEducation: null,
    onJobDegree: null,
    onJobGraduateSchool: null,
    annualAssessment: '近三年优秀',
    rewardPunishment: '无',
    resume: '2013-07—2016-06  组织部  助理\n2016-06—至今  组织部  科员',
    recommendOpinion:'表现良好！'
  },
  {
    userId: 'U002',
    userName: '李建国',
    workNo: 'EMP002',
    phone: '138-0000-0002',
    orgId: 'ORG003',
    orgName: '财务部',
    position: '财务部主管会计',
    currentPosition: '财务部主管会计',
    nation: '汉族',
    nativePlace: '湖南长沙',
    birthPlace: '湖南长沙',
    healthStatus: '良好',
    partyJoinTime: '2010-06',
    workStartTime: '2008-07',
    professionalTitle: '高级会计师',
    specialty: '财务管理、审计',
    fullTimeEducation: '本科',
    fullTimeDegree: '学士',
    fullTimeGraduateSchool: '中南大学会计专业',
    onJobEducation: '在职研究生',
    onJobDegree: '硕士',
    onJobGraduateSchool: '中南财经政法大学',
    annualAssessment: '近三年优秀',
    rewardPunishment: '无',
    resume: '2008-07—2013-06  财务处  会计\n2013-06—2019-08  财务部  主管会计\n2019-08—至今  财务部  高级主管会计',
    recommendOpinion:'表现优异！'
  },
  {
    userId: 'U003',
    userName: '王晓燕',
    workNo: 'EMP003',
    phone: '138-0000-0003',
    orgId: 'ORG004',
    orgName: '纪检监察室',
    position: '纪检监察室副主任',
    currentPosition: '纪检监察室副主任',
    nation: '汉族',
    nativePlace: '河南郑州',
    birthPlace: '河南郑州',
    healthStatus: '良好',
    partyJoinTime: '2011-07',
    workStartTime: '2009-07',
    professionalTitle: '政工师',
    specialty: '纪检监察、党务工作',
    fullTimeEducation: '本科',
    fullTimeDegree: '学士',
    fullTimeGraduateSchool: '郑州大学法学专业',
    onJobEducation: null,
    onJobDegree: null,
    onJobGraduateSchool: null,
    annualAssessment: '近三年良好',
    rewardPunishment: '2023年获优秀党员称号',
    resume: '2009-07—2014-05  综合办  干事\n2014-05—2020-03  纪检监察室  科员\n2020-03—至今  纪检监察室  副主任',
    recommendOpinion:'表现一般！'
  },
]

// ═══════════════════════════════════════════════
//  组织架构 & 人员  (ContactSelector 所需)
// ═══════════════════════════════════════════════
export const mockOrgList = [
  { id: 'org_001', pid: null, name: '巡察监督管理局' },
  { id: 'org_002', pid: 'org_001', name: '巡察一室' },
  { id: 'org_003', pid: 'org_001', name: '巡察二室' },
  { id: 'org_004', pid: 'org_001', name: '综合办公室' },
  { id: 'org_005', pid: 'org_001', name: '法务合规室' },
  { id: 'org_006', pid: 'org_001', name: '财务审计室' },
]

export const mockUserList = [
  { id: 'u_001', name: '王局长', workNo: 'EMP001', phone: '138-0001-0001', position: '局长', orgId: 'org_001' },
  { id: 'u_002', name: '陈副局长', workNo: 'EMP002', phone: '138-0001-0002', position: '副局长', orgId: 'org_001' },
  { id: 'u_003', name: '李主任', workNo: 'EMP003', phone: '138-0002-0001', position: '主任', orgId: 'org_002' },
  { id: 'u_004', name: '张巡察', workNo: 'EMP004', phone: '138-0002-0002', position: '巡察专员', orgId: 'org_002' },
  { id: 'u_005', name: '赵巡察', workNo: 'EMP005', phone: '138-0002-0003', position: '巡察专员', orgId: 'org_002' },
  { id: 'u_006', name: '刘主任', workNo: 'EMP006', phone: '138-0003-0001', position: '主任', orgId: 'org_003' },
  { id: 'u_007', name: '周专员', workNo: 'EMP007', phone: '138-0003-0002', position: '巡察专员', orgId: 'org_003' },
  { id: 'u_008', name: '吴主任', workNo: 'EMP008', phone: '138-0004-0001', position: '主任', orgId: 'org_004' },
  { id: 'u_009', name: '郑法务', workNo: 'EMP009', phone: '138-0005-0001', position: '法务专员', orgId: 'org_005' },
  { id: 'u_010', name: '孙审计', workNo: 'EMP010', phone: '138-0006-0001', position: '审计专员', orgId: 'org_006' },
]

// ═══════════════════════════════════════════════
//  业务类型映射
// ═══════════════════════════════════════════════
export const businessTypeMap = {
  inspection_plan: { label: '巡察计划', color: 'primary' },
  rectify_task: { label: '整改任务', color: 'warning' },
  special_inspect: { label: '专项巡察', color: 'danger' },
  daily_supervise: { label: '日常监督', color: 'success' },
  report_submit: { label: '工作报告', color: 'info' },
}

// ═══════════════════════════════════════════════
//  优先级映射
// ═══════════════════════════════════════════════
export const priorityMap = {
  0: { label: '低', type: 'info' },
  1: { label: '普通', type: '' },
  2: { label: '高', type: 'warning' },
  3: { label: '紧急', type: 'danger' },
}

// ─────────────────────────────────────────────────────
//  四个对象的原始反馈数据（行管部门填写，全流程共用）
// ─────────────────────────────────────────────────────
const FEEDBACKS_BASE = [
  {
    objectId: 'obj_001',
    objectName: '党委班子成员',
    category: 'issue',
    issueSource: '查阅党委会议记录及"三重一大"事项审批台账',
    specificIssue: '2024年度有3次"三重一大"事项未经集体研究，由个别领导直接拍板决策，涉及金额合计约280万元；部分会议纪要缺失或记录不完整，存在事后补录迹象。',
    keypointContent: '',
    disposalStatus: '已要求党委全面梳理2023—2024年度"三重一大"决策事项，补齐会议纪要，对存在问题的事项进行专题研究，并完善决策流程制度。',
    referenceAdvice: '建议重点查阅2023—2024年度党委会议纪要原件、"三重一大"事项审批台账、大额资金审批流程单据。',
    remark: '已有2名班子成员就相关问题作出情况说明，材料已随附。',
    attachments: [
      { name: '三重一大决策事项问题清单.xlsx', size: 62300, url: '' },
      { name: '党委会议纪要缺失情况说明.docx', size: 88500, url: '' },
      { name: '班子成员情况说明（汇编）.pdf', size: 214000, url: '' },
    ],
  },
  {
    objectId: 'obj_002',
    objectName: '纪检监察室',
    category: 'keypoint',
    issueSource: '查阅信访举报台账及问题线索移送记录',
    specificIssue: '',
    keypointContent: '2024年度收到信访举报件37件，已办结32件，另有5件超期未办结，最长积压时间达9个月；问题线索移送上级纪委的程序记录不完整，4件缺少书面移送函。',
    disposalStatus: '',
    referenceAdvice: '建议重点查阅信访举报件受理登记台账、办结台账、问题线索移送原始函件及工作日志，关注超期未办案件的实际进展。',
    remark: '纪检监察室已提交整改承诺书，承诺于2026年4月底前完成5件积压案件的处理。',
    attachments: [
      { name: '信访举报件超期未办清单.xlsx', size: 41200, url: '' },
    ],
  },
  {
    objectId: 'obj_003',
    objectName: '财务部',
    category: 'issue',
    issueSource: '查阅2024年度财务报表、费用报销凭证及内部审计报告',
    specificIssue: '① 费用报销不规范：2024年度存在48笔报销单据附件缺失，合计金额约12.6万元；② 公务用车费用超标：全年用车费用较预算超支约23%，缺少超支审批记录；③ 工程款拨付手续不完整：有2笔共计150万元的工程款拨付未附竣工验收报告。',
    keypointContent: '',
    disposalStatus: '财务部已启动自查整改，对问题报销单据要求补充原始凭证；公务用车超支原因已书面说明；工程款问题已移交工程管理部门补办手续。',
    referenceAdvice: '建议重点查阅2024年度费用报销台账及原始凭证、公务用车使用记录与审批台账、工程款拨付申请及验收报告原件，并与内部审计底稿进行交叉核对。',
    remark: '财务部内部审计报告已另案提交，请一并参阅。',
    attachments: [
      { name: '费用报销问题明细清单.xlsx', size: 75600, url: '' },
      { name: '公务用车超标情况说明.docx', size: 52000, url: '' },
      { name: '工程款拨付问题清单.xlsx', size: 38400, url: '' },
      { name: '整改措施及责任分工表.docx', size: 96800, url: '' },
      { name: '2024年度内部审计报告（摘）.pdf', size: 430000, url: '' },
    ],
  },
  {
    objectId: 'obj_004',
    objectName: '人力资源部',
    category: 'issue',
    issueSource: '查阅干部选拔任用档案及考核记录',
    specificIssue: '2024年度有1名中层干部晋升过程中存在考核材料缺失，未按规定经职工代表大会审议；另有2名员工绩效考核结果与实际工作表现明显不符，存在人情打分迹象。',
    keypointContent: '',
    disposalStatus: '已要求人力资源部对涉及的干部选拔任用程序进行专项自查，补充完善相关档案材料；对绩效考核问题启动复核程序。',
    referenceAdvice: '建议重点查阅中层干部任职资格审查材料、职代会审议记录、绩效考核原始评分表及复核记录。',
    remark: '涉及干部个人的具体材料已按规定单独存档，可申请调阅。',
    attachments: [
      { name: '干部选拔任用问题说明.docx', size: 44800, url: '' },
    ],
  },
]

const BRIEFING_PLAN = {
  PlanID: 'P_2026_001',
  PlanName: '第一轮巡察计划（长飞公司）',
  InspectionSession: 20,
  InspectionYear: '2026',
  InspectionDepartMent: '长飞公司',
  InspectionTime: '2026年3月—5月',
  BriefingTime: '2026年3月10日—3月20日',   // 通报时间段（新增字段）
  InspectionContent: '重点检查党委班子成员及中层干部落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律和政治规矩行为；检查重点工程项目资金使用和廉洁从业情况；核查群众举报线索。',
  // 巡察对象列表（多对象面包屑导航所需）
  inspectionObjects: [
    { id: 'obj_001', name: '党委班子成员', role: '正职领导班子' },
    { id: 'obj_002', name: '纪检监察室', role: '重点监督部门' },
    { id: 'obj_003', name: '财务部', role: '职能部门' },
    { id: 'obj_004', name: '人力资源部', role: '职能部门' },
  ],
}

// ═══════════════════════════════════════════════
//  待办任务列表  (PendingTaskDto)
// ═══════════════════════════════════════════════
export const mockTodoList = [

  {
    taskId: 'task_B001_C',
    taskName: '巡察主管审核',
    createTime: '2026-03-19 09:00:00',
    businessType: 'inspection_plan',
    priority: 1,
    extraData: {
      viewComponentPath: 'DailyBulletin/BulletinChiefReviewForm',
      bulletinContent: BULLETIN_HTML,
      issues: ISSUES_FINANCE,
      managerOpinion: '经审核，财务部反馈的4条问题属实，整改方案基本可行。工程款拨付问题需重点跟踪，请分管领导予以关注。',
      leaderOpinion: '同意行管意见。工程款问题须补充审批链条核实材料，其余整改可推进。工程款问题描述补充后再行终审。',
      // 本节点待填
      chiefOpinion: '',
    },
  },
  {
    taskId: 'task_B001_L',
    taskName: '分管领导审批',
    createTime: '2026-03-19 09:00:00',
    businessType: 'inspection_plan',
    priority: 1,
    extraData: {
      viewComponentPath: 'DailyBulletin/BulletinLeaderApprovalForm',
      bulletinContent: BULLETIN_HTML,
      issues: ISSUES_FINANCE,
      // 行管审核意见（上游只读展示）
      managerOpinion: '经审核，财务部反馈的4条问题属实，整改方案基本可行。工程款拨付问题需重点跟踪，请分管领导予以关注。',
      // 本节点待填
      leaderOpinion: '',
    },
  },
  {
    taskId: 'task_B001_M',
    taskName: '行管领导审核',
    createTime: '2026-03-19 09:00:00',
    businessType: 'inspection_plan',
    priority: 1,
    extraData: {
      viewComponentPath: 'DailyBulletin/BulletinManagerReviewForm',
      // 通报正文（只读）
      bulletinContent: BULLETIN_HTML,
      // 上游已填的问题条目（只读展示，手风琴，可滚动）
      issues: ISSUES_FINANCE,
      // 本节点待填写（空 = 编辑态，有值 = 只读回填）
      managerOpinion: '',   // 编辑态
      // managerOpinion: '经审核，财务部反馈的4条问题属实，整改方案基本可行。工程款拨付问题需重点跟踪，请分管领导予以关注。',  // 只读态
    },
  },
  {
    taskId: 'task_B001_F',
    taskName: '问题条目填报',
    createTime: '2026-03-19 09:00:00',
    businessType: 'inspection_plan',
    priority: 1,
    extraData: {
      viewComponentPath: 'DailyBulletin/BulletinIssueForm',
      // 发起部门通报正文（只读展示）
      bulletinContent: BULLETIN_HTML,
      // 已填写的条目（初次打开为 []，回填场景传已填数据）
      issues: [],                    // 编辑态演示：空数组，用户填写
      // issues: ISSUES_FINANCE,     // 只读回填演示：取消注释
    },
  },
  {
    taskId: 'task_015',
    taskName: '巡察办审批',
    processInstanceId: 'proc_015',
    businessId: 'BIZ_2025_007',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-14 09:00:00',
    priority: 3,
    extraData: {
      title: '第二十届巡察人才选调 — 巡察办审批',
      applicant: '督察办',
      department: '巡察监督管理局',
      currentNodeName: '巡察办审批',

      // 注册 key，Componentregistry.js 中对应组件
      viewComponentPath: 'PersonnelSelection/InspectionOfficeApprovalForm',

      // 计划基本信息
      planInfo: SHARED_PLAN_INFO,

      // 巡察组人员配置（来自上游 InspectionGroupForm 节点透传）
      inspectionGroups: SHARED_GROUPS,

      // 上游审核意见（InspectionReviewForm 节点已填，只读展示）
      upstreamComment: '经审核，本次人才选调组建的两个巡察组人员结构合理，专业配置均衡，成员整体素质较好。第一巡察组赵一鸣、张志伟专长互补，适合承担财务及党政管理方向的巡察任务；第二巡察组李建国、王晓燕、陈志勇覆盖财务、纪检、信息安全三个领域，具备较强的综合检查能力。建议巡察办审批通过，按计划推进后续进驻工作。',

      // 本节点：巡察办审批意见（空字符串 = 待填写）
      approvalComment: '',
    },
  },
  {
    taskId: 'task_PRED_01',
    taskName: '行管领导审核（串行验证）',
    processInstanceId: 'proc_PRED_01',
    businessId: 'BIZ_PRED_01',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-19 09:00:00',
    priority: 1,
    extraData: {
      title: '预测API验证 — 串行节点',
      currentNodeName: '行管领导审核',
      viewComponentPath: MockApproveForm,   // 用 MockApproveForm 占位，无需真实表单
    },
  },

  // task_PRED_02：并行网关，下一步是两个并行分支
  {
    taskId: 'task_PRED_02',
    taskName: '综合审核（并行验证）',
    processInstanceId: 'proc_PRED_02',
    businessId: 'BIZ_PRED_02',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-19 09:05:00',
    priority: 1,
    extraData: {
      title: '预测API验证 — 并行网关',
      currentNodeName: '综合审核',
      viewComponentPath: MockApproveForm,
    },
  },

  // task_PRED_03：排他网关，下一步需要用户选择走哪条路
  {
    taskId: 'task_PRED_03',
    taskName: '金额审批（排他网关验证）',
    processInstanceId: 'proc_PRED_03',
    businessId: 'BIZ_PRED_03',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-19 09:10:00',
    priority: 2,
    extraData: {
      title: '预测API验证 — 排他网关（分支选择）',
      currentNodeName: '金额审批',
      viewComponentPath: MockApproveForm,
    },
  },
  {
    taskId: 'task_015',
    taskName: '巡察准备材料审核',
    processInstanceId: 'proc_015',
    businessId: 'BIZ_2026_015',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-15 09:00:00',
    priority: 2,
    extraData: {
      title: '第一轮巡察计划（长飞公司）— 准备材料审核',
      applicant: '张三',
      department: '巡察一室',
      viewComponentPath: 'InspectionPrep/InspectionPrepForm',  // 本地开发直接传组件对象

      // ── 以下是 InspectionPrepForm 所需的业务数据 ──
      plan: {
        PlanID: 'P001',
        PlanName: '第一轮巡察计划',
        InspectionDepartMent: '长飞公司',
        InspectionSession: 20,
        InspectionTime: '2026年3月—5月',
        InspectionObject: '党委班子成员',
        InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
      },
      files: [
        { name: '巡察通知函.docx', url: '/mock/巡察通知函.docx', size: 48640 },
        { name: '人员选调方案.pptx', url: '/mock/人员选调方案.pptx', size: 1258291 },
        { name: '廉政谈话记录模板.docx', url: '/mock/廉政谈话记录模板.docx', size: 36864 },
        { name: '巡察工作底稿.xlsx', url: '/mock/巡察工作底稿.xlsx', size: 204800 },
        { name: '相关资料归档.zip', url: '/mock/相关资料归档.zip', size: 5242880 },
      ],
      remark: '以上材料已完成初步整理，请领导审核确认后进入下一流程。',
      assignees: [
        { id: 'u_001', name: '王局长', position: '局长' },
        { id: 'u_002', name: '陈副局长', position: '副局长' },
      ],
    },
  },
  {
    taskId: 'task_2039',
    taskName: '一把手审批',
    processInstanceId: 'proc_014',
    businessId: 'BIZ_2025_014',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-14 09:00:00',
    priority: 3,
    extraData: {
      title: '第二十届巡察人才选调 — 一把手审批（组织部推荐名单）',
      applicant: '督察办',
      department: '组织部',
      viewComponentPath: 'PersonnelSelection/PersonReviewForm',  // ← 字符串 key，匹配 ComponentRegistry

      // ── 核心数据：来自上游 DeptPersonForm.submit() 写入的 Flowable variables ──
      // 后端在本节点把这些 variables 透传给前端 extraData
      recommendedPersons: MOCK_RECOMMENDED_PERSONS,
      recommendRemark: '两名同志专业能力突出，综合素质优秀，符合选调条件，建议一把手批准。',
    },
  },
  // ★ 分管领导审批（待办）
  {
    taskId: 'task_013',
    taskName: '分管领导审批',
    processInstanceId: 'proc_013',
    businessId: 'BIZ_2026_013',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-13 09:00:00',
    priority: 3,
    extraData: {
      title: '第二十届巡察 — 分管领导审批（长飞公司）',
      applicant: '督察办',
      department: '长飞公司',
      viewComponentPath: 'InspectionBriefing/BriefingLeaderApprovalForm',
      // 上游节点透传的完整字段
      plan: {
        PlanID: 'P_2026_001',
        PlanName: '第一轮巡察计划（长飞公司）',
        InspectionSession: 20,
        InspectionYear: '2026',
        InspectionDepartMent: '长飞公司',
        InspectionTime: '2026年3月—5月',
        BriefingTime: '2026年3月10日—3月20日',   // 通报时间段（新增字段）
        InspectionContent: '重点检查党委班子成员及中层干部落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律和政治规矩行为；检查重点工程项目资金使用和廉洁从业情况；核查群众举报线索。',
        // 巡察对象列表（多对象面包屑导航所需）
        inspectionObjects: [
          { id: 'obj_001', name: '党委班子成员', role: '正职领导班子' },
          { id: 'obj_002', name: '纪检监察室', role: '重点监督部门' },
          { id: 'obj_003', name: '财务部', role: '职能部门' },
          { id: 'obj_004', name: '人力资源部', role: '职能部门' },
        ],
      },
      // ── 上游各对象反馈数据（每对象含行管领导审核意见，本节点填分管领导审批意见）
      objectFeedbacks: [
        {
          ...FEEDBACKS_BASE[0],
          managerOpinion: '该对象"三重一大"决策程序失范问题属实，描述准确，整改措施基本到位。建议分管领导重点关注班子集体决策机制的长效落实，防止问题反弹。',
          leaderOpinion: '', // 本节点待填
        },
        {
          ...FEEDBACKS_BASE[1],
          managerOpinion: '纪检监察室信访积压及移送程序问题属实，整改承诺已收到。建议分管领导要求其制定明确整改时间表，巡察进驻后实地核查落实情况。',
          leaderOpinion: '',
        },
        {
          ...FEEDBACKS_BASE[2],
          managerOpinion: '财务部问题点多面广，涉及金额较大，工程款拨付问题存在廉洁风险。建议分管领导将此列为重点审批事项，授权巡察组进驻后深入调查。',
          leaderOpinion: '',
        },
        {
          ...FEEDBACKS_BASE[3],
          managerOpinion: '人力资源部干部选拔程序问题和绩效考核问题均需进一步核实，材料已基本齐全。建议分管领导指示巡察组重点关注是否存在干预用人的情形。',
          leaderOpinion: '',
        },
      ],
    },
  },

  // ★ 巡察主管审核（待办）
  {
    taskId: 'task_014',
    taskName: '巡察主管审核(张书记)',
    processInstanceId: 'proc_014',
    businessId: 'BIZ_2026_014',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-18 11:00:00',
    priority: 2,
    extraData: {
      title: '第一轮巡察计划（长飞公司）— 巡察主管审核',
      applicant: '李主任',
      department: '巡察一室',
      currentNodeName: '巡察主管审核',
      viewComponentPath: 'InspectionBriefing/BriefingChiefReviewForm',

      // ── 计划基本信息 ──────────────────────────────────────────
      plan: {
        PlanName: '长飞公司第二十届专项巡察',
        InspectionSession: 20,
        InspectionYear: '2026',
        InspectionDepartMent: '长飞光纤光缆股份有限公司',
        // inspectionObjects 驱动面包屑 / Tab / obj-overview
        inspectionObjects: [
          { id: 'obj_001', name: '党委书记' },
          { id: 'obj_002', name: '党委副书记' },
          { id: 'obj_003', name: '纪委书记' },
        ],
      },

      // ── 巡前通报内容（后端返回 HTML，v-html 渲染）────────────
      briefingContent: `
<p style="text-align:center;font-size:18px;font-weight:bold;letter-spacing:2px;margin-bottom:20px">
  关于开展第二十届巡察工作的巡前通报
</p>
<p style="text-indent:2em;line-height:2;margin-bottom:12px">
  根据年度巡察工作安排，经研究决定，于 <strong>2026年3月至5月</strong>
  对长飞公司开展第二十届专项巡察工作，通报时间段为 <strong>2026年2月至3月</strong>。
</p>
<p style="text-indent:2em;line-height:2;margin-bottom:8px">本次巡察重点关注以下事项：</p>
<ol style="padding-left:2em;line-height:2;margin-bottom:12px">
  <li>党委班子成员执行政治纪律、政治规矩情况；</li>
  <li>"三重一大"事项集体决策程序规范情况；</li>
  <li>干部选拔任用工作合规情况；</li>
  <li>廉洁从业规定执行情况及廉政风险防控情况。</li>
</ol>
<p style="text-indent:2em;line-height:2;margin-bottom:24px">
  请各相关单位积极配合，做好各项准备工作，确保巡察工作顺利开展。
</p>
<p style="text-align:right;line-height:2">巡察工作领导小组办公室</p>
<p style="text-align:right;line-height:2">2026年2月28日</p>
    `,

      // ── 上游各对象的反馈数据（新格式：每对象多条 entries）────
      // 党委书记：2条（1条问题类 + 1条重点关注类）
      // 党委副书记：1条（问题类）
      // 纪委书记：1条（重点关注类）
      // ── 每个巡察对象的反馈数据 ────────────────────────────────────
      // objectId 必须与 plan.inspectionObjects[].id 一一对应
      objectFeedbacks: [

        // 对象①：党委书记 —— 2条反馈（问题类 + 重点关注类）
        {
          objectId: 'obj_001',
          groupName: '第一巡察组',          // 联动「巡察组」
          inspectionTime: '2026年3月至5月',       // 联动「巡察时间段」
          briefingTime: '2026年2月至3月',       // 联动「通报时间段」
          managerOpinion: '"三重一大"决策程序失范及个人重大事项漏报问题属实，建议重点关注，责令制定专项整改方案。',
          leaderOpinion: '同意行管意见，进驻后优先调取原始会议材料核实，漏报事项要求4月底前补报。',
          entries: [
            {
              category: 'issue',
              issueSource: '2026年3月5日党委班子廉政谈话',
              specificIssue: '2025年度存在1次"三重一大"事项未经集体讨论擅自决策，涉及超200万元采购事项。',
              disposalStatus: '已责令书面说明，在班子会议专题通报，建立集体决策台账每月上报。',
              referenceAdvice: '建议查阅2025年度班子会议记录、采购审批文件及签到台账。',
              remark: '认错态度较好，已于3月12日完成整改。',
              attachments: [
                { name: '廉政谈话记录.pdf', size: 156000, url: '' },
                { name: '书面说明材料.docx', size: 48640, url: '' },
              ],
            },
            {
              category: 'keypoint',
              issueSource: '2026年3月8日查阅近三年个人重大事项申报材料',
              keypointContent: '2024年度申报表中未如实填报配偶名下投资经营情况，需重点关注申报完整性及整改落实。',
              referenceAdvice: '建议调阅近三年申报档案原件，与工商登记信息比对核实。',
              remark: '',
              attachments: [],
            },
          ],
        },

        // 对象②：党委副书记 —— 1条反馈（问题类）
        {
          objectId: 'obj_002',
          groupName: '第一巡察组',
          inspectionTime: '2026年3月15日至5月15日',
          briefingTime: '2026年3月1日至3月15日',
          managerOpinion: '干部选拔任用程序瑕疵问题属实，整改已启动，需跟进公示手续补办到位情况。',
          leaderOpinion: '同意。要求组织部门修订选人用人操作规程，举一反三全面自查。',
          entries: [
            {
              category: 'issue',
              issueSource: '2026年3月6日干部选拔任用专项检查',
              specificIssue: '1名中层干部提拔未完成7天任前公示即提前到岗履职，违反《党政领导干部选拔任用工作条例》。',
              disposalStatus: '已责令暂停履职，重新启动选拔程序，3月20日公示期满后正式任职。',
              referenceAdvice: '建议调阅提拔全套审批材料（考察报告、票决记录、公示公告）及到岗履职记录。',
              remark: '问题已于3月20日完成整改。',
              attachments: [
                { name: '干部任用审批材料.docx', size: 204800, url: '' },
              ],
            },
          ],
        },

        // 对象③：纪委书记 —— 1条反馈（重点关注类）
        {
          objectId: 'obj_003',
          groupName: '第二巡察组',
          inspectionTime: '2026年4月至5月',
          briefingTime: '2026年3月15日至3月31日',
          managerOpinion: '案件超期问题属实，3件超期案件已年初办结，整改承诺基本兑现，列重点关注。',
          leaderOpinion: '同意。要求书面分析超期原因，完善督办机制，关注是否存在选择性执法。',
          entries: [
            {
              category: 'keypoint',
              issueSource: '2026年3月7日查阅纪检监察工作台账',
              keypointContent: '2025年度有3件案件督办超60天时限，最长超期28天，需重点关注办理时效及督办机制完善。',
              referenceAdvice: '建议调阅近两年问题线索台账、督办记录及结案报告，核查超期案件原因与整改措施。',
              remark: '总体表现良好，超期案件已于2026年初全部办结。',
              attachments: [],
            },
          ],
        },

      ],

      // ★ managerOpinion / leaderOpinion / chiefOpinion 已移至 objectFeedbacks 各条里（per-object）
      // 巡察主管审核意见在 objectFeedbacks 每条的 chiefOpinion 字段，空字符串 = 本节点待填
    },
  },
  {
    taskId: 'task_001',
    taskName: '巡察计划审批',
    processInstanceId: 'proc_001',
    businessId: 'BIZ_2025_001',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2025-03-01 09:15:00',
    priority: 3,
    extraData: {
      title: '2025年度航飞公司巡察计划',
      applicant: '张巡察',
      department: '航飞公司',
      viewComponentPath: '@/views/inspection/InspectionPlanApprove.vue',
      nextViewComponentPath: '@/views/inspection/DirectorApprove.vue',
    },
  },
  {
    taskId: 'task_002',
    taskName: '整改验收审批',
    processInstanceId: 'proc_002',
    businessId: 'BIZ_2025_002',
    businessType: 'rectify_task',
    jumpUrl: null,
    jumpType: 'approve',

    createTime: '2025-03-02 10:30:00',
    priority: 2,
    extraData: {
      title: '第三轮巡察整改验收报告',
      applicant: '李主任',
      department: '长飞公司',
      viewComponentPath: '@/views/inspection/RectifyApprove.vue',
      nextViewComponentPath: '@/views/inspection/FinalApprove.vue',
    },
  },
  {
    taskId: 'task_003',
    taskName: '专项巡察方案审批（并行）',
    processInstanceId: 'proc_003',
    businessId: 'BIZ_2025_003',
    businessType: 'special_inspect',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2025-03-03 14:00:00',
    priority: 2,
    extraData: {
      title: '民航产业园区专项巡察方案',
      applicant: '刘主任',
      department: '民航产业',
      viewComponentPath: '@/views/inspection/SpecialInspectApprove.vue',
      // 并行网关，nextViewComponentPath 由各分支各自定
    },
  },
  {
    taskId: 'task_004',
    taskName: '工作报告审批（末节点）',
    processInstanceId: 'proc_004',
    businessId: 'BIZ_2025_004',
    businessType: 'report_submit',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2025-03-04 08:45:00',
    priority: 1,
    extraData: {
      title: '2025年第一季度巡察工作总结报告',
      applicant: '吴主任',
      department: '综合办公室',
      viewComponentPath: '@/views/inspection/ReportApprove.vue',
      // 下一步直接结束
    },
  },
  {
    taskId: 'task_005',
    taskName: '日常监督备案',
    processInstanceId: 'proc_005',
    businessId: 'BIZ_2025_005',
    businessType: 'daily_supervise',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2025-03-04 16:20:00',
    priority: 0,
    extraData: {
      title: '无人机公司2025年Q1日常监督记录',
      applicant: '周专员',
      department: '无人机公司',
      viewComponentPath: '@/views/inspection/DailySuperviseApprove.vue',
      nextViewComponentPath: '@/views/inspection/DirectorApprove.vue',
    },
  },
  {
    taskId: 'task_007',
    taskName: '部门人才推荐',
    processInstanceId: 'proc_007',
    businessId: 'BIZ_2025_007',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-10 09:00:00',
    priority: 2,
    extraData: {
      title: '第二十届巡察人才选调 — 组织部推荐',
      applicant: '督察办',
      department: '组织部',
      deptName: '组织部',
      viewComponentPath: Deptpersonform,  // 本地直接传组件对象
      nextViewComponentPath: '/@/views/personnelSelection/CollectionReview.vue',
    },
  },
  {
    taskId: 'task_008',
    taskName: '填写个人简历信息',
    processInstanceId: 'proc_008',
    businessId: 'BIZ_2025_008',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-10 10:00:00',
    priority: 2,
    extraData: {
      title: '第二十届巡察人才选调 — 个人信息填报',
      applicant: '督察办',
      department: '组织部',
      userId: 'U001',
      userName: '赵一鸣',
      viewComponentPath: 'PersonnelSelection/PersonDetailForm',  // 本地直接传组件对象
      // 下一步：督察办审核汇总（末节点示例）
    },
  },
  {
    taskId: 'task_009',
    taskName: '巡察组分组',
    processInstanceId: 'proc_009',
    businessId: 'BIZ_2025_009',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-10 11:00:00',
    priority: 3,
    extraData: {
      title: '第二十届巡察人才选调 — 巡察组分组',
      applicant: '督察办',
      department: '督察办',
      currentNodeName: '巡察组分组',
      nextNodeName: '督察办审核确认',
      viewComponentPath: InspectionGroupForm,
    },
  },
  {
    taskId: 'task_010',
    taskName: '巡察组分组审核',
    processInstanceId: 'proc_010',
    businessId: 'BIZ_2025_010',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-10 12:00:00',
    priority: 4,
    extraData: {
      title: '第二十届巡察人才选调 — 分组方案审核',
      applicant: '督察办',
      department: '督察办',
      currentNodeName: '领导审核',
      nextNodeName: '督察办归档',
      viewComponentPath: InspectionReviewForm,
      // 上游分组节点写入的 variables，由后端透传到此
      // ── 计划基础信息（固定字段：计划名称 / 届次 / 年份 / 兜底对象与时间段）──
      planInfo: {
        PlanName: '长飞公司第二十届专项巡察计划',
        InspectionSession: '第二十届',
        InspectionYear: '2026',
        // 以下两字段作为兜底，若组级无数据时展示
        InspectionObject: '党委班子成员及处级以上干部',
        InspectionTime: '2026年3月至5月（全局）',
      },

      // ── 巡察组配置（每组携带独立的巡察对象和时间段，驱动联动）──
      inspectionGroups: [
        {
          groupName: '第一巡察组',
          inspectionObject: '党委书记、党委副书记',      // 联动「巡察对象」
          inspectionTime: '2026年3月1日至5月15日',     // 联动「巡察时间段」
          members: [
            {
              userId: 'U001', userName: '赵一鸣', workNo: 'EMP001',
              currentPosition: '组织部科员', fromPool: false,
              phone: '138-0000-0001', specialty: '党政管理',
              nation: '汉族', healthStatus: '良好',
              partyJoinTime: '2015-06', workStartTime: '2013-07',
              fullTimeEducation: '本科', fullTimeDegree: '学士',
              fullTimeGraduateSchool: '武汉大学行政管理专业',
              professionalTitle: '助理政工师',
              annualAssessment: '近三年优秀', rewardPunishment: '无',
              resume: '2013-07—2016-06  组织部  助理\n2016-06—至今  组织部  科员',
            },
            {
              userId: 'P001', userName: '张志伟', workNo: 'P001',
              currentPosition: '审计部高级审计师', fromPool: true,
              phone: '139-1111-0001', specialty: '财务审计',
              nation: '汉族', healthStatus: '良好',
              partyJoinTime: '2012-09', workStartTime: '2010-07',
              fullTimeEducation: '本科', fullTimeDegree: '学士',
              fullTimeGraduateSchool: '中央财经大学审计专业',
              professionalTitle: '注册会计师',
              annualAssessment: '近三年优秀', rewardPunishment: '无',
              resume: '2010-07—2015-06  审计处  助理\n2015-06—至今  审计部  高级审计师',
            },
          ],
        },
        {
          groupName: '第二巡察组',
          inspectionObject: '纪委书记、党委委员（组织部部长）', // 联动「巡察对象」
          inspectionTime: '2026年3月15日至5月30日',           // 联动「巡察时间段」
          members: [
            {
              userId: 'U002', userName: '李建国', workNo: 'EMP002',
              currentPosition: '财务部主管会计', fromPool: false,
              phone: '138-0000-0002', specialty: '财务审计',
              nation: '汉族', healthStatus: '良好',
              partyJoinTime: '2010-06', workStartTime: '2008-07',
              fullTimeEducation: '本科', fullTimeDegree: '学士',
              fullTimeGraduateSchool: '中南大学会计专业',
              professionalTitle: '高级会计师',
              annualAssessment: '近三年优秀', rewardPunishment: '无',
              resume: '2008-07—2013-06  财务处  会计\n2013-06—至今  财务部  主管会计',
            },
            {
              userId: 'U003', userName: '王晓燕', workNo: 'EMP003',
              currentPosition: '纪检监察室副主任', fromPool: false,
              phone: '138-0000-0003', specialty: '纪检监察',
              nation: '汉族', healthStatus: '良好',
              partyJoinTime: '2011-07', workStartTime: '2009-07',
              fullTimeEducation: '本科', fullTimeDegree: '学士',
              fullTimeGraduateSchool: '郑州大学法学专业',
              professionalTitle: '政工师',
              annualAssessment: '近三年良好',
              rewardPunishment: '2023年获优秀党员称号',
              resume: '2009-07—2014-05  综合办  干事\n2020-03—至今  纪检监察室  副主任',
            },
          ],
        },
      ],

      // 廉政意见书 minio 地址（非空时只读模式直接预览，空时点击后请求接口）
      integrityFileUrl: '',
      integrityFileName: '廉政意见书.pdf',

      // 审核意见（编辑节点留空，只读节点填入已有内容）
      reviewComment: '',
    },
  },
  {
    taskId: 'task_0955',
    taskName: '纪检部审核廉政意见',
    processInstanceId: 'proc_010',
    businessId: 'BIZ_2025_010',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-10 12:00:00',
    priority: 4,
    extraData: {
      title: '第二十届巡察人才选调 — 分组方案审核',
      applicant: '督察办',
      department: '督察办',
      currentNodeName: '领导审核',
      nextNodeName: '督察办归档',
      viewComponentPath: 'PersonnelSelection/InspectionReviewViewForm',
      planInfo: {
        PlanName: '长飞公司第二十届专项巡察计划',
        InspectionSession: '第二十届',
        InspectionYear: '2026',
        InspectionObject: '党委班子成员及处级以上干部',
        InspectionTime: '2026年3月至5月（全局）',
      },

      inspectionGroups: [
        {
          groupName: '第一巡察组',
          inspectionObject: '党委书记、党委副书记',
          inspectionTime: '2026年3月1日至5月15日',
          members: [
            {
              userId: 'U001', userName: '赵一鸣', workNo: 'EMP001',
              currentPosition: '组织部科员', fromPool: false,
              phone: '138-0000-0001', specialty: '党政管理',
              nation: '汉族', healthStatus: '良好',
              partyJoinTime: '2015-06', workStartTime: '2013-07',
              fullTimeEducation: '本科', fullTimeDegree: '学士',
              fullTimeGraduateSchool: '武汉大学行政管理专业',
              professionalTitle: '助理政工师',
              annualAssessment: '近三年优秀', rewardPunishment: '无',
              resume: '2013-07—2016-06  组织部  助理\n2016-06—至今  组织部  科员',
            },
            {
              userId: 'P001', userName: '张志伟', workNo: 'P001',
              currentPosition: '审计部高级审计师', fromPool: true,
              phone: '139-1111-0001', specialty: '财务审计',
              nation: '汉族', healthStatus: '良好',
              partyJoinTime: '2012-09', workStartTime: '2010-07',
              fullTimeEducation: '本科', fullTimeDegree: '学士',
              fullTimeGraduateSchool: '中央财经大学审计专业',
              professionalTitle: '注册会计师',
              annualAssessment: '近三年优秀', rewardPunishment: '无',
              resume: '2010-07—2015-06  审计处  助理\n2015-06—至今  审计部  高级审计师',
            },
          ],
        },
        {
          groupName: '第二巡察组',
          inspectionObject: '纪委书记、党委委员（组织部部长）',
          inspectionTime: '2026年3月15日至5月30日',
          members: [
            {
              userId: 'U002', userName: '李建国', workNo: 'EMP002',
              currentPosition: '财务部主管会计', fromPool: false,
              phone: '138-0000-0002', specialty: '财务审计',
              nation: '汉族', healthStatus: '良好',
              partyJoinTime: '2010-06', workStartTime: '2008-07',
              fullTimeEducation: '本科', fullTimeDegree: '学士',
              fullTimeGraduateSchool: '中南大学会计专业',
              professionalTitle: '高级会计师',
              annualAssessment: '近三年优秀', rewardPunishment: '无',
              resume: '2008-07—2013-06  财务处  会计\n2013-06—至今  财务部  主管会计',
            },
            {
              userId: 'U003', userName: '王晓燕', workNo: 'EMP003',
              currentPosition: '纪检监察室副主任', fromPool: false,
              phone: '138-0000-0003', specialty: '纪检监察',
              nation: '汉族', healthStatus: '良好',
              partyJoinTime: '2011-07', workStartTime: '2009-07',
              fullTimeEducation: '本科', fullTimeDegree: '学士',
              fullTimeGraduateSchool: '郑州大学法学专业',
              professionalTitle: '政工师',
              annualAssessment: '近三年良好',
              rewardPunishment: '2023年获优秀党员称号',
              resume: '2009-07—2014-05  综合办  干事\n2020-03—至今  纪检监察室  副主任',
            },
          ],
        },
      ],

      integrityFileUrl: '',
      integrityFileName: '廉政意见书.pdf',

      // 审核意见已填（只读展示）
      reviewComment: '经审核，巡察组人员配置合理，廉政意见书符合要求。第一巡察组建议重点关注党委决策程序合规性；第二巡察组注意收集干部选拔用人相关材料。同意发起下一阶段巡察工作。',
    },
  },
  // ★ 巡前通报 — 行管部门反馈查看审核（我的待办）
  {
    taskId: 'task_012',
    taskName: '行管部门反馈审核',
    processInstanceId: 'proc_012',
    businessId: 'BIZ_2026_012',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-12 14:00:00',
    priority: 3,
    extraData: {
      title: '第二十届巡察 — 行管部门反馈审核（长飞公司）',
      applicant: '督察办',
      department: '长飞公司',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackViewForm',
      // 上游节点提交的反馈数据（后端透传）
      plan: {
        PlanID: 'P_2026_001',
        PlanName: '第一轮巡察计划（长飞公司）',
        InspectionSession: 20,
        InspectionYear: '2026',
        InspectionDepartMent: '长飞公司',
        InspectionTime: '2026年3月—5月',
        BriefingTime: '2026年3月10日—3月20日',   // 通报时间段（新增字段）
        InspectionContent: '重点检查党委班子成员及中层干部落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律和政治规矩行为；检查重点工程项目资金使用和廉洁从业情况；核查群众举报线索。',
        // 巡察对象列表（多对象面包屑导航所需）
        inspectionObjects: [
          { id: 'obj_001', name: '党委班子成员', role: '正职领导班子' },
          { id: 'obj_002', name: '纪检监察室', role: '重点监督部门' },
          { id: 'obj_003', name: '财务部', role: '职能部门' },
          { id: 'obj_004', name: '人力资源部', role: '职能部门' },
        ],
      },
      // 上游行管部门提交的各对象反馈（行管领导审核表单需要展示这些内容并填写意见）
      objectFeedbacks: FEEDBACKS_BASE.map(fb => ({
        ...fb,
        managerOpinion: '', // 本节点待填
      })),
    },
  },

  // ★ 巡前通报 — 行管部门反馈（我的待办）
  {
    taskId: 'task_011',
    taskName: '行管部门反馈',
    processInstanceId: 'proc_011',
    businessId: 'BIZ_2026_011',
    businessType: 'inspection_plan',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2026-03-12 09:00:00',
    priority: 3,
    extraData: {
      title: '第二十届巡察 — 行管部门反馈（长飞公司）',
      applicant: '督察办',
      department: '长飞公司',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackForm',
      plan: {
        PlanName: '长飞公司第二十届专项巡察',
        InspectionSession: 20,
        InspectionYear: '2026',
        // 全局兜底值（对象级无数据时展示）
        InspectionTime: '2026年3月至5月',
        BriefingTime: '2026年2月至3月',

        // 巡察对象列表 —— 每条携带独立的时间段，驱动上方计划卡联动
        inspectionObjects: [
          {
            id: 'obj_001',
            name: '党委书记',
            inspectionTime: '2026年3月1日至5月15日',   // 联动「巡察时间段」
            briefingTime: '2026年2月20日至2月28日',   // 联动「通报时间段」
          },
          {
            id: 'obj_002',
            name: '党委副书记',
            inspectionTime: '2026年3月15日至5月30日',
            briefingTime: '2026年3月1日至3月15日',
          },
          {
            id: 'obj_003',
            name: '纪委书记',
            inspectionTime: '2026年4月至5月',
            briefingTime: '2026年3月15日至3月31日',
          },
        ],
      },

      // 巡前通报正文 HTML（后端返回，前端 v-html 渲染，显示在 obj-nav 上方）
      briefingContent: `
      <p style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:16px">
        关于开展第二十届巡察工作的巡前通报
      </p>
      <p style="text-indent:2em;line-height:2;margin-bottom:10px">
        根据年度巡察工作安排，经研究决定，于 <strong>2026年3月至5月</strong>
        对长飞公司开展第二十届专项巡察，通报时间段为 <strong>2026年2月至3月</strong>。
        请各相关单位积极配合，做好各项准备工作。
      </p>
      <ol style="padding-left:2em;line-height:2;margin-bottom:10px">
        <li>党委班子成员执行政治纪律、政治规矩情况；</li>
        <li>"三重一大"事项集体决策程序规范情况；</li>
        <li>干部选拔任用工作合规情况；</li>
        <li>廉洁从业规定执行情况。</li>
      </ol>
      <p style="text-align:right;line-height:2">巡察工作领导小组办公室&emsp;2026年2月28日</p>
    `,

      // 已有的历史反馈（只读回填；新建时传空数组）
      objectFeedbacks: [],
    },
  },
  {
    taskId: 'task_006',
    taskName: '专项巡察成果审批',
    processInstanceId: 'proc_006',
    businessId: 'BIZ_2025_006',
    businessType: 'special_inspect',
    jumpUrl: null,
    jumpType: 'approve',
    createTime: '2025-03-05 09:00:00',
    priority: 2,
    extraData: {
      title: '廉洁文化建设专项巡察成果汇报',
      applicant: '赵巡察',
      department: '会议中心',
      viewComponentPath: '@/views/inspection/SpecialResultApprove.vue',
      nextViewComponentPath: '@/views/inspection/DirectorApprove.vue',
    },
  },
]

// ═══════════════════════════════════════════════
//  申请列表  (MyApplicationDto - 待后端补充)
// ═══════════════════════════════════════════════
export const mockApplicationList = [
  {
    taskId: 'task_016',
    taskName: '巡察办审批',
    processInstanceId: 'proc_016',
    businessId: 'BIZ_2025_007',
    businessType: 'inspection_plan',
    status: 'running',
    createdTime: '2026-03-13 09:00:00',
    priority: 3,
    currentNodeNames: ['分管领导审批'],
    extraData: {
      title: '第二十届巡察人才选调 — 巡察办审批（已完成）',
      applicant: '督察办',
      department: '巡察监督管理局',
      currentNodeName: '巡察办审批',

      viewComponentPath: 'PersonnelSelection/InspectionOfficeApprovalForm',

      planInfo: SHARED_PLAN_INFO,
      inspectionGroups: SHARED_GROUPS,

      upstreamComment: '经审核，本次人才选调组建的两个巡察组人员结构合理，专业配置均衡，成员整体素质较好。第一巡察组赵一鸣、张志伟专长互补，适合承担财务及党政管理方向的巡察任务；第二巡察组李建国、王晓燕、陈志勇覆盖财务、纪检、信息安全三个领域，具备较强的综合检查能力。建议巡察办审批通过，按计划推进后续进驻工作。',

      // 只读态：approvalComment 已填
      approvalComment: '巡察办审核通过。本次第二十届巡察人才选调工作严格按照选调程序执行，两个巡察组人员配置合理，专业结构符合此次巡察工作重点要求，人员廉洁档案已审查无异常。同意按方案推进，请巡察一室牵头协调各成员单位做好进驻前的工作交接及保密教育，确保2026年4月1日按时进驻。后续进驻过程中如需调整人员，须经本办重新审批。',
    },
  },
  {
    processInstanceId: 'proc_013',
    businessId: 'BIZ_2026_013',
    businessType: 'inspection_plan',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2026-03-13 09:00:00',
    completedTime: null,
    currentNodeNames: ['分管领导审批'],
    extraData: {
      title: '第二十届巡察 — 分管领导审批（长飞公司）',
      applicant: '督察办',
      department: '长飞公司',
    },
  },

  {
    processInstanceId: 'proc_014',
    businessId: 'BIZ_2026_014',
    businessType: 'inspection_plan',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2026-03-13 10:00:00',
    completedTime: null,
    currentNodeNames: ['巡察主管审核'],
    extraData: {
      title: '第二十届巡察 — 巡察主管审核（长飞公司）',
      applicant: '督察办',
      department: '长飞公司',
    },
  },
  {
    // ★ 驳回回退测试 — 局长驳回、退回部门主任重审，对应 BIZ_2025_002 流程图
    processInstanceId: 'proc_002',
    businessId: 'BIZ_2025_002',
    businessType: 'rectify_task',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2025-03-01 10:00:00',
    completedTime: null,
    currentNodeNames: ['部门主任审批'],
    currentAssignees: ['EMP003'],
    extraData: { title: '第二轮巡察整改落实（驳回重审）', department: '航飞公司' },
  },
  {
    processInstanceId: 'proc_101',
    businessId: 'BIZ_2025_101',
    businessType: 'inspection_plan',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2025-02-20 09:00:00',
    completedTime: null,
    currentNodeNames: ['局长审批'],
    extraData: { title: '2025年度长飞公司巡察计划', department: '长飞公司' },
  },
  {
    processInstanceId: 'proc_102',
    businessId: 'BIZ_2025_102',
    businessType: 'rectify_task',
    status: 'completed',
    createdBy: 'EMP004',
    createdTime: '2025-01-15 10:00:00',
    completedTime: '2025-02-10 15:30:00',
    currentNodeNames: [],
    extraData: { title: '第二轮巡察整改落实情况核查', department: '航飞公司' },
  },
  {
    processInstanceId: 'proc_103',
    businessId: 'BIZ_2025_103',
    businessType: 'special_inspect',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2025-02-25 14:00:00',
    completedTime: null,
    currentNodeNames: ['法务审核', '财务审核'],  // 并行
    extraData: { title: '民航安全生产专项巡察方案', department: '民航产业' },
  },
  {
    processInstanceId: 'proc_104',
    businessId: 'BIZ_2025_104',
    businessType: 'report_submit',
    status: 'terminated',
    createdBy: 'EMP004',
    createdTime: '2025-02-18 08:00:00',
    completedTime: '2025-02-18 09:15:00',
    currentNodeNames: [],
    extraData: { title: '2024年度巡察工作年终总结', department: '综合办公室' },
  },
  {
    processInstanceId: 'proc_105',
    businessId: 'BIZ_2025_105',
    businessType: 'daily_supervise',
    status: 'completed',
    createdBy: 'EMP004',
    createdTime: '2025-01-08 11:00:00',
    completedTime: '2025-01-20 16:00:00',
    currentNodeNames: [],
    extraData: { title: '无人机公司2024Q4日常监督报告', department: '无人机公司' },
  },
  {
    processInstanceId: 'proc_106',
    businessId: 'BIZ_2025_106',
    businessType: 'inspection_plan',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2025-03-01 08:30:00',
    completedTime: null,
    currentNodeNames: ['部门主任审批'],
    extraData: { title: '会议中心2025年度巡察工作方案', department: '会议中心' },
  },
  {
    processInstanceId: 'proc_107',
    businessId: 'BIZ_2025_107',
    businessType: 'rectify_task',
    status: 'completed',
    createdBy: 'EMP004',
    createdTime: '2024-12-10 13:00:00',
    completedTime: '2024-12-25 10:00:00',
    currentNodeNames: [],
    extraData: { title: '"四风"问题整改落实验收', department: '长飞公司' },
  },
  {
    processInstanceId: 'proc_108',
    businessId: 'BIZ_2025_108',
    businessType: 'special_inspect',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2025-03-03 15:00:00',
    completedTime: null,
    currentNodeNames: ['副局长审批'],
    extraData: { title: '廉洁文化建设专项行动核查方案', department: '巡察监督管理局' },
  },

  // ★ 巡前通报 — 行管部门反馈审核（我的申请）
  {
    processInstanceId: 'proc_012',
    businessId: 'BIZ_2026_012',
    businessType: 'inspection_plan',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2026-03-12 14:00:00',
    completedTime: null,
    currentNodeNames: ['行管部门反馈审核'],
    extraData: {
      title: '第二十届巡察 — 行管部门反馈审核（长飞公司）',
      applicant: '督察办',
      department: '长飞公司',
    },
  },

  // ★ 巡前通报 — 行管部门反馈（我的申请）
  {
    processInstanceId: 'proc_011',
    businessId: 'BIZ_2026_011',
    businessType: 'inspection_plan',
    status: 'running',
    createdBy: 'EMP004',
    createdTime: '2026-03-12 09:00:00',
    completedTime: null,
    currentNodeNames: ['行管部门反馈'],
    extraData: {
      title: '第二十届巡察 — 行管部门反馈（长飞公司）',
      applicant: '督察办',
      department: '长飞公司',
    },
  },

  // ★ 人才选调流程测试记录 — 对应 MOCK_NODES['BIZ_2025_007']
  // 用于验证 ApplicationViewDrawer Tab 懒加载 + 各节点表单只读渲染（含领导审核 ViewForm）
  {
    processInstanceId: 'proc_007',
    businessId: 'BIZ_2025_007',
    businessType: 'inspection_plan',
    status: 'completed',
    createdBy: 'EMP001',
    createdTime: '2026-03-01 09:00:00',
    completedTime: '2026-03-08 16:30:00',
    currentNodeNames: [],
    extraData: {
      title: '第二十届巡察人才选调 — 选调完成',
      applicant: '督察办',
      department: '督察办',
    },
  },
]

// ═══════════════════════════════════════════════
//  预测 API 响应  (NextNodePrediction)
//  key = businessId
// ═══════════════════════════════════════════════
export const mockPredictResults = {
  'BIZ_PRED_01': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_leader_approve',
    nextNodeName: '分管领导审批',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
    requiresDecision: false,
    possiblePaths: [],
  },

  'BIZ_PRED_02': {
    nextNodeType: 'parallelGateway',
    nextNodeId: 'gateway_parallel_demo',
    nextNodeName: '并行审批网关',
    isParallelGateway: true,
    parallelTasks: [
      {
        nodeId: 'task_finance_check',
        nodeName: '财务部核查',
        role: 'finance',
        nextViewComponentPath: 'InspectionBriefing/BriefingLeaderApprovalForm',
      },
      {
        nodeId: 'task_legal_check',
        nodeName: '法务部审核',
        role: 'legal',
        nextViewComponentPath: 'InspectionBriefing/BriefingChiefReviewForm',
      },
    ],
    isEndEvent: false,
    requiresDecision: false,
    possiblePaths: [],
  },

  'BIZ_PRED_03': {
    nextNodeType: 'exclusiveGateway',
    nextNodeId: 'gateway_exclusive_demo',
    nextNodeName: '金额分支网关',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
    requiresDecision: true,   // ← 关键：触发前端路径选择 UI
    possiblePaths: [
      {
        targetNodeId: 'task_cfo_approve',
        targetNodeName: 'CFO 专项审批',
        condition: '${amount > 500000}',
        requiredVariables: ['amount'],
        variableValue: { routeTo: 'cfo', amountLevel: 'large' },
        description: '金额超过 50 万，需 CFO 专项审批',
      },
      {
        targetNodeId: 'task_dept_approve',
        targetNodeName: '部门主任审批',
        condition: '${amount <= 500000}',
        requiredVariables: ['amount'],
        variableValue: { routeTo: 'dept', amountLevel: 'normal' },
        description: '金额 50 万以内，部门主任审批即可',
      },
    ],
  },
  'BIZ_2026_013': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_chief_review',
    nextNodeName: '巡察主管审核',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },

  'BIZ_2026_014': {
    nextNodeType: 'endEvent',
    nextNodeId: 'end_event',
    nextNodeName: '结束',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: true,
  },
  // 普通单节点
  'BIZ_2025_001': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_director_approve',
    nextNodeName: '局长审批',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  // 普通单节点
  'BIZ_2025_002': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_final_approve',
    nextNodeName: '最终审批',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  // 并行网关
  'BIZ_2025_003': {
    nextNodeType: 'parallelGateway',
    nextNodeId: 'gateway_parallel_001',
    nextNodeName: '并行审批网关',
    isParallelGateway: true,
    parallelTasks: [
      { nodeId: 'task_legal_review', nodeName: '法务审核', role: 'legal', nextViewComponentPath: '@/views/inspection/LegalReviewApprove.vue' },
      { nodeId: 'task_finance_review', nodeName: '财务审核', role: 'finance', nextViewComponentPath: '@/views/inspection/FinanceReviewApprove.vue' },
    ],
    isEndEvent: false,
  },
  // 末节点 → 下一步结束
  'BIZ_2025_004': {
    nextNodeType: 'endEvent',
    nextNodeId: 'end_event',
    nextNodeName: '结束',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: true,
  },
  // 普通节点
  'BIZ_2025_005': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_director_approve',
    nextNodeName: '局长审批',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  'BIZ_2025_009': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_review_confirm',
    nextNodeName: '督察办审核确认',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  'BIZ_2025_010': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_archive',
    nextNodeName: '督察办归档',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  // 个人简历填报：下一步是督察办汇总审核节点
  'BIZ_2025_008': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_collection_review',
    nextNodeName: '督察办汇总审核',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  // 部门推荐表单：下一步是督察办汇总节点
  'BIZ_2025_007': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_collection_review',
    nextNodeName: '督察办汇总审核',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  'BIZ_2026_012': {
    nextNodeType: 'endEvent',
    nextNodeId: 'end_event',
    nextNodeName: '结束',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  'BIZ_2026_011': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_director_review',
    nextNodeName: '局长审批',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },
  'BIZ_2025_006': {
    nextNodeType: 'userTask',
    nextNodeId: 'task_director_approve',
    nextNodeName: '局长审批',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  },

  // ── 排他网关样例（ExclusiveGateway / 分支网关）──────────────
  // 用于验证 TaskApproveDrawer 排他网关路径选择 UI
  // 正式对接时此条目由后端 /predict 接口动态返回，不需要 mock
  'BIZ_EXCLUSIVE_DEMO': {
    nextNodeType: 'exclusiveGateway',
    nextNodeId: 'gateway_exclusive_001',
    nextNodeName: '审批结果分支',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
    // 排他网关专属字段
    requiresDecision: true,   // true = 需要前端用户做路径选择
    possiblePaths: [
      {
        targetNodeId: 'task_finance_review',
        targetNodeName: '财务部复核',
        condition: '${routeTo == "finance"}',
        requiredVariables: ['routeTo'],
        // variableValue：用户选中此路径时前端应提交的变量值
        variableValue: { routeTo: 'finance' },
        description: '金额超过 50 万，需财务部复核',
      },
      {
        targetNodeId: 'task_direct_approve',
        targetNodeName: '直接审批通过',
        condition: '${routeTo == "direct"}',
        requiredVariables: ['routeTo'],
        variableValue: { routeTo: 'direct' },
        description: '金额在 50 万以内，直接提交审批',
      },
    ],
  },
}

// ═══════════════════════════════════════════════
//  流程图渲染数据  (ProcessFlowRenderDto)
//  key = businessId
// ═══════════════════════════════════════════════

// 线性流程（BIZ_2025_001 / 002 / 004 / 005 / 006）
const linearFlowRender = (businessId, currentNodeId, completedNodes = []) => ({
  businessId,
  processInstanceId: `proc_${businessId.slice(-3)}`,
  processDefinitionKey: 'inspection_approval',
  businessType: 'inspection_plan',
  status: 'running',
  createdBy: 'EMP004',
  createdTime: '2025-02-28T14:00:00Z',
  completedTime: null,
  hasRejectHistory: false,
  walkedNodeIds: ['start_event', 'task_submit', ...completedNodes, currentNodeId].filter(Boolean),
  // x/y/width/height 全部不传，模拟后端 BPMN 无 DI 坐标时的真实场景
  // FlowGraph.vue 会自动走 dagre 布局轨道
  nodes: [
    { id: 'start_event', label: '开始', nodeType: 'startEvent', state: 'completed', assignees: [], completedAt: '2025-02-28T14:00:00Z', extraData: {} },
    { id: 'task_submit', label: '发起申请', nodeType: 'userTask', state: 'completed', assignees: ['EMP004'], completedAt: '2025-02-28T14:30:00Z', extraData: {} },
    { id: 'task_dept_approve', label: '部门主任审批', nodeType: 'userTask', state: completedNodes.includes('task_dept_approve') ? 'completed' : (currentNodeId === 'task_dept_approve' ? 'active' : 'pending'), assignees: completedNodes.includes('task_dept_approve') ? ['EMP003'] : (currentNodeId === 'task_dept_approve' ? ['EMP003'] : []), completedAt: completedNodes.includes('task_dept_approve') ? '2025-03-01T09:00:00Z' : null, extraData: {} },
    { id: 'task_director_approve', label: '局长审批', nodeType: 'userTask', state: currentNodeId === 'task_director_approve' ? 'active' : (completedNodes.includes('task_director_approve') ? 'completed' : 'pending'), assignees: currentNodeId === 'task_director_approve' ? ['EMP001'] : [], completedAt: null, extraData: {} },
    { id: 'end_event', label: '结束', nodeType: 'endEvent', state: 'pending', assignees: [], completedAt: null, extraData: {} },
  ],
  edges: [
    { id: 'e1', source: 'start_event', target: 'task_submit', state: 'walked', label: null },
    { id: 'e2', source: 'task_submit', target: 'task_dept_approve', state: completedNodes.includes('task_dept_approve') || currentNodeId === 'task_dept_approve' ? 'walked' : 'pending', label: null },
    { id: 'e3', source: 'task_dept_approve', target: 'task_director_approve', state: completedNodes.includes('task_dept_approve') ? 'walked' : (currentNodeId === 'task_director_approve' ? 'active' : 'pending'), label: null },
    { id: 'e4', source: 'task_director_approve', target: 'end_event', state: 'pending', label: null },
  ],
  activeTasks: [
    { taskId: `t_${businessId}`, nodeId: currentNodeId, nodeName: '当前审批节点', assignee: 'EMP003', createdAt: '2025-03-01T09:00:00Z', waitingSeconds: 86400 }
  ],
  completedRecords: [
    { taskId: 't_s1', nodeId: 'task_submit', nodeName: '发起申请', assignee: 'EMP004', startTime: '2025-02-28T14:00:00Z', endTime: '2025-02-28T14:30:00Z', durationSeconds: 1800, outcome: 'approved', rejectReason: null, round: 1 },
    ...completedNodes.includes('task_dept_approve') ? [{ taskId: 't_d1', nodeId: 'task_dept_approve', nodeName: '部门主任审批', assignee: 'EMP003', startTime: '2025-02-28T15:00:00Z', endTime: '2025-03-01T09:00:00Z', durationSeconds: 64800, outcome: 'approved', rejectReason: null, round: 1 }] : [],
  ],
  rejectHistory: [],
})

// 带驳回历史的流程（BIZ_2025_002）
const rejectFlowRender = {
  businessId: 'BIZ_2025_002',
  processInstanceId: 'proc_002',
  processDefinitionKey: 'rectify_approval',
  businessType: 'rectify_task',
  status: 'running',
  createdBy: 'EMP003',
  createdTime: '2025-03-01T10:00:00Z',
  completedTime: null,
  hasRejectHistory: true,
  walkedNodeIds: ['start_event', 'task_submit', 'task_dept_approve', 'task_director_approve', 'task_dept_approve'],
  nodes: [
    { id: 'start_event', label: '开始', nodeType: 'startEvent', state: 'completed', assignees: [], completedAt: '2025-03-01T10:00:00Z', extraData: {} },
    { id: 'task_submit', label: '发起申请', nodeType: 'userTask', state: 'completed', assignees: ['EMP003'], completedAt: '2025-03-01T10:30:00Z', extraData: {} },
    { id: 'task_dept_approve', label: '部门主任审批', nodeType: 'userTask', state: 'active', assignees: ['EMP003'], completedAt: null, extraData: {} },
    { id: 'task_director_approve', label: '局长审批', nodeType: 'userTask', state: 'rejected', assignees: ['EMP001'], completedAt: '2025-03-02T14:00:00Z', extraData: {} },
    { id: 'end_event', label: '结束', nodeType: 'endEvent', state: 'pending', assignees: [], completedAt: null, extraData: {} },
  ],
  edges: [
    { id: 'e1', source: 'start_event', target: 'task_submit', state: 'walked', label: null },
    { id: 'e2', source: 'task_submit', target: 'task_dept_approve', state: 'walked', label: null },
    { id: 'e3', source: 'task_dept_approve', target: 'task_director_approve', state: 'walked', label: null },
    { id: 'e4', source: 'task_director_approve', target: 'end_event', state: 'pending', label: null },
    { id: 'e5', source: 'task_director_approve', target: 'task_dept_approve', state: 'rejected', label: '驳回' },
  ],
  activeTasks: [
    { taskId: 't_002_2', nodeId: 'task_dept_approve', nodeName: '部门主任审批（第2次）', assignee: 'EMP003', createdAt: '2025-03-02T14:00:00Z', waitingSeconds: 72000 }
  ],
  completedRecords: [
    { taskId: 't_s2', nodeId: 'task_submit', nodeName: '发起申请', assignee: 'EMP003', startTime: '2025-03-01T10:00:00Z', endTime: '2025-03-01T10:30:00Z', durationSeconds: 1800, outcome: 'approved', rejectReason: null, round: 1 },
    { taskId: 't_d2', nodeId: 'task_dept_approve', nodeName: '部门主任审批', assignee: 'EMP003', startTime: '2025-03-01T11:00:00Z', endTime: '2025-03-01T15:00:00Z', durationSeconds: 14400, outcome: 'approved', rejectReason: null, round: 1 },
    { taskId: 't_r2', nodeId: 'task_director_approve', nodeName: '局长审批', assignee: 'EMP001', startTime: '2025-03-01T16:00:00Z', endTime: '2025-03-02T14:00:00Z', durationSeconds: 79200, outcome: 'rejected_return', rejectReason: '验收材料不完整，请补充佐证材料后重新提交', round: 1 },
  ],
  rejectHistory: [
    { rejectId: 'rj_001', rejectBy: 'EMP001', rejectNodeId: 'task_director_approve', rejectNodeName: '局长审批', targetNodeId: 'task_dept_approve', targetNodeName: '部门主任审批', rejectReason: '验收材料不完整，请补充佐证材料后重新提交', rejectTime: '2025-03-02T14:00:00Z', isParallelBranchReject: false },
  ],
}

// 并行网关流程（BIZ_2025_003）
const parallelFlowRender = {
  businessId: 'BIZ_2025_003',
  processInstanceId: 'proc_003',
  processDefinitionKey: 'special_inspect_approval',
  businessType: 'special_inspect',
  status: 'running',
  createdBy: 'EMP006',
  createdTime: '2025-03-03T14:00:00Z',
  completedTime: null,
  hasRejectHistory: false,
  walkedNodeIds: ['start_event', 'task_submit', 'gateway_parallel_001', 'task_legal_review', 'task_finance_review'],
  nodes: [
    { id: 'start_event', label: '开始', nodeType: 'startEvent', state: 'completed', assignees: [], completedAt: '2025-03-03T14:00:00Z', extraData: {} },
    { id: 'task_submit', label: '发起申请', nodeType: 'userTask', state: 'completed', assignees: ['EMP006'], completedAt: '2025-03-03T14:30:00Z', extraData: {} },
    { id: 'gateway_parallel_001', label: '', nodeType: 'parallelGateway', state: 'completed', assignees: [], completedAt: '2025-03-03T14:30:00Z', extraData: {} },
    { id: 'task_legal_review', label: '法务审核', nodeType: 'userTask', state: 'active', assignees: ['EMP009'], completedAt: null, extraData: {} },
    { id: 'task_finance_review', label: '财务审核', nodeType: 'userTask', state: 'active', assignees: ['EMP010'], completedAt: null, extraData: {} },
    { id: 'gateway_join_001', label: '', nodeType: 'parallelGateway', state: 'pending', assignees: [], completedAt: null, extraData: {} },
    { id: 'task_director', label: '局长审批', nodeType: 'userTask', state: 'pending', assignees: [], completedAt: null, extraData: {} },
    { id: 'end_event', label: '结束', nodeType: 'endEvent', state: 'pending', assignees: [], completedAt: null, extraData: {} },
  ],
  edges: [
    { id: 'e1', source: 'start_event', target: 'task_submit', state: 'walked', label: null },
    { id: 'e2', source: 'task_submit', target: 'gateway_parallel_001', state: 'walked', label: null },
    { id: 'e3', source: 'gateway_parallel_001', target: 'task_legal_review', state: 'active', label: null },
    { id: 'e4', source: 'gateway_parallel_001', target: 'task_finance_review', state: 'active', label: null },
    { id: 'e5', source: 'task_legal_review', target: 'gateway_join_001', state: 'pending', label: null },
    { id: 'e6', source: 'task_finance_review', target: 'gateway_join_001', state: 'pending', label: null },
    { id: 'e7', source: 'gateway_join_001', target: 'task_director', state: 'pending', label: null },
    { id: 'e8', source: 'task_director', target: 'end_event', state: 'pending', label: null },
  ],
  activeTasks: [
    { taskId: 't_003_1', nodeId: 'task_legal_review', nodeName: '法务审核', assignee: 'EMP009', createdAt: '2025-03-03T14:30:00Z', waitingSeconds: 64800 },
    { taskId: 't_003_2', nodeId: 'task_finance_review', nodeName: '财务审核', assignee: 'EMP010', createdAt: '2025-03-03T14:30:00Z', waitingSeconds: 64800 },
  ],
  completedRecords: [
    { taskId: 't_s3', nodeId: 'task_submit', nodeName: '发起申请', assignee: 'EMP006', startTime: '2025-03-03T14:00:00Z', endTime: '2025-03-03T14:30:00Z', durationSeconds: 1800, outcome: 'approved', rejectReason: null, round: 1 },
  ],
  rejectHistory: [],
}

export const mockFlowRenderMap = {
  'BIZ_2026_013': linearFlowRender('BIZ_2026_013', 'task_leader_approval', ['task_feedback', 'task_manager_review']),
  'BIZ_2026_014': linearFlowRender('BIZ_2026_014', 'task_chief_review', ['task_feedback', 'task_manager_review', 'task_leader_approval']),
  'BIZ_2025_001': linearFlowRender('BIZ_2025_001', 'task_dept_approve', []),
  'BIZ_2025_002': rejectFlowRender,
  'BIZ_2025_003': parallelFlowRender,
  'BIZ_2025_004': linearFlowRender('BIZ_2025_004', 'task_director_approve', ['task_dept_approve']),
  'BIZ_2025_005': linearFlowRender('BIZ_2025_005', 'task_dept_approve', []),
  'BIZ_2025_010': linearFlowRender('BIZ_2025_010', 'task_review', []),
  'BIZ_2025_009': linearFlowRender('BIZ_2025_009', 'task_group_assign', []),
  'BIZ_2025_008': linearFlowRender('BIZ_2025_008', 'task_fill_resume', []),
  'BIZ_2025_007': {
    businessId: 'BIZ_2025_007',
    processInstanceId: 'proc_007',
    processDefinitionKey: 'personnel_selection',
    businessType: 'inspection_plan',
    status: 'running',
    createdBy: 'EMP001',
    createdTime: '2026-03-01T09:00:00Z',
    completedTime: null,
    hasRejectHistory: false,
    walkedNodeIds: ['start_event', 'task_dept_recommend', 'task_fill_resume', 'task_group_assign', 'task_review'],
    nodes: [
      { id: 'start_event', label: '开始', nodeType: 'startEvent', state: 'completed', assignees: [], completedAt: '2026-03-01T09:00:00Z', extraData: {} },
      { id: 'task_dept_recommend', label: '部门人才推荐', nodeType: 'userTask', state: 'completed', assignees: ['张三'], completedAt: '2026-03-01T10:30:00Z', extraData: {} },
      { id: 'task_fill_resume', label: '填写个人简历', nodeType: 'userTask', state: 'completed', assignees: ['赵一鸣'], completedAt: '2026-03-02T14:00:00Z', extraData: {} },
      { id: 'task_group_assign', label: '巡察组分组', nodeType: 'userTask', state: 'completed', assignees: ['督察办'], completedAt: '2026-03-05T09:00:00Z', extraData: {} },
      { id: 'task_review', label: '领导审核', nodeType: 'userTask', state: 'active', assignees: ['局长'], completedAt: null, extraData: {} },
      { id: 'end_event', label: '结束', nodeType: 'endEvent', state: 'pending', assignees: [], completedAt: null, extraData: {} },
    ],
    edges: [
      { id: 'e1', source: 'start_event', target: 'task_dept_recommend', state: 'walked', label: null },
      { id: 'e2', source: 'task_dept_recommend', target: 'task_fill_resume', state: 'walked', label: null },
      { id: 'e3', source: 'task_fill_resume', target: 'task_group_assign', state: 'walked', label: null },
      { id: 'e4', source: 'task_group_assign', target: 'task_review', state: 'walked', label: null },
      { id: 'e5', source: 'task_review', target: 'end_event', state: 'pending', label: null },
    ],
    activeTasks: [
      { taskId: 't_review_007', nodeId: 'task_review', nodeName: '领导审核', assignee: '局长', createdAt: '2026-03-05T10:00:00Z', waitingSeconds: 172800 },
    ],
    completedRecords: [
      { taskId: 't_dr_007', nodeId: 'task_dept_recommend', nodeName: '部门人才推荐', assignee: '张三', startTime: '2026-03-01T09:00:00Z', endTime: '2026-03-01T10:30:00Z', durationSeconds: 5400, outcome: 'approved', rejectReason: null, round: 1 },
      { taskId: 't_fr_007', nodeId: 'task_fill_resume', nodeName: '填写个人简历', assignee: '赵一鸣', startTime: '2026-03-01T11:00:00Z', endTime: '2026-03-02T14:00:00Z', durationSeconds: 97200, outcome: 'approved', rejectReason: null, round: 1 },
      { taskId: 't_ga_007', nodeId: 'task_group_assign', nodeName: '巡察组分组', assignee: '督察办', startTime: '2026-03-02T15:00:00Z', endTime: '2026-03-05T09:00:00Z', durationSeconds: 237600, outcome: 'approved', rejectReason: null, round: 1 },
    ],
    rejectHistory: [],
  },
  'BIZ_2026_011': linearFlowRender('BIZ_2026_011', 'task_feedback', []),
  'BIZ_2026_012': linearFlowRender('BIZ_2026_012', 'task_feedback_review', ['task_feedback']),
  'BIZ_2025_006': linearFlowRender('BIZ_2025_006', 'task_dept_approve', []),
  'BIZ_2025_101': linearFlowRender('BIZ_2025_101', 'task_director_approve', ['task_dept_approve']),
  'BIZ_2025_102': { ...linearFlowRender('BIZ_2025_102', null, ['task_dept_approve', 'task_director_approve']), status: 'completed', completedTime: '2025-02-10T15:30:00Z' },
  'BIZ_2025_103': parallelFlowRender,
  'BIZ_2025_104': { ...linearFlowRender('BIZ_2025_104', null, []), status: 'terminated' },
  'BIZ_2025_105': { ...linearFlowRender('BIZ_2025_105', null, ['task_dept_approve', 'task_director_approve']), status: 'completed', completedTime: '2025-01-20T16:00:00Z' },
  'BIZ_2025_106': linearFlowRender('BIZ_2025_106', 'task_dept_approve', []),
  'BIZ_2025_107': { ...linearFlowRender('BIZ_2025_107', null, ['task_dept_approve', 'task_director_approve']), status: 'completed', completedTime: '2024-12-25T10:00:00Z' },
  'BIZ_2025_108': linearFlowRender('BIZ_2025_108', 'task_director_approve', ['task_dept_approve']),
}

// ═══════════════════════════════════════════════
//  模拟 API 调用函数（加延迟模拟网络）
// ═══════════════════════════════════════════════
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))

export const apiGetTodoList = async (params = {}) => {
  await delay()
  let list = [...mockTodoList]
  if (params.businessType) list = list.filter(t => t.businessType === params.businessType)
  if (params.priority !== undefined && params.priority !== '') list = list.filter(t => t.priority === Number(params.priority))
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(t =>
      t.taskName.toLowerCase().includes(kw) ||
      t.businessId.toLowerCase().includes(kw) ||
      (t.extraData?.title || '').toLowerCase().includes(kw)
    )
  }
  return { list, total: list.length }
}

export const apiGetApplicationList = async (params = {}) => {
  await delay()
  let list = [...mockApplicationList]
  if (params.status) list = list.filter(a => a.status === params.status)
  if (params.businessType) list = list.filter(a => a.businessType === params.businessType)
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(a =>
      a.businessId.toLowerCase().includes(kw) ||
      (a.extraData?.title || '').toLowerCase().includes(kw)
    )
  }
  return { list, total: list.length }
}

export const apiGetPredictResult = async (businessId) => {
  await delay(200)
  return mockPredictResults[businessId] || {
    nextNodeType: 'userTask',
    nextNodeId: 'task_next',
    nextNodeName: '下一节点',
    isParallelGateway: false,
    parallelTasks: [],
    isEndEvent: false,
  }
}

export const apiGetFlowRender = async (businessId) => {
  await delay(300)
  return mockFlowRenderMap[businessId] || null
}

export const apiCompleteTask = async (payload) => {
  await delay(600)
  console.log('[模拟] CompleteTask payload:', payload)
  return { success: true, message: '任务处理成功' }
}

export const apiReassignTask = async (payload) => {
  await delay(400)
  console.log('[模拟] ReassignTask payload:', payload)
  return { success: true, message: '转派成功' }
}

export const apiTerminateProcess = async (payload) => {
  await delay(400)
  console.log('[模拟] TerminateProcess payload:', payload)
  return { success: true, message: '流程已撤回' }
}

// ─────────────────────────────────────────────────
//  Mock 数据：节点元信息（不含 formData）
//  真实场景：GET /application/detail?businessId=xxx
//  后端只返回节点列表 + viewComponentPath，不含表单数据
// ─────────────────────────────────────────────────
const MOCK_NODES = {
  'BIZ_2026_013': [
    // 行管部门反馈（已完成）
    {
      nodeKey: 'briefingFeedback_013',
      nodeName: '行管部门反馈',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackForm',
      operator: '李主任',
      completedAt: '2026-03-12 11:30:00',
      approveComment: '已如实填写问题反馈',
    },
    // 行管领导审核（已完成）
    {
      nodeKey: 'briefingManagerReview_013',
      nodeName: '行管领导审核',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackViewForm',
      operator: '张副局长',
      completedAt: '2026-03-12 15:00:00',
      approveComment: '审核通过',
    },
    // 分管领导审批（当前节点，未完成）
    {
      nodeKey: 'briefingLeaderApproval_013',
      nodeName: '分管领导审批',
      viewComponentPath: 'InspectionBriefing/BriefingLeaderApprovalForm',
      operator: null,
      completedAt: null,
      approveComment: null,
    },
  ],

  'BIZ_2026_014': [
    // 行管部门反馈（已完成）
    {
      nodeKey: 'briefingFeedback_014',
      nodeName: '行管部门反馈',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackForm',
      operator: '李主任',
      completedAt: '2026-03-12 11:30:00',
      approveComment: '已如实填写问题反馈',
    },
    // 行管领导审核（已完成）
    {
      nodeKey: 'briefingManagerReview_014',
      nodeName: '行管领导审核',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackViewForm',
      operator: '张副局长',
      completedAt: '2026-03-12 15:00:00',
      approveComment: '审核通过',
    },
    // 分管领导审批（已完成）
    {
      nodeKey: 'briefingLeaderApproval_014',
      nodeName: '分管领导审批',
      viewComponentPath: 'InspectionBriefing/BriefingLeaderApprovalForm',
      operator: '陈副局长',
      completedAt: '2026-03-13 09:30:00',
      approveComment: '同意，提报巡察主管审核',
    },
    // 巡察主管审核（当前节点，未完成）
    {
      nodeKey: 'briefingLeaderApproval_015',
      nodeName: '巡察主管审核',
      viewComponentPath: 'InspectionBriefing/BriefingChiefReviewForm',
      operator: '陈副局长',
      completedAt: '2026-03-13 09:30:00',
      approveComment: '同意，流程完整无误',
    },
  ],
  'BIZ_2026_012': [
    {
      nodeKey: 'briefingFeedback_011_view',
      nodeName: '行管部门反馈（上游）',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackForm',
      operator: '李主任',
      completedAt: '2026-03-12 11:30:00',
      approveComment: '已如实填写问题反馈',
    },
    {
      nodeKey: 'briefingFeedbackView_012',
      nodeName: '行管部门反馈审核',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackViewForm',
      operator: '王局长',
      completedAt: null,
      approveComment: null,
    },
  ],

  'BIZ_2026_011': [
    {
      nodeKey: 'briefingFeedback_011',
      nodeName: '行管部门反馈',
      viewComponentPath: 'InspectionBriefing/BriefingFeedbackForm',
      operator: '李主任',
      completedAt: '2026-03-12 11:30:00',
      approveComment: '已如实填写问题反馈',
    },
  ],

  'BIZ_2025_007': [
    {
      nodeKey: 'deptRecommend_007',
      nodeName: '部门人才推荐',
      viewComponentPath: 'PersonnelSelection/DeptRecommendForm',
      operator: '张三',
      completedAt: '2026-03-01 10:30:00',
      approveComment: '同意，推荐以下人员参加选调',
    },
    {
      nodeKey: 'personDetail_007_U001',
      nodeName: '填写个人简历',
      viewComponentPath: 'PersonnelSelection/PersonDetailForm',
      operator: '赵一鸣',
      completedAt: '2026-03-02 14:00:00',
      approveComment: '已如实填写',
    },
    {
      nodeKey: 'inspectionGroup_007',
      nodeName: '巡察组分组',
      viewComponentPath: 'PersonnelSelection/InspectionGroupForm',
      operator: '督察办',
      completedAt: '2026-03-05 09:00:00',
      approveComment: '已完成巡察组分组',
    },
    {
      nodeKey: 'personDetail_007_U002',
      nodeName: '填写个人简历（李建国）',
      viewComponentPath: 'PersonnelSelection/PersonDetailForm',
      operator: '李建国',
      completedAt: '2026-03-02 16:00:00',
      approveComment: '已如实填写',
    },
    {
      nodeKey: 'personDetail_007_U003',
      nodeName: '填写个人简历（王晓燕）',
      viewComponentPath: 'PersonnelSelection/PersonDetailForm',
      operator: '王晓燕',
      completedAt: '2026-03-03 10:00:00',
      approveComment: '已如实填写',
    },
    {
      nodeKey: 'inspectionGroup_007',
      nodeName: '巡察组分组',
      viewComponentPath: 'PersonnelSelection/InspectionGroupForm',
      operator: '督察办',
      completedAt: '2026-03-05 09:00:00',
      approveComment: '已完成巡察组分组',
    },
    {
      nodeKey: 'inspectionReview_007',
      nodeName: '领导审核',
      // MyApplication 查看时渲染只读版（无上传），TaskApproveDrawer 审批时用 InspectionReviewForm
      viewComponentPath: 'PersonnelSelection/InspectionReviewViewForm',
      operator: '李局长',
      completedAt: '2026-03-08 16:30:00',
      approveComment: '经审核，巡察组组建合理，人员配置符合要求，廉政意见书材料齐全，同意本次人才选调方案。',
    },
  ],
}

// ─────────────────────────────────────────────────
//  Mock 数据：各节点 formData（按需加载）
//  真实场景：GET /application/node-form-data?nodeKey=xxx
// ─────────────────────────────────────────────────
const MOCK_FORM_DATA = {
  // 行管部门反馈节点
  'briefingFeedback_013': {
    plan: {
      PlanID: 'P001',
      PlanName: '第一轮巡察计划',
      InspectionSession: 20,
      InspectionYear: '2026',
      InspectionDepartMent: '长飞公司',
      InspectionTime: '2026年3月—5月',
      InspectionObject: '党委班子成员',
      InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
    },
    category: 'issue',
    issueSource: '查阅财务凭证及相关审批文件',
    specificIssue: '2024年度存在多笔费用报销未按规定附齐原始凭证，合计金额约12.6万元，涉及餐饮、差旅等类别。',
    keypointContent: '',
    disposalStatus: '已责成财务部门补充相关凭证并完善报销制度，建立月度内控自查机制。',
    referenceAdvice: '建议查阅2024年度费用报销台账、财务管理制度文件及历次审计报告。',
    remark: '问题已进入整改跟踪流程，预计一个月内完成整改。',
    attachments: [
      { name: '费用报销问题清单.xlsx', size: 48640, url: '' },
      { name: '整改措施说明.docx', size: 102400, url: '' },
    ],
  },

  // 行管领导审核节点
  'briefingManagerReview_013': {
    plan: {
      PlanID: 'P001',
      PlanName: '第一轮巡察计划',
      InspectionSession: 20,
      InspectionYear: '2026',
      InspectionDepartMent: '长飞公司',
      InspectionTime: '2026年3月—5月',
      InspectionObject: '党委班子成员',
      InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
    },
    category: 'issue',
    issueSource: '查阅财务凭证及相关审批文件',
    specificIssue: '2024年度存在多笔费用报销未按规定附齐原始凭证，合计金额约12.6万元，涉及餐饮、差旅等类别。',
    keypointContent: '',
    disposalStatus: '已责成财务部门补充相关凭证并完善报销制度，建立月度内控自查机制。',
    referenceAdvice: '建议查阅2024年度费用报销台账、财务管理制度文件及历次审计报告。',
    remark: '问题已进入整改跟踪流程，预计一个月内完成整改。',
    attachments: [
      { name: '费用报销问题清单.xlsx', size: 48640, url: '' },
      { name: '整改措施说明.docx', size: 102400, url: '' },
    ],
    previewOpinion: '经审核，问题属实，已核查相关凭证，整改措施可行，同意提报处理意见。',
  },

  // ── BIZ_2026_014 各节点 formData ──────────────────────────

  'briefingFeedback_014': {
    plan: {
      PlanID: 'P001',
      PlanName: '第一轮巡察计划',
      InspectionSession: 20,
      InspectionYear: '2026',
      InspectionDepartMent: '长飞公司',
      InspectionTime: '2026年3月—5月',
      InspectionObject: '党委班子成员',
      InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
    },
    category: 'issue',
    issueSource: '查阅财务凭证及相关审批文件',
    specificIssue: '2024年度存在多笔费用报销未按规定附齐原始凭证，合计金额约12.6万元，涉及餐饮、差旅等类别。',
    keypointContent: '',
    disposalStatus: '已责成财务部门补充相关凭证并完善报销制度，建立月度内控自查机制。',
    referenceAdvice: '建议查阅2024年度费用报销台账、财务管理制度文件及历次审计报告。',
    remark: '问题已进入整改跟踪流程，预计一个月内完成整改。',
    attachments: [
      { name: '费用报销问题清单.xlsx', size: 48640, url: '' },
      { name: '整改措施说明.docx', size: 102400, url: '' },
    ],
  },

  'briefingManagerReview_014': {
    plan: {
      PlanID: 'P001',
      PlanName: '第一轮巡察计划',
      InspectionSession: 20,
      InspectionYear: '2026',
      InspectionDepartMent: '长飞公司',
      InspectionTime: '2026年3月—5月',
      InspectionObject: '党委班子成员',
      InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
    },
    category: 'issue',
    issueSource: '查阅财务凭证及相关审批文件',
    specificIssue: '2024年度存在多笔费用报销未按规定附齐原始凭证，合计金额约12.6万元，涉及餐饮、差旅等类别。',
    keypointContent: '',
    disposalStatus: '已责成财务部门补充相关凭证并完善报销制度，建立月度内控自查机制。',
    referenceAdvice: '建议查阅2024年度费用报销台账、财务管理制度文件及历次审计报告。',
    remark: '问题已进入整改跟踪流程，预计一个月内完成整改。',
    attachments: [
      { name: '费用报销问题清单.xlsx', size: 48640, url: '' },
      { name: '整改措施说明.docx', size: 102400, url: '' },
    ],
    previewOpinion: '经审核，问题属实，已核查相关凭证，整改措施可行，同意提报处理意见。',
  },

  'briefingLeaderApproval_014': {
    plan: {
      PlanID: 'P001',
      PlanName: '第一轮巡察计划',
      InspectionSession: 20,
      InspectionYear: '2026',
      InspectionDepartMent: '长飞公司',
      InspectionTime: '2026年3月—5月',
      InspectionObject: '党委班子成员',
      InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
    },
    category: 'issue',
    issueSource: '查阅财务凭证及相关审批文件',
    specificIssue: '2024年度存在多笔费用报销未按规定附齐原始凭证，合计金额约12.6万元，涉及餐饮、差旅等类别。',
    keypointContent: '',
    disposalStatus: '已责成财务部门补充相关凭证并完善报销制度，建立月度内控自查机制。',
    referenceAdvice: '建议查阅2024年度费用报销台账、财务管理制度文件及历次审计报告。',
    remark: '问题已进入整改跟踪流程，预计一个月内完成整改。',
    attachments: [
      { name: '费用报销问题清单.xlsx', size: 48640, url: '' },
      { name: '整改措施说明.docx', size: 102400, url: '' },
    ],
    managerOpinion: '经审核，问题属实，已核查相关凭证，整改措施可行，同意提报处理意见。',
    leaderOpinion: '问题定性准确，整改方向正确，同意提报巡察主管审核，建议加强后续跟踪问效。',
  },
  'briefingLeaderApproval_015': {
    plan: BRIEFING_PLAN,

    objectFeedbacks: [
      {
        ...FEEDBACKS_BASE[0],   // 党委班子成员
        managerOpinion: '经审核，该问题属实，反馈材料齐全。"三重一大"决策程序失范问题性质较严重，建议巡察组重点关注相关领导责任落实情况，并核查补录纪要的真实性。',
        leaderOpinion: '同意行管意见。"三重一大"问题涉及重大决策程序，应列为本次巡察重点事项，巡察组进驻后优先调取原始会议材料进行核实，如发现弄虚作假行为，依规处理。',
        chiefOpinion: '综合行管和分管意见，该问题已认定为本次巡察重点问题线索（一级）。决策程序失范属于主体责任落实不力的具体表现，进驻后由第一小组负责人专项跟进，同步调取近三年所有"三重一大"会议记录，不得遗漏。如发现材料造假，立即启动问责程序。',
      },
      {
        ...FEEDBACKS_BASE[1],   // 纪检监察室
        managerOpinion: '信访件超期问题客观存在，整改承诺已收到。建议巡察组进驻后实地核查5件积压案件的实际状态，防止以整改之名拖延处理。',
        leaderOpinion: '同意。纪检监察室作为监督执纪的职能部门，自身存在积压问题，影响较坏。巡察组应同步关注是否存在选择性执法、人情办案等深层问题。',
        chiefOpinion: '该部门列为重点关注对象（二级）。信访积压问题已要求提前整改，进驻时重点核实整改落实情况及5件积压案件的真实处置状态。同时对近两年问题线索移送情况进行全面梳理，重点关注移送程序是否规范、是否存在压案不查情形。',
      },
      {
        ...FEEDBACKS_BASE[2],   // 财务部
        managerOpinion: '财务问题点多、涉及金额较大，整改措施已启动但尚未完成。建议巡察组重点核查工程款拨付问题，150万元无验收报告存在较高廉洁风险。',
        leaderOpinion: '财务问题较为突出，特别是工程款拨付问题，不排除存在利益输送情形，巡察组应将此作为重要线索深入调查。其余报销问题作为一般性管理漏洞对待，要求整改到位即可。',
        chiefOpinion: '财务部工程款拨付问题认定为重点疑似问题线索（一级），进驻后由第二小组负责，重点调取2笔共150万元工程款的完整审批链条、合同文本、验收记录及往来沟通记录；同步核查经办人员及分管领导是否与施工方存在利益关联。费用报销和用车超标问题按一般整改事项跟踪，不单独列入重点线索。',
      },
      {
        ...FEEDBACKS_BASE[3],   // 人力资源部
        managerOpinion: '干部选拔程序问题和绩效人情打分问题均需关注，建议巡察组调取相关原始材料进行核实，重点了解背后是否存在干预用人的情况。',
        leaderOpinion: '同意行管意见。干部选拔问题涉及党风廉政，应重点核查。绩效打分问题如属实，需追究考核负责人责任，巡察组应一并了解考核委员会运作情况。',
        chiefOpinion: '干部选拔程序问题列为关注事项（三级），进驻后核实程序缺失的具体情形，重点了解是否有人为规避民主程序的主观故意。绩效打分人情问题进行常规核查，调取评分原始记录及打分人员花名册，如发现明显异常再提级处理。',
      },
    ],
  },
  'briefingFeedback_011_view': {
    plan: {
      PlanID: 'P001',
      PlanName: '第一轮巡察计划',
      InspectionSession: 20,
      InspectionYear: '2026',
      InspectionDepartMent: '长飞公司',
      InspectionTime: '2026年3月—5月',
      InspectionObject: '党委班子成员',
      InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
    },
    category: 'issue',
    issueSource: '查阅财务凭证及相关审批文件',
    specificIssue: '2024年度存在多笔费用报销未按规定附齐原始凭证，合计金额约12.6万元，涉及餐饮、差旅等类别。',
    keypointContent: '',
    disposalStatus: '已责成财务部门补充相关凭证并完善报销制度，建立月度内控自查机制。',
    referenceAdvice: '建议查阅2024年度费用报销台账、财务管理制度文件及历次审计报告。',
    remark: '问题已进入整改跟踪流程，预计一个月内完成整改。',
    attachments: [
      { name: '费用报销问题清单.xlsx', size: 48640, url: '' },
      { name: '整改措施说明.docx', size: 102400, url: '' },
    ],
    previewOpinion: '',
  },
  'briefingFeedbackView_012': {
    plan: {
      PlanID: 'P001',
      PlanName: '第一轮巡察计划',
      InspectionSession: 20,
      InspectionYear: '2026',
      InspectionDepartMent: '长飞公司',
      InspectionTime: '2026年3月—5月',
      InspectionObject: '党委班子成员',
      InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
    },
    category: 'issue',
    issueSource: '查阅财务凭证及相关审批文件',
    specificIssue: '2024年度存在多笔费用报销未按规定附齐原始凭证，合计金额约12.6万元，涉及餐饮、差旅等类别。',
    keypointContent: '',
    disposalStatus: '已责成财务部门补充相关凭证并完善报销制度，建立月度内控自查机制。',
    referenceAdvice: '建议查阅2024年度费用报销台账、财务管理制度文件及历次审计报告。',
    remark: '问题已进入整改跟踪流程，预计一个月内完成整改。',
    attachments: [
      { name: '费用报销问题清单.xlsx', size: 48640, url: '' },
      { name: '整改措施说明.docx', size: 102400, url: '' },
    ],
    previewOpinion: '经审核，问题属实，已核查相关凭证，整改措施可行，同意提报处理意见。',
  },

  'briefingFeedback_011': {
    plan: {
      PlanID: 'P001',
      PlanName: '第一轮巡察计划',
      InspectionSession: 20,
      InspectionYear: '2026',
      InspectionDepartMent: '长飞公司',
      InspectionTime: '2026年3月—5月',
      InspectionObject: '党委班子成员',
      InspectionContent: '重点检查党委班子成员落实全面从严治党主体责任情况，聚焦"关键少数"，严肃查处违反政治纪律行为。',
    },
    category: 'issue',
    issueSource: '查阅财务凭证及相关审批文件',
    specificIssue: '2024年度存在多笔费用报销未按规定附齐原始凭证，合计金额约12.6万元，涉及餐饮、差旅等类别。',
    keypointContent: '',
    disposalStatus: '已责成财务部门补充相关凭证并完善报销制度，建立月度内控自查机制。',
    referenceAdvice: '建议查阅2024年度费用报销台账、财务管理制度文件及历次审计报告。',
    remark: '问题已进入整改跟踪流程，预计一个月内完成整改。',
    attachments: [
      { name: '费用报销问题清单.xlsx', size: 48640, url: '' },
      { name: '整改措施说明.docx', size: 102400, url: '' },
    ],
  },

  'deptRecommend_007': {
    recommendedUsers: [
      { id: 'U001', name: '赵一鸣', workNo: 'EMP001', phone: '138-0000-0001', position: '组织部科员', orgId: 'ORG002', orgName: '组织部' },
      { id: 'U002', name: '李建国', workNo: 'EMP002', phone: '138-0000-0002', position: '财务部主管会计', orgId: 'ORG003', orgName: '财务部' },
    ],
    recommendRemark: '两名同志专业能力突出，综合素质优秀，符合选调条件。',
  },
  'personDetail_007_U001': {
    personDetail: {
      userId: 'U001', userName: '赵一鸣',
      nation: '汉族', nativePlace: '湖北武汉', birthPlace: '湖北武汉',
      healthStatus: '良好', partyJoinTime: '2015-06', workStartTime: '2013-07',
      currentPosition: '组织部科员', professionalTitle: '助理政工师',
      specialty: '党政管理、组织工作',
      fullTimeEducation: '本科', fullTimeDegree: '学士',
      fullTimeGraduateSchool: '武汉大学行政管理专业',
      onJobEducation: null, onJobDegree: null, onJobGraduateSchool: null,
      annualAssessment: '近三年优秀', rewardPunishment: '无',
      resume: '2013-07—2016-06  组织部  助理\n2016-06—至今  组织部  科员',
    },
  },
  'inspectionGroup_007': {
    candidates: [
      { userId: 'U001', userName: '赵一鸣', workNo: 'EMP001', phone: '138-0000-0001', currentPosition: '组织部科员', professionalTitle: '助理政工师', healthStatus: '良好', nation: '汉族', nativePlace: '湖北武汉', birthPlace: '湖北武汉', partyJoinTime: '2015-06', workStartTime: '2013-07', specialty: '党政管理、组织工作', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '武汉大学行政管理专业', onJobEducation: null, onJobDegree: null, onJobGraduateSchool: null, annualAssessment: '近三年优秀', rewardPunishment: '无', resume: '2013-07—2016-06  组织部  助理\n2016-06—至今  组织部  科员', fromPool: false },
      { userId: 'U002', userName: '李建国', workNo: 'EMP002', phone: '138-0000-0002', currentPosition: '财务部主管会计', professionalTitle: '高级会计师', healthStatus: '良好', nation: '汉族', nativePlace: '湖南长沙', birthPlace: '湖南长沙', partyJoinTime: '2010-06', workStartTime: '2008-07', specialty: '财务管理、审计', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '中南大学会计专业', onJobEducation: '在职研究生', onJobDegree: '硕士', onJobGraduateSchool: '中南财经政法大学', annualAssessment: '近三年优秀', rewardPunishment: '无', resume: '2008-07—2013-06  财务处  会计\n2013-06—2019-08  财务部  主管会计\n2019-08—至今  财务部  高级主管会计', fromPool: false },
      { userId: 'U003', userName: '王晓燕', workNo: 'EMP003', phone: '138-0000-0003', currentPosition: '纪检监察室副主任', professionalTitle: '政工师', healthStatus: '良好', nation: '汉族', nativePlace: '河南郑州', birthPlace: '河南郑州', partyJoinTime: '2011-07', workStartTime: '2009-07', specialty: '纪检监察、党务工作', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '郑州大学法学专业', onJobEducation: null, onJobDegree: null, onJobGraduateSchool: null, annualAssessment: '近三年良好', rewardPunishment: '2023年获优秀党员称号', resume: '2009-07—2014-05  综合办  干事\n2014-05—2020-03  纪检监察室  科员\n2020-03—至今  纪检监察室  副主任', fromPool: false },
    ],
    inspectionGroups: [
      { groupName: '第一巡察组', members: [{ userId: 'U001', userName: '赵一鸣', workNo: 'EMP001', phone: '138-0000-0001', currentPosition: '组织部科员', professionalTitle: '助理政工师', healthStatus: '良好', nation: '汉族', nativePlace: '湖北武汉', birthPlace: '湖北武汉', partyJoinTime: '2015-06', workStartTime: '2013-07', specialty: '党政管理、组织工作', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '武汉大学行政管理专业', onJobEducation: null, onJobDegree: null, onJobGraduateSchool: null, annualAssessment: '近三年优秀', rewardPunishment: '无', resume: '2013-07—2016-06  组织部  助理\n2016-06—至今  组织部  科员', fromPool: false }, { userId: 'P001', userName: '张志伟', workNo: 'P001', phone: '139-1111-0001', currentPosition: '审计部高级审计师', professionalTitle: '注册会计师', healthStatus: '良好', nation: '汉族', nativePlace: '北京', birthPlace: '北京', partyJoinTime: '2012-09', workStartTime: '2010-07', specialty: '财务审计、内控管理', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '中央财经大学审计专业', onJobEducation: '在职研究生', onJobDegree: '硕士', onJobGraduateSchool: '清华大学', annualAssessment: '近三年优秀', rewardPunishment: '无', resume: '2010-07—2015-06  审计处  助理审计师\n2015-06—2020-09  审计部  审计师\n2020-09—至今  审计部  高级审计师', fromPool: true }] },
      { groupName: '第二巡察组', members: [{ userId: 'U002', userName: '李建国', workNo: 'EMP002', phone: '138-0000-0002', currentPosition: '财务部主管会计', professionalTitle: '高级会计师', healthStatus: '良好', nation: '汉族', nativePlace: '湖南长沙', birthPlace: '湖南长沙', partyJoinTime: '2010-06', workStartTime: '2008-07', specialty: '财务管理、审计', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '中南大学会计专业', onJobEducation: '在职研究生', onJobDegree: '硕士', onJobGraduateSchool: '中南财经政法大学', annualAssessment: '近三年优秀', rewardPunishment: '无', resume: '2008-07—2013-06  财务处  会计\n2013-06—2019-08  财务部  主管会计\n2019-08—至今  财务部  高级主管会计', fromPool: false }, { userId: 'U003', userName: '王晓燕', workNo: 'EMP003', phone: '138-0000-0003', currentPosition: '纪检监察室副主任', professionalTitle: '政工师', healthStatus: '良好', nation: '汉族', nativePlace: '河南郑州', birthPlace: '河南郑州', partyJoinTime: '2011-07', workStartTime: '2009-07', specialty: '纪检监察、党务工作', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '郑州大学法学专业', onJobEducation: null, onJobDegree: null, onJobGraduateSchool: null, annualAssessment: '近三年良好', rewardPunishment: '2023年获优秀党员称号', resume: '2009-07—2014-05  综合办  干事\n2014-05—2020-03  纪检监察室  科员\n2020-03—至今  纪检监察室  副主任', fromPool: false }, { userId: 'P002', userName: '陈美玲', workNo: 'P002', phone: '139-1111-0002', currentPosition: '法务部合规专员', professionalTitle: '法律顾问', healthStatus: '良好', nation: '汉族', nativePlace: '广东广州', birthPlace: '广东广州', partyJoinTime: '2014-03', workStartTime: '2012-07', specialty: '法律合规、风险管理', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '中山大学法学院', onJobEducation: null, onJobDegree: null, onJobGraduateSchool: null, annualAssessment: '近三年良好', rewardPunishment: '无', resume: '2012-07—2017-08  法务处  助理\n2017-08—至今  法务部  合规专员', fromPool: true }] },
    ],
  },
  'personDetail_007_U002': {
    personDetail: {
      userId: 'U002', userName: '李建国',
      nation: '汉族', nativePlace: '湖南长沙', birthPlace: '湖南长沙',
      healthStatus: '良好', partyJoinTime: '2010-06', workStartTime: '2008-07',
      currentPosition: '财务部主管会计', professionalTitle: '高级会计师',
      specialty: '财务管理、审计',
      fullTimeEducation: '本科', fullTimeDegree: '学士',
      fullTimeGraduateSchool: '中南大学会计专业',
      onJobEducation: '在职研究生', onJobDegree: '硕士', onJobGraduateSchool: '中南财经政法大学',
      annualAssessment: '近三年优秀', rewardPunishment: '无',
      resume: '2008-07—2013-06  财务处  会计\n2013-06—2019-08  财务部  主管会计\n2019-08—至今  财务部  高级主管会计',
    },
  },
  'personDetail_007_U003': {
    personDetail: {
      userId: 'U003', userName: '王晓燕',
      nation: '汉族', nativePlace: '河南郑州', birthPlace: '河南郑州',
      healthStatus: '良好', partyJoinTime: '2011-07', workStartTime: '2009-07',
      currentPosition: '纪检监察室副主任', professionalTitle: '政工师',
      specialty: '纪检监察、党务工作',
      fullTimeEducation: '本科', fullTimeDegree: '学士',
      fullTimeGraduateSchool: '郑州大学法学专业',
      onJobEducation: null, onJobDegree: null, onJobGraduateSchool: null,
      annualAssessment: '近三年良好', rewardPunishment: '2023年获优秀党员称号',
      resume: '2009-07—2014-05  综合办  干事\n2014-05—2020-03  纪检监察室  科员\n2020-03—至今  纪检监察室  副主任',
    },
  },
  // inspectionReview_007 — 领导审核（已完成，MyApplication 查看时加载）
  'inspectionReview_007': {
    reviewComment: '经审核，巡察组组建合理，人员配置符合要求，廉政意见书材料齐全，同意本次人才选调方案。',
    // 后端存储的 minio 文件地址（若为签名 URL 场景则此处为空，由前端点击后再请求）
    integrityFileUrl: 'http://127.0.0.1:9000/inspection/integrity-BIZ_2025_007.pdf',
    integrityFileName: '廉政意见书-第二十届人才选调.pdf',
    planInfo: {
      PlanName: '第二十届巡察人才选调计划',
      InspectionSession: '第二十届',
      InspectionYear: '2026',
      InspectionDepartMent: '组织部、财务部、纪检监察室、信息技术部',
      InspectionTime: '2026-04-01 至 2026-06-30',
      InspectionClassName: '第一巡察组、第二巡察组',
      InspectionObject: '党委委员、处级以上干部',
      InspectionContent: '重点巡察干部选拔任用、廉洁自律、贯彻执行上级决策部署、落实党风廉政建设主体责任等情况',
      CreateUser: '督察办',
      CreateTime: '2026-03-10 11:00:00',
    },
    inspectionGroups: [
      {
        groupName: '第一巡察组', members: [
          { userId: 'U001', userName: '赵一鸣', workNo: 'EMP001', currentPosition: '组织部科员', fromPool: false, phone: '138-0000-0001', specialty: '党政管理', nation: '汉族', healthStatus: '良好', partyJoinTime: '2015-06', workStartTime: '2013-07', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '武汉大学行政管理专业', professionalTitle: '助理政工师', annualAssessment: '近三年优秀', rewardPunishment: '无', resume: '2013-07—2016-06  组织部  助理\n2016-06—至今  组织部  科员' },
          { userId: 'P001', userName: '张志伟', workNo: 'P001', currentPosition: '审计部高级审计师', fromPool: true, phone: '139-1111-0001', specialty: '财务审计', nation: '汉族', healthStatus: '良好', partyJoinTime: '2012-09', workStartTime: '2010-07', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '中央财经大学审计专业', professionalTitle: '注册会计师', annualAssessment: '近三年优秀', rewardPunishment: '无', resume: '2010-07—2015-06  审计处  助理\n2015-06—至今  审计部  高级审计师' },
        ]
      },
      {
        groupName: '第二巡察组', members: [
          { userId: 'U002', userName: '李建国', workNo: 'EMP002', currentPosition: '财务部主管会计', fromPool: false, phone: '138-0000-0002', specialty: '财务审计', nation: '汉族', healthStatus: '良好', partyJoinTime: '2010-06', workStartTime: '2008-07', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '中南大学会计专业', professionalTitle: '高级会计师', annualAssessment: '近三年优秀', rewardPunishment: '无', resume: '2008-07—2013-06  财务处  会计\n2013-06—至今  财务部  主管会计' },
          { userId: 'U003', userName: '王晓燕', workNo: 'EMP003', currentPosition: '纪检监察室副主任', fromPool: false, phone: '138-0000-0003', specialty: '纪检监察', nation: '汉族', healthStatus: '良好', partyJoinTime: '2011-07', workStartTime: '2009-07', fullTimeEducation: '本科', fullTimeDegree: '学士', fullTimeGraduateSchool: '郑州大学法学专业', professionalTitle: '政工师', annualAssessment: '近三年良好', rewardPunishment: '2023年获优秀党员称号', resume: '2009-07—2014-05  综合办  干事\n2020-03—至今  纪检监察室  副主任' },
        ]
      },
    ],
  },
}

/**
 * 获取节点列表（只含元信息 + viewComponentPath）
 * TODO: 替换为真实接口 GET /application/detail?businessId=xxx
 */
export const apiGetApplicationDetail = async (businessId) => {
  await delay(500)
  const nodes = MOCK_NODES[businessId] ?? []
  return { businessId, nodes }
}

/**
 * 按需获取单个节点的 formData
 * TODO: 替换为真实接口 GET /application/node-form-data?nodeKey=xxx
 */
export const apiGetNodeFormData = async (nodeKey) => {
  await delay(400)
  const formData = MOCK_FORM_DATA[nodeKey] ?? {}
  return { nodeKey, formData }
}