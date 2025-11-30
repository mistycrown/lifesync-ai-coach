import { useCallback } from 'react';
import { Vision, AppState } from '../types';

interface UseVisionManagementProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
}

interface UseVisionManagementReturn {
    addVision: (title: string) => void;
    updateVision: (id: string, updates: Partial<Vision>) => void;
    deleteVision: (id: string) => void;
    toggleVisionArchived: (id: string) => void;
}

/**
 * 愿景管理 Hook
 * 负责长期愿景的增删改查操作
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 */
export const useVisionManagement = ({
    state,
    setState
}: UseVisionManagementProps): UseVisionManagementReturn => {

    /**
     * 添加新愿景
     */
    const addVision = useCallback((title: string) => {
        const newVision: Vision = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title,
            createdAt: new Date().toISOString(),
            archived: false
        };

        setState(prev => ({
            ...prev,
            visions: [newVision, ...prev.visions]
        }));
    }, [setState]);

    /**
     * 更新愿景
     */
    const updateVision = useCallback((id: string, updates: Partial<Vision>) => {
        setState(prev => ({
            ...prev,
            visions: prev.visions.map(v =>
                v.id === id ? { ...v, ...updates } : v
            )
        }));
    }, [setState]);

    /**
     * 删除愿景
     * 注意：会自动解除关联目标的链接
     */
    const deleteVision = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            visions: prev.visions.filter(v => v.id !== id),
            // 解除关联目标的 visionId
            goals: prev.goals.map(g =>
                g.visionId === id ? { ...g, visionId: undefined } : g
            )
        }));
    }, [setState]);

    /**
     * 切换愿景归档状态
     */
    const toggleVisionArchived = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            visions: prev.visions.map(v =>
                v.id === id ? { ...v, archived: !v.archived } : v
            )
        }));
    }, [setState]);

    return {
        addVision,
        updateVision,
        deleteVision,
        toggleVisionArchived
    };
};
