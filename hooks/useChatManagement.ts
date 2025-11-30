import { useState, useCallback } from 'react';
import { ChatMessage, ChatSessionData, AppState } from '../types';
import { CoachService } from '../services/geminiService';

interface UseChatManagementReturn {
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    updateChatSession: (chatId: string, newMessages: ChatMessage[]) => void;
    createNewChat: () => void;
    selectChat: (id: string) => void;
    deleteChat: (id: string) => void;
}

/**
 * 聊天会话管理 Hook
 * 负责管理聊天会话的创建、切换、删除和消息更新
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 * @param coachService - AI 服务实例
 * @returns 聊天管理相关的函数和状态
 */
export const useChatManagement = (
    state: AppState,
    setState: React.Dispatch<React.SetStateAction<AppState>>,
    coachService: CoachService
): UseChatManagementReturn => {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (state.currentChatId) {
            const session = state.chatSessions.find(s => s.id === state.currentChatId);
            return session?.messages || [];
        }
        return [];
    });

    /**
     * 更新指定聊天会话的消息
     */
    const updateChatSession = useCallback((chatId: string, newMessages: ChatMessage[]) => {
        setState(prev => {
            const sessions = [...prev.chatSessions];
            const idx = sessions.findIndex(s => s.id === chatId);

            if (idx !== -1) {
                const updatedSession = {
                    ...sessions[idx],
                    messages: newMessages,
                    updatedAt: new Date().toISOString()
                };

                // 根据第一条用户消息生成标题
                if (updatedSession.title === "新对话" && newMessages.length > 0 && newMessages[0].role === 'user') {
                    const firstMessage = newMessages[0].text;
                    updatedSession.title = firstMessage.substring(0, 15) +
                        (firstMessage.length > 15 ? "..." : "");
                }

                sessions[idx] = updatedSession;
            }

            return { ...prev, chatSessions: sessions };
        });
    }, [setState]);

    /**
     * 创建新的聊天会话
     */
    const createNewChat = useCallback(() => {
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
    }, [setState]);

    /**
     * 切换到指定的聊天会话
     */
    const selectChat = useCallback((id: string) => {
        const session = state.chatSessions.find(s => s.id === id);

        if (session) {
            setState(prev => ({ ...prev, currentChatId: id }));
            setMessages(session.messages);

            // 根据上下文启用状态加载历史
            const historyToLoad = state.coachSettings.enableContext
                ? session.messages
                : [];
            coachService.startChat(state, historyToLoad);
        }
    }, [state, setState, coachService]);

    /**
     * 删除指定的聊天会话
     */
    const deleteChat = useCallback((id: string) => {
        // 至少保留一个会话
        if (state.chatSessions.length <= 1) {
            setMessages([]);
            // 创建新的空会话
            const newId = Date.now().toString();
            const newSession: ChatSessionData = {
                id: newId,
                title: "新对话",
                messages: [],
                updatedAt: new Date().toISOString()
            };
            setState(prev => ({
                ...prev,
                chatSessions: [newSession],
                currentChatId: newId
            }));
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
    }, [state, setState]);

    return {
        messages,
        setMessages,
        updateChatSession,
        createNewChat,
        selectChat,
        deleteChat
    };
};
