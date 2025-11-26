
import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse, Chat } from "@google/genai";
import { AppState, ChatMessage, ModelConfig } from "../types";

// --- Tool Definitions (Gemini Format) ---

const addTaskDeclaration: FunctionDeclaration = {
  name: 'addTask',
  parameters: {
    type: Type.OBJECT,
    description: 'Add a new task to the user\'s to-do list.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'The content or title of the task.',
      },
    },
    required: ['title'],
  },
};

const addGoalDeclaration: FunctionDeclaration = {
  name: 'addGoal',
  parameters: {
    type: Type.OBJECT,
    description: 'Add a new long-term goal or deadline item.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'The goal title.',
      },
      deadline: {
        type: Type.STRING,
        description: 'The deadline date in YYYY-MM-DD format.',
      },
    },
    required: ['title', 'deadline'],
  },
};

// --- OpenAI Tool Conversion Helper ---
const getOpenAITools = () => {
  return [
    {
      type: "function",
      function: {
        name: "addTask",
        description: "Add a new task to the user's to-do list.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "The content or title of the task." }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "addGoal",
        description: "Add a new long-term goal or deadline item.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "The goal title." },
            deadline: { type: "string", description: "The deadline date in YYYY-MM-DD format." }
          },
          required: ["title", "deadline"]
        }
      }
    }
  ];
};

// --- OpenAI Compatible Client ---

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string; // for tool role
}

class OpenAICompatibleClient {
  private config: ModelConfig;
  private history: OpenAIMessage[] = [];

  constructor(config: ModelConfig) {
    this.config = config;
  }

  setSystemInstruction(instruction: string) {
    // Reset history and set system prompt
    this.history = [{ role: 'system', content: instruction }];
  }

