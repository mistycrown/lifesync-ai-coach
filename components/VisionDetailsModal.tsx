import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Vision, Goal, Session, Task, ThemeConfig } from '../types';
import { X, Clock, Target, Calendar, Edit2, Archive, CheckCircle, Circle } from 'lucide-react';

interface VisionDetailsModalProps {
    vision: Vision;
    goals: Goal[];
    tasks: Task[];
    sessions: Session[];
    theme: ThemeConfig;
    onClose: () => void;
    onUpdateVision: (id: string, updates: Partial<Vision>) => void;
    onDeleteVision: (id: string) => void;
    onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
}

export const VisionDetailsModal: React.FC<VisionDetailsModalProps> = ({
    vision,
    goals,
    tasks,
    sessions,
    theme,
    onClose,
    onUpdateVision,
    onDeleteVision,
    onUpdateGoal
}) => {
    // 1. Filter Linked Goals
    const linkedGoals = goals.filter(g => g.visionId === vision.id);
    const linkedGoalIds = new Set(linkedGoals.map(g => g.id));

    // 2. Filter Linked Tasks (via Goals)
    const linkedTasks = tasks.filter(t => t.goalId && linkedGoalIds.has(t.goalId));
    const linkedTaskIds = new Set(linkedTasks.map(t => t.id));

    // 3. Filter Sessions (via Tasks)
    const relevantSessions = sessions.filter(s => s.taskId && linkedTaskIds.has(s.taskId));

    // 4. Calculate Stats
    const totalSeconds = relevantSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const progress10k = Math.min(100, (totalHours / 10000) * 100); // 10,000 hours rule

    // State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(vision.title);
    const [heatmapDays, setHeatmapDays] = useState(270); // Default 9 months
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    // 5. Heatmap Data (Dynamic days - GitHub Style)
    const getHeatmapData = () => {
        const today = new Date();
        const data: { date: string; seconds: number }[] = [];
        // Generate data for selected number of days
        for (let i = heatmapDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const daySeconds = relevantSessions
                .filter(s => s.startTime.startsWith(dateStr))
                .reduce((acc, s) => acc + s.durationSeconds, 0);
            data.push({ date: dateStr, seconds: daySeconds });
        }
        return data;
    };
    const heatmapData = getHeatmapData();

    // Group by weeks for vertical display (GitHub style)
    const weeks: { date: string; seconds: number }[][] = [];
    let currentWeek: { date: string; seconds: number }[] = [];

    // Pad the beginning if the first day is not Sunday
    const firstDay = new Date(heatmapData[0].date);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push({ date: '', seconds: 0 }); // Placeholder
    }

    heatmapData.forEach(day => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        // Pad the end to complete the week
        while (currentWeek.length < 7) {
            currentWeek.push({ date: '', seconds: 0 });
        }
        weeks.push(currentWeek);
    }

    const handleSave = () => {
        if (editTitle.trim()) {
            onUpdateVision(vision.id, { title: editTitle });
            setIsEditing(false);
        }
    };

    const getColorClass = (seconds: number) => {
        if (seconds === 0) return 'bg-slate-100';
        if (seconds < 1800) return `bg-${theme.primary}-200`; // < 30m
        if (seconds < 3600) return `bg-${theme.primary}-300`; // < 1h
        if (seconds < 7200) return `bg-${theme.primary}-400`; // < 2h
        if (seconds < 14400) return `bg-${theme.primary}-500`; // < 4h
        return `bg-${theme.primary}-600`; // > 4h
    };

    const getDaysLabel = () => {
        if (heatmapDays <= 90) return '3个月';
        if (heatmapDays <= 180) return '6个月';
        if (heatmapDays <= 270) return '9个月';
        return '12个月';
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                    <div className="flex-1 mr-4">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    className={`w-full text-2xl font-bold font-serif text-slate-800 border-b-2 border-${theme.primary}-200 focus:border-${theme.primary}-500 focus:outline-none bg-transparent`}
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className={`px-3 py-1 bg-${theme.primary}-600 text-white text-xs rounded hover:bg-${theme.primary}-700`}>保存</button>
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded hover:bg-slate-200">取消</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-2 group">
                                    <h2 className="text-2xl font-bold font-serif text-slate-800">{vision.title}</h2>
                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                        <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100" title="编辑">
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                onUpdateVision(vision.id, { archived: !vision.archived });
                                                onClose();
                                            }}
                                            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                                            title={vision.archived ? "恢复" : "归档"}
                                        >
                                            <Archive size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                    <span>创建于 {new Date(vision.createdAt).toLocaleDateString()}</span>
                                    <span>{linkedGoals.length} 个关联目标</span>
                                    <span>{linkedTasks.length} 个关联任务</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* 1. 10k Hours Progress */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <div className="flex justify-between items-end mb-2">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Clock size={18} className={`text-${theme.primary}-500`} /> 一万小时定律</h3>
                            <span className="text-2xl font-mono font-bold text-slate-800">{totalHours} <span className="text-sm text-slate-400 font-normal">/ 10,000 小时</span></span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-${theme.primary}-500 transition-all duration-1000 ease-out`}
                                style={{ width: `${Math.max(0.5, progress10k)}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-right">已完成 {progress10k.toFixed(2)}%</p>
                    </div>

                    {/* 2. Heatmap */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2"><Calendar size={18} className={`text-${theme.primary}-500`} /> 专注热力图 (近{getDaysLabel()})</h3>
                            <div className="flex gap-1">
                                {[90, 180, 270, 365].map(days => (
                                    <button
                                        key={days}
                                        onClick={() => setHeatmapDays(days)}
                                        className={`px-2 py-1 text-xs rounded transition-colors ${heatmapDays === days ? `bg-${theme.primary}-600 text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        {days <= 90 ? '3月' : days <= 180 ? '6月' : days <= 270 ? '9月' : '12月'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-start gap-1 justify-center">
                            {/* Weekday Labels */}
                            <div className="flex flex-col gap-1 text-xs text-slate-400 pr-1">
                                <div className="h-3 flex items-center">S</div>
                                <div className="h-3 flex items-center">M</div>
                                <div className="h-3 flex items-center">T</div>
                                <div className="h-3 flex items-center">W</div>
                                <div className="h-3 flex items-center">T</div>
                                <div className="h-3 flex items-center">F</div>
                                <div className="h-3 flex items-center">S</div>
                            </div>
                            {/* Heatmap Grid */}
                            <div className="flex gap-1 overflow-x-auto custom-scrollbar p-1">
                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-1">
                                        {week.map((day, dayIndex) => (
                                            day.date ? (
                                                <div
                                                    key={day.date}
                                                    className={`w-3 h-3 rounded-sm ${getColorClass(day.seconds)} cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-${theme.primary}-400 transition-all`}
                                                    onMouseEnter={(e) => {
                                                        setTooltip({
                                                            x: e.clientX + 10,
                                                            y: e.clientY + 10,
                                                            content: `${new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}: ${Math.floor(day.seconds / 3600)}小时${Math.floor((day.seconds % 3600) / 60)}分钟`
                                                        });
                                                    }}
                                                    onMouseLeave={() => setTooltip(null)}
                                                />
                                            ) : (
                                                <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3 h-3" />
                                            )
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Custom Tooltip Portal */}
                    {tooltip && createPortal(
                        <div
                            className="fixed z-[70] bg-white border border-slate-200 rounded-lg shadow-xl px-3 py-2 text-xs text-slate-700 pointer-events-none"
                            style={{ left: tooltip.x, top: tooltip.y }}
                        >
                            {tooltip.content}
                        </div>,
                        document.body
                    )}

                    {/* 3. Linked Goals */}
                    <div>
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Target size={18} className={`text-${theme.primary}-500`} /> 关联目标</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {linkedGoals.length === 0 && (
                                <p className="text-slate-400 text-sm col-span-2 italic">暂无关联目标。</p>
                            )}
                            {linkedGoals.map(goal => (
                                <div key={goal.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex items-start gap-3">
                                    <div className={`mt-1 ${goal.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                                        {goal.completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-medium ${goal.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{goal.title}</h4>
                                        <p className="text-xs text-slate-400 mt-1">截止: {new Date(goal.deadline).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
