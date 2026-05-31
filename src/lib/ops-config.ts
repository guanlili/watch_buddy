import { MATCH_AWAY_TEAM, MATCH_HOME_TEAM, MATCH_LINEUP, TIMELINE } from "@/lib/mock/timeline";
import type { EmotionLabel, MatchEvent, MatchLineupPick, RecommendedMatch } from "@/lib/mock/types";

export const OPS_CONFIG_STORAGE_KEY = "esports-buddy-ops-config";

export interface OpsMatchConfig {
  id: string;
  enabled: boolean;
  tournamentId: string;
  tournamentName: string;
  homeTeam: string;
  homeTeamFull: string;
  awayTeam: string;
  awayTeamFull: string;
  startTimeText: string;
  bestOf: string;
  result: "win" | "loss" | "draw";
  durationSeconds: number;
  lineup: {
    home: MatchLineupPick[];
    away: MatchLineupPick[];
  };
  timeline: MatchEvent[];
}

export interface OpsRecommendedMatchConfig {
  id: string;
  enabled: boolean;
  pinned: boolean;
  tournamentId: string;
  tournamentName: string;
  team1: string;
  team2: string;
  startOffsetMinutes: number;
  isLive: boolean;
  weight: number;
}

export interface OpsPushTemplate {
  id: string;
  enabled: boolean;
  label: string;
  trigger: "pre_match" | "kickoff" | "highlight" | "post_match";
  minutesBefore?: number;
  title: string;
  body: string;
  cta: string;
}

export interface OpsDemoMode {
  // 演示模式总开关：开启后赛中 / 赛后会优先保证「不卡、不翻车」。
  enabled: boolean;
  // 强制本地兜底：完全跳过云端 LLM / 海报调用，直接用预制内容（离线也能演示）。
  forceLocalFallback: boolean;
  // 云端调用超时（毫秒），超时即自动切兜底，避免隧道抖动时一直转圈。
  requestTimeoutMs: number;
  // 海报生成通常更慢，单独给一个稍长但可控的超时。
  posterTimeoutMs: number;
}

export interface OpsConfig {
  version: 1;
  matches: OpsMatchConfig[];
  recommendations: OpsRecommendedMatchConfig[];
  pushTemplates: OpsPushTemplate[];
  demoMode: OpsDemoMode;
}

export const DEFAULT_DEMO_MODE: OpsDemoMode = {
  enabled: false,
  forceLocalFallback: false,
  requestTimeoutMs: 9000,
  posterTimeoutMs: 15000,
};

export const DEFAULT_OPS_CONFIG: OpsConfig = {
  version: 1,
  matches: [
    {
      id: "ag-vs-wb-demo",
      enabled: true,
      tournamentId: "kpl",
      tournamentName: "王者荣耀职业联赛 (KPL)",
      homeTeam: MATCH_HOME_TEAM,
      homeTeamFull: "成都AG超玩会",
      awayTeam: MATCH_AWAY_TEAM,
      awayTeamFull: "微博 WB",
      startTimeText: "今晚 20:00",
      bestOf: "BO5",
      result: "win",
      durationSeconds: 1275,
      lineup: MATCH_LINEUP,
      timeline: TIMELINE,
    },
  ],
  recommendations: [
    {
      id: "ops-kpl-live",
      enabled: true,
      pinned: true,
      tournamentId: "kpl",
      tournamentName: "王者荣耀职业联赛 (KPL)",
      team1: "成都AG超玩会",
      team2: "微博 WB",
      startOffsetMinutes: -15,
      isLive: true,
      weight: 100,
    },
    {
      id: "ops-lpl-live",
      enabled: true,
      pinned: false,
      tournamentId: "lpl",
      tournamentName: "英雄联盟职业联赛 (LPL)",
      team1: "TES (滔搏电子竞技)",
      team2: "JDG (京东电子竞技)",
      startOffsetMinutes: -30,
      isLive: true,
      weight: 80,
    },
    {
      id: "ops-vct-soon",
      enabled: true,
      pinned: false,
      tournamentId: "vct",
      tournamentName: "无畏契约冠军巡回赛 (VCT)",
      team1: "EDG (EDward Gaming)",
      team2: "FPX (FunPlus Phoenix)",
      startOffsetMinutes: 90,
      isLive: false,
      weight: 60,
    },
  ],
  pushTemplates: [
    {
      id: "pre-match-30",
      enabled: true,
      label: "赛前 30 分钟",
      trigger: "pre_match",
      minutesBefore: 30,
      title: "毒奶观察室",
      body: "泉水指挥官：{{team1}} vs {{team2}} 30 分钟后开团！",
      cta: "查看",
    },
    {
      id: "highlight",
      enabled: true,
      label: "高光事件",
      trigger: "highlight",
      title: "高光来了",
      body: "{{team1}} 刚打出关键节奏，进直播间一起开麦！",
      cta: "围观",
    },
    {
      id: "post-match",
      enabled: true,
      label: "赛后战报",
      trigger: "post_match",
      title: "赛后剧场",
      body: "{{team1}} vs {{team2}} 已结束，来生成你的专属战报和海报。",
      cta: "复盘",
    },
  ],
  demoMode: DEFAULT_DEMO_MODE,
};

export function getOpsConfig(): OpsConfig {
  if (typeof window === "undefined") return DEFAULT_OPS_CONFIG;
  const raw = window.localStorage.getItem(OPS_CONFIG_STORAGE_KEY);
  if (!raw) return DEFAULT_OPS_CONFIG;
  try {
    const parsed = JSON.parse(raw) as OpsConfig;
    if (parsed.version !== 1) return DEFAULT_OPS_CONFIG;
    // 兼容旧版本配置：缺失 demoMode 时补默认值，避免读取时报错。
    return { ...parsed, demoMode: { ...DEFAULT_DEMO_MODE, ...parsed.demoMode } };
  } catch {
    return DEFAULT_OPS_CONFIG;
  }
}

export function getDemoMode(config = getOpsConfig()): OpsDemoMode {
  return config.demoMode ?? DEFAULT_DEMO_MODE;
}

export function setOpsConfig(config: OpsConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OPS_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function resetOpsConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OPS_CONFIG_STORAGE_KEY);
}

export function getOpsRecommendedMatches(config = getOpsConfig()): RecommendedMatch[] {
  const now = Date.now();
  return config.recommendations
    .filter((match) => match.enabled)
    .map((match) => ({
      id: match.id,
      tournamentId: match.tournamentId,
      tournamentName: match.tournamentName,
      team1: match.team1,
      team2: match.team2,
      startTime: now + match.startOffsetMinutes * 60 * 1000,
      isLive: match.isLive,
    }));
}

export function getPrimaryPushTemplate(config = getOpsConfig()): OpsPushTemplate {
  return (
    config.pushTemplates.find((template) => template.enabled) ?? DEFAULT_OPS_CONFIG.pushTemplates[0]
  );
}

export function fillOpsTemplate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function emotionLabelText(emotion: EmotionLabel) {
  const map: Record<EmotionLabel, string> = {
    ecstasy: "狂喜",
    tension: "紧张",
    anger: "破防",
    devastated: "崩溃",
    calm: "冷静",
  };
  return map[emotion];
}
