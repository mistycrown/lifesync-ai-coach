import React, { useState } from 'react';
import { Goal, Task, Session, ThemeConfig, Vision } from '../types';
import { X, Edit2, Trash2, Flag, CheckCircle, Circle, Clock, Calendar, Palette, Target, Activity } from 'lucide-react';
import { CalendarPopover } from './Calendar';
import { Select } from './Select';

const MORANDI_COLORS = [
    '#e8d3c0', // Warm Beige
    '#d89c7a', // Warm Brown/Orange
    '#d6c38b', // Warm Yellow
    '#849b91', // Greyish Green
    '#c2cedc', // Cool Grey/Blue
    '#686789', // Cool Grey/Purple
];

interface GoalDetailsModalProps {
    goal: Goal;
    tasks: Task[];
    sessions: Session[];
    visions: Vision[];
    theme: ThemeConfig;
    onClose: () => void;
    onUpdate: (id: string, title: string, deadline: string, color?: string, visionId?: string) => void;
    onDelete: (id: string) => void;
}

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
    goal,
    tasks,
    sessions,
    visions,
    theme,
    onClose,
    onUpdate,
    onDelete
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(goal.title);
    const [editDeadline, setEditDeadline] = useState(goal.deadline);
    const [editColor, setEditColor] = useState(goal.color);
    const [editVisionId, setEditVisionId] = useState(goal.visionId);

    const goalTasks = tasks.filter(t => t.goalId === goal.id);
    const completedTasks = goalTasks.filter(t => t.completed).length;
    const progress = goalTasks.length > 0 ? Math.round((completedTasks / goalTasks.length) * 100) : 0;

    const totalTime = sessions.filter(s => {
        const task = tasks.find(t => t.id === s.taskId);
        return task && task.goalId === goal.id;
    }).reduce((acc, s) => acc + s.durationSeconds, 0);

    const getHeatmapData = () => {
        const data = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const daySeconds = sessions.filter(s => {
                const task = tasks.find(t => t.id === s.taskId);
                return task && task.goalId === goal.id && s.startTime.startsWith(dateStr);
            }).reduce((acc, s) => acc + s.durationSeconds, 0);

            data.push({ date: dateStr, seconds: daySeconds });
        }
        return data;
    };
    const heatmapData = getHeatmapData();

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const handleSave = () => {
        if (editTitle.trim()) {
            onUpdate(goal.id, editTitle, editDeadline, editColor, editVisionId);
            setIsEditing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl" style={goal.color ? { backgroundColor: `${goal.color}11` } : {}}>
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-xl bg-white shadow-sm text-${theme.primary}-600`} style={goal.color ? { color: goal.color } : {}}>
                            <Flag size={24} />
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        className="w-full text-lg font-bold text-slate-800 border-b border-slate-300 focus:border-indigo-500 outline-none bg-transparent"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2">
                                        <CalendarPopover value={editDeadline} onChange={setEditDeadline} theme={theme} variant="full" />
                                    </div>
                                    <div className="mt-2">
                                        <Select
                                            value={visions.find(v => v.id === editVisionId)?.title || ''}
                                            onChange={(title) => {
                                                const vision = visions.find(v => v.title === title);
                                                if (vision) setEditVisionId(vision.id);
                                            }}
                                            options={visions.map(v => ({ label: v.title, value: v.id }))}
                                            theme={theme}
                                            placeholder="关联愿景（可选）"
                                        />
                                    </div>
                                    <div className="flex gap-1 flex-wrap">
                                        {MORANDI_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setEditColor(c)}
                                                style={{ backgroundColor: c }}
                                                className={`w-5 h-5 rounded-full hover:scale-110 transition-transform ${editColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                            />
                                        ))}
                                        <button
                                            onClick={() => setEditColor(undefined)}
                                            className={`w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 ${!editColor ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                        >
                                            X
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            placeholder="#RRGGBB 自定义颜色"
                                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const value = e.currentTarget.value.trim();
                                                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                                                        setEditColor(value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} className={`px-2 py-1 bg-${theme.primary}-600 text-white text-xs rounded`}>保存</button>
                                        <button onClick={() => setIsEditing(false)} className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded">取消</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="group">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-slate-800">{goal.title}</h3>
                                        <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-slate-600 transition-opacity">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <Calendar size={12} />
                                        <span>截止日期: {new Date(goal.deadline).toLocaleDateString()}</span>
                                    </div>
                                    {goal.visionId && (
                                        <div className="flex items-center gap-2 text-xs text-indigo-500 mt-1">
                                            <Target size={12} />
                                            <span>愿景: {visions.find(v => v.id === goal.visionId)?.title || '未知愿景'}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Heatmap */}
                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Activity size={16} className={`text-${theme.primary}-500`} /> 近30天投入
                        </h4>
                        <div className="flex gap-1 h-12 items-end">
                            {heatmapData.map((d) => {
                                let bgClass = 'bg-slate-100';
                                if (d.seconds > 0) bgClass = `bg-${theme.primary}-200`;
                                if (d.seconds > 1800) bgClass = `bg-${theme.primary}-400`;
                                if (d.seconds > 3600) bgClass = `bg-${theme.primary}-600`;

                                return (
                                    <div
                                        key={d.date}
                                        className={`flex-1 rounded-sm transition-all hover:opacity-80 relative group ${bgClass}`}
                                        style={{ height: d.seconds > 0 ? `${Math.max(20, Math.min(100, (d.seconds / 7200) * 100))}%` : '4px' }}
                                        title={`${d.date}: ${Math.round(d.seconds / 60)}分钟`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className={`p-3 bg-${theme.primary}-100 text-${theme.primary}-600 rounded-full`}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">累计投入时间</div>
                            <div className="text-xl font-bold text-slate-800">{formatTime(totalTime)}</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <CheckCircle size={16} className={`text-${theme.primary}-500`} /> 关联任务
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {goalTasks.length === 0 && <p className="text-sm text-slate-400">暂无关联任务</p>}
                            {goalTasks.map(t => (
                                <div key={t.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                    {t.completed ? <CheckCircle size={16} className="text-emerald-500 shrink-0" /> : <Circle size={16} className="text-slate-300 shrink-0" />}
                                    <span className={`text-sm ${t.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-xs text-slate-400">
                            {/* Spacer */}
                        </div>
                        <button
                            onClick={() => {
                                if (confirm('确定要删除这个目标吗？关联的任务将保留但失去关联。')) {
                                    onDelete(goal.id);
                                    onClose();
                                }
                            }}
                            className="text-red-500 text-sm hover:underline flex items-center gap-1"
                        >
                            <Trash2 size={14} /> 删除目标
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
