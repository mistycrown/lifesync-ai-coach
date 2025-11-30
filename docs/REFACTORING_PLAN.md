# 代码架构优化计划

## ✅ 已完成

1. **创建 hooks 文件夹**
2. **useDataPersistence.ts** - 数据持久化逻辑
3. **useChatManagement.ts** - 聊天会话管理

## 🔄 进行中

### 下一步要拆分的 Hooks：

#### 1. useTaskManagement.ts
**功能：** 任务管理
- `addTask()`
- `updateTask()`
- `toggleTask()`
- `deleteTask()`

#### 2. useGoalManagement.ts
**功能：** 目标管理
- `addGoal()`
- `updateGoal()`
- `toggleGoal()`
- `deleteGoal()`

#### 3. useVisionManagement.ts
**功能：** 愿景管理
- `addVision()`
- `updateVision()`
- `deleteVision()`
- `toggleVisionArchived()`

#### 4. useSessionManagement.ts
**功能：** 专注会话管理
- `startSession()`
- `stopSession()`
- `addManualSession()`
- `updateSession()`
- `renameSession()`
- `deleteSession()`

#### 5. useHabitManagement.ts
**功能：** 习惯管理
- `addHabit()`
- `updateHabit()`
- `deleteHabit()`
- `toggleCheckIn()`
- `handleCheckIn()`

#### 6. useReportManagement.ts
**功能：** 复盘管理
- `generateReportContent()`
- `addReport()`
- `updateReport()`
- `deleteReport()`

#### 7. useCloudSync.ts
**功能：** 云端同步
- `syncToCloud()`
- `syncFromCloud()`
- `testStorageConnection()`
- 自动同步逻辑

#### 8. useSettings.ts
**功能：** 设置管理
- `testConnection()`
- `updateTheme()`
- `saveSettings()`
- `cancelSettings()`

## 📝 重构策略

### 原则：
1. **渐进式重构** - 一次只改一小部分
2. **向后兼容** - 保持现有接口不变
3. **充分测试** - 每步完成后验证功能
4. **保留备份** - 重要更改前备份代码

### 步骤：
1. ✅ 创建独立的 Hook 文件
2. 🔄 在 App.tsx 中逐步替换旧逻辑
3. ⏳ 测试每个功能模块
4. ⏳ 优化性能（memoization）
5. ⏳ 添加类型安全
6. ⏳ 更新文档

## 🎯 最终目标结构

```
App.tsx (简化后 < 300 行)
│
├── hooks/
│   ├── useDataPersistence.ts    ✅
│   ├── useChatManagement.ts     ✅
│   ├── useTaskManagement.ts     ⏳
│   ├── useGoalManagement.ts     ⏳
│   ├── useVisionManagement.ts   ⏳
│   ├── useSessionManagement.ts  ⏳
│   ├── useHabitManagement.ts    ⏳
│   ├── useReportManagement.ts   ⏳
│   ├── useCloudSync.ts          ⏳
│   └── useSettings.ts           ⏳
│
└── utils/
    ├── mockData.ts              ⏳ (移动 createMockData)
    └── aiHelpers.ts             ⏳ (AI 相关辅助函数)
```

## ⚠️ 注意事项

1. **状态依赖** - 有些函数相互依赖，需要小心处理
2. **性能** - 添加 useCallback/useMemo 避免不必要的重渲染
3. **类型安全** - 确保所有 Hook 都有完整的 TypeScript 类型
4. **测试** - 重构后必须测试所有功能是否正常

## 📊 预期收益

- **可维护性** ↑↑↑
- **代码复用** ↑↑
- **性能优化** ↑
- **测试友好** ↑↑
- **团队协作** ↑↑
