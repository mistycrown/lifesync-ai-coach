<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="LifeSync AI Coach Banner" width="100%" />
  
  # LifeSync AI Coach
  
  **您的智能时间管理与个人成长伴侣**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19.0-blue)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-purple)](https://vitejs.dev/)
  [![Gemini](https://img.shields.io/badge/AI-Gemini-orange)](https://deepmind.google/technologies/gemini/)

  [English](./README.md) | [简体中文](./README_zh-CN.md)
</div>

## 📖 简介

**LifeSync AI Coach** 是一款全面的个人效率应用，旨在帮助您将日常行动与长期目标保持一致。与传统的待办事项列表不同，LifeSync 集成了一位 AI 驱动的教练，帮助您规划每一天、追踪专注时间并复盘您的进度。

无论您需要一位温柔的“知心姐姐”来鼓励您，还是一位严厉的“魔鬼教官”来督促您，LifeSync 都能适应您的风格。

## ✨ 核心功能

### 🤖 AI 生活教练
- **个性化互动**：与理解您背景和目标的 AI 教练聊天。
- **多种角色**：选择不同的教练风格（温柔鼓励型、严厉鞭策型、理性分析型、苏格拉底引导型）。
- **智能操作**：AI 可以根据您的对话自动添加任务、设定目标和记录专注会话。
- **每日日报**：一键生成深刻的每日总结和反思。

### 🎯 目标与愿景对齐
- **长期愿景**：定义您的宏大愿景。
- **目标追踪**：将愿景分解为带有截止日期的可执行目标。
- **任务关联**：将日常任务关联到具体目标，确保每一个行动都服务于更大的图景。

### ⏱️ 专注与时间追踪
- **专注计时器**：内置番茄钟风格的计时器，用于追踪深度工作会话。
- **手动记录**：补录过去的活动，保持记录完整。
- **每周时间轴**：在日历视图中可视化您一周的活动。

### 📅 习惯养成
- **早晚打卡**：以意图开始和结束您的一天。
- **自定义习惯**：追踪重复性活动并建立一致性。

### 🎨 个性化与隐私
- **精美主题**：选择多种颜色主题（森之呼吸、经典蓝紫、浪漫玫瑰、温暖夕阳等）以适应您的心情。
- **本地优先**：默认情况下，您的数据存储在浏览器的本地存储中。
- **云端同步**：可选集成 Supabase 以实现跨设备同步。

## 🛠️ 技术栈

- **前端**：React 19, TypeScript, Vite
- **样式**：Tailwind CSS, Lucide React (图标)
- **AI 集成**：Google Gemini API (`@google/genai`)
- **Markdown 渲染**：`react-markdown`

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)
- Google Gemini API Key ([在此获取](https://aistudio.google.com/app/apikey))

### 安装步骤

1.  **克隆仓库**
    ```bash
    git clone https://github.com/yourusername/lifesync-ai-coach.git
    cd lifesync-ai-coach
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境**
    在根目录下创建一个 `.env.local` 文件，并添加您的 Gemini API Key：
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
    *(注意：您也可以直接在应用的设置界面中设置 API Key)*

4.  **运行应用**
    ```bash
    npm run dev
    ```

5.  **在浏览器中打开**
    访问 `http://localhost:5173` 开始使用 LifeSync AI Coach。

## 📖 使用指南

1.  **设置您的教练**：首次启动时，进入设置（齿轮图标）配置您的 AI 教练的称呼、风格和您的个人背景。
2.  **定义愿景与目标**：使用仪表盘设置您的长期愿景和近期目标。
3.  **规划您的一天**：与教练聊天，规划当天的任务。
4.  **专注**：使用任务上的“开始专注”按钮来追踪您的工作。
5.  **复盘**：在一天结束时，让教练“生成每日日报”来回顾您的进度。

## 🤝 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 📄 许可证

本项目采用 MIT 许可证。
