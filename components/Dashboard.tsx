import React from 'react';
import { useApp } from '../contexts/AppContext';
import { FocusSection } from './dashboard/FocusSection';
import { TasksSection } from './dashboard/TasksSection';
import { GoalsSection } from './dashboard/GoalsSection';
import { RecordsSection } from './dashboard/RecordsSection';
import { VisionDetailsModal } from './VisionDetailsModal';
import { SessionDetailsModal } from './SessionDetailsModal';
import { ReportDetailsModal } from './ReportDetailsModal';
import { HabitDetailsModal } from './HabitDetailsModal';
import { TaskDetailsModal } from './TaskDetailsModal';
import { GoalDetailsModal } from './GoalDetailsModal';

export const Dashboard: React.FC = () => {
  const {
    state,
    theme,
    viewingTaskId, setViewingTaskId,
    viewingGoalId, setViewingGoalId,
    viewingVisionId, setViewingVisionId,
    viewingReportId, setViewingReportId,
    viewingSessionId, setViewingSessionId,
    viewingHabitId, setViewingHabitId,
    actions
  } = useApp();

  const { tasks, goals, visions, sessions, reports, activeSessionId, habits } = state;
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">

        {/* Section 1: Focus Timer */}
        <FocusSection
          activeSession={activeSession}
          theme={theme}
          onStartSession={actions.startSession}
          onStopSession={actions.stopSession}
          onRenameSession={actions.renameSession}
          sessions={sessions}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 2: Tasks & Habits */}
          <TasksSection
            tasks={tasks}
            goals={goals}
            sessions={sessions}
            habits={habits}
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

          {/* Section 3: Goals & Visions */}
          <GoalsSection
            goals={goals}
            visions={visions}
            tasks={tasks}
            sessions={sessions}
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

          {/* Section 4: History & Reports (Full Width on Mobile, Col Span 2 on Large) */}
          <RecordsSection
            sessions={sessions}
            tasks={tasks}
            goals={goals}
            habits={habits}
            reports={reports}
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
      </div>

      {/* Modals */}
      {viewingVisionId && (
        <VisionDetailsModal
          vision={visions.find(v => v.id === viewingVisionId)!}
          onClose={() => setViewingVisionId(null)}
          onUpdateVision={actions.updateVision}
          onDeleteVision={actions.deleteVision}
          theme={theme}
          goals={goals}
          tasks={tasks}
          sessions={sessions}
        />
      )}

      {viewingSessionId && (
        <SessionDetailsModal
          session={sessions.find(s => s.id === viewingSessionId)!}
          onClose={() => setViewingSessionId(null)}
          onUpdateSession={actions.updateSession}
          onDeleteSession={actions.deleteSession}
          theme={theme}
          tasks={tasks}
        />
      )}

      {viewingReportId && (
        <ReportDetailsModal
          report={reports.find(r => r.id === viewingReportId)!}
          onClose={() => setViewingReportId(null)}
          onSave={actions.updateReport}
          onDelete={actions.deleteReport}
          theme={theme}
        />
      )}

      {viewingHabitId && (
        <HabitDetailsModal
          habit={habits.find(h => h.id === viewingHabitId)!}
          onClose={() => setViewingHabitId(null)}
          onUpdateHabit={actions.updateHabit}
          onDeleteHabit={actions.deleteHabit}
          onToggleCheckIn={actions.toggleCheckIn}
          theme={theme}
          sessions={sessions}
        />
      )}

      {viewingTaskId && (
        <TaskDetailsModal
          task={tasks.find(t => t.id === viewingTaskId)!}
          onClose={() => setViewingTaskId(null)}
          onUpdate={actions.updateTask}
          onDelete={actions.deleteTask}
          theme={theme}
          goals={goals}
          sessions={sessions}
        />
      )}

      {viewingGoalId && (
        <GoalDetailsModal
          goal={goals.find(g => g.id === viewingGoalId)!}
          onClose={() => setViewingGoalId(null)}
          onUpdate={actions.updateGoal}
          onDelete={actions.deleteGoal}
          theme={theme}
          tasks={tasks}
          sessions={sessions}
          visions={visions}
        />
      )}

    </div>
  );
};
