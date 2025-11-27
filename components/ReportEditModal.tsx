import React, { useState, useEffect } from 'react';
import { DailyReport, ThemeConfig } from '../types';
import { X, Save } from 'lucide-react';

interface ReportEditModalProps {
    report: DailyReport | null;
    theme: ThemeConfig;
    onClose: () => void;
    onSave: (id: string, content: string) => void;
}

export const ReportEditModal: React.FC<ReportEditModalProps> = ({
    report,
    theme,
    onClose,
    onSave
}) => {
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (report) {
            setEditContent(report.content);
        }
    }, [report]);

    if (!report) return null;

    const handleSave = () => {
        if (editContent.trim()) {
            onSave(report.id, editContent);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold font-serif text-slate-800">编辑每日复盘</h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full h-96 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-sans leading-relaxed text-slate-700"
                        placeholder="在此编辑每日复盘内容..."
                    />
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">取消</button>
                    <button
                        onClick={handleSave}
                        className={`px-6 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700 shadow-lg shadow-${theme.primary}-200 transition-all font-medium flex items-center gap-2`}
                    >
                        <Save size={18} />
                        保存修改
                    </button>
                </div>
            </div>
        </div>
    );
};
