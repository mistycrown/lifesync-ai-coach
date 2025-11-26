import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePickerProps {
    value: string; // HH:mm
    onChange: (time: string) => void;
    theme: any;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hoursRef = useRef<HTMLDivElement>(null);
    const minutesRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to selected time when opening
    useEffect(() => {
        if (isOpen && value) {
            const [h, m] = value.split(':').map(Number);
            if (hoursRef.current) {
                const hourEl = hoursRef.current.children[h] as HTMLElement;
                if (hourEl) hoursRef.current.scrollTop = hourEl.offsetTop - hoursRef.current.offsetTop - 60;
            }
            if (minutesRef.current) {
                const minuteEl = minutesRef.current.children[m] as HTMLElement;
                if (minuteEl) minutesRef.current.scrollTop = minuteEl.offsetTop - minutesRef.current.offsetTop - 60;
            }
        }
    }, [isOpen, value]);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const [selectedHour, selectedMinute] = value.split(':').map(Number);

    const handleTimeChange = (h: number, m: number) => {
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        onChange(timeStr);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-${theme.primary}-300 hover:text-${theme.primary}-600 transition-colors shadow-sm w-full justify-between`}
            >
                <div className="flex items-center gap-2">
                    <Clock size={16} className={`text-${theme.primary}-500`} />
                    {value}
                </div>
                <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 w-48 z-50 flex gap-2 h-64 animate-in fade-in zoom-in-95 duration-200">
                    {/* Hours */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="text-xs font-bold text-slate-400 text-center mb-1 pb-1 border-b border-slate-50">时</div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={hoursRef}>
                            {hours.map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => handleTimeChange(h, selectedMinute)}
                                    className={`w-full text-center py-1.5 text-sm rounded-lg transition-colors ${h === selectedHour
                                            ? `bg-${theme.primary}-50 text-${theme.primary}-600 font-bold`
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {String(h).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Separator */}
                    <div className="w-[1px] bg-slate-100 my-2"></div>

                    {/* Minutes */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="text-xs font-bold text-slate-400 text-center mb-1 pb-1 border-b border-slate-50">分</div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar" ref={minutesRef}>
                            {minutes.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => handleTimeChange(selectedHour, m)}
                                    className={`w-full text-center py-1.5 text-sm rounded-lg transition-colors ${m === selectedMinute
                                            ? `bg-${theme.primary}-50 text-${theme.primary}-600 font-bold`
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    {String(m).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
