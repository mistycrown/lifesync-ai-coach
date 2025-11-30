import { useCallback } from 'react';
import { Goal, AppState } from '../types';

interface UseGoalManagementProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    triggerAIFeedback?: (text: string) => void;
}

interface UseGoalManagementReturn {
    addGoal: (title: string, deadline: string, color?: string, visionId?: string) => void;
    updateGoal: (id: string, title: string, deadline: string, color?: string, visionId?: string) => void;
    toggleGoal: (id: string) => void;
    deleteGoal: (id: string) => void;
}

/**
 * 目标管理 Hook
 * 负责目标的增删改查操作
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 * @param triggerAIFeedback - AI 反馈函数（可选）
 */
export const useGoalManagement = ({
    state,
    setState,
    triggerAIFeedback
}: UseGoalManagementProps): UseGoalManagementReturn => {

    /**
     * 添加新目标
     */
    const addGoal = useCallback((
        title: string,
        deadline: string,
        color?: string,
        visionId?: string
    ) => {
        const newGoal: Goal = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title,
            deadline,
            completed: false,
            color,
            visionId
        };

        setState(prev => ({
            ...prev,
            goals: [newGoal, ...prev.goals]
        }));
    }, [setState]);

    /**
     * 更新目标
     */
    const updateGoal = useCallback((
        id: string,
        title: string,
        deadline: string,
        color?: string,
        visionId?: string
    ) => {
        setState(prev => ({
            ...prev,
            goals: prev.goals.map(g =>
                g.id === id
                    ? { ...g, title, deadline, color: color || g.color, visionId }
                    : g
            )
        }));
    }, [setState]);

    /**
     * 切换目标完成状态
     */
    const toggleGoal = useCallback((id: string) => {
        const goal = state.goals.find(g => g.id === id);
        if (!goal) return;

        const isNowCompleted = !goal.completed;

        setState(prev => ({
            ...prev,
            goals: prev.goals.map(g =>
                g.id === id ? { ...g, completed: !g.completed } : g
            )
        }));

        // 完成目标时触发 AI 反馈
        if (isNowCompleted && triggerAIFeedback) {
            triggerAIFeedback(`我刚刚达成了长期目标：${goal.title}`);
        }
    }, [state.goals, setState, triggerAIFeedback]);

    /**
     * 删除目标
     */
    const deleteGoal = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            goals: prev.goals.filter(g => g.id !== id)
        }));
    }, [setState]);

    return {
        addGoal,
        updateGoal,
        toggleGoal,
        deleteGoal
    };
};
