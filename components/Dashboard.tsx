import React, { useState, useEffect } from 'react';
import { CalendarPopover } from './Calendar';
import { Play, Square, CheckCircle, Circle, Clock, Calendar, Trash2, Plus, Flag, ListTodo, FileText, Edit2, Save, X, Loader2, ChevronDown, ChevronRight, Check, History, ChevronLeft, Sun, Moon, ScrollText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Task, Goal, Session, DailyReport, DashboardProps } from '../types';

const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  goals,
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
  onDeleteReport
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionLabel, setSessionLabel] = useState('');
  const [activeLabelEdit, setActiveLabelEdit] = useState('');
  const [isEditingActiveLabel, setIsEditingActiveLabel] = useState(false);

  // Log Filtering
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

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
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedReportIds, setExpandedReportIds] = useState<Set<string>>(new Set());

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
      onAddGoal(newGoalTitle, newGoalDate);
      setNewGoalTitle('');
      setNewGoalDate(new Date().toISOString().split('T')[0]);
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

  const handleSessionUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession && editSessionLabel && editSessionStart && editSessionEnd) {
      onUpdateSession(
        editingSession.id,
        editSessionLabel,
        new Date(editSessionStart).toISOString(),
        new Date(editSessionEnd).toISOString(),
        editSessionTaskId || undefined
      );
      setEditingSession(null);
    }
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

  const startEditingReport = (report: DailyReport) => {
    setEditingReportId(report.id);
    setEditContent(report.content);
    const newExpanded = new Set(expandedReportIds);
    newExpanded.add(report.id);
    setExpandedReportIds(newExpanded);
  };

  const saveEditingReport = () => {
    if (editingReportId && editContent.trim()) {
      onUpdateReport(editingReportId, editContent);
      setEditingReportId(null);
      setEditContent('');
    }
  };

  const toggleReportExpand = (id: string) => {
    const newExpanded = new Set(expandedReportIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedReportIds(newExpanded);
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

      {/* 2. Tasks */}
      <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 flex flex-col h-[400px]">
        <h3 className="text-lg font-bold font-serif text-slate-800 mb-4 flex items-center gap-2">
          <ListTodo className={`text-${theme.primary}-500`} size={20} /> 待办事项
        </h3>
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
                    <Play size={16} />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={16} />
                </button>
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
      </div>

      {/* 3. Goals & Deadlines */}
      <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 flex flex-col h-[400px]">
        <h3 className="text-lg font-bold font-serif text-slate-800 mb-4 flex items-center gap-2">
          <Flag className={`text-${theme.primary}-500`} size={20} /> 目标与截止日期
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {sortedGoals.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">暂无目标。心怀梦想，脚踏实地！</p>
          )}
          {sortedGoals.map(goal => (
            <div key={goal.id} className={`p-4 rounded-2xl border transition-all ${goal.completed ? 'bg-slate-50 border-slate-100 opacity-70' : `border-${theme.primary}-100 bg-gradient-to-br from-${theme.primary}-50/50 to-white shadow-sm hover:shadow-md`} cursor-pointer`} onClick={() => setViewingGoalId(goal.id)}>

              <div className="flex justify-between items-start group">
                <div className="flex items-start gap-3 flex-1">
                  <button onClick={(e) => { e.stopPropagation(); onToggleGoal(goal.id); }} className={`mt-0.5 text-slate-400 hover:text-${theme.primary}-600 transition-colors`}>
                    {goal.completed ? <CheckCircle className="text-emerald-500" size={18} /> : <Circle size={18} />}
                  </button>
                  <div>
                    <h4 className={`font-medium text-sm ${goal.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{goal.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Calendar size={12} className={`text-${theme.primary}-500`} />
                      {new Date(goal.deadline).toLocaleDateString()}
                      <span className="ml-2 flex items-center gap-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
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
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddGoal} className="mt-4 flex flex-col gap-2">
          <input
            type="text"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="目标名称..."
            className={`bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-${theme.primary}-500 focus:bg-white transition-colors`}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <CalendarPopover value={newGoalDate} onChange={setNewGoalDate} theme={theme} />
            </div>
            <button type="submit" className="px-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium">
              添加
            </button>
          </div>
        </form>
      </div>

      {/* 4. History Log */}
      <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 col-span-1 lg:col-span-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2"><History className={`text-${theme.primary}-500`} size={20} /> 活动日志</h3>
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => changeDate(-1)}
              className={`p-1.5 text-slate-500 hover:bg-white hover:text-${theme.primary}-600 rounded-lg transition-colors`}
              title="前一天"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="relative">
              <CalendarPopover value={logDate} onChange={setLogDate} theme={theme} />
            </div>
            <button
              onClick={() => setLogDate(new Date().toISOString().split('T')[0])}
              className={`text-xs px-2 py-1 text-slate-500 hover:text-${theme.primary}-600 font-medium hover:bg-white rounded-lg transition-colors`}
            >
              今天
            </button>
            <button
              onClick={() => changeDate(1)}
              className={`p-1.5 text-slate-500 hover:bg-white hover:text-${theme.primary}-600 rounded-lg transition-colors`}
              title="后一天"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowAddLog(true)}
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
              <form onSubmit={handleManualLogSubmit} className="space-y-4">
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
                    <input
                      required
                      type="time"
                      className={`border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                      value={manualLogStart.split('T')[1] || ''}
                      onChange={(e) => {
                        const date = manualLogStart.split('T')[0];
                        setManualLogStart(`${date}T${e.target.value}`);
                      }}
                    />
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
                  <select
                    className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                    value={manualLogTaskId}
                    onChange={(e) => setManualLogTaskId(e.target.value)}
                  >
                    <option value="">-- 无关联 --</option>
                    {tasks.filter(t => !t.completed).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setShowAddLog(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">取消</button>
                  <button type="submit" className={`px-3 py-1.5 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700`}>保存</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Session Modal */}
        {editingSession && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="font-bold text-lg mb-4 text-slate-800">修改活动记录</h3>
              <form onSubmit={handleSessionUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">内容</label>
                  <input
                    required
                    className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                    value={editSessionLabel}
                    onChange={(e) => setEditSessionLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">开始时间</label>
                  <input
                    required
                    type="datetime-local"
                    className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                    value={editSessionStart}
                    onChange={(e) => setEditSessionStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">结束时间</label>
                  <input
                    required
                    type="datetime-local"
                    className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                    value={editSessionEnd}
                    onChange={(e) => setEditSessionEnd(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">关联待办</label>
                  <select
                    className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                    value={editSessionTaskId}
                    onChange={(e) => setEditSessionTaskId(e.target.value)}
                  >
                    <option value="">-- 无关联 --</option>
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setEditingSession(null)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">取消</button>
                  <button type="submit" className={`px-3 py-1.5 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700`}>更新</button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${theme.primary}-50 text-${theme.primary}-700`}>
                          专注会话
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{session.label}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {session.taskId ? (
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 w-fit">
                          <ListTodo size={12} />
                          {tasks.find(t => t.id === session.taskId)?.title || '未知任务'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {!isMorning && !isNight && (
                        <>
                          {' - '}
                          {session.endTime ? new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                          <span className="ml-2 font-mono text-xs opacity-70">({Math.floor(session.durationSeconds / 60)}分钟)</span>
                        </>
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
      </div>

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
          {reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((report) => {
            const isExpanded = expandedReportIds.has(report.id);
            const isEditing = editingReportId === report.id;

            return (
              <div key={report.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white hover:shadow-float transition-all duration-300">
                {/* Header - Click to toggle */}
                <div
                  onClick={() => !isEditing && toggleReportExpand(report.id)}
                  className={`p-5 flex justify-between items-center cursor-pointer ${isExpanded || isEditing ? 'bg-slate-50/50 border-b border-slate-100' : 'hover:bg-slate-50/30'}`}
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="text-slate-300 shrink-0">
                      {isExpanded || isEditing ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-3 mb-0.5">
                        <span className={`font-bold font-serif text-lg ${isExpanded ? `text-${theme.primary}-700` : 'text-slate-700'}`}>
                          {report.title || "今日复盘"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                          {new Date(report.date).toLocaleDateString()}
                        </span>
                      </div>
                      {!isExpanded && !isEditing && (
                        <p className="text-xs text-slate-400 truncate w-full pr-4">
                          {report.content.substring(0, 60).replace(/\n/g, ' ')}...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button onClick={() => setEditingReportId(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
                        <button onClick={saveEditingReport} className={`p-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700`}><Save size={18} /></button>
                      </div>
                    ) : (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditingReport(report)} className={`p-2 text-slate-400 hover:text-${theme.primary}-600 hover:bg-${theme.primary}-50 rounded-lg transition-colors`}><Edit2 size={16} /></button>
                        <button onClick={() => onDeleteReport(report.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Body - Collapsible */}
                {(isExpanded || isEditing) && (
                  <div className="p-6 bg-white animate-in slide-in-from-top-2 duration-200">
                    {isEditing ? (
                      <textarea
                        className={`w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-${theme.primary}-500 min-h-[300px] leading-relaxed`}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                    ) : (
                      <div className="text-sm text-slate-700 leading-8 markdown-body px-2">
                        <ReactMarkdown>{report.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      {viewingTaskId && (
        <TaskDetailsModal
          task={tasks.find(t => t.id === viewingTaskId)!}
          goals={goals}
          sessions={sessions}
          theme={theme}
          onClose={() => setViewingTaskId(null)}
          onUpdateTask={onUpdateTask}
        />
      )}

      {viewingGoalId && (
        <GoalDetailsModal
          goal={goals.find(g => g.id === viewingGoalId)!}
          tasks={tasks}
          sessions={sessions}
          theme={theme}
          onClose={() => setViewingGoalId(null)}
          onUpdateGoal={onUpdateGoal}
        />
      )}

    </div>
  );
};

// --- Details Modals ---

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

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}小时 ${m}分钟`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Goal Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Flag size={16} className={`text-${theme.primary}-500`} /> 关联目标
            </label>
            <select
              value={task.goalId || ''}
              onChange={(e) => onUpdateTask(task.id, { goalId: e.target.value || undefined })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- 无关联目标 --</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
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
  theme: any;
  onClose: () => void;
  onUpdateGoal: (id: string, title: string, deadline: string) => void;
}> = ({ goal, tasks, sessions, theme, onClose, onUpdateGoal }) => {
  // Filter tasks linked to this goal
  const linkedTasks = tasks.filter(t => t.goalId === goal.id);

  // Calculate total duration from ALL sessions linked to these tasks
  // (Optional: also include sessions directly linked to goal if we supported that, but currently we rely on task linkage)
  const linkedTaskIds = new Set(linkedTasks.map(t => t.id));
  const relevantSessions = sessions.filter(s => s.taskId && linkedTaskIds.has(s.taskId));

  const totalDuration = relevantSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}小时 ${m}分钟`;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDate, setEditDate] = useState(goal.deadline);

  const handleSave = () => {
    if (editTitle.trim() && editDate) {
      onUpdateGoal(goal.id, editTitle, editDate);
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
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
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${goal.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {goal.completed ? '已达成' : '进行中'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} /> 截止: {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
              <History size={16} className="text-slate-400" /> 最近30天投入
            </h4>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 30 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const dateStr = d.toISOString().split('T')[0];

                // Calculate duration for this day
                const daySeconds = relevantSessions
                  .filter(s => s.startTime.startsWith(dateStr))
                  .reduce((acc, s) => acc + s.durationSeconds, 0);

                let colorClass = 'bg-slate-100';
                if (daySeconds > 0) colorClass = `bg-${theme.primary}-200`;
                if (daySeconds > 1800) colorClass = `bg-${theme.primary}-300`; // > 30m
                if (daySeconds > 3600) colorClass = `bg-${theme.primary}-400`; // > 1h
                if (daySeconds > 7200) colorClass = `bg-${theme.primary}-500`; // > 2h
                if (daySeconds > 14400) colorClass = `bg-${theme.primary}-600`; // > 4h

                return (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${colorClass}`}
                    title={`${dateStr}: ${Math.floor(daySeconds / 60)} mins`}
                  />
                );
              })}
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
