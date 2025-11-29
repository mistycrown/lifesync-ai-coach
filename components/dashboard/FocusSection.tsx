import React, { useState, useEffect } from 'react';
import { Play, Square, Clock, Edit2 } from 'lucide-react';
import { Session, ThemeConfig } from '../../types';

interface FocusSectionProps {
    activeSession: Session | undefined;
    theme: ThemeConfig;
    onStartSession: (label: string) => void;
    onStopSession: () => void;
    onRenameSession: (id: string, newLabel: string) => void;
}

export const FocusSection: React.FC<FocusSectionProps> = ({
    activeSession,
    theme,
    onStartSession,
    onStopSession,
    onRenameSession
}) => {
    const [elapsed, setElapsed] = useState(0);
    const [sessionLabel, setSessionLabel] = useState('');
    const [activeLabelEdit, setActiveLabelEdit] = useState('');
    const [isEditingActiveLabel, setIsEditingActiveLabel] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (activeSession) {
            const start = new Date(activeSession.startTime).getTime();
            // Update immediately to avoid 1s delay
            setElapsed(Math.floor((Date.now() - start) / 1000));

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

    return (
        <div className={`bg-white rounded-3xl p-8 shadow-float border border-white/50 flex flex-col md:flex-row items-center justify-between gap-6 transition-all`}>
            <div className="flex flex-col w-full md:w-auto">
                <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
                    <Clock className={`text-${theme.primary}-500`} /> 专注
                </h2>
                <div className="text-slate-500 text-sm mt-1 min-h-[24px]">
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
                                <Edit2 size={12} className="text-slate-300 transition-opacity" />
                            </div>
                        )
                    ) : '准备好开始新的工作了吗？'}
                </div>
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
    );
};
