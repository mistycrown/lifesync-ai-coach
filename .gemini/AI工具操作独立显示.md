# AI工具操作独立显示功能

## 更新时间
2025-11-26 21:49

## 用户需求
1. AI 添加待办时，可以关联到目标
2. AI 的操作（添加待办、添加专注记录）采用**独立的 UI** 呈现，不在对话内
3. 类似"已自动生成并归档今日日报"的消息样式
4. 显示格式：
   - 有关联：`已添加待办任务：XX，关联至目标：YY`
   - 无关联：`已添加待办任务：XX`
   - 有关联：`已添加专注记录：XX (30分钟)，关联至待办：YY`
   - 无关联：`已添加专注记录：XX (30分钟)`

## 已实现的功能

### 1. ✅ 扩展 addTask 工具

**新增参数：`goalTitle`**

```typescript
{
  name: 'addTask',
  parameters: {
    title: string,        // 任务标题（必填）
    goalTitle: string     // 目标标题（可选）
  }
}
```

**AI 使用场景：**
- 用户说："帮我添加一个待办：完成产品报告，这是为了完成月度目标。"
- AI 识别到"月度目标"，调用：
  ```json
  {
    "title": "完成产品报告",
    "goalTitle": "月度目标"
  }
  ```

### 2. ✅ 智能目标匹配

**匹配逻辑：**
```typescript
// 双向模糊匹配（不区分大小写）
const matchingGoal = state.goals.find(g => 
    g.title.toLowerCase().includes(goalTitle.toLowerCase()) || 
    goalTitle.toLowerCase().includes(g.title.toLowerCase())
);
```

**示例：**
- Goal标题: "完成年度阅读计划"
- AI 提供: "阅读计划"
- ✅ 匹配成功！

### 3. ✅ 独立操作消息显示

**不同于 AI 回复：**
- AI 回复文本：正常的对话内容（鼓励、建议等）
- 操作消息：带有 `actionData` 的独立卡片

**显示效果：**
```
AI: 好的，我帮你记录一下这个任务！

📋 已添加待办任务：完成产品报告，关联至目标：Q4目标
```

### 4. ✅ 优化 addSession 显示

**之前：**
```
已为你添加专注记录：看书，时长 60 分钟 (已关联到待办: 读书计划)
```

**现在：**
```
已添加专注记录：看书 (60分钟)，关联至待办：读书计划
```

更简洁，格式统一！

## 代码实现

### addTask 工具处理逻辑

```typescript
if (toolCall.name === 'addTask') {
    const { title, goalTitle } = toolCall.args;
    
    // 1. 查找匹配的目标
    let goalId: string | undefined = undefined;
    let linkedGoalName: string | undefined = undefined;
    if (goalTitle) {
        const matchingGoal = state.goals.find(g => 
            g.title.toLowerCase().includes(goalTitle.toLowerCase()) || 
            goalTitle.toLowerCase().includes(g.title.toLowerCase())
        );
        if (matchingGoal) {
            goalId = matchingGoal.id;
            linkedGoalName = matchingGoal.title;
        }
    }
    
    // 2. 添加任务（带目标关联）
    addTask(title, goalId);
    
    // 3. 显示独立的操作消息
    const toolMsg: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        role: 'model',
        text: linkedGoalName 
            ? `已添加待办任务：${title}，关联至目标：${linkedGoalName}`
            : `已添加待办任务：${title}`,
        timestamp: new Date(),
        actionData: { type: 'ADD_TASK', title, details: linkedGoalName }
    };
    currentMsgs = [...currentMsgs, toolMsg];
    setMessages(currentMsgs);
}
```

### addSession 工具处理逻辑

```typescript
if (toolCall.name === 'addSession') {
    const { label, startTime, endTime, taskTitle } = toolCall.args;
    
    // 1. 计算时长
    const durationSeconds = ...;
    const durationMinutes = Math.floor(durationSeconds / 60);
    
    // 2. 查找匹配的待办
    let taskId: string | undefined = undefined;
    let linkedTaskName: string | undefined = undefined;
    if (taskTitle) {
        const matchingTask = state.tasks.find(t => 
            t.title.toLowerCase().includes(taskTitle.toLowerCase()) || 
            taskTitle.toLowerCase().includes(t.title.toLowerCase())
        );
        if (matchingTask) {
            taskId = matchingTask.id;
            linkedTaskName = matchingTask.title;
        }
    }
    
    // 3. 添加记录
    addManualSession(label, startTime, durationSeconds, taskId);
    
    // 4. 显示独立的操作消息
    const toolMsg: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        role: 'model',
        text: linkedTaskName
            ? `已添加专注记录：${label} (${durationMinutes}分钟)，关联至待办：${linkedTaskName}`
            : `已添加专注记录：${label} (${durationMinutes}分钟)`,
        timestamp: new Date(),
        actionData: { type: 'ADD_SESSION', title: label, details: linkedTaskName }
    };
}
```

