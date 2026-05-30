## 目标

10 小时 Demo 范围内、纯前端 Mock 实现 SRS v1.1 的 4 个 P0 模块。无后端、无 LLM、无语音 —— 所有对话/赛事/情绪/图文均由脚本化时间线 + 预设响应包驱动，演示完整闭环。视觉严格按 SRS §3.1.3：深空紫/电光青/火焰橙、深色渐变 #0a0f1e→#03050a、毛玻璃卡片、霓虹边框、像素图标、粒子背景、倾斜描边标题。

## 路由结构（TanStack Start）

```
src/routes/
  __root.tsx          全局 shell + 粒子背景
  index.tsx           欢迎页（AI 自我介绍 + "开搞！"）
  onboarding.tsx      四步兴趣收集（卡片式滑动）
  welcome-card.tsx    专属欢迎卡（动态海报 + AI 语音播报）
  pre-match.tsx       赛前阵地（倒计时 + 数据预览 + AI 预测）
  match.tsx           赛中陪伴（对话流 + 音效/视觉特效 + 情绪条）
  post-match.tsx      赛后图文（情绪曲线 + 3 选 1 海报 + 文案两档）
```

模拟一条"推送横幅"组件常驻顶部，可点击跳到 `/pre-match`。

## 数据层（前端 Mock）

- `src/lib/mock/profile.ts` — UserProfile（zustand 持久化到 localStorage）
- `src/lib/mock/match-timeline.ts` — 一场 TES vs JDG 的脚本化事件时间线（开局/团战/破防/翻盘/赛末，每个事件带时间偏移、事件文本、预设触发情绪）
- `src/lib/mock/response-packs.ts` — 每个事件 + 用户输入档位对应的"回应包"预设池（回复文本、情绪标签、强度、是否金句、Flag 动作）
- `src/lib/mock/emotion-map.ts` — 5 类情绪 → 音效文件 + 视觉特效组件的静态映射表（SRS 附录 A）
- `src/lib/mock/memory.ts` — Flag 清单 + 金句清单 + 情绪日志（赛中写入，赛后读出）

## 赛中核心机制（重点）

1. 进入 `/match` 启动一个"赛事时钟"（加速 ×N，比如 1 真实秒 = 10 比赛秒），按时间线推进事件。
2. 每个事件触发：插入一条"系统事件气泡" → 从 response-packs 选一个 AI 回应包 → 写情绪日志 → 若强度 ≥4 触发音效 + 视觉特效（撒花/炸弹/下雨/心跳）→ 文字气泡逐字打出（模拟 TTS）。
3. 用户输入框：发送文本 → 按关键词匹配 response-packs 中的"用户档"或随机抽取一个上下文相关的预设回复 → 同流程写日志/触发反应。
4. 静默 30 秒计时器 → 触发"主动开话头"预设回复。
5. 顶部小工具：当前比分、比赛分钟数、情绪强度条（实时刷新）、Flag 计数。
6. 视觉特效：CSS + Framer Motion 实现 5 种叠加层（彩带、爆炸、雨幕灰滤镜、心跳震屏、留白）；音效用 4–5 个免费短音频文件。

## 赛后图文

- 从情绪日志生成 SVG 折线图（X = 比赛分钟，Y = 强度 1–5），峰谷标注事件文案 + 用户原话。
- 3 张候选海报：用 CSS + 模板渲染（队徽 + 比分 + 用户金句 + 主题色），不调真实图片生成。每张风格不同（荣耀叙事 / 吐槽梗图 / 复盘理性）对应 3 种球迷类型。
- 文案两档：轻量（一句话，从金句池抽 + 模板拼接）/ 深度（赛前预测 vs 结果 + 情绪回顾叙事）。
- 一键复制按钮。

## 设计系统（src/styles.css）

新增 oklch 语义 token：

- `--background`：深色渐变基底
- `--primary`：深空紫
- `--accent`：电光青
- `--destructive`：火焰橙
- `--glass`：毛玻璃白半透明
- `--glow-primary` / `--glow-accent`：发光阴影
- 字体：Orbitron / Rajdhani（标题倾斜描边）+ JetBrains Mono（数字）+ Noto Sans SC（中文正文）

全局组件：GlassCard、NeonButton、PixelIcon、ParticleBackground、GlowText。

## 技术细节

- 状态：zustand（用户档案、情绪日志、Flag、当前比赛时钟）持久化到 localStorage
- 动画：Framer Motion（卡片入场、特效叠加、气泡逐字）
- 图表：手写 SVG 折线（避免引入 recharts 复杂度）
- 音效：HTMLAudioElement，4–5 个 .mp3 放 public/sounds/
- 推送 Mock：顶部横幅组件 + 一个"模拟接收推送"按钮（开发者调试用）

## 不做（明确出范围）

- 真实 LLM / STT / TTS（用预设回应包 + 浏览器原生 SpeechSynthesis 可选播报中文，作为锦上添花）
- 真实推送渠道（仅页内横幅）
- 真实赛事 API
- 真实图片生成（用 CSS 模板海报）
- 登录/注册三方鉴权（onboarding 直接进入兴趣收集，记到 localStorage）
- 跨设备同步

## 实施顺序

1. 设计系统 + 全局组件 + 路由骨架 + 粒子背景
2. 欢迎页 + onboarding 四步 + 专属欢迎卡
3. 赛前推送横幅 + 赛前阵地页
4. 赛中：时间线引擎 + 对话流 + 情绪/特效系统
5. 赛后：情绪曲线 + 海报 + 文案

每步完成后可独立演示。
