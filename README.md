# 毒奶观察室

AI 搭子陪你看球，一起吐槽一起欢呼！

## 项目简介

毒奶观察室是一个赛博风格的电竞 AI 陪看应用。它能陪伴你观看比赛，实时互动吐槽，赛后生成专属情绪回顾海报。

## 技术栈

- **框架**: Vite + TanStack Start + React 19
- **状态管理**: Zustand
- **动画**: Framer Motion
- **样式**: Tailwind CSS v4 + Radix UI
- **路由**: TanStack React Router
- **语言**: TypeScript
- **包管理器**: npm / Bun

## 项目结构

```
watch_buddy/
├── src/
│   ├── components/       # UI 组件
│   │   ├── ui/          # Radix UI 基础组件
│   │   ├── EffectOverlay.tsx
│   │   ├── GlassCard.tsx
│   │   ├── NeonButton.tsx
│   │   ├── ParticleBackground.tsx
│   │   └── PushBanner.tsx
│   ├── hooks/           # 自定义 Hooks
│   ├── lib/
│   │   ├── api/         # API 函数
│   │   └── mock/        # 模拟数据
│   ├── routes/          # 路由页面
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── onboarding.tsx
│   │   ├── welcome-card.tsx
│   │   ├── pre-match.tsx
│   │   ├── match.tsx
│   │   └── post-match.tsx
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 功能模块

### 1. 欢迎页 (`/`)
- AI 搭子自我介绍
- 炫酷赛博风格设计

### 2. 兴趣收集 (`/onboarding`)
- 四步卡片式兴趣收集
- 个性化偏好设置

### 3. 专属欢迎卡 (`/welcome-card`)
- 动态欢迎海报
- AI 语音播报

### 4. 赛前阵地 (`/pre-match`)
- 比赛倒计时
- 数据预览
- AI 预测

### 5. 赛中陪伴 (`/match`)
- 实时对话流
- 情绪条
- 视觉特效
- 音效反馈

### 6. 赛后回顾 (`/post-match`)
- 情绪曲线图
- 3 选 1 纪念海报
- 一键复制文案

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:8080

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 设计风格

- **配色**: 深空紫、电光青、火焰橙
- **背景**: 深色渐变 (#0a0f1e → #03050a)
- **效果**: 毛玻璃卡片、霓虹边框、粒子背景、像素图标

## 开发说明

- 使用文件系统路由 (TanStack Router)
- 所有数据为前端模拟 (无后端/无 LLM)
- 状态持久化到 localStorage

## License

MIT
