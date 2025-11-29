import { AppState, StorageConfig } from '../types';

export const SUPABASE_TABLE = 'lifesync_storage';
// Split IDs for optimized syncing
export const BACKUP_ID_CORE = 'user_backup_core_v1';
export const BACKUP_ID_ARCHIVE = 'user_backup_archive_v1';
// Legacy ID for backward compatibility
export const BACKUP_ID_LEGACY = 'user_backup_v1';

export class StorageService {

    static async testConnection(config: StorageConfig): Promise<boolean> {
        if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
            throw new Error("无效的 Supabase 配置 (URL 或 Key 为空)");
        }

        // We try to check if the table exists by doing a HEAD request or a light Select
        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}?select=id&limit=1`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': config.supabaseKey,
                'Authorization': `Bearer ${config.supabaseKey}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`连接成功，但未找到表 '${SUPABASE_TABLE}'。请参考下方 SQL 建立表结构。`);
            }
            if (response.status === 401) {
                throw new Error("权限认证失败 (Key 无效)");
            }
            throw new Error(`连接失败 (Status: ${response.status})`);
        }

        return true;
    }

    static async uploadData(config: StorageConfig, data: AppState, onlyCore: boolean = false): Promise<void> {
        if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase 未配置");
        }

        // Split data into Core (lightweight + active chat) and Archive (heavyweight history)
        const { chatSessions, reports, ...rest } = data;

        // Find active session to keep in Core
        const activeSession = data.currentChatId ? chatSessions.find(s => s.id === data.currentChatId) : null;
        const inactiveSessions = data.currentChatId ? chatSessions.filter(s => s.id !== data.currentChatId) : chatSessions;

        const coreData = {
            ...rest,
            activeChatSession: activeSession || null
        };

        const archiveData = {
            chatSessions: inactiveSessions,
            reports
        };

        // Helper to upload a chunk
        const uploadChunk = async (id: string, chunkData: any) => {
            const payload = {
                id: id,
                data: chunkData,
                updated_at: new Date().toISOString()
            };
            const url = `${config.supabaseUrl!.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'apikey': config.supabaseKey!,
                    'Authorization': `Bearer ${config.supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`上传失败 (${id}): ${text}`);
            }
        };

        const promises = [uploadChunk(BACKUP_ID_CORE, coreData)];

        // Only upload archive if not skipping it
        if (!onlyCore) {
            promises.push(uploadChunk(BACKUP_ID_ARCHIVE, archiveData));
        }

        await Promise.all(promises);
    }

    static async downloadData(config: StorageConfig): Promise<AppState | null> {
        if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase 未配置");
        }

        // Helper to download a chunk
        const downloadChunk = async (id: string) => {
            const url = `${config.supabaseUrl!.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}?id=eq.${id}&select=data`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': config.supabaseKey!,
                    'Authorization': `Bearer ${config.supabaseKey}`,
                }
            });
            if (!response.ok) return null;
            const json = await response.json();
            return (json && json.length > 0) ? json[0].data : null;
        };

        // Try to fetch Core and Archive
        const [coreData, archiveData] = await Promise.all([
            downloadChunk(BACKUP_ID_CORE),
            downloadChunk(BACKUP_ID_ARCHIVE)
        ]);

        if (coreData) {
            // Reconstruct full chat sessions list
            let allSessions = archiveData?.chatSessions || [];
            if (coreData.activeChatSession) {
                // Add active session back. 
                // We put it at the beginning as it's likely the most recent, 
                // but App state usually manages sort order. 
                // To be safe, we just add it.
                allSessions = [coreData.activeChatSession, ...allSessions.filter((s: any) => s.id !== coreData.activeChatSession.id)];
            }

            return {
                ...coreData,
                chatSessions: allSessions,
                reports: archiveData?.reports || []
            } as AppState;
        }

        // Fallback: Try legacy single-file backup
        const legacyData = await downloadChunk(BACKUP_ID_LEGACY);
        if (legacyData) {
            return legacyData as AppState;
        }

        return null;
    }
}
