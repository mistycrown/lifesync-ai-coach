import React, { useState } from 'react';
import { History, ChevronLeft, ChevronRight, FileText, Loader2, Save, Edit2, Trash2 } from 'lucide-react';
import { Session, DailyReport, ThemeConfig, Task, Goal } from '../../types';
import { CalendarPopover } from '../Calendar';
import { WeeklyTimeline } from '../WeeklyTimeline';
import ReactMarkdown from 'react-markdown';

interface RecordsSectionProps {
    sessions: Session[];
    tasks: Task[];
    goals: Goal[];
    reports: DailyReport[];
    theme: ThemeConfig;
    onAddSession: (label: string, startTime: string, durationSeconds: number, taskId?: string) => void;
    onUpdateSession: (id: string, label: string, startTime: string, endTime: string, taskId?: string) => void;
    onDeleteSession: (id: string) => void;
    onGenerateReport: (date?: string) => Promise<{ title: string, content: string }>;
    onSaveReport: (title: string, content: string, date?: string) => void;
    onUpdateReport: (id: string, content: string) => void;
    onDeleteReport: (id: string) => void;
    setViewingReportId: (id: string | null) => void;
    setViewingSessionId: (id: string | null) => void;
}

export const RecordsSection: React.FC<RecordsSectionProps> = ({
    sessions,
    tasks,
    goals,
    reports,
    theme,
    onAddSession,
    onUpdateSession,
    onDeleteSession,
    onGenerateReport,
    onSaveReport,
    onUpdateReport,
    onDeleteReport,
    setViewingReportId,
    setViewingSessionId
}) => {
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [logViewMode, setLogViewMode] = useState<'list' | 'week'>('list');
    const [showAddLog, setShowAddLog] = useState(false);

    const getCurrentDateTimeLocal = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const [manualLogLabel, setManualLogLabel] = useState('');
    const [manualLogStart, setManualLogStart] = useState(getCurrentDateTimeLocal());
    const [manualLogDuration, setManualLogDuration] = useState('30');
    const [manualLogTaskId, setManualLogTaskId] = useState('');

    // Report States
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<{ title: string, content: string } | null>(null);

    const changeDate = (days: number) => {
        const date = new Date(logDate);
        date.setDate(date.getDate() + days);
        setLogDate(date.toISOString().split('T')[0]);
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
    };

    const handleGenerateClick = async () => {
        setIsGeneratingReport(true);
        const data = await onGenerateReport(logDate);
        setGeneratedReport(data);
        setIsGeneratingReport(false);
    };

    const handleSaveNewReport = () => {
        if (generatedReport && generatedReport.content.trim()) {
            const dateToSave = new Date(logDate);
            dateToSave.setHours(23, 59, 59, 999);
            onSaveReport(generatedReport.title, generatedReport.content, dateToSave.toISOString());
            setGeneratedReport(null);
        }
    };

    // Filter sessions by date
    const filteredSessions = sessions.filter(s =>
        s.endTime !== null && new Date(s.startTime).toLocaleDateString() === new Date(logDate).toLocaleDateString()
    ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const reportForSelectedDate = reports.find(r =>
        new Date(r.date).toDateString() === new Date(logDate).toDateString()
    );

    const isToday = new Date(logDate).toDateString() === new Date().toDateString();

    return (
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
                                    type="text"
                                    required
                                    value={manualLogLabel}
                                    onChange={(e) => setManualLogLabel(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    placeholder="做了什么..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">开始时间</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={manualLogStart}
                                        onChange={(e) => setManualLogStart(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 mb-1">时长 (分钟)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={manualLogDuration}
                                        onChange={(e) => setManualLogDuration(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddLog(false)}
                                    className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 py-2 bg-${theme.primary}-600 text-white rounded-xl hover:bg-${theme.primary}-700 shadow-lg shadow-${theme.primary}-200`}
                                >
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {logViewMode === 'list' ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredSessions.length === 0 && (
                        <p className="text-center text-slate-400 py-8 text-sm">该日暂无记录</p>
                    )}
                    {filteredSessions.map(session => {
                        const startTime = new Date(session.startTime);
                        const endTime = new Date(session.endTime);
                        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

                        return (
                            <div key={session.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group cursor-pointer" onClick={() => setViewingSessionId(session.id)}>
                                <div className={`w-12 text-center text-xs font-medium text-slate-500`}>
                                    {startTime.getHours().toString().padStart(2, '0')}:{startTime.getMinutes().toString().padStart(2, '0')}
                                </div>
                                <div className={`w-1 h-8 rounded-full bg-${theme.primary}-200`} />
                                <div className="flex-1">
                                    <div className="font-medium text-slate-700 text-sm">{session.label}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        {duration} 分钟 {session.taskId && <span className="bg-white border border-slate-200 px-1 rounded ml-1">关联任务</span>}
                                    </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-opacity">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <WeeklyTimeline
                    sessions={sessions}
                    currentDate={logDate}
                    tasks={tasks}
                    goals={goals}
                    theme={theme}
                    onSessionClick={(session) => setViewingSessionId(session.id)}
                    onSessionUpdate={(id, startTime, endTime) => {
                        const session = sessions.find(s => s.id === id);
                        if (session) {
                            onUpdateSession(id, session.label, startTime, endTime, session.taskId);
                        }
                    }}
                />
            )}

            {/* Daily Report Section */}
            <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2">
                        <FileText className={`text-${theme.primary}-500`} size={20} /> 每日复盘
                    </h3>
                    {reportForSelectedDate && (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                            已生成
                        </span>
                    )}
                </div>

                {reportForSelectedDate ? (
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 cursor-pointer hover:shadow-md transition-all group" onClick={() => setViewingReportId(reportForSelectedDate.id)}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800">{reportForSelectedDate.title}</h4>
                            <div className="flex gap-1 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); onDeleteReport(reportForSelectedDate.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="text-sm text-slate-600 line-clamp-3 markdown-body">
                            <ReactMarkdown>{reportForSelectedDate.content}</ReactMarkdown>
                        </div>
                        <div className="mt-3 text-xs text-slate-400 flex justify-between items-center">
                            <span>{new Date(reportForSelectedDate.date).toLocaleString()}</span>
                            <span className={`text-${theme.primary}-600 font-medium`}>点击查看详情</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 border-dashed text-center">
                        {generatedReport ? (
                            <div className="text-left animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center mb-4">
                                    <input
                                        value={generatedReport.title}
                                        onChange={(e) => setGeneratedReport({ ...generatedReport, title: e.target.value })}
                                        className="font-bold text-lg bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none w-full mr-4"
                                    />
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => setGeneratedReport(null)} className="text-slate-400 hover:text-slate-600 p-2">取消</button>
                                        <button onClick={handleSaveNewReport} className={`bg-${theme.primary}-600 text-white px-4 py-2 rounded-lg hover:bg-${theme.primary}-700 flex items-center gap-2`}>
                                            <Save size={16} /> 保存
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={generatedReport.content}
                                    onChange={(e) => setGeneratedReport({ ...generatedReport, content: e.target.value })}
                                    className="w-full h-64 bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
                                />
                            </div>
                        ) : (
                            <div className="py-4">
                                <div className={`w-16 h-16 bg-${theme.primary}-50 rounded-full flex items-center justify-center mx-auto mb-4`}>
                                    <FileText className={`text-${theme.primary}-300`} size={32} />
                                </div>
                                <h4 className="font-medium text-slate-700 mb-2">
                                    {isToday ? "今天过得怎么样？" : `${new Date(logDate).getMonth() + 1}月${new Date(logDate).getDate()}日的复盘`}
                                </h4>
                                <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                                    {isToday ? "让 AI 教练帮你总结今天的成就，并给出明天的建议。" : "生成该日期的历史回顾报告。"}
                                </p>
                                <button
                                    onClick={handleGenerateClick}
                                    disabled={isGeneratingReport}
                                    className={`bg-${theme.primary}-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-${theme.primary}-700 transition-all shadow-lg shadow-${theme.primary}-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 mx-auto`}
                                >
                                    {isGeneratingReport ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                                    {isGeneratingReport ? "正在生成..." : "生成日报"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
