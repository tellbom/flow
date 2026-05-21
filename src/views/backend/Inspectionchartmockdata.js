/*
 * @Author: fzq
 * @Date: 2026-04-08 22:39:34
 * @LastEditors: fzq
 * @LastEditTime: 2026-04-08 22:39:42
 * @Description: 
 * @FilePath: \flow\src\views\backend\Inspectionchartmockdata.js
 */
/**
 * InspectionChart 组件完整示例数据
 * 父组件中直接使用，替换真实接口后删除此文件
 *
 * 用法：
 *   import { PLAN_DATA, RECTIFY_DATA } from './InspectionChartMockData.js'
 *
 *   <InspectionChart :plan-data="PLAN_DATA" :rectify-data="RECTIFY_DATA" />
 */

// ─────────────────────────────────────────────────────────────────
//  planData — 巡察计划完成情况
//  字段说明：
//    year:      年份字符串
//    planned:   年度计划总数
//    completed: 已完成数
//    rate:      完成率（%，浮点）
//    objects:   本年各巡察单位明细（hover tooltip 展示）
//      └─ name:      单位名称
//         planned:   该单位计划数
//         completed: 已完成数
// ─────────────────────────────────────────────────────────────────
export const PLAN_DATA = [
  {
    year: '2023',
    planned: 18, completed: 14, rate: 77.8,
    objects: [
      { name: '长飞公司',   planned: 4, completed: 3 },
      { name: '航飞公司',   planned: 3, completed: 2 },
      { name: '无人机公司', planned: 4, completed: 3 },
      { name: '民航产业',   planned: 4, completed: 3 },
      { name: '通航公司',   planned: 3, completed: 3 },
    ],
  },
  {
    year: '2024',
    planned: 22, completed: 20, rate: 90.9,
    objects: [
      { name: '长飞公司',   planned: 5, completed: 5 },
      { name: '航飞公司',   planned: 4, completed: 4 },
      { name: '无人机公司', planned: 5, completed: 4 },
      { name: '民航产业',   planned: 5, completed: 4 },
      { name: '通航公司',   planned: 3, completed: 3 },
    ],
  },
  {
    year: '2025',
    planned: 28, completed: 23, rate: 82.1,
    objects: [
      { name: '长飞公司',   planned: 6, completed: 5 },
      { name: '航飞公司',   planned: 5, completed: 5 },
      { name: '无人机公司', planned: 6, completed: 5 },
      { name: '民航产业',   planned: 6, completed: 4 },
      { name: '通航公司',   planned: 5, completed: 4 },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────
//  rectifyData — 巡察问题整改情况
//  结构：{ [年份]: 部门数组 }
//  字段说明：
//    dept:      部门名称（X 轴，超长自动截断）
//    total:     巡察发现问题总数
//    rectified: 已整改数
//    rate:      整改率（%，浮点）
// ─────────────────────────────────────────────────────────────────
export const RECTIFY_DATA = {
  '2023': [
    { dept: '党委办公室',       total: 5,  rectified: 5,  rate: 100  },
    { dept: '纪检监察室',       total: 8,  rectified: 7,  rate: 87.5 },
    { dept: '财务部',           total: 6,  rectified: 4,  rate: 66.7 },
    { dept: '人力资源部',       total: 4,  rectified: 3,  rate: 75   },
    { dept: '工程管理部',       total: 7,  rectified: 6,  rate: 85.7 },
  ],
  '2024': [
    { dept: '党委办公室',       total: 6,  rectified: 6,  rate: 100  },
    { dept: '纪检监察室',       total: 10, rectified: 9,  rate: 90   },
    { dept: '财务部',           total: 8,  rectified: 6,  rate: 75   },
    { dept: '人力资源部',       total: 5,  rectified: 4,  rate: 80   },
    { dept: '工程管理部',       total: 9,  rectified: 8,  rate: 88.9 },
    { dept: '安全生产管理部',   total: 11, rectified: 10, rate: 90.9 },
    { dept: '业务发展部',       total: 7,  rectified: 5,  rate: 71.4 },
  ],
  '2025': [
    { dept: '党委办公室',       total: 8,  rectified: 6,  rate: 75   },
    { dept: '纪检监察室',       total: 12, rectified: 10, rate: 83.3 },
    { dept: '财务部',           total: 10, rectified: 7,  rate: 70   },
    { dept: '人力资源部',       total: 6,  rectified: 5,  rate: 83.3 },
    { dept: '工程管理部',       total: 11, rectified: 9,  rate: 81.8 },
    { dept: '安全生产管理部',   total: 13, rectified: 11, rate: 84.6 },
    { dept: '业务发展部',       total: 8,  rectified: 6,  rate: 75   },
    { dept: '审计合规部',       total: 5,  rectified: 4,  rate: 80   },
  ],
}