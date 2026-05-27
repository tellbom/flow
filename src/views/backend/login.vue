<!--
 * @Author: fzq
 * @Date: 2026-05-27 11:44:01
 * @LastEditors: fzq
 * @LastEditTime: 2026-05-27 14:07:54
 * @Description: 
 * @FilePath: \web\src\views\backend\login.vue
-->
<template>
    <div class="keycloak-login-page">
        <div class="login-card">
            <div class="login-title">正在进入统一认证</div>
            <div class="login-subtitle">即将跳转到 Keycloak 登录页面</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import router from '/@/router'
import { adminBaseRoutePath } from '/@/router/static/adminBase'
import { useAdminInfo } from '/@/stores/adminInfo'
import { initRbacBridge } from '/@/api/backend/rbac/bridge'
import { loginWithKeycloak } from '/@/utils/keycloak'

const adminInfo = useAdminInfo()

onMounted(async () => {
    try {
        const authenticated = await loginWithKeycloak()
        if (!authenticated) return

        const bridge = await initRbacBridge()
        if (!bridge.success) {
            ElMessage.error(bridge.reason || '无权限进入系统，请联系管理员')
            adminInfo.removeToken()
            return
        }
        router.replace({ path: adminBaseRoutePath+bridge.routePath})
    } catch (error) {
        console.error('[login] Keycloak login failed:', error)
        ElMessage.error('统一认证登录失败，请稍后重试')
        adminInfo.removeToken()
    }
})
</script>

<style scoped lang="scss">
.keycloak-login-page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: #f5f5f7;
}

.login-card {
    width: 320px;
    padding: 28px;
    border-radius: 12px;
    border: 1px solid #e0e0e0;
    background: #fff;
    text-align: center;
}

.login-title {
    color: #1d1d1f;
    font-size: 18px;
    font-weight: 600;
}

.login-subtitle {
    margin-top: 8px;
    color: #7a7a7a;
    font-size: 14px;
}
</style>
