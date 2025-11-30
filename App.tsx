
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, BarChart3, MessageSquare, X, Sparkles, FileText, User, Palette, Database, Download, Trash2, Save, Check, Server, Key, Link as LinkIcon, Box, PlugZap, Loader2, AlertCircle, Cloud, UploadCloud, DownloadCloud, HardDrive, Info, HelpCircle, FileJson, Search, Bug, PanelRightClose } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import { Dashboard } from './components/Dashboard';
import { SettingsView } from './components/SettingsView';
import { SearchModal } from './components/SearchModal';
import { Select } from './components/Select';
import { AppState, ChatMessage, Task, Goal, Session, DailyReport, CoachSettings, ThemeConfig, ModelConfig, StorageConfig, ChatSessionData, Habit, Vision } from './types';
import { CoachService } from './services/geminiService';
import { StorageService, SUPABASE_TABLE } from './services/storageService';
import { MobileLayout } from './components/MobileLayout';
import { THEMES, COACH_STYLES } from './constants/appConstants';
import { AppProvider, AppContextType } from './contexts/AppContext';
// 🔧 架构优化：导入 Hooks
import { useDataPersistence, loadInitialState } from './hooks/useDataPersistence';
import { useSettings } from './hooks/useSettings';
import { useReportManagement } from './hooks/useReportManagement';
import {
    useTaskManagement,
    useGoalManagement,
    useVisionManagement,
    useSessionManagement,
    useHabitManagement
} from './hooks';

// --- Constants imported from constants/appConstants ---

const DEFAULT_CHAT_WIDTH = 400;
const MIN_CHAT_WIDTH = 320;
const MIN_DASHBOARD_WIDTH = 520;

// --- Mock Data Helper ---
const createMockData = (): AppState => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    const toISO = (d: Date, hour: number, min: number) => {
        const newD = new Date(d);
        newD.setHours(hour, min, 0, 0);
        return newD.toISOString();
    };

    const initialChatId = 'chat_1';

    return {
        tasks: [
            { id: '1', title: '回顾项目需求文档', completed: false, createdAt: toISO(today, 9, 0) },
            { id: '2', title: '晨间冥想', completed: true, createdAt: toISO(today, 7, 0) },
            { id: '3', title: '阅读技术文章', completed: true, createdAt: toISO(yesterday, 20, 0) },
            { id: '4', title: '整理本周周报', completed: true, createdAt: toISO(yesterday, 16, 0) },
            { id: '5', title: '购买生活用品', completed: false, createdAt: toISO(dayBefore, 10, 0) },
        ],
        goals: [
            { id: '1', title: '发布最小可行性产品 (MVP)', deadline: '2025-12-31', completed: false },
            { id: '2', title: '坚持跑步30天', deadline: '2025-06-01', completed: false },
        ],
        habits: [
            { id: 'h1', title: '早安打卡', icon: 'sun', createdAt: toISO(today, 0, 0) },
            { id: 'h2', title: '晚安打卡', icon: 'moon', createdAt: toISO(today, 0, 0) },
        ],
        visions: [
            { id: 'v1', title: '成为全栈开发专家', createdAt: toISO(today, 0, 0), archived: false },
            { id: 'v2', title: '保持健康的体魄', createdAt: toISO(today, 0, 0), archived: false }
        ],
        sessions: [
            // Today
            { id: 's1', label: '☀️ 早安打卡', startTime: toISO(today, 8, 30), endTime: toISO(today, 8, 30), durationSeconds: 0, habitId: 'h1', type: 'checkin' },
            { id: 's2', label: '开发核心功能模块', startTime: toISO(today, 9, 30), endTime: toISO(today, 10, 15), durationSeconds: 45 * 60 },
            { id: 's3', label: '修复Bug #1024', startTime: toISO(today, 10, 45), endTime: toISO(today, 11, 30), durationSeconds: 45 * 60 },
            // Yesterday
            { id: 's4', label: '☀️ 早安打卡', startTime: toISO(yesterday, 8, 0), endTime: toISO(yesterday, 8, 0), durationSeconds: 0, habitId: 'h1', type: 'checkin' },
            { id: 's5', label: '技术方案调研', startTime: toISO(yesterday, 9, 0), endTime: toISO(yesterday, 11, 0), durationSeconds: 120 * 60 },
            { id: 's6', label: '团队会议', startTime: toISO(yesterday, 14, 0), endTime: toISO(yesterday, 15, 0), durationSeconds: 60 * 60 },
            { id: 's7', label: '🌙 晚安打卡', startTime: toISO(yesterday, 23, 0), endTime: toISO(yesterday, 23, 0), durationSeconds: 0, habitId: 'h2', type: 'checkin' },
            // Day Before
            { id: 's8', label: '☀️ 早安打卡', startTime: toISO(dayBefore, 9, 0), endTime: toISO(dayBefore, 9, 0), durationSeconds: 0, habitId: 'h1', type: 'checkin' },
            { id: 's9', label: '阅读源码', startTime: toISO(dayBefore, 10, 0), endTime: toISO(dayBefore, 11, 30), durationSeconds: 90 * 60 },
        ],
        reports: [
            {
                id: 'r1',
                date: toISO(yesterday, 23, 5),
                title: '积累跬步的一天',
                content: `### 数据客观总结
📅 **日期**：${yesterday.getFullYear()}年${yesterday.getMonth() + 1}月${yesterday.getDate()}日
⏱️ **总专注时长**：180分钟
✅ **当日完成(创建)任务数**：2
📝 **活动日志明细**：
- 🌙 晚安打卡 (23:00, 0分钟)
- 团队会议 (14:00, 60分钟)
- 技术方案调研 (09:00, 120分钟)
- ☀️ 早安打卡 (08:00, 0分钟)

---
### AI教练点评
昨天表现不错，专注时长达到了3个小时，特别是上午的深度调研非常有价值。记得保持这样的节奏，但也要注意劳逸结合。今天要继续加油哦！`
            }
        ],
        activeSessionId: null,
        coachSettings: {
            name: 'Atlas',
            userName: '学员',
            style: '温柔鼓励型 (知心姐姐)',
            userContext: '我是一名软件工程师，正试图在全职工作的同时开发一个副业项目。',
            customInstruction: '温柔耐心，充满同理心。多用鼓励的语言，关注用户的情绪，像一个知心大姐姐。不要有压力，用温暖的话语引导行动。',
            customReportInstruction: '',
            modelConfig: {
                provider: 'gemini',
                apiKey: '',
                baseUrl: '',
                modelId: 'gemini-2.5-flash'
            },
            debugMode: false,
            enableContext: true
        },
        theme: 'indigo',
        storageConfig: {
            provider: 'local'
        },
        chatSessions: [
            {
                id: initialChatId,
                title: "默认对话",
                updatedAt: new Date().toISOString(),
                messages: []
            }
        ],
        currentChatId: initialChatId
    };
};

const initialState: AppState = createMockData();

// --- Constants imported from constants/appConstants ---

const coachService = new CoachService();

const App: React.FC = () => {
    // 🔧 架构优化：使用 loadInitialState 替代原来的本地加载逻辑
    const [state, setState] = useState<AppState>(() =>
        loadInitialState(initialState, 'lifesync-state-v5')
    );

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
    const [isResizing, setIsResizing] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'coach' | 'theme' | 'data'>('coach');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Navigation State (Lifted from Dashboard for Search)
    const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
    const [viewingGoalId, setViewingGoalId] = useState<string | null>(null);
    const [viewingVisionId, setViewingVisionId] = useState<string | null>(null);
    const [viewingReportId, setViewingReportId] = useState<string | null>(null);
    const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
    const [viewingHabitId, setViewingHabitId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 🔧 架构优化：使用 useSettings Hook 管理设置
    const {
        localSettings,
        setLocalSettings,
        isTestingConnection,
        connectionTestResult,
        fileInputRef,
        testConnection,
        updateTheme,
        saveSettings,
        exportData,
        importData,
        handleImportClick
    } = useSettings({
        state,
        setState,
        coachService,
        onImportResult: (success, message) => {
            // 使用 syncMessage 来显示导入结果
            setSyncMessage({
                type: success ? 'success' : 'error',
                text: message
            });
        }
    });

    // 🔧 架构优化：使用 useReportManagement Hook 管理复盘
    const {
        generateReport: generateReportContent,
        addReport,
        updateReport,
        deleteReport
    } = useReportManagement({ state, setState, coachService });

    // 解决循环依赖：使用 Ref 来引用尚未定义的 handleSendMessage
    const handleSendMessageRef = React.useRef<(text: string, isAuto?: boolean) => Promise<void>>(async () => { });

    const triggerAIFeedback = (text: string) => {
        setTimeout(() => {
            handleSendMessageRef.current(text, true);
        }, 500);
    };

    // 🔧 架构优化：使用 useTaskManagement Hook 管理任务
    const {
        addTask,
        updateTask,
        toggleTask,
        deleteTask
    } = useTaskManagement({ state, setState, triggerAIFeedback });

    // 🔧 架构优化：使用 useGoalManagement Hook 管理目标
    const {
        addGoal,
        updateGoal,
        toggleGoal,
        deleteGoal
    } = useGoalManagement({ state, setState, triggerAIFeedback });

    // 🔧 架构优化：使用 useVisionManagement Hook 管理愿景
    const {
        addVision,
        updateVision,
        deleteVision,
        toggleVisionArchived
    } = useVisionManagement({ state, setState });

    // 🔧 架构优化：使用 useSessionManagement Hook 管理专注会话
    const {
        startSession,
        stopSession,
        addManualSession,
        updateSession,
        renameSession,
        deleteSession
    } = useSessionManagement({ state, setState, triggerAIFeedback });

    // 🔧 架构优化：使用 useHabitManagement Hook 管理习惯
    const {
        addHabit,
        updateHabit,
        deleteHabit,
        toggleCheckIn,
        handleCheckIn
    } = useHabitManagement({ state, setState, triggerAIFeedback });

    // Storage Test State (暂时保留，后续会移到 useCloudSync)
    const [isTestingStorage, setIsTestingStorage] = useState(false);
    const [storageTestResult, setStorageTestResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Sync State (暂时保留，后续会移到 useCloudSync)
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const [pendingCloudData, setPendingCloudData] = useState<AppState | null>(null);
    const [restoreSource, setRestoreSource] = useState<'cloud' | 'local'>('cloud');

    // 🔧 架构优化：使用 useDataPersistence Hook 自动保存数据
    useDataPersistence(state, 'lifesync-state-v5');

    // Init Coach and load chat history
    useEffect(() => {
        // Find current session messages to init chat with context
        let initialMessages: ChatMessage[] = [];
        if (state.currentChatId) {
            const session = state.chatSessions.find(s => s.id === state.currentChatId);
            if (session) {
                initialMessages = session.messages;
                setMessages(session.messages);
            }
        }
        // Only pass history if context is enabled
        const historyToLoad = state.coachSettings.enableContext ? initialMessages : [];
        coachService.startChat(state, historyToLoad);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync local settings when modal opens
    useEffect(() => {
        if (isSettingsOpen) {
            setLocalSettings({
                coach: state.coachSettings,
                storage: state.storageConfig
            });
            setSettingsTab('coach');
            // 🔧 不再直接重置测试状态，由 Hook 内部管理
            setStorageTestResult(null);
            setSyncMessage(null);
            setPendingCloudData(null);
        }
    }, [isSettingsOpen, state.coachSettings, state.storageConfig, setLocalSettings]);

    useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (event: MouseEvent) => {
            const viewportWidth = window.innerWidth;
            const desiredWidth = viewportWidth - event.clientX;
            const maxAllowed = Math.max(MIN_CHAT_WIDTH, viewportWidth - MIN_DASHBOARD_WIDTH);
            const boundedWidth = Math.min(Math.max(desiredWidth, MIN_CHAT_WIDTH), maxAllowed);
            setChatWidth(boundedWidth);
        };
        const handleMouseUp = () => setIsResizing(false);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isResizing]);

    // --- Theme Helper ---
    const currentTheme = THEMES[state.theme] || THEMES.indigo;

    // --- Actions ---

    // Helper to update specific session in state
    const updateChatSession = (chatId: string, newMessages: ChatMessage[]) => {
        setState(prev => {
            const sessions = [...prev.chatSessions];
            const idx = sessions.findIndex(s => s.id === chatId);
            if (idx !== -1) {
                const updatedSession = { ...sessions[idx], messages: newMessages, updatedAt: new Date().toISOString() };
                // Generate title from first message if it's "New Chat" and has messages
                if (updatedSession.title === "新对话" && newMessages.length > 0 && newMessages[0].role === 'user') {
                    updatedSession.title = newMessages[0].text.substring(0, 15) + (newMessages[0].text.length > 15 ? "..." : "");
                }
                sessions[idx] = updatedSession;
            }
            return { ...prev, chatSessions: sessions };
        });
    };

    const createNewChat = () => {
        const newId = Date.now().toString();
        const newSession: ChatSessionData = {
            id: newId,
            title: "新对话",
            messages: [],
            updatedAt: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            chatSessions: [newSession, ...prev.chatSessions],
            currentChatId: newId
        }));
        setMessages([]);
    };

    const selectChat = (id: string) => {
        const session = state.chatSessions.find(s => s.id === id);
        if (session) {
            setState(prev => ({ ...prev, currentChatId: id }));
            setMessages(session.messages);
            // Only pass history if context is enabled
            const historyToLoad = state.coachSettings.enableContext ? session.messages : [];
            coachService.startChat(state, historyToLoad);
        }
    };

    const deleteChat = (id: string) => {
        // Don't allow deleting if it's the only one, or create new one if it is
        if (state.chatSessions.length <= 1) {
            setMessages([]);
            // Create a fresh one instead
            const newId = Date.now().toString();
            const newSession = { id: newId, title: "新对话", messages: [], updatedAt: new Date().toISOString() };
            setState(prev => ({ ...prev, chatSessions: [newSession], currentChatId: newId }));
            return;
        }

        const isDeletingCurrent = state.currentChatId === id;
        const remainingSessions = state.chatSessions.filter(s => s.id !== id);

        setState(prev => ({
            ...prev,
            chatSessions: remainingSessions,
            currentChatId: isDeletingCurrent ? remainingSessions[0].id : prev.currentChatId
        }));

        if (isDeletingCurrent) {
            setMessages(remainingSessions[0].messages);
        }
    };

    const handleSendMessage = async (text: string, isAutoTrigger = false) => {
        // Ensure we have a valid chat ID
        let chatId = state.currentChatId;
        if (!chatId) {
            createNewChat();
            chatId = state.currentChatId!; // Will be set by createNewChat (async issue workaround required if strictly sync, but React batching usually fine here or next render)
            // Actually, createNewChat relies on setState, so 'chatId' won't be updated yet in this closure. 
            // We need to handle the case where chatId is null differently or rely on init.
            // For safety, if no ID, return or generate temporary one.
            // Assuming init sets a chat ID.
            return;
        }

        const newUserMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text,
            timestamp: new Date(),
        };

        // Optimistic UI update
        const updatedMessages = [...messages, newUserMsg];
        setMessages(updatedMessages);
        updateChatSession(chatId, updatedMessages);

        setIsLoading(true);

        // Morning & Night Logic
        const isMorning = text.includes("早安");
        const isNight = text.includes("晚安");

        let currentMsgs = updatedMessages;

        if (!isAutoTrigger) {
            if (isMorning) {
                const habit = state.habits.find(h => h.title.includes('早安'));
                addManualSession("☀️ 早安打卡", new Date().toISOString(), 0, undefined, habit?.id);

                const feedbackMsg: ChatMessage = {
                    id: Date.now().toString() + '_sys_m',
                    role: 'model',
                    text: "已完成早安打卡",
                    timestamp: new Date(),
                    actionData: { type: 'CHECK_IN', title: '早安打卡', details: '已完成' }
                };
                currentMsgs = [...currentMsgs, feedbackMsg];
                setMessages(currentMsgs);
                updateChatSession(chatId, currentMsgs);
            }
            if (isNight) {
                const habit = state.habits.find(h => h.title.includes('晚安'));
                addManualSession("🌙 晚安打卡", new Date().toISOString(), 0, undefined, habit?.id);

                const feedbackMsg: ChatMessage = {
                    id: Date.now().toString() + '_sys_n',
                    role: 'model',
                    text: "已完成晚安打卡",
                    timestamp: new Date(),
                    actionData: { type: 'CHECK_IN', title: '晚安打卡', details: '已完成' }
                };
                currentMsgs = [...currentMsgs, feedbackMsg];
                setMessages(currentMsgs);
                updateChatSession(chatId, currentMsgs);
            }
        }

        // Debug Mode: Show System Information BEFORE sending message
        if (state.coachSettings.debugMode) {
            const systemPrompt = coachService.getSystemInstruction(state);
            const historyForDebug = state.coachSettings.enableContext ? messages.filter(msg => !msg.id.includes('_debug')) : [];

            const debugInfoMsg: ChatMessage = {
                id: Date.now().toString() + '_debug_info',
                role: 'model',
                text: `## 🐛 调试信息 - ${new Date().toLocaleTimeString()}

### 📋 系统提示词 (System Prompt)
\`\`\`
${systemPrompt}
\`\`\`

### 💬 上下文状态
- **上下文记忆**: ${state.coachSettings.enableContext ? '✅ 已启用' : '❌ 已禁用'}
- **历史消息数**: ${historyForDebug.length} 条

${state.coachSettings.enableContext ? `
### 📜 对话历史 (发送给 AI)
\`\`\`json
${JSON.stringify(historyForDebug.map(m => ({
                    role: m.role,
                    text: m.text.substring(0, 100) + (m.text.length > 100 ? '...' : '')
                })), null, 2)}
\`\`\`
` : ''}
---`,
                timestamp: new Date(),
            };

            currentMsgs = [...currentMsgs, debugInfoMsg];
            setMessages(currentMsgs);
            updateChatSession(chatId, currentMsgs);
        }

        try {
            // 1. Send message to Gemini/LLM
            const historyToSend = state.coachSettings.enableContext ? messages : [];
            let result = await coachService.sendMessage(text, state, historyToSend);

            // DEBUG: Log Initial AI Response
            if (state.coachSettings.debugMode) {
                const hasToolCalls = result.toolCalls && result.toolCalls.length > 0;
                const debugMsg: ChatMessage = {
                    id: Date.now().toString() + '_debug_response_initial',
                    role: 'model',
                    text: `## 🤖 AI 响应 #1

### 📝 返回文本
${result.response ? `\`\`\`\n${result.response}\n\`\`\`` : '_无文本内容_'}

### ⚙️ 功能调用
${hasToolCalls ? `
\`\`\`json
${JSON.stringify(result.toolCalls, null, 2)}
\`\`\`
` : '_无功能调用_'}
---`,
                    timestamp: new Date(),
                };
                currentMsgs = [...currentMsgs, debugMsg];
                setMessages(currentMsgs);
                updateChatSession(chatId, currentMsgs);
            }

            // 2. Handle Tool Calls Loop (if LLM wants to add tasks/goals)
            let loops = 0;

            while (result.toolCalls && result.toolCalls.length > 0 && loops < 5) {
                loops++;

                const toolResponses: { name: string, response: any, id?: string }[] = [];

                // Process ALL tool calls in this turn
                for (const toolCall of result.toolCalls) {
                    console.log("Tool Called:", toolCall);
                    let toolResult = "Success";

                    // Execute Tool
                    if (toolCall.name === 'addTask') {
                        const { title, goalTitle } = toolCall.args;

                        // Find goal by title if provided
                        let goalId: string | undefined = undefined;
                        let linkedGoalName: string | undefined = undefined;
                        if (goalTitle) {
                            const matchingGoal = state.goals.find(g =>
                                g.title.toLowerCase().includes(goalTitle.toLowerCase()) ||
                                goalTitle.toLowerCase().includes(g.title.toLowerCase())
                            );
                            if (matchingGoal) {
                                goalId = matchingGoal.id;
                                linkedGoalName = matchingGoal.title;
                            }
                        }

                        // Add task with optional goal link (skip AI feedback since we have tool message)
                        addTask(title, goalId, true);
                        toolResult = goalId
                            ? `任务 "${title}" 添加成功并关联到目标 "${linkedGoalName}"。`
                            : `任务 "${title}" 添加成功。`;

                        const toolMsg: ChatMessage = {
                            id: Date.now().toString() + Math.random(),
                            role: 'model',
                            text: linkedGoalName
                                ? `已添加待办任务：${title}，关联至目标：${linkedGoalName}`
                                : `已添加待办任务：${title}`,
                            timestamp: new Date(),
                            actionData: { type: 'ADD_TASK', title, details: linkedGoalName }
                        };
                        currentMsgs = [...currentMsgs, toolMsg];

                    } else if (toolCall.name === 'addGoal') {
                        const { title, deadline } = toolCall.args;
                        addGoal(title, deadline);
                        toolResult = `目标 "${title}" (截止: ${deadline}) 添加成功。`;

                        const toolMsg: ChatMessage = {
                            id: Date.now().toString() + Math.random(),
                            role: 'model',
                            text: `已为你设定长期目标：${title}`,
                            timestamp: new Date(),
                            actionData: { type: 'ADD_GOAL', title, details: deadline }
                        };
                        currentMsgs = [...currentMsgs, toolMsg];
                    } else if (toolCall.name === 'addSession') {
                        const { label, startTime, endTime, taskTitle } = toolCall.args;

                        // Calculate duration
                        const start = new Date(startTime);
                        const end = new Date(endTime);
                        const durationSeconds = Math.max(0, (end.getTime() - start.getTime()) / 1000);

                        // Find task by title if provided
                        let taskId: string | undefined = undefined;
                        let linkedTaskName: string | undefined = undefined;
                        if (taskTitle) {
                            const matchingTask = state.tasks.find(t =>
                                t.title.toLowerCase().includes(taskTitle.toLowerCase()) ||
                                taskTitle.toLowerCase().includes(t.title.toLowerCase())
                            );
                            if (matchingTask) {
                                taskId = matchingTask.id;
                                linkedTaskName = matchingTask.title;
                            }
                        }

                        // Add the session
                        addManualSession(label, startTime, durationSeconds, taskId);

                        const durationMinutes = Math.floor(durationSeconds / 60);
                        toolResult = taskId
                            ? `专注记录 "${label}" 添加成功，时长 ${durationMinutes} 分钟，已关联到待办：${linkedTaskName}。`
                            : `专注记录 "${label}" 添加成功，时长 ${durationMinutes} 分钟。`;

                        const toolMsg: ChatMessage = {
                            id: Date.now().toString() + Math.random(),
                            role: 'model',
                            text: linkedTaskName
                                ? `已添加专注记录：${label} (${durationMinutes}分钟)，关联至待办：${linkedTaskName}`
                                : `已添加专注记录：${label} (${durationMinutes}分钟)`,
                            timestamp: new Date(),
                            actionData: { type: 'ADD_SESSION', title: label, details: linkedTaskName }
                        };
                        currentMsgs = [...currentMsgs, toolMsg];
                    }

                    toolResponses.push({
                        name: toolCall.name,
                        response: toolResult,
                        id: toolCall.id
                    });
                }

                // Update UI with all tool messages
                setMessages(currentMsgs);
                updateChatSession(chatId, currentMsgs);

                // DEBUG: Log Tool Execution Results
                if (state.coachSettings.debugMode) {
                    const debugOutputMsg: ChatMessage = {
                        id: Date.now().toString() + '_debug_tool_output',
                        role: 'model',
                        text: `## ⚙️ 工具执行结果 (回合 ${loops})

### 📤 返回给 AI 的数据
\`\`\`json
${JSON.stringify(toolResponses, null, 2)}
\`\`\`
---`,
                        timestamp: new Date(),
                    };
                    currentMsgs = [...currentMsgs, debugOutputMsg];
                    setMessages(currentMsgs);
                    updateChatSession(chatId, currentMsgs);
                }

                // 3. Send ALL results back to LLM
                result = await coachService.sendToolResponses(toolResponses);

                // DEBUG: Log Subsequent AI Response
                if (state.coachSettings.debugMode) {
                    const hasMoreToolCalls = result.toolCalls && result.toolCalls.length > 0;
                    const debugNextMsg: ChatMessage = {
                        id: Date.now().toString() + '_debug_response_' + loops,
                        role: 'model',
                        text: `## 🤖 AI 响应 #${loops + 1}

### 📝 返回文本
${result.response ? `\`\`\`\n${result.response}\n\`\`\`` : '_无文本内容_'}

### ⚙️ 功能调用
${hasMoreToolCalls ? `
\`\`\`json
${JSON.stringify(result.toolCalls, null, 2)}
\`\`\`
` : '_无更多功能调用_'}
---`,
                        timestamp: new Date(),
                    };
                    currentMsgs = [...currentMsgs, debugNextMsg];
                    setMessages(currentMsgs);
                    updateChatSession(chatId, currentMsgs);
                }
            }


            // 4. Add Model Response
            const newBotMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: result.response,
                timestamp: new Date(),
            };

            const finalMessages = [...currentMsgs, newBotMsg];
            setMessages(finalMessages);
            updateChatSession(chatId, finalMessages);

            // 5. Special Workflow: Night Routine - Generate Report
            if (isNight) {
                // Generate report after AI response
                const reportData = await coachService.generateDailyReport(state);
                addReport(reportData.title, reportData.content);

                const reportMsg: ChatMessage = {
                    id: Date.now().toString() + Math.random(),
                    role: 'model',
                    text: `已自动生成并归档今日日报。`,
                    timestamp: new Date(),
                    actionData: { type: 'GENERATE_REPORT', title: '今日日报已归档' }
                };
                const msgsWithReport = [...finalMessages, reportMsg];
                setMessages(msgsWithReport);
                updateChatSession(chatId, msgsWithReport);
            }

        } catch (error) {
            console.error(error);
            const errorMsg: ChatMessage = {
                id: Date.now().toString(),
                role: 'model',
                text: "我现在连接有点问题，请检查网络或 API 设置。",
                timestamp: new Date(),
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
            // Also save error to history? Maybe useful.
            // updateChatSession(chatId, [...messages, errorMsg]); 
        } finally {
            setIsLoading(false);
        }
    };

    // 更新 Ref，以便 triggerAIFeedback 可以调用最新的 handleSendMessage
    handleSendMessageRef.current = handleSendMessage;

    // 🔧 generateReportContent 现在由 useReportManagement Hook 提供

    // 🔧 generateReportContent 现在由 useReportManagement Hook 提供

    // 🔧 testConnection 现在由 useSettings Hook 提供

    const testStorageConnection = async () => {
        setIsTestingStorage(true);
        setStorageTestResult(null);
        try {
            await StorageService.testConnection(localSettings.storage);
            setStorageTestResult({ type: 'success', message: "数据库连接成功！" });
        } catch (error: any) {
            setStorageTestResult({ type: 'error', message: error.message || "连接失败" });
        } finally {
            setIsTestingStorage(false);
        }
    };

    // Track last sync state to optimize uploads
    const lastSyncRef = useRef<{
        chatCount: number,
        reportCount: number,
        currentChatId: string | null
    }>({ chatCount: 0, reportCount: 0, currentChatId: null });

    // Auto-sync Effect
    useEffect(() => {
        const config = state.storageConfig;
        // Only auto-sync if Supabase is configured
        if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
            return;
        }

        // Debounce sync to avoid too many requests
        const timer = setTimeout(() => {
            syncToCloud(true);
        }, 3000); // 3 seconds after last change

        return () => clearTimeout(timer);
    }, [state]); // Sync on any state change

    const syncToCloud = async (isAuto = false) => {
        // Use state config for auto-sync (background), local settings for manual sync (in modal)
        const config = isAuto ? state.storageConfig : localSettings.storage;

        if (!config.supabaseUrl || !config.supabaseKey) {
            if (!isAuto) setSyncMessage({ type: 'error', text: "请先配置并填写 Supabase URL 和 Key" });
            return;
        }

        // Determine if we need to sync archive data (heavy)
        // Archive changes if:
        // 1. User switched chats (old active moves to archive)
        // 2. User deleted a chat (count changed)
        // 3. User added/deleted a report
        // Note: Active chat message updates are now in CORE, so they don't trigger archive sync.

        const currentChatCount = state.chatSessions.length;
        const currentReportCount = state.reports.length;
        const currentChatId = state.currentChatId;

        const hasArchiveChanged =
            currentChatCount !== lastSyncRef.current.chatCount ||
            currentReportCount !== lastSyncRef.current.reportCount ||
            currentChatId !== lastSyncRef.current.currentChatId;

        // If auto-sync and only core data changed, skip archive upload
        const onlyCore = isAuto && !hasArchiveChanged;

        // We'll upload the CURRENT state, but with the NEW storage config embedded to ensure consistency on restore
        const stateToUpload = { ...state, storageConfig: config };

        if (!isAuto) {
            setIsSyncing(true);
            setSyncMessage({ type: 'info', text: onlyCore ? "正在同步核心数据..." : "正在全量同步..." });
        } else {
            // Optional: Show a subtle "Saving..." indicator in a different state variable if desired
            // For now we can just let it happen silently or use a non-blocking message
        }

        try {
            await StorageService.uploadData(config, stateToUpload, onlyCore);

            // Update reference if successful. 
            // We update it regardless of onlyCore, because if onlyCore=true, it means archive didn't change, 
            // so updating the ref to current values (which are same as old values for archive parts) is safe.
            lastSyncRef.current = {
                chatCount: currentChatCount,
                reportCount: currentReportCount,
                currentChatId: currentChatId
            };

            if (!isAuto) {
                setSyncMessage({ type: 'success', text: "上传成功！数据已安全存储。" });
            } else {
                console.log(`Auto-sync success (${onlyCore ? 'Core Only' : 'Full'})`);
            }
        } catch (e: any) {
            console.error("Sync failed:", e);
            if (!isAuto) {
                setSyncMessage({ type: 'error', text: "上传失败: " + e.message });
            }
        } finally {
            if (!isAuto) {
                setIsSyncing(false);
            }
        }
    };

    const syncFromCloud = async () => {
        const config = localSettings.storage;
        console.log('Sync from cloud triggered', config);
        if (!config.supabaseUrl || !config.supabaseKey) {
            setSyncMessage({ type: 'error', text: "请先配置并填写 Supabase URL 和 Key" });
            return;
        }

        setIsSyncing(true);
        setSyncMessage({ type: 'info', text: "正在从云端下载..." });
        try {
            const cloudState = await StorageService.downloadData(config);
            if (cloudState) {
                setPendingCloudData(cloudState);
                setRestoreSource('cloud');
                setSyncMessage(null); // Clear loading message, show card
            } else {
                setSyncMessage({ type: 'error', text: "云端没有找到备份数据" });
            }
        } catch (e: any) {
            setSyncMessage({ type: 'error', text: "下载失败: " + e.message });
        } finally {
            setIsSyncing(false);
        }
    };

    const confirmRestore = () => {
        if (!pendingCloudData) return;
        console.log('Restoring data:', pendingCloudData);
        setState(pendingCloudData);
        setLocalSettings({
            coach: pendingCloudData.coachSettings,
            storage: pendingCloudData.storageConfig
        });
        // Restart services
        coachService.startChat(pendingCloudData);

        // Restore messages for UI
        if (pendingCloudData.currentChatId) {
            const session = pendingCloudData.chatSessions?.find(s => s.id === pendingCloudData.currentChatId);
            if (session) setMessages(session.messages);
        }

        setPendingCloudData(null);
        setSyncMessage({ type: 'success', text: `已成功从${restoreSource === 'cloud' ? '云端' : '本地'}恢复数据！` });
    };

    const cancelRestore = () => {
        setPendingCloudData(null);
        setSyncMessage(null);
    };


    // 🔧 handleImportClick 和 importData 现在由 useSettings Hook 提供

    // --- State Modifiers ---

    // 🔧 addTask, updateTask, toggleTask, deleteTask 现在由 useTaskManagement Hook 提供


    // 🔧 addGoal, updateGoal, toggleGoal, deleteGoal 现在由 useGoalManagement Hook 提供

    // 🔧 addGoal, updateGoal, toggleGoal, deleteGoal 现在由 useGoalManagement Hook 提供

    // 🔧 addVision, updateVision, deleteVision, toggleVisionArchived 现在由 useVisionManagement Hook 提供

    // 🔧 startSession, stopSession, addManualSession, updateSession, renameSession, deleteSession 现在由 useSessionManagement Hook 提供

    // 🔧 addHabit, updateHabit, deleteHabit, toggleCheckIn, handleCheckIn 现在由 useHabitManagement Hook 提供

    // 🔧 addReport, updateReport, deleteReport 现在由 useReportManagement Hook 提供

    // 🔧 updateTheme 现在由 useSettings Hook 提供

    // --- Settings Logic ---

    const handleStyleChange = (selectedStyle: string) => {
        const preset = COACH_STYLES.find(s => s.label === selectedStyle);

        setLocalSettings(prev => ({
            ...prev,
            coach: {
                ...prev.coach,
                style: selectedStyle,
                customInstruction: preset ? preset.value : prev.coach.customInstruction
            }
        }));
    };

    const handleProviderPreset = (provider: string) => {
        let baseUrl = '';
        let modelId = '';

        if (provider === 'deepseek') {
            baseUrl = 'https://api.deepseek.com';
            modelId = 'deepseek-chat';
        } else if (provider === 'siliconflow') {
            baseUrl = 'https://api.siliconflow.cn/v1';
            modelId = 'deepseek-ai/DeepSeek-V3';
        } else if (provider === 'openai') {
            baseUrl = 'https://api.openai.com/v1';
            modelId = 'gpt-3.5-turbo';
        } else {
            baseUrl = '';
            modelId = 'gemini-2.5-flash';
        }

        setLocalSettings(prev => ({
            ...prev,
            coach: {
                ...prev.coach,
                modelConfig: {
                    ...prev.coach.modelConfig,
                    provider: provider as any,
                    baseUrl,
                    modelId
                }
            }
        }));
    };

    // 🔧 saveSettings 现在由 useSettings Hook 提供

    // 🔧 exportData 现在由 useSettings Hook 提供

    const contextValue: AppContextType = {
        state,
        theme: currentTheme,
        messages,
        isLoading,
        viewingTaskId, setViewingTaskId,
        viewingGoalId, setViewingGoalId,
        viewingVisionId, setViewingVisionId,
        viewingReportId, setViewingReportId,
        viewingSessionId, setViewingSessionId,
        viewingHabitId, setViewingHabitId,

        // Settings & UI State
        localSettings, setLocalSettings,
        settingsTab, setSettingsTab,
        isTestingConnection, connectionTestResult,
        isTestingStorage, storageTestResult,
        isSyncing, syncMessage,
        pendingCloudData, restoreSource,
        fileInputRef,

        actions: {
            toggleTask, deleteTask, addTask, updateTask,
            addGoal, toggleGoal, deleteGoal, updateGoal,
            addVision, updateVision, deleteVision, toggleVisionArchived,
            startSession, stopSession, addSession: addManualSession, updateSession, renameSession, deleteSession, checkIn: handleCheckIn,
            addHabit, updateHabit, deleteHabit, toggleCheckIn,
            generateReport: generateReportContent, saveReport: addReport, updateReport, deleteReport,

            // Chat Actions
            sendMessage: handleSendMessage,
            createNewChat,
            selectChat,
            deleteChat,

            // Settings & Data Actions
            saveSettings,
            cancelSettings: () => setIsSettingsOpen(false),
            updateTheme,
            testConnection,
            testStorageConnection,
            syncToCloud,
            syncFromCloud,
            confirmRestore,
            cancelRestore,
            exportData,
            importData,
            handleImportClick
        }
    };

    if (isMobile) {
        return (
            <AppProvider value={contextValue}>
                <MobileLayout />
            </AppProvider>
        );
    }


    return (
        <AppProvider value={contextValue}>
            <div className={`flex h-screen overflow-hidden ${currentTheme.bg}`}>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full transition-all duration-300">

                    {/* Navbar */}
                    <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 h-16 px-6 flex items-center justify-between shrink-0 z-10">
                        <div className="flex items-center gap-2">
                            <div className={`bg-${currentTheme.primary}-600 p-2 rounded-lg shadow-sm`}>
                                <BarChart3 className="text-white w-5 h-5" />
                            </div>
                            <h1 className="text-xl font-bold font-serif text-slate-800 tracking-tight">LifeSync</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Cloud Status Indicator */}
                            {state.storageConfig.provider === 'supabase' && (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-${currentTheme.primary}-50 text-${currentTheme.primary}-600 border border-${currentTheme.primary}-100`}>
                                    <Cloud size={12} />
                                    {isSyncing ? "云端同步中..." : "云端已连接"}
                                </div>
                            )}

                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className={`p-2 text-slate-500 hover:text-${currentTheme.primary}-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2`}
                            >
                                <Search size={20} />
                                <span className="hidden sm:inline text-sm font-medium">搜索</span>
                            </button>
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className={`p-2 text-slate-500 hover:text-${currentTheme.primary}-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2`}
                            >
                                <Settings size={20} />
                                <span className="hidden sm:inline text-sm font-medium">设置</span>
                            </button>
                            {isChatOpen ? (
                                <button
                                    onClick={() => setIsChatOpen(false)}
                                    className={`flex items-center gap-2 text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium`}
                                    title="关闭聊天"
                                >
                                    <PanelRightClose size={20} />
                                    <span className="hidden sm:inline">关闭聊天</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsChatOpen(true)}
                                    className={`flex items-center gap-2 bg-${currentTheme.primary}-600 text-white px-4 py-2 rounded-lg hover:bg-${currentTheme.primary}-700 transition-colors text-sm font-medium shadow-sm`}
                                >
                                    <MessageSquare size={16} /> 打开聊天
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Dashboard Content */}
                    <div className="flex-1 overflow-hidden relative">
                        <Dashboard />
                    </div>
                </div>

                {/* Chat Sidebar with Resizable Divider */}
                {isChatOpen && (
                    <>
                        <div
                            role="separator"
                            aria-orientation="vertical"
                            aria-label="调整聊天面板宽度"
                            className={`w-1.5 cursor-ew-resize bg-${currentTheme.primary}-100 hover:bg-${currentTheme.primary}-200 transition-colors`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setIsResizing(true);
                            }}
                        />
                        <div
                            className="relative h-full bg-white shadow-2xl flex flex-col transition-[width] duration-150 ease-out z-20"
                            style={{ width: `${chatWidth}px` }}
                        >
                            <ChatInterface
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                isLoading={isLoading}
                                settings={state.coachSettings}
                                theme={currentTheme}
                                chatSessions={state.chatSessions}
                                currentChatId={state.currentChatId}
                                onNewChat={createNewChat}
                                onSelectChat={selectChat}
                                onDeleteChat={deleteChat}
                                onCloseChat={() => setIsChatOpen(false)}
                            />
                        </div>
                    </>
                )}

                {/* Search Modal */}
                <SearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    theme={currentTheme}
                    tasks={state.tasks}
                    goals={state.goals}
                    visions={state.visions}
                    sessions={state.sessions}
                    habits={state.habits}
                    reports={state.reports}
                    onNavigate={(type, id) => {
                        if (type === 'task') setViewingTaskId(id);
                        if (type === 'goal') setViewingGoalId(id);
                        if (type === 'vision') setViewingVisionId(id);
                        if (type === 'report') setViewingReportId(id);
                        if (type === 'session') setViewingSessionId(id);
                        if (type === 'habit') setViewingHabitId(id);
                    }}
                />

                {/* Settings Modal */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
                                    <Settings size={24} className={`text-${currentTheme.primary}-600`} /> 设置
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={saveSettings}
                                        className={`px-4 py-2 bg-${currentTheme.primary}-600 text-white rounded-lg hover:bg-${currentTheme.primary}-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm`}
                                    >
                                        <Save size={16} /> 保存
                                    </button>
                                    <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="关闭">
                                        <X size={24} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            <SettingsView
                                state={state}
                                localSettings={localSettings}
                                setLocalSettings={setLocalSettings}
                                currentTheme={currentTheme}
                                settingsTab={settingsTab}
                                setSettingsTab={setSettingsTab}
                                onSave={saveSettings}
                                onCancel={() => setIsSettingsOpen(false)}
                                onUpdateTheme={updateTheme}
                                isTestingConnection={isTestingConnection}
                                connectionTestResult={connectionTestResult}
                                onTestConnection={testConnection}
                                isTestingStorage={isTestingStorage}
                                storageTestResult={storageTestResult}
                                onTestStorageConnection={testStorageConnection}
                                isSyncing={isSyncing}
                                syncMessage={syncMessage}
                                onSyncToCloud={syncToCloud}
                                onSyncFromCloud={syncFromCloud}
                                pendingCloudData={pendingCloudData}
                                restoreSource={restoreSource}
                                onConfirmRestore={confirmRestore}
                                onCancelRestore={cancelRestore}
                                onExportData={exportData}
                                onImportData={importData}
                                onHandleImportClick={handleImportClick}
                                fileInputRef={fileInputRef}
                            />
                        </div>
                    </div>
                )}

            </div>
        </AppProvider>
    );
};

export default App;
