import React, { useState } from 'react';
import { DailyReport, ThemeConfig } from '../types';
import { X, Edit2, Save, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReportDetailsModalProps {
    report: DailyReport | null;
    theme: ThemeConfig;
    onClose: () => void;
    onSave: (id: string, content: string) => void;
    onDelete: (id: string) => void;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
    report,
    theme,
    onClose,
    onSave,
    onDelete
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(report?.content || '');

    if (!report) return null;

    const handleSave = () => {
        if (editContent.trim()) {
            onSave(report.id, editContent);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (confirm('确定要删除这篇每日复盘吗？此操作无法撤销。')) {
            onDelete(report.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold font-serif text-slate-800">{report.title}</h2>
                        <p className="text-sm text-slate-400 mt-1">{new Date(report.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="删除"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button
                                    onClick={() => {
                                        setEditContent(report.content);
                                        setIsEditing(true);
                                    }}
                                    className={`px-4 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700 transition-colors flex items-center gap-2 font-medium`}
                                >
                                    <Edit2 size={18} />
                                    编辑
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {isEditing ? (
                        <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full h-full min-h-[400px] p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-sans leading-relaxed text-slate-700"
                            placeholder="在此编辑每日复盘内容..."
                            autoFocus
                        />
                    ) : (
                        <div className="markdown-body">
                            <ReactMarkdown>{report.content}</ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Footer - Only show when editing */}
                {isEditing && (
                    <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditContent(report.content);
                            }}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            className={`px-6 py-2 bg-${theme.primary}-600 text-white rounded-lg hover:bg-${theme.primary}-700 shadow-lg shadow-${theme.primary}-200 transition-all font-medium flex items-center gap-2`}
                        >
                            <Save size={18} />
                            保存修改
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
