import React, { useState } from 'react';
import { Flag, Target, CheckCircle, Circle, Calendar, Clock, Trash2, Plus, Palette } from 'lucide-react';
import { Goal, Vision, Task, Session, ThemeConfig } from '../../types';
import { CalendarPopover } from '../Calendar';
import { VisionList } from '../VisionList';
import { Select } from '../Select';

const MORANDI_COLORS = [
    // Morandi Series
    '#E0C8C1', // Muted Pink
    '#D89C7A', // Terracotta
    '#D6C38B', // Mustard
    '#849B91', // Sage
    '#9FB1BC', // Blue Grey
    '#686789', // Muted Purple
    '#A8A29E', // Warm Grey
    '#94A3B8', // Cool Grey

    // Macaron Series
    '#FFB7B2', // Melon
    '#FFDAC1', // Peach
    '#E2F0CB', // Mint
    '#B5EAD7', // Aqua
    '#C7CEEA', // Periwinkle
    '#F8C8DC', // Pastel Pink
    '#FDFD96', // Pastel Yellow
];

interface GoalsSectionProps {
    goals: Goal[];
    visions: Vision[];
    tasks: Task[];
    sessions: Session[];
    theme: ThemeConfig;
    onAddGoal: (title: string, deadline: string, color?: string, visionId?: string) => void;
    onToggleGoal: (id: string) => void;
    onDeleteGoal: (id: string) => void;
    onUpdateGoal: (id: string, title: string, deadline: string) => void;
    onAddVision: (title: string) => void;
    onUpdateVision: (id: string, updates: Partial<Vision>) => void;
    onDeleteVision: (id: string) => void;
    onToggleVisionArchived: (id: string) => void;
    setViewingGoalId: (id: string | null) => void;
    setViewingVisionId: (id: string | null) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
    goals,
    visions,
    tasks,
    sessions,
    theme,
    onAddGoal,
    onToggleGoal,
    onDeleteGoal,
    onUpdateGoal,
    onAddVision,
    onUpdateVision,
    onDeleteVision,
    onToggleVisionArchived,
    setViewingGoalId,
    setViewingVisionId
}) => {
    const [goalsViewMode, setGoalsViewMode] = useState<'goals' | 'visions'>('goals');
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDate, setNewGoalDate] = useState(new Date().toISOString().split('T')[0]);
    const [newGoalColor, setNewGoalColor] = useState<string | undefined>(undefined);
    const [newGoalVisionId, setNewGoalVisionId] = useState<string | undefined>(undefined);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const sortedGoals = [...goals].sort((a, b) => {
        if (a.completed === b.completed) {
            return parseInt(b.id) - parseInt(a.id);
        }
        return a.completed ? 1 : -1;
    });

    const handleAddGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newGoalTitle.trim() && newGoalDate) {
            onAddGoal(newGoalTitle, newGoalDate, newGoalColor, newGoalVisionId);
            setNewGoalTitle('');
            setNewGoalDate(new Date().toISOString().split('T')[0]);
            setNewGoalColor(undefined);
            setNewGoalVisionId(undefined);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2">
                    {goalsViewMode === 'goals' ? <Flag className={`text-${theme.primary}-500`} size={20} /> : <Target className={`text-${theme.primary}-500`} size={20} />}
                    {goalsViewMode === 'goals' ? '中期目标' : '长期愿景'}
                </h3>
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <button
                        onClick={() => setGoalsViewMode('goals')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${goalsViewMode === 'goals' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        目标
                    </button>
                    <button
                        onClick={() => setGoalsViewMode('visions')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${goalsViewMode === 'visions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        愿景
                    </button>
                </div>
            </div>

            {goalsViewMode === 'goals' ? (
                <>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {sortedGoals.length === 0 && (
                            <p className="text-slate-400 text-sm text-center py-4">暂无目标。心怀梦想，脚踏实地！</p>
                        )}
                        {sortedGoals.map(goal => (
                            <div
                                key={goal.id}
                                className={`group flex items-center gap-3 p-3 rounded-xl border ${goal.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 shadow-sm'} transition-all hover:shadow-md cursor-pointer relative overflow-hidden`}
                                onClick={() => setViewingGoalId(goal.id)}
                            >
                                {/* Color Bar Indicator */}
                                {goal.color && (
                                    <div
                                        className="absolute left-0 top-0 bottom-0 w-1"
                                        style={{ backgroundColor: goal.color }}
                                    />
                                )}

                                <button onClick={(e) => { e.stopPropagation(); onToggleGoal(goal.id); }} className={`ml-2 text-slate-300 hover:text-${theme.primary}-500 transition-colors`}>
                                    {goal.completed ? <CheckCircle className="text-emerald-500" size={20} /> : <Circle size={20} />}
                                </button>

                                <div className="flex-1 flex flex-col">
                                    <span className={`text-sm ${goal.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {goal.title}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1 whitespace-nowrap">
                                            <Calendar size={8} /> {new Date(goal.deadline).toLocaleDateString()}
                                        </span>
                                        {goal.visionId && (
                                            <span className="text-[10px] text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1 whitespace-nowrap">
                                                <Target size={8} />
                                                {visions.find(v => v.id === goal.visionId)?.title || '未知愿景'}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1 whitespace-nowrap">
                                            <Clock size={8} />
                                            {Math.floor(
                                                sessions.filter(s => {
                                                    const task = tasks.find(t => t.id === s.taskId);
                                                    return task && task.goalId === goal.id;
                                                }).reduce((acc, s) => acc + s.durationSeconds, 0) / 60
                                            )}m
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-1 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleAddGoalSubmit} className="mt-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newGoalTitle}
                                onChange={(e) => setNewGoalTitle(e.target.value)}
                                placeholder="目标..."
                                className={`flex-1 min-w-[80px] bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-${theme.primary}-500 focus:bg-white transition-colors`}
                            />
                            <div className="shrink-0">
                                <CalendarPopover value={newGoalDate} onChange={setNewGoalDate} theme={theme} placement="top" align="right" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <Select
                                    value={visions.find(v => v.id === newGoalVisionId)?.title || ''}
                                    onChange={(title) => {
                                        const vision = visions.find(v => v.title === title);
                                        if (vision) setNewGoalVisionId(vision.id);
                                    }}
                                    options={visions.map(v => ({ label: v.title, value: v.id }))}
                                    theme={theme}
                                    placeholder="关联愿景（可选）"
                                />
                            </div>
                            <div className="relative shrink-0">
                                <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors" style={{ backgroundColor: newGoalColor }}>
                                    {!newGoalColor && <Palette size={16} className="text-slate-400" />}
                                </button>
                                {showColorPicker && (
                                    <>
                                        <div className="fixed inset-0 z-0" onClick={() => setShowColorPicker(false)} />
                                        <div className="absolute bottom-full right-0 mb-2 p-3 bg-white rounded-xl shadow-xl border border-slate-100 z-10 w-40 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="grid grid-cols-4 gap-1 mb-2">
                                                {MORANDI_COLORS.map(c => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => { setNewGoalColor(c); setShowColorPicker(false); }}
                                                        style={{ backgroundColor: c }}
                                                        className="w-7 h-7 rounded-full hover:scale-110 transition-transform"
                                                    />
                                                ))}
                                            </div>
                                            <div className="border-t border-slate-100 pt-2 mt-1">
                                                <label className="text-[10px] text-slate-500 mb-1 block">自定义颜色</label>
                                                <input
                                                    type="text"
                                                    placeholder="#RRGGBB"
                                                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const value = e.currentTarget.value.trim();
                                                            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                                                                setNewGoalColor(value);
                                                                setShowColorPicker(false);
                                                            }
                                                        }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <p className="text-[9px] text-slate-400 mt-0.5">回车确认</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <button type="submit" className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors shrink-0">
                                <Plus size={20} />
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <VisionList
                    visions={visions}
                    theme={theme}
                    onAddVision={onAddVision}
                    onUpdateVision={onUpdateVision}
                    onDeleteVision={onDeleteVision}
                    onToggleVisionArchived={onToggleVisionArchived}
                    onViewVision={setViewingVisionId}
                    goals={goals}
                    tasks={tasks}
                    sessions={sessions}
                />
            )}
        </div>
    );
};
