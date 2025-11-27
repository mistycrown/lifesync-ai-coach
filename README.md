<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="LifeSync AI Coach Banner" width="100%" />
  
  # LifeSync AI Coach
  
  **Your Intelligent Companion for Time Management and Personal Growth**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-19.0-blue)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-purple)](https://vitejs.dev/)
  [![Gemini](https://img.shields.io/badge/AI-Gemini-orange)](https://deepmind.google/technologies/gemini/)

  [English](./README.md) | [简体中文](./README_zh-CN.md)

</div>

## 📖 Introduction

**LifeSync AI Coach** is a comprehensive personal productivity application designed to help you align your daily actions with your long-term goals. Unlike traditional to-do lists, LifeSync integrates an AI-powered coach that helps you plan your day, track your focus, and reflect on your progress.

Whether you need a gentle "Big Sister" to encourage you or a "Drill Sergeant" to keep you disciplined, LifeSync adapts to your style.

## ✨ Key Features

### 🤖 AI Life Coach
- **Personalized Interaction**: Chat with an AI coach that understands your context and goals.
- **Multiple Personas**: Choose from different coaching styles (Gentle Encourager, Strict Drill Sergeant, Rational Consultant, Socratic Guide).
- **Intelligent Actions**: The AI can automatically add tasks, set goals, and log focus sessions based on your conversation.
- **Daily Reports**: Generate insightful daily summaries and reflections with a single click.

### 🎯 Goal & Vision Alignment
- **Long-term Visions**: Define your big-picture aspirations.
- **Goal Tracking**: Break down visions into actionable goals with deadlines.
- **Task Linkage**: Link daily tasks to specific goals to ensure every action contributes to your bigger picture.

### ⏱️ Focus & Time Tracking
- **Focus Timer**: Built-in pomodoro-style timer to track deep work sessions.
- **Manual Entry**: Log past activities to keep your records complete.
- **Weekly Timeline**: Visualize your week's activities in a calendar view.

### 📅 Habit Building
- **Morning & Evening Check-ins**: Start and end your day with intention.
- **Custom Habits**: Track recurring activities and build consistency.

### 🎨 Customization & Privacy
- **Beautiful Themes**: Choose from multiple color themes (Emerald, Indigo, Rose, Amber, etc.) to suit your mood.
- **Local-First**: Your data is stored locally in your browser by default.
- **Cloud Sync**: Optional integration with Supabase for cross-device synchronization.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Markdown Rendering**: `react-markdown`

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/lifesync-ai-coach.git
   cd lifesync-ai-coach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: You can also set the API key directly in the application settings)*

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   Visit `http://localhost:5173` to start using LifeSync AI Coach.

## 📖 Usage Guide

1. **Set Up Your Coach**: On first launch, go to Settings (gear icon) to configure your AI Coach's name, style, and your personal context.
2. **Define Visions & Goals**: Use the Dashboard to set up your long-term visions and immediate goals.
3. **Plan Your Day**: Chat with the coach to plan your tasks for the day.
4. **Focus**: Use the "Start Focus" button on tasks to track your work.
5. **Reflect**: At the end of the day, ask the coach to "Generate Daily Report" to review your progress.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
