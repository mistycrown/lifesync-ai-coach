import React, { useState } from 'react';
import { Task, Goal, Session, ThemeConfig } from '../types';
import { X, Edit2, CheckCircle, Circle, Trash2, Clock, Flag, Calendar, History as HistoryIcon } from 'lucide-react';
import { Select } from './Select';

interface TaskDetailsModalProps {
    task: Task;
    goals: Goal[];
    sessions: Session[];
    theme: ThemeConfig;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
    task,
    goals,
    sessions,
    theme,
    onClose,
    onUpdate,
    onDelete
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editGoalId, setEditGoalId] = useState(task.goalId || '');

    const taskSessions = sessions.filter(s => s.taskId === task.id);
    const totalTime = taskSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const handleSave = () => {
        if (editTitle.trim()) {
            onUpdate(task.id, { title: editTitle, goalId: editGoalId || undefined });
            setIsEditing(false);
        }
    };

    const goalOptions = [
        { label: '无关联目标', value: '' },
        ...goals.map(g => ({ label: g.title, value: g.id }))
    ];

    const currentGoalLabel = editGoalId ? goals.find(g => g.id === editGoalId)?.title : '无关联目标';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3 flex-1">
                        <button onClick={() => onUpdate(task.id, { completed: !task.completed })} className={`transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}`}>
                            {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                        </button>
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        className="w-full text-lg font-bold text-slate-800 border-b border-slate-300 focus:border-indigo-500 outline-none bg-transparent"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        autoFocus
                                    />
                                    <Select
                                        value={currentGoalLabel || '无关联目标'}
                                        onChange={(label) => {
                                            if (label === '无关联目标') {
                                                setEditGoalId('');
                                            } else {
                                                const goal = goals.find(g => g.title === label);
                                                if (goal) setEditGoalId(goal.id);
                                            }
                                        }}
                                        options={goalOptions}
                                        theme={theme}
                                        className="w-full"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} className={`px-2 py-1 bg-${theme.primary}-600 text-white text-xs rounded`}>保存</button>
                                        <button onClick={() => setIsEditing(false)} className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded">取消</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="group">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`text-xl font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</h3>
                                        <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-slate-600 transition-opacity">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                    {task.goalId && (
                                        <div className={`flex items-center gap-1 text-xs mt-1 font-medium text-${goals.find(g => g.id === task.goalId)?.color || theme.primary}-600`}>
                                            <Flag size={12} />
                                            <span>{goals.find(g => g.id === task.goalId)?.title}</span>
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
                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className={`p-3 bg-${theme.primary}-100 text-${theme.primary}-600 rounded-full`}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">累计专注时长</div>
                            <div className="text-xl font-bold text-slate-800">{formatTime(totalTime)}</div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <HistoryIcon size={16} className={`text-${theme.primary}-500`} /> 专注记录
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {taskSessions.length === 0 && <p className="text-sm text-slate-400">暂无专注记录</p>}
                            {taskSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(s => (
                                <div key={s.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                    <span className="text-slate-600">{new Date(s.startTime).toLocaleString()}</span>
                                    <span className="font-mono text-slate-500">{Math.floor(s.durationSeconds / 60)}m</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-xs text-slate-400">
                            创建于 {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        <button
                            onClick={() => {
                                if (confirm('确定要删除这个任务吗？')) {
                                    onDelete(task.id);
                                    onClose();
                                }
                            }}
                            className="text-red-500 text-sm hover:underline flex items-center gap-1"
                        >
                            <Trash2 size={14} /> 删除任务
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
