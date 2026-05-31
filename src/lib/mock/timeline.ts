import type { MatchEvent, MatchLineupPick } from "./types";

// 真实赛事：成都AG超玩会（我方） vs 微博WB（对面），AG 取胜。
// 比赛开始记为 0:00，最终团战结束于约 21:15（=1275s）。
export const MATCH_HOME_TEAM = "AG";
export const MATCH_AWAY_TEAM = "微博";
export const MATCH_HOME_TEAM_FULL = "成都AG超玩会";
export const MATCH_AWAY_TEAM_FULL = "微博 WB";
export const MATCH_RESULT: "win" | "loss" | "draw" = "win"; // AG 胜

export const MATCH_DURATION_SECONDS = 1275; // 21:15
// 1x 倍速：1 真实秒 = 1 比赛秒（真实直播节奏）。倍速档位走 0.5/2/4 提速。
export const MATCH_SECONDS_PER_REAL_SECOND_1X = 1;
export const SPEED_OPTIONS = [0.5, 1, 2, 4] as const;
export type SpeedOption = (typeof SPEED_OPTIONS)[number];
export const DEFAULT_SPEED: SpeedOption = 1;

// BP / 双方阵容（按真实事件反推映射，与赛中文案保持一致）。
export const MATCH_LINEUP: {
  home: MatchLineupPick[]; // AG（我方）
  away: MatchLineupPick[]; // 微博（对面）
} = {
  home: [
    { player: "轩染", hero: "马超" },
    { player: "钟意", hero: "阿古朵" },
    { player: "长生", hero: "海月" },
    { player: "一诺", hero: "戈娅" },
    { player: "大帅", hero: "空空儿" },
  ],
  away: [
    { player: "子墨", hero: "杨戬" },
    { player: "暖阳", hero: "元坦" },
    { player: "听悦", hero: "甄姬" },
    { player: "小麦", hero: "艾琳" },
    { player: "梦溪", hero: "太乙真人" },
  ],
};

