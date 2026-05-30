import type { RecommendedMatch, Tournament } from "./types";
import { TOURNAMENTS } from "./types";

// 生成推荐赛事的mock数据
const now = Date.now();

export const RECOMMENDED_MATCHES: RecommendedMatch[] = [
  // LPL相关
  {
    id: "match-lpl-1",
    tournamentId: "lpl",
    tournamentName: "英雄联盟职业联赛 (LPL)",
    team1: "TES (滔搏电子竞技)",
    team2: "JDG (京东电子竞技)",
    startTime: now - 30 * 60 * 1000, // 30分钟前开始
    isLive: true,
  },
  {
    id: "match-lpl-2",
    tournamentId: "lpl",
    tournamentName: "英雄联盟职业联赛 (LPL)",
    team1: "BLG (哔哩哔哩电竞)",
    team2: "WBG",
    startTime: now + 60 * 60 * 1000, // 1小时后开始
    isLive: false,
  },
  {
    id: "match-lpl-3",
    tournamentId: "lpl",
    tournamentName: "英雄联盟职业联赛 (LPL)",
    team1: "LNG",
    team2: "OMG",
    startTime: now + 2 * 60 * 60 * 1000, // 2小时后开始
    isLive: false,
  },
  // KPL相关
  {
    id: "match-kpl-1",
    tournamentId: "kpl",
    tournamentName: "王者荣耀职业联赛 (KPL)",
    team1: "成都AG超玩会",
    team2: "重庆狼队",
    startTime: now - 15 * 60 * 1000, // 15分钟前开始
    isLive: true,
  },
  {
    id: "match-kpl-2",
    tournamentId: "kpl",
    tournamentName: "王者荣耀职业联赛 (KPL)",
    team1: "武汉eStarPro",
    team2: "广州TTG",
    startTime: now + 45 * 60 * 1000, // 45分钟后开始
    isLive: false,
  },
  // VCT相关
  {
    id: "match-vct-1",
    tournamentId: "vct",
    tournamentName: "无畏契约冠军巡回赛 (VCT)",
    team1: "EDG (EDward Gaming)",
    team2: "FPX (FunPlus Phoenix)",
    startTime: now + 90 * 60 * 1000, // 1.5小时后开始
    isLive: false,
  },
  {
    id: "match-vct-2",
    tournamentId: "vct",
    tournamentName: "无畏契约冠军巡回赛 (VCT)",
    team1: "LOUD",
    team2: "Sentinels",
    startTime: now + 3 * 60 * 60 * 1000, // 3小时后开始
    isLive: false,
  },
];

// 根据用户档案获取推荐赛事
export function getRecommendedMatches(userProfile: {
  tournament: string;
  team: string;
}): RecommendedMatch[] {
  // 先找到用户选择的赛事
  const userTournament = TOURNAMENTS.find((t) => t.id === userProfile.tournament);
  const userTournamentName = userTournament?.name || "";

  const matches = [...RECOMMENDED_MATCHES];

  // 优先排序：用户选择的赛事优先，正在直播的优先，然后按时间排序
  matches.sort((a, b) => {
    // 用户选择的赛事优先
    const aIsUserTournament = a.tournamentId === userProfile.tournament;
    const bIsUserTournament = b.tournamentId === userProfile.tournament;
    if (aIsUserTournament !== bIsUserTournament) {
      return aIsUserTournament ? -1 : 1;
    }

    // 正在直播的优先
    if (a.isLive !== b.isLive) {
      return a.isLive ? -1 : 1;
    }

    // 按开始时间排序
    return a.startTime - b.startTime;
  });

  // 返回前3个
  return matches.slice(0, 3);
}
