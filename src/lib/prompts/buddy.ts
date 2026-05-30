import { TOURNAMENTS, type UserProfile, type FanType } from "@/lib/mock/types";
import { getPromptTemplate } from "./registry";

// 可编辑的"核心人设 / 粉丝镜像"现在统一从 registry 取，admin 端可覆盖。
// 这里只负责动态拼装（用户画像 / 实时比赛上下文）这些代码部分。

export interface LiveMatchContext {
  ourTeam: string;
  opponent: string;
  minute: number;
  score: { ours: number; theirs: number };
  lastEventText: string | null;
}

function fanMirrorFor(t: FanType): string {
  return getPromptTemplate(`buddy.fan-mirror.${t}` as const);
}

export function buildBuddySystemPrompt(profile: UserProfile | null): string {
  const parts = [getPromptTemplate("buddy.persona")];

  if (profile) {
    const tournament = TOURNAMENTS.find((t) => t.id === profile.tournament);
    const team = tournament?.teams.find((tm) => tm.id === profile.team);
    const player = team?.players.find((p) => p.id === profile.player);

    const tName = tournament?.name ?? profile.customTournament;
    const teamName = team?.name ?? profile.customTeam;
    const playerName = player?.name ?? profile.customPlayer;

    parts.push(
      "",
      "【今天陪谁看】",
      `- 用户昵称：${profile.nickname}`,
      `- 主追赛事：${tName ?? "未指定"}`,
      `- 主队（咱的队！）：${teamName ?? "未指定"}`,
      `- 本命选手：${playerName ?? "未指定"}`,
    );

    parts.push("", `【跟谁同频】${fanMirrorFor(profile.fanType)}`);
  }

  return parts.join("\n");
}

export function buildLiveMatchSystemPrompt(
  profile: UserProfile | null,
  ctx: LiveMatchContext,
): string {
  const base = buildBuddySystemPrompt(profile);
  const lead =
    ctx.score.ours > ctx.score.theirs
      ? "我们领先"
      : ctx.score.ours < ctx.score.theirs
        ? "我们落后"
        : "比分咬着";
  const lines = [
    base,
    "",
    "【现在正在打的比赛】",
    `- 主队：${ctx.ourTeam}  vs  ${ctx.opponent}`,
    `- 当前比分：${ctx.score.ours} : ${ctx.score.theirs}（${lead}）`,
    `- 比赛时间：第 ${ctx.minute} 分钟`,
  ];
  if (ctx.lastEventText) lines.push(`- 刚刚发生：${ctx.lastEventText}`);
  lines.push("", "回复时把比分/局势的感觉揉进去就行，别像主持人念稿，自然一句带出来。");
  return lines.join("\n");
}
