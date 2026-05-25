<template>
    <div class="system-top-bar">
        <!-- 左侧：Logo + 系统名称 -->
        <div class="top-bar-left">
            <div class="system-logo">
                <img src="/@/assets/images/process_icon.png" alt="logo" />
            </div>
            <div class="system-info">
                <h1 class="system-name">业务流程运行管理平台</h1>
                <!-- <span class="system-subtitle">巡察监督管理系统</span> -->
            </div>
        </div>

        <!-- 右侧：管理员信息 -->
        <div class="top-bar-right">
            <el-popover
                @show="onCurrentNavMenu(true)"
                @hide="onCurrentNavMenu(false)"
                placement="bottom-end"
                :hide-after="0"
                :width="260"
                trigger="click"
                popper-class="admin-info-popover"
                v-model:visible="state.showAdminInfoPopover"
            >
                <template #reference>
                    <div class="admin-info" :class="state.isHover ? 'hover' : ''">
                        <div class="admin-name">{{ adminInfo.nickname }}</div>
                        <el-avatar :size="32" :src="fullUrl(adminInfo.avatar)"></el-avatar>
                    </div>
                </template>
                <div>
                    <div class="admin-info-content">
                        <el-avatar :size="60" :src="fullUrl(adminInfo.avatar)"></el-avatar>
                        <div class="admin-details">
                            <div class="admin-name-large">{{ adminInfo.nickname }}</div>
                            <div class="admin-lasttime">{{ adminInfo.last_login_time }}</div>
                        </div>
                    </div>
                    <div class="admin-info-actions">
                        <el-button @click="onAdminInfo" type="primary" plain>个人资料</el-button>
                        <el-button @click="onLogout" plain>退出登录</el-button>
                    </div>
                </div>
            </el-popover>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAdminInfo } from '/@/stores/adminInfo'
import { useSiteConfig } from '/@/stores/siteConfig'
import { fullUrl } from '/@/utils/common'
import { routePush } from '/@/utils/router'
import { logout } from '/@/api/backend/index'
import { Local } from '/@/utils/storage'
import { ADMIN_INFO } from '/@/stores/constant/cacheKey'
import router from '/@/router'

const adminInfo = useAdminInfo()
const siteConfig = useSiteConfig()

const state = reactive({
    isHover: false,
    showAdminInfoPopover: false,
})

const onCurrentNavMenu = (status: boolean) => {
    state.isHover = status
}

const onAdminInfo = () => {
    state.showAdminInfoPopover = false
    routePush({ name: 'routine/adminInfo' })
}

const onLogout = () => {
    logout().then(() => {
        Local.remove(ADMIN_INFO)
        router.go(0)
    })
}
</script>

<style scoped lang="scss">
.system-top-bar {
    --streamline-primary: #0066cc;
    --streamline-ink: #fff;
    --streamline-muted: #7a7a7a;
    --streamline-parchment: #f5f5f7;
    --streamline-hairline: #e0e0e0;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 48px; /* Apple 风格高度 */
    /* 顶部导航 */
    background: #0066cc;
    backdrop-filter: blur(20px) saturate(180%); /* 毛玻璃效果 */
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--streamline-hairline);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    z-index: 1000;
}

/* 左侧区域 */
.top-bar-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.system-logo {
    width: 32px;
    height: 32px;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
}

.system-info {
   
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.system-name {
    font-size: 23px;
    font-weight: 600;
    color: var(--streamline-ink);
    margin: 0;
    letter-spacing: -0.022em; /* Apple 字距 */
}

.system-subtitle {
    font-size: 13px;
    font-weight: 400;
    color: var(--streamline-muted);
}

/* 右侧区域 */
.top-bar-right {
    display: flex;
    align-items: center;
}

.admin-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover,
    &.hover {
        background-color: rgba(0, 102, 204, 0.08);
    }
}

.admin-name {
    font-size: 14px;
    font-weight: 400;
    color: var(--streamline-ink);
}

/* Popover 内容样式 */
.admin-info-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 0;
    gap: 12px;
}

.admin-details {
    text-align: center;
}

.admin-name-large {
    font-size: 17px;
    font-weight: 600;
    color: var(--streamline-ink);
    margin-bottom: 4px;
}

.admin-lasttime {
    font-size: 13px;
    color: var(--streamline-muted);
}

.admin-info-actions {
    display: flex;
    gap: 10px;
    padding: 16px 0 0;
    border-top: 1px solid var(--streamline-hairline);
    justify-content: center;
}
</style>

<style lang="scss">
/* 全局 Popover 样式 */
.admin-info-popover.el-popover {
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid #e0e0e0;
    background: #ffffff;
}
</style>
