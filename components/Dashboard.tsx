import React, { useState, useEffect } from 'react';
import { CalendarPopover } from './Calendar';
import { TimePicker } from './TimePicker';
import { WeeklyTimeline } from './WeeklyTimeline';
import { Play, Square, CheckCircle, Circle, Clock, Calendar, Trash2, Plus, Flag, ListTodo, FileText, Edit2, Save, X, Loader2, ChevronDown, ChevronRight, Check, History, ChevronLeft, Sun, Moon, ScrollText, Palette, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AppState, Session, Task, Goal, DailyReport, ThemeConfig, DashboardProps, Vision } from '../types';
import { VisionList } from './VisionList';
import { VisionDetailsModal } from './VisionDetailsModal';
import { SessionDetailsModal } from './SessionDetailsModal';
import { ReportDetailsModal } from './ReportDetailsModal';
import { HabitDetailsModal } from './HabitDetailsModal';

const MORANDI_COLORS = [
  '#e8d3c0', // Warm Beige
  '#d89c7a', // Warm Brown/Orange
  '#d6c38b', // Warm Yellow
  '#849b91', // Greyish Green
  '#c2cedc', // Cool Grey/Blue
  '#686789', // Cool Grey/Purple
];

const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  goals,
  visions,
  sessions,
  reports,
  activeSessionId,
  theme,
  onToggleTask,
  onDeleteTask,
  onAddTask,

  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  onUpdateGoal,

  onAddVision,
  onUpdateVision,
  onDeleteVision,
  onToggleVisionArchived,

  onStartSession,
  onStopSession,
  onAddSession,
  onUpdateSession,
  onUpdateTask,

  onRenameSession,
  onDeleteSession,

  onGenerateReport,
  onSaveReport,
  onUpdateReport,
  onDeleteReport,
  onCheckIn,
  habits,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onToggleCheckIn,

  // Navigation Props
  viewingTaskId: propViewingTaskId,
  setViewingTaskId: propSetViewingTaskId,
  viewingGoalId: propViewingGoalId,
  setViewingGoalId: propSetViewingGoalId,
  viewingVisionId: propViewingVisionId,
  setViewingVisionId: propSetViewingVisionId,
  viewingReportId: propViewingReportId,
  setViewingReportId: propSetViewingReportId,
  viewingSessionId: propViewingSessionId,
  setViewingSessionId: propSetViewingSessionId,
  viewingHabitId: propViewingHabitId,
  setViewingHabitId: propSetViewingHabitId,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [newGoalColor, setNewGoalColor] = useState<string | undefined>(undefined);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [sessionLabel, setSessionLabel] = useState('');
  const [activeLabelEdit, setActiveLabelEdit] = useState('');
  const [isEditingActiveLabel, setIsEditingActiveLabel] = useState(false);

  // Habit State
  const [viewingHabitId, setViewingHabitId] = useState<string | null>(null);

  const [newHabitTitle, setNewHabitTitle] = useState('');

  // Log Filtering
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logViewMode, setLogViewMode] = useState<'list' | 'week'>('list');
  const [taskViewMode, setTaskViewMode] = useState<'tasks' | 'checkins'>('tasks');

  // Manual Add Session State
  const [showAddLog, setShowAddLog] = useState(false);
  const [manualLogLabel, setManualLogLabel] = useState('');
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const [manualLogStart, setManualLogStart] = useState(getCurrentDateTimeLocal());
  const [manualLogDuration, setManualLogDuration] = useState('30');
  const [manualLogTaskId, setManualLogTaskId] = useState('');

  // Edit Session State
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editSessionLabel, setEditSessionLabel] = useState('');
  const [editSessionStart, setEditSessionStart] = useState('');
  const [editSessionEnd, setEditSessionEnd] = useState('');
  const [editSessionTaskId, setEditSessionTaskId] = useState('');


  // Quick Task Link Edit
  const [editingTaskLinkSessionId, setEditingTaskLinkSessionId] = useState<string | null>(null);

  // Goal Editing State
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalDate, setEditGoalDate] = useState('');

  // Details View State
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [viewingGoalId, setViewingGoalId] = useState<string | null>(null);

  // Report States
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{ title: string, content: string } | null>(null);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);

  // Vision State
  const [goalsViewMode, setGoalsViewMode] = useState<'goals' | 'visions'>('goals');
  const [viewingVisionId, setViewingVisionId] = useState<string | null>(null);

  // Sync Props to Internal State
  useEffect(() => {
    if (propViewingTaskId !== undefined) setViewingTaskId(propViewingTaskId);
  }, [propViewingTaskId]);

  useEffect(() => {
    if (propViewingGoalId !== undefined) setViewingGoalId(propViewingGoalId);
  }, [propViewingGoalId]);

  useEffect(() => {
    if (propViewingVisionId !== undefined) setViewingVisionId(propViewingVisionId);
  }, [propViewingVisionId]);

  useEffect(() => {
    if (propViewingReportId !== undefined) setViewingReportId(propViewingReportId);
  }, [propViewingReportId]);

  useEffect(() => {
    if (propViewingSessionId !== undefined && propViewingSessionId !== null) {
      const sessionToEdit = sessions.find(s => s.id === propViewingSessionId);
      if (sessionToEdit) startEditingSession(sessionToEdit);
    }
  }, [propViewingSessionId, sessions]);

  useEffect(() => {
    if (propViewingHabitId !== undefined) setViewingHabitId(propViewingHabitId);
  }, [propViewingHabitId]);

  // Intercept Close Actions to update Props
  const handleCloseTask = () => {
    setViewingTaskId(null);
    if (propSetViewingTaskId) propSetViewingTaskId(null);
  };

  const handleCloseGoal = () => {
    setViewingGoalId(null);
    if (propSetViewingGoalId) propSetViewingGoalId(null);
  };

  const handleCloseVision = () => {
    setViewingVisionId(null);
    if (propSetViewingVisionId) propSetViewingVisionId(null);
  };

  const handleCloseReport = () => {
    setViewingReportId(null);
    if (propSetViewingReportId) propSetViewingReportId(null);
  };

  const handleCloseSession = () => {
    setEditingSession(null);
    if (propSetViewingSessionId) propSetViewingSessionId(null);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeSession) {
      const start = new Date(activeSession.startTime).getTime();
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter sessions by date
  const filteredSessions = sessions.filter(s =>
    s.endTime !== null && new Date(s.startTime).toLocaleDateString() === new Date(logDate).toLocaleDateString()
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // SORTING LOGIC: Uncompleted first (Newest to Oldest), then Completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      // If both same status, newest created first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // Completed items go to bottom
    return a.completed ? 1 : -1;
  });

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.completed === b.completed) {
      // Goals don't have createdAt, use ID (assuming timestamp based) or deadline
      // Using ID desc for newest added first assumption
      return parseInt(b.id) - parseInt(a.id);
    }
    return a.completed ? 1 : -1;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalTitle.trim() && newGoalDate) {
      onAddGoal(newGoalTitle, newGoalDate, newGoalColor);
      setNewGoalTitle('');
      setNewGoalDate(new Date().toISOString().split('T')[0]);
      setNewGoalColor(undefined);
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitTitle.trim()) {
      onAddHabit(newHabitTitle);
      setNewHabitTitle('');
    }
  };



  const [customCheckInLabel, setCustomCheckInLabel] = useState('');
  const [showCustomCheckIn, setShowCustomCheckIn] = useState(false);

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCheckInLabel.trim()) {
      onCheckIn('custom', customCheckInLabel);
      setCustomCheckInLabel('');
      setShowCustomCheckIn(false);
    }
  };

  const handleManualLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualLogLabel && manualLogStart && manualLogDuration) {
      const durationSec = parseInt(manualLogDuration) * 60;
      onAddSession(manualLogLabel, new Date(manualLogStart).toISOString(), durationSec, manualLogTaskId || undefined);
      setShowAddLog(false);
      setManualLogLabel('');
      setManualLogDuration('30');
      setManualLogTaskId('');
      setManualLogStart(getCurrentDateTimeLocal());
    }
  }

  // --- Session Edit Handlers ---
  const startEditingSession = (session: Session) => {
    setEditingSession(session);
    setEditSessionLabel(session.label);
    setEditSessionTaskId(session.taskId || '');
    const toLocalISO = (isoStr: string) => {
      const d = new Date(isoStr);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return d.toISOString().slice(0, 16);
    };
    setEditSessionStart(toLocalISO(session.startTime));
    setEditSessionEnd(session.endTime ? toLocalISO(session.endTime) : '');
  };


  const startEditingGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditGoalTitle(goal.title);
    setEditGoalDate(goal.deadline);
  };

  const saveEditingGoal = () => {
    if (editingGoalId && editGoalTitle.trim() && editGoalDate) {
      onUpdateGoal(editingGoalId, editGoalTitle, editGoalDate);
      setEditingGoalId(null);
    }
  };

  // Report Handlers
  const handleGenerateClick = async () => {
    setIsGeneratingReport(true);
    // Pass the logDate to allow generating reports for selected date
    const data = await onGenerateReport(logDate);
    setGeneratedReport(data);
    setIsGeneratingReport(false);
  };

  const handleSaveNewReport = () => {
    if (generatedReport && generatedReport.content.trim()) {
      // Pass the logDate to save correct date
      // We need to append the time to avoid timezone issues, or just use ISO string
      // Let's assume end of day for that report date
      const dateToSave = new Date(logDate);
      dateToSave.setHours(23, 59, 59, 999);

      onSaveReport(generatedReport.title, generatedReport.content, dateToSave.toISOString());
      setGeneratedReport(null);
    }
  };







  const changeDate = (days: number) => {
    const date = new Date(logDate);
    date.setDate(date.getDate() + days);
    setLogDate(date.toISOString().split('T')[0]);
  };

  // Logic to determine if we should show the generate button for the selected date
  // We check if there is ALREADY a report for the selected logDate
  const reportForSelectedDate = reports.find(r =>
    new Date(r.date).toDateString() === new Date(logDate).toDateString()
  );

  const isToday = new Date(logDate).toDateString() === new Date().toDateString();

  return (
    <div className="p-6 h-full overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 custom-scrollbar pb-20">

      {/* 1. Timer / Active Work */}
      <div className={`bg-white rounded-3xl p-8 shadow-float border border-white/50 col-span-1 lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6 transition-all`}>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
            <Clock className={`text-${theme.primary}-500`} /> 专注
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {activeSession ? (
              isEditingActiveLabel ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    autoFocus
                    className={`bg-white border border-${theme.primary}-200 rounded px-2 py-0.5 text-sm text-slate-700 focus:outline-none focus:border-${theme.primary}-500`}
                    value={activeLabelEdit}
                    onChange={(e) => setActiveLabelEdit(e.target.value)}
                    onBlur={() => {
                      if (activeLabelEdit.trim() && activeSession) {
                        onRenameSession(activeSession.id, activeLabelEdit);
                      }
                      setIsEditingActiveLabel(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (activeLabelEdit.trim() && activeSession) {
                          onRenameSession(activeSession.id, activeLabelEdit);
                        }
                        setIsEditingActiveLabel(false);
                      }
                    }}
                  />
                </div>
              ) : (
                <div
                  className="group flex items-center gap-2 cursor-pointer mt-1"
                  onClick={() => {
                    setActiveLabelEdit(activeSession.label);
                    setIsEditingActiveLabel(true);
                  }}
                >
                  <span className="text-slate-500 text-sm">当前正在进行: <span className="font-medium text-slate-700 border-b border-transparent group-hover:border-slate-300 transition-colors">{activeSession.label}</span></span>
                  <Edit2 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )
            ) : '准备好开始新的工作了吗？'}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-5xl font-mono font-bold text-slate-800 tracking-wider">
            {formatTime(elapsed)}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {!activeSession ? (
            <div className="flex gap-2 w-full">
              <input
                type="text"
                placeholder="专注内容..."
                className={`bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-${theme.primary}-500 w-full`}
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
              />
              <button
                onClick={() => {
                  onStartSession(sessionLabel || '日常工作');
                  setSessionLabel('');
                }}
                className={`bg-${theme.primary}-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-${theme.primary}-700 transition-colors flex items-center gap-2 whitespace-nowrap shadow-lg shadow-${theme.primary}-200`}
              >
                <Play size={18} /> 开始
              </button>
            </div>
          ) : (
            <button
              onClick={onStopSession}
              className="bg-red-50 text-red-600 border border-red-200 px-6 py-2 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center gap-2 w-full md:w-auto justify-center"
            >
              <Square size={18} /> 结束
            </button>
          )}
        </div>
      </div>

      {/* 2. Tasks & Check-ins */}
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <form onSubmit={handleAddTask} className="mt-4 flex gap-2">
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
            <form onSubmit={handleAddHabit} className="mt-4 flex gap-2">
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

      {/* 3. Goals & Visions */}
      <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 flex flex-col h-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2">
            {goalsViewMode === 'goals' ? <Flag className={`text-${theme.primary}-500`} size={20} /> : <Target className={`text-${theme.primary}-500`} size={20} />}
            {goalsViewMode === 'goals' ? '目标与截止日期' : '长期愿景'}
          </h3>
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button
              onClick={() => setGoalsViewMode('goals')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${goalsViewMode === 'goals' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              短期目标
            </button>
            <button
              onClick={() => setGoalsViewMode('visions')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${goalsViewMode === 'visions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              长期愿景
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                        <Calendar size={8} /> {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 flex items-center gap-1">
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

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddGoal} className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="目标..."
                className={`flex-1 min-w-[80px] bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-${theme.primary}-500 focus:bg-white transition-colors`}
              />
              <div className="shrink-0">
                <CalendarPopover value={newGoalDate} onChange={setNewGoalDate} theme={theme} placement="top" />
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

      {/* 4. History Log */}
      <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 col-span-1 lg:col-span-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2"><History className={`text-${theme.primary}-500`} size={20} /> 活动日志</h3>
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setLogViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${logViewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              列表
            </button>
            <button
              onClick={() => setLogViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${logViewMode === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              周视图
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => changeDate(logViewMode === 'week' ? -7 : -1)}
              className={`p-1.5 text-slate-500 hover:bg-white hover:text-${theme.primary}-600 rounded-lg transition-colors`}
              title={logViewMode === 'week' ? "上一周" : "前一天"}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="relative">
              <CalendarPopover value={logDate} onChange={setLogDate} theme={theme} variant="full" />
            </div>
            <button
              onClick={() => setLogDate(new Date().toISOString().split('T')[0])}
              className={`text-xs px-2 py-1 text-slate-500 hover:text-${theme.primary}-600 font-medium hover:bg-white rounded-lg transition-colors`}
            >
              今天
            </button>
            <button
              onClick={() => changeDate(logViewMode === 'week' ? 7 : 1)}
              className={`p-1.5 text-slate-500 hover:bg-white hover:text-${theme.primary}-600 rounded-lg transition-colors`}
              title={logViewMode === 'week' ? "下一周" : "后一天"}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => {
              setManualLogStart(getCurrentDateTimeLocal());
              setShowAddLog(true);
            }}
            className={`bg-${theme.primary}-50 hover:bg-${theme.primary}-100 text-${theme.primary}-600 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ml-auto sm:ml-0`}
          >
            + 补录记录
          </button>
        </div>



        {/* Backfill Modal */}
        {showAddLog && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-lg mb-4 text-slate-800">补录活动记录</h3>
              <form onSubmit={handleManualLogSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">内容</label>
                  <input
                    required
                    className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                    value={manualLogLabel}
                    onChange={(e) => setManualLogLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">开始时间</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <CalendarPopover
                        value={manualLogStart.split('T')[0]}
                        onChange={(date) => {
                          const time = manualLogStart.split('T')[1] || '00:00';
                          setManualLogStart(`${date}T${time}`);
                        }}
                        theme={theme}
                      />
                    </div>
                    <div className="w-32">
                      <TimePicker
                        value={manualLogStart.split('T')[1] || '00:00'}
                        onChange={(time) => {
                          const date = manualLogStart.split('T')[0];
                          setManualLogStart(`${date}T${time}`);
                        }}
                        theme={theme}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">时长 (分钟)</label>
                  <input
                    required
                    type="number"
                    className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                    value={manualLogDuration}
                    onChange={(e) => setManualLogDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">关联待办 (可选)</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setManualLogTaskId(manualLogTaskId ? '' : 'SHOW_SELECT')}
                      className="w-full text-left border border-slate-200 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all hover:border-slate-300 flex items-center justify-between"
                    >
                      <span>{manualLogTaskId && manualLogTaskId !== 'SHOW_SELECT' ? tasks.find(t => t.id === manualLogTaskId)?.title : '-- 无关联 --'}</span>
                      <ChevronDown size={18} className="text-slate-400" />
                    </button>
                    {manualLogTaskId === 'SHOW_SELECT' && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setManualLogTaskId('')} />
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm text-slate-500 border-b border-slate-100"
                            onClick={() => setManualLogTaskId('')}
                          >
                            -- 无关联 --
                          </button>
                          {tasks.filter(t => !t.completed).map(t => (
                            <button
                              key={t.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 last:border-b-0 transition-colors"
                              onClick={() => setManualLogTaskId(t.id)}
                            >
                              {t.title}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setShowAddLog(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">取消</button>
                  <button type="submit" className={`px-3 py-1.5 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700`}>保存</button>
                </div>
              </form>
            </div>
          </div>
        )}



        {logViewMode === 'week' ? (
          <WeeklyTimeline
            sessions={sessions}
            currentDate={logDate}
            tasks={tasks}
            goals={goals}
            theme={theme}
            onSessionClick={startEditingSession}
            onSessionUpdate={(id, start, end) => {
              const session = sessions.find(s => s.id === id);
              if (session) {
                onUpdateSession(id, session.label, start, end, session.taskId);
              }
            }}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">类型</th>
                  <th className="px-4 py-3 font-medium">描述</th>
                  <th className="px-4 py-3 font-medium">关联待办</th>
                  <th className="px-4 py-3 font-medium">时间 / 时长</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      {logDate === new Date().toISOString().split('T')[0] ? "今天还没有记录，开始第一个番茄钟吧。" : "该日期无记录。"}
                    </td>
                  </tr>
                )}
                {filteredSessions.map(session => {
                  const isMorning = session.label.includes('早安');
                  const isNight = session.label.includes('晚安');

                  return (
                    <tr key={session.id} className={`hover:bg-slate-50 group transition-colors ${isMorning ? 'bg-amber-50/30' : ''} ${isNight ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        {isMorning ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Sun size={12} className="mr-1" /> 早安
                          </span>
                        ) : isNight ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            <Moon size={12} className="mr-1" /> 晚安
                          </span>
                        ) : session.type === 'checkin' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle size={12} className="mr-1" /> 打卡
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${theme.primary}-50 text-${theme.primary}-700`}>
                            专注会话
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{session.label}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        <div className="relative">
                          {editingTaskLinkSessionId === session.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setEditingTaskLinkSessionId(null)}
                              />
                              <div className="absolute left-0 top-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden min-w-[200px] max-h-48 overflow-y-auto custom-scrollbar">
                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm text-slate-500 border-b border-slate-100"
                                  onClick={() => {
                                    onUpdateSession(
                                      session.id,
                                      session.label,
                                      session.startTime,
                                      session.endTime || session.startTime,
                                      undefined
                                    );
                                    setEditingTaskLinkSessionId(null);
                                  }}
                                >
                                  -- 无关联 --
                                </button>
                                {tasks.filter(t => !t.completed).map(t => (
                                  <button
                                    key={t.id}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 last:border-b-0 transition-colors"
                                    onClick={() => {
                                      onUpdateSession(
                                        session.id,
                                        session.label,
                                        session.startTime,
                                        session.endTime || session.startTime,
                                        t.id
                                      );
                                      setEditingTaskLinkSessionId(null);
                                    }}
                                  >
                                    {t.title}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                          {session.type !== 'checkin' && (
                            <button
                              onClick={() => setEditingTaskLinkSessionId(session.id)}
                              className="flex items-center gap-1.5 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-all border border-transparent hover:border-slate-200 group"
                            >
                              {session.taskId ? (
                                <>
                                  <ListTodo size={14} className="text-slate-500" />
                                  <span className="text-slate-700 font-medium">{tasks.find(t => t.id === session.taskId)?.title || '未知任务'}</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                                  <span className="text-slate-400 group-hover:text-slate-700 transition-colors">关联待办</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {session.type !== 'checkin' && !isMorning && !isNight && (
                          <>
                            {' - '}
                            {session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            <span className="ml-2 font-mono text-xs opacity-70">({Math.floor(session.durationSeconds / 60)}分钟)</span>
                          </>
                        )}
                        {session.type === 'checkin' && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">打卡</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditingSession(session)} className={`p-1.5 text-slate-400 hover:text-${theme.primary}-600 hover:bg-${theme.primary}-50 rounded`}><Edit2 size={14} /></button>
                          <button onClick={() => onDeleteSession(session.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={editingSession}
        tasks={tasks}
        theme={theme}
        onClose={handleCloseSession}
        onUpdateSession={onUpdateSession}
      />

      {/* 5. Daily Reports & Reviews */}
      <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 col-span-1 lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2">
            <FileText className={`text-${theme.primary}-500`} size={20} /> 每日复盘
          </h3>

          {/* Show "Backfill Report" if viewing past date and no report exists */}
          {!generatedReport && !isGeneratingReport && !reportForSelectedDate && !isToday && (
            <button
              onClick={handleGenerateClick}
              className={`text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2`}
            >
              <ScrollText size={16} /> 补生成 {logDate} 日报
            </button>
          )}

          {!generatedReport && !isGeneratingReport && isToday && (
            <button
              onClick={handleGenerateClick}
              className={`text-sm bg-${theme.primary}-50 text-${theme.primary}-600 hover:bg-${theme.primary}-100 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2`}
            >
              <Plus size={16} /> 生成今日总结
            </button>
          )}
        </div>

        {/* Generation Area */}
        {isGeneratingReport && (
          <div className="p-12 text-center text-slate-500 bg-slate-50/50 rounded-2xl mb-6 border border-slate-100 border-dashed animate-pulse">
            <Loader2 className={`w-8 h-8 animate-spin mx-auto mb-3 text-${theme.primary}-400`} />
            <p className="font-serif text-lg text-slate-600">
              {isToday ? "正在回顾你的一天..." : `正在补生成 ${logDate} 的回顾...`}
            </p>
            <p className="text-xs mt-1">分析数据 · 总结亮点 · 生成建议</p>
          </div>
        )}

        {generatedReport && (
          <div className={`bg-${theme.primary}-50/30 border border-${theme.primary}-100 rounded-2xl p-6 mb-6 shadow-sm`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold bg-${theme.primary}-100 text-${theme.primary}-700 mb-2`}>
                  {isToday ? "今日草稿" : "补录草稿"}
                </span>
                <h4 className="text-xl font-bold font-serif text-slate-800">{generatedReport.title}</h4>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setGeneratedReport(null)} className="text-slate-400 hover:text-slate-600 px-3 py-1.5 text-sm">放弃</button>
                <button onClick={handleSaveNewReport} className={`bg-${theme.primary}-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-${theme.primary}-700 shadow-lg shadow-${theme.primary}-200 transition-all`}>保存存档</button>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-inner">
              <textarea
                className="w-full bg-transparent text-slate-700 text-sm focus:outline-none min-h-[150px] resize-y"
                value={generatedReport.content}
                onChange={(e) => setGeneratedReport({ ...generatedReport, content: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Past Reports List */}
        <div className="space-y-4">
          {reports.length === 0 && !generatedReport && !isGeneratingReport && (
            <p className="text-center text-slate-400 py-12">暂无归档的日报。</p>
          )}

          {/* Sort reports by date descending */}
          {reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(report => {
            return (
              <div key={report.id} className="group bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="p-5 flex justify-between items-center">
                  <div className="flex items-center gap-4 overflow-hidden flex-1">
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold font-serif text-lg text-slate-700">
                          {report.title || "今日复盘"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          {new Date(report.date).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-3 mt-1">
                        {/* Metric 1: Focus Duration */}
                        <div className="flex items-center gap-1 text-xs text-slate-500" title="专注时长">
                          <Clock size={12} className={`text-${theme.primary}-500`} />
                          <span className="font-mono font-bold text-slate-700">
                            {Math.floor(sessions.filter(s => s.startTime.startsWith(new Date(report.date).toISOString().split('T')[0]) && s.type !== 'checkin' && !s.label.includes('打卡')).reduce((acc, s) => acc + s.durationSeconds, 0) / 60)}
                          </span>
                          <span className="scale-90">m</span>
                        </div>

                        {/* Metric 2: Focus Items */}
                        <div className="flex items-center gap-1 text-xs text-slate-500" title="专注项数">
                          <ListTodo size={12} className="text-slate-400" />
                          <span className="font-mono font-bold text-slate-700">
                            {new Set(sessions.filter(s => s.startTime.startsWith(new Date(report.date).toISOString().split('T')[0]) && s.type !== 'checkin' && !s.label.includes('打卡')).map(s => s.label)).size}
                          </span>
                        </div>

                        {/* Metric 3: Completed Tasks */}
                        <div className="flex items-center gap-1 text-xs text-slate-500" title="完成任务">
                          <CheckCircle size={12} className="text-emerald-500" />
                          <span className="font-mono font-bold text-slate-700">
                            {(() => {
                              const match = report.content.match(/✅ \*\*当日完成\(创建\)任务数\*\*：(\d+)/);
                              return match ? match[1] : '-';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setViewingReportId(report.id)}
                      className={`px-4 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700 transition-colors text-sm font-medium opacity-0 group-hover:opacity-100`}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>


      {
        showCustomCheckIn && (
          <CustomCheckInModal
            onClose={() => setShowCustomCheckIn(false)}
            onSubmit={(label) => {
              onCheckIn('custom', label);
              setShowCustomCheckIn(false);
            }}
            theme={theme}
          />
        )
      }

      {
        viewingHabitId && (
          <HabitDetailsModal
            habit={habits.find(h => h.id === viewingHabitId)!}
            sessions={sessions}
            theme={theme}
            onClose={() => setViewingHabitId(null)}
            onDeleteHabit={onDeleteHabit}
            onUpdateHabit={onUpdateHabit}
            onToggleCheckIn={onToggleCheckIn}
          />
        )
      }


      {/* Task Details Modal */}
      {viewingTaskId && (
        <TaskDetailsModal
          task={tasks.find(t => t.id === viewingTaskId)!}
          goals={goals}
          sessions={sessions}
          theme={theme}
          onClose={handleCloseTask}
          onUpdateTask={onUpdateTask}
        />
      )}

      {/* Goal Details Modal */}
      {viewingGoalId && (
        <GoalDetailsModal
          goal={goals.find(g => g.id === viewingGoalId)!}
          tasks={tasks}
          sessions={sessions}
          visions={visions}
          theme={theme}
          onClose={handleCloseGoal}
          onUpdateGoal={onUpdateGoal}
          onToggleGoal={onToggleGoal}
        />
      )}

      {/* Vision Details Modal */}
      {viewingVisionId && (
        <VisionDetailsModal
          vision={visions.find(v => v.id === viewingVisionId)!}
          goals={goals}
          tasks={tasks}
          sessions={sessions}
          theme={theme}
          onClose={handleCloseVision}
          onUpdateVision={onUpdateVision}
          onDeleteVision={onDeleteVision}
          onUpdateGoal={(id, updates) => {
            const goal = goals.find(g => g.id === id);
            if (goal) {
              onUpdateGoal(id, updates.title || goal.title, updates.deadline || goal.deadline, updates.color || goal.color, updates.visionId !== undefined ? updates.visionId : goal.visionId);
            }
          }}
        />
      )}

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={editingSession}
        tasks={tasks}
        theme={theme}
        onClose={handleCloseSession}
        onUpdateSession={onUpdateSession}
      />

      {/* Report Details Modal */}
      <ReportDetailsModal
        report={viewingReportId ? reports.find(r => r.id === viewingReportId) || null : null}
        theme={theme}
        onClose={handleCloseReport}
        onSave={(id, content) => {
          onUpdateReport(id, content);
        }}
        onDelete={(id) => {
          onDeleteReport(id);
        }}
      />

      {/* Habit Details Modal */}
      {viewingHabitId && (
        <HabitDetailsModal
          habit={habits.find(h => h.id === viewingHabitId)}
          sessions={sessions}
          theme={theme}
          onClose={() => {
            setViewingHabitId(null);
            if (propSetViewingHabitId) propSetViewingHabitId(null);
          }}
          onDeleteHabit={onDeleteHabit}
          onUpdateHabit={onUpdateHabit}
          onToggleCheckIn={onToggleCheckIn}
        />
      )}

    </div >
  );
};

// --- Details Modals ---

const CustomCheckInModal: React.FC<{
  onClose: () => void;
  onSubmit: (label: string) => void;
  theme: any;
}> = ({ onClose, onSubmit, theme }) => {
  const [label, setLabel] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4 text-slate-800">自定义打卡</h3>
        <form onSubmit={(e) => { e.preventDefault(); if (label.trim()) onSubmit(label); }} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">打卡内容</label>
            <input
              autoFocus
              required
              className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例如：阅读30分钟、健身..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">取消</button>
            <button type="submit" className={`px-3 py-1.5 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700`}>打卡</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskDetailsModal: React.FC<{
  task: Task;
  goals: Goal[];
  sessions: Session[];
  theme: any;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}> = ({ task, goals, sessions, theme, onClose, onUpdateTask }) => {
  // Filter sessions linked to this task
  const taskSessions = sessions.filter(s => s.taskId === task.id);
  const totalDuration = taskSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  const [showGoalSelect, setShowGoalSelect] = useState(false);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}小时 ${m}分钟`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <input
                className="text-xl font-bold font-serif text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none w-full"
                value={task.title}
                onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
              />
              <Edit2 size={16} className="text-slate-300 shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-slate-400">创建于 {new Date(task.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateTask(task.id, { completed: !task.completed })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${task.completed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {task.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
              {task.completed ? '已完成' : '完成'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Goal Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Flag size={16} className={`text-${theme.primary}-500`} /> 关联目标
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowGoalSelect(!showGoalSelect)}
                className="w-full text-left border border-slate-200 rounded-xl p-2.5 bg-white text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all hover:border-slate-300 flex items-center justify-between"
              >
                <span className="text-sm">{task.goalId ? goals.find(g => g.id === task.goalId)?.title : '-- 无关联目标 --'}</span>
                <ChevronDown size={18} className="text-slate-400" />
              </button>
              {showGoalSelect && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowGoalSelect(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm text-slate-500 border-b border-slate-100"
                      onClick={() => {
                        onUpdateTask(task.id, { goalId: undefined });
                        setShowGoalSelect(false);
                      }}
                    >
                      -- 无关联目标 --
                    </button>
                    {goals.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 last:border-b-0 transition-colors"
                        onClick={() => {
                          onUpdateTask(task.id, { goalId: g.id });
                          setShowGoalSelect(false);
                        }}
                      >
                        {g.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>



          {/* Stats */}
          <div className={`bg-${theme.primary}-50 rounded-xl p-4 flex items-center gap-4`}>
            <div className={`p-3 bg-white rounded-full text-${theme.primary}-600 shadow-sm`}>
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">总专注时长</p>
              <p className={`text-2xl font-mono font-bold text-${theme.primary}-700`}>{formatDuration(totalDuration)}</p>
            </div>
          </div>

          {/* History List */}
          <div>
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <History size={16} className="text-slate-400" /> 专注记录 ({taskSessions.length})
            </h4>
            <div className="space-y-2">
              {taskSessions.length === 0 ? (
                <p className="text-sm text-slate-400 italic">暂无专注记录。</p>
              ) : (
                taskSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-700">{s.label}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{new Date(s.startTime).toLocaleDateString()}</span>
                        <span>{new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span className="font-mono text-slate-600">{Math.floor(s.durationSeconds / 60)} 分钟</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalDetailsModal: React.FC<{
  goal: Goal;
  tasks: Task[];
  sessions: Session[]; // Need sessions to calculate total time from linked tasks
  visions: Vision[]; // New
  theme: any;
  onClose: () => void;
  onUpdateGoal: (id: string, title: string, deadline: string, color?: string, visionId?: string) => void;
  onToggleGoal: (id: string) => void;
}> = ({ goal, tasks, sessions, visions, theme, onClose, onUpdateGoal, onToggleGoal }) => {
  // Filter tasks linked to this goal
  const linkedTasks = tasks.filter(t => t.goalId === goal.id);

  // Calculate total duration from ALL sessions linked to these tasks
  // (Optional: also include sessions directly linked to goal if we supported that, but currently we rely on task linkage)
  const linkedTaskIds = new Set(linkedTasks.map(t => t.id));
  const relevantSessions = sessions.filter(s => s.taskId && linkedTaskIds.has(s.taskId));

  const totalDuration = relevantSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  // Heatmap Data (Last 60 Days - GitHub Style)
  const getHeatmapData = () => {
    const today = new Date();
    const data: { date: string; seconds: number }[] = [];
    // Generate last 60 days
    for (let i = 59; i >= 0; i--) {
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

  const getColorClass = (seconds: number) => {
    if (seconds === 0) return 'bg-slate-100';
    if (seconds < 1800) return `bg-${theme.primary}-200`; // < 30m
    if (seconds < 3600) return `bg-${theme.primary}-300`; // < 1h
    if (seconds < 7200) return `bg-${theme.primary}-400`; // < 2h
    if (seconds < 14400) return `bg-${theme.primary}-500`; // < 4h
    return `bg-${theme.primary}-600`; // > 4h
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}小时 ${m}分钟`;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDate, setEditDate] = useState(goal.deadline);
  const [editColor, setEditColor] = useState(goal.color || MORANDI_COLORS[0]);
  const [editVisionId, setEditVisionId] = useState(goal.visionId || '');
  const [showVisionSelect, setShowVisionSelect] = useState(false);

  const morandiColors = MORANDI_COLORS;

  const handleSave = () => {
    if (editTitle.trim() && editDate) {
      onUpdateGoal(goal.id, editTitle, editDate, editColor, editVisionId || undefined);
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  className={`w-full text-xl font-bold font-serif text-slate-800 border-b-2 border-${theme.primary}-200 focus:border-${theme.primary}-500 focus:outline-none bg-transparent`}
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">截止日期:</span>
                  <div className="flex-1">
                    <CalendarPopover value={editDate} onChange={setEditDate} theme={theme} />
                  </div>
                </div>
                <div>
                  <span className="text-sm text-slate-500 mb-2 block">颜色标识:</span>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {morandiColors.map(c => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full hover:scale-110 transition-transform ${editColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                        title={c}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="#RRGGBB 自定义颜色"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
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
                <div>
                  <label className="text-sm text-slate-500 mb-1 block">关联愿景:</label>
                  <select
                    value={editVisionId}
                    onChange={(e) => setEditVisionId(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="">-- 无关联 --</option>
                    {visions.filter(v => !v.archived).map(v => (
                      <option key={v.id} value={v.id}>{v.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSave} className={`px-3 py-1 bg-${theme.primary}-600 text-white text-xs rounded hover:bg-${theme.primary}-700`}>保存</button>
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded hover:bg-slate-200">取消</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 group">
                  <h3 className="text-xl font-bold font-serif text-slate-800">{goal.title}</h3>
                  <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity">
                    <Edit2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${goal.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {goal.completed ? '已达成' : '进行中'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> 截止: {new Date(goal.deadline).toLocaleDateString()}
                  </span>

                  {/* Vision Link Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowVisionSelect(!showVisionSelect)}
                      className={`text-xs flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${goal.visionId ? 'bg-slate-50 border-slate-100 text-slate-600' : 'border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400'}`}
                    >
                      <Target size={12} />
                      {goal.visionId ? (visions.find(v => v.id === goal.visionId)?.title || '未知愿景') : '关联长期愿景'}
                    </button>
                    {showVisionSelect && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowVisionSelect(false)} />
                        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg w-48 overflow-hidden">
                          <div className="p-2 border-b border-slate-100 bg-slate-50 text-xs text-slate-500 font-medium">选择长期愿景</div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            <button
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-500"
                              onClick={() => {
                                onUpdateGoal(goal.id, goal.title, goal.deadline, goal.color, undefined);
                                setShowVisionSelect(false);
                              }}
                            >
                              -- 无关联 --
                            </button>
                            {visions.filter(v => !v.archived).map(v => (
                              <button
                                key={v.id}
                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs text-slate-700 truncate"
                                onClick={() => {
                                  onUpdateGoal(goal.id, goal.title, goal.deadline, goal.color, v.id);
                                  setShowVisionSelect(false);
                                }}
                              >
                                {v.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleGoal(goal.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${goal.completed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {goal.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
              {goal.completed ? '已达成' : '达成'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Stats */}
          <div className={`bg-${theme.primary}-50 rounded-xl p-4 flex items-center gap-4`}>
            <div className={`p-3 bg-white rounded-full text-${theme.primary}-600 shadow-sm`}>
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">目标投入总时长</p>
              <p className={`text-2xl font-mono font-bold text-${theme.primary}-700`}>{formatDuration(totalDuration)}</p>
              <p className="text-xs text-slate-400 mt-1">来自 {linkedTasks.length} 个关联任务</p>
            </div>
          </div>

          {/* Heatmap */}
          <div>
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <History size={16} className="text-slate-400" /> 最近60天投入
            </h4>
            <div className="flex flex-wrap gap-1">
              {heatmapData.map((day) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm ${getColorClass(day.seconds)} cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-${theme.primary}-400 transition-all`}
                  title={`${new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}: ${Math.floor(day.seconds / 3600)}小时${Math.floor((day.seconds % 3600) / 60)}分钟`}
                />
              ))}
            </div>
          </div>

          {/* Linked Tasks List */}
          <div>
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <ListTodo size={16} className="text-slate-400" /> 关联待办 ({linkedTasks.length})
            </h4>
            <div className="space-y-2">
              {linkedTasks.length === 0 ? (
                <p className="text-sm text-slate-400 italic">暂无关联待办。</p>
              ) : (
                linkedTasks.map(t => (
                  <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border ${t.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`}>
                    {t.completed ? <CheckCircle className="text-emerald-500 shrink-0" size={16} /> : <Circle className="text-slate-300 shrink-0" size={16} />}
                    <span className={`text-sm ${t.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};





export default Dashboard;


