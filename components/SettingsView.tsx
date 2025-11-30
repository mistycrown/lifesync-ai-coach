import React, { useState, useEffect, useRef } from 'react';
import { Settings, User, Palette, Database, Download, Trash2, Save, Check, Server, Key, Link as LinkIcon, Box, PlugZap, Loader2, AlertCircle, Cloud, UploadCloud, DownloadCloud, HardDrive, Info, HelpCircle, FileJson, Bug } from 'lucide-react';
import { Select } from './Select';
import { AppState, CoachSettings, StorageConfig, ThemeConfig } from '../types';
import { THEMES, COACH_STYLES } from '../constants/appConstants';
import { SUPABASE_TABLE } from '../services/storageService';

interface SettingsViewProps {
    state: AppState;
    localSettings: { coach: CoachSettings, storage: StorageConfig };
    setLocalSettings: React.Dispatch<React.SetStateAction<{ coach: CoachSettings, storage: StorageConfig }>>;
    currentTheme: ThemeConfig;
    settingsTab: 'coach' | 'theme' | 'data';
    setSettingsTab: (tab: 'coach' | 'theme' | 'data') => void;

    // Actions
    onSave: () => void;
    onCancel: () => void;
    onUpdateTheme: (themeKey: string) => void;

    // Connection Test
    isTestingConnection: boolean;
    connectionTestResult: { type: 'success' | 'error', message: string } | null;
    onTestConnection: () => void;

    // Storage Test
    isTestingStorage: boolean;
    storageTestResult: { type: 'success' | 'error', message: string } | null;
    onTestStorageConnection: () => void;

    // Sync
    isSyncing: boolean;
    syncMessage: { type: 'success' | 'error' | 'info', text: string } | null;
    onSyncToCloud: (isAuto: boolean) => void;
    onSyncFromCloud: () => void;
    pendingCloudData: AppState | null;
    restoreSource: 'cloud' | 'local';
    onConfirmRestore: () => void;
    onCancelRestore: () => void;

