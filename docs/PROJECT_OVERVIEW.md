# LifeSync AI Coach - 项目全面开发文档

> 🎯 让不懂技术的人也能看懂的项目指南

---

## 📖 目录

1. [项目简介](#项目简介)
2. [项目结构总览](#项目结构总览)
3. [核心文件夹详解](#核心文件夹详解)
4. [核心文件详解](#核心文件详解)
5. [数据流动说明](#数据流动说明)
6. [技术栈说明](#技术栈说明)
7. [开发和部署](#开发和部署)

---

## 项目简介

**LifeSync AI Coach** 是一个智能生活教练应用，帮助用户管理：
- ✅ **任务**（To-Do List）
- 🎯 **目标**（阶段性目标）
- 🌟 **愿景**（长期目标）
- ⏱️ **专注时间**（番茄钟计时）
- 🏃 **习惯打卡**（每日习惯养成）
- 📝 **每日复盘**（AI 自动生成总结）
- 💬 **AI 聊天教练**（智能对话助手）

**技术特色：**
- 支持多种 AI 模型（Google Gemini、DeepSeek、OpenAI 等）
- 数据可本地存储或云端同步（Supabase）
- 响应式设计，支持桌面和移动设备
- 可作为 PWA（渐进式 Web 应用）安装到手机

---

## 项目结构总览

```
lifesync-ai-coach/
├── 📁 components/          21 个组件（UI 界面）
├── 📁 constants/           常量配置（主题、AI 人格）
├── 📁 contexts/            全局状态管理（Context API）
├── 📁 services/            核心服务（AI、数据存储）
├── 📁 docs/                文档文件夹
├── 📁 public/              静态资源（图标等）
├── 📁 node_modules/        依赖包（自动生成）
├── 📁 dist/                打包后的生产文件
├── 📄 App.tsx              应用主逻辑（最核心）
├── 📄 types.ts             数据类型定义
├── 📄 index.html           HTML 入口
├── 📄 index.tsx            React 入口
├── 📄 package.json         项目配置和依赖
├── 📄 vite.config.ts       构建工具配置
└── 📄 .env.local           环境变量（API Key 等）
```

**文件和文件夹总数：** 
- **核心源代码文件：** 约 30 个
- **组件文件：** 21 个
- **总代码行数：** 约 7,000+ 行

---

## 核心文件夹详解

### 📁 components/ - 组件文件夹
**作用：** 存放所有用户界面（UI）组件

**简单理解：** 
- 就像搭积木一样，每个组件是一个独立的"积木块"
- 比如按钮、卡片、弹窗、列表等
- 这些积木组合起来，就形成了完整的应用界面

**包含：**
- 17 个主要组件文件
- 1 个子文件夹（`dashboard/`）包含 4 个仪表盘组件

**重要组件举例：**
- `ChatInterface.tsx` - AI 聊天界面
- `Dashboard.tsx` - 主仪表盘
- `MobileLayout.tsx` - 移动端布局
- `SettingsView.tsx` - 设置页面

📌 **详细文档：** 见 `COMPONENTS_DOCUMENTATION.md`

---

### 📁 constants/ - 常量文件夹
**作用：** 存放应用中不会改变的固定值

**包含文件：**
- `appConstants.ts` (3.3 KB)

**内容说明：**

#### 1. 主题配置（THEMES）
定义了 6 种颜色主题：
```
森之呼吸 (emerald) - 绿色系
经典蓝紫 (indigo) - 蓝紫色系
深海湛蓝 (blue) - 蓝色系
浪漫玫瑰 (rose) - 粉红色系
温暖夕阳 (amber) - 橙黄色系
极简黑白 (slate) - 灰色系
```

**简单理解：** 就像手机的主题皮肤，用户可以选择喜欢的颜色风格

#### 2. AI 教练人格（COACH_STYLES）
定义了 10 种 AI 角色类型：

| 类型 | 说明 | 举例 |
|------|------|------|
| ❤️ 温柔鼓励 | 像温柔的姐姐，满是关怀和支持 | "加油！你可以的~" |
| 🔥 严厉鞭策 | 像严厉的教练，不留情面 | "别找借口！立刻行动！" |
| 🧠 咨询顾问 | 像专业分析师，冷静理性 | "根据数据，你的效率提升了 20%" |
| 👑 忠诚首辅 | 古代大臣，用文言文对话 | "陛下，万不可荒废朝政啊！" |
| ☕ 全能管家 | 英式管家，极致优雅礼貌 | "少爷，为您效劳是鄙人的荣幸" |
| 🚀 硅谷 PM | 互联网产品经理，满嘴黑话 | "今天的 MVP 做好了吗？" |
| 🛡️ RPG 向导 | 游戏 NPC，热血中二 | "恭喜勇者完成主线任务！获得经验值 +100" |
| 🧘 佛系禅师 | 佛教高僧，平和淡然 | "放下执念，活在当下，随缘而行" |
| 🤔 苏格拉底 | 哲学家，启发式提问 | "你为什么觉得这件事重要？" |
| 自定义 | 用户完全自己编写提示词 | （空白，任意发挥） |

**简单理解：** 就像游戏角色选择，每个 AI 说话风格完全不同

---

### 📁 contexts/ - 状态管理文件夹
**作用：** 管理应用的全局状态

**包含文件：**
- `AppContext.tsx` (4.8 KB)

**什么是"状态"？**
简单理解：状态就是"应用当前的数据情况"

例如：
- 当前有哪些任务？
- 哪些任务已完成？
- 计时器正在运行吗？
- 用户设置的主题色是什么？

**为什么需要全局状态管理？**
想象一个场景：
- 用户在"任务页面"添加了一个任务
- "仪表盘页面"也要显示这个任务
- "AI 聊天页面"也要知道这个任务

如果没有全局状态管理，每个页面的数据都是独立的，无法共享。

**Context 解决方案：**
- 就像一个"中央数据仓库"
- 所有组件都可以从这里读取和修改数据
- 数据改变时，所有相关界面自动更新

**主要内容：**
- `AppContextType` 接口：定义了整个应用的状态结构
- `AppProvider` 组件：提供全局数据的容器
- `useApp` Hook：任何组件都可以调用它来访问全局数据

**包含的数据：**
- `state` - 应用核心数据（任务、目标、愿景、习惯等）
- `theme` - 当前主题配置
- `messages` - AI 聊天消息
- `isLoading` - AI 是否正在思考
- `viewingTaskId`, `viewingGoalId` 等 - 当前打开的详情弹窗 ID
- `actions` - 各种操作函数（添加任务、删除目标等）

---

### 📁 services/ - 服务文件夹
**作用：** 处理复杂的业务逻辑，像"后台工作人员"

**包含文件：**
1. `geminiService.ts` (25.3 KB) - AI 服务
2. `storageService.ts` (6.5 KB) - 数据存储服务

---

#### 服务 1: `geminiService.ts` - AI 大脑

**作用：** 与 AI 模型通信，是应用的"智能核心"

**主要功能：**

##### 1. 支持多种 AI 模型
- **Google Gemini** - 谷歌的 AI 模型
- **DeepSeek** - 国产 AI 模型
- **SiliconFlow** - 硅基流动（国产）
- **OpenAI** - ChatGPT 的模型

**简单理解：** 就像手机可以连接不同的 Wi-Fi，这个服务可以连接不同的 AI

##### 2. 工具调用（Function Calling）
AI 不仅能聊天，还能"执行操作"！

**举例：**
用户对 AI 说："帮我添加一个任务：明天写报告"

AI 的处理流程：
1. 理解用户意图 → 要添加任务
2. 调用 `addTask` 工具
3. 传参数：`{ title: "明天写报告" }`
4. 应用自动在任务列表中创建这个任务
5. AI 回复："好的，我已经帮你添加了任务'明天写报告'"

**支持的工具：**
- `addTask` - 添加任务
- `addGoal` - 添加目标
- `addSession` - 记录专注时间
- `checkIn` - 打卡
- `generateReport` - 生成每日复盘

##### 3. 生成每日复盘
- 自动分析用户一天的活动
- 总结完成的任务、专注时长
- 生成 Markdown 格式的复盘报告

**核心类：**
- `CoachService` - 主服务类
  - `startChat()` - 初始化对话
  - `sendMessage()` - 发送用户消息
  - `generateDailyReport()` - 生成每日复盘

---

#### 服务 2: `storageService.ts` - 数据保存者

**作用：** 负责保存和同步用户数据

**支持两种存储方式：**

##### 1. 本地存储（浏览器）
- 数据保存在浏览器的 `localStorage` 中
- 不需要网络
- 只能在当前设备访问
- 清除浏览器数据会丢失

##### 2. 云端存储（Supabase）
- 数据保存在云端数据库
- 可以多设备同步
- 需要配置 Supabase 账号

**主要功能：**
- `testConnection()` - 测试云端连接是否正常
- `uploadData()` - 上传数据到云端
- `downloadData()` - 从云端下载数据

**优化设计：**
为了提高同步速度，数据分成两部分：
- **Core（核心）** - 常用数据（任务、目标、当前聊天）
- **Archive（归档）** - 历史数据（旧聊天记录、历史复盘）

**简单理解：** 
- 就像手机的"iCloud 备份"
- 换手机登录后，数据自动恢复

---

### 📁 docs/ - 文档文件夹
**作用：** 存放项目文档

**当前文件：**
- `COMPONENTS_DOCUMENTATION.md` - 组件详细文档
- `COMPONENTS_STRUCTURE.md` - 组件结构概览
- `PROJECT_OVERVIEW.md` - 本文档

---

### 📁 public/ - 静态资源文件夹
**作用：** 存放不需要编译的静态文件

**包含：**
- `favicon.png` - 网站图标（浏览器标签页上的小图标）
- `pwa-192x192.png` - PWA 小图标
- `pwa-512x512.png` - PWA 大图标

**什么是 PWA？**
渐进式 Web 应用，可以像 App 一样安装到手机桌面

---

### 📁 node_modules/ - 依赖包文件夹
**作用：** 存放项目依赖的第三方库

**简单理解：** 
- 就像乐高积木的"零件包"
- 开发者不需要自己从零开始写所有代码
- 可以使用别人已经写好的功能模块

**不要手动修改这个文件夹！**
- 它由 `npm install` 自动生成
- 删除后运行 `npm install` 可以重新下载

---

### 📁 dist/ - 生产构建文件夹
**作用：** 存放打包后可以部署的文件

**如何生成？**
运行命令：`npm run build`

**简单理解：**
- 开发时的代码是"源代码"，很多个文件，有注释
- 构建后的代码是"压缩优化版"，适合放到服务器
- 就像把乐高散件打包成一个整体

---

## 核心文件详解

### 📄 App.tsx - 应用的大脑（最重要）

**大小：** 66.5 KB（项目最大的单文件）

**作用：** 
- 整个应用的核心逻辑中枢
- 管理所有数据和状态
- 协调各个组件的工作

**主要职责：**

#### 1. 状态管理
存储应用的所有数据：
```
- tasks（任务列表）
- goals（目标列表）
- visions（愿景列表）
- habits（习惯列表）
- sessions（专注记录）
- reports（每日复盘）
- chatSessions（聊天会话）
... 等等
```

#### 2. 数据持久化
- 监听数据变化
- 自动保存到 localStorage
- 支持云端同步

#### 3. Actions（操作函数）
提供各种操作方法：
- `addTask()` - 添加任务
- `toggleTask()` - 切换任务完成状态
- `deleteTask()` - 删除任务
- `startSession()` - 开始专注计时
- `generateReport()` - 生成每日复盘
- ... 超过 30+ 个操作函数

#### 4. AI 交互
- 管理与 AI 的对话
- 处理 AI 的工具调用
- 转换数据格式

#### 5. 界面渲染
根据设备类型渲染不同界面：
- 桌面端 → 显示 `Sidebar` + `Dashboard`
- 移动端 → 显示 `MobileLayout`（底部导航）

**代码结构简化理解：**
```javascript
function App() {
  // 1. 定义所有数据（useState）
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  // ... 很多数据
  
  // 2. 从本地加载数据
  useEffect(() => {
    // 读取 localStorage
  }, []);
  
  // 3. 自动保存数据
  useEffect(() => {
    // 数据变化时，保存到 localStorage
  }, [tasks, goals, ...]);
  
  // 4. 定义操作函数
  const addTask = (title) => {
    // 创建新任务，更新状态
  };
  
  // 5. 渲染界面
  return (
    <AppProvider value={{ state, actions, ... }}>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </AppProvider>
  );
}
```

**简单类比：**
`App.tsx` 就像一个公司的 CEO：
- 掌握所有数据和资源
- 制定规则和流程
- 分配工作给各个部门（组件）
- 确保各部门信息同步

---

### 📄 types.ts - 数据类型定义

**大小：** 5.6 KB

**作用：** 定义应用中所有数据的"结构规范"

**什么是类型定义？**

**举例说明：**
假设要定义"任务"，需要明确：
- 任务有 ID 吗？→ 有，是字符串
- 任务有标题吗？→ 有，是字符串
- 任务能标记完成吗？→ 能，是布尔值
- 任务有截止日期吗？→ 可选，是字符串

**TypeScript 类型定义：**
```typescript
export interface Task {
  id: string;              // 必须有，字符串类型
  title: string;           // 必须有，字符串类型
  completed: boolean;      // 必须有，布尔类型
  createdAt: string;       // 必须有，日期字符串
  goalId?: string;         // 可选，关联的目标 ID
  deadline?: string;       // 可选，截止日期
}
```

**为什么需要类型定义？**
1. **防止错误：** 编辑器会提示字段是否正确
2. **代码提示：** 输入时自动显示可用字段
3. **文档作用：** 清晰展示数据结构

**主要类型定义：**

| 类型 | 说明 |
|------|------|
| `Task` | 任务 |
| `Goal` | 目标 |
| `Vision` | 愿景 |
| `Habit` | 习惯 |
| `Session` | 专注记录 |
| `DailyReport` | 每日复盘 |
| `ChatMessage` | 聊天消息 |
| `ChatSessionData` | 聊天会话 |
| `CoachSettings` | AI 教练设置 |
| `ModelConfig` | AI 模型配置 |
| `StorageConfig` | 存储配置 |
| `ThemeConfig` | 主题配置 |
| `AppState` | 应用总状态 |

---

### 📄 index.html - HTML 入口

**作用：** 浏览器打开的第一个文件

**主要内容：**

#### 1. 基础配置
```html
<meta charset="UTF-8" />  <!-- 字符编码 -->
<meta name="viewport" ... />  <!-- 移动端适配 -->
<title>LifeSync AI Coach</title>  <!-- 标签页标题 -->
```

#### 2. 样式引入
- **Tailwind CSS：** 从 CDN 加载（快速开发）
- **Google Fonts：** 引入 Inter 和 Noto Serif SC 字体
- **自定义样式：** 滚动条、阴影、Markdown 样式等

#### 3. 依赖导入（Import Maps）
使用 Google AI Studio 的 CDN 加载 React：
```javascript
{
  "imports": {
    "react": "https://aistudiocdn.com/react@^19.2.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    ...
  }
}
```

**优点：** 不需要本地安装 node_modules，直接在线加载

#### 4. 应用挂载点
```html
<div id="root"></div>
```
React 应用会渲染到这个 div 中

---

### 📄 index.tsx - React 入口

**大小：** 349 字节（最小的核心文件）

**作用：** 启动 React 应用

**代码逻辑：**
```javascript
import App from './App';  // 引入主组件

const root = ReactDOM.createRoot(  // 创建 React 根节点
  document.getElementById('root')  // 找到 HTML 中的挂载点
);

root.render(<App />);  // 渲染应用
```

**简单理解：**
- `index.html` 提供"舞台"（`<div id="root">`）
- `index.tsx` 是"导演"，把演员（App 组件）推上舞台

---

### 📄 package.json - 项目配置文件

**作用：** 定义项目基本信息和依赖

**主要内容：**

#### 1. 基本信息
```json
{
  "name": "lifesync-ai-coach",
  "version": "0.0.0",
  "type": "module"
}
```

#### 2. 脚本命令
```json
"scripts": {
  "dev": "vite",              // 开发模式：npm run dev
  "build": "vite build",      // 打包构建：npm run build
  "preview": "vite preview"   // 预览构建：npm run preview
}
```

#### 3. 运行时依赖（dependencies）
应用运行必需的库：
```json
{
  "@google/genai": "^1.30.0",      // Google AI SDK
  "lucide-react": "^0.554.0",      // 图标库
  "react": "^19.2.0",              // React 核心
  "react-dom": "^19.2.0",          // React DOM
  "react-markdown": "9"            // Markdown 渲染
}
```

#### 4. 开发依赖（devDependencies）
开发时需要的工具：
```json
{
  "@types/node": "^22.14.0",       // Node.js 类型定义
  "@vitejs/plugin-react": "^5.0.0", // Vite React 插件
  "typescript": "~5.8.2",          // TypeScript 编译器
  "vite": "^6.2.0",                // 构建工具
  "vite-plugin-pwa": "^1.2.0"     // PWA 支持
}
```

**简单理解：**
- `package.json` 就像项目的"说明书"
- 告诉电脑："这个项目叫什么、需要哪些工具、怎么运行"

---

### 📄 vite.config.ts - 构建工具配置

**作用：** 配置 Vite（现代化的前端构建工具）

**主要配置：**

#### 1. 开发服务器
```javascript
server: {
  port: 3000,           // 端口号：localhost:3000
  host: '0.0.0.0',     // 允许局域网访问
}
```

#### 2. 插件
```javascript
plugins: [
  react(),             // React 支持
  VitePWA({...})      // PWA 支持
]
```

#### 3. PWA 配置
定义应用的名称、图标、主题色等：
```javascript
manifest: {
  name: 'LifeSync AI Coach',
  short_name: 'LifeSync',
  theme_color: '#ffffff',
  icons: [...]
}
```

#### 4. 环境变量
```javascript
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```
从 `.env.local` 读取 API Key

**简单理解：**
Vite 就像"自动化工厂"：
- 把源代码转换成浏览器能理解的代码
- 提供热更新（改代码立即看到效果）
- 优化打包体积

---

### 📄 .env.local - 环境变量（敏感信息）

**作用：** 存储敏感配置，不会提交到 Git

**内容示例：**
```
GEMINI_API_KEY=你的API密钥
```

**为什么需要？**
- API Key 是私密的，不能公开
- 不同环境（开发/生产）可能用不同配置

**⚠️ 注意：**
这个文件通常不会上传到代码仓库（被 `.gitignore` 排除）

---

## 数据流动说明

### 应用启动流程

```
1. 浏览器打开 → 加载 index.html
2. index.html → 引入 index.tsx
3. index.tsx → 渲染 App 组件
4. App 组件初始化 → 从 localStorage 读取数据
5. 数据加载完成 → 渲染界面
```

### 用户操作数据流

**示例：用户添加一个任务**

```
1. 用户在界面输入任务标题 "买菜"
2. 点击"添加"按钮
3. 触发组件的回调函数
4. 调用 App.tsx 的 addTask("买菜")
5. App.tsx 更新 tasks 状态
   └─ setTasks([...tasks, newTask])
6. React 检测到状态变化 → 重新渲染组件
7. useEffect 监听到 tasks 变化 → 保存到 localStorage
8. 用户看到新任务出现在列表中
```

### AI 对话数据流

**示例：用户对 AI 说 "帮我添加任务：写周报"**

```
1. 用户输入消息 → ChatInterface 组件
2. 调用 onSendMessage("帮我添加任务：写周报")
3. App.tsx 的 sendMessage 函数被调用
4. 调用 geminiService.sendMessage(...)
5. 发送请求到 AI API
6. AI 分析消息 → 识别出要调用 addTask 工具
7. AI 返回：
   {
     toolCalls: [
       { name: 'addTask', args: { title: '写周报' } }
     ]
   }
8. App.tsx 执行工具调用 → addTask('写周报')
9. 任务被添加到列表
10. App.tsx 把工具执行结果反馈给 AI
11. AI 返回友好回复："好的，我已经帮你添加了任务'写周报'"
12. 回复显示在聊天界面
```

### 数据持久化流程

**本地存储：**
```
数据变化 → useEffect 监听 → localStorage.setItem()
应用启动 → useEffect 执行 → localStorage.getItem() → 恢复数据
```

**云端同步：**
```
用户点击"同步到云端"
→ App.tsx.syncToCloud()
→ storageService.uploadData(state)
→ 发送 HTTP 请求到 Supabase
→ 数据保存到云端数据库
```

```
用户点击"从云端恢复"
→ App.tsx.syncFromCloud()
→ storageService.downloadData()
→ 从 Supabase 下载数据
→ 合并到本地状态
```

---

## 技术栈说明

### 前端框架：React 19.2

**什么是 React？**
- Facebook 开发的 JavaScript 库
- 用于构建用户界面
- 组件化开发，代码复用性强

**核心概念：**
- **组件（Component）：** UI 的独立模块
- **状态（State）：** 组件的数据
- **Hook：** 操作状态的工具函数（useState, useEffect 等）

---

### 编程语言：TypeScript 5.8

**什么是 TypeScript？**
- JavaScript 的超集，增加了类型系统
- 编译后生成纯 JavaScript

**为什么用 TypeScript？**
- 类型检查，减少 bug
- 代码提示更智能
- 重构更安全

---

### 样式方案：Tailwind CSS

**什么是 Tailwind？**
- 实用优先的 CSS 框架
- 通过类名直接写样式

**示例：**
```html
<div className="bg-blue-500 text-white px-4 py-2 rounded-lg">
  蓝色背景，白色文字，内边距，圆角
</div>
```

**优点：**
- 不需要写 CSS 文件
- 样式直接在组件中，易于维护
- 响应式设计简单（如 `md:` 前缀）

---

### 构建工具：Vite 6.2

**什么是 Vite？**
- 新一代前端构建工具
- 比 Webpack 更快

**特点：**
- 开发时极速热更新
- 生产构建高度优化
- 开箱即用

---

### AI SDK：Google GenAI 1.30

**作用：** 与 Google Gemini AI 通信

**核心功能：**
- 发送消息到 AI
- 接收 AI 回复
- 支持 Function Calling（工具调用）

---

### 图标库：Lucide React

**作用：** 提供精美的图标组件

**使用示例：**
```jsx
import { Heart, Star, Clock } from 'lucide-react';

<Heart size={24} color="red" />
```

**特点：**
- 图标丰富（1000+ 个）
- 可定制大小和颜色
- 矢量图标，清晰无损

---

### Markdown 渲染：react-markdown

**作用：** 将 Markdown 文本渲染成 HTML

**使用场景：**
- AI 回复内容（支持格式化）
- 每日复盘显示

**示例：**
```jsx
<ReactMarkdown>
  # 标题
  - 列表项1
  - 列表项2
  **粗体** *斜体*
</ReactMarkdown>
```

---

### PWA 支持：vite-plugin-pwa

**什么是 PWA？**
Progressive Web App（渐进式 Web 应用）

**特点：**
- 可安装到手机桌面，like App
- 支持离线访问
- 接收推送通知

---

## 开发和部署

### 开发环境搭建

#### 1. 前置要求
- Node.js 18+ 

#### 2. 安装依赖
```bash
npm install
```

#### 3. 配置环境变量
创建 `.env.local` 文件：
```
GEMINI_API_KEY=你的API密钥
```

#### 4. 启动开发服务器
```bash
npm run dev
```

浏览器访问：http://localhost:3000

#### 5. 代码热更新
修改代码后，浏览器自动刷新，无需重启

---

### 生产构建

#### 1. 打包项目
```bash
npm run build
```

生成 `dist/` 文件夹

#### 2. 本地预览
```bash
npm run preview
```

#### 3. 部署到服务器
将 `dist/` 文件夹上传到：
- **Vercel** （推荐，免费）
- **Netlify** （免费）
- **GitHub Pages**
- 任何静态文件服务器

---

### 数据库配置（可选）

使用 Supabase 进行云端同步：

#### 1. 创建 Supabase 项目
访问：https://supabase.com

#### 2. 创建数据表
SQL 语句：
```sql
CREATE TABLE lifesync_storage (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. 获取配置信息
- Supabase URL
- Supabase Key (anon, public)

#### 4. 在应用设置中填写
进入 "设置" → "数据管理" → 填写配置

---

## 常见问题

### Q: 项目有多大？
**A:** 
- 源代码：约 200 KB
- 依赖包（node_modules）：约 300 MB
- 构建后（dist）：约 2 MB

### Q: 支持哪些浏览器？
**A:** 
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### Q: 可以离线使用吗？
**A:** 
- 部分可以（PWA 缓存）
- AI 聊天需要网络

### Q: 数据存在哪里？
**A:** 
- 默认：浏览器 localStorage（本地）
- 可选：Supabase 数据库（云端）

### Q: 如何备份数据？
**A:** 
- 方法 1：在"设置"中点击"导出数据"，下载 JSON 文件
- 方法 2：配置云端同步

### Q: 支持多语言吗？
**A:** 
目前仅支持中文，多语言功能在计划中

### Q: 可以在手机上用吗？
**A:** 
可以！支持响应式设计，也可安装为 PWA

---

## 开发建议

### 新手入门顺序
1. 先看 `components/` 文件夹，理解 UI 组件
2. 再看 `types.ts`，了解数据结构
3. 然后看 `App.tsx`，理解核心逻辑
4. 最后看 `services/`，理解 AI 和存储

### 修改界面
- 找到对应的组件文件
- 修改 JSX 和 Tailwind 类名
- 浏览器自动刷新查看效果

### 添加新功能
1. 在 `types.ts` 定义新数据类型
2. 在 `App.tsx` 添加状态和操作函数
3. 创建新组件或修改现有组件
4. 在 Context 中暴露新功能

### 调试技巧
- 打开浏览器开发者工具（F12）
- 查看 Console（控制台）的错误信息
- 使用 React DevTools 查看组件状态

---

## 项目亮点

✨ **智能 AI 助手**
- 支持多种 AI 人格
- 可执行实际操作（工具调用）
- 自动生成每日复盘

🎨 **精美界面**
- 6 种主题可选
- 响应式设计
- 流畅动画效果

📊 **数据可视化**
- 周时间轴
- 热力图
- 进度条

💾 **数据安全**
- 本地存储
- 云端同步
- 导入导出

📱 **跨平台**
- 桌面端完整体验
- 移动端优化布局
- PWA 支持

---

## 许可协议

MIT License - 开源免费

---

## 联系方式

- **项目地址：** [GitHub Repository]
- **问题反馈：** [GitHub Issues]

---

**最后更新：** 2025-11-30  
**文档版本：** 1.0.0  
**适用对象：** 所有人（包括非技术人员）
