# 📚 LifeSync AI Coach - 文档导航

欢迎来到 LifeSync AI Coach 项目文档中心！

---

## 📖 文档列表

### 1. 🌟 [项目全面开发文档](./PROJECT_OVERVIEW.md) 
**适合：** 所有人（包括非技术人员）

**内容：**
- ✅ 项目简介和功能说明
- ✅ 完整的文件夹和文件详解
- ✅ 用通俗易懂的语言解释技术概念
- ✅ 数据流动说明
- ✅ 技术栈详解
- ✅ 开发和部署指南

**推荐阅读顺序：** 第一个阅读

---

### 2. 🧩 [组件详细文档](./COMPONENTS_DOCUMENTATION.md)
**适合：** 前端开发者

**内容：**
- ✅ 21 个组件的功能详解
- ✅ 组件 Props 和用法
- ✅ 组件依赖关系
- ✅ 样式规范和主题系统
- ✅ 响应式设计指南
- ✅ 性能优化建议

**推荐阅读顺序：** 第二个阅读

---

### 3. 📊 [组件结构概览](./COMPONENTS_STRUCTURE.md)
**适合：** 需要快速浏览组件的开发者

**内容：**
- ✅ 组件文件清单和大小
- ✅ 组件分类统计
- ✅ 组件复杂度排名
- ✅ 依赖关系图
- ✅ 技术栈总结
- ✅ 代码行数统计

**推荐阅读顺序：** 快速查询时使用

---

## 🚀 快速开始

### 新手入门路径

**对于非技术人员：**
1. 阅读 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) 的"项目简介"部分
2. 浏览"核心文件夹详解"了解项目结构
3. 查看"常见问题"部分

**对于前端开发者：**
1. 快速浏览 [COMPONENTS_STRUCTURE.md](./COMPONENTS_STRUCTURE.md) 了解组件概况
2. 阅读 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) 的"核心文件详解"
3. 深入 [COMPONENTS_DOCUMENTATION.md](./COMPONENTS_DOCUMENTATION.md) 学习具体实现

**对于后端开发者或全栈开发者：**
1. 阅读 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) 的"服务文件夹"部分
2. 了解 `geminiService.ts` 和 `storageService.ts`
3. 查看"数据流动说明"

---

## 📂 项目结构速览

```
lifesync-ai-coach/
├── 📁 components/          UI 组件（21 个文件）
│   └── dashboard/          仪表盘子组件（4 个）
├── 📁 constants/           常量配置（主题、AI 人格）
├── 📁 contexts/            全局状态管理
├── 📁 services/            核心服务（AI、存储）
├── 📁 docs/                📚 本文档文件夹
├── 📁 public/              静态资源
├── 📄 App.tsx              应用核心逻辑（66 KB）
├── 📄 types.ts             数据类型定义
├── 📄 index.html           HTML 入口
├── 📄 index.tsx            React 入口
├── 📄 package.json         项目配置
└── 📄 vite.config.ts       构建配置
```

---

## 🔍 快速查找

### 我想了解...

**...项目的整体架构？**
→ [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - "项目结构总览"

**...某个组件怎么用？**
→ [COMPONENTS_DOCUMENTATION.md](./COMPONENTS_DOCUMENTATION.md) - 找到对应组件章节

**...组件之间的关系？**
→ [COMPONENTS_STRUCTURE.md](./COMPONENTS_STRUCTURE.md) - "依赖关系图"

**...AI 是怎么工作的？**
→ [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - "geminiService.ts - AI 大脑"

**...数据是怎么保存的？**
→ [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - "storageService.ts - 数据保存者"

**...如何开始开发？**
→ [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - "开发环境搭建"

**...如何部署项目？**
→ [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - "生产构建"

**...主题系统怎么用？**
→ [COMPONENTS_DOCUMENTATION.md](./COMPONENTS_DOCUMENTATION.md) - "主题系统"

**...代码规范是什么？**
→ [COMPONENTS_DOCUMENTATION.md](./COMPONENTS_DOCUMENTATION.md) - "样式规范"

---

## 💡 关键概念速查

### 组件（Component）
UI 的独立模块，就像搭积木的"积木块"

**示例：** `ChatInterface.tsx` 是聊天界面组件

---

### 状态（State）
应用当前的数据情况

**示例：** 当前有哪些任务、哪些任务已完成

---

### Context（上下文）
全局数据仓库，所有组件都能访问

**位置：** `contexts/AppContext.tsx`

---

### Service（服务）
处理复杂业务逻辑的"后台工作人员"

**示例：** 
- `geminiService.ts` - 与 AI 通信
- `storageService.ts` - 数据存储

---

### Props（属性）
父组件传递给子组件的数据

**类比：** 就像函数的参数

---

### Hook（钩子）
React 提供的特殊函数

**常用：**
- `useState` - 管理组件内部数据
- `useEffect` - 执行副作用（如数据加载）
- `useApp` - 访问全局状态（自定义）

---

## 🛠️ 开发工具推荐

### 编辑器
- **VS Code**（推荐）
  - 安装插件：ESLint, Prettier, Tailwind CSS IntelliSense

### 浏览器
- **Chrome**（推荐）
  - 安装扩展：React Developer Tools

### 调试
- 浏览器开发者工具（F12）
- Console 查看日志
- React DevTools 查看组件状态

---

## 📊 项目统计

| 指标 | 数值 |
|------|------|
| 总代码行数 | ~7,000 行 |
| 组件数量 | 21 个 |
| 最大组件 | SettingsView.tsx (42 KB) |
| 核心文件 | App.tsx (66 KB) |
| 支持的 AI 人格 | 10 种 |
| 主题配色 | 6 种 |
| 技术依赖 | 11 个包 |

---

## 🤝 贡献指南

### 报告问题
1. 在 GitHub Issues 中创建新 issue
2. 描述问题和复现步骤
3. 附上截图（如果有）

### 提交代码
1. Fork 项目
2. 创建功能分支
3. 提交 Pull Request
4. 等待 Code Review

---

## 📝 更新日志

### v1.0.0 (2025-11-30)
- ✅ 创建完整的项目文档
- ✅ 组件详细说明
- ✅ 结构概览
- ✅ 新手友好的开发指南

---

## 🔗 相关链接

- **项目主页：** `README.md`（项目根目录）
- **中文文档：** `README_zh-CN.md`
- **开发笔记：** `note.md`

---

## 📧 联系方式

如有问题，请：
1. 查看文档
2. 搜索 GitHub Issues
3. 创建新 Issue

---

**祝您开发愉快！** 🚀

---

*最后更新：2025-11-30*
