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
            const sDate = new Date(s.startTime);
            return sDate >= start && sDate <= end;
        });
    }, [sessions, weekDates]);

    const getSessionColor = (session: Session) => {
        const task = tasks.find(t => t.id === session.taskId);
        if (task && task.goalId) {
            const goal = goals.find(g => g.id === task.goalId);
            if (goal && goal.color) {
                return {
                    bg: `bg-${goal.color}-100`,
                    border: `border-${goal.color}-200`,
                    text: `text-${goal.color}-800`
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

        const start = new Date(session.startTime);
        const end = session.endTime ? new Date(session.endTime) : new Date(start.getTime() + session.durationSeconds * 1000);
        setTempSessionTimes({ start, end });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingSessionId || !dragType || !tempSessionTimes || !containerRef.current) return;

        const deltaY = e.clientY - dragY;
        const containerHeight = 1000; // Fixed height from CSS
        // Calculate minutes delta: (deltaY / containerHeight) * 1440
        // But we need to be careful about scale. 
        // Actually, let's look at the relative movement.
        // The container is scrollable, but the mouse movement is screen relative.
        // We need to know how many pixels correspond to a minute.
        // The container inner height is 1000px for 1440 minutes.
        // So 1 minute = 1000 / 1440 pixels = 0.694 px

        const pixelsPerMinute = 1000 / 1440;
        const minutesDelta = deltaY / pixelsPerMinute;

        // Snap to 5 minutes
        const snappedDelta = Math.round(minutesDelta / 5) * 5;

        if (Math.abs(snappedDelta) < 5) return; // Ignore small movements

        const newTimes = { ...tempSessionTimes };

        if (dragType === 'start') {
            newTimes.start = new Date(tempSessionTimes.start.getTime() + snappedDelta * 60000);
            // Prevent start > end
            if (newTimes.start >= newTimes.end) {
                newTimes.start = new Date(newTimes.end.getTime() - 5 * 60000);
            }
        } else {
            newTimes.end = new Date(tempSessionTimes.end.getTime() + snappedDelta * 60000);
            // Prevent end < start
            if (newTimes.end <= newTimes.start) {
                newTimes.end = new Date(newTimes.start.getTime() + 5 * 60000);
            }
        }

        setTempSessionTimes(newTimes);
        setDragY(e.clientY); // Reset dragY to avoid accumulating large deltas
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
    };

    // Global mouse up/move listener for drag operation
    useEffect(() => {
        if (draggingSessionId) {
            const handleGlobalMouseMove = (e: MouseEvent) => {
                // We need to adapt the React MouseEvent logic to native MouseEvent
                // Re-using logic by calling a wrapper or just duplicating simple logic
                if (!draggingSessionId || !dragType || !tempSessionTimes) return;

                const deltaY = e.clientY - dragY;
                const pixelsPerMinute = 1000 / 1440;
                const minutesDelta = deltaY / pixelsPerMinute;
                const snappedDelta = Math.round(minutesDelta / 5) * 5;

                if (Math.abs(snappedDelta) < 5) return;

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
            };

            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleGlobalMouseMove);
                window.removeEventListener('mouseup', handleGlobalMouseUp);
            };
        }
    }, [draggingSessionId, dragY, dragType, tempSessionTimes, onSessionUpdate]);


    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <div className="flex flex-col h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-white select-none">
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
                <div className="flex min-h-[1000px] relative">

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

                                    return (
                                        <div
                                            key={session.id}
                                            className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] overflow-hidden border shadow-sm hover:z-10 hover:shadow-md transition-all cursor-pointer group ${colors.bg} ${colors.border} ${colors.text}`}
                                            style={style}
                                            title={`${session.label} (${Math.floor(session.durationSeconds / 60)}m)`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSessionClick(session);
                                            }}
                                        >
                                            {/* Drag Handles */}
                                            <div
                                                className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-black/10 z-20"
                                                onMouseDown={(e) => handleMouseDown(e, session, 'start')}
                                            />

                                            <div className="font-bold truncate relative z-10 pointer-events-none">{session.label}</div>
                                            {task && <div className="truncate opacity-75 scale-90 origin-top-left relative z-10 pointer-events-none">{task.title}</div>}

                                            <div
                                                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 hover:bg-black/10 z-20"
                                                onMouseDown={(e) => handleMouseDown(e, session, 'end')}
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
