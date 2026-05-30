export type EmotionLabel = "ecstasy" | "tension" | "anger" | "devastated" | "calm";

export type PushChannel = "wechat" | "app" | "email";
export type FanType = "diehard" | "roaster" | "rational";

export interface UserProfile {
  nickname: string;
  favoriteTeams: string[];
  favoritePlayers: string[];
  watchedGames: string[];
  pushChannels: PushChannel[];
  pushTiming: number; // minutes before kickoff
  fanType: FanType;
}

export interface EmotionLogEntry {
  id: string;
  matchMinute: number; // 0..N within match
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
  minute: number; // in-match minute (we accelerate)
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
