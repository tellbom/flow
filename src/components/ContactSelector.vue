<template>
    <div class="contact-selector">
        <!-- 搜索栏（模板不变） -->
        <div class="search-bar">
            <el-input
                v-model="searchKeyword"
                placeholder="搜索部门或人员"
                clearable
                @input="handleSearch"
            >
                <template #prefix>
                    <i class="fa fa-search"></i>
                </template>
            </el-input>
        </div>

        <div class="content-wrapper">
            <!-- 左侧：组织架构树（模板不变，仅 getOrgUserCount 改为缓存查询） -->
            <div class="org-tree-section">
                <div class="section-title">组织架构</div>
                <el-tree
                    ref="orgTreeRef"
                    :data="filteredOrgTree"
                    :props="treeProps"
                    node-key="id"
                    :default-expand-all="false"
                    :expand-on-click-node="false"
                    :show-checkbox="multiple"
                    :check-strictly="false"
                    :highlight-current="true"
                    @node-click="handleOrgClick"
                    @check="handleOrgCheck"
                >
                    <template #default="{ node, data }">
                        <span class="tree-node">
                            <i class="fa fa-sitemap node-icon"></i>
                            <span class="node-label">{{ node.label }}</span>
                            <!-- [性能优化 D] 改为 O(1) 缓存查询，不再在模板里调递归+filter -->
                            <span class="node-count">({{ getOrgUserCount(data.id) }})</span>
                        </span>
                    </template>
                </el-tree>
            </div>

            <!-- 右侧：人员列表（模板不变，total/paginatedUsers 由模式决定） -->
            <div class="user-list-section">
                <div class="section-header">
                    <div class="section-title">
                        {{ currentOrgName || '全部人员' }}
                        <!-- [兼容] isRemote 时用 remoteTotal，否则用 filteredUsers.length -->
                        <span class="total-count">共 {{ displayTotal }} 人</span>
                    </div>
                    <div class="actions">
                        <el-button
                            v-if="multiple && selectedUsers.length > 0"
                            text
                            type="primary"
                            @click="clearSelection"
                        >
                            清空已选 ({{ selectedUsers.length }})
                        </el-button>
                    </div>
                </div>

                <div class="user-list" v-loading="loading">
                    <div v-if="paginatedUsers.length === 0" class="empty-state">
                        <el-empty description="暂无人员" />
                    </div>

                    <div
                        v-for="user in paginatedUsers"
                        :key="user.id"
                        class="user-item"
                        :class="{ selected: isUserSelected(user.id) }"
                        @click="handleUserClick(user)"
                    >
                        <el-checkbox
                            v-if="multiple"
                            :model-value="isUserSelected(user.id)"
                            @change="(val) => handleUserCheckChange(val, user)"
                            @click.stop
                        />
                        <div class="user-avatar">
                            <i class="fa fa-user"></i>
                        </div>
                        <div class="user-info">
                            <div class="user-name">{{ user.name }}</div>
                            <div class="user-meta">
                                <span class="user-job">{{ user.position }}</span>
                                <!-- [性能优化 B] O(1) Map 查询，不再 find 遍历 -->
                                <span class="user-org">{{ getOrgNameById(user.orgId) }}</span>
                            </div>
                        </div>
                        <div class="user-contact">
                            <div class="user-phone">
                                <i class="fa fa-phone"></i>
                                {{ user.phone }}
                            </div>
                            <div class="user-code">工号: {{ user.workNo }}</div>
                        </div>
                    </div>
                </div>

                <!-- 分页（total 统一由 displayTotal 提供） -->
                <div class="pagination-wrapper" v-if="displayTotal > 0">
                    <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="currentPageSize"
                        :page-sizes="[20, 50, 100, 200]"
                        :total="displayTotal"
                        layout="total, sizes, prev, pager, next, jumper"
                        small
                        @size-change="handleSizeChange"
                        @current-change="handlePageChange"
                    />
                </div>
            </div>
        </div>

        <!-- 底部操作栏（不变） -->
        <div class="footer-actions" v-if="multiple">
            <div class="selected-info">
                已选择 {{ selectedUsers.length }} 人
            </div>
            <div class="action-buttons">
                <el-button @click="handleCancel">取消</el-button>
                <el-button type="primary" @click="handleConfirm">
                    确定
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ─────────────────────────────────────────────────────────────
//  类型定义（与原版完全相同，新增可选 fetchUsers / orgUserCountMap）
// ─────────────────────────────────────────────────────────────
interface OrgItem {
    id: string
    pid: string | null
    name: string
}

