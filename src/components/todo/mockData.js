/**
 * Temporary organization/user data for ContactSelector.
 *
 * A04 moved workflow API calls to /@/api/workflow/processApi.
 * Keep this file limited to selector seed data until organization APIs are
 * wired in, then remove the remaining imports from MyTodo.
 */

export const mockOrgList = [
  { id: 'org_001', pid: null, name: '巡察监督管理局' },
  { id: 'org_002', pid: 'org_001', name: '巡察一室' },
  { id: 'org_003', pid: 'org_001', name: '巡察二室' },
  { id: 'org_004', pid: 'org_001', name: '综合办公室' },
]

export const mockUserList = [
  {
    id: 'u_001',
    name: '王局长',
    workNo: 'EMP001',
    phone: '13800000001',
    position: '局长',
    orgId: 'org_001',
  },
  {
    id: 'u_002',
    name: '陈副局长',
    workNo: 'EMP002',
    phone: '13800000002',
    position: '副局长',
    orgId: 'org_001',
  },
  {
    id: 'u_003',
    name: '李主任',
    workNo: 'EMP003',
    phone: '13800000003',
    position: '主任',
    orgId: 'org_002',
  },
  {
    id: 'u_004',
    name: '张巡察',
    workNo: 'EMP004',
    phone: '13800000004',
    position: '巡察专员',
    orgId: 'org_002',
  },
  {
    id: 'u_005',
    name: '刘主任',
    workNo: 'EMP005',
    phone: '13800000005',
    position: '主任',
    orgId: 'org_003',
  },
  {
    id: 'u_006',
    name: '赵室长',
    workNo: 'EMP006',
    phone: '13800000006',
    position: '室长',
    orgId: 'org_004',
  },
]
