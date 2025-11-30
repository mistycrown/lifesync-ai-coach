import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Flag, FileText, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ChatInterface from './ChatInterface';
import { FocusSection } from './dashboard/FocusSection';
import { TasksSection } from './dashboard/TasksSection';
import { GoalsSection } from './dashboard/GoalsSection';
import { RecordsSection } from './dashboard/RecordsSection';
import { SettingsView } from './SettingsView';
import { VisionDetailsModal } from './VisionDetailsModal';
import { SessionDetailsModal } from './SessionDetailsModal';
import { ReportDetailsModal } from './ReportDetailsModal';
import { HabitDetailsModal } from './HabitDetailsModal';
import { TaskDetailsModal } from './TaskDetailsModal';
import { GoalDetailsModal } from './GoalDetailsModal';

export const MobileLayout: React.FC = () => {
    const {
        state,
        theme,
        actions,
        viewingTaskId, setViewingTaskId,
        viewingGoalId, setViewingGoalId,
        viewingVisionId, setViewingVisionId,
        viewingReportId, setViewingReportId,
        viewingSessionId, setViewingSessionId,
        viewingHabitId, setViewingHabitId,
        // Settings related
        localSettings, setLocalSettings,
        settingsTab, setSettingsTab,
        isTestingConnection, connectionTestResult,
        isTestingStorage, storageTestResult,
        isSyncing, syncMessage,
        pendingCloudData, restoreSource,
        fileInputRef,
        messages,
        isLoading
    } = useApp();

    const [activeTab, setActiveTab] = useState<'chat' | 'focus' | 'goals' | 'records' | 'settings'>('chat');

    const activeSession = state.sessions.find(s => s.id === state.activeSessionId);

    const renderContent = () => {
        switch (activeTab) {
            case 'chat':
                return (
                    <div className="h-full pb-16">
                        <ChatInterface
                            messages={messages}
                            onSendMessage={actions.sendMessage}
                            isLoading={isLoading}
                            settings={state.coachSettings}
                            theme={theme}
                            chatSessions={state.chatSessions}
                            currentChatId={state.currentChatId}
                            onNewChat={actions.createNewChat}
                            onSelectChat={actions.selectChat}
                            onDeleteChat={actions.deleteChat}
                            onCloseChat={() => { }} // No close on mobile tab
                        />
                    </div>
                );
            case 'focus':
                return (
                    <div className="h-full overflow-y-auto p-4 pb-24 space-y-6 custom-scrollbar">
                        <FocusSection
                            activeSession={activeSession}
                            theme={theme}
                            onStartSession={actions.startSession}
                            onStopSession={actions.stopSession}
                            onRenameSession={actions.renameSession}
                        />
                        <TasksSection
                            tasks={state.tasks}
                            goals={state.goals}
                            sessions={state.sessions}
                            habits={state.habits}
                            theme={theme}
                            activeSession={activeSession}
                            onToggleTask={actions.toggleTask}
                            onDeleteTask={actions.deleteTask}
                            onAddTask={actions.addTask}
                            onStartSession={actions.startSession}
                            onAddHabit={actions.addHabit}
                            onToggleCheckIn={actions.toggleCheckIn}
                            setViewingTaskId={setViewingTaskId}
                            setViewingHabitId={setViewingHabitId}
                        />
                    </div>
                );
            case 'goals':
                return (
                    <div className="h-full overflow-y-auto p-4 pb-24 custom-scrollbar">
                        <GoalsSection
                            goals={state.goals}
                            visions={state.visions}
                            tasks={state.tasks}
                            sessions={state.sessions}
                            theme={theme}
                            onAddGoal={actions.addGoal}
                            onToggleGoal={actions.toggleGoal}
                            onDeleteGoal={actions.deleteGoal}
                            onUpdateGoal={actions.updateGoal}
                            onAddVision={actions.addVision}
                            onUpdateVision={actions.updateVision}
                            onDeleteVision={actions.deleteVision}
                            onToggleVisionArchived={actions.toggleVisionArchived}
                            setViewingGoalId={setViewingGoalId}
                            setViewingVisionId={setViewingVisionId}
                        />
                    </div>
                );
            case 'records':
                return (
                    <div className="h-full overflow-y-auto p-4 pb-24 custom-scrollbar">
                        <RecordsSection
                            sessions={state.sessions}
                            tasks={state.tasks}
                            goals={state.goals}
                            habits={state.habits}
                            reports={state.reports}
                            theme={theme}
                            onAddSession={actions.addSession}
                            onUpdateSession={actions.updateSession}
                            onDeleteSession={actions.deleteSession}
                            onGenerateReport={actions.generateReport}
                            onSaveReport={actions.saveReport}
                            onUpdateReport={actions.updateReport}
                            onDeleteReport={actions.deleteReport}
                            setViewingReportId={setViewingReportId}
                            setViewingSessionId={setViewingSessionId}
                        />
                    </div>
                );
            case 'settings':
                return (
                    <div className="h-full pb-16">
                        <SettingsView
                            state={state}
                            localSettings={localSettings}
                            setLocalSettings={setLocalSettings}
                            currentTheme={theme}
                            settingsTab={settingsTab}
                            setSettingsTab={setSettingsTab}
                            onSave={actions.saveSettings}
                            onCancel={actions.cancelSettings}
                            onUpdateTheme={actions.updateTheme}
                            isTestingConnection={isTestingConnection}
                            connectionTestResult={connectionTestResult}
                            onTestConnection={actions.testConnection}
                            isTestingStorage={isTestingStorage}
                            storageTestResult={storageTestResult}
                            onTestStorageConnection={actions.testStorageConnection}
                            isSyncing={isSyncing}
                            syncMessage={syncMessage}
                            onSyncToCloud={actions.syncToCloud}
                            onSyncFromCloud={actions.syncFromCloud}
                            pendingCloudData={pendingCloudData}
                            restoreSource={restoreSource}
                            onConfirmRestore={actions.confirmRestore}
                            onCancelRestore={actions.cancelRestore}
                            onExportData={actions.exportData}
                            onImportData={actions.importData}
                            onHandleImportClick={actions.handleImportClick}
                            fileInputRef={fileInputRef}
                        />
                    </div>
                );
        }
    };

    return (
        <div className={`h-screen flex flex-col ${theme.bg}`}>
            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {renderContent()}
            </div>

            {/* Modals */}
            {viewingVisionId && (
                <VisionDetailsModal
                    vision={state.visions.find(v => v.id === viewingVisionId)!}
                    onClose={() => setViewingVisionId(null)}
                    onUpdateVision={actions.updateVision}
                    onDeleteVision={actions.deleteVision}
                    theme={theme}
                    goals={state.goals}
                    tasks={state.tasks}
                    sessions={state.sessions}
                />
            )}

            {viewingSessionId && (
                <SessionDetailsModal
                    session={state.sessions.find(s => s.id === viewingSessionId)!}
                    onClose={() => setViewingSessionId(null)}
                    onUpdateSession={actions.updateSession}
                    onDeleteSession={actions.deleteSession}
                    theme={theme}
                    tasks={state.tasks}
                />
            )}

            {viewingReportId && (
                <ReportDetailsModal
                    report={state.reports.find(r => r.id === viewingReportId)!}
                    onClose={() => setViewingReportId(null)}
                    onSave={actions.updateReport}
                    onDelete={actions.deleteReport}
                    theme={theme}
                />
            )}

            {viewingHabitId && (
                <HabitDetailsModal
                    habit={state.habits.find(h => h.id === viewingHabitId)!}
                    onClose={() => setViewingHabitId(null)}
                    onUpdateHabit={actions.updateHabit}
                    onDeleteHabit={actions.deleteHabit}
                    onToggleCheckIn={actions.toggleCheckIn}
                    theme={theme}
                    sessions={state.sessions}
                />
            )}

            {viewingTaskId && (
                <TaskDetailsModal
                    task={state.tasks.find(t => t.id === viewingTaskId)!}
                    onClose={() => setViewingTaskId(null)}
                    onUpdate={actions.updateTask}
                    onDelete={actions.deleteTask}
                    theme={theme}
                    goals={state.goals}
                    sessions={state.sessions}
                />
            )}

            {viewingGoalId && (
                <GoalDetailsModal
                    goal={state.goals.find(g => g.id === viewingGoalId)!}
                    onClose={() => setViewingGoalId(null)}
                    onUpdate={actions.updateGoal}
                    onDelete={actions.deleteGoal}
                    theme={theme}
                    tasks={state.tasks}
                    sessions={state.sessions}
                    visions={state.visions}
                />
            )}

            {/* Bottom Navigation Bar */}
            <div className="h-16 bg-white border-t border-slate-200 flex items-center justify-around shrink-0 z-50 fixed bottom-0 w-full pb-safe">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'chat' ? `text-${theme.primary}-600` : 'text-slate-400'}`}
                >
                    <MessageSquare size={24} />
                </button>
                <button
                    onClick={() => setActiveTab('focus')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'focus' ? `text-${theme.primary}-600` : 'text-slate-400'}`}
                >
                    <CheckCircle size={24} />
                </button>
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'goals' ? `text-${theme.primary}-600` : 'text-slate-400'}`}
                >
                    <Flag size={24} />
                </button>
                <button
                    onClick={() => setActiveTab('records')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'records' ? `text-${theme.primary}-600` : 'text-slate-400'}`}
                >
                    <FileText size={24} />
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'settings' ? `text-${theme.primary}-600` : 'text-slate-400'}`}
                >
                    <Settings size={24} />
                </button>
            </div>
        </div>
    );
};