## 消息类型说明

### actionData 结构

```typescript
interface ActionData {
    type: 'ADD_TASK' | 'ADD_GOAL' | 'ADD_SESSION' | 'GENERATE_REPORT';
    title: string;        // 主要内容（任务名、记录名等）
    details?: string;     // 关联信息（目标名、待办名等）
}
```

### 显示样式

根据 `actionData` 的存在，ChatInterface 会以不同样式渲染：

**普通 AI 消息：**
```tsx
<div className="text-slate-700">
  {message.text}
</div>
```

**操作消息：**
```tsx
<div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg">
  <FileText size={16} />
  {message.text}
</div>
```

## 使用示例

### 场景 1：添加带目标的任务

**用户输入：**
```
帮我添加一个任务：完成季度报告，这是为了Q4业绩目标
```

**AI 响应（两条消息）：**
1. **AI 回复**（普通消息）：
   ```
   好的！我帮你添加这个任务，冲刺Q4业绩加油！💪
   ```

2. **操作消息**（独立卡片）：
   ```
   📋 已添加待办任务：完成季度报告，关联至目标：Q4业绩目标
   ```

### 场景 2：添加不带目标的任务

**用户输入：**
```
帮我添加一个待办：买笔记本
```

**AI 响应：**
1. **AI 回复**：
   ```
   已记录！记得买个好点的笔记本，写起来才顺畅~
   ```

2. **操作消息**：
   ```
   📋 已添加待办任务：买笔记本
   ```

### 场景 3：补录带关联的专注记录

**用户输入：**
```
我昨天下午3点到5点看书了
```

**AI 响应**（假设有"阅读计划"任务）：
1. **AI 回复**：
   ```
   好的，帮你补录了！坚持阅读真棒👍
   ```

2. **操作消息**：
   ```
   ⏱️ 已添加专注记录：看书 (120分钟)，关联至待办：阅读计划
   ```

### 场景 4：补录不带关联的记录

**用户输入：**
```
我早上跑步了半小时
```

**AI 响应：**
1. **AI 回复**：
   ```
   早起运动真自律！继续保持~
   ```

2. **操作消息**：
   ```
   ⏱️ 已添加专注记录：跑步 (30分钟)
   ```

## 与日报消息的对比

**日报归档消息：**
```tsx
<div className="flex items-center gap-2 text-sm bg-amber-50 px-3 py-2 rounded-lg">
  <FileText size={16} className="text-amber-600" />
  已自动生成并归档今日日报。
</div>
```

**任务/记录消息：**
```tsx
<div className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg">
  <ListTodo size={16} className="text-blue-600" />
  已添加待办任务：完成产品报告，关联至目标：Q4目标
</div>
```

## 修改的文件

### 1. `services/geminiService.ts`
- 添加 `goalTitle` 参数到 `addTaskDeclaration`
- Gemini 格式和 OpenAI 格式都已更新

### 2. `App.tsx`
- 修改 `addTask` 工具处理逻辑
  - 支持 `goalTitle` 参数
  - 智能匹配目标
  - 更新消息文本格式
  - 添加 `details` 到 actionData

- 修改 `addSession` 工具处理逻辑
  - 提取 `linkedTaskName`
  - 更新消息文本格式
  - 添加 `details` 到 actionData

## 系统提示更新建议

虽然已经实现了工具功能，但建议在系统提示中明确指导 AI：

```
当用户要求添加待办任务时：
- 如果用户提到了目标（如"为了XX目标"、"帮助完成XX"），使用goalTitle参数关联
- 如果没有明确提到目标，不要猜测，留空即可

当用户补录活动时：
- 如果活动明确关联某个任务（如"写代码完成XX"），使用taskTitle参数
- 如果是通用活动（如"跑步"、"看书"），可以不关联

重要：你的回复应该是鼓励、建议等内容，不要重复说"已添加XX"，因为系统会自动显示操作消息。
```

## 技术亮点

1. **关注点分离**
   - AI 回复 = 情感支持、建议、鼓励
   - 操作消息 = 明确的事实记录

2. **智能匹配**
   - 双向模糊匹配，容错性强
   - 不区分大小写

3. **用户体验**
   - 清晰的视觉区分（不同背景色）
   - 一目了然的关联关系
   - 不会让用户觉得 AI 啰嗦重复

4. **可扩展性**
   - `actionData` 结构可以支持更多操作类型
   - 轻松添加新的工具操作显示

## 测试清单

- [ ] 添加任务 + 关联目标（匹配成功）
- [ ] 添加任务 + 关联目标（匹配失败，应只显示任务）
- [ ] 添加任务（无目标参数）
- [ ] 补录记录 + 关联待办（匹配成功）
- [ ] 补录记录 + 关联待办（匹配失败）
- [ ] 补录记录（无待办参数）
- [ ] AI 回复和操作消息分开显示
- [ ] 操作消息样式正确
