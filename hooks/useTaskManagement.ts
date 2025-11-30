import { useCallback } from 'react';
import { Task, AppState } from '../types';

interface UseTaskManagementProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    triggerAIFeedback?: (text: string) => void;
}

interface UseTaskManagementReturn {
    addTask: (title: string, goalId?: string, skipFeedback?: boolean) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
}

/**
 * 任务管理 Hook
 * 负责任务的增删改查操作
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 * @param triggerAIFeedback - AI 反馈函数（可选）
 */
export const useTaskManagement = ({
    state,
    setState,
    triggerAIFeedback
}: UseTaskManagementProps): UseTaskManagementReturn => {

    /**
     * 添加新任务
     */
    const addTask = useCallback((
        title: string,
        goalId?: string,
        skipFeedback = false
    ) => {
        const newTask: Task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title,
            completed: false,
            createdAt: new Date().toISOString(),
            goalId
        };

        setState(prev => ({
            ...prev,
            tasks: [newTask, ...prev.tasks]
        }));

        // 触发 AI 反馈（如果需要）
        if (!skipFeedback && triggerAIFeedback) {
            triggerAIFeedback(`我刚刚手动添加了一个新待办任务：${title}`);
        }
    }, [setState, triggerAIFeedback]);

    /**
     * 更新任务
     */
    const updateTask = useCallback((id: string, updates: Partial<Task>) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(t =>
                t.id === id ? { ...t, ...updates } : t
            )
        }));
    }, [setState]);

    /**
     * 切换任务完成状态
     */
    const toggleTask = useCallback((id: string) => {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;

        const isNowCompleted = !task.completed;

        setState(prev => ({
            ...prev,
            tasks: prev.tasks.map(t =>
                t.id === id ? { ...t, completed: !t.completed } : t
            )
        }));

        // 完成任务时触发 AI 反馈
        if (isNowCompleted && triggerAIFeedback) {
            triggerAIFeedback(`我刚刚完成了任务：${task.title}`);
        }
    }, [state.tasks, setState, triggerAIFeedback]);

    /**
     * 删除任务
     */
    const deleteTask = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== id)
        }));
    }, [setState]);

    return {
        addTask,
        updateTask,
        toggleTask,
        deleteTask
    };
};
