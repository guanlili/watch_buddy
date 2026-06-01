# 毒奶观察室

AI 搭子陪你看球，一起吐槽一起欢呼！

## 🎉 2026 清华黑客松参赛项目

本项目是 2026 年 5 月 31 日清华黑客松的参赛作品，获得了评委的一致好评。

### 📚 项目相关文档
- [项目说明稿（Markdown版）](docs/AI赛事陪伴说明稿.md) - 项目整体介绍和价值说明（推荐GitHub在线查看）
- [项目说明稿（PDF版）](docs/AI%20赛事陪伴%20说明稿.pdf) - 原版PDF格式
- [产品需求文档（Markdown版）](docs/AI电竞赛事搭子PRD.md) - 完整的产品需求文档（推荐GitHub在线查看）
- [产品需求文档（PDF版）](docs/AI_电竞赛事搭子PRD.pdf) - 原版PDF格式
- [演示视频](docs/演示视频.mp4) - 功能演示视频（建议下载观看）

## 项目简介

毒奶观察室是一个赛博风格的电竞 AI 陪看应用。它能陪伴你观看比赛，实时互动吐槽，赛后生成专属情绪回顾海报。

## 技术栈

- **框架**: Vite + TanStack Start + React 19
- **状态管理**: Zustand (`persist` 中间件 → localStorage)
- **动画**: Framer Motion
- **样式**: Tailwind CSS v4 + Radix UI
- **路由**: TanStack React Router
- **语言**: TypeScript
- **包管理器**: npm / Bun
- **AI 能力**:
  - 大模型对话：[TokenDance](https://tokendance.space) 网关（OpenAI 兼容，默认 `deepseek-v3.2`）
  - 语音识别：[StepFun stepaudio-2.5-asr](https://platform.stepfun.com)
  - 图像生成：TokenDance 网关 → `seedream-5.0-lite`

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
│   │   ├── api/         # 服务端函数 (createServerFn)
│   │   │   ├── chat.functions.ts   # TokenDance 大模型对话
│   │   │   ├── asr.functions.ts    # StepFun 语音转文字
│   │   │   └── image.functions.ts  # Seedream 海报生成
│   │   ├── audio/       # 浏览器录音 → 16kHz PCM
│   │   ├── prompts/     # 提示词集中管理
│   │   │   ├── registry.ts          # 默认模板 + localStorage override
│   │   │   ├── buddy.ts             # 搭子人设
│   │   │   ├── poster.ts            # 海报 3 个风格变体
│   │   │   └── post-match-copy.ts   # 赛后文案模板
│   │   ├── mock/        # 模拟数据
│   │   └── config.server.ts  # 服务端 env 读取（API Key）
│   ├── routes/          # 路由页面
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── onboarding.tsx
│   │   ├── welcome-card.tsx
│   │   ├── pre-match.tsx
│   │   ├── match.tsx
│   │   ├── post-match.tsx
│   │   ├── chat.tsx
│   │   └── admin.tsx    # 提示词调试管理端
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

- 实时对话流（用户消息走真 LLM，搭子人设回复）
- 时间线事件 + 闲置主动搭话仍走预制脚本
- 支持文字 / 语音输入二选一（微信式按住说话 · 上滑取消）
- 情绪条 / 视觉特效 / 音效反馈

### 6. 赛后回顾 (`/post-match`)

- 情绪曲线图
- 纪念海报：3 风格变体 + 配置面板（选手 / 游戏角色 / 想说的话），按需调 Seedream 生成
- 文案：朋友圈 / 官方社媒两种场景，按用户球迷类型自动切风格

### 7. 提示词管理端 (`/admin`)

- 隐藏入口，主站不挂链接
- 集中编辑所有提示词模板，支持 `{{var}}` 占位符
- 内置「试运行」面板：填示例变量 → 直接调 chatCompletion / generatePoster 看真实输出
- 改动落 localStorage，对该浏览器后续所有调用立即生效；支持一键「重置默认」
- 详见 [提示词管理](#提示词管理)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制模板并填上自己的 Key（缺失时对应功能会报「缺少 XX_API_KEY」）：

```bash
cp .env.example .env
```

| 变量                  | 必填 | 用途                                                               | 申请                                       |
| --------------------- | ---- | ------------------------------------------------------------------ | ------------------------------------------ |
| `TOKENDANCE_API_KEY`  | 是   | 大模型对话 + 海报生成                                              | https://tokendance.space/keys              |
| `STEP_API_KEY`        | 是   | 语音识别                                                           | https://platform.stepfun.com/interface-key |
| `TOKENDANCE_MODEL`    | 否   | 默认 `deepseek-v3.2`，可换 `minimax-m2.5` / `claude-sonnet-4-5` 等 | —                                          |
| `TOKENDANCE_BASE_URL` | 否   | 默认 `https://tokendance.space/gateway`                            | —                                          |
| `STEP_BASE_URL`       | 否   | 默认 `https://api.stepfun.com`                                     | —                                          |

`.env` 已被 gitignore，不会误提交。

### 3. 启动开发服务器

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

## 提示词管理

所有面向 LLM / 生图模型的提示词都集中在 `src/lib/prompts/registry.ts` 的 `PROMPT_DEFAULTS` 里，分 3 组：

| 分组     | 包含                                                                      | 在哪用                                                    |
| -------- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| 搭子人设 | `buddy.persona` + 3 个 `buddy.fan-mirror.*`                               | `/chat` 和 `/match` 的 system prompt                      |
| 海报     | `poster.variant.0/1/2` (荣耀叙事 / 吐槽梗图 / 复盘理性)                   | `/post-match` 的 Seedream 调用                            |
| 赛后文案 | `post-match-copy.frame` + 7 个片段（场景定位 ×2 / 风格 ×3 / 生成要求 ×2） | `/post-match`；按 scenario × fanType 只拼相关片段进 frame |

模板里可以用 `{{var}}` 或 `{var}` 占位（两种语法都支持），代码 build 时调用 `substitute()` 替换。每个 prompt 的可用变量在 `PROMPT_META[id].knownVars`。

**调试方式**：

1. 浏览器访问 `/admin`（隐藏入口，主站没链接）
2. 左侧选要调的 prompt → 直接改 textarea
3. 在「试运行」区填变量值 → 点「用当前草稿运行」看模型真实输出
4. 满意了点「保存」，写入 `localStorage["wb_prompt:<id>"]`，该浏览器后续所有页面调用都走新版
5. 想还原点「重置为默认」

⚠️ override 只在当前浏览器生效，不会影响其他用户、不会进代码仓库。要全员生效需要把改后的模板回填到 `PROMPT_DEFAULTS` 里再 commit。

## AI 调用链

| 入口                      | 服务端函数        | 上游                                |
| ------------------------- | ----------------- | ----------------------------------- |
| `/chat` `/match` 用户消息 | `chatCompletion`  | TokenDance `/v1/chat/completions`   |
| 麦克风按钮                | `transcribeAudio` | StepFun `/v1/audio/asr/sse` (SSE)   |
| 海报生成按钮              | `generatePoster`  | TokenDance `/v1/images/generations` |
| 赛后文案 tab              | `chatCompletion`  | 同上                                |

所有 API Key 只在 `*.server.ts` / `*.functions.ts` 里读，不会进客户端 bundle。

## 开发说明

- 文件系统路由 (TanStack Router) - 新增 `src/routes/xxx.tsx` 即生效，`routeTree.gen.ts` 由 Vite 插件自动生成
- 服务端函数走 `createServerFn`（`*.functions.ts`），自动隔离 server-only 代码
- 用户档案 (`profile`) 通过 Zustand `persist` 中间件落 localStorage，key 为 `esports-buddy-state`
- 提示词 override 落 localStorage，key 前缀 `wb_prompt:`

## 部署

### 方案 1：Docker 全栈部署（推荐）

项目已配置好完整的 Docker 支持，支持 SSR 和服务端 API，支持跨架构构建（ARM → x86）。

#### 本地构建 + 传输到服务器

```bash
# 1. 创建 buildx builder（首次使用）
docker buildx create --use

# 2. 构建 x86 镜像（在 M1/M2/M3/M4 Mac 上）
docker buildx build --platform linux/amd64 -t watch-buddy:latest --load .

# 3. 导出镜像
docker save watch-buddy:latest -o watch-buddy.tar

# 4. 传输到服务器
scp watch-buddy.tar user@your-server-ip:/path/to/

# 5. 服务器上导入并运行（务必传 API Key，否则 AI 功能全挂）
ssh user@your-server-ip
docker load -i watch-buddy.tar
docker run -d -p 8037:3000 --name watch-buddy --restart unless-stopped \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e TOKENDANCE_API_KEY=your-key \
  -e STEP_API_KEY=your-key \
  watch-buddy:latest

# 6. 确认容器已启动且健康检查通过
docker ps --filter name=watch-buddy
curl -I http://127.0.0.1:8037/match
```

#### 本地 Docker 运行

```bash
docker build -t watch-buddy:local .
docker run -d --name watch-buddy-local -p 18080:3000 \
  -e HOST=0.0.0.0 \
  -e PORT=3000 \
  -e TOKENDANCE_API_KEY=your-key \
  -e STEP_API_KEY=your-key \
  watch-buddy:local

docker ps --filter name=watch-buddy-local
curl -I http://127.0.0.1:18080/match
```

Dockerfile 内置 `HEALTHCHECK`，容器正常后会显示 `healthy`。如果只想验证 UI，可不传 API Key；聊天、语音、海报、文案生成会走失败兜底或不可用状态。

#### 演示参数

赛中模拟默认是演示速度，可以用 URL 调整：

```txt
/match?speed=1  # 慢速，1 秒真实时间 = 1 分钟比赛时间
/match?speed=2  # 标准
/match          # 默认演示速度 x3
/match?speed=5  # 快进
```

#### 本地启动（非 Docker）

```bash
npm run build
npm run start
```

### 方案 2：纯静态部署（无后端）

只部署静态前端，不支持服务端 API（**聊天、语音、海报、文案生成全部失效**，只能看 UI）：

- **Vercel / Netlify**:
  - Build command: `npm run build`
  - Publish directory: `dist/client`
- **Cloudflare Pages**:
  ```bash
  npm install -g wrangler
  wrangler login
  wrangler pages deploy dist/client
  ```

## License

MIT
