import { useEffect } from 'react';
import { AppState } from '../types';

/**
 * 数据持久化 Hook
 * 负责将应用状态自动保存到 localStorage
 * 
 * @param state - 应用状态
 * @param storageKey - localStorage 键名
 */
export const useDataPersistence = (
    state: AppState,
    storageKey: string = 'lifesync-state-v5'
) => {
    // 自动保存到 localStorage
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save state to localStorage:', error);
        }
    }, [state, storageKey]);

    // 从 localStorage 加载数据（静态方法）
    const loadFromStorage = (defaultState: AppState): AppState => {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return defaultState;

        try {
            const parsed = JSON.parse(saved);

            // 深度合并，确保新字段存在
            const merged = { ...defaultState, ...parsed };

            // 合并嵌套对象
            merged.coachSettings = {
                ...defaultState.coachSettings,
                ...parsed.coachSettings
            };

            if (parsed.coachSettings?.modelConfig) {
                merged.coachSettings.modelConfig = {
                    ...defaultState.coachSettings.modelConfig,
                    ...parsed.coachSettings.modelConfig
                };
            }

            if (parsed.storageConfig) {
                merged.storageConfig = {
                    ...defaultState.storageConfig,
                    ...parsed.storageConfig
                };
            }

            // 确保必要字段存在
            if (!merged.habits) merged.habits = defaultState.habits;

            if (!merged.chatSessions ||
                !Array.isArray(merged.chatSessions) ||
                merged.chatSessions.length === 0) {
                merged.chatSessions = defaultState.chatSessions;
                merged.currentChatId = defaultState.currentChatId;
            }

            return merged;
        } catch (error) {
            console.error('Failed to load state from localStorage:', error);
            return defaultState;
        }
    };

    return { loadFromStorage };
};

/**
 * 加载初始状态的辅助函数
 * 可以在组件外部使用
 */
export const loadInitialState = (
    defaultState: AppState,
    storageKey: string = 'lifesync-state-v5'
): AppState => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaultState;

    try {
        const parsed = JSON.parse(saved);

        // 深度合并逻辑（与上面相同）
        const merged = { ...defaultState, ...parsed };

        merged.coachSettings = {
            ...defaultState.coachSettings,
            ...parsed.coachSettings
        };

        if (parsed.coachSettings?.modelConfig) {
            merged.coachSettings.modelConfig = {
                ...defaultState.coachSettings.modelConfig,
                ...parsed.coachSettings.modelConfig
            };
        }

        if (parsed.storageConfig) {
            merged.storageConfig = {
                ...defaultState.storageConfig,
                ...parsed.storageConfig
            };
        }

        if (!merged.habits) merged.habits = defaultState.habits;

        if (!merged.chatSessions ||
            !Array.isArray(merged.chatSessions) ||
            merged.chatSessions.length === 0) {
            merged.chatSessions = defaultState.chatSessions;
            merged.currentChatId = defaultState.currentChatId;
        }

        return merged;
    } catch (error) {
        console.error('Failed to load initial state:', error);
        return defaultState;
    }
};
