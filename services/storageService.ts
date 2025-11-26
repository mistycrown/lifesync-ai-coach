
import { AppState, StorageConfig } from '../types';

export const SUPABASE_TABLE = 'lifesync_storage';
// We use a fixed ID for simplicity in this single-user local-first app
// In a real app, this would be the user's ID
export const BACKUP_ID = 'user_backup_v1'; 

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

  static async uploadData(config: StorageConfig, data: AppState): Promise<void> {
      if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
          throw new Error("Supabase 未配置");
      }
      
      // Prepare payload
      const payload = {
          id: BACKUP_ID,
          data: data,
          updated_at: new Date().toISOString()
      };

      const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}`;
      
      const response = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': config.supabaseKey,
            'Authorization': `Bearer ${config.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates' // This enables UPSERT functionality in Supabase
          },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          const text = await response.text();
          throw new Error(`上传失败: ${text}`);
      }
  }

  static async downloadData(config: StorageConfig): Promise<AppState | null> {
      if (config.provider !== 'supabase' || !config.supabaseUrl || !config.supabaseKey) {
           throw new Error("Supabase 未配置");
      }
      
      const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}?id=eq.${BACKUP_ID}&select=data`;
      
      const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': config.supabaseKey,
            'Authorization': `Bearer ${config.supabaseKey}`,
          }
      });

      if (!response.ok) {
          throw new Error("下载失败");
      }
      
      const json = await response.json();
      if (json && json.length > 0 && json[0].data) {
          return json[0].data as AppState;
      }
      return null;
  }
}