// 真实事件流，时间戳为「比赛开始（07:40）后」的秒数；事件文本里同时保留录像原始时间段，方便观赛对照。
export const TIMELINE: MatchEvent[] = [
  {
    // 07:40 比赛开始
    seconds: 0,
    type: "kickoff",
    text: "比赛开始（07:40）· BP 完毕，AG 选大马超+空空儿推进体系，微博端出杨戬/元坦稳健阵容",
    agentReaction: {
      text: "BP 给 AG 抢到了大马超+空空儿这套推进体系，咱这把就赌兵线压死他们！",
      emotion: "tension",
      intensity: 3,
      flag: { action: "create", content: "AG 拿到一血" },
    },
  },
  {
    // 08:13 - 08:33
    seconds: 33,
    type: "team_kill",
    text: "早期冲突（08:13-08:33）· 双方发育路初期摩擦，AG 三人包夹越塔，交出闪现拉扯，未爆人头",
    agentReaction: {
      text: "AG 这波三人包夹没收下来，闪现都交了…可惜，开局节奏没起来。",
      emotion: "tension",
      intensity: 3,
    },
  },
  {
    // 11:36 - 11:38
    seconds: 236,
    type: "objective",
    text: "资源争夺（11:36-11:38）· 4 分钟暴君节点，双方围绕龙坑和对抗路试探与做视野",
    agentReaction: {
      text: "4 分钟暴君要刷了，AG 龙坑视野做得稳，先把眼布到位再说。",
      emotion: "tension",
      intensity: 2,
    },
  },
  {
    // 12:03 - 12:16
    seconds: 263,
    type: "team_kill",
    text: "团战 / 一血（12:03-12:16）· 大帅配合一诺击杀对方拿到一血；同时暖阳配合队友在另一侧击杀长生，完成 1 换 1",
    scoreDelta: { ours: 1, theirs: 1 },
    agentReaction: {
      text: "大帅这波带一诺包人太骚了！一血到手，长生那边送一个不亏，1 换 1 我们赚节奏！",
      emotion: "ecstasy",
      intensity: 4,
      isGoldenQuote: true,
      flag: { action: "resolve", content: "AG 拿到一血", hit: true },
    },
  },
  {
    // 12:19 - 12:28
    seconds: 279,
    type: "objective",
    text: "掌控资源（12:19-12:28）· AG 抓住时机，果断控下第一条暴君",
    agentReaction: {
      text: "第一条暴君收了！钟意这波 buff 一上经济直接拉开，节奏全在 AG 手里。",
      emotion: "ecstasy",
      intensity: 4,
    },
  },
  {
    // 13:41 - 13:52
    seconds: 361,
    type: "objective",
    text: "团队推进（13:41-13:52）· 微博陷入兵线拉扯劣势，AG 顺势推掉微博上路一塔",
    agentReaction: {
      text: "微博兵线被压得喘不过气，AG 上一塔顺手就带走了，舒服。",
      emotion: "ecstasy",
      intensity: 3,
    },
  },
  {
    // 15:39 - 15:51
    seconds: 479,
    type: "team_kill",
    text: "推塔 / 团战（15:39-15:51）· AG 推掉微博上路二塔，大帅找机会晕眩留人，钟意跟上输出拿击杀完成破局",
    scoreDelta: { ours: 1, theirs: 0 },
    agentReaction: {
      text: "大帅一晕眩留死人，钟意上去就是一套 A 死！上二塔+人头，破局了！",
      emotion: "ecstasy",
      intensity: 4,
      isGoldenQuote: true,
    },
  },
  {
    // 16:00 - 16:11
    seconds: 500,
    type: "objective",
    text: "团队推进（16:00-16:11）· AG 施加中路压力，成功磨掉微博中路一塔",
    agentReaction: {
      text: "中一塔也磨掉了，这套体系真把微博防线打得到处漏。",
      emotion: "ecstasy",
      intensity: 3,
    },
  },
  {
    // 17:03 - 17:51
    seconds: 563,
    type: "objective",
    text: "团战 / 控龙（17:03-17:51）· 微博梦奇闪现开团出现失误掉点，AG 逼退微博众人顺利换龙拿下暴君",
    agentReaction: {
      text: "梦奇这闪现开团是失误吧？AG 直接逼退微博众人，换龙顺了暴君，资源差越拉越大！",
      emotion: "ecstasy",
      intensity: 4,
      isGoldenQuote: true,
    },
  },
  {
    // 18:59 - 19:57
    seconds: 679,
    type: "concede",
    text: "关键团战（18:59-19:57）· 全场高光团战！一诺遭遇先手但极限拉扯，子墨（杨戬）进场收割完成单杀，微博靠这一波团战胜利稳住崩盘局势",
    scoreDelta: { ours: 0, theirs: 3 },
    agentReaction: {
      text: "卧槽？子墨这杨戬入场太逆天了！单杀一诺打完反打，微博一波直接咬回来稳住局面…AG 这经济得绷住啊！",
      emotion: "anger",
      intensity: 5,
      isGoldenQuote: true,
      flag: { action: "create", content: "AG 22 分钟前破微博上路高地" },
    },
  },
  {
    // 21:08
    seconds: 808,
    type: "objective",
    text: "高地攻防（21:08）· 微博上路高地塔被轩染（马超）带掉，微博彻底陷入被无限拉扯兵线的痛苦期",
    scoreDelta: { ours: 1, theirs: 0 },
    agentReaction: {
      text: "轩染马超直接把上路高地塔带了！微博这下要被无限拉扯兵线了，22 分钟前精准到位！",
      emotion: "ecstasy",
      intensity: 5,
      isGoldenQuote: true,
      flag: { action: "resolve", content: "AG 22 分钟前破微博上路高地", hit: true },
    },
  },
  {
    // 21:37 - 22:15
    seconds: 837,
    type: "objective",
    text: "掌控资源（21:37-22:15）· AG 利用马超在上路牵制，正面直接动龙稳健拿下暗影主宰，形成兵线与资源双重压制",
    agentReaction: {
      text: "暗影主宰也到手！马超上路牵制 + 兵线双压，微博真的难顶了。",
      emotion: "ecstasy",
      intensity: 4,
    },
  },
  {
    // 24:44 - 24:58
    seconds: 1024,
    type: "team_kill",
    text: "团队冲突（24:44-24:58）· 暖阳试图反手强开寻找破局点，开团位置极佳，但 AG 坚决执行拉扯战术拒接团战",
    agentReaction: {
      text: "暖阳这开团位置真不错，但 AG 死活不接坚决拉扯，老练！这就是 buff 在手该有的样子。",
      emotion: "calm",
      intensity: 3,
    },
  },
  {
    // 27:01 - 27:04
    seconds: 1161,
    type: "objective",
    text: "高地攻防（27:01-27:04）· 微博中路高地塔告破，防守压力剧增，小麦卖掉物理装备换为纯法强准备殊死一搏",
    scoreDelta: { ours: 1, theirs: 0 },
    agentReaction: {
      text: "中路高地也告破了！小麦肉装都卖了换法强，这是要殊死一搏，AG 这把基本锁了！",
      emotion: "ecstasy",
      intensity: 4,
    },
  },
  {
    // 28:02 - 28:55
    seconds: 1222,
    type: "ace",
    text: "决胜团战（28:02-28:55）· 龙王节点最终决战，马超绕后反包切入，微博正面团战溃败，AG 势如破竹摧毁水晶拿下胜利",
    scoreDelta: { ours: 4, theirs: 0 },
    agentReaction: {
      text: "马超绕后反包！微博正面直接溃败，AG 推爆水晶！哥几个赢了！！",
      emotion: "ecstasy",
      intensity: 5,
      isGoldenQuote: true,
    },
  },
  {
    // 28:55 终场（= 比赛开始 + 21:15）
    seconds: MATCH_DURATION_SECONDS,
    type: "endgame",
    text: "终场哨响（28:55）· AG 拿下比赛，这套大马超推进体系版本答案",
    agentReaction: {
      text: "稳！这套大马超体系版本答案，AG 这局赢得干净利落！",
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
      { text: "问就是教练背锅，反正不是我们 AG 的问题", emotion: "anger", intensity: 3 },
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
  { text: "嗯嗯听你的，反正我永远站 AG", emotion: "calm" as const, intensity: 2 as const },
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
