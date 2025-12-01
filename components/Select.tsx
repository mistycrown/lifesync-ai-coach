import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ThemeConfig } from '../types';

interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    theme: ThemeConfig;
    className?: string;
    placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    theme,
    className = '',
    placeholder = "请选择"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll to selected item when opening
    useEffect(() => {
        if (isOpen && listRef.current) {
            const selectedElement = listRef.current.querySelector('[data-selected="true"]');
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [isOpen]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-white border rounded-xl px-4 py-2.5 text-sm transition-all shadow-sm ${isOpen
                    ? `border-${theme.primary}-500 ring-2 ring-${theme.primary}-100`
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
            >
                <span className={`truncate ${!value ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    {options.find(opt => opt.value === value)?.label || placeholder}
                </span>
                <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    ref={listRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
                >
                    {options.map((option) => {
                        const isSelected = value === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                data-selected={isSelected}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${isSelected
                                    ? `bg-${theme.primary}-500 text-white font-medium`
                                    : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="truncate">{option.label}</span>
                                {isSelected && <Check size={16} className="text-white" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
