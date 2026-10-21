# CoWorker House

**让好点子，在这里发生。** 由 [Yijia Dou](https://github.com/auroradou0816) 维护。

[English](README.md) · [Deployment guide](DeploymentGuide.md) · [项目来源](PROJECT_ORIGIN.md) · [安全说明](SECURITY.zh.md)

CoWorker House 是一个共享协作空间，将实时房间聊天、可选的 AI 对话和沙盒编程工作区结合起来。新版创意工作室首页提供创建房间、邀请加入和项目卡片，支持桌面与手机。

## 功能与边界

- 多人房间、持久化消息、成员权限、图片上传和断线补同步。
- 创意工作室首页、房间卡片、深浅主题和五种界面语言。
- 独立 BullMQ Worker 执行的 AI 对话，需要自行配置模型密钥。
- 文件、终端、预览和编程 Agent 工作区，需要自行配置 E2B 沙盒与凭据。
- Google 登录需要自己的 OAuth 配置，仓库不附带可直接使用的登录配置。

## 技术结构

React / TypeScript / Vite / HeroUI 前端通过 HTTP 和 Socket.IO 连接 Node.js 后端。PostgreSQL 保存业务数据与房间事件，Redis 提供在线状态、临时通知和缓存，BullMQ 安排任务。独立 AI Worker 执行模型请求，SeaweedFS 提供兼容 S3 的文件存储，E2B 是可选的代码执行环境。

房间事件用于补齐漏掉的实时通知；AI 任务与派发意图同事务写入 PostgreSQL，再转交 BullMQ。`docs/` 中的历史工程记录说明继承的设计与能力，不代表当前部署已启用所有功能。

## 运行与部署

开发环境需要 Node.js 24.18.0 或更高版本。Dockerfile 会构建前后端，由 App 提供网页。

按英文版 [DeploymentGuide.md](DeploymentGuide.md) 在本地启动 Compose，或在 AWS Lightsail 启用可选 Caddy 公网 profile。部署使用两个免费的 DuckDNS 子域名分别承载网页和签名媒体，由 Caddy 自动申请 HTTPS 证书；应用和数据服务由 Caddy 代理并保持私有。不要提交 `.env.compose`、DuckDNS token、私钥或真实凭据。

线上 Demo：[coworker-house-app.duckdns.org](https://coworker-house-app.duckdns.org/)。2026-10-21 已验证 HTTPS、Socket.IO/WSS、两个客户端的房间消息、重连后的历史恢复，以及 HTTPS 媒体上传和下载。验收时 Lightsail 上的 App、Worker、PostgreSQL、Redis、SeaweedFS 均健康；该实例未启用 AI 和 E2B。当前防火墙检查结果和运维命令见英文部署指南。

## 维护与来源

维护者：**Yijia Dou**；联系邮箱：**auroradou0816@gmail.com**。

本项目经原作者授权进行二次开发。来源及 Git 元数据改写说明见 [PROJECT_ORIGIN.md](PROJECT_ORIGIN.md)。保留已有第三方许可证；仓库公开本身不等于为全部组件授予新的统一许可证。
