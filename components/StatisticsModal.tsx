import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, CheckCircle2, Target, TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Session, Task, Goal, Habit, ThemeConfig, Vision } from '../types';
import { CalendarPopover } from './Calendar';

interface StatisticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: Session[];
    tasks: Task[];
    goals: Goal[];
    visions: Vision[];
    habits: Habit[];
    theme: ThemeConfig;
}

type TimeRange = 'day' | 'week' | 'month';

const THEME_HEX_COLORS: Record<string, string> = {
    indigo: '#6366f1',
    emerald: '#10b981',
    blue: '#3b82f6',
    rose: '#f43f5e',
    amber: '#f59e0b',
    slate: '#64748b',
};

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
    isOpen,
    onClose,
    sessions,
    tasks,
    goals,
    visions,
    habits,
    theme
}) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [anchorDate, setAnchorDate] = useState(new Date());

    // --- Date Navigation ---
    const handlePrev = () => {
        const newDate = new Date(anchorDate);
        if (timeRange === 'day') newDate.setDate(newDate.getDate() - 1);
        else if (timeRange === 'week') newDate.setDate(newDate.getDate() - 7);
        else if (timeRange === 'month') newDate.setMonth(newDate.getMonth() - 1);
        setAnchorDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(anchorDate);
        if (timeRange === 'day') newDate.setDate(newDate.getDate() + 1);
        else if (timeRange === 'week') newDate.setDate(newDate.getDate() + 7);
        else if (timeRange === 'month') newDate.setMonth(newDate.getMonth() + 1);
        setAnchorDate(newDate);
    };

    const handleDateSelect = (dateStr: string) => {
        setAnchorDate(new Date(dateStr));
    };

    const handleToday = () => {
        setAnchorDate(new Date());
    };

    // --- Data Processing ---

    const {
        filteredSessions,
        filteredTasks,
        totalFocusMinutes,
        avgFocusMinutes,
        completedTasksCount,
        trendData,
        goalDistributionData,
        visionDistributionData,
        dateLabel,
        formattedAnchorDate
    } = useMemo(() => {
        let startDate = new Date(anchorDate);
        let endDate = new Date(anchorDate);
        let label = '';

        // 1. Determine Date Range
        if (timeRange === 'day') {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            label = startDate.toLocaleDateString();
        } else if (timeRange === 'week') {
            const day = startDate.getDay();
            const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            startDate.setDate(diff);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);

            label = `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
        } else if (timeRange === 'month') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(0); // Last day of previous month (which is current month)
            endDate.setHours(23, 59, 59, 999);

            label = `${startDate.getFullYear()}年 ${startDate.getMonth() + 1}月`;
        }

        // 2. Filter Data
        // Exclude habit check-ins (sessions with habitId) from statistics
        const rangeSessions = sessions.filter(s => {
            const d = new Date(s.startTime);
            if (s.habitId) return false;
            return d >= startDate && d <= endDate;
        });

        const rangeTasks = tasks.filter(t => {
            const d = new Date(t.createdAt);
            return d >= startDate && d <= endDate;
        });

        // 3. Calculate Aggregates
        const totalSeconds = rangeSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
        const totalFocusMinutes = Math.floor(totalSeconds / 60);

        const daysCount = timeRange === 'day' ? 1 : (timeRange === 'week' ? 7 : 30); // Approx
        const avgFocusMinutes = Math.floor(totalFocusMinutes / daysCount);

        const completedTasksCount = rangeTasks.filter(t => t.completed).length;

        // 4. Prepare Trend Data (Area Chart)
        const trendMap = new Map<string, number>();

        if (timeRange === 'day') {
            for (let i = 0; i < 24; i++) {
                const hour = i.toString().padStart(2, '0') + ':00';
                trendMap.set(hour, 0);
            }
        } else {
            const iterDate = new Date(startDate);
            while (iterDate <= endDate) {
                const key = `${(iterDate.getMonth() + 1).toString().padStart(2, '0')}-${iterDate.getDate().toString().padStart(2, '0')}`;
                trendMap.set(key, 0);
                iterDate.setDate(iterDate.getDate() + 1);
            }
        }

        rangeSessions.forEach(s => {
            const d = new Date(s.startTime);
            let key = '';
            if (timeRange === 'day') {
                key = d.getHours().toString().padStart(2, '0') + ':00';
            } else {
                key = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
            }

            if (trendMap.has(key)) {
                trendMap.set(key, trendMap.get(key)! + Math.floor(s.durationSeconds / 60));
            }
        });

        const trendData = Array.from(trendMap.entries()).map(([name, value]) => ({ name, minutes: value }));

        // 5. Prepare Goal Distribution Data (Pie Chart)
        const goalDistMap = new Map<string, number>();
        // 6. Prepare Vision Distribution Data (Bar Chart)
        const visionDistMap = new Map<string, number>();

        rangeSessions.forEach(s => {
            const minutes = Math.floor(s.durationSeconds / 60);

            // Goal Distribution
            let goalCategory = '无关联';
            let visionCategory = '无关联';

            if (s.taskId) {
                const task = tasks.find(t => t.id === s.taskId);
                if (task && task.goalId) {
                    const goal = goals.find(g => g.id === task.goalId);
                    if (goal) {
                        goalCategory = goal.title;
                        if (goal.visionId) {
                            const vision = visions.find(v => v.id === goal.visionId);
                            if (vision) visionCategory = vision.title;
                        }
                    }
                } else {
                    goalCategory = '其他任务';
                }
            } else {
                goalCategory = '自由专注';
            }

            goalDistMap.set(goalCategory, (goalDistMap.get(goalCategory) || 0) + minutes);
            visionDistMap.set(visionCategory, (visionDistMap.get(visionCategory) || 0) + minutes);
        });

        const goalDistributionData = Array.from(goalDistMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const visionDistributionData = Array.from(visionDistMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Format anchor date for CalendarPopover
        const y = anchorDate.getFullYear();
        const m = String(anchorDate.getMonth() + 1).padStart(2, '0');
        const d = String(anchorDate.getDate()).padStart(2, '0');
        const formattedAnchorDate = `${y}-${m}-${d}`;

        return {
            filteredSessions: rangeSessions,
            filteredTasks: rangeTasks,
            totalFocusMinutes,
            avgFocusMinutes,
            completedTasksCount,
            trendData,
            goalDistributionData,
            visionDistributionData,
            dateLabel: label,
            formattedAnchorDate
        };

    }, [sessions, tasks, goals, visions, habits, timeRange, anchorDate]);

    if (!isOpen) return null;

    // Colors
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];
    const themeHex = THEME_HEX_COLORS[theme.primary] || '#6366f1';

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}小时${m}分钟`;
        return `${m}分钟`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-${theme.primary}-100 text-${theme.primary}-600`}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">数据统计中心</h2>
                            <p className="text-xs text-slate-500 mt-0.5">回顾你的专注与成长轨迹</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">

                        {/* 1. Back to Today */}
                        <button
                            onClick={handleToday}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-sm font-medium flex items-center gap-1"
                            title="回到今天"
                        >
                            <RotateCcw size={14} />
                            <span className="hidden sm:inline">今天</span>
                        </button>

                        {/* 2. Date Navigation & Picker */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                            <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500">
                                <ChevronLeft size={16} />
                            </button>

                            <div className="px-1">
                                <CalendarPopover
                                    value={formattedAnchorDate}
                                    onChange={handleDateSelect}
                                    theme={theme}
                                    variant="responsive"
                                />
                            </div>

                            <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500">
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* 3. View Toggle */}
                        <div className="flex bg-slate-200/50 p-1 rounded-lg">
                            {(['day', 'week', 'month'] as TimeRange[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeRange(t)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${timeRange === t
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {t === 'day' && '日'}
                                    {t === 'week' && '周'}
                                    {t === 'month' && '月'}
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className={`p-3 rounded-full bg-indigo-50 text-indigo-600`}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">总专注时长</p>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {Math.floor(totalFocusMinutes / 60)}<span className="text-sm text-slate-400 font-normal ml-1">小时</span>
                                    {totalFocusMinutes % 60}<span className="text-sm text-slate-400 font-normal ml-1">分钟</span>
                                </h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className={`p-3 rounded-full bg-emerald-50 text-emerald-600`}>
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">完成待办数量</p>
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {completedTasksCount}<span className="text-sm text-slate-400 font-normal ml-1">个任务</span>
                                </h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className={`p-3 rounded-full bg-amber-50 text-amber-600`}>
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">平均每日专注</p>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {formatDuration(avgFocusMinutes)}
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Focus Trend Chart */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm lg:col-span-2">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    <BarChart3 size={18} className="text-slate-400" />
                                    专注趋势 ({dateLabel})
                                </h4>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={themeHex} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={themeHex} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [formatDuration(value), '时长']}
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: `0 8px 20px -6px ${themeHex}40` // Theme colored shadow
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="minutes"
                                            stroke={themeHex}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorMinutes)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Goal Distribution Pie Chart */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <PieChartIcon size={18} className="text-slate-400" />
                                目标投入分布
                            </h4>
                            <div className="h-64 w-full flex items-center justify-center">
                                {goalDistributionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={goalDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {goalDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [formatDuration(value), '时长']}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: `0 8px 20px -6px ${themeHex}40`
                                                }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-slate-400 text-sm">暂无数据</div>
                                )}
                            </div>
                        </div>

                        {/* Vision Investment Pie Chart */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <Target size={18} className="text-slate-400" />
                                愿景投入分布
                            </h4>
                            <div className="h-64 w-full flex items-center justify-center">
                                {visionDistributionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={visionDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {visionDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [formatDuration(value), '时长']}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: `0 8px 20px -6px ${themeHex}40`
                                                }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-slate-400 text-sm">暂无数据</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
