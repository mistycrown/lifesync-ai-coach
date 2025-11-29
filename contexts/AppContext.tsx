import React, { createContext, useContext } from 'react';
import { AppState, ThemeConfig, Task, Goal, Vision, Session, Habit, DailyReport, ChatMessage } from '../types';

export interface AppContextType {
    state: AppState;
    theme: ThemeConfig;
    messages: ChatMessage[];
    isLoading: boolean;

    // Navigation State
    viewingTaskId: string | null;
    setViewingTaskId: (id: string | null) => void;
    viewingGoalId: string | null;
    setViewingGoalId: (id: string | null) => void;
    viewingVisionId: string | null;
    setViewingVisionId: (id: string | null) => void;
    viewingReportId: string | null;
    setViewingReportId: (id: string | null) => void;
    viewingSessionId: string | null;
    setViewingSessionId: (id: string | null) => void;
    viewingHabitId: string | null;
    setViewingHabitId: (id: string | null) => void;

    // Settings & UI State
    localSettings: any; // Using any for now to avoid circular deps or complex imports, ideally { coach: CoachSettings, storage: StorageConfig }
    setLocalSettings: React.Dispatch<React.SetStateAction<any>>;
    settingsTab: 'coach' | 'theme' | 'data';
    setSettingsTab: (tab: 'coach' | 'theme' | 'data') => void;

    isTestingConnection: boolean;
    connectionTestResult: { type: 'success' | 'error', message: string } | null;

    isTestingStorage: boolean;
    storageTestResult: { type: 'success' | 'error', message: string } | null;

    isSyncing: boolean;
    syncMessage: { type: 'success' | 'error' | 'info', text: string } | null;

    pendingCloudData: AppState | null;
    restoreSource: 'cloud' | 'local';

    fileInputRef: React.RefObject<HTMLInputElement>;

    // Actions
    actions: {
        toggleTask: (id: string) => void;
        deleteTask: (id: string) => void;
        addTask: (title: string, goalId?: string) => void;
        updateTask: (id: string, updates: Partial<Task>) => void;

        addGoal: (title: string, deadline: string, color?: string, visionId?: string) => void;
        toggleGoal: (id: string) => void;
        deleteGoal: (id: string) => void;
        updateGoal: (id: string, title: string, deadline: string, color?: string, visionId?: string) => void;

        addVision: (title: string) => void;
        updateVision: (id: string, updates: Partial<Vision>) => void;
        deleteVision: (id: string) => void;
        toggleVisionArchived: (id: string) => void;

        startSession: (label: string, taskId?: string) => void;
        stopSession: () => void;
        addSession: (label: string, startTime: string, durationSeconds: number, taskId?: string, habitId?: string) => void;
        updateSession: (id: string, label: string, startTime: string, endTime: string, taskId?: string) => void;
        renameSession: (id: string, newLabel: string) => void;
        deleteSession: (id: string) => void;
        checkIn: (type: 'morning' | 'night' | 'custom', label: string) => void;

        addHabit: (title: string, color?: string) => void;
        updateHabit: (id: string, updates: Partial<Habit>) => void;
        deleteHabit: (id: string) => void;
        toggleCheckIn: (habitId: string, date?: string) => void;

        generateReport: (date?: string) => Promise<{ title: string, content: string }>;
        saveReport: (title: string, content: string, date?: string) => void;
        updateReport: (id: string, content: string) => void;
        deleteReport: (id: string) => void;

        // Chat Actions
        sendMessage: (text: string) => void;
        createNewChat: () => void;
        selectChat: (id: string) => void;
        deleteChat: (id: string) => void;

        // Settings & Data Actions
        saveSettings: () => void;
        cancelSettings: () => void;
        updateTheme: (themeKey: string) => void;
        testConnection: () => void;
        testStorageConnection: () => void;
        syncToCloud: (isAuto: boolean) => void;
        syncFromCloud: () => void;
        confirmRestore: () => void;
        cancelRestore: () => void;
        exportData: () => void;
        importData: (e: React.ChangeEvent<HTMLInputElement>) => void;
        handleImportClick: () => void;
    };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ value: AppContextType; children: React.ReactNode }> = ({ value, children }) => {
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
