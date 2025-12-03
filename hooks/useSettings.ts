import { useState, useCallback, useRef } from 'react';
import { AppState, CoachSettings, StorageConfig } from '../types';
import { CoachService } from '../services/geminiService';

interface UseSettingsProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    coachService: CoachService;
    onImportResult?: (success: boolean, message: string) => void;
}

interface UseSettingsReturn {
    localSettings: { coach: CoachSettings; storage: StorageConfig };
    setLocalSettings: React.Dispatch<React.SetStateAction<{ coach: CoachSettings; storage: StorageConfig }>>;
    isTestingConnection: boolean;
    connectionTestResult: { type: 'success' | 'error'; message: string } | null;
    fileInputRef: React.RefObject<HTMLInputElement>;

    testConnection: () => Promise<void>;
    updateTheme: (themeKey: string) => void;
    saveSettings: () => void;
    exportData: () => void;
    importData: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleImportClick: () => void;
}

/**
 * 设置管理 Hook
 * 负责应用设置的管理，包括 AI 配置、主题、数据导入导出等
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 * @param coachService - AI 服务实例
 * @param onImportResult - 导入结果回调（可选）
 */
export const useSettings = ({
    state,
    setState,
    coachService,
    onImportResult
}: UseSettingsProps): UseSettingsReturn => {

    const [localSettings, setLocalSettings] = useState<{
        coach: CoachSettings;
        storage: StorageConfig;
    }>({
        coach: {
            ...state.coachSettings,
            // Migration: If style is Custom and userCustomPrompt is missing, use customInstruction
            userCustomPrompt: state.coachSettings.userCustomPrompt ??
                (state.coachSettings.style === '自定义 (完全自由发挥)'
                    ? state.coachSettings.customInstruction
                    : '')
        },
        storage: state.storageConfig
    });

    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionTestResult, setConnectionTestResult] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * 测试 AI 连接
     */
    const testConnection = useCallback(async () => {
        setIsTestingConnection(true);
        setConnectionTestResult(null);

        try {
            await coachService.testConnection(localSettings.coach.modelConfig);
            setConnectionTestResult({
                type: 'success',
                message: "API 连接成功！模型响应正常。"
            });
        } catch (error: any) {
            setConnectionTestResult({
                type: 'error',
                message: "连接失败: " + (error.message || "未知错误")
            });
        } finally {
            setIsTestingConnection(false);
        }
    }, [localSettings.coach.modelConfig, coachService]);

    /**
     * 更新主题
     */
    const updateTheme = useCallback((themeKey: string) => {
        setState(prev => ({
            ...prev,
            theme: themeKey
        }));
    }, [setState]);

    /**
     * 保存设置
     */
    const saveSettings = useCallback(() => {
        setState(prev => ({
            ...prev,
            coachSettings: localSettings.coach,
            storageConfig: localSettings.storage
        }));

        // 重新初始化 AI 服务
        coachService.startChat(state, []);
    }, [localSettings, setState, coachService, state]);

    /**
     * 导出数据
     */
    const exportData = useCallback(() => {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lifesync-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [state]);

    /**
     * 导入数据
     * 不再使用 alert，通过回调通知结果
     */
    const importData = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedState = JSON.parse(event.target?.result as string);
                setState(importedState);

                // 使用回调通知成功
                if (onImportResult) {
                    onImportResult(true, '数据导入成功！');
                }
            } catch (error) {
                // 使用回调通知失败
                if (onImportResult) {
                    onImportResult(false, '导入失败：文件格式不正确');
                }
            }
        };
        reader.readAsText(file);

        // 重置输入，允许再次选择同一文件
        e.target.value = '';
    }, [setState, onImportResult]);

    /**
     * 触发文件选择
     */
    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return {
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
    };
};
