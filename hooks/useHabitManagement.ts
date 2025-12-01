import { useCallback } from 'react';
import { Habit, Session, AppState } from '../types';

interface UseHabitManagementProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    triggerAIFeedback?: (text: string) => void;
}

interface UseHabitManagementReturn {
    addHabit: (title: string, color?: string) => void;
    updateHabit: (id: string, updates: Partial<Habit>) => void;
    deleteHabit: (id: string) => void;
    toggleCheckIn: (habitId: string, date?: string) => void;
    handleCheckIn: (type: 'morning' | 'night' | 'custom', label: string) => void;
}

/**
 * 习惯管理 Hook
 * 负责习惯的增删改查和打卡操作
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 * @param triggerAIFeedback - AI 反馈函数（可选）
 */
export const useHabitManagement = ({
    state,
    setState,
    triggerAIFeedback
}: UseHabitManagementProps): UseHabitManagementReturn => {

    /**
     * 添加新习惯
     */
    const addHabit = useCallback((title: string, color?: string) => {
        const newHabit: Habit = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title,
            color,
            createdAt: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            habits: [...prev.habits, newHabit]
        }));
    }, [setState]);

    /**
     * 更新习惯
     */
    const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
        setState(prev => ({
            ...prev,
            habits: prev.habits.map(h =>
                h.id === id ? { ...h, ...updates } : h
            )
        }));
    }, [setState]);

    /**
     * 删除习惯
     */
    const deleteHabit = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            habits: prev.habits.filter(h => h.id !== id)
        }));
    }, [setState]);

    /**
     * 切换打卡状态
     * 如果已打卡则取消，未打卡则添加
     */
    const toggleCheckIn = useCallback((habitId: string, date?: string) => {
        const targetDate = date || new Date().toISOString().split('T')[0];

        // 查找是否已打卡
        const existingSession = state.sessions.find(s =>
            s.habitId === habitId && s.startTime.startsWith(targetDate)
        );

        if (existingSession) {
            // 取消打卡
            setState(prev => ({
                ...prev,
                sessions: prev.sessions.filter(s => s.id !== existingSession.id)
            }));
        } else {
            // 添加打卡
            // 如果指定日期（补卡），使用 00:01；否则使用当前时间
            const startTime = date
                ? `${date}T00:01:00`
                : new Date().toISOString();

            const habit = state.habits.find(h => h.id === habitId);
            let label = habit ? habit.title : '打卡';

            // 为早晚安打卡添加 emoji
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

            // 仅实时打卡（无 date 参数）时触发 AI 反馈
            if (!date && triggerAIFeedback) {
                const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                if (label.includes('早安')) {
                    triggerAIFeedback(`早安打卡！${label}。现在时间是 ${nowTime}。请给我今天的早安问候和鼓励。`);
                } else if (label.includes('晚安')) {
                    triggerAIFeedback(`晚安打卡！${label}。现在时间是 ${nowTime}。请给我今天的晚安问候和总结。`);
                } else {
                    triggerAIFeedback(`我刚刚打卡了：${label}。现在时间是 ${nowTime}。`);
                }
            }
        }
    }, [state.sessions, state.habits, setState, triggerAIFeedback]);

    /**
     * 处理签到（遗留接口，保持向后兼容）
     */
    const handleCheckIn = useCallback((
        type: 'morning' | 'night' | 'custom',
        label: string
    ) => {
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

        // 触发 AI 反馈
        if (triggerAIFeedback) {
            const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            if (type === 'morning' || type === 'night') {
                triggerAIFeedback(`${label}。现在时间是 ${nowTime}。`);
            } else {
                triggerAIFeedback(`我刚刚打卡了：${label}。现在时间是 ${nowTime}。`);
            }
        }
    }, [setState, triggerAIFeedback]);

    return {
        addHabit,
        updateHabit,
        deleteHabit,
        toggleCheckIn,
        handleCheckIn
    };
};