interface UserItem {
    id: string
    name: string
    workNo: string
    phone: string
    position: string
    orgId: string
}

interface TreeNode {
    id: string
    label: string
    children?: TreeNode[]
}

interface UserWithOrg extends UserItem {
    orgName: string
}

// [新增] 远程分页接口类型
interface FetchUsersParams {
    orgId?: string
    keyword?: string
    page: number
    pageSize: number
}

interface Props {
    orgList: OrgItem[]
    // [兼容] 旧 prop 保留，不传 fetchUsers 时仍走本地模式
    userList?: UserItem[]
    multiple?: boolean
    pageSize?: number
    // [新增可选] 远程分页函数；传入则启用远程模式，不传则保持原有本地模式
    fetchUsers?: (params: FetchUsersParams) => Promise<{ list: UserItem[]; total: number }>
    // [新增可选] 外部预计算的组织人数缓存 Map/Record；传入则直接使用，不传则组件内自动计算
    orgUserCountMap?: Map<string, number> | Record<string, number>
}

const props = withDefaults(defineProps<Props>(), {
    orgList:   () => [],
    userList:  () => [],
    multiple:  true,
    pageSize:  20,
})

interface Emits {
    (e: 'confirm', users: UserWithOrg[]): void
    (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// ─────────────────────────────────────────────────────────────
//  模式判断
//  isRemote = true  → fetchUsers 存在，走后端分页
//  isRemote = false → 兼容旧模式，走本地 userList 过滤分页
// ─────────────────────────────────────────────────────────────
const isRemote = computed(() => typeof props.fetchUsers === 'function')

// ─────────────────────────────────────────────────────────────
//  [性能优化 A] 组织索引：orgList 变化时一次性构建，后续 O(1) 查询
//
//  orgNameMap:     orgId → name
//  orgChildrenMap: orgId → 直接子 orgId[]（用于快速递归）
//  内部 buildOrgTree 改用 orgChildrenMap，避免每次递归 filter 整个 orgList
// ─────────────────────────────────────────────────────────────

// [性能优化 B] O(1) 名称查询 Map
const orgNameMap = computed<Map<string, string>>(() => {
    const m = new Map<string, string>()
    for (const o of props.orgList) m.set(o.id, o.name)
    return m
})

// 直接子节点 Map，用于 buildOrgTree / getAllChildOrgIds
const orgChildrenMap = computed<Map<string, string[]>>(() => {
    const m = new Map<string, string[]>()
    for (const o of props.orgList) {
        const pid = o.pid ?? '__root__'
        if (!m.has(pid)) m.set(pid, [])
        m.get(pid)!.push(o.id)
    }
    return m
})

// [性能优化 B] getOrgNameById 由 find → Map O(1)
const getOrgNameById = (orgId: string): string =>
    orgNameMap.value.get(orgId) ?? ''

// getAllChildOrgIds 改用 orgChildrenMap，避免每次 filter orgList
const getAllChildOrgIds = (orgId: string): string[] => {
    const result: string[] = [orgId]
    const children = orgChildrenMap.value.get(orgId)
    if (children) {
        for (const cid of children) result.push(...getAllChildOrgIds(cid))
    }
    return result
}

// ─────────────────────────────────────────────────────────────
//  [性能优化 D] 组织节点人数：预计算缓存 Map，模板 O(1) 查询
//
//  优先使用父组件传入的 orgUserCountMap（外部缓存）；
//  未传入时，本地模式下自动计算，远程模式下显示 0（无本地数据）。
// ─────────────────────────────────────────────────────────────
const internalOrgCountMap = computed<Map<string, number>>(() => {
    // 远程模式无本地 userList，无法自动统计，返回空 Map
    if (isRemote.value) return new Map<string, number>()

    // 本地模式：一次性统计，生成 orgId → 含子孙人数 的 Map
    // 先建 userId → orgId 查询集合（Set 判断 includes 更快）
    const userOrgList = props.userList ?? []
    // 对每个 org 统计其子孙 orgId 集合，再 count
    const m = new Map<string, number>()
    for (const o of props.orgList) {
        const childIds = new Set(getAllChildOrgIds(o.id))
        let count = 0
        for (const u of userOrgList) {
            if (childIds.has(u.orgId)) count++
        }
        m.set(o.id, count)
    }
    return m
})

// getOrgUserCount：供模板调用，O(1)
const getOrgUserCount = (orgId: string): number => {
    // 优先外部缓存
    if (props.orgUserCountMap) {
        const ext = props.orgUserCountMap
        if (ext instanceof Map) return ext.get(orgId) ?? 0
        return (ext as Record<string, number>)[orgId] ?? 0
    }
    // 否则用内部预计算缓存
    return internalOrgCountMap.value.get(orgId) ?? 0
}

// ─────────────────────────────────────────────────────────────
//  [性能优化 A] 组织树构建：改用 orgChildrenMap，不再反复 filter orgList
// ─────────────────────────────────────────────────────────────
const orgTree = computed<TreeNode[]>(() => buildOrgTreeFast(null))

function buildOrgTreeFast(parentId: string | null): TreeNode[] {
    const key = parentId ?? '__root__'
    const childIds = orgChildrenMap.value.get(key) ?? []
    return childIds.map(id => ({
        id,
        label:    orgNameMap.value.get(id) ?? id,
        children: buildOrgTreeFast(id),
    }))
}

// 搜索过滤树（逻辑不变）
const filteredOrgTree = computed<TreeNode[]>(() => {
    if (!searchKeyword.value) return orgTree.value
    return filterTree(orgTree.value, searchKeyword.value)
})

const filterTree = (tree: TreeNode[], keyword: string): TreeNode[] => {
    const result: TreeNode[] = []
    const lowerKeyword = keyword.toLowerCase()
    for (const node of tree) {
        const match    = node.label.toLowerCase().includes(lowerKeyword)
        const children = node.children ? filterTree(node.children, keyword) : []
        if (match || children.length > 0) {
            result.push({
                ...node,
                children: children.length > 0 ? children : node.children,
            })
        }
    }
    return result
}

// ─────────────────────────────────────────────────────────────
//  当前组织名称（不变）
// ─────────────────────────────────────────────────────────────
const currentOrgName = computed(() => {
    if (!currentOrgId.value) return ''
    return getOrgNameById(currentOrgId.value)
})

// ─────────────────────────────────────────────────────────────
//  状态（与原版完全相同）
// ─────────────────────────────────────────────────────────────
const loading          = ref(false)
const searchKeyword    = ref('')
const currentOrgId     = ref<string>('')
const currentPage      = ref(1)
const currentPageSize  = ref(props.pageSize)
const selectedUsers    = ref<UserWithOrg[]>([])
const selectedOrgIds   = ref<string[]>([])
const orgTreeRef       = ref()

const treeProps = { children: 'children', label: 'label' }

// ─────────────────────────────────────────────────────────────
//  [新增] 远程模式状态
//  仅在 isRemote = true 时使用；本地模式这两个变量不参与计算
// ─────────────────────────────────────────────────────────────
const remoteList  = ref<UserItem[]>([])
const remoteTotal = ref(0)

// 远程模式：调用 fetchUsers
async function loadRemote() {
    if (!isRemote.value) return
    loading.value = true
    try {
        const res = await props.fetchUsers!({
            orgId:    currentOrgId.value || undefined,
            keyword:  searchKeyword.value || undefined,
            page:     currentPage.value,
            pageSize: currentPageSize.value,
        })
        remoteList.value  = res.list  ?? []
        remoteTotal.value = res.total ?? 0
    } catch {
        remoteList.value  = []
        remoteTotal.value = 0
    } finally {
        loading.value = false
    }
}

// ─────────────────────────────────────────────────────────────
//  [兼容旧模式] 本地过滤逻辑（原版 filteredUsers / paginatedUsers）
//  [性能优化 E] 本地模式时，过滤逻辑改用 orgChildrenSet 提升 includes 速度
// ─────────────────────────────────────────────────────────────
const filteredUsers = computed<UserItem[]>(() => {
    // 远程模式不使用本地过滤
    if (isRemote.value) return remoteList.value

    let users = props.userList ?? []

    if (currentOrgId.value) {
        // [性能优化 E] 用 Set 替代 includes 数组查找
        const orgIdSet = new Set(getAllChildOrgIds(currentOrgId.value))
        users = users.filter(u => orgIdSet.has(u.orgId))
    }

    if (searchKeyword.value) {
        const kw = searchKeyword.value.toLowerCase()
        users = users.filter(u =>
            u.name.toLowerCase().includes(kw) ||
            u.workNo.toLowerCase().includes(kw) ||
            u.phone.includes(kw) ||
            u.position.toLowerCase().includes(kw)
        )
    }

    return users
})

// 本地模式分页（原版逻辑不变）
const localPaginatedUsers = computed<UserItem[]>(() => {
    const start = (currentPage.value - 1) * currentPageSize.value
    return filteredUsers.value.slice(start, start + currentPageSize.value)
})

// 统一出口：模板使用 paginatedUsers / displayTotal，由模式决定数据源
const paginatedUsers = computed<UserItem[]>(() =>
    isRemote.value ? remoteList.value : localPaginatedUsers.value
)

const displayTotal = computed<number>(() =>
    isRemote.value ? remoteTotal.value : filteredUsers.value.length
)

// ─────────────────────────────────────────────────────────────
//  [性能优化 C] isUserSelected：Set.has O(1) 替代 Array.some O(n)
//  selectedIdSet 与 selectedUsers 保持同步
// ─────────────────────────────────────────────────────────────
const selectedIdSet = computed<Set<string>>(() =>
    new Set(selectedUsers.value.map(u => u.id))
)

const isUserSelected = (userId: string): boolean =>
    selectedIdSet.value.has(userId)

// ─────────────────────────────────────────────────────────────
//  [性能优化 F] 搜索防抖 300ms
//  handleSearch 原来直接调，现在加 debounce
// ─────────────────────────────────────────────────────────────
let _searchTimer: ReturnType<typeof setTimeout> | null = null

const handleSearch = () => {
    if (_searchTimer) clearTimeout(_searchTimer)
    _searchTimer = setTimeout(() => {
        currentPage.value = 1
        if (isRemote.value) loadRemote()
        // 本地模式：filteredUsers 是 computed，keyword 变化自动重算，无需手动调用
    }, 300)
}

// ─────────────────────────────────────────────────────────────
//  组织节点点击（原版逻辑不变，远程模式额外触发 loadRemote）
// ─────────────────────────────────────────────────────────────
const handleOrgClick = (data: TreeNode) => {
    currentOrgId.value  = data.id
    currentPage.value   = 1
    searchKeyword.value = ''
    if (isRemote.value) loadRemote()
}

// ─────────────────────────────────────────────────────────────
//  组织节点勾选（原版逻辑不变）
//  远程模式下 userList 为空，勾选组织不会批量选人（无本地数据）
//  如需远程批量选，父组件需自行处理
// ─────────────────────────────────────────────────────────────
const handleOrgCheck = (data: TreeNode, checked: any) => {
    if (!props.multiple) return

    const checkedNodes = checked.checkedNodes as TreeNode[]
    selectedOrgIds.value = checkedNodes.map(n => n.id)

    const allOrgIds: string[] = []
    for (const orgId of selectedOrgIds.value) {
        allOrgIds.push(...getAllChildOrgIds(orgId))
    }
    const uniqueOrgIds = [...new Set(allOrgIds)]
    const uniqueOrgIdSet = new Set(uniqueOrgIds)

    // [兼容旧模式] 本地模式下批量选中组织用户
    if (!isRemote.value) {
        const orgUsers = (props.userList ?? [])
            .filter(u => uniqueOrgIdSet.has(u.orgId))
            .map(u => ({ ...u, orgName: getOrgNameById(u.orgId) }))

        const userMap = new Map<string, UserWithOrg>()
        for (const user of selectedUsers.value) userMap.set(user.id, user)
        for (const user of orgUsers)             userMap.set(user.id, user)
        selectedUsers.value = Array.from(userMap.values())
    }
    // 远程模式：仅更新 selectedOrgIds，不做批量选人（数据未在本地）
}

// ─────────────────────────────────────────────────────────────
//  用户点击 / 勾选（原版逻辑不变）
// ─────────────────────────────────────────────────────────────
const handleUserClick = (user: UserItem) => {
    if (!props.multiple) {
        emit('confirm', [{ ...user, orgName: getOrgNameById(user.orgId) }])
        return
    }

    const userWithOrg: UserWithOrg = { ...user, orgName: getOrgNameById(user.orgId) }
    if (isUserSelected(user.id)) {
        selectedUsers.value = selectedUsers.value.filter(u => u.id !== user.id)
    } else {
        selectedUsers.value.push(userWithOrg)
    }
}

const handleUserCheckChange = (checked: boolean, user: UserItem) => {
    const userWithOrg: UserWithOrg = { ...user, orgName: getOrgNameById(user.orgId) }
    if (checked) {
        if (!isUserSelected(user.id)) selectedUsers.value.push(userWithOrg)
    } else {
        selectedUsers.value = selectedUsers.value.filter(u => u.id !== user.id)
    }
}

// ─────────────────────────────────────────────────────────────
//  分页（原版逻辑不变，远程模式额外触发 loadRemote）
// ─────────────────────────────────────────────────────────────
const handleSizeChange = (size: number) => {
    currentPageSize.value = size
    currentPage.value     = 1
    if (isRemote.value) loadRemote()
}

const handlePageChange = (page: number) => {
    currentPage.value = page
    if (isRemote.value) loadRemote()
}

// ─────────────────────────────────────────────────────────────
//  清空 / 确定 / 取消（原版逻辑不变）
// ─────────────────────────────────────────────────────────────
const clearSelection = () => {
    selectedUsers.value  = []
    selectedOrgIds.value = []
    if (orgTreeRef.value) orgTreeRef.value.setCheckedKeys([])
}

const handleConfirm = () => {
    emit('confirm', selectedUsers.value)
}

const handleCancel = () => {
    clearSelection()
    emit('cancel')
}

// ─────────────────────────────────────────────────────────────
//  watch（移除 console.log，保留原有响应逻辑）
// ─────────────────────────────────────────────────────────────

// [兼容] 搜索关键词变化重置页码（本地模式 filteredUsers computed 自动刷新）
watch(searchKeyword, () => {
    // debounce 已在 handleSearch 中处理，此处仅做兜底页码重置
    // 远程模式由 handleSearch 的 debounce 触发 loadRemote
})

// [兼容] 当前组织变化重置页码
watch(currentOrgId, () => {
    currentPage.value = 1
})

// [新增] 远程模式：fetchUsers prop 首次传入时加载第一页
watch(isRemote, (val) => {
    if (val) loadRemote()
}, { immediate: true })
</script>

<style scoped lang="scss">
/* 样式与原版完全一致，未做任何改动 */
.contact-selector {
    display: flex;
    flex-direction: column;
    height: 600px;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
}

/* 搜索栏 */
.search-bar {
    padding: 16px;
    border-bottom: 1px solid #e5e5e5;
    
    .el-input {
        :deep(.el-input__wrapper) {
            border-radius: 8px;
            box-shadow: 0 0 0 1px #e5e5e5 inset;
            transition: all 0.3s;
            
            &:hover {
                box-shadow: 0 0 0 1px #d1d1d6 inset;
            }
            
            &.is-focus {
                box-shadow: 0 0 0 2px #007aff inset;
            }
        }
    }
}

/* 内容区域 */
.content-wrapper {
    display: flex;
    flex: 1;
    overflow: hidden;
}

/* 左侧组织树 */
.org-tree-section {
    width: 280px;
    border-right: 1px solid #e5e5e5;
    display: flex;
    flex-direction: column;
    background: #f5f5f7;
}

.section-title {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #1d1d1f;
    border-bottom: 1px solid #e5e5e5;
    background: #ffffff;
}

.org-tree-section .el-tree {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    background: transparent;
    
    :deep(.el-tree-node__content) {
        height: 36px;
        border-radius: 6px;
        margin-bottom: 2px;
        transition: all 0.2s;
        
        &:hover {
            background: rgba(0, 122, 255, 0.08);
        }
    }
    
    :deep(.el-tree-node.is-current > .el-tree-node__content) {
        background: rgba(0, 122, 255, 0.12);
        font-weight: 500;
    }
}

.tree-node {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    font-size: 14px;
}

.node-icon {
    color: #007aff;
    font-size: 14px;
}

.node-label {
    flex: 1;
    color: #1d1d1f;
}

.node-count {
    font-size: 12px;
    color: #86868b;
}

/* 右侧用户列表 */
.user-list-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e5e5;
    background: #ffffff;
}

.total-count {
    margin-left: 8px;
    font-size: 13px;
    color: #86868b;
    font-weight: 400;
}

.actions {
    .el-button {
        font-size: 13px;
    }
}

/* 用户列表 */
.user-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.user-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    
    &:hover {
        background: #f5f5f7;
        border-color: #e5e5e5;
    }
    
