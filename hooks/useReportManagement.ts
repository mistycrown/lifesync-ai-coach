import { useCallback } from 'react';
import { DailyReport, AppState } from '../types';
import { CoachService } from '../services/geminiService';

interface UseReportManagementProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    coachService: CoachService;
}

interface UseReportManagementReturn {
    generateReport: (date?: string) => Promise<{ title: string; content: string }>;
    addReport: (title: string, content: string, date?: string) => void;
    updateReport: (id: string, content: string) => void;
    deleteReport: (id: string) => void;
}

/**
 * 每日复盘管理 Hook
 * 负责复盘的生成、保存、更新和删除
 * 
 * @param state - 应用状态
 * @param setState - 状态更新函数
 * @param coachService - AI 服务实例
 */
export const useReportManagement = ({
    state,
    setState,
    coachService
}: UseReportManagementProps): UseReportManagementReturn => {

    /**
     * 生成每日复盘
     */
    const generateReport = useCallback(async (date?: string) => {
        try {
            return await coachService.generateDailyReport(state, date);
        } catch (error) {
            console.error('Failed to generate report:', error);
            return {
                title: "错误",
                content: "生成日报失败，请稍后重试。"
            };
        }
    }, [state, coachService]);

    /**
     * 添加复盘
     */
    const addReport = useCallback((
        title: string,
        content: string,
        date?: string
    ) => {
        const newReport: DailyReport = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            date: date || new Date().toISOString(),
            title,
            content
        };

        setState(prev => ({
            ...prev,
            reports: [newReport, ...prev.reports]
        }));
    }, [setState]);

    /**
     * 更新复盘内容
     */
    const updateReport = useCallback((id: string, content: string) => {
        setState(prev => ({
            ...prev,
            reports: prev.reports.map(r =>
                r.id === id ? { ...r, content } : r
            )
        }));
    }, [setState]);

    /**
     * 删除复盘
     */
    const deleteReport = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            reports: prev.reports.filter(r => r.id !== id)
        }));
    }, [setState]);

    return {
        generateReport,
        addReport,
        updateReport,
        deleteReport
    };
};
