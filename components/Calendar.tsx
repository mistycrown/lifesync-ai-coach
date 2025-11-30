import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarProps {
    value: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
    onChange: (date: string) => void;
    theme: any;
    variant?: 'full' | 'icon' | 'responsive';
    placement?: 'top' | 'bottom';
    align?: 'left' | 'right';
    showTime?: boolean;
}

export const CalendarPopover: React.FC<CalendarProps> = ({ value, onChange, theme, variant = 'responsive', placement = 'bottom', align = 'left', showTime = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [time, setTime] = useState('00:00');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const datePart = value.split('T')[0].split(' ')[0];
            const timePart = value.includes('T') ? value.split('T')[1] : (value.includes(' ') ? value.split(' ')[1] : '00:00');

            if (timePart) setTime(timePart.slice(0, 5));

            const [y, m, d] = datePart.split('-').map(Number);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
                setCurrentMonth(new Date(y, m - 1, d));
            }
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        if (showTime) {
            onChange(`${dateStr}T${time}`);
        } else {
            onChange(dateStr);
            setIsOpen(false);
        }
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value;
        setTime(newTime);
        // Update parent immediately if date is already selected (which it implicitly is via currentMonth/value)
        // But we need the current selected day. 
        // Let's extract current selected day from value if possible, else use today? 
        // Better: extract from 'value' prop.
        if (value) {
            const datePart = value.split('T')[0].split(' ')[0];
            onChange(`${datePart}T${newTime}`);
        }
    };

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    const getTextClass = () => {
        switch (variant) {
            case 'full': return 'whitespace-nowrap';
            case 'icon': return 'hidden';
            case 'responsive': return 'hidden sm:inline whitespace-nowrap';
            default: return 'hidden sm:inline whitespace-nowrap';
        }
    };

    const displayValue = showTime ? value.replace('T', ' ').slice(0, 16) : value;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center gap-2 px-2 py-2 xl:px-3 xl:py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-${theme.primary}-300 hover:text-${theme.primary}-600 transition-colors shadow-sm w-full`}
                title={displayValue}
            >
                <CalendarIcon size={16} className={`text-${theme.primary}-500 shrink-0`} />
                <span className={getTextClass()}>{displayValue || '选择日期'}</span>
            </button>

            {isOpen && (
                <div className={`absolute ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'} bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-72 z-50 animate-in fade-in zoom-in-95 duration-200`}>
                    <div className="flex justify-between items-center mb-4">
                        <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={18} /></button>
                        <span className="font-bold text-slate-700">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
                        <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={18} /></button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map(d => (
                            <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            // Check match for date part only
                            const valueDatePart = value ? value.split('T')[0].split(' ')[0] : '';
                            const isSelected = valueDatePart === dateStr;

                            const today = new Date();
                            const isToday = today.getFullYear() === currentMonth.getFullYear() &&
                                today.getMonth() === currentMonth.getMonth() &&
                                today.getDate() === day;

                            return (
                                <button
                                    type="button"
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                    h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors
                    ${isSelected ? `bg-${theme.primary}-500 text-white shadow-md shadow-${theme.primary}-200` : 'hover:bg-slate-100 text-slate-700'}
                    ${isToday && !isSelected ? `border border-${theme.primary}-200 text-${theme.primary}-600 font-bold` : ''}
                  `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {showTime && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                            <label className="block text-xs font-medium text-slate-500 mb-1">时间</label>
                            <input
                                type="time"
                                value={time}
                                onChange={handleTimeChange}
                                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date();
                                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                if (showTime) {
                                    const nowTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
                                    onChange(`${dateStr}T${nowTime}`);
                                    setTime(nowTime);
                                } else {
                                    onChange(dateStr);
                                    setIsOpen(false);
                                }
                            }}
                            className={`text-xs text-${theme.primary}-600 font-medium hover:underline`}
                        >
                            今天
                        </button>
                        {showTime && (
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className={`px-3 py-1 bg-${theme.primary}-600 text-white text-xs rounded-lg hover:bg-${theme.primary}-700`}
                            >
                                确定
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