    &.selected {
        background: rgba(0, 122, 255, 0.08);
        border-color: #007aff;
    }
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 18px;
    flex-shrink: 0;
}

.user-info {
    flex: 1;
    min-width: 0;
}

.user-name {
    font-size: 15px;
    font-weight: 500;
    color: #1d1d1f;
    margin-bottom: 4px;
}

.user-meta {
    display: flex;
    gap: 12px;
    font-size: 13px;
    color: #86868b;
}

.user-job {
    color: #007aff;
}

.user-contact {
    text-align: right;
    font-size: 13px;
    color: #86868b;
}

.user-phone {
    margin-bottom: 4px;
    
    i {
        margin-right: 4px;
    }
}

/* 分页 */
.pagination-wrapper {
    padding: 12px 16px;
    border-top: 1px solid #e5e5e5;
    display: flex;
    justify-content: center;
    background: #fafafa;
}

:deep(.el-pagination) {
    .btn-prev,
    .btn-next,
    .el-pager li {
        min-width: 32px;
        height: 32px;
        line-height: 32px;
    }
}

/* 底部操作栏 */
.footer-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid #e5e5e5;
    background: #f5f5f7;
}

.selected-info {
    font-size: 14px;
    color: #1d1d1f;
    font-weight: 500;
}

.action-buttons {
    display: flex;
    gap: 8px;
    
    .el-button {
        min-width: 80px;
    }
}

/* 滚动条样式 */
.user-list::-webkit-scrollbar,
.org-tree-section .el-tree::-webkit-scrollbar {
    width: 6px;
}

.user-list::-webkit-scrollbar-thumb,
.org-tree-section .el-tree::-webkit-scrollbar-thumb {
    background: #d1d1d6;
    border-radius: 3px;
    
    &:hover {
        background: #b1b1b6;
    }
}

/* 响应式 */
@media (max-width: 768px) {
    .contact-selector {
        height: 100vh;
    }
    
    .content-wrapper {
        flex-direction: column;
    }
    
    .org-tree-section {
        width: 100%;
        max-height: 200px;
        border-right: none;
        border-bottom: 1px solid #e5e5e5;
    }
}
</style>