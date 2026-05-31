// Prompt registry：把可编辑的提示词集中托管，运行时从 localStorage 读 override，
// 没有 override 就走 PROMPT_DEFAULTS。各 builder 模块 import 这里取模板。

const STORAGE_PREFIX = "wb_prompt:";

// 所有 prompt id 与默认模板。新增 prompt 时在这加一条，并在对应 builder 里
// 用 getPromptTemplate(id) 取。注意：admin 端的列表 / 试运行入口也读这个表。
export const PROMPT_DEFAULTS = {
  // —— 开黑搭子人设 ——
  "buddy.persona": `你是用户的「开黑搭子」——一个老电竞迷兄弟，正陪 TA 一起看比赛。
你不是助手、不是解说员，是个平起平坐的哥们儿。

【语气】
- 短句、口语、满嘴游戏黑话（开团 / 血赚 / 上头 / 这波稳了 / 节奏起来了 / 抬走 / 心态崩了）。
- 自然带感叹词："哇" / "这波" / "不是吧" / "卧槽" / "我去" / "卧" ——像真人脱口而出。
- 一两句怼回去就行，单条回复尽量压在 50 字内，别长篇大论。
- 带情绪，跟用户同频甚至更夸张。冷场了主动搭话，别干等。
- 少用书面语；该顿就顿（用逗号 / 问号自然分句），让搭子的声音听起来有起伏，不要一长串憋一口气。

【立场】
- 用户支持哪队你就向着哪队，绝不中立、绝不打官腔。
- 主队赢了比 TA 还嗨，崩了陪 TA 一起急，对面打得菜就一起开喷。
- 该损就损，但只损操作和战术（「这开团真离谱」「走位送的」「视野白给」），
  不对真实选手做人身攻击、不引战、不爆粗、不涉及选手家人/外貌/隐私。

【绝对禁止】
- 说「作为 AI」「我是助手」「让我为你介绍」这种话。
- 客服腔、哄人舔人、说教、长段复盘、中立播报。
- 复述用户的话、加礼貌客套（「好的」「明白了」「没问题」开头）。`,

  // —— 按粉丝类型镜像（3 段，按 fanType 拼接） ——
  "buddy.fan-mirror.diehard":
    "用户是死忠粉，护犢子模式拉满：主队任何操作先吹再说，裁判判罚用户骂你跟着骂，永远站主队。",
  "buddy.fan-mirror.roaster":
    "用户是段子手，敢损敢自黑：多用梗、敢拉踩对面战术，氛围拉到最满，但只损操作不损人。",
  "buddy.fan-mirror.rational":
    "用户偏理性派：可以丢一两句数据感的吐槽（比如「这经济差吃不消」「视野全丢了」），但情绪和立场还是跟用户走，别变成解说。",

  // —— 海报 3 个风格变体（每个一段，含 {{var}} 占位） ——
  "poster.variant.0": `生成一张电竞战报海报，4:5 竖版构图，史诗英雄主义风格。
调色：紫色与电光蓝霓虹光晕，金色高光勾边，深紫黑色背景。
{{focus}}
背景氛围：聚光灯下的奖杯/光柱（{{moodByResult}}），赛博几何粒子，电竞场馆远景剪影。
海报核心文字（请清晰呈现）：标题「{{team}}」、比分「{{homeScore}} : {{awayScore}} vs {{opponent}}」、底部标语「{{slogan}}」。
字体：未来主义无衬线，比分用霓虹粗体。
{{commonInfo}}`,

  "poster.variant.1": `生成一张电竞吐槽梗图海报，4:5 竖版构图，撞色漫画/表情包风格。
调色：橙红 + 亮黄 + 黑色描边，背景手绘冲击线和爆炸星形。
{{focus}}
表情氛围：夸张漫画表情（{{moodByResult}}），戏剧化吐槽气泡，meme 风手势。
海报核心文字（请清晰呈现）：标题「{{team}} {{titleByResult}}」、副标「{{homeScore}} : {{awayScore}} vs {{opponent}}」、吐槽框「{{slogan}}」。
字体：手写体 / 粗黑漫画字。
{{commonInfo}}`,

  "poster.variant.2": `生成一张电竞数据复盘海报，4:5 竖版构图，赛博 HUD / 未来主义信息图风格。
调色：青蓝 + 深空灰，半透明数据面板，发光等高线与几何网格。
{{focus}}
周围元素：抽象数据可视化（柱状/雷达/曲线），战队标识轮廓占位，扫描线效果。
海报核心文字（请清晰呈现）：标题「{{team}} vs {{opponent}}」、巨型比分「{{homeScore}} - {{awayScore}}」居中、状态徽章「{{resultLabel}}」、底栏数据流标语「{{slogan}}」。
字体：等宽科技字体，标签全大写。
{{commonInfo}}`,

  // —— 赛后文案（拆成 frame + 3 类 fragment，运行时按 scenario / fanType 拼） ——
  // 这么拆是为了：① 模型只看当前场景 + 当前粉丝类型的规则，不串味；② admin 仍能逐段调。
  "post-match-copy.frame": `【任务】
生成电竞赛事赛后文案。
【用户信息】
主队：{team_name}
球迷类型：{fan_type}
情绪烈度：{emotion_intensity}/10
【比赛信息】
赛事：{competition_name}
比分：{home_score}:{away_score}（{home_team} vs {away_team}）
比赛结果：{result}
关键事件：{key_event}
情绪峰值时间：{peak_minute}'
赛前预期：{pre_match_expectation}
【用户表达素材】
用户原话："{user_quote}"
情绪类型：{emotion_type}
【产出场景】
{output_scenario}
---
【场景定位】
{scenario_locator}
---
【风格规则】
{fan_style}
---
【生成要求】
{generation_requirement}`,

  "post-match-copy.scenario.friend_circle": `→ 情绪爆发时刻
→ 一句话说清楚，不需要解释
→ 发完就走
→ 10-30 字，一句话够用
→ 核心素材：用户原话`,

  "post-match-copy.scenario.official_social": `→ 叙事复盘
→ 别人看到能理解"为什么这场比赛对他重要"
→ 需要背景和逻辑
→ 50-200 字
→ 三要素必备：赛前预期 vs 赛后结果 + 情绪变化曲线 + 个人意义`,

  "post-match-copy.fan-style.diehard": `死忠粉型：
→ 荣誉叙事 + 主队认同
→ 骄傲、归属感、集体心态
→ 典型句式："今晚我们是冠军心态"
→ 禁止：自嘲、认输、佛系冷静`,

  "post-match-copy.fan-style.roaster": `吐槽型：
→ 真实情绪 + 圈层玩梗
→ 直白、敢说、娱乐化
→ 典型句式：直接复用用户原话
→ 禁止：官方套话、正经刻板`,

  "post-match-copy.fan-style.rational": `理性型：
→ 赛事复盘 + 事实输出
→ 沉稳自信、克制不张扬
→ 结合赛事数据做客观表达
→ 禁止：过度夸张、粉丝控评、偏激`,

  "post-match-copy.requirement.friend_circle": `1. 以用户原话为核心素材（不变形）
2. 10-30 字，一句话够用`,

  "post-match-copy.requirement.official_social": `1. 三要素必备：赛前预期 vs 赛后结果 + 情绪变化曲线 + 个人意义
2. 50-200 字`,
} as const;

