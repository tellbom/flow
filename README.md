

# Oversia

Oversia 是一个基于 Vue 3 + TypeScript + Element Plus 构建的企业级管理系统，提供完善的用户权限管理、数据安全、操作日志等功能。

## 技术栈

- **前端框架**: Vue 3
- **语言**: TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI 组件库**: Element Plus
- **HTTP 请求**: Axios
- **构建工具**: Vite
- **代码规范**: ESLint + Prettier

## 项目结构

```
src/
├── api/                    # API 接口层
│   ├── backend/          # 后台管理 API
│   └── frontend/         # 前端用户 API
├── assets/               # 静态资源
├── components/           # 公共组件
│   ├── baInput/         # 表单输入组件
│   ├── claudetable/     # 表格组件
│   ├── table/           # 表格渲染
│   └── todo/            # 工作流组件
├── layouts/              # 布局组件
│   ├── backend/         # 后台布局
│   ├── common/          # 公共布局
│   └── frontend/        # 前端布局
├── lang/                 # 国际化语言包
│   ├── backend/         # 后台语言
│   ├── common/          # 公共语言
│   └── frontend/        # 前端语言
├── router/               # 路由配置
├── stores/               # Pinia 状态管理
├── styles/               # 全局样式
├── utils/                # 工具函数
└── views/                # 页面视图
    ├── backend/          # 后台管理页面
    ├── common/           # 公共页面
    └── frontend/         # 前端用户页面
```

## 功能特性

### 后台管理
- 用户管理 - 管理员账号管理
- 用户组管理 - 权限组配置
- 规则管理 - 权限规则设置
- 模块管理 - 系统模块安装与配置
- 系统配置 - 系统参数配置
- 附件管理 - 文件上传与管理
- 安全中心 - 数据回收站、敏感数据管理
- 操作日志 - 管理员操作记录
- 工作流 - 审批流程管理

### 前端用户中心
- 用户登录/注册
- 账户余额
- 积分管理
- 个人资料
- 密码修改

### 系统特性
- 响应式布局，支持多种屏幕尺寸
- 暗色/亮色主题切换
- 国际化支持（中英文）
- RBAC 权限控制
- 数据回收机制
- 敏感数据保护
- 操作日志审计

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

## 配置

项目支持多环境配置：
- `.env` - 默认配置
- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

## 许可证

MIT License