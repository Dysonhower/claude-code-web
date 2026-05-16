# Claude Web

[English Documentation](README_EN.md)

Claude Code CLI 的 Web 前端包装器，提供浏览器界面与 Claude 进行交互。

## 功能特性

- 🗣️ **对话管理** — 创建、切换、删除多个对话
- 📡 **实时流式输出** — SSE 实时显示 Claude 响应
- 🛠️ **工具调用可视化** — 显示 Claude 执行的工具及结果
- 🧠 **思考块展示** — 可折叠的 thinking 过程展示
- ⏹️ **停止生成** — 随时中止长时间运行的请求
- 📊 **Token 统计** — 每次响应显示输入/输出 token 数量

## 安全说明

⚠️ **此项目使用 `--dangerously-skip-permissions` 标志运行 Claude CLI，所有工具权限检查都被绕过。**

仅建议在本地开发环境使用，不要暴露到公网。

## 快速开始

### 安装依赖

```bash
cd [your claude web location]
npm install
```

### 启动服务

```bash
npm start
# 或双击 start.bat (Windows)
```

服务启动后访问 http://localhost:3000

### 前置要求

- Node.js 18+
- Claude Code CLI 已安装并配置好 API 密钥

## 安全加固

本项目已实施以下安全措施：

| 类别 | 修复项 |
|------|--------|
| 网络隔离 | 监听 `127.0.0.1`，拒绝外部访问 |
| 命令执行 | `shell: false` + cross-spawn，防止命令注入 |
| 路径安全 | UUID 正则验证，防止路径遍历攻击 |
| XSS 防护 | DOMPurify 替换正则黑名单，防止恶意 HTML |
| 进程管理 | finalize 收敛函数，防止重复响应；detached 进程组，确保 Linux 下 kill 生效 |
| 数据安全 | JSON 临时文件 + rename，防止写入中断导致数据损坏 |

## 项目结构

```
claude-web/
├── server.js           # Express 后端服务
├── package.json        # 项目依赖
├── start.bat           # Windows 启动脚本
├── public/
│   ├── index.html      # 主页面
│   ├── app.js          # 前端逻辑
│   └── style.css       # 样式表
└── data/
    └── conversations/  # 对话数据存储 (JSON)
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/conversations` | GET | 列出所有对话 |
| `/api/conversations` | POST | 创建新对话 |
| `/api/conversations/:id` | GET | 获取对话详情 |
| `/api/conversations/:id` | DELETE | 删除对话 |
| `/api/conversations/:id/stream` | GET | SSE 事件流 |
| `/api/conversations/:id/send` | POST | 发送消息 |
| `/api/conversations/:id/abort` | POST | 停止生成 |

## 配置

通过环境变量配置：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3000 | 服务端口 |

## 许可证

MIT License