    // Import/Export
    onExportData: () => void;
    onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onHandleImportClick: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    state,
    localSettings,
    setLocalSettings,
    currentTheme,
    settingsTab,
    setSettingsTab,
    onSave,
    onCancel,
    onUpdateTheme,
    isTestingConnection,
    connectionTestResult,
    onTestConnection,
    isTestingStorage,
    storageTestResult,
    onTestStorageConnection,
    isSyncing,
    syncMessage,
    onSyncToCloud,
    onSyncFromCloud,
    pendingCloudData,
    restoreSource,
    onConfirmRestore,
    onCancelRestore,
    onExportData,
    onImportData,
    onHandleImportClick,
    fileInputRef
}) => {
    const [isSaved, setIsSaved] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleSave = () => {
        onSave();
        if (isMounted.current) {
            setIsSaved(true);
            setTimeout(() => {
                if (isMounted.current) setIsSaved(false);
            }, 2000);
        }
    };

    const handleStyleChange = (selectedStyle: string) => {
        const preset = COACH_STYLES.find(s => s.label === selectedStyle);

        setLocalSettings(prev => ({
            ...prev,
            coach: {
                ...prev.coach,
                style: selectedStyle,
                customInstruction: preset ? preset.value : prev.coach.customInstruction
            }
        }));
    };

    const handleProviderPreset = (provider: string) => {
        let baseUrl = '';
        let modelId = '';

        if (provider === 'deepseek') {
            baseUrl = 'https://api.deepseek.com';
            modelId = 'deepseek-chat';
        } else if (provider === 'siliconflow') {
            baseUrl = 'https://api.siliconflow.cn/v1';
            modelId = 'deepseek-ai/DeepSeek-V3';
        } else if (provider === 'openai') {
            baseUrl = 'https://api.openai.com/v1';
            modelId = 'gpt-3.5-turbo';
        } else {
            baseUrl = '';
            modelId = 'gemini-2.5-flash';
        }

        setLocalSettings(prev => ({
            ...prev,
            coach: {
                ...prev.coach,
                modelConfig: {
                    ...prev.coach.modelConfig,
                    provider: provider as any,
                    baseUrl,
                    modelId
                }
            }
        }));
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Sidebar / Tabs */}
            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => setSettingsTab('coach')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${settingsTab === 'coach' ? `border-${currentTheme.primary}-500 text-${currentTheme.primary}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <User size={18} /> 教练设置
                </button>
                <button
                    onClick={() => setSettingsTab('theme')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${settingsTab === 'theme' ? `border-${currentTheme.primary}-500 text-${currentTheme.primary}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Palette size={18} /> 主题外观
                </button>
                <button
                    onClick={() => setSettingsTab('data')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${settingsTab === 'data' ? `border-${currentTheme.primary}-500 text-${currentTheme.primary}-600` : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Database size={18} /> 数据备份
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {settingsTab === 'coach' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                <User className={`w-5 h-5 text-${currentTheme.primary}-600`} /> 基本信息
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">你的称呼</label>
                                    <input
                                        value={localSettings.coach.userName}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, coach: { ...prev.coach, userName: e.target.value } }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">教练名字</label>
                                    <input
                                        value={localSettings.coach.name}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, coach: { ...prev.coach, name: e.target.value } }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Persona Style */}
                        <div className="space-y-4">
                            <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                <Palette className={`w-5 h-5 text-${currentTheme.primary}-600`} /> 教练人格
                            </h4>
                            <Select
                                value={localSettings.coach.style}
                                onChange={handleStyleChange}
                                options={COACH_STYLES}
                                className="w-full"
                                theme={currentTheme}
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">人设指令 (System Prompt)</label>
                                <textarea
                                    value={localSettings.coach.customInstruction}
                                    onChange={(e) => setLocalSettings(prev => ({ ...prev, coach: { ...prev.coach, customInstruction: e.target.value } }))}
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    placeholder="在这里微调教练的语气和行为模式..."
                                />
                            </div>
                        </div>

                        {/* Model Config */}
                        <div className="space-y-4 border-t border-slate-100 pt-6">
                            <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                <Server className={`w-5 h-5 text-${currentTheme.primary}-600`} /> 模型配置
                            </h4>

                            {/* Provider Quick Select */}
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                                {['gemini', 'deepseek', 'siliconflow', 'openai'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => handleProviderPreset(p)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${localSettings.coach.modelConfig.provider === p
                                            ? `bg-${currentTheme.primary}-50 border-${currentTheme.primary}-200 text-${currentTheme.primary}-700`
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {p === 'gemini' && 'Google Gemini'}
                                        {p === 'deepseek' && 'DeepSeek (Official)'}
                                        {p === 'siliconflow' && 'SiliconFlow (DS-V3)'}
                                        {p === 'openai' && 'OpenAI / Compatible'}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                        <Key size={14} /> API Key
                                    </label>
                                    <input
                                        type="password"
                                        value={localSettings.coach.modelConfig.apiKey}
                                        onChange={(e) => setLocalSettings(prev => ({
                                            ...prev,
                                            coach: {
                                                ...prev.coach,
                                                modelConfig: { ...prev.coach.modelConfig, apiKey: e.target.value }
                                            }
                                        }))}
                                        placeholder="sk-..."
                                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                            <LinkIcon size={14} /> Base URL
                                        </label>
                                        <input
                                            value={localSettings.coach.modelConfig.baseUrl}
                                            onChange={(e) => setLocalSettings(prev => ({
                                                ...prev,
                                                coach: {
                                                    ...prev.coach,
                                                    modelConfig: { ...prev.coach.modelConfig, baseUrl: e.target.value }
                                                }
                                            }))}
                                            placeholder="https://api.openai.com/v1"
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                            <Box size={14} /> Model ID
                                        </label>
                                        <input
                                            value={localSettings.coach.modelConfig.modelId}
                                            onChange={(e) => setLocalSettings(prev => ({
                                                ...prev,
                                                coach: {
                                                    ...prev.coach,
                                                    modelConfig: { ...prev.coach.modelConfig, modelId: e.target.value }
                                                }
                                            }))}
                                            placeholder="gpt-3.5-turbo"
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={onTestConnection}
                                        disabled={isTestingConnection || !localSettings.coach.modelConfig.apiKey}
                                        className={`w-full flex items-center justify-center gap-2 border border-${currentTheme.primary}-200 bg-${currentTheme.primary}-50 text-${currentTheme.primary}-700 hover:bg-${currentTheme.primary}-100 font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isTestingConnection ? <Loader2 className="animate-spin" size={16} /> : <PlugZap size={16} />}
                                        {isTestingConnection ? "正在测试..." : "测试连接"}
                                    </button>

                                    {connectionTestResult && (
                                        <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${connectionTestResult.type === 'success'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                            {connectionTestResult.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                            <span>{connectionTestResult.message}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Advanced Settings */}
                        <div className="space-y-4 border-t border-slate-100 pt-6">
                            <h4 className="font-medium text-slate-800 flex items-center gap-2">
                                <Bug className={`w-5 h-5 text-${currentTheme.primary}-600`} /> 高级设置
                            </h4>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium text-slate-700">调试模式 (Debug Mode)</label>
                                        <p className="text-xs text-slate-500">在对话中显示完整的 Prompt 和系统指令，用于开发调试。</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.coach.debugMode || false}
                                            onChange={(e) => setLocalSettings(prev => ({
                                                ...prev,
                                                coach: { ...prev.coach, debugMode: e.target.checked }
                                            }))}
                                            className="sr-only peer"
                                        />
                                        <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${currentTheme.primary}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${currentTheme.primary}-600`}></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                                    <div>
                                        <label className="font-medium text-slate-700">启用上下文记忆 (Context Memory)</label>
                                        <p className="text-xs text-slate-500">允许 AI 记住之前的对话历史（可能会增加 Token 消耗）。</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.coach.enableContext !== false} // Default to true if undefined
                                            onChange={(e) => setLocalSettings(prev => ({
                                                ...prev,
                                                coach: { ...prev.coach, enableContext: e.target.checked }
                                            }))}
                                            className="sr-only peer"
                                        />
                                        <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${currentTheme.primary}-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${currentTheme.primary}-600`}></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {settingsTab === 'theme' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h4 className="font-medium text-slate-800">选择应用主题</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {Object.entries(THEMES).map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => onUpdateTheme(key)}
                                    className={`relative p-4 rounded-xl border-2 transition-all text-left group overflow-hidden ${state.theme === key
                                        ? `border-${theme.primary}-500 bg-${theme.primary}-50 ring-2 ring-${theme.primary}-200 ring-offset-2`
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-full h-20 rounded-lg mb-3 bg-gradient-to-br from-${theme.primary}-400 to-${theme.secondary}-500 shadow-sm group-hover:scale-105 transition-transform duration-500`}></div>
                                    <div className="font-bold text-slate-800">{theme.name}</div>
                                    <div className="text-xs text-slate-500 mt-1 capitalize">{key}</div>
                                    {state.theme === key && (
                                        <div className={`absolute top-3 right-3 bg-white rounded-full p-1 text-${theme.primary}-600 shadow-sm`}>
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {settingsTab === 'data' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Database Configuration */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Database className={`w-5 h-5 text-${currentTheme.primary}-600`} />
                                <h4 className="font-medium text-slate-800">云端数据库配置 (Supabase)</h4>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                    <button
                                        onClick={() => setLocalSettings(prev => ({ ...prev, storage: { ...prev.storage, provider: 'local' } }))}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${localSettings.storage.provider === 'local' ? `bg-${currentTheme.primary}-100 text-${currentTheme.primary}-700 shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <HardDrive size={14} className="inline mr-1" /> 本地存储
                                    </button>
                                    <button
                                        onClick={() => setLocalSettings(prev => ({ ...prev, storage: { ...prev.storage, provider: 'supabase' } }))}
                                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${localSettings.storage.provider === 'supabase' ? `bg-${currentTheme.primary}-100 text-${currentTheme.primary}-700 shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Cloud size={14} className="inline mr-1" /> Supabase 云端
                                    </button>
                                </div>

                                {localSettings.storage.provider === 'supabase' && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Project URL</label>
                                            <input
                                                value={localSettings.storage.supabaseUrl || ''}
                                                onChange={(e) => setLocalSettings(prev => ({ ...prev, storage: { ...prev.storage, supabaseUrl: e.target.value } }))}
                                                placeholder="https://xyz.supabase.co"
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Anon API Key</label>
                                            <input
                                                type="password"
                                                value={localSettings.storage.supabaseKey || ''}
                                                onChange={(e) => setLocalSettings(prev => ({ ...prev, storage: { ...prev.storage, supabaseKey: e.target.value } }))}
                                                placeholder="eyJh..."
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                                                <HelpCircle size={12} className="mt-0.5 shrink-0" />
                                                <span>位置：Project Settings (左下角齿轮) -&gt; API -&gt; Project API Keys -&gt; 复制 <b>anon public</b></span>
                                            </p>
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                            <p className="flex items-center gap-1 font-bold mb-1"><Info size={12} /> 配置说明</p>
                                            <p>请在 Supabase SQL Editor 中运行以下命令来创建数据表：</p>
                                            <code className="block bg-white border border-amber-100 p-2 rounded mt-1 select-all font-mono">
                                                create table {SUPABASE_TABLE} (<br />
                                                &nbsp;&nbsp;id text primary key,<br />
                                                &nbsp;&nbsp;data jsonb,<br />
                                                &nbsp;&nbsp;updated_at timestamp with time zone<br />
                                                );
                                                <br /><br />
                                                -- 关键：允许读写<br />
                                                alter table {SUPABASE_TABLE} disable row level security;
                                            </code>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                onClick={onTestStorageConnection}
                                                disabled={isTestingStorage}
                                                className={`w-full flex items-center justify-center gap-2 border border-${currentTheme.primary}-200 bg-${currentTheme.primary}-50 text-${currentTheme.primary}-700 hover:bg-${currentTheme.primary}-100 font-medium py-2 rounded-lg transition-colors`}
                                            >
                                                {isTestingStorage ? <Loader2 className="animate-spin" size={16} /> : <PlugZap size={16} />}
                                                {isTestingStorage ? "正在测试连接..." : "测试数据库连接"}
                                            </button>

                                            {storageTestResult && (
                                                <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${storageTestResult.type === 'success'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                                    }`}>
                                                    {storageTestResult.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                                    <span>{storageTestResult.message}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sync & Backup Actions */}
                        <div className="border-t border-slate-200 pt-6 space-y-3">
                            <h4 className="font-medium text-slate-800">数据同步与备份</h4>

                            {/* Cloud Sync Buttons */}
                            {/* Cloud Sync Buttons */}
                            {localSettings.storage.provider === 'supabase' && (
                                <div className="space-y-3 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => onSyncToCloud(false)}
                                            disabled={isSyncing}
                                            className={`flex items-center justify-center gap-2 border border-${currentTheme.primary}-200 bg-white hover:bg-${currentTheme.primary}-50 text-${currentTheme.primary}-700 font-medium py-2.5 rounded-lg transition-colors shadow-sm`}
                                        >
                                            <UploadCloud size={18} /> 上传到云端
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onSyncFromCloud}
                                            disabled={isSyncing}
                                            className={`flex items-center justify-center gap-2 border border-${currentTheme.primary}-200 bg-white hover:bg-${currentTheme.primary}-50 text-${currentTheme.primary}-700 font-medium py-2.5 rounded-lg transition-colors shadow-sm`}
                                        >
                                            <DownloadCloud size={18} /> 从云端恢复
                                        </button>
                                    </div>

                                    {/* Sync Feedback Message */}
                                    {syncMessage && (
                                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${syncMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                            syncMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                'bg-blue-50 text-blue-700 border border-blue-200'
                                            }`}>
                                            {syncMessage.type === 'info' && <Loader2 className="animate-spin" size={16} />}
                                            {syncMessage.type === 'success' && <Check size={16} />}
                                            {syncMessage.type === 'error' && <AlertCircle size={16} />}
                                            <span>{syncMessage.text}</span>
                                        </div>
                                    )}

                                    {/* Restoration Confirmation Card */}
                                    {pendingCloudData && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                                <div>
                                                    <h5 className="font-bold text-amber-800">
                                                        {restoreSource === 'cloud' ? '确认从云端恢复？' : '确认导入本地备份？'}
                                                    </h5>
                                                    <p className="text-sm text-amber-700 mt-1">
                                                        备份数据包含 {pendingCloudData.tasks.length} 个任务，{pendingCloudData.goals.length} 个目标。
                                                        <br />
                                                        <span className="font-bold">警告：此操作将覆盖当前本地的所有数据。</span>
                                                    </p>
                                                    <div className="flex gap-3 mt-3">
                                                        <button
                                                            onClick={onCancelRestore}
                                                            className="px-3 py-1.5 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium"
                                                        >
                                                            取消
                                                        </button>
                                                        <button
                                                            onClick={onConfirmRestore}
                                                            className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium shadow-sm"
                                                        >
                                                            确认覆盖
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={onExportData}
                                    className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-colors"
                                >
                                    <Download size={18} /> 导出备份
                                </button>
                                <button
                                    onClick={onHandleImportClick}
                                    className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-colors"
                                >
                                    <FileJson size={18} /> 导入备份
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={onImportData}
                                    accept=".json"
                                    className="hidden"
                                />
                            </div>

                            {/* Local Import Confirmation Card (When Supabase is NOT enabled) */}
                            {pendingCloudData && state.storageConfig.provider === 'local' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                        <div>
                                            <h5 className="font-bold text-amber-800">确认导入本地备份？</h5>
                                            <p className="text-sm text-amber-700 mt-1">
                                                备份数据包含 {pendingCloudData.tasks.length} 个任务，{pendingCloudData.goals.length} 个目标。
                                                <br />
                                                <span className="font-bold">警告：此操作将覆盖当前本地的所有数据。</span>
                                            </p>
                                            <div className="flex gap-3 mt-3">
                                                <button
                                                    onClick={onCancelRestore}
                                                    className="px-3 py-1.5 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium"
                                                >
                                                    取消
                                                </button>
                                                <button
                                                    onClick={onConfirmRestore}
                                                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium shadow-sm"
                                                >
                                                    确认覆盖
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button
                    onClick={handleSave}
                    disabled={isSaved}
                    className={`w-full px-4 py-2 ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600' : `bg-${currentTheme.primary}-600 hover:bg-${currentTheme.primary}-700`} text-white rounded-lg shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2 text-sm font-medium`}
                >
                    {isSaved ? <Check size={16} /> : <Save size={16} />}
                    {isSaved ? "保存成功" : "保存设置"}
                </button>
            </div>
        </div>
    );
};
