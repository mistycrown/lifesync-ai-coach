import React, { useState } from 'react';
import { Vision, ThemeConfig, Goal, Task, Session } from '../types';
import { Archive, Trash2, Clock } from 'lucide-react';

interface VisionListProps {
    visions: Vision[];
    theme: ThemeConfig;
    onAddVision: (title: string) => void;
    onUpdateVision: (id: string, updates: Partial<Vision>) => void;
    onDeleteVision: (id: string) => void;
    onToggleVisionArchived: (id: string) => void;
    onViewVision: (id: string) => void;
    goals: Goal[];
    tasks: Task[];
    sessions: Session[];
}

export const VisionList: React.FC<VisionListProps> = ({
    visions,
    theme,
    onAddVision,
    onUpdateVision,
    onDeleteVision,
    onToggleVisionArchived,
    onViewVision,
    goals,
    tasks,
    sessions
}) => {
    const [newTitle, setNewTitle] = useState('');

    const getVisionStats = (visionId: string) => {
        const linkedGoals = goals.filter(g => g.visionId === visionId);
        const linkedGoalIds = new Set(linkedGoals.map(g => g.id));
        const linkedTasks = tasks.filter(t => t.goalId && linkedGoalIds.has(t.goalId));
        const linkedTaskIds = new Set(linkedTasks.map(t => t.id));
        const relevantSessions = sessions.filter(s => s.taskId && linkedTaskIds.has(s.taskId));
        const totalSeconds = relevantSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
        return Math.floor(totalSeconds / 3600);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTitle.trim()) {
            onAddVision(newTitle);
            setNewTitle('');
        }
    };

    const sortedVisions = [...visions].sort((a, b) => {
        // Active first, then archived
        if (a.archived === b.archived) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.archived ? 1 : -1;
    });

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {sortedVisions.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-4">暂无长期愿景。设定一个宏大的目标吧！</p>
                )}
                {sortedVisions.map(vision => (
                    <div
                        key={vision.id}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group ${vision.archived ? 'bg-slate-50 border-slate-100 opacity-70' : `bg-white border-slate-100 shadow-sm hover:shadow-md`}`}
                        onClick={() => onViewVision(vision.id)}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-3">
                                    <h4 className={`font-bold text-lg truncate ${vision.archived ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                        {vision.title}
                                    </h4>
                                    {!vision.archived && (
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full bg-${theme.primary}-50 text-${theme.primary}-600 text-xs font-medium whitespace-nowrap`}>
                                            <Clock size={12} />
                                            <span>{getVisionStats(vision.id)}h</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                    <span>创建于 {new Date(vision.createdAt).toLocaleDateString()}</span>
                                    {vision.archived && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">已归档</span>}
                                </div>
                            </div>

                            <div className="flex gap-1 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => onToggleVisionArchived(vision.id)}
                                    className={`p-1.5 rounded transition-colors ${vision.archived ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                    title={vision.archived ? "恢复" : "归档"}
                                >
                                    <Archive size={16} />
                                </button>
                                <button
                                    onClick={() => onDeleteVision(vision.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="删除"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAdd} className="mt-4 flex items-center gap-2">
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="添加愿景..."
                    className={`flex-1 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-${theme.primary}-500 focus:bg-white transition-colors`}
                />
                <button type="submit" className={`px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium whitespace-nowrap`}>
                    添加
                </button>
            </form>
        </div>
    );
};
