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

        // Always upload full data to the main ID
        const payload = {
            id: BACKUP_ID_LEGACY,
            data: data,
            updated_at: new Date().toISOString()
        };

        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}`;
        console.log(`Uploading full data (${BACKUP_ID_LEGACY})...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': config.supabaseKey,
                'Authorization': `Bearer ${config.supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`Upload failed:`, text);
            throw new Error(`上传失败: ${text}`);
        }
        console.log(`Upload success`);
    }

    static async downloadData(config: StorageConfig): Promise<AppState | null> {
        if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase 未配置");
        }

        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}?id=eq.${BACKUP_ID_LEGACY}&select=data&order=updated_at.desc&limit=1`;
        console.log(`Downloading full data (${BACKUP_ID_LEGACY})...`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': config.supabaseKey,
                'Authorization': `Bearer ${config.supabaseKey}`,
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`Download failed:`, response.status);
            return null;
        }

        const json = await response.json();
        console.log(`Downloaded data:`, json && json.length > 0 ? 'Found' : 'Not Found');
        return (json && json.length > 0) ? json[0].data : null;
    }

    static async getLatestTimestamp(config: StorageConfig): Promise<string | null> {
        if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
            return null;
        }

        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}?id=eq.${BACKUP_ID_LEGACY}&select=updated_at&limit=1`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'apikey': config.supabaseKey,
                    'Authorization': `Bearer ${config.supabaseKey}`,
                },
                cache: 'no-store'
            });

            if (!response.ok) return null;

            const json = await response.json();
            if (json && json.length > 0) {
                return json[0].updated_at;
            }
        } catch (error) {
            console.error("Failed to check timestamp:", error);
        }
        return null;
    }
}
