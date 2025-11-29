import React, { useState } from 'react';
import { ListTodo, CheckCircle, Circle, Flag, Clock, Trash2, Plus, Sun, Moon, Check, Play } from 'lucide-react';
import { Task, Habit, ThemeConfig, Goal, Session } from '../../types';

interface TasksSectionProps {
    tasks: Task[];
    goals: Goal[];
    sessions: Session[];
    habits: Habit[];
    theme: ThemeConfig;
    activeSession: Session | undefined;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onAddTask: (title: string) => void;
    onStartSession: (label: string, taskId?: string) => void;
    onAddHabit: (title: string) => void;
    onToggleCheckIn: (habitId: string) => void;
    setViewingTaskId: (id: string | null) => void;
    setViewingHabitId: (id: string | null) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
    tasks,
    goals,
    sessions,
    habits,
    theme,
    activeSession,
    onToggleTask,
    onDeleteTask,
    onAddTask,
    onStartSession,
    onAddHabit,
    onToggleCheckIn,
    setViewingTaskId,
    setViewingHabitId
}) => {
    const [taskViewMode, setTaskViewMode] = useState<'tasks' | 'checkins'>('tasks');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newHabitTitle, setNewHabitTitle] = useState('');

    // SORTING LOGIC: Uncompleted first (Newest to Oldest), then Completed
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.completed ? 1 : -1;
    });

    const handleAddTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            onAddTask(newTaskTitle);
            setNewTaskTitle('');
        }
    };

    const handleAddHabitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newHabitTitle.trim()) {
            onAddHabit(newHabitTitle);
            setNewHabitTitle('');
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2">
                    {taskViewMode === 'tasks' ? <ListTodo className={`text-${theme.primary}-500`} size={20} /> : <CheckCircle className={`text-${theme.primary}-500`} size={20} />}
                    {taskViewMode === 'tasks' ? '待办事项' : '每日打卡'}
                </h3>
                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                    <button
                        onClick={() => setTaskViewMode('tasks')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${taskViewMode === 'tasks' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        待办
                    </button>
                    <button
                        onClick={() => setTaskViewMode('checkins')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${taskViewMode === 'checkins' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        打卡
                    </button>
                </div>
            </div>

            {taskViewMode === 'tasks' ? (
                <>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {sortedTasks.filter(t => !t.completed).length === 0 && sortedTasks.length > 0 && (
                            <p className="text-slate-400 text-sm text-center py-4">所有任务已完成！干得漂亮。</p>
                        )}
                        {sortedTasks.length === 0 && (
                            <p className="text-slate-400 text-sm text-center py-4">暂无任务。添加一个或咨询你的教练。</p>
                        )}
                        {sortedTasks.map(task => (
                            <div key={task.id} className={`group flex items-center gap-3 p-3 rounded-xl border ${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 shadow-sm'} transition-all hover:shadow-md cursor-pointer`} onClick={() => setViewingTaskId(task.id)}>
                                <button onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }} className={`text-slate-300 hover:text-${theme.primary}-500 transition-colors`}>
                                    {task.completed ? <CheckCircle className="text-emerald-500" size={20} /> : <Circle size={20} />}
                                </button>
                                <div className="flex-1 flex flex-col">
                                    <span className={`text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {task.title}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {task.goalId && (
                                            <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                                                <Flag size={8} /> {goals.find(g => g.id === task.goalId)?.title}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                                            <Clock size={8} /> {Math.floor(sessions.filter(s => s.taskId === task.id).reduce((acc, s) => acc + s.durationSeconds, 0) / 60)}m
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 transition-opacity">
                                    {!task.completed && !activeSession && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStartSession(task.title, task.id);
                                            }}
                                            className={`p-1.5 text-slate-400 hover:text-${theme.primary}-600 hover:bg-${theme.primary}-50 rounded transition-colors`}
                                            title="开始专注"
                                        >
                                            <Play size={14} />
                                        </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleAddTaskSubmit} className="mt-4 flex gap-2">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="添加新任务..."
                            className={`flex-1 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-${theme.primary}-500 focus:bg-white transition-colors`}
                        />
                        <button type="submit" className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                            <Plus size={20} />
                        </button>
                    </form>
                </>
            ) : (
                <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 content-start pr-2 custom-scrollbar">
                        {habits.map(habit => {
                            const isCheckedToday = sessions.some(s =>
                                ((s.habitId === habit.id) ||
                                    (s.label === habit.title) ||
                                    (habit.title.includes('早安') && s.label.includes('早安')) ||
                                    (habit.title.includes('晚安') && s.label.includes('晚安')))
                                && s.startTime.startsWith(new Date().toISOString().split('T')[0])
                            );
                            const totalCheckIns = sessions.filter(s => s.habitId === habit.id || s.label === habit.title).length;

                            return (
                                <div key={habit.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setViewingHabitId(habit.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCheckedToday ? `bg-${theme.primary}-100 text-${theme.primary}-600` : 'bg-slate-100 text-slate-400'}`} style={habit.color ? { backgroundColor: isCheckedToday ? `${habit.color}33` : undefined, color: isCheckedToday ? habit.color : undefined } : {}}>
                                            {habit.icon === 'sun' ? <Sun size={20} /> : habit.icon === 'moon' ? <Moon size={20} /> : <CheckCircle size={20} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${isCheckedToday ? 'text-slate-900' : 'text-slate-600'}`}>{habit.title}</span>
                                            <span className="text-[10px] text-slate-400">已打卡 {totalCheckIns} 天</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onToggleCheckIn(habit.id); }}
                                        className={`p-2 rounded-full transition-colors ${isCheckedToday ? `bg-${theme.primary}-500 text-white` : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                                        style={isCheckedToday && habit.color ? { backgroundColor: habit.color } : {}}
                                    >
                                        <Check size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <form onSubmit={handleAddHabitSubmit} className="mt-4 flex gap-2">
                        <input
                            type="text"
                            value={newHabitTitle}
                            onChange={(e) => setNewHabitTitle(e.target.value)}
                            placeholder="添加新习惯..."
                            className={`flex-1 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-${theme.primary}-500 focus:bg-white transition-colors`}
                        />
                        <button type="submit" className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                            <Plus size={20} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
