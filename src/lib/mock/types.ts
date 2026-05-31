export type EmotionLabel = "ecstasy" | "tension" | "anger" | "devastated" | "calm";

export type PushChannel = "wechat" | "app" | "email";
export type FanType = "diehard" | "roaster" | "rational";

export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface Tournament {
  id: string;
  name: string;
  teams: Team[];
}

export const TOURNAMENTS: Tournament[] = [
  {
    id: "kpl",
    name: "王者荣耀职业联赛 (KPL)",
    teams: [
      {
        id: "ag",
        name: "成都AG超玩会",
        players: [
          { id: "yinuo", name: "一诺" },
          { id: "changsheng", name: "长生" },
          { id: "zhongyi", name: "钟意" },
          { id: "xuanran", name: "轩染" },
          { id: "dashuai", name: "大帅" },
        ],
      },
      {
        id: "lang",
        name: "重庆狼队",
        players: [
          { id: "guiqi", name: "归期" },
          { id: "xiaopang", name: "小胖" },
          { id: "xiangyu", name: "向鱼" },
          { id: "yaodao", name: "妖刀" },
          { id: "yisheng", name: "一笙" },
        ],
      },
      {
        id: "estar",
        name: "武汉eStarPro",
        players: [
          { id: "tanran", name: "坦然" },
          { id: "huahai", name: "花海" },
          { id: "qingrong", name: "清融" },
          { id: "jueyi", name: "绝意" },
          { id: "ziyang", name: "子阳" },
        ],
      },
    ],
  },
  {
    id: "lpl",
    name: "英雄联盟职业联赛 (LPL)",
    teams: [
      {
        id: "blg",
        name: "BLG (哔哩哔哩电竞)",
        players: [
          { id: "bin", name: "Bin" },
          { id: "xun", name: "Xun" },
          { id: "knight", name: "knight" },
          { id: "elk", name: "Elk" },
          { id: "on", name: "ON" },
        ],
      },
      {
        id: "tes",
        name: "TES (滔搏电子竞技)",
        players: [
          { id: "369", name: "369" },
          { id: "tian", name: "Tian" },
          { id: "creme", name: "Creme" },
          { id: "jackeylove", name: "JackeyLove" },
          { id: "meiko", name: "Meiko" },
        ],
      },
      {
        id: "jdg",
        name: "JDG (京东电子竞技)",
        players: [
          { id: "flandre", name: "Flandre" },
          { id: "kanavi", name: "Kanavi" },
          { id: "yagao", name: "Yagao" },
          { id: "ruler", name: "Ruler" },
          { id: "missing", name: "MISSING" },
        ],
      },
    ],
  },
  {
    id: "vct",
    name: "无畏契约冠军巡回赛 (VCT)",
    teams: [
      {
        id: "edg",
        name: "EDG (EDward Gaming)",
        players: [
          { id: "zmjjkk", name: "ZmjjKK (康康)" },
          { id: "chichoo", name: "CHICHOO (球球)" },
          { id: "nobody", name: "nobody (王森旭)" },
          { id: "smoggy", name: "Smoggy (思邈)" },
          { id: "wooday1", name: "WoodAy1 (木子)" },
        ],
      },
      {
        id: "fpx",
        name: "FPX (FunPlus Phoenix)",
        players: [
          { id: "aaaay", name: "AAAAY" },
          { id: "berlin", name: "BerLIN" },
          { id: "life", name: "Life" },
          { id: "autumn", name: "Autumn" },
          { id: "tzh", name: "TzH" },
        ],
      },
    ],
  },
];

export interface UserProfile {
  nickname: string;
  tournament: string; // 选中的赛事ID
  team: string; // 选中的主队ID
  player: string; // 选中的选手ID
  customTournament?: string; // 自定义赛事
  customTeam?: string; // 自定义主队
  customPlayer?: string; // 自定义选手
  pushChannels: PushChannel[];
  pushTiming: number; // minutes before kickoff
  fanType: FanType;
}

export interface EmotionLogEntry {
  id: string;
  matchSeconds: number; // 0..N within match, in seconds
  realTime: number; // ms timestamp
  userInput: string | null; // null = AI proactive / event-driven
  agentResponse: string;
  emotion: EmotionLabel;
  intensity: 1 | 2 | 3 | 4 | 5;
  isGoldenQuote: boolean;
  eventDescription: string | null;
  isPeak: boolean;
}

export interface FlagRecord {
  id: string;
  creator: "user" | "agent";
  content: string;
  createdMinute: number;
  status: "open" | "hit" | "miss";
  resolvedMinute?: number;
}

export interface MatchEvent {
  seconds: number; // elapsed in-match seconds (we accelerate)
  type: "kickoff" | "team_kill" | "objective" | "ace" | "concede" | "comeback" | "endgame";
  text: string; // system event bubble text
  scoreDelta?: { ours: number; theirs: number };
  // Pre-canned AI reaction to this event:
  agentReaction: {
    text: string;
    emotion: EmotionLabel;
    intensity: 1 | 2 | 3 | 4 | 5;
    isGoldenQuote?: boolean;
    flag?: { action: "create" | "resolve"; content: string; hit?: boolean };
  };
}

export interface MatchLineupPick {
  player: string;
  hero: string;
}

export interface RecommendedMatch {
  id: string;
  tournamentId: string;
  tournamentName: string;
  team1: string;
  team2: string;
  startTime: number; // timestamp
  isLive: boolean;
}
