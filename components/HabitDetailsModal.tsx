import React, { useState } from 'react';
import { Session, ThemeConfig } from '../types';
import { X, Edit2, Sun, Moon, CheckCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const MORANDI_COLORS = [
    '#e8d3c0', // Warm Beige
    '#d89c7a', // Warm Brown/Orange
    '#d6c38b', // Warm Yellow
    '#849b91', // Greyish Green
    '#c2cedc', // Cool Grey/Blue
    '#686789', // Cool Grey/Purple
];

interface HabitDetailsModalProps {
    habit: any;
    sessions: Session[];
    theme: ThemeConfig;
    onClose: () => void;
    onDeleteHabit: (id: string) => void;
    onUpdateHabit: (id: string, updates: any) => void;
    onToggleCheckIn: (habitId: string, date?: string) => void;
}

export const HabitDetailsModal: React.FC<HabitDetailsModalProps> = ({
    habit,
    sessions,
    theme,
    onClose,
    onDeleteHabit,
    onUpdateHabit,
    onToggleCheckIn
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(habit.title);
    const [editColor, setEditColor] = useState(habit.color || MORANDI_COLORS[0]);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const totalCheckIns = sessions.filter(s => s.habitId === habit.id).length;

    const handleSave = () => {
        if (editTitle.trim()) {
            onUpdateHabit(habit.id, { title: editTitle, color: editColor });
            setIsEditing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 bg-${theme.primary}-100 text-${theme.primary}-600 rounded-xl`} style={habit.color ? { backgroundColor: `${habit.color}33`, color: habit.color } : {}}>
                            {habit.icon === 'sun' ? <Sun size={24} /> : habit.icon === 'moon' ? <Moon size={24} /> : <CheckCircle size={24} />}
                        </div>
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        className="w-full text-xl font-bold font-serif text-slate-800 border-b border-slate-300 focus:border-indigo-500 outline-none bg-transparent"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="flex gap-1 flex-wrap">
                                        {MORANDI_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setEditColor(c)}
                                                style={{ backgroundColor: c }}
                                                className={`w-5 h-5 rounded-full hover:scale-110 transition-transform ${editColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                            />
                                        ))}
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
                                <div className="group flex items-center gap-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800" style={habit.color ? { color: habit.color } : {}}>{habit.title}</h3>
                                        <p className="text-sm text-slate-500">累计打卡 {totalCheckIns} 天</p>
                                    </div>
                                    <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-slate-600 transition-opacity">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20} /></button>
                        <span className="font-bold text-lg text-slate-700">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                            <div key={d} className="text-center text-sm text-slate-400 font-medium py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const isChecked = sessions.some(s => s.habitId === habit.id && s.startTime.startsWith(dateStr));
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            const isFuture = new Date(dateStr) > new Date();

                            return (
                                <button
                                    key={day}
                                    disabled={isFuture}
                                    onClick={() => onToggleCheckIn(habit.id, dateStr)}
                                    className={`
                              aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all relative
                              ${isChecked
                                            ? `text-white shadow-md`
                                            : isToday
                                                ? `border-2 border-slate-300 bg-white text-slate-600`
                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }
                              ${isFuture ? 'opacity-30 cursor-not-allowed' : ''}
                            `}
                                    style={isChecked ? { backgroundColor: habit.color || '#6366f1' } : {}}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex justify-between items-center">
                        <button
                            onClick={() => {
                                if (confirm('确定要删除这个打卡习惯吗？历史记录也会被删除。')) {
                                    onDeleteHabit(habit.id);
                                    onClose();
                                }
                            }}
                            className="text-red-500 text-sm hover:underline flex items-center gap-1"
                        >
                            <Trash2 size={14} /> 删除习惯
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
