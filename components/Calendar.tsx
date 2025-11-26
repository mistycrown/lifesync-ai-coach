import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    theme: any;
}

export const CalendarPopover: React.FC<CalendarProps> = ({ value, onChange, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            // Parse YYYY-MM-DD directly to avoid timezone issues
            const [y, m, d] = value.split('-').map(Number);
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
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 is Sunday

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
        onChange(dateStr);
        setIsOpen(false);
    };

    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-${theme.primary}-300 hover:text-${theme.primary}-600 transition-colors shadow-sm`}
            >
                <CalendarIcon size={16} className={`text-${theme.primary}-500`} />
                {value}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 w-72 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={18} /></button>
                        <span className="font-bold text-slate-700">{currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月</span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={18} /></button>
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
                            const isSelected = value === dateStr;

                            const today = new Date();
                            const isToday = today.getFullYear() === currentMonth.getFullYear() &&
                                today.getMonth() === currentMonth.getMonth() &&
                                today.getDate() === day;

                            return (
                                <button
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

                    <div className="mt-3 pt-3 border-t border-slate-50 flex justify-center">
                        <button
                            onClick={() => {
                                const today = new Date();
                                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                onChange(dateStr);
                                setIsOpen(false);
                            }}
                            className={`text-xs text-${theme.primary}-600 font-medium hover:underline`}
                        >
                            回到今天
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
