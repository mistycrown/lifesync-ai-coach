import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
    value: string; // HH:mm
    onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse value
    const [h, m] = value.split(':').map(Number);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            >
                <Clock size={16} className="text-slate-400" />
                <span className="font-mono">{value}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 left-0 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 flex gap-2 w-48 animate-in fade-in zoom-in-95 duration-200">
                    {/* Hours */}
                    <div className="flex-1 h-48 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-medium text-slate-400 text-center mb-1 sticky top-0 bg-white">时</div>
                        <div className="space-y-1">
                            {hours.map(hour => (
                                <button
                                    key={hour}
                                    onClick={() => onChange(`${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`)}
                                    className={`w-full text-center py-1 rounded text-sm ${hour === h ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {String(hour).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-[1px] bg-slate-100 my-2"></div>

                    {/* Minutes */}
                    <div className="flex-1 h-48 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-medium text-slate-400 text-center mb-1 sticky top-0 bg-white">分</div>
                        <div className="space-y-1">
                            {minutes.map(minute => (
                                <button
                                    key={minute}
                                    onClick={() => onChange(`${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)}
                                    className={`w-full text-center py-1 rounded text-sm ${minute === m ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {String(minute).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