  async sendMessage(content: string, isToolResponse = false, toolCallId?: string, toolName?: string): Promise<{ response: string, toolCalls?: { name: string, args: any }[] }> {
    const url = `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
    
    // 1. Update History
    if (isToolResponse && toolCallId) {
      this.history.push({
        role: 'tool',
        tool_call_id: toolCallId,
        name: toolName,
        content: content
      });
    } else {
      this.history.push({ role: 'user', content: content });
    }

    // 2. Call API
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.modelId,
          messages: this.history,
          tools: getOpenAITools(),
          stream: false
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error (${response.status}): ${err}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      if (!message) throw new Error("No response from API");

      // 3. Append Assistant Message to History
      this.history.push(message);

      // 4. Process Tool Calls
      const toolCalls: { name: string, args: any, id: string }[] = [];
      if (message.tool_calls) {
        for (const tc of message.tool_calls) {
            if (tc.type === 'function') {
                try {
                    toolCalls.push({
                        name: tc.function.name,
                        args: JSON.parse(tc.function.arguments),
                        id: tc.id
                    });
                } catch (e) {
                    console.error("Failed to parse tool args", e);
                }
            }
        }
      }

      return {
        response: message.content || "",
        toolCalls: toolCalls.map(tc => ({ name: tc.name, args: tc.args, id: tc.id }))
      };

    } catch (error) {
      console.error("OpenAI Client Error:", error);
      throw error;
    }
  }
}

// --- Main Service Class ---

export class CoachService {
  private geminiChat: Chat | null = null;
  private openaiClient: OpenAICompatibleClient | null = null;
  private currentConfig: ModelConfig | null = null;

  constructor() {}

  private getSystemInstruction(state: AppState): string {
    const { coachSettings, tasks, goals, sessions, activeSessionId } = state;
    
    // Calculate daily stats for context
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(s => new Date(s.startTime).toDateString() === today && s.endTime);
    
    // Format Lists
    const pendingTasks = tasks.filter(t => !t.completed).map(t => `- ${t.title}`).join('\n') || "(无)";
    const activeGoals = goals.filter(g => !g.completed).map(g => `- ${g.title} (截止: ${g.deadline})`).join('\n') || "(无)";
    const logs = todaySessions.map(s => `- ${s.label}: ${Math.floor(s.durationSeconds / 60)}分钟`).join('\n') || "(无)";
    
    // Active Task
    const activeSession = sessions.find(s => s.id === activeSessionId);
    const activeTask = activeSession ? activeSession.label : "(当前没有正在进行的工作)";

    // Determine the core instruction
    const personalityInstruction = coachSettings.customInstruction && coachSettings.customInstruction.trim() !== '' 
        ? coachSettings.customInstruction 
        : "你是一个乐于助人的AI教练。";

    const basePrompt = `
你是一个由用户自定义的“AI人生教练”，你的名字叫 "${coachSettings.name}"。
用户的名字/称呼是 "${coachSettings.userName || '学员'}"。

【软件理念】：
- 我们的核心理念是“Focus on Today”（专注当下）。
- 引导用户“日事日毕”，不要过度焦虑未来，先把今天过好。
- “待办事项”关注今天要做的事，“目标”关注跨天的长期愿景。

【你的核心人设与风格 (必须严格遵守)】:
${personalityInstruction}

【用户背景信息】：
${coachSettings.userContext}

【当前系统数据 (实时)】：
- 当前时间：${new Date().toLocaleString('zh-CN')}
- 正在进行的任务：${activeTask}
- ⛔️ 尚未完成的待办事项：
${pendingTasks}
- 🌟 长期目标：
${activeGoals}
- ⏱️ 今日时间轴记录：
${logs}

【你的职责】：
1. 严格遵循【核心人设与风格】进行回复。
2. 你的回复必须简短精炼，格式清晰（善用Markdown），像真人聊天一样。
3. 当用户说“早安”时，引导他们思考今天的核心任务（Top 3）。
4. 当用户说“晚安”时，请检查“尚未完成的待办事项”和“今日时间轴记录”。如果还有待办未完成，根据你的风格指出；如果完成了，给予肯定。最后给予温暖的结束语。
5. 你有权限操作用户的列表。如果你在对话中决定添加任务或目标，请务必使用提供的工具 (Tools)。

【防重复机制】：
- 当用户说“我添加了...”、“我设定了...”或“我完成了...”时，这表示用户已经手动在界面完成了操作。
- 在这种情况下，**不要**再次调用工具添加任务，否则会导致数据重复。
- 你只需要针对用户的行为给予口头鼓励或点评即可。
    `;

    return basePrompt;
  }

  // Initialize or Reset Chat based on Provider
  startChat(state: AppState) {
    const config = state.coachSettings.modelConfig;
    this.currentConfig = config;

    if (config.provider === 'gemini') {
      const apiKey = config.apiKey || process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      this.geminiChat = ai.chats.create({
        model: config.modelId || 'gemini-2.5-flash',
        config: {
          systemInstruction: this.getSystemInstruction(state),
          tools: [{ functionDeclarations: [addTaskDeclaration, addGoalDeclaration] }],
        },
      });
      this.openaiClient = null;
    } else {
      // OpenAI Compatible Providers (DeepSeek, SiliconFlow, Custom)
      this.openaiClient = new OpenAICompatibleClient(config);
      this.openaiClient.setSystemInstruction(this.getSystemInstruction(state));
      this.geminiChat = null;
    }
  }

  async sendMessage(message: string, currentState: AppState): Promise<{ 
    response: string, 
    toolCalls?: { name: string, args: any, id?: string }[] 
  }> {
    // Ensure chat is initialized if switching configs or first run
    if (!this.currentConfig || JSON.stringify(this.currentConfig) !== JSON.stringify(currentState.coachSettings.modelConfig)) {
        this.startChat(currentState);
    }
    
    try {
      if (this.currentConfig?.provider === 'gemini') {
        const result = await this.geminiChat!.sendMessage({ message });
        return this.processGeminiResponse(result);
      } else {
        return await this.openaiClient!.sendMessage(message);
      }
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  async sendToolResponse(
    functionName: string, 
    functionResponse: any,
    toolId?: string // Required for OpenAI
  ): Promise<{ response: string, toolCalls?: { name: string, args: any, id?: string }[] }> {
    
    if (this.currentConfig?.provider === 'gemini') {
        const parts = [{
          functionResponse: {
            name: functionName,
            response: { result: functionResponse } 
          }
        }];
        const result = await this.geminiChat!.sendMessage({ message: parts as any }); 
        return this.processGeminiResponse(result);
    } else {
        // OpenAI requires the tool_call_id
        if (!toolId) throw new Error("Tool ID required for OpenAI providers");
        return await this.openaiClient!.sendMessage(JSON.stringify({ result: functionResponse }), true, toolId, functionName);
    }
  }

  // New Method: Test Connection
  async testConnection(config: ModelConfig): Promise<void> {
    if (config.provider === 'gemini') {
      const apiKey = config.apiKey || process.env.API_KEY;
      if (!apiKey) throw new Error("未配置 API Key");
      
      const ai = new GoogleGenAI({ apiKey });
      // We perform a simple generation to test the key and model
      await ai.models.generateContent({
        model: config.modelId || 'gemini-2.5-flash',
        contents: 'Hello',
      });
    } else {
      // For OpenAI/DeepSeek, create a temporary client
      const client = new OpenAICompatibleClient(config);
      // We send a simple message. This will push to a temporary history array inside that instance.
      await client.sendMessage("Hello");
    }
  }

  private processGeminiResponse(response: GenerateContentResponse): { 
    response: string, 
    toolCalls?: { name: string, args: any }[] 
  } {
    const text = response.text || "";
    const toolCalls: { name: string, args: any }[] = [];

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.functionCall) {
          toolCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args,
          });
        }
      }
    }

    return { response: text, toolCalls };
  }

  async generateDailyReport(state: AppState, targetDateStr?: string): Promise<{ title: string, content: string }> {
    const { sessions, tasks, goals, coachSettings } = state;
    const config = coachSettings.modelConfig;
    
    // Determine the target date (default to today)
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const targetDateString = targetDate.toDateString(); 
    
    // 1. Calculate Objective Data
    const targetSessions = sessions.filter(s => new Date(s.startTime).toDateString() === targetDateString && s.endTime);
    const completedTasks = tasks.filter(t => t.completed && new Date(t.createdAt).toDateString() === targetDateString);
    const createdTasks = tasks.filter(t => new Date(t.createdAt).toDateString() === targetDateString);
    const totalDurationMinutes = Math.floor(targetSessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60);
    
    const taskDetails = targetSessions.length > 0 
        ? targetSessions.map(s => {
            const start = new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const duration = Math.floor(s.durationSeconds / 60);
            return `- ${s.label} (${start}, ${duration}分钟)`;
          }).join('\n')
        : "无记录";

    const tasksSummary = createdTasks.length > 0
        ? createdTasks.map(t => `- [${t.completed ? '已完成' : '未完成'}] ${t.title}`).join('\n')
        : "无新增任务";

    const goalsList = goals.map(g => {
        const deadline = new Date(g.deadline);
        const diffTime = Math.abs(deadline.getTime() - targetDate.getTime()); 
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return `- ${g.title} (截止: ${g.deadline}, 剩余${diffDays}天)`;
    }).join('\n') || "暂无设定目标";


    const objectiveSummary = `
### 数据客观总结
📅 **日期**：${targetDate.getFullYear()}年${targetDate.getMonth() + 1}月${targetDate.getDate()}日
⏱️ **总专注时长**：${totalDurationMinutes}分钟
✅ **当日完成(创建)任务数**：${completedTasks.length}
📝 **活动日志明细**：
${taskDetails}

📌 **当日任务概览**：
${tasksSummary}

🎯 **核心目标进度**：
${goalsList}
    `.trim();

    let prompt = `
    你正在生成一份用户的每日日报。
    请严格按照以下步骤执行，并返回一个合法的 JSON 对象。

    **步骤一**：基于下方的客观数据，构思一个富有文学感、优美且总结性强的**标题**（4-10个字）。标题不要包含“日报”二字，要像散文诗一样。例如：“静水流深的一天”、“在挑战中前行”、“微小的进步”。
    
    **步骤二**：
    1. 你的身份是 "${coachSettings.name}"，严格遵循风格：${coachSettings.customInstruction}
    2. 生成日报正文：
       - 首先**原封不动**保留下方的【客观数据总结】。
       - 换行后，添加 "---" 分隔线。
       - 换行后，基于数据写一段【AI教练点评】。结合人设，如果专注时间短或未完成任务多，请根据人设风格进行批评或鼓励；如果表现好，给予赞赏。
       - 最后给出一句针对明天的简短行动建议。

    【客观数据总结】：
    ${objectiveSummary}

    ${coachSettings.customReportInstruction ? `特别要求: ${coachSettings.customReportInstruction}` : ''}

    请返回纯 JSON 格式：
    {
      "title": "你的标题",
      "content": "你的完整日报内容（包含客观数据+点评）"
    }
    `;

    // One-off generation based on provider
    let responseText = "{}";

    if (config.provider === 'gemini') {
        const apiKey = config.apiKey || process.env.API_KEY || '';
        const aiOneOff = new GoogleGenAI({ apiKey });
        const response = await aiOneOff.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        responseText = response.text || "{}";
    } else {
        // Use generic client for report generation
        const client = new OpenAICompatibleClient(config);
        const result = await client.sendMessage(prompt + "\n\nResponse must be valid JSON.");
        responseText = result.response;
        // Basic JSON cleanup if model returns markdown block
        responseText = responseText.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '');
    }

    try {
        const json = JSON.parse(responseText);
        return {
            title: json.title || "今日复盘",
            content: json.content || "生成失败"
        };
    } catch (e) {
        return {
            title: "今日总结",
            content: responseText
        };
    }
  }
}
