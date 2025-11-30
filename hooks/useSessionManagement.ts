import { useCallback } from 'react';
import { Session, AppState } from '../types';

interface UseSessionManagementProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    triggerAIFeedback?: (text: string) => void;
}

interface UseSessionManagementReturn {
    startSession: (label: string, taskId?: string) => void;
    stopSession: () => void;
    addManualSession: (
        label: string,
        startTime: string,
        durationSeconds: number,
        taskId?: string,
        habitId?: string
    ) => void;
    updateSession: (
        id: string,
        label: string,
        startTime: string,
        endTime: string,
        taskId?: string
    ) => void;
    renameSession: (id: string, newLabel: string) => void;
    deleteSession: (id: string) => void;
}

/**
 * 专注会话管理 Hook
 * 负责专注计时和会话记录的管理
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 * @param triggerAIFeedback - AI 反馈函数（可选）
 */
export const useSessionManagement = ({
    state,
    setState,
    triggerAIFeedback
}: UseSessionManagementProps): UseSessionManagementReturn => {

    /**
     * 开始专注会话
     */
    const startSession = useCallback((label: string, taskId?: string) => {
        // 如果已有活跃会话，不允许开始新的
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

        // 触发 AI 鼓励
        if (triggerAIFeedback) {
            triggerAIFeedback(`我刚刚开始了专注工作：${label}，请给我一些鼓励。`);
        }
    }, [state.activeSessionId, setState, triggerAIFeedback]);

    /**
     * 停止专注会话
     */
    const stopSession = useCallback(() => {
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

        // 触发 AI 反馈
        if (sessionLabel && triggerAIFeedback) {
            triggerAIFeedback(`我刚刚结束了专注工作：${sessionLabel}`);
        }
    }, [state.activeSessionId, state.sessions, setState, triggerAIFeedback]);

    /**
     * 手动添加专注记录
     */
    const addManualSession = useCallback((
        label: string,
        startTime: string,
        durationSeconds: number,
        taskId?: string,
        habitId?: string
    ) => {
        const endTime = new Date(
            new Date(startTime).getTime() + durationSeconds * 1000
        ).toISOString();

        const newSession: Session = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
    }, [setState]);

    /**
     * 更新专注记录
     */
    const updateSession = useCallback((
        id: string,
        label: string,
        startTime: string,
        endTime: string,
        taskId?: string
    ) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationSeconds = Math.max(0, (end.getTime() - start.getTime()) / 1000);

        setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(s =>
                s.id === id
                    ? { ...s, label, startTime, endTime, durationSeconds, taskId }
                    : s
            )
        }));
    }, [setState]);

    /**
     * 重命名专注记录
     */
    const renameSession = useCallback((id: string, newLabel: string) => {
        setState(prev => ({
            ...prev,
            sessions: prev.sessions.map(s =>
                s.id === id ? { ...s, label: newLabel } : s
            )
        }));
    }, [setState]);

    /**
     * 删除专注记录
     */
    const deleteSession = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            sessions: prev.sessions.filter(s => s.id !== id),
            // 如果删除的是活跃会话，清除活跃状态
            activeSessionId: prev.activeSessionId === id ? null : prev.activeSessionId
        }));
    }, [setState]);

    return {
        startSession,
        stopSession,
        addManualSession,
        updateSession,
        renameSession,
        deleteSession
    };
};
