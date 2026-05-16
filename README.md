# Claude Web

[English Documentation](README_EN.md)

Claude Code CLI 的 Web 前端包装器，提供浏览器界面与 Claude 进行交互。

## 功能特性

- 🗣️ **对话管理** — 创建、切换、删除多个对话
- 📡 **实时流式输出** — SSE 实时显示 Claude 响应
- 🛠️ **工具调用可视化** — 显示 Claude 执行的工具及结果
- 🧠 **思考块展示** — 可折叠的 thinking 过程展示
- ⏹️ **停止生成** — 随时中止长时间运行的请求
- 🐱 **桌宠系统** — 可交互的角色桌宠，与任务状态联动

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

---

## 桌宠系统 (Pet System)

桌宠系统是本项目的特色功能，提供可交互的角色形象，通过 SSE 事件流与 Claude 任务状态实时联动。

### 已实现角色

| 角色 | 来源 | 特点 |
|------|------|------|
| 奇犽 (Killua) | 《全职猎人》 | 杀手家族出身，电光石火，台词带有自信和冷静风格 |
| 绫波丽 (Ayanami) | 《新世纪福音战士》 | EVA 零号机驾驶员，台词简洁、冷峻，带有机械感 |

### 状态机

每个角色支持 6 种状态，通过 SSE 事件自动切换：

| 状态 | 触发时机 | 动画效果 | 气泡几率 |
|------|---------|---------|---------|
| **idle** | 默认/空闲 | 呼吸动画 | 60%（定时触发） |
| **thinking** | 任务开始、工具调用 | 歪头动画 | **100%** |
| **talking** | 收到文本输出 | 点头动画 | — |
| **happy** | 任务完成 | 弹跳动画 | **100%** |
| **sad** | 失落状态 | 无动画 | — |
| **error** | 出错 | 抖动动画 | **100%** |

### 气泡系统

- **位置**：固定在角色头部上方，居中显示
- **持续时间**：6 秒后淡出消失
- **触发频率**：
  - 非idle状态（任务相关）：**100%** 必定显示
  - idle状态（闲时）：平均每 **10秒** 触发一次，60% 几率显示
- **重叠处理**：新气泡替换旧气泡
- **拖拽同步**：拖动角色时气泡位置实时跟随

### SSE 事件联动

```javascript
// pet.js 核心事件处理
switch (event.type) {
  case '_send_start':      // 用户发送消息 → thinking + 台词
  case 'stream_event':     // text_delta → talking; tool_use → thinking + 台词
  case 'result':           // 完成 → happy + 台词
  case 'done':             // 结束 → idle
  case 'error':            // 出错 → error + 台词
}
```

### 文件结构

```
public/pet/
├── pet.js              # 主控制器（状态机、事件处理、拖拽、气泡）
└── images/
    ├── killua/         # 奇犽角色图片
    │   ├── killua_idle.png
    │   ├── killua_thinking.png
    │   ├── killua_talking.png
    │   ├── killua_happy.png
    │   ├── killua_sad.png
    │   └── killua_error.png
    └── ayanami/        # 绫波丽角色图片
        ├── ayanami_idle.png
        ├── ayanami_thinking.png
        ├── ayanami_talking.png
        ├── ayanami_happy.png
        ├── ayanami_sad.png
        └── ayanami_error.png
```

### 添加新角色

1. 在 `pet.js` 中添加角色数据：

```javascript
var newCharacter = {
  id: 'character_id',
  name: '角色名',
  basePath: '/pet/images/character_id/',
  states: {
    idle:     { image: 'character_idle.png',     animClass: 'pet-anim-breathe' },
    thinking: { image: 'character_thinking.png', animClass: 'pet-anim-tilt' },
    talking:  { image: 'character_talking.png',  animClass: 'pet-anim-bob' },
    happy:    { image: 'character_happy.png',    animClass: 'pet-anim-bounce' },
    sad:      { image: 'character_sad.png',      animClass: '' },
    error:    { image: 'character_error.png',    animClass: 'pet-anim-shake' }
  },
  lines: {
    onThinking: ['台词1', '台词2', ...],
    onTool: function(t) { return '使用 ' + t; },
    onDone: ['完成台词1', ...],
    onError: ['错误台词1', ...],
    idle: ['闲时台词1', ...]
  }
};

// 注册到 registry
registry.character_id = newCharacter;
```

2. 创建图片目录并上传 6 张 PNG 图片（建议尺寸 280×320 像素）

3. 在 `index.html` 的下拉菜单中添加选项：

```html
<button data-pet="character_id">角色名 🎭</button>
```

### 交互功能

- **选择角色**：点击右上角「🐾 桌宠」按钮，展开下拉菜单选择
- **拖拽移动**：按住角色拖动到任意位置，位置自动保存到 localStorage
- **双击复位**：双击角色回到默认右下位置
- **关闭桌宠**：选择「关闭」选项，刷新后保持关闭状态

---

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
│   ├── app.js          # 前端逻辑（SSE 处理）
│   ├── style.css       # 样式表
│   └── pet/            # 桌宠系统
│       ├── pet.js      # 桌宠控制器
│       └── images/     # 角色图片
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