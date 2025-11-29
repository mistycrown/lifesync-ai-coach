
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, BarChart3, MessageSquare, X, Sparkles, FileText, User, Palette, Database, Download, Trash2, Save, Check, Server, Key, Link as LinkIcon, Box, PlugZap, Loader2, AlertCircle, Cloud, UploadCloud, DownloadCloud, HardDrive, Info, HelpCircle, FileJson, Search } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import { SearchModal } from './components/SearchModal';
import { Select } from './components/Select';
import { AppState, ChatMessage, Task, Goal, Session, DailyReport, CoachSettings, ThemeConfig, ModelConfig, StorageConfig, ChatSessionData, Habit, Vision } from './types';
import { CoachService } from './services/geminiService';
import { StorageService, SUPABASE_TABLE } from './services/storageService';

// --- Theme Definitions ---
const THEMES: Record<string, ThemeConfig> = {
    emerald: { name: '森之呼吸', primary: 'emerald', secondary: 'teal', text: 'emerald', bg: 'bg-emerald-50/50' },
    indigo: { name: '经典蓝紫', primary: 'indigo', secondary: 'violet', text: 'indigo', bg: 'bg-indigo-50/50' },
    blue: { name: '深海湛蓝', primary: 'blue', secondary: 'sky', text: 'blue', bg: 'bg-blue-50/50' },
    rose: { name: '浪漫玫瑰', primary: 'rose', secondary: 'red', text: 'rose', bg: 'bg-rose-50/50' },
    amber: { name: '温暖夕阳', primary: 'amber', secondary: 'yellow', text: 'amber', bg: 'bg-amber-50/50' },
    slate: { name: '极简黑白', primary: 'slate', secondary: 'gray', text: 'slate', bg: 'bg-gray-50/50' },
};

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
            }
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

const COACH_STYLES = [
    { label: "❤️温柔鼓励", value: "你是一位知心好友或温柔的姐姐。语气总是充满支持、理解和同理心。你永远温暖、陪伴、治愈。善用emoji关心和鼓励用户。" },
    { label: "🔥严厉鞭策型", value: "你语气强硬、不留情面。拒绝任何借口，只关注结果。使用命令式短句。当用户拖延时，进行严厉的训斥和督促。关键词：纪律、行动、无借口、立刻执行。" },
    { label: "🧠咨询顾问", value: "你是一位客观的数据分析师。语气冷静、中立、无情绪波动。注重事实、效率和逻辑拆解。用数据说话，帮助用户分析任务的可行性和时间成本。关键词：逻辑、效率、拆解、客观。" },
    { label: "👑忠诚首辅", value: "用户的身份是“陛下”，你是“微臣”。你使用古文文案和奏章体。概念替换：任务→“奏折/国事”，目标→“千秋大业”，拖延→“荒废朝政”。时刻表现出对江山社稷的担忧，恭敬但敢于直谏。" },
    { label: "☕全能管家", value: "用户的身份是“少爷/小姐”，你是“英式老管家”。语气极致优雅、谦卑、得体。使用敬语（为您效劳）。即使是催促，也要用最礼貌的方式表达，让用户感到不完成任务有失身份。" },
    { label: "🚀硅谷PM", value: "你是一位资深产品经理。满嘴互联网黑话。关注MVP、迭代、复盘和ROI。将每一天视为一个Sprint。拒绝低效的情感交流，只看产出。" },
    { label: "🛡️RPG向导", value: "你是奇幻游戏的NPC向导。语气热血、中二、充满史诗感。概念替换：任务→“主线/支线委托”，困难→“Boss战”，专注→“修炼”，睡觉→“回血”。完成任务时给予夸张的经验值奖励描述。" },
    { label: "🧘佛系禅师", value: "你是一位得道高僧。语气平和、缓慢、充满禅机。不强迫用户做事，而是引导其“觉察”当下。用简短的隐喻回答问题。关键词：放下、呼吸、活在当下、随缘。" },
    { label: "🤔苏格拉底", value: "你是一位睿智的哲学导师。尽量不要直接给出答案，而是通过提问引导用户自己思考。帮助用户探究行为背后的深层动机和价值观。关键词：反思、提问、启发、深度。" },
    { label: "自定义 (完全自由发挥)", value: "" }
];

const coachService = new CoachService();

const App: React.FC = () => {
    const [state, setState] = useState<AppState>(() => {
        // Basic persistence with version bump for chat history support
        const saved = localStorage.getItem('lifesync-state-v5');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deep merge logic
                const merged = { ...initialState, ...parsed };
                merged.coachSettings = { ...initialState.coachSettings, ...parsed.coachSettings };
                if (parsed.coachSettings?.modelConfig) {
                    merged.coachSettings.modelConfig = { ...initialState.coachSettings.modelConfig, ...parsed.coachSettings.modelConfig };
                }
                if (parsed.storageConfig) {
                    merged.storageConfig = { ...initialState.storageConfig, ...parsed.storageConfig };
                }
                // Ensure chat history integrity
                if (!merged.habits) merged.habits = initialState.habits;
                if (!merged.chatSessions || !Array.isArray(merged.chatSessions) || merged.chatSessions.length === 0) {
                    merged.chatSessions = initialState.chatSessions;
                    merged.currentChatId = initialState.currentChatId;
                }
                return merged;
            } catch (e) {
                console.error("Failed to load state", e);
                return initialState;
            }
        }
        return initialState;
    });

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [chatWidth, setChatWidth] = useState(DEFAULT_CHAT_WIDTH);
    const [isResizing, setIsResizing] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'coach' | 'theme' | 'data'>('coach');

    // Navigation State (Lifted from Dashboard for Search)
    const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
    const [viewingGoalId, setViewingGoalId] = useState<string | null>(null);
    const [viewingVisionId, setViewingVisionId] = useState<string | null>(null);
    const [viewingReportId, setViewingReportId] = useState<string | null>(null);
    const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
    const [viewingHabitId, setViewingHabitId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Connection Test State
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionTestResult, setConnectionTestResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Storage Test State
    const [isTestingStorage, setIsTestingStorage] = useState(false);
    const [storageTestResult, setStorageTestResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Sync State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    const [pendingCloudData, setPendingCloudData] = useState<AppState | null>(null);
    const [restoreSource, setRestoreSource] = useState<'cloud' | 'local'>('cloud');

    // Local settings state for the modal form
    const [localSettings, setLocalSettings] = useState<{ coach: CoachSettings, storage: StorageConfig }>({
        coach: state.coachSettings,
        storage: state.storageConfig
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persistence effect
    useEffect(() => {
        localStorage.setItem('lifesync-state-v5', JSON.stringify(state));
    }, [state]);

    // Init Coach and load chat history
    useEffect(() => {
        coachService.startChat(state);

        // Load messages for the active session
        if (state.currentChatId) {
            const session = state.chatSessions.find(s => s.id === state.currentChatId);
            if (session) {
                setMessages(session.messages);
            }
        }
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
            setIsTestingConnection(false);
            setConnectionTestResult(null);
            setStorageTestResult(null);
            setSyncMessage(null);
            setPendingCloudData(null);
        }
    }, [isSettingsOpen, state.coachSettings, state.storageConfig]);

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

        try {
            // 1. Send message to Gemini/LLM
            let result = await coachService.sendMessage(text, state);

            // 2. Handle Tool Calls Loop (if LLM wants to add tasks/goals)
            let loops = 0;

            while (result.toolCalls && result.toolCalls.length > 0 && loops < 5) {
                loops++;
                const toolCall = result.toolCalls[0];
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
                    setMessages(currentMsgs);
                    updateChatSession(chatId, currentMsgs);

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
                    setMessages(currentMsgs);
                    updateChatSession(chatId, currentMsgs);
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
                    setMessages(currentMsgs);
                    updateChatSession(chatId, currentMsgs);
                }

                // 3. Send result back to LLM
                result = await coachService.sendToolResponse(toolCall.name, toolResult, toolCall.id);
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

    const triggerAIFeedback = (text: string) => {
        setTimeout(() => {
            handleSendMessage(text, true);
        }, 500);
    };

    const generateReportContent = async (date?: string): Promise<{ title: string, content: string }> => {
        try {
            return await coachService.generateDailyReport(state, date);
        } catch (e) {
            return { title: "错误", content: "生成日报失败，请稍后重试。" };
        }
    };

    const testConnection = async () => {
        setIsTestingConnection(true);
        setConnectionTestResult(null);
        try {
            await coachService.testConnection(localSettings.coach.modelConfig);
            setConnectionTestResult({ type: 'success', message: "API 连接成功！模型响应正常。" });
        } catch (error: any) {
            setConnectionTestResult({ type: 'error', message: "连接失败: " + (error.message || "未知错误") });
        } finally {
            setIsTestingConnection(false);
        }
    };

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

    const syncToCloud = async () => {
        const config = localSettings.storage;
        if (!config.supabaseUrl || !config.supabaseKey) {
            setSyncMessage({ type: 'error', text: "请先配置并填写 Supabase URL 和 Key" });
            return;
        }

        // We'll upload the CURRENT state, but with the NEW storage config embedded to ensure consistency on restore
        const stateToUpload = { ...state, storageConfig: config };

        setIsSyncing(true);
        setSyncMessage({ type: 'info', text: "正在上传到云端..." });
        try {
            await StorageService.uploadData(config, stateToUpload);
            setSyncMessage({ type: 'success', text: "上传成功！数据已安全存储。" });
        } catch (e: any) {
            setSyncMessage({ type: 'error', text: "上传失败: " + e.message });
        } finally {
            setIsSyncing(false);
        }
    };

    const syncFromCloud = async () => {
        const config = localSettings.storage;
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

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content);

                // Validate minimal structure
                if (!parsed.tasks || !parsed.coachSettings) {
                    throw new Error("无效的备份文件：缺少关键数据字段");
                }

                // Use UI confirmation instead of window.confirm
                setPendingCloudData(parsed);
                setRestoreSource('local');
                setSyncMessage(null);

            } catch (err: any) {
                setSyncMessage({ type: 'error', text: '导入失败: ' + err.message });
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    // --- State Modifiers ---

    const addTask = (title: string, goalId?: string, skipFeedback = false) => {
        setState(prev => ({
            ...prev,
            tasks: [{ id: Date.now().toString(), title, completed: false, createdAt: new Date().toISOString(), goalId }, ...prev.tasks]
        }));
        if (!skipFeedback) {
            triggerAIFeedback(`我刚刚手动添加了一个新待办任务：${title}`);
        }
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    };

    const addGoal = (title: string, deadline: string, color?: string, visionId?: string) => {
        setState(prev => ({
            ...prev,
            goals: [{ id: Date.now().toString(), title, deadline, completed: false, color, visionId }, ...prev.goals]
        }));
    };

    const toggleTask = (id: string) => {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;
        const isNowCompleted = !task.completed;

        setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
        }));

        if (isNowCompleted) {
            triggerAIFeedback(`我刚刚完成了任务：${task.title}`);
        }
    };

    const deleteTask = (id: string) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== id)
        }));
    };

    const toggleGoal = (id: string) => {
        const goal = state.goals.find(g => g.id === id);
        if (!goal) return;
        const isNowCompleted = !goal.completed;

        setState(prev => ({
            ...prev,
            goals: prev.goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
        }));

        if (isNowCompleted) {
            triggerAIFeedback(`我刚刚达成了长期目标：${goal.title}`);
        }
    };

    const deleteGoal = (id: string) => {
        setState(prev => ({
            ...prev,
            goals: prev.goals.filter(g => g.id !== id)
        }));
    };

    const updateGoal = (id: string, title: string, deadline: string, color?: string, visionId?: string) => {
        setState(prev => ({
            ...prev,
            goals: prev.goals.map(g => g.id === id ? { ...g, title, deadline, color: color || g.color, visionId } : g)
        }));
    };

    const addVision = (title: string) => {
        setState(prev => ({
            ...prev,
            visions: [{ id: Date.now().toString(), title, createdAt: new Date().toISOString(), archived: false }, ...prev.visions]
        }));
    };

    const updateVision = (id: string, updates: Partial<Vision>) => {
        setState(prev => ({
            ...prev,
            visions: prev.visions.map(v => v.id === id ? { ...v, ...updates } : v)
        }));
    };

    const deleteVision = (id: string) => {
        setState(prev => ({
            ...prev,
            visions: prev.visions.filter(v => v.id !== id),
            goals: prev.goals.map(g => g.visionId === id ? { ...g, visionId: undefined } : g) // Unlink goals
        }));
    };

    const toggleVisionArchived = (id: string) => {
        setState(prev => ({
            ...prev,
            visions: prev.visions.map(v => v.id === id ? { ...v, archived: !v.archived } : v)
        }));
    };

    const startSession = (label: string, taskId?: string) => {
        if (state.activeSessionId) return;
        const newSession: Session = {
            id: Date.now().toString(),
            label,
            startTime: new Date().toISOString(),
            endTime: null,
            durationSeconds: 0,
            taskId
        };
        setState(prev => ({
            ...prev,
            activeSessionId: newSession.id,
            sessions: [newSession, ...prev.sessions]
        }));
        triggerAIFeedback(`我刚刚开始了专注工作：${label}，请给我一些鼓励。`);
    };

    const stopSession = () => {
        if (!state.activeSessionId) return;
        const endTime = new Date();
        let sessionLabel = "";

        const currentSession = state.sessions.find(s => s.id === state.activeSessionId);
        if (currentSession) {
            sessionLabel = currentSession.label;
        }

        setState(prev => {
            const sessionIndex = prev.sessions.findIndex(s => s.id === prev.activeSessionId);
            if (sessionIndex === -1) return prev;

            const updatedSessions = [...prev.sessions];
            const session = updatedSessions[sessionIndex];
            const startTime = new Date(session.startTime);
            const duration = (endTime.getTime() - startTime.getTime()) / 1000;

            updatedSessions[sessionIndex] = {
                ...session,
                endTime: endTime.toISOString(),
                durationSeconds: duration
            };

            return {
                ...prev,
                activeSessionId: null,
                sessions: updatedSessions
            };
        });

        if (sessionLabel) {
            triggerAIFeedback(`我刚刚结束了专注工作：${sessionLabel}`);
        }
    };

    const addManualSession = (label: string, startTime: string, durationSeconds: number, taskId?: string, habitId?: string) => {
        const endTime = new Date(new Date(startTime).getTime() + durationSeconds * 1000).toISOString();
        const newSession: Session = {
            id: Date.now().toString(),
            label,
            startTime,
            endTime,
            durationSeconds,
            taskId,
            habitId,
            type: durationSeconds === 0 ? 'checkin' : 'focus'
        };
        setState(prev => ({
            ...prev,
            sessions: [newSession, ...prev.sessions]
        }));
    };

    const handleCheckIn = (type: 'morning' | 'night' | 'custom', label: string) => {
        // Legacy support or direct call
        const now = new Date().toISOString();
        const newSession: Session = {
            id: Date.now().toString(),
            label,
            startTime: now,
            endTime: now,
            durationSeconds: 0,
            type: 'checkin',
            checkInType: type
        };

        setState(prev => ({
            ...prev,
            sessions: [newSession, ...prev.sessions]
        }));

        if (type === 'morning') {
            triggerAIFeedback(`${label}。`);
        } else if (type === 'night') {
            triggerAIFeedback(`${label}。`);
        } else {
            triggerAIFeedback(`我刚刚打卡了：${label}。`);
        }
    };

    const handleAddHabit = (title: string, color?: string) => {
        const newHabit: Habit = {
            id: Date.now().toString(),
            title,
            color,
            createdAt: new Date().toISOString()
        };
        setState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
    };

    const handleDeleteHabit = (id: string) => {
        setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
    };

    const handleUpdateHabit = (id: string, updates: Partial<Habit>) => {
        setState(prev => ({
            ...prev,
            habits: prev.habits.map(h => h.id === id ? { ...h, ...updates } : h)
        }));
    };

    const handleToggleCheckIn = (habitId: string, date?: string) => {
        const targetDate = date || new Date().toISOString().split('T')[0];
        // Find if checked in today (or target date)
        // We match by habitId primarily.
        const existingSession = state.sessions.find(s =>
            s.habitId === habitId && s.startTime.startsWith(targetDate)
        );

        if (existingSession) {
            // Cancel check-in
            setState(prev => ({
                ...prev,
                sessions: prev.sessions.filter(s => s.id !== existingSession.id)
            }));
            // No AI feedback for cancel
        } else {
            // Check-in
            // If date is provided (backfill), use 00:01. Else use current time.
            let startTime: string;
            if (date) {
                startTime = `${date}T00:01:00`;
            } else {
                startTime = new Date().toISOString();
            }

            const habit = state.habits.find(h => h.id === habitId);
            let label = habit ? habit.title : '打卡';

            // Add emoji for morning/night check-ins
            if (label.includes('早安') && !label.includes('☀️')) {
                label = `☀️ ${label}`;
            } else if (label.includes('晚安') && !label.includes('🌙')) {
                label = `🌙 ${label}`;
            }

            const newSession: Session = {
                id: Date.now().toString(),
                label,
                startTime,
                endTime: startTime,
                durationSeconds: 0,
                type: 'checkin',
                habitId
            };

            setState(prev => ({
                ...prev,
                sessions: [newSession, ...prev.sessions]
            }));

            // Only trigger AI feedback if it's a real-time check-in (no date param)
            if (!date) {
                if (label.includes('早安')) {
                    triggerAIFeedback(`早安打卡！${label}。请给我今天的早安问候和鼓励。`);
                } else if (label.includes('晚安')) {
                    triggerAIFeedback(`晚安打卡！${label}。请给我今天的晚安问候和总结。`);
                } else {
                    triggerAIFeedback(`我刚刚打卡了：${label}。`);
                }
            }
        }
    };

    const updateSession = (id: string, label: string, startTime: string, endTime: string, taskId?: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const duration = (end.getTime() - start.getTime()) / 1000;

        setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(s => s.id === id ? {
                ...s,
                label,
                startTime,
                endTime,
                durationSeconds: duration > 0 ? duration : 0,
                taskId
            } : s)
        }));
    };

    const renameSession = (id: string, newLabel: string) => {
        setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(s => s.id === id ? { ...s, label: newLabel } : s)
        }));
    };

    const deleteSession = (id: string) => {
        setState(prev => ({
            ...prev,
            sessions: prev.sessions.filter(s => s.id !== id)
        }));
    };

    const addReport = (title: string, content: string, date?: string) => {
        const newReport: DailyReport = {
            id: Date.now().toString(),
            date: date || new Date().toISOString(),
            title,
            content
        };
        setState(prev => ({
            ...prev,
            reports: [newReport, ...prev.reports]
        }));
    };

    const updateReport = (id: string, content: string) => {
        setState(prev => ({
            ...prev,
            reports: prev.reports.map(r => r.id === id ? { ...r, content } : r)
        }));
    };

    const deleteReport = (id: string) => {
        setState(prev => ({
            ...prev,
            reports: prev.reports.filter(r => r.id !== id)
        }));
    };

    const updateTheme = (themeKey: string) => {
        setState(prev => ({
            ...prev,
            theme: themeKey
        }));
    };

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

    const saveSettings = () => {
        setState(prev => {
            const updated = {
                ...prev,
                coachSettings: localSettings.coach,
                storageConfig: localSettings.storage
            };
            // Restart chat if persona/model changed
            coachService.startChat(updated);
            // NOTE: Do NOT clear messages here anymore, keeping conversation continuity
            return updated;
        });
        setIsSettingsOpen(false);
    };

    const exportData = () => {
        // Use localSettings for current config, but state for data lists
        const exportState: AppState = {
            ...state,
            coachSettings: localSettings.coach,
            storageConfig: localSettings.storage
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportState));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `lifesync_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        setSyncMessage({ type: 'success', text: "本地备份导出已开始" });
    };

    return (
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
                        {!isChatOpen && (
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
                    <Dashboard
                        tasks={state.tasks}
                        goals={state.goals}
                        visions={state.visions}
                        sessions={state.sessions}
                        reports={state.reports}
                        activeSessionId={state.activeSessionId}
                        theme={currentTheme}

                        // Navigation Props
                        viewingTaskId={viewingTaskId}
                        setViewingTaskId={setViewingTaskId}
                        viewingGoalId={viewingGoalId}
                        setViewingGoalId={setViewingGoalId}
                        viewingVisionId={viewingVisionId}
                        setViewingVisionId={setViewingVisionId}
                        viewingReportId={viewingReportId}
                        setViewingReportId={setViewingReportId}
                        viewingSessionId={viewingSessionId}
                        setViewingSessionId={setViewingSessionId}
                        viewingHabitId={viewingHabitId}
                        setViewingHabitId={setViewingHabitId}

                        onAddTask={addTask}
                        onUpdateTask={updateTask}
                        onToggleTask={toggleTask}
                        onDeleteTask={deleteTask}

                        onAddGoal={(title, deadline, color, visionId) => {
                            addGoal(title, deadline, color, visionId);
                            triggerAIFeedback(`我刚刚手动添加了一个新目标：${title}，截止日期是 ${deadline}`);
                        }}
                        onToggleGoal={toggleGoal}
                        onDeleteGoal={deleteGoal}
                        onUpdateGoal={updateGoal}

                        onAddVision={addVision}
                        onUpdateVision={updateVision}
                        onDeleteVision={deleteVision}
                        onToggleVisionArchived={toggleVisionArchived}

                        onStartSession={startSession}
                        onStopSession={stopSession}
                        onAddSession={addManualSession}
                        onUpdateSession={updateSession}
                        onRenameSession={renameSession}
                        onDeleteSession={deleteSession}

                        habits={state.habits}
                        onAddHabit={handleAddHabit}
                        onUpdateHabit={handleUpdateHabit}
                        onDeleteHabit={handleDeleteHabit}
                        onToggleCheckIn={handleToggleCheckIn}

                        onGenerateReport={generateReportContent}
                        onSaveReport={(title, content) => addReport(title, content, new Date().toISOString())}
                        onUpdateReport={updateReport}
                        onDeleteReport={deleteReport}
                        onCheckIn={handleCheckIn}
                    />
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-float max-h-[90vh] flex flex-col overflow-hidden border border-white/50">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
                                <Settings size={20} className={`text-${currentTheme.primary}-500`} /> 应用设置
                            </h2>
                            <button onClick={() => setIsSettingsOpen(false)}><X className="text-slate-400 hover:text-slate-600" size={24} /></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 shrink-0">
                            <button
                                onClick={() => setSettingsTab('coach')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${settingsTab === 'coach' ? `border-${currentTheme.primary}-600 text-${currentTheme.primary}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="flex items-center justify-center gap-2"><User size={16} /> 教练设置</span>
                            </button>
                            <button
                                onClick={() => setSettingsTab('theme')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${settingsTab === 'theme' ? `border-${currentTheme.primary}-600 text-${currentTheme.primary}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="flex items-center justify-center gap-2"><Palette size={16} /> 风格主题</span>
                            </button>
                            <button
                                onClick={() => setSettingsTab('data')}
                                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${settingsTab === 'data' ? `border-${currentTheme.primary}-600 text-${currentTheme.primary}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="flex items-center justify-center gap-2"><Database size={16} /> API/数据库</span>
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">

                            {/* TAB 1: Coach Settings */}
                            {settingsTab === 'coach' && (
                                <div className="space-y-5">
                                    {/* Names */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">你的称呼</label>
                                            <input
                                                value={localSettings.coach.userName || ''}
                                                onChange={(e) => setLocalSettings(prev => ({ ...prev, coach: { ...prev.coach, userName: e.target.value } }))}
                                                placeholder="例如: 学员, 小明"
                                                className={`w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-${currentTheme.primary}-500 outline-none`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">AI 教练称呼</label>
                                            <input
                                                value={localSettings.coach.name}
                                                onChange={(e) => setLocalSettings(prev => ({ ...prev, coach: { ...prev.coach, name: e.target.value } }))}
                                                className={`w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-${currentTheme.primary}-500 outline-none`}
                                            />
                                        </div>
                                    </div>

                                    {/* Style Dropdown */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">AI 教练风格 (提示词)</label>
                                        <Select
                                            value={localSettings.coach.style}
                                            onChange={handleStyleChange}
                                            options={COACH_STYLES.map(s => ({ label: s.label, value: s.label }))}
                                            theme={currentTheme}
                                        />
                                    </div>

                                    {/* System Instruction */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className={`w-4 h-4 text-${currentTheme.primary}-500`} />
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">系统提示词 (Prompt)</label>
                                        </div>
                                        <textarea
                                            value={localSettings.coach.customInstruction || ''}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, coach: { ...prev.coach, customInstruction: e.target.value } }))}
                                            rows={4}
                                            placeholder="在此输入或修改 AI 的人设提示词..."
                                            className={`w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-${currentTheme.primary}-500 outline-none font-mono leading-relaxed`}
                                        />
                                        <p className="text-xs text-slate-400 mt-2">提示：上方下拉菜单会自动填充此处，你也可以手动修改细节。</p>
                                    </div>

                                    {/* User Context */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">你的背景信息</label>
                                        <textarea
                                            value={localSettings.coach.userContext}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, coach: { ...prev.coach, userContext: e.target.value } }))}
                                            rows={3}
                                            placeholder="告诉教练你的工作、学习或目标..."
                                            className={`w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-${currentTheme.primary}-500 outline-none resize-none shadow-sm`}
                                        />
                                    </div>

                                    {/* Report Prompt */}
                                    <div className="border-t border-slate-100 pt-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className={`w-4 h-4 text-${currentTheme.primary}-500`} />
                                            <label className="block text-sm font-medium text-slate-700">日报生成额外指令</label>
                                        </div>
                                        <textarea
                                            value={localSettings.coach.customReportInstruction || ''}
                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, coach: { ...prev.coach, customReportInstruction: e.target.value } }))}
                                            rows={3}
                                            placeholder="例如：请用全英文生成点评..."
                                            className={`w-full bg-white text-slate-900 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-${currentTheme.primary}-500 outline-none font-mono shadow-sm`}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Theme Settings */}
                            {settingsTab === 'theme' && (
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.keys(THEMES).map((themeKey) => {
                                        const theme = THEMES[themeKey];
                                        const isActive = state.theme === themeKey;
                                        return (
                                            <button
                                                key={themeKey}
                                                onClick={() => updateTheme(themeKey)}
                                                className={`group relative p-4 rounded-xl border transition-all duration-200 overflow-hidden text-left hover:shadow-md ${isActive ? `border-${theme.primary}-500 ring-1 ring-${theme.primary}-500 bg-white` : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                            >
                                                {/* Color Preview */}
                                                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-${theme.primary}-50 to-${theme.secondary}-100 rounded-bl-full opacity-50 transition-opacity group-hover:opacity-80`}></div>

                                                <div className="relative z-10 flex flex-col gap-2">
                                                    <div className={`w-8 h-8 rounded-full bg-${theme.primary}-500 flex items-center justify-center text-white shadow-sm`}>
                                                        {isActive && <Check size={16} strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-medium ${isActive ? `text-${theme.primary}-700` : 'text-slate-700'}`}>{theme.name}</h4>
                                                        <p className="text-xs text-slate-400">优雅柔和 悬浮质感</p>
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* TAB 3: API & Data */}
                            {settingsTab === 'data' && (
                                <div className="space-y-8">
                                    {/* LLM Configuration */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Server className={`w-5 h-5 text-${currentTheme.primary}-600`} />
                                            <h4 className="font-medium text-slate-800">模型服务商配置 (LLM)</h4>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">选择服务商</label>
                                                <select
                                                    value={localSettings.coach.modelConfig?.provider || 'gemini'}
                                                    onChange={(e) => handleProviderPreset(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="gemini">Google Gemini (默认)</option>
                                                    <option value="deepseek">DeepSeek (官方 API)</option>
                                                    <option value="siliconflow">硅基流动 (SiliconFlow)</option>
                                                    <option value="openai">OpenAI (或兼容接口)</option>
                                                </select>
                                            </div>

                                            {/* Gemini Specific Fields */}
                                            {localSettings.coach.modelConfig?.provider === 'gemini' && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                            <Key size={14} /> Custom API Key (可选)
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={localSettings.coach.modelConfig?.apiKey || ''}
                                                            onChange={(e) => setLocalSettings(prev => ({
                                                                ...prev,
                                                                coach: {
                                                                    ...prev.coach,
                                                                    modelConfig: { ...prev.coach.modelConfig, apiKey: e.target.value }
                                                                }
                                                            }))}
                                                            placeholder="留空使用系统默认 Key"
                                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                            <Box size={14} /> Model ID
                                                        </label>
                                                        <input
                                                            value={localSettings.coach.modelConfig?.modelId || 'gemini-2.5-flash'}
                                                            onChange={(e) => setLocalSettings(prev => ({
                                                                ...prev,
                                                                coach: {
                                                                    ...prev.coach,
                                                                    modelConfig: { ...prev.coach.modelConfig, modelId: e.target.value }
                                                                }
                                                            }))}
                                                            placeholder="gemini-2.5-flash"
                                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Generic OpenAI Fields */}
                                            {localSettings.coach.modelConfig?.provider !== 'gemini' && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                            <Key size={14} /> API Key <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="password"
                                                            value={localSettings.coach.modelConfig?.apiKey || ''}
                                                            onChange={(e) => setLocalSettings(prev => ({
                                                                ...prev,
                                                                coach: {
                                                                    ...prev.coach,
                                                                    modelConfig: { ...prev.coach.modelConfig, apiKey: e.target.value }
                                                                }
                                                            }))}
                                                            placeholder="sk-..."
                                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                                <LinkIcon size={14} /> Base URL
                                                            </label>
                                                            <input
                                                                value={localSettings.coach.modelConfig?.baseUrl || ''}
                                                                onChange={(e) => setLocalSettings(prev => ({
                                                                    ...prev,
                                                                    coach: {
                                                                        ...prev.coach,
                                                                        modelConfig: { ...prev.coach.modelConfig, baseUrl: e.target.value }
                                                                    }
                                                                }))}
                                                                placeholder="https://api..."
                                                                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                                                <Box size={14} /> Model ID
                                                            </label>
                                                            <input
                                                                value={localSettings.coach.modelConfig?.modelId || ''}
                                                                onChange={(e) => setLocalSettings(prev => ({
                                                                    ...prev,
                                                                    coach: {
                                                                        ...prev.coach,
                                                                        modelConfig: { ...prev.coach.modelConfig, modelId: e.target.value }
                                                                    }
                                                                }))}
                                                                placeholder="gpt-3.5-turbo"
                                                                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Test Connection Button & Status */}
                                            <div className="pt-2">
                                                <button
                                                    onClick={testConnection}
                                                    disabled={isTestingConnection}
                                                    className={`w-full flex items-center justify-center gap-2 border border-${currentTheme.primary}-200 bg-${currentTheme.primary}-50 text-${currentTheme.primary}-700 hover:bg-${currentTheme.primary}-100 font-medium py-2 rounded-lg transition-colors`}
                                                >
                                                    {isTestingConnection ? <Loader2 className="animate-spin" size={16} /> : <PlugZap size={16} />}
                                                    {isTestingConnection ? "正在测试连接..." : "测试 API 连接"}
                                                </button>

                                                {connectionTestResult && (
                                                    <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${connectionTestResult.type === 'success'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                        }`}>
                                                        {connectionTestResult.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                                        <span>{connectionTestResult.message}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Database Configuration */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className={`w-5 h-5 text-${currentTheme.primary}-600`} />
                                            <h4 className="font-medium text-slate-800">云端数据库配置 (Supabase)</h4>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                            <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                                <button
                                                    onClick={() => setLocalSettings(prev => ({ ...prev, storage: { ...prev.storage, provider: 'local' } }))}
                                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${localSettings.storage.provider === 'local' ? `bg-${currentTheme.primary}-100 text-${currentTheme.primary}-700 shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <HardDrive size={14} className="inline mr-1" /> 本地存储
                                                </button>
                                                <button
                                                    onClick={() => setLocalSettings(prev => ({ ...prev, storage: { ...prev.storage, provider: 'supabase' } }))}
                                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${localSettings.storage.provider === 'supabase' ? `bg-${currentTheme.primary}-100 text-${currentTheme.primary}-700 shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <Cloud size={14} className="inline mr-1" /> Supabase 云端
                                                </button>
                                            </div>

                                            {localSettings.storage.provider === 'supabase' && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">Project URL</label>
                                                        <input
                                                            value={localSettings.storage.supabaseUrl || ''}
                                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, storage: { ...prev.storage, supabaseUrl: e.target.value } }))}
                                                            placeholder="https://xyz.supabase.co"
                                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 mb-1">Anon API Key</label>
                                                        <input
                                                            type="password"
                                                            value={localSettings.storage.supabaseKey || ''}
                                                            onChange={(e) => setLocalSettings(prev => ({ ...prev, storage: { ...prev.storage, supabaseKey: e.target.value } }))}
                                                            placeholder="eyJh..."
                                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                                            <HelpCircle size={12} className="mt-0.5 shrink-0" />
                                                            <span>位置：Project Settings (左下角齿轮) -&gt; API -&gt; Project API Keys -&gt; 复制 <b>anon public</b></span>
                                                        </p>
                                                    </div>

                                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                                        <p className="flex items-center gap-1 font-bold mb-1"><Info size={12} /> 配置说明</p>
                                                        <p>请在 Supabase SQL Editor 中运行以下命令来创建数据表：</p>
                                                        <code className="block bg-white border border-amber-100 p-2 rounded mt-1 select-all font-mono">
                                                            create table {SUPABASE_TABLE} (<br />
                                                            &nbsp;&nbsp;id text primary key,<br />
                                                            &nbsp;&nbsp;data jsonb,<br />
                                                            &nbsp;&nbsp;updated_at timestamp with time zone<br />
                                                            );
                                                            <br /><br />
                                                            -- 关键：允许读写<br />
                                                            alter table {SUPABASE_TABLE} disable row level security;
                                                        </code>
                                                    </div>

                                                    <div className="pt-2">
                                                        <button
                                                            onClick={testStorageConnection}
                                                            disabled={isTestingStorage}
                                                            className={`w-full flex items-center justify-center gap-2 border border-${currentTheme.primary}-200 bg-${currentTheme.primary}-50 text-${currentTheme.primary}-700 hover:bg-${currentTheme.primary}-100 font-medium py-2 rounded-lg transition-colors`}
                                                        >
                                                            {isTestingStorage ? <Loader2 className="animate-spin" size={16} /> : <PlugZap size={16} />}
                                                            {isTestingStorage ? "正在测试连接..." : "测试数据库连接"}
                                                        </button>

                                                        {storageTestResult && (
                                                            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${storageTestResult.type === 'success'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-red-50 text-red-700 border border-red-200'
                                                                }`}>
                                                                {storageTestResult.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                                                <span>{storageTestResult.message}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Sync & Backup Actions */}
                                    <div className="border-t border-slate-200 pt-6 space-y-3">
                                        <h4 className="font-medium text-slate-800">数据同步与备份</h4>

                                        {/* Cloud Sync Buttons */}
                                        {state.storageConfig.provider === 'supabase' && (
                                            <div className="space-y-3 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={syncToCloud}
                                                        disabled={isSyncing}
                                                        className={`flex items-center justify-center gap-2 border border-${currentTheme.primary}-200 bg-white hover:bg-${currentTheme.primary}-50 text-${currentTheme.primary}-700 font-medium py-2.5 rounded-lg transition-colors shadow-sm`}
                                                    >
                                                        <UploadCloud size={18} /> 上传到云端
                                                    </button>
                                                    <button
                                                        onClick={syncFromCloud}
                                                        disabled={isSyncing}
                                                        className={`flex items-center justify-center gap-2 border border-${currentTheme.primary}-200 bg-white hover:bg-${currentTheme.primary}-50 text-${currentTheme.primary}-700 font-medium py-2.5 rounded-lg transition-colors shadow-sm`}
                                                    >
                                                        <DownloadCloud size={18} /> 从云端恢复
                                                    </button>
                                                </div>

                                                {/* Sync Feedback Message */}
                                                {syncMessage && (
                                                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${syncMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        syncMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                            'bg-blue-50 text-blue-700 border border-blue-200'
                                                        }`}>
                                                        {syncMessage.type === 'info' && <Loader2 className="animate-spin" size={16} />}
                                                        {syncMessage.type === 'success' && <Check size={16} />}
                                                        {syncMessage.type === 'error' && <AlertCircle size={16} />}
                                                        <span>{syncMessage.text}</span>
                                                    </div>
                                                )}

                                                {/* Restoration Confirmation Card */}
                                                {pendingCloudData && (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-top-2">
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                                            <div>
                                                                <h5 className="font-bold text-amber-800">
                                                                    {restoreSource === 'cloud' ? '确认从云端恢复？' : '确认导入本地备份？'}
                                                                </h5>
                                                                <p className="text-sm text-amber-700 mt-1">
                                                                    备份数据包含 {pendingCloudData.tasks.length} 个任务，{pendingCloudData.goals.length} 个目标。
                                                                    <br />
                                                                    <span className="font-bold">警告：此操作将覆盖当前本地的所有数据。</span>
                                                                </p>
                                                                <div className="flex gap-3 mt-3">
                                                                    <button
                                                                        onClick={cancelRestore}
                                                                        className="px-3 py-1.5 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium"
                                                                    >
                                                                        取消
                                                                    </button>
                                                                    <button
                                                                        onClick={confirmRestore}
                                                                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium shadow-sm"
                                                                    >
                                                                        确认覆盖
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={exportData}
                                                className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-colors"
                                            >
                                                <Download size={18} /> 导出备份
                                            </button>
                                            <button
                                                onClick={handleImportClick}
                                                className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-colors"
                                            >
                                                <FileJson size={18} /> 导入备份
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={importData}
                                                accept=".json"
                                                className="hidden"
                                            />
                                        </div>

                                        {/* Local Import Confirmation Card (When Supabase is NOT enabled) */}
                                        {pendingCloudData && state.storageConfig.provider === 'local' && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                                    <div>
                                                        <h5 className="font-bold text-amber-800">确认导入本地备份？</h5>
                                                        <p className="text-sm text-amber-700 mt-1">
                                                            备份数据包含 {pendingCloudData.tasks.length} 个任务，{pendingCloudData.goals.length} 个目标。
                                                            <br />
                                                            <span className="font-bold">警告：此操作将覆盖当前本地的所有数据。</span>
                                                        </p>
                                                        <div className="flex gap-3 mt-3">
                                                            <button
                                                                onClick={cancelRestore}
                                                                className="px-3 py-1.5 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium"
                                                            >
                                                                取消
                                                            </button>
                                                            <button
                                                                onClick={confirmRestore}
                                                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium shadow-sm"
                                                            >
                                                                确认覆盖
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer Buttons */}
                        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                            {settingsTab === 'coach' || settingsTab === 'data' ? (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={saveSettings}
                                        className={`flex-1 px-4 py-2 bg-${currentTheme.primary}-600 text-white rounded-lg hover:bg-${currentTheme.primary}-700 shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2`}
                                    >
                                        <Save size={18} /> 保存设置
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                    >
                                        关闭
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default App;
