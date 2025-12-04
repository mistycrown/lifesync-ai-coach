import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Session, Task, Goal } from '../types';

interface WeeklyTimelineProps {
    sessions: Session[];
    currentDate: string; // YYYY-MM-DD
    tasks: Task[];
    goals: Goal[];
    theme: any;
    onSessionClick: (session: Session) => void;
    onSessionUpdate: (id: string, startTime: string, endTime: string) => void;
}

export const WeeklyTimeline: React.FC<WeeklyTimelineProps> = ({
    sessions,
    currentDate,
    tasks,
    goals,
    theme,
    onSessionClick,
    onSessionUpdate
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingSessionId, setDraggingSessionId] = useState<string | null>(null);
    const [dragType, setDragType] = useState<'start' | 'end' | null>(null);
    const [dragY, setDragY] = useState(0);
    const [tempSessionTimes, setTempSessionTimes] = useState<{ start: Date, end: Date } | null>(null);
    const isDraggingRef = useRef(false);

    const weekDates = useMemo(() => {
        const curr = new Date(currentDate);
        const day = curr.getDay();
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diff));

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [currentDate]);

    const weekSessions = useMemo(() => {
        const start = weekDates[0];
        const end = new Date(weekDates[6]);
        end.setHours(23, 59, 59, 999);

        return sessions.filter(s => {
            if (s.type === 'checkin') return false; // Hide check-ins
            const sDate = new Date(s.startTime);
            return sDate >= start && sDate <= end;
        });
    }, [sessions, weekDates]);

    const getSessionColor = (session: Session) => {
        if (session.label.includes('早安')) {
            return {
                bg: 'bg-orange-100',
                border: 'border-orange-200',
                text: 'text-orange-800'
            };
        }
        if (session.label.includes('晚安')) {
            return {
                bg: 'bg-blue-100',
                border: 'border-blue-200',
                text: 'text-blue-800'
            };
        }

        const task = tasks.find(t => t.id === session.taskId);
        if (task && task.goalId) {
            const goal = goals.find(g => g.id === task.goalId);
            if (goal && goal.color) {
                return {
                    bg: `bg-[${goal.color}]/10`,
                    border: `border-[${goal.color}]/20`,
                    text: `text-[${goal.color}]`
                };
            }
        }
        // Default theme color
        return {
            bg: `bg-${theme.primary}-100`,
            border: `border-${theme.primary}-200`,
            text: `text-${theme.primary}-800`
        };
    };

    const getSessionStyle = (session: Session) => {
        let start = new Date(session.startTime);
        let end = session.endTime ? new Date(session.endTime) : new Date(start.getTime() + session.durationSeconds * 1000);

        // Override with temp times if dragging
        if (draggingSessionId === session.id && tempSessionTimes) {
            start = tempSessionTimes.start;
            end = tempSessionTimes.end;
        }

        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const durationMinutes = (end.getTime() - start.getTime()) / 1000 / 60;

        const top = (startMinutes / 1440) * 100;
        const height = Math.max((durationMinutes / 1440) * 100, 1.5);

        return {
            top: `${top}%`,
            height: `${height}%`,
        };
    };

    const handleMouseDown = (e: React.MouseEvent, session: Session, type: 'start' | 'end') => {
        e.stopPropagation();
        setDraggingSessionId(session.id);
        setDragType(type);
        setDragY(e.clientY);
        isDraggingRef.current = false;

        const start = new Date(session.startTime);
        const end = session.endTime ? new Date(session.endTime) : new Date(start.getTime() + session.durationSeconds * 1000);
        setTempSessionTimes({ start, end });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingSessionId || !dragType || !tempSessionTimes || !containerRef.current) return;

        const deltaY = e.clientY - dragY;
        const pixelsPerMinute = 1080 / 1440;
        const minutesDelta = deltaY / pixelsPerMinute;
        const snappedDelta = Math.round(minutesDelta / 5) * 5;

        if (Math.abs(snappedDelta) < 5) return;

        isDraggingRef.current = true;

        const newTimes = { ...tempSessionTimes };

        if (dragType === 'start') {
            newTimes.start = new Date(tempSessionTimes.start.getTime() + snappedDelta * 60000);
            if (newTimes.start >= newTimes.end) {
                newTimes.start = new Date(newTimes.end.getTime() - 5 * 60000);
            }
        } else {
            newTimes.end = new Date(tempSessionTimes.end.getTime() + snappedDelta * 60000);
            if (newTimes.end <= newTimes.start) {
                newTimes.end = new Date(newTimes.start.getTime() + 5 * 60000);
            }
        }

        setTempSessionTimes(newTimes);
        setDragY(e.clientY);
    };

    const handleMouseUp = () => {
        if (draggingSessionId && tempSessionTimes) {
            onSessionUpdate(
                draggingSessionId,
                tempSessionTimes.start.toISOString(),
                tempSessionTimes.end.toISOString()
            );
        }
        setDraggingSessionId(null);
        setDragType(null);
        setTempSessionTimes(null);
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    // Global mouse up/move listener for drag operation
    useEffect(() => {
        if (draggingSessionId) {
            const handleGlobalMouseMove = (e: MouseEvent) => {
                if (!draggingSessionId || !dragType || !tempSessionTimes) return;

                const deltaY = e.clientY - dragY;
                const pixelsPerMinute = 1080 / 1440;
                const minutesDelta = deltaY / pixelsPerMinute;
                const snappedDelta = Math.round(minutesDelta / 5) * 5;

                if (Math.abs(snappedDelta) < 5) return;

                isDraggingRef.current = true;

                const newTimes = { ...tempSessionTimes };
                if (dragType === 'start') {
                    newTimes.start = new Date(tempSessionTimes.start.getTime() + snappedDelta * 60000);
                    if (newTimes.start >= newTimes.end) newTimes.start = new Date(newTimes.end.getTime() - 5 * 60000);
                } else {
                    newTimes.end = new Date(tempSessionTimes.end.getTime() + snappedDelta * 60000);
                    if (newTimes.end <= newTimes.start) newTimes.end = new Date(newTimes.start.getTime() + 5 * 60000);
                }

                setTempSessionTimes(newTimes);
                setDragY(e.clientY);
            };

            const handleGlobalMouseUp = () => {
                if (draggingSessionId && tempSessionTimes) {
                    onSessionUpdate(
                        draggingSessionId,
                        tempSessionTimes.start.toISOString(),
                        tempSessionTimes.end.toISOString()
                    );
                }
                setDraggingSessionId(null);
                setDragType(null);
                setTempSessionTimes(null);
                setTimeout(() => {
                    isDraggingRef.current = false;
                }, 100);
            };

            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleGlobalMouseMove);
                window.removeEventListener('mouseup', handleGlobalMouseUp);
            };
        }
    }, [draggingSessionId, dragY, dragType, tempSessionTimes, onSessionUpdate]);


    // Scroll to 8 AM on mount
    useEffect(() => {
        // 使用 setTimeout 确保 DOM 渲染完成，高度已生效
        const timer = setTimeout(() => {
            if (containerRef.current) {
                // 9 AM = 9 * 45 = 405px (总高度 1080px)
                containerRef.current.scrollTop = 405;
            }
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    const hours = Array.from({ length: 24 }, (_, i) => i);

    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: string } | null>(null);

    return (
        <div className="flex flex-col h-[675px] border border-slate-200 rounded-xl overflow-hidden bg-white select-none relative">
            {/* Custom Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 px-3 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 shadow-xl rounded-xl text-xs text-slate-700 pointer-events-none transition-opacity duration-200"
                    style={{
                        left: tooltip.x + 12,
                        top: tooltip.y + 12,
                        maxWidth: '200px'
                    }}
                >
                    {tooltip.content}
                </div>
            )}

            {/* Header */}
            <div className="flex border-b border-slate-200 bg-slate-50">
                <div className="w-12 shrink-0 border-r border-slate-200"></div>
                {weekDates.map((date, i) => {
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isSelected = new Date(currentDate).toDateString() === date.toDateString();
                    return (
                        <div key={i} className={`flex-1 text-center py-2 border-r border-slate-100 last:border-r-0 ${isToday ? `bg-${theme.primary}-50` : ''}`}>
                            <div className={`text-xs font-medium ${isToday ? `text-${theme.primary}-600` : 'text-slate-500'}`}>
                                {['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]}
                            </div>
                            <div className={`text-sm font-bold ${isToday ? `text-${theme.primary}-700` : 'text-slate-700'} ${isSelected ? 'underline decoration-2 underline-offset-4' : ''}`}>
                                {date.getDate()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar" ref={containerRef}>
                <div className="flex min-h-[1080px] relative">

                    {/* Time Axis */}
                    <div className="w-12 shrink-0 border-r border-slate-200 bg-slate-50 text-xs text-slate-400 flex flex-col relative">
                        {hours.map(h => (
                            <div key={h} className="flex-1 border-b border-slate-100 relative">
                                <span className="absolute -top-2 right-1">{h}:00</span>
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    {weekDates.map((date, i) => {
                        const daySessions = weekSessions.filter(s => new Date(s.startTime).toDateString() === date.toDateString());
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <div key={i} className={`flex-1 border-r border-slate-100 last:border-r-0 relative ${isToday ? 'bg-slate-50/30' : ''}`}>
                                {/* Hour Grid Lines */}
                                {hours.map(h => (
                                    <div key={h} className="absolute w-full border-b border-slate-50 h-[4.166%] box-border" style={{ top: `${(h / 24) * 100}%` }}></div>
                                ))}

                                {/* Sessions */}
                                {daySessions.map(session => {
                                    const style = getSessionStyle(session);
                                    const task = tasks.find(t => t.id === session.taskId);
                                    const colors = getSessionColor(session);
                                    const isCustomColor = colors.bg.startsWith('bg-[') || colors.bg.startsWith('bg-orange') || colors.bg.startsWith('bg-blue'); // Simple check, but better to use style object for custom colors

                                    const customStyle = {
                                        ...style,
                                        ...(colors.bg.startsWith('bg-[') ? { backgroundColor: `${goals.find(g => g.id === tasks.find(t => t.id === session.taskId)?.goalId)?.color}1A` } : {}),
                                        ...(colors.border.startsWith('border-[') ? { borderColor: `${goals.find(g => g.id === tasks.find(t => t.id === session.taskId)?.goalId)?.color}33` } : {}),
                                        ...(colors.text.startsWith('text-[') ? { color: goals.find(g => g.id === tasks.find(t => t.id === session.taskId)?.goalId)?.color } : {})
                                    };

                                    return (
                                        <div
                                            key={session.id}
                                            className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] overflow-hidden border shadow-sm hover:z-10 hover:shadow-md transition-all cursor-pointer group ${!colors.bg.startsWith('bg-[') ? `${colors.bg} ${colors.border} ${colors.text}` : ''}`}
                                            style={customStyle}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isDraggingRef.current) return;
                                                onSessionClick(session);
                                            }}
                                            onMouseEnter={(e) => {
                                                setTooltip({
                                                    x: e.clientX,
                                                    y: e.clientY,
                                                    content: `${session.label} (${Math.floor(session.durationSeconds / 60)}m)`
                                                });
                                            }}
                                            onMouseMove={(e) => {
                                                setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                        >
                                            {/* Drag Handles */}
                                            <div
                                                className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-black/10 z-20"
                                                onMouseDown={(e) => handleMouseDown(e, session, 'start')}
                                                onClick={(e) => e.stopPropagation()}
                                            />

                                            <div className="font-bold truncate relative z-10 pointer-events-none">{session.label}</div>
                                            {task && <div className="truncate opacity-75 scale-90 origin-top-left relative z-10 pointer-events-none">{task.title}</div>}

                                            <div
                                                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-black/10 z-20"
                                                onMouseDown={(e) => handleMouseDown(e, session, 'end')}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
