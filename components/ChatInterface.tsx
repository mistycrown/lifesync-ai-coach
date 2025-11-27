
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, CheckSquare, Flag, FileText, PlusCircle, History, Trash2, X, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, CoachSettings, ThemeConfig, ChatSessionData } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  settings: CoachSettings;
  theme: ThemeConfig;

  // History Props
  chatSessions: ChatSessionData[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onCloseChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  settings,
  theme,
  chatSessions,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onCloseChat
}) => {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-100 shadow-float relative overflow-hidden">
      {/* Header - Fixed Height 64px */}
      <div className={`h-16 px-6 border-b border-slate-100 bg-white flex items-center justify-between shrink-0`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-${theme.primary}-500 to-${theme.secondary}-600 flex items-center justify-center shadow-md`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 leading-tight font-serif tracking-tight">{settings.name}</h2>
            <p className={`text-xs text-${theme.primary}-600 font-medium leading-tight`}>{settings.style.split(' ')[0]}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onNewChat}
            className={`p-2 rounded-lg text-slate-400 hover:text-${theme.primary}-600 hover:bg-slate-50 transition-colors`}
            title="新对话"
          >
            <PlusCircle size={20} />
          </button>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${showHistory ? `text-${theme.primary}-600 bg-slate-50` : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            title="历史记录"
          >
            <History size={20} />
          </button>
          <button
            onClick={onCloseChat}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            title="关闭聊天"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* History Overlay Drawer */}
      <div className={`absolute top-16 left-0 w-full bottom-0 bg-white z-20 transition-transform duration-300 ease-in-out flex flex-col ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <span className="font-bold text-slate-700 font-serif">历史对话</span>
          <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {chatSessions.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">暂无历史记录</p>
          )}
          {chatSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(session => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer border ${currentChatId === session.id ? `bg-${theme.primary}-50 border-${theme.primary}-100` : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
              onClick={() => {
                onSelectChat(session.id);
                setShowHistory(false);
              }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-2 rounded-lg ${currentChatId === session.id ? `bg-${theme.primary}-100 text-${theme.primary}-600` : 'bg-slate-100 text-slate-500'}`}>
                  <MessageSquare size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className={`text-sm font-medium truncate ${currentChatId === session.id ? `text-${theme.primary}-800` : 'text-slate-700'}`}>
                    {session.title || "新对话"}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session.id);
                }}
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <div className={`w-16 h-16 bg-${theme.primary}-50 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Bot className={`text-${theme.primary}-400`} size={32} />
            </div>
            <p className="text-sm font-medium text-slate-500">你好！我是 {settings.name}。</p>
            <p className="text-xs text-slate-400 mt-1">让我们开始规划你的一天，或者开启一段专注工作吧。</p>
          </div>
        )}

        {messages.map((msg) => {
          // Special Rendering for Action Logs
          if (msg.actionData) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <div className="bg-white border border-slate-100 text-slate-500 rounded-full px-4 py-1.5 text-xs flex items-center gap-2 shadow-sm">
                  {msg.actionData.type === 'ADD_TASK' && <CheckSquare size={14} className="text-emerald-500" />}
                  {msg.actionData.type === 'ADD_GOAL' && <Flag size={14} className={`text-${theme.primary}-500`} />}
                  {msg.actionData.type === 'GENERATE_REPORT' && <FileText size={14} className="text-amber-500" />}
                  {msg.actionData.type === 'CHECK_IN' && <CheckSquare size={14} className="text-blue-500" />}
                  <span>{msg.text}</span>
                </div>
              </div>
            )
          }

          // Standard Chat Messages
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end chat-user' : 'justify-start chat-bot'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${msg.role === 'user'
                    ? `bg-gradient-to-br from-${theme.primary}-600 to-${theme.secondary}-600 text-white rounded-br-none shadow-md`
                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm'
                  }`}
              >
                <div className="markdown-body">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-4 shadow-sm">
              <Loader2 className={`w-5 h-5 animate-spin text-${theme.primary}-500`} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className={`flex items-center space-x-2 bg-slate-50 rounded-2xl px-4 py-2 border border-slate-200 focus-within:border-${theme.primary}-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-${theme.primary}-100 transition-all shadow-inner`}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 py-1"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-xl bg-${theme.primary}-600 text-white hover:bg-${theme.primary}-700 disabled:opacity-50 disabled:hover:bg-${theme.primary}-600 transition-colors shadow-sm`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
