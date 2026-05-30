import { getPromptTemplate, substitute, type PromptId } from "./registry";

// 海报 prompt：3 个风格的"骨架模板"放 registry（admin 可改），
// 动态变量（比分 / 选手 / 角色 / 标语 / 结果情绪词）在这里算好再替换进去。

export type PosterVariant = 0 | 1 | 2;

export interface PosterContext {
  team: string;
  opponent: string;
  score: { ours: number; theirs: number };
  finalResult: "win" | "loss" | "draw" | null;
  goldenQuote?: string;
  userQuote?: string;
  playerName?: string;
  gameCharacter?: string;
  userExpression?: string;
}

export const POSTER_VARIANT_LABELS: Record<PosterVariant, string> = {
  0: "荣耀叙事",
  1: "吐槽梗图",
  2: "复盘理性",
};

function resultLabel(r: PosterContext["finalResult"]): string {
  if (r === "win") return "胜利 VICTORY";
  if (r === "loss") return "失利 DEFEAT";
  if (r === "draw") return "平局 DRAW";
  return "战报";
}

function commonInfoLine(ctx: PosterContext): string {
  return `主队：${ctx.team}，对手：${ctx.opponent}，比分：${ctx.score.ours} : ${ctx.score.theirs}，结果：${resultLabel(ctx.finalResult)}`;
}

function pickSlogan(ctx: PosterContext): string {
  return (ctx.userExpression || ctx.goldenQuote || ctx.userQuote || "").slice(0, 32);
}

function focusBlock(ctx: PosterContext): string {
  const player = ctx.playerName?.trim();
  const character = ctx.gameCharacter?.trim();
  if (!player && !character) return "";
  if (player && character) {
    return `画面 C 位人物：电竞选手「${player}」操作着游戏角色「${character}」，请清晰画出该角色的标志性外观、武器与技能特效，让人一眼认出。选手的 ID「${player}」以醒目字体显示在角色旁。`;
  }
  if (player) {
    return `画面 C 位：电竞选手「${player}」的肖像剪影或战斗姿态，ID「${player}」以醒目字体呈现。`;
  }
  return `画面 C 位：游戏角色「${character}」的标志性形象（外观、武器、技能特效要识别度高），名称「${character}」以醒目字体呈现。`;
}

function moodByResult(variant: PosterVariant, r: PosterContext["finalResult"]): string {
  if (variant === 0) {
    return r === "win"
      ? "高耸闪亮、金光爆裂"
      : r === "loss"
        ? "暗淡破碎、烟雾弥漫"
        : "对峙均衡、双色光柱";
  }
  return r === "win"
    ? "得意大笑、眯眼坏笑"
    : r === "loss"
      ? "破防大哭、捂脸捶地"
      : "懵逼问号、摊手无语";
}

function titleByResult(r: PosterContext["finalResult"]): string {
  return r === "win" ? "赢麻了" : r === "loss" ? "破大防" : "打平了";
}

function variantTemplateId(v: PosterVariant): PromptId {
  return `poster.variant.${v}` as const as PromptId;
}

export function buildPosterPrompt(variant: PosterVariant, ctx: PosterContext): string {
  const tpl = getPromptTemplate(variantTemplateId(variant));
  const vars: Record<string, string | number> = {
    focus: focusBlock(ctx),
    team: ctx.team,
    opponent: ctx.opponent,
    homeScore: ctx.score.ours,
    awayScore: ctx.score.theirs,
    slogan: pickSlogan(ctx),
    commonInfo: commonInfoLine(ctx),
    moodByResult: moodByResult(variant, ctx.finalResult),
    titleByResult: titleByResult(ctx.finalResult),
    resultLabel: resultLabel(ctx.finalResult),
  };
  return substitute(tpl, vars);
}

// admin 端"试运行"用——构造一个像样的示例上下文。
export function samplePosterContext(): PosterContext {
  return {
    team: "TES",
    opponent: "JDG",
    score: { ours: 2, theirs: 1 },
    finalResult: "win",
    goldenQuote: "这波偷家真封神",
    userQuote: "稳了稳了",
    playerName: "JackeyLove",
    gameCharacter: "卡莎",
    userExpression: "今晚我们就是冠军心态",
  };
}
