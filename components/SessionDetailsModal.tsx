import React, { useState, useEffect } from 'react';
import { Session, Task, ThemeConfig } from '../types';
import { X, Clock } from 'lucide-react';

interface SessionDetailsModalProps {
    session: Session | null;
    tasks: Task[];
    theme: ThemeConfig;
    onClose: () => void;
    onUpdateSession: (id: string, label: string, startTime: string, endTime: string, taskId?: string) => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
    session,
    tasks,
    theme,
    onClose,
    onUpdateSession
}) => {
    const [editLabel, setEditLabel] = useState('');
    const [editStart, setEditStart] = useState('');
    const [editEnd, setEditEnd] = useState('');
    const [editTaskId, setEditTaskId] = useState('');

    useEffect(() => {
        if (session) {
            setEditLabel(session.label);
            setEditStart(session.startTime);
            setEditEnd(session.endTime || session.startTime);
            setEditTaskId(session.taskId || '');
        }
    }, [session]);

    if (!session) return null;

    const handleSave = () => {
        onUpdateSession(session.id, editLabel, editStart, editEnd, editTaskId || undefined);
        onClose();
    };

    const isCheckin = session.type === 'checkin';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">编辑专注记录</h3>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" size={20} /></button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">内容</label>
                        <input
                            value={editLabel}
                            onChange={e => setEditLabel(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">开始时间</label>
                            <input
                                type="datetime-local"
                                value={editStart.slice(0, 16)}
                                onChange={e => setEditStart(new Date(e.target.value).toISOString())}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">结束时间</label>
                            <input
                                type="datetime-local"
                                value={editEnd ? editEnd.slice(0, 16) : ''}
                                onChange={e => setEditEnd(new Date(e.target.value).toISOString())}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    {!isCheckin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">关联任务</label>
                            <select
                                value={editTaskId || ''}
                                onChange={e => setEditTaskId(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="">-- 无关联 --</option>
                                {tasks.filter(t => !t.completed).map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button onClick={onClose} className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">取消</button>
                        <button
                            onClick={handleSave}
                            className={`px-4 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700 text-sm font-medium`}
                        >
                            保存修改
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
