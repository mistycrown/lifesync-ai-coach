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

    // 追踪上次同步时间（用于冲突检测）
    const lastSyncTimeRef = useRef<string | null>(null);



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

        // 冲突检测：检查云端是否有更新的版本
        if (lastSyncTimeRef.current) {
            const latestRemoteTime = await StorageService.getLatestTimestamp(config);
            if (latestRemoteTime && new Date(latestRemoteTime) > new Date(lastSyncTimeRef.current)) {
                const msg = "云端数据已更新，为防止覆盖，已暂停自动同步。请刷新页面拉取最新数据。";
                console.warn(msg);
                if (!isAuto) {
                    setSyncMessage({ type: 'error', text: msg });
                } else {
                    // 自动同步失败时，也提示一下，但不要太打扰
                    setSyncMessage({ type: 'info', text: "云端有新数据，请刷新同步" });
                }
                return;
            }
        }

        // 上传时嵌入最新的存储配置
        const stateToUpload = { ...state, storageConfig: config };

        if (!isAuto) {
            setIsSyncing(true);
            setSyncMessage({
                type: 'info',
                text: "正在同步..."
            });
        }

        try {
            await StorageService.uploadData(config, stateToUpload);

            // 更新本地最后同步时间
            lastSyncTimeRef.current = new Date().toISOString();

            if (!isAuto) {
                setSyncMessage({ type: 'success', text: "上传成功！数据已安全存储。" });
            } else {
                console.log(`Auto-sync success`);
                setSyncMessage(null); // 清除之前的错误/提示
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
     * @param isAuto 是否为自动同步
     * @param shouldApply 是否自动应用数据（跳过确认）
     */
    const syncFromCloud = useCallback(async (isAuto = false, shouldApply = false) => {
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
            // 获取最新时间戳
            const latestTimestamp = await StorageService.getLatestTimestamp(config);
            const cloudState = await StorageService.downloadData(config);

            if (cloudState) {
                if (shouldApply) {
                    // 自动应用
                    console.log('Auto-applying cloud data...');
                    setState(cloudState);
                    setLocalSettings({
                        coach: cloudState.coachSettings,
                        storage: cloudState.storageConfig
                    });
                    if (latestTimestamp) {
                        lastSyncTimeRef.current = latestTimestamp;
                    }
                    setSyncMessage({ type: 'success', text: "已自动同步最新数据" });
                    // 3秒后清除成功消息
                    setTimeout(() => setSyncMessage(null), 3000);
                } else {
                    // 手动确认流程
                    setPendingCloudData(cloudState);
                    setRestoreSource('cloud');
                    setSyncMessage(null); // 清除加载消息，显示确认卡片
                    if (latestTimestamp) {
                        lastSyncTimeRef.current = latestTimestamp; // 暂存，确认后生效? 其实这里更新也没事
                    }
                }
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
    }, [state.storageConfig, localSettings.storage, setState, setLocalSettings]);

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
            // 启动时自动拉取并应用
            syncFromCloud(true, true);
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // 轮询检查云端更新 (每60秒)
    useEffect(() => {
        const config = state.storageConfig;
        if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) return;

        const interval = setInterval(async () => {
            const latestRemoteTime = await StorageService.getLatestTimestamp(config);
            if (latestRemoteTime && lastSyncTimeRef.current && new Date(latestRemoteTime) > new Date(lastSyncTimeRef.current)) {
                console.log("Detected remote change via polling");
                setSyncMessage({ type: 'info', text: "云端数据有更新，建议刷新页面" });
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [state.storageConfig]);

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
