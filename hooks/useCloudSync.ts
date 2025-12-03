import { useState, useCallback, useRef, useEffect } from 'react';
import { AppState, StorageConfig } from '../types';
import { StorageService } from '../services/storageService';

interface UseCloudSyncProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    localSettings: { coach: any; storage: StorageConfig };
    setLocalSettings: React.Dispatch<React.SetStateAction<{ coach: any; storage: StorageConfig }>>;
}

interface UseCloudSyncReturn {
    isSyncing: boolean;
    syncMessage: { type: 'success' | 'error' | 'info'; text: string } | null;
    pendingCloudData: AppState | null;
    restoreSource: 'cloud' | 'local';
    isTestingStorage: boolean;
    storageTestResult: { type: 'success' | 'error'; message: string } | null;

    syncToCloud: (isAuto?: boolean) => Promise<void>;
    syncFromCloud: () => Promise<void>;
    testStorageConnection: () => Promise<void>;
    confirmRestore: () => void;
    cancelRestore: () => void;
    setSyncMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error' | 'info'; text: string } | null>>;
    setPendingCloudData: React.Dispatch<React.SetStateAction<AppState | null>>;
}

/**
 * 云端同步管理 Hook
 * 负责与 Supabase 云端数据库的同步操作
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 * @param localSettings - 本地设置（用于设置界面）
 * @param setLocalSettings - 更新本地设置
 */
export const useCloudSync = ({
    state,
    setState,
    localSettings,
    setLocalSettings
}: UseCloudSyncProps): UseCloudSyncReturn => {

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [pendingCloudData, setPendingCloudData] = useState<AppState | null>(null);
    const [restoreSource, setRestoreSource] = useState<'cloud' | 'local'>('cloud');
    const [isTestingStorage, setIsTestingStorage] = useState(false);
    const [storageTestResult, setStorageTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // 追踪上次同步状态，优化同步频率
    const lastSyncRef = useRef<{
        chatCount: number;
        reportCount: number;
        currentChatId: string | null;
    }>({ chatCount: 0, reportCount: 0, currentChatId: null });

    // 追踪是否已执行初始拉取
    const hasInitialFetchRun = useRef(false);

    /**
     * 测试云端存储连接
     */
    const testStorageConnection = useCallback(async () => {
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
    }, [localSettings.storage]);

    /**
     * 同步到云端
     */
    const syncToCloud = useCallback(async (isAuto = false) => {
        // 自动同步使用应用状态中的配置，手动同步使用设置界面的配置
        const config = isAuto ? state.storageConfig : localSettings.storage;

        if (!config.supabaseUrl || !config.supabaseKey) {
            if (!isAuto) {
                setSyncMessage({ type: 'error', text: "请先配置并填写 Supabase URL 和 Key" });
            }
            return;
        }

        // 判断是否需要同步归档数据（较大）
        const currentChatCount = state.chatSessions.length;
        const currentReportCount = state.reports.length;
        const currentChatId = state.currentChatId;

        const hasArchiveChanged =
            currentChatCount !== lastSyncRef.current.chatCount ||
            currentReportCount !== lastSyncRef.current.reportCount ||
            currentChatId !== lastSyncRef.current.currentChatId;

        // 自动同步且仅核心数据变化时，跳过归档上传
        const onlyCore = isAuto && !hasArchiveChanged;

        // 上传时嵌入最新的存储配置
        const stateToUpload = { ...state, storageConfig: config };

        if (!isAuto) {
            setIsSyncing(true);
            setSyncMessage({
                type: 'info',
                text: onlyCore ? "正在同步核心数据..." : "正在全量同步..."
            });
        }

        try {
            await StorageService.uploadData(config, stateToUpload, onlyCore);

            // 更新同步记录
            lastSyncRef.current = {
                chatCount: currentChatCount,
                reportCount: currentReportCount,
                currentChatId: currentChatId
            };

            if (!isAuto) {
                setSyncMessage({ type: 'success', text: "上传成功！数据已安全存储。" });
            } else {
                console.log(`Auto-sync success (${onlyCore ? 'Core Only' : 'Full'})`);
            }
        } catch (error: any) {
            console.error("Sync failed:", error);
            if (!isAuto) {
                setSyncMessage({ type: 'error', text: "上传失败: " + error.message });
            }
        } finally {
            if (!isAuto) {
                setIsSyncing(false);
            }
        }
    }, [state, localSettings.storage]);

    /**
     * 从云端同步
     */
    const syncFromCloud = useCallback(async (isAuto = false) => {
        // 自动同步使用应用状态中的配置
        const config = isAuto ? state.storageConfig : localSettings.storage;

        if (!config.supabaseUrl || !config.supabaseKey) {
            if (!isAuto) {
                setSyncMessage({ type: 'error', text: "请先配置并填写 Supabase URL 和 Key" });
            }
            return;
        }

        setIsSyncing(true);
        if (!isAuto) {
            setSyncMessage({ type: 'info', text: "正在从云端下载..." });
        }

        try {
            const cloudState = await StorageService.downloadData(config);

            if (cloudState) {
                setPendingCloudData(cloudState);
                setRestoreSource('cloud');
                setSyncMessage(null); // 清除加载消息，显示确认卡片
            } else {
                if (!isAuto) {
                    setSyncMessage({ type: 'error', text: "云端没有找到备份数据" });
                }
            }
        } catch (error: any) {
            console.error("Download failed:", error);
            if (!isAuto) {
                setSyncMessage({ type: 'error', text: "下载失败: " + error.message });
            }
        } finally {
            setIsSyncing(false);
        }
    }, [state.storageConfig, localSettings.storage]);

    /**
     * 确认恢复数据
     */
    const confirmRestore = useCallback(() => {
        if (!pendingCloudData) return;

        console.log('Restoring data:', pendingCloudData);
        setState(pendingCloudData);
        setLocalSettings({
            coach: pendingCloudData.coachSettings,
            storage: pendingCloudData.storageConfig
        });

        setPendingCloudData(null);
        setSyncMessage({ type: 'success', text: "数据恢复成功！" });
    }, [pendingCloudData, setState, setLocalSettings]);

    /**
     * 取消恢复
     */
    const cancelRestore = useCallback(() => {
        setPendingCloudData(null);
        setSyncMessage(null);
    }, []);

    // 自动同步 Effect (Upload)
    useEffect(() => {
        const config = state.storageConfig;

        // 仅当配置了 Supabase 时自动同步
        if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
            return;
        }

        // 防抖：3 秒后同步
        const timer = setTimeout(() => {
            syncToCloud(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, [state, syncToCloud]);

    // 初始加载自动拉取 Effect (Download)
    useEffect(() => {
        if (hasInitialFetchRun.current) return;

        const config = state.storageConfig;
        if (config.provider === 'supabase' && config.supabaseUrl && config.supabaseKey) {
            console.log("Auto-fetching from cloud on startup...");
            hasInitialFetchRun.current = true;
            syncFromCloud(true);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    return {
        isSyncing,
        syncMessage,
        pendingCloudData,
        restoreSource,
        isTestingStorage,
        storageTestResult,

        syncToCloud,
        syncFromCloud,
        testStorageConnection,
        confirmRestore,
        cancelRestore,
        setSyncMessage,
        setPendingCloudData
    };
};
