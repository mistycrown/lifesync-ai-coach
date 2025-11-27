import React, { useState, useMemo } from 'react';
import { Task, Goal, Vision, Session, Habit, DailyReport, ThemeConfig } from '../types';
import { Search, X, Edit2, Calendar, CheckCircle, Circle, Target, Flag, Clock, FileText, ListTodo, Activity } from 'lucide-react';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: ThemeConfig;
    tasks: Task[];
    goals: Goal[];
    visions: Vision[];
    sessions: Session[];
    habits: Habit[];
    reports: DailyReport[];
    onNavigate: (type: 'task' | 'goal' | 'vision' | 'report' | 'session' | 'habit', id: string) => void;
}

type SearchResult = {
    id: string;
    type: 'task' | 'goal' | 'vision' | 'session' | 'habit' | 'report';
    title: string;
    subtitle?: string;
    date?: string;
    original: any;
};

export const SearchModal: React.FC<SearchModalProps> = ({
    isOpen,
    onClose,
    theme,
    tasks,
    goals,
    visions,
    sessions,
    habits,
    reports,
    onNavigate
}) => {
    const [query, setQuery] = useState('');

    const results = useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        const allResults: SearchResult[] = [];

        // 1. Tasks
        tasks.forEach(t => {
            if (t.title.toLowerCase().includes(lowerQuery)) {
                allResults.push({
                    id: t.id,
                    type: 'task',
                    title: t.title,
                    subtitle: t.completed ? '已完成' : '进行中',
                    date: t.createdAt,
                    original: t
                });
            }
        });

        // 2. Goals
        goals.forEach(g => {
            if (g.title.toLowerCase().includes(lowerQuery)) {
                allResults.push({
                    id: g.id,
                    type: 'goal',
                    title: g.title,
                    subtitle: `截止: ${g.deadline}`,
                    date: g.deadline,
                    original: g
                });
            }
        });

        // 3. Visions
        visions.forEach(v => {
            if (v.title.toLowerCase().includes(lowerQuery)) {
                allResults.push({
                    id: v.id,
                    type: 'vision',
                    title: v.title,
                    subtitle: v.archived ? '已归档' : '进行中',
                    date: v.createdAt,
                    original: v
                });
            }
        });

        // 4. Sessions (Focus Records & Activity Log)
        sessions.forEach(s => {
            if (s.label.toLowerCase().includes(lowerQuery)) {
                allResults.push({
                    id: s.id,
                    type: 'session',
                    title: s.label,
                    subtitle: `${Math.floor(s.durationSeconds / 60)}分钟`,
                    date: s.startTime,
                    original: s
                });
            }
        });

        // 5. Habits
        habits.forEach(h => {
            if (h.title.toLowerCase().includes(lowerQuery)) {
                allResults.push({
                    id: h.id,
                    type: 'habit',
                    title: h.title,
                    date: h.createdAt,
                    original: h
                });
            }
        });

        // 6. Reports
        reports.forEach(r => {
            if (r.title.toLowerCase().includes(lowerQuery) || r.content.toLowerCase().includes(lowerQuery)) {
                allResults.push({
                    id: r.id,
                    type: 'report',
                    title: r.title,
                    subtitle: '每日复盘',
                    date: r.date,
                    original: r
                });
            }
        });

        return allResults;
    }, [query, tasks, goals, visions, sessions, habits, reports]);

    if (!isOpen) return null;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'task': return <ListTodo size={16} className="text-blue-500" />;
            case 'goal': return <Flag size={16} className="text-amber-500" />;
            case 'vision': return <Target size={16} className="text-purple-500" />;
            case 'session': return <Clock size={16} className="text-emerald-500" />;
            case 'habit': return <Activity size={16} className="text-rose-500" />;
            case 'report': return <FileText size={16} className="text-slate-500" />;
            default: return <Search size={16} />;
        }
    };

    const getTypeName = (type: string) => {
        switch (type) {
            case 'task': return '待办事项';
            case 'goal': return '目标';
            case 'vision': return '长期愿景';
            case 'session': return '专注记录';
            case 'habit': return '打卡习惯';
            case 'report': return '每日复盘';
            default: return '未知';
        }
    };

    const handleEdit = (item: SearchResult) => {
        // Only navigate for types that have detail views
        if (['task', 'goal', 'vision', 'report', 'session', 'habit'].includes(item.type)) {
            onNavigate(item.type as any, item.id);
            // onClose(); // Keep search modal open
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <Search className={`text-${theme.primary}-500`} size={20} />
                    <input
                        autoFocus
                        placeholder="搜索所有内容..."
                        className="flex-1 text-lg outline-none text-slate-700 placeholder:text-slate-400"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-4">
                    {results.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            {query ? '未找到相关内容' : '输入关键词开始搜索'}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium w-32">类型</th>
                                        <th className="px-4 py-3 font-medium">名称 / 内容</th>
                                        <th className="px-4 py-3 font-medium w-20 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {results.map(item => (
                                        <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(item.type)}
                                                    <span className="text-slate-600">{getTypeName(item.type)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-slate-800">{item.title}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5 flex gap-2">
                                                        {item.subtitle && <span>{item.subtitle}</span>}
                                                        {item.date && <span>{new Date(item.date).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {['task', 'goal', 'vision', 'report', 'session', 'habit'].includes(item.type) && (
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className={`p-1.5 text-slate-400 hover:text-${theme.primary}-600 hover:bg-${theme.primary}-50 rounded transition-colors`}
                                                        title="查看详情"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 flex justify-between">
                    <span>共找到 {results.length} 个结果</span>
                    <span>ESC 关闭</span>
                </div>
            </div>
        </div>
    );
};
