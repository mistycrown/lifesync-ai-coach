
import React, { useState, useEffect } from 'react';
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
  onDeleteSession,
  
  onGenerateReport,
  onSaveReport,
  onUpdateReport,
  onDeleteReport
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [sessionLabel, setSessionLabel] = useState('');
  
  // Log Filtering
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Manual Add Session State
  const [showAddLog, setShowAddLog] = useState(false);
  const [manualLogLabel, setManualLogLabel] = useState('');
  const [manualLogStart, setManualLogStart] = useState('');
  const [manualLogDuration, setManualLogDuration] = useState('30');

  // Edit Session State
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editSessionLabel, setEditSessionLabel] = useState('');
  const [editSessionStart, setEditSessionStart] = useState('');
  const [editSessionEnd, setEditSessionEnd] = useState('');

  // Goal Editing State
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalDate, setEditGoalDate] = useState('');

  // Report States
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{title: string, content: string} | null>(null);
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
      setNewGoalDate('');
    }
  };
  
  const handleManualLogSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (manualLogLabel && manualLogStart && manualLogDuration) {
          const durationSec = parseInt(manualLogDuration) * 60;
          onAddSession(manualLogLabel, new Date(manualLogStart).toISOString(), durationSec);
          setShowAddLog(false);
          setManualLogLabel('');
          setManualLogDuration('30');
      }
  }

  // --- Session Edit Handlers ---
  const startEditingSession = (session: Session) => {
    setEditingSession(session);
    setEditSessionLabel(session.label);
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
              new Date(editSessionEnd).toISOString()
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
      if(generatedReport && generatedReport.content.trim()) {
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
      if(editingReportId && editContent.trim()) {
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
            {activeSession ? `当前正在进行: ${activeSession.label}` : '准备好开始新的工作了吗？'}
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
            <ListTodo className={`text-${theme.primary}-500`} size={20}/> 待办事项
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {sortedTasks.filter(t => !t.completed).length === 0 && sortedTasks.length > 0 && (
                 <p className="text-slate-400 text-sm text-center py-4">所有任务已完成！干得漂亮。</p>
            )}
             {sortedTasks.length === 0 && (
                 <p className="text-slate-400 text-sm text-center py-4">暂无任务。添加一个或咨询你的教练。</p>
            )}
          {sortedTasks.map(task => (
            <div key={task.id} className={`group flex items-center gap-3 p-3 rounded-xl border ${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 shadow-sm'} transition-all hover:shadow-md`}>
              <button onClick={() => onToggleTask(task.id)} className={`text-slate-300 hover:text-${theme.primary}-500 transition-colors`}>
                {task.completed ? <CheckCircle className="text-emerald-500" size={20} /> : <Circle size={20} />}
              </button>
              <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                {task.title}
              </span>
              <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                <Trash2 size={16} />
              </button>
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
            <div key={goal.id} className={`p-4 rounded-2xl border transition-all ${goal.completed ? 'bg-slate-50 border-slate-100 opacity-70' : `border-${theme.primary}-100 bg-gradient-to-br from-${theme.primary}-50/50 to-white shadow-sm hover:shadow-md`}`}>
              
              {editingGoalId === goal.id ? (
                  <div className="flex flex-col gap-2">
                         <input 
                            type="text"
                            value={editGoalTitle}
                            onChange={(e) => setEditGoalTitle(e.target.value)}
                            className={`bg-white text-slate-900 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-${theme.primary}-500`}
                         />
                      <div className="flex gap-2">
                         <input 
                            type="date"
                            value={editGoalDate}
                            onChange={(e) => setEditGoalDate(e.target.value)}
                            className={`bg-white text-slate-900 border border-slate-200 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:border-${theme.primary}-500`}
                         />
                         <button onClick={saveEditingGoal} className={`p-1.5 bg-${theme.primary}-600 text-white rounded hover:bg-${theme.primary}-700`}><Save size={14}/></button>
                         <button onClick={() => setEditingGoalId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"><X size={14}/></button>
                      </div>
                  </div>
              ) : (
                  <div className="flex justify-between items-start group">
                    <div className="flex items-start gap-3 flex-1">
                        <button onClick={() => onToggleGoal(goal.id)} className={`mt-0.5 text-slate-400 hover:text-${theme.primary}-600 transition-colors`}>
                            {goal.completed ? <CheckCircle className="text-emerald-500" size={18}/> : <Circle size={18}/>}
                        </button>
                        <div>
                            <h4 className={`font-medium text-sm ${goal.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{goal.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <Calendar size={12} />
                            {new Date(goal.deadline).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditingGoal(goal)} className={`p-1.5 text-slate-400 hover:text-${theme.primary}-600 hover:bg-${theme.primary}-50 rounded transition-colors`}><Edit2 size={14}/></button>
                        <button onClick={() => onDeleteGoal(goal.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14}/></button>
                    </div>
                 </div>
              )}
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
            <input
              type="date"
              value={newGoalDate}
              onChange={(e) => setNewGoalDate(e.target.value)}
              className={`flex-1 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-${theme.primary}-500 focus:bg-white text-slate-600`}
            />
            <button type="submit" className="px-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium">
              添加
            </button>
          </div>
        </form>
      </div>

      {/* 4. History Log */}
      <div className="bg-white rounded-3xl p-6 shadow-float border border-white/50 col-span-1 lg:col-span-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2"><History className={`text-${theme.primary}-500`} size={20}/> 活动日志</h3>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => changeDate(-1)}
                  className={`p-1.5 text-slate-500 hover:bg-white hover:text-${theme.primary}-600 rounded-lg transition-colors`}
                  title="前一天"
                >
                   <ChevronLeft size={16} />
                </button>
                <div className="relative">
                    <input 
                        type="date" 
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="bg-transparent text-slate-800 border-none text-sm font-medium focus:ring-0 cursor-pointer w-[110px] text-center"
                    />
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
                            <input 
                                required
                                type="datetime-local"
                                className={`w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-900 focus:outline-none focus:border-${theme.primary}-500`}
                                value={manualLogStart}
                                onChange={(e) => setManualLogStart(e.target.value)}
                            />
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
                <th className="px-4 py-3 font-medium">时间 / 时长</th>
                <th className="px-4 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSessions.length === 0 && (
                  <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
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
                           <Sun size={12} className="mr-1"/> 早安
                         </span>
                    ) : isNight ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                           <Moon size={12} className="mr-1"/> 晚安
                         </span>
                    ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${theme.primary}-50 text-${theme.primary}-700`}>
                          专注会话
                        </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{session.label}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {!isMorning && !isNight && (
                        <>
                         {' - '}
                         {session.endTime ? new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'} 
                         <span className="ml-2 font-mono text-xs opacity-70">({Math.floor(session.durationSeconds / 60)}分钟)</span>
                        </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => startEditingSession(session)} className={`p-1.5 text-slate-400 hover:text-${theme.primary}-600 hover:bg-${theme.primary}-50 rounded`}><Edit2 size={14}/></button>
                         <button onClick={() => onDeleteSession(session.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                      </div>
                  </td>
                </tr>
              )})}
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
                        onChange={(e) => setGeneratedReport({...generatedReport, content: e.target.value})}
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
            {reports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((report) => {
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
                                 {isExpanded || isEditing ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
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
                                     <button onClick={() => startEditingReport(report)} className={`p-2 text-slate-400 hover:text-${theme.primary}-600 hover:bg-${theme.primary}-50 rounded-lg transition-colors`}><Edit2 size={16}/></button>
                                     <button onClick={() => onDeleteReport(report.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
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
            )})}
         </div>
      </div>

    </div>
  );
};

export default Dashboard;
