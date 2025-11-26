
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  goalId?: string; // Link to a goal
  deadline?: string; // Optional deadline for the task
}

export interface Goal {
  id: string;
  title: string;
  deadline: string; // ISO Date string
  completed: boolean;
  color?: string; // Hex code or tailwind color name
}

export interface Session {
  id: string;
  label: string;
  startTime: string; // ISO Date string
  endTime: string | null; // Null if currently running
  durationSeconds: number;
  taskId?: string; // Link to a task
  type?: 'focus' | 'checkin'; // Default is 'focus'
  checkInType?: 'morning' | 'night' | 'custom';
}

export interface DailyReport {
  id: string;
  date: string; // ISO Date string
  title: string; // New: AI generated title
  content: string;
  rating?: number; // 1-10
}

export type LLMProvider = 'gemini' | 'deepseek' | 'siliconflow' | 'openai';

export interface ModelConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  modelId: string;
}

export type StorageProvider = 'local' | 'supabase';

export interface StorageConfig {
  provider: StorageProvider;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface CoachSettings {
  name: string;
  userName: string; // How the coach addresses the user
  style: string; // The selected preset label or "Custom"
  userContext: string; // Background info about the user
  customInstruction?: string; // The actual system prompt (populated by preset or custom)
  customReportInstruction?: string; // Custom prompt for generating daily reports
  modelConfig: ModelConfig; // New: Model Configuration
}

export interface ActionData {
  type: 'ADD_TASK' | 'ADD_GOAL' | 'GENERATE_REPORT';
  title: string;
  details?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
  actionData?: ActionData; // New field for visual tool logs
}

export interface ChatSessionData {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface ThemeConfig {
  name: string;
  primary: string; // e.g., 'indigo'
  secondary: string; // e.g., 'violet'
  text: string;
  bg: string;
}

export interface AppState {
  tasks: Task[];
  goals: Goal[];
  sessions: Session[];
  reports: DailyReport[]; // Stored daily reports
  activeSessionId: string | null;
  coachSettings: CoachSettings;
  theme: string; // Key for the theme
  storageConfig: StorageConfig; // New: Database settings

  // Chat History
  chatSessions: ChatSessionData[];
  currentChatId: string | null;
}

export interface DashboardProps {
  tasks: Task[];
  goals: Goal[];
  sessions: Session[];
  reports: DailyReport[];
  activeSessionId: string | null;
  theme: ThemeConfig;

  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (title: string, goalId?: string) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;

  onAddGoal: (title: string, deadline: string) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateGoal: (id: string, title: string, deadline: string, color?: string) => void;

  onStartSession: (label: string, taskId?: string) => void;
  onStopSession: () => void;
  onAddSession: (label: string, startTime: string, durationSeconds: number, taskId?: string) => void;
  onUpdateSession: (id: string, label: string, startTime: string, endTime: string, taskId?: string) => void;
  onRenameSession: (id: string, newLabel: string) => void;
  onDeleteSession: (id: string) => void;
  onCheckIn: (type: 'morning' | 'night' | 'custom', label: string) => void;

  // Report Props
  onGenerateReport: (date?: string) => Promise<{ title: string, content: string }>;
  onSaveReport: (title: string, content: string, date?: string) => void;
  onUpdateReport: (id: string, content: string) => void;
  onDeleteReport: (id: string) => void;
}
