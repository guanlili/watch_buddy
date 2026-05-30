// 赛后文案 prompt：模板放 registry（admin 可改），变量在这里映射好后 substitute。

import { getPromptTemplate, substitute } from "./registry";
import type { FanType } from "@/lib/mock/types";

export type OutputScenario = "friend_circle" | "official_social";
export type CopyResult = "win" | "lose" | "draw";

export interface PostMatchCopyContext {
  // 用户信息
  teamName: string;
  fanType: FanType;
  emotionIntensity: number; // 0-10
  // 比赛信息
  competitionName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  result: CopyResult;
  keyEvent: string;
  peakMinute: number;
  preMatchExpectation: string;
  // 用户表达素材
  userQuote: string;
  emotionType: string;
}

const FAN_TYPE_LABEL: Record<FanType, string> = {
  diehard: "死忠粉型",
  roaster: "吐槽型",
  rational: "理性型",
};

const SCENARIO_LABEL: Record<OutputScenario, string> = {
  friend_circle: "朋友圈",
  official_social: "官方社媒",
};

export function buildPostMatchCopyPrompt(
  scenario: OutputScenario,
  ctx: PostMatchCopyContext,
): string {
  // 只把当前场景 + 当前粉丝类型对应的规则段拼进 frame，避免模型串味。
  const frame = getPromptTemplate("post-match-copy.frame");
  const scenarioLocator = getPromptTemplate(`post-match-copy.scenario.${scenario}` as const);
  const fanStyle = getPromptTemplate(`post-match-copy.fan-style.${ctx.fanType}` as const);
  const requirement = getPromptTemplate(`post-match-copy.requirement.${scenario}` as const);

  return substitute(frame, {
    team_name: ctx.teamName,
    fan_type: FAN_TYPE_LABEL[ctx.fanType],
    emotion_intensity: ctx.emotionIntensity,
    competition_name: ctx.competitionName,
    home_team: ctx.homeTeam,
    away_team: ctx.awayTeam,
    home_score: ctx.homeScore,
    away_score: ctx.awayScore,
    result: ctx.result,
    key_event: ctx.keyEvent,
    peak_minute: ctx.peakMinute,
    pre_match_expectation: ctx.preMatchExpectation,
    user_quote: ctx.userQuote,
    emotion_type: ctx.emotionType,
    output_scenario: SCENARIO_LABEL[scenario],
    scenario_locator: scenarioLocator,
    fan_style: fanStyle,
    generation_requirement: requirement,
  });
}

// admin 端"试运行"用——构造一个像样的示例上下文。
export function samplePostMatchCopyContext(): PostMatchCopyContext {
  return {
    teamName: "TES",
    fanType: "diehard",
    emotionIntensity: 8,
    competitionName: "英雄联盟职业联赛 (LPL)",
    homeTeam: "TES",
    awayTeam: "JDG",
    homeScore: 2,
    awayScore: 1,
    result: "win",
    keyEvent: "37 分钟绝境偷家",
    peakMinute: 37,
    preMatchExpectation: "稳住后期，靠 JackeyLove carry",
    userQuote: "这波偷家真的封神",
    emotionType: "狂喜",
  };
}
