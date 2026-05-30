import type { MatchEvent } from "./types";

// TES (我方) vs JDG (对面). Accelerated: 1 real second = 6 in-match minutes.
// Total ~45 in-match minutes. So whole match ~75 real seconds. But we'll slow to 1s = 3min so ~90s.
export const MATCH_DURATION_MINUTES = 45;
export const SECONDS_PER_REAL_SECOND = 1; // 1 in-match minutes per real second → ~15s match

export const TIMELINE: MatchEvent[] = [
  {
    minute: 0,
    type: "kickoff",
    text: "比赛开始！TES vs JDG，BO5 第一局",
    agentReaction: {
      text: "兄弟坐稳，今天必须把 JDG 摁在地上摩擦！",
      emotion: "tension",
      intensity: 3,
    },
  },
  {
    minute: 4,
    type: "objective",
    text: "TES 拿下首条小龙",
    scoreDelta: { ours: 1, theirs: 0 },
    agentReaction: {
      text: "稳！开局节奏起来了，这把我赌 TES 拿一血塔！",
      emotion: "ecstasy",
      intensity: 4,
      isGoldenQuote: true,
      flag: { action: "create", content: "TES 拿一血塔" },
    },
  },
  {
    minute: 9,
    type: "concede",
    text: "JDG 反打，TES 上单被单杀",
    scoreDelta: { ours: 1, theirs: 1 },
    agentReaction: {
      text: "我草？这走位是没睡醒吗，交闪也跑不掉啊！",
      emotion: "anger",
      intensity: 4,
      isGoldenQuote: true,
    },
  },
  {
    minute: 14,
    type: "team_kill",
    text: "中路打野配合击杀对面中单",
    scoreDelta: { ours: 2, theirs: 1 },
    agentReaction: {
      text: "这波 gank 太骚了，打野选手起飞！",
      emotion: "ecstasy",
      intensity: 4,
    },
  },
  {
    minute: 19,
    type: "objective",
    text: "TES 拿下一血塔",
    scoreDelta: { ours: 3, theirs: 1 },
    agentReaction: {
      text: "看！我说什么来着！一血塔到手，毒奶就是准！",
      emotion: "ecstasy",
      intensity: 5,
      isGoldenQuote: true,
      flag: { action: "resolve", content: "TES 拿一血塔", hit: true },
    },
  },
  {
    minute: 24,
    type: "concede",
    text: "团战崩盘，TES 0换4",
    scoreDelta: { ours: 3, theirs: 5 },
    agentReaction: {
      text: "完了完了完了…这团怎么打成这样的，AD 站位站到对面脸上去了",
      emotion: "devastated",
      intensity: 5,
      isGoldenQuote: true,
    },
  },
  {
    minute: 28,
    type: "concede",
    text: "JDG 拿下大龙",
    scoreDelta: { ours: 3, theirs: 7 },
    agentReaction: {
      text: "别急别急，还能翻，水晶还在！我赌 TES 30 分钟内必抢一波 buff！",
      emotion: "tension",
      intensity: 4,
      flag: { action: "create", content: "TES 30 分钟内抢回 buff" },
    },
  },
  {
    minute: 33,
    type: "team_kill",
    text: "TES 偷家小分队成功，破对面下路高地",
    scoreDelta: { ours: 6, theirs: 7 },
    agentReaction: {
      text: "卧槽卧槽卧槽！这是什么神仙运营！偷家成功！",
      emotion: "ecstasy",
      intensity: 5,
      isGoldenQuote: true,
    },
  },
  {
    minute: 38,
    type: "ace",
    text: "高地团 TES 4换5，剩下一人推水晶",
    scoreDelta: { ours: 11, theirs: 7 },
    agentReaction: {
      text: "推推推！别打字了，推水晶！这把稳了这把真的稳了！",
      emotion: "ecstasy",
      intensity: 5,
      isGoldenQuote: true,
      flag: { action: "resolve", content: "TES 30 分钟内抢回 buff", hit: false },
    },
  },
  {
    minute: 42,
    type: "endgame",
    text: "TES 推掉水晶，拿下第一局！",
    scoreDelta: { ours: 12, theirs: 7 },
    agentReaction: {
      text: "赢了！哥几个赢了！我就说 TES 这把没问题！下一把继续干！",
      emotion: "ecstasy",
      intensity: 5,
      isGoldenQuote: true,
    },
  },
];

// Generic responses to user input — keyword based
export const USER_RESPONSE_PACKS: {
  keywords: string[];
  replies: {
    text: string;
    emotion: import("./types").EmotionLabel;
    intensity: 1 | 2 | 3 | 4 | 5;
    isGoldenQuote?: boolean;
  }[];
}[] = [
  {
    keywords: ["菜", "垃圾", "坑", "傻"],
    replies: [
      { text: "确实菜，这操作我替补上去都比他强", emotion: "anger", intensity: 4 },
      { text: "别气别气，菜是原罪，骂！", emotion: "anger", intensity: 4 },
    ],
  },
  {
    keywords: ["稳", "牛", "强", "厉害", "666"],
    replies: [
      {
        text: "这把稳了兄弟，我都已经准备好截图发朋友圈了",
        emotion: "ecstasy",
        intensity: 4,
        isGoldenQuote: true,
      },
      { text: "牛逼！这才叫电竞！", emotion: "ecstasy", intensity: 4 },
    ],
  },
  {
    keywords: ["崩", "完了", "输", "破防"],
    replies: [
      { text: "别破防别破防，电竞没有早知道，咱看下一波", emotion: "devastated", intensity: 4 },
      { text: "我也急啊，但骂完该看还得看", emotion: "devastated", intensity: 3 },
    ],
  },
  {
    keywords: ["?", "？", "为什么", "怎么"],
    replies: [
      { text: "问就是教练背锅，反正不是我们 TES 的问题", emotion: "anger", intensity: 3 },
      { text: "我也不懂这操作什么思路", emotion: "calm", intensity: 2 },
    ],
  },
  {
    keywords: ["哈哈", "笑", "搞笑"],
    replies: [{ text: "笑死，这场比赛真的什么都能发生", emotion: "ecstasy", intensity: 3 }],
  },
];

// Fallback "之外" reply when no keyword matches
export const FALLBACK_REPLIES = [
  {
    text: "懂你的意思，但咱先看场上节奏，待会儿团一波见真章",
    emotion: "calm" as const,
    intensity: 2 as const,
  },
  {
    text: "你这话有点意思，等会儿赢了我就把这句截下来",
    emotion: "calm" as const,
    intensity: 2 as const,
  },
  { text: "嗯嗯听你的，反正我永远站 TES", emotion: "calm" as const, intensity: 2 as const },
];

// Idle (cold-start) opener replies
export const IDLE_OPENERS = [
  { text: "兄弟你睡着了？这一波运营你怎么看？", emotion: "calm" as const, intensity: 2 as const },
  {
    text: "我突然想到一个事，你说这把要是输了你能挺住不？",
    emotion: "calm" as const,
    intensity: 2 as const,
  },
  {
    text: "无聊了说点啥啊，给我聊聊你最讨厌哪个解说？",
    emotion: "calm" as const,
    intensity: 2 as const,
  },
];