export type PromptId = keyof typeof PROMPT_DEFAULTS;

// admin 端展示用的人话标签 + 分组。新增 prompt 一定要在这同步加上。
export interface PromptMeta {
  id: PromptId;
  group: "搭子人设" | "海报" | "赛后文案";
  label: string;
  // 提示模板里支持的变量（仅用于 admin 展示，substitute 本身不依赖这里）。
  knownVars: string[];
  // 试运行时把 prompt 喂给哪个 API。
  runVia: "chat" | "image";
}

export const PROMPT_META: Record<PromptId, PromptMeta> = {
  "buddy.persona": {
    id: "buddy.persona",
    group: "搭子人设",
    label: "搭子核心人设",
    knownVars: [],
    runVia: "chat",
  },
  "buddy.fan-mirror.diehard": {
    id: "buddy.fan-mirror.diehard",
    group: "搭子人设",
    label: "粉丝类型 · 死忠粉",
    knownVars: [],
    runVia: "chat",
  },
  "buddy.fan-mirror.roaster": {
    id: "buddy.fan-mirror.roaster",
    group: "搭子人设",
    label: "粉丝类型 · 吐槽型",
    knownVars: [],
    runVia: "chat",
  },
  "buddy.fan-mirror.rational": {
    id: "buddy.fan-mirror.rational",
    group: "搭子人设",
    label: "粉丝类型 · 理性型",
    knownVars: [],
    runVia: "chat",
  },
  "poster.variant.0": {
    id: "poster.variant.0",
    group: "海报",
    label: "海报 · 荣耀叙事",
    knownVars: [
      "focus",
      "moodByResult",
      "team",
      "homeScore",
      "awayScore",
      "opponent",
      "slogan",
      "commonInfo",
    ],
    runVia: "image",
  },
  "poster.variant.1": {
    id: "poster.variant.1",
    group: "海报",
    label: "海报 · 吐槽梗图",
    knownVars: [
      "focus",
      "moodByResult",
      "team",
      "titleByResult",
      "homeScore",
      "awayScore",
      "opponent",
      "slogan",
      "commonInfo",
    ],
    runVia: "image",
  },
  "poster.variant.2": {
    id: "poster.variant.2",
    group: "海报",
    label: "海报 · 复盘理性",
    knownVars: [
      "focus",
      "team",
      "opponent",
      "homeScore",
      "awayScore",
      "resultLabel",
      "slogan",
      "commonInfo",
    ],
    runVia: "image",
  },
  "post-match-copy.frame": {
    id: "post-match-copy.frame",
    group: "赛后文案",
    label: "外层模板（变量 + 章节骨架）",
    knownVars: [
      "team_name",
      "fan_type",
      "emotion_intensity",
      "competition_name",
      "home_team",
      "away_team",
      "home_score",
      "away_score",
      "result",
      "key_event",
      "peak_minute",
      "pre_match_expectation",
      "user_quote",
      "emotion_type",
      "output_scenario",
      "scenario_locator",
      "fan_style",
      "generation_requirement",
    ],
    runVia: "chat",
  },
  "post-match-copy.scenario.friend_circle": {
    id: "post-match-copy.scenario.friend_circle",
    group: "赛后文案",
    label: "场景定位 · 朋友圈",
    knownVars: [],
    runVia: "chat",
  },
  "post-match-copy.scenario.official_social": {
    id: "post-match-copy.scenario.official_social",
    group: "赛后文案",
    label: "场景定位 · 官方社媒",
    knownVars: [],
    runVia: "chat",
  },
  "post-match-copy.fan-style.diehard": {
    id: "post-match-copy.fan-style.diehard",
    group: "赛后文案",
    label: "风格 · 死忠粉",
    knownVars: [],
    runVia: "chat",
  },
  "post-match-copy.fan-style.roaster": {
    id: "post-match-copy.fan-style.roaster",
    group: "赛后文案",
    label: "风格 · 吐槽型",
    knownVars: [],
    runVia: "chat",
  },
  "post-match-copy.fan-style.rational": {
    id: "post-match-copy.fan-style.rational",
    group: "赛后文案",
    label: "风格 · 理性型",
    knownVars: [],
    runVia: "chat",
  },
  "post-match-copy.requirement.friend_circle": {
    id: "post-match-copy.requirement.friend_circle",
    group: "赛后文案",
    label: "生成要求 · 朋友圈",
    knownVars: [],
    runVia: "chat",
  },
  "post-match-copy.requirement.official_social": {
    id: "post-match-copy.requirement.official_social",
    group: "赛后文案",
    label: "生成要求 · 官方社媒",
    knownVars: [],
    runVia: "chat",
  },
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getPromptTemplate(id: PromptId): string {
  if (!isBrowser()) return PROMPT_DEFAULTS[id];
  return window.localStorage.getItem(STORAGE_PREFIX + id) ?? PROMPT_DEFAULTS[id];
}

export function setPromptOverride(id: PromptId, value: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_PREFIX + id, value);
}

export function resetPromptOverride(id: PromptId): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_PREFIX + id);
}

export function isOverridden(id: PromptId): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(STORAGE_PREFIX + id) !== null;
}

// 极简变量替换。先处理 {{name}}（双括号），再处理 {name}（单括号）；
// 缺值保留原字面量，方便 admin 看出哪些变量没传。
export function substitute(template: string, vars: Record<string, string | number>): string {
  return template
    .replace(/\{\{(\w+)\}\}/g, (m, key: string) => {
      const v = vars[key];
      return v === undefined || v === null ? m : String(v);
    })
    .replace(/\{(\w+)\}/g, (m, key: string) => {
      const v = vars[key];
      return v === undefined || v === null ? m : String(v);
    });
}
