import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/lib/mock/store";
import { TOURNAMENTS } from "@/lib/mock/types";
import { MATCH_HOME_TEAM, MATCH_AWAY_TEAM, MATCH_DURATION_SECONDS } from "@/lib/mock/timeline";
import { GlassCard } from "@/components/GlassCard";
import { MatchStageRail } from "@/components/MatchStageRail";
import { NeonButton } from "@/components/NeonButton";
import { EMOTION_MAP } from "@/lib/mock/emotion-map";
import { generatePoster } from "@/lib/api/image.functions";
import { chatCompletion } from "@/lib/api/chat.functions";
import { Textarea } from "@/components/Textarea";
import { LoadingOverlay, ErrorState } from "@/components/StatusOverlay";
import { buildPosterPrompt, type PosterContext, type PosterVariant } from "@/lib/prompts/poster";
import {
  HERO_POSTER_ASSETS,
  PLAYER_POSTER_ASSETS,
  findPosterAsset,
  type PosterAsset,
} from "@/lib/poster-assets";
import {
  buildPostMatchCopyPrompt,
  type CopyResult,
  type OutputScenario,
  type PostMatchCopyContext,
} from "@/lib/prompts/post-match-copy";
import {
  BarChart3,
  Copy,
  Images,
  Loader2,
  Quote,
  RefreshCw,
  Share2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/post-match")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 赛后图文" }] }),
  component: PostMatch,
});

function formatMatchTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function PostMatch() {
  const profile = useAppStore((s) => s.profile);
  const logs = useAppStore((s) => s.logs);
  const score = useAppStore((s) => s.score);
  const flags = useAppStore((s) => s.flags);
  const finalResult = useAppStore((s) => s.finalResult);
  const nav = useNavigate();

  // 本场是真实赛事录像：AG vs 微博，对阵硬编码以保证文案/海报一致。
  const team = MATCH_HOME_TEAM;
  const opponent = MATCH_AWAY_TEAM;

  // 从 profile 取本命选手，优先在内置素材库里选中对应选手。
  const initialPlayer = useMemo(() => {
    if (!profile) return "";
    const tour = TOURNAMENTS.find((t) => t.id === profile.tournament);
    const t = tour?.teams.find((x) => x.id === profile.team);
    const p = t?.players.find((x) => x.id === profile.player);
    return p?.name ?? profile.customPlayer ?? "";
  }, [profile]);
  const initialPlayerAssetId = useMemo(
    () => PLAYER_POSTER_ASSETS.find((asset) => asset.name === initialPlayer)?.id ?? "yi-nuo",
    [initialPlayer],
  );

  const [selectedPoster, setSelectedPoster] = useState<PosterVariant>(0);
  const [tier, setTier] = useState<"light" | "deep">("light");
  // 用户配置：只能从内置素材库选择选手 / 英雄，再补一句想表达的话。
  const [selectedPlayerAssetId, setSelectedPlayerAssetId] = useState(initialPlayerAssetId);
  const [selectedHeroAssetId, setSelectedHeroAssetId] = useState("ma-chao");
  const [userExpression, setUserExpression] = useState("");
  const selectedPlayerAsset = findPosterAsset("player", selectedPlayerAssetId);
  const selectedHeroAsset = findPosterAsset("hero", selectedHeroAssetId);
  useEffect(() => {
    setSelectedPlayerAssetId(initialPlayerAssetId);
  }, [initialPlayerAssetId]);
  // 海报缓存：每个变体单独跟踪 url / loading / error，避免重复调 API。
  const [posterCache, setPosterCache] = useState<
    Record<PosterVariant, { loading: boolean; url?: string; error?: string }>
  >({
    0: { loading: false },
    1: { loading: false },
    2: { loading: false },
  });

  // 配置一变就把所有缓存的海报作废——之前那张是按旧配置生成的，留着会让用户困惑。
  const configSig = `${selectedPlayerAssetId}|${selectedHeroAssetId}|${userExpression}`;
  const lastSigRef = useRef(configSig);
  useEffect(() => {
    if (lastSigRef.current !== configSig) {
      lastSigRef.current = configSig;
      setPosterCache({ 0: { loading: false }, 1: { loading: false }, 2: { loading: false } });
    }
  }, [configSig]);

  // 文案缓存：朋友圈 / 官方社媒 各一份。切换 tier 时若没生成过就自动调一次。
  const [copyCache, setCopyCache] = useState<
    Record<"light" | "deep", { loading: boolean; text?: string; error?: string }>
  >({
    light: { loading: false },
    deep: { loading: false },
  });
  useEffect(() => {
    const c = copyCache[tier];
    if (!c.text && !c.loading && !c.error) {
      void generateCopy(tier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  const goldenQuotes = useMemo(
    () => logs.filter((l) => l.isGoldenQuote && l.agentResponse).slice(0, 5),
    [logs],
  );
  const userQuotes = useMemo(
    () =>
      logs
        .filter((l) => l.userInput)
        .map((l) => l.userInput!)
        .filter((q, i, arr) => arr.indexOf(q) === i),
    [logs],
  );
  const peaks = logs.filter((l) => l.isPeak);

  if (logs.length === 0) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <GlassCard glow="primary" className="max-w-md text-center">
          <p>还没有赛中数据，先看一场比赛吧。</p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/match">
              <NeonButton variant="accent">去看比赛</NeonButton>
            </Link>
            <Link to="/">
              <NeonButton variant="ghost">回大厅</NeonButton>
            </Link>
          </div>
        </GlassCard>
      </main>
    );
  }

  // 兜底文案：API 失败时显示，确保页面不空。
  const fallbackLightCopy =
    goldenQuotes[0]?.agentResponse ?? `${team} 这把不容易，反正我吐槽完了。`;
  const fallbackDeepCopy = `【${team} ${finalResult === "win" ? "胜" : finalResult === "loss" ? "负" : "平"} ${opponent} · ${score.ours}-${score.theirs}】

最帅的瞬间：${peaks[0]?.eventDescription ?? "全程都帅"}
最破防瞬间：${peaks.find((p) => p.emotion === "devastated")?.eventDescription ?? "无"}

#${team} #毒奶观察室`;

  function buildCopyContext(): PostMatchCopyContext | null {
    if (!profile) return null;
    const tournament = TOURNAMENTS.find((t) => t.id === profile.tournament);
    const competitionName = tournament?.name ?? profile.customTournament ?? "电竞赛事";

    // 情绪烈度：所有 log 的强度（1-5）取均值再乘 2 → 0-10。
    const avgIntensity =
      logs.length > 0 ? logs.reduce((s, l) => s + l.intensity, 0) / logs.length : 0;
    const emotionIntensity = Math.min(10, Math.round(avgIntensity * 2));

    const peakLog = peaks[0];
    const userFlag = flags.find((f) => f.creator === "user");
    const result: CopyResult =
      finalResult === "loss" ? "lose" : finalResult === "win" ? "win" : "draw";

    return {
      teamName: team,
      fanType: profile.fanType,
      emotionIntensity,
      competitionName,
      homeTeam: team,
      awayTeam: opponent,
      homeScore: score.ours,
      awayScore: score.theirs,
      result,
      keyEvent: peakLog?.eventDescription ?? "全场拉锯，节奏起伏不断",
      peakMinute: peakLog ? Math.round(peakLog.matchSeconds / 60) : 0,
      preMatchExpectation: userFlag?.content ?? "看主队稳定发挥，争取拿下这一分",
      userQuote: userQuotes[0] ?? goldenQuotes[0]?.agentResponse ?? "",
      emotionType: peakLog ? EMOTION_MAP[peakLog.emotion].label : "紧张",
    };
  }

  async function generateCopy(t: "light" | "deep") {
    const ctx = buildCopyContext();
    if (!ctx) {
      toast.error("用户档案缺失，请先去新手引导填一下。");
      return;
    }
    setCopyCache((cur) => ({ ...cur, [t]: { loading: true } }));
    try {
      const scenario: OutputScenario = t === "light" ? "friend_circle" : "official_social";
      const systemPrompt = buildPostMatchCopyPrompt(scenario, ctx);
      const { reply } = await chatCompletion({
        data: {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "请按上面要求直接生成文案本体，不要任何前缀、标题或解释。" },
          ],
          temperature: 0.85,
        },
      });
      setCopyCache((cur) => ({ ...cur, [t]: { loading: false, text: reply.trim() } }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setCopyCache((cur) => ({ ...cur, [t]: { loading: false, error: msg } }));
      toast.error(`文案生成失败：${msg}`);
    }
  }

  const cachedCopy = copyCache[tier];
  const copyText = cachedCopy.text ?? (tier === "light" ? fallbackLightCopy : fallbackDeepCopy);

  function doCopy() {
    navigator.clipboard.writeText(copyText).then(() => toast.success("文案已复制，去贴朋友圈！"));
  }

  function posterContext(v: PosterVariant): PosterContext {
    const safe = (arr: typeof goldenQuotes, i: number) =>
      arr[i % Math.max(1, arr.length)]?.agentResponse;
    return {
      team,
      opponent,
      score,
      finalResult: finalResult as "win" | "loss" | "draw" | null,
      goldenQuote: safe(goldenQuotes, v),
      userQuote: userQuotes[v % Math.max(1, userQuotes.length)],
      playerName: selectedPlayerAsset?.name,
      gameCharacter: selectedHeroAsset?.name,
      userExpression: userExpression.trim() || undefined,
    };
  }

  function posterReferencePrompt(): string {
    if (!selectedPlayerAsset || !selectedHeroAsset) return "";
    return `

【素材库参考图】
参考图 1 是选手素材「${selectedPlayerAsset.name}」：${selectedPlayerAsset.promptHint}
参考图 2 是英雄素材「${selectedHeroAsset.name}」：${selectedHeroAsset.promptHint}
请基于这两张素材生成原创赛后海报，保留选手/英雄的核心识别特征，不要直接复刻参考图的构图、背景和文字。`;
  }

  async function generateForVariant(v: PosterVariant) {
    if (!selectedPlayerAsset || !selectedHeroAsset) {
      toast.error("请先选择选手和英雄素材。");
      return;
    }
    setPosterCache((cur) => ({ ...cur, [v]: { loading: true } }));
    try {
      const prompt = `${buildPosterPrompt(v, posterContext(v))}${posterReferencePrompt()}`;
      const { url } = await generatePoster({
        data: {
          prompt,
          referenceImageUrls: [selectedPlayerAsset.imageUrl, selectedHeroAsset.imageUrl],
        },
      });
      setPosterCache((cur) => ({ ...cur, [v]: { loading: false, url } }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPosterCache((cur) => ({ ...cur, [v]: { loading: false, error: msg } }));
      toast.error(`海报生成失败：${msg}`);
    }
  }

  return (
    <main className="relative min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/match"
          className="font-display text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
        >
          ← 返回赛场
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <div className="font-display text-xs uppercase tracking-[0.3em] text-accent">
            赛后剧场 · POST-MATCH STUDIO
          </div>
          <h1 className="title-stroke mt-2 text-4xl sm:text-5xl">
            {finalResult === "win"
              ? "🏆 这场，归你"
              : finalResult === "loss"
                ? "💔 这场，破防"
                : "🤝 这场，平局"}
          </h1>
        </motion.div>

        <MatchStageRail current="post" className="mt-5" />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <PostSignal
            icon={BarChart3}
            title="情绪归档"
            value={`${logs.length} 条`}
            desc="赛中波动沉淀成复盘曲线。"
          />
          <PostSignal
            icon={Quote}
            title="金句打捞"
            value={`${goldenQuotes.length} 句`}
            desc="把最上头的时刻留给社交平台。"
          />
          <PostSignal
            icon={Images}
            title="海报出片"
            value="3 款"
            desc="赢了吹，输了嘴硬，平了讲格局。"
          />
        </div>

        {/* Emotion curve */}
        <GlassCard glow="primary" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm uppercase tracking-wider">情绪曲线</div>
            <div className="flex gap-2 text-[10px]">
              {(["ecstasy", "anger", "devastated", "tension", "calm"] as const).map((k) => (
                <div key={k} className="flex items-center gap-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: EMOTION_MAP[k].color }}
                  />
                  <span className="text-muted-foreground">{EMOTION_MAP[k].label}</span>
                </div>
              ))}
            </div>
          </div>
          <EmotionCurve />
        </GlassCard>

        {/* Posters */}
        <div className="mt-6">
          <div className="mb-3 font-display text-sm uppercase tracking-wider">
            个性化海报（配置后生成）
          </div>

          {/* 配置卡片 */}
          <GlassCard glow="primary" className="!p-4">
            <div className="grid gap-4">
              <AssetPicker
                title="选手素材"
                assets={PLAYER_POSTER_ASSETS}
                selectedId={selectedPlayerAssetId}
                onSelect={setSelectedPlayerAssetId}
              />
              <AssetPicker
                title="英雄素材"
                assets={HERO_POSTER_ASSETS}
                selectedId={selectedHeroAssetId}
                onSelect={setSelectedHeroAssetId}
              />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-display uppercase tracking-widest text-muted-foreground">
                  你想说的话 <span className="text-muted-foreground/60">(海报底部标语)</span>
                </label>
                <Textarea
                  value={userExpression}
                  onChange={(e) => setUserExpression(e.target.value)}
                  placeholder="留空就用搭子的金句"
                  rows={2}
                  maxLength={64}
                />
                <div className="mt-1 text-right text-[10px] text-muted-foreground">
                  {userExpression.length} / 64
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 风格三选一 */}
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {([0, 1, 2] as const).map((i) => {
              const cache = posterCache[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedPoster(i)}
                  className={`relative overflow-hidden rounded-2xl transition ${selectedPoster === i ? "ring-2 ring-accent neon-border-accent" : "ring-1 ring-border"}`}
                >
                  <Poster
                    variant={i}
                    team={team}
                    opponent={opponent}
                    score={score}
                    finalResult={finalResult}
                    goldenQuote={
                      goldenQuotes[i % Math.max(1, goldenQuotes.length)]?.agentResponse ??
                      userQuotes[0] ??
                      "电竞真好"
                    }
                    userQuote={userQuotes[i % Math.max(1, userQuotes.length)] ?? "稳了"}
                    generatedUrl={cache.url}
                  />
                  {cache.loading && <LoadingOverlay message="AI 出片中…" />}
                  {!cache.url && !cache.loading && !cache.error && (
                    <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      预览
                    </div>
                  )}
                  {!cache.loading && cache.error && (
                    <ErrorState
                      variant="absolute"
                      message="生成失败"
                      onRetry={() => void generateForVariant(i)}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* 生成主按钮 */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              已选风格：
              <span className="ml-1 text-accent">
                {selectedPoster === 0 ? "荣耀叙事" : selectedPoster === 1 ? "吐槽梗图" : "复盘理性"}
              </span>
              {posterCache[selectedPoster].url && (
                <span className="ml-2 text-muted-foreground/70">(已生成，可重新生成)</span>
              )}
            </div>
            <NeonButton
              variant="accent"
              size="lg"
              onClick={() => void generateForVariant(selectedPoster)}
              disabled={posterCache[selectedPoster].loading}
            >
              {posterCache[selectedPoster].loading ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  AI 出片中…
                </>
              ) : posterCache[selectedPoster].url ? (
                <>
                  <RefreshCw className="mr-2 inline h-4 w-4" />
                  重新生成
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 inline h-4 w-4" />
                  AI 生成海报
                </>
              )}
            </NeonButton>
          </div>
        </div>

        {/* Copy tier */}
        <GlassCard glow="accent" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-sm uppercase tracking-wider">配套文案</div>
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {(["light", "deep"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`rounded px-3 py-1 text-xs font-display uppercase tracking-wider transition ${tier === t ? "bg-accent/40 text-accent" : "text-muted-foreground"}`}
                >
                  {t === "light" ? "轻量·一句话" : "深度·叙事"}
                </button>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-black/30">
            <pre className="whitespace-pre-wrap p-4 font-sans text-sm leading-relaxed">
              {copyText}
            </pre>
            {cachedCopy.loading && <LoadingOverlay message="AI 落笔中…" />}
            {!cachedCopy.loading && cachedCopy.error && (
              <div className="absolute right-2 top-2 rounded-lg bg-destructive/70 px-2 py-1 text-[10px] text-destructive-foreground">
                生成失败，已显示兜底
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <NeonButton variant="accent" onClick={doCopy}>
              <Copy className="mr-1 inline h-4 w-4" />
              复制文案
            </NeonButton>
            <NeonButton
              variant="primary"
              onClick={() => void generateCopy(tier)}
              disabled={cachedCopy.loading}
            >
              {cachedCopy.loading ? (
                <>
                  <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                  生成中
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 inline h-4 w-4" />
                  重新生成
                </>
              )}
            </NeonButton>
            <NeonButton variant="ghost">
              <Share2 className="mr-1 inline h-4 w-4" />
              一键分享
            </NeonButton>
            <NeonButton variant="ghost" onClick={() => nav({ to: "/" })}>
              回大厅
            </NeonButton>
          </div>
        </GlassCard>

        {/* Highlights & flags */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <GlassCard>
            <div className="mb-2 flex items-center gap-2 font-display text-sm uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-accent" /> 高光金句
            </div>
            <ul className="space-y-2 text-sm">
              {goldenQuotes.map((q) => (
                <li key={q.id} className="rounded-lg bg-white/5 p-2">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">
                    {formatMatchTime(q.matchSeconds)} · {EMOTION_MAP[q.emotion].label}
                  </div>
                  <div>"{q.agentResponse}"</div>
                </li>
              ))}
              {goldenQuotes.length === 0 && (
                <li className="text-muted-foreground">这场没攒下金句</li>
              )}
            </ul>
          </GlassCard>
          <GlassCard>
            <div className="mb-2 flex items-center gap-2 font-display text-sm uppercase tracking-wider">
              <Trophy className="h-4 w-4 text-accent" /> Flag 战绩
            </div>
            <ul className="space-y-2 text-sm">
              {flags.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-2"
                >
                  <span>🚩 {f.content}</span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-display uppercase ${f.status === "hit" ? "bg-accent/30 text-accent" : f.status === "miss" ? "bg-destructive/30 text-destructive" : "bg-muted text-muted-foreground"}`}
                  >
                    {f.status === "hit" ? "✅ 命中" : f.status === "miss" ? "❌ 翻车" : "⏳ 未结"}
                  </span>
                </li>
              ))}
              {flags.length === 0 && <li className="text-muted-foreground">这场没立 Flag</li>}
            </ul>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}

function PostSignal({
  icon: Icon,
  title,
  value,
  desc,
}: {
  icon: typeof BarChart3;
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-ecstasy/20 bg-ecstasy/[0.06] p-4">
      <div className="flex items-center gap-2 text-[10px] font-display uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-ecstasy" />
        {title}
      </div>
      <div className="mt-2 font-display text-2xl text-ecstasy">{value}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function AssetPicker({
  title,
  assets,
  selectedId,
  onSelect,
}: {
  title: string;
  assets: PosterAsset[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="font-display text-[11px] uppercase tracking-widest text-muted-foreground">
          {title}
        </div>
        <div className="text-[10px] text-muted-foreground">仅可选择内置素材</div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {assets.map((asset) => {
          const selected = selectedId === asset.id;
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset.id)}
              className={`group overflow-hidden rounded-lg border bg-white/[0.04] text-left transition ${
                selected
                  ? "border-accent shadow-[0_0_18px_oklch(0.78_0.18_195_/_0.24)]"
                  : "border-border hover:border-accent/60"
              }`}
              aria-pressed={selected}
              title={asset.name}
            >
              <div className="aspect-[4/5] overflow-hidden bg-black/30">
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div
                className={`truncate px-2 py-1.5 text-center text-xs ${
                  selected ? "text-accent" : "text-muted-foreground"
                }`}
              >
                {asset.name}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EmotionCurve() {
  const logs = useAppStore((s) => s.logs);
  const w = 720,
    h = 180,
    pad = 30;
  if (logs.length === 0) return <div className="text-muted-foreground">无数据</div>;
  const maxSec = Math.max(...logs.map((l) => l.matchSeconds), MATCH_DURATION_SECONDS);
  const pts = logs.map((l) => ({
    x: pad + (l.matchSeconds / maxSec) * (w - pad * 2),
    y: h - pad - ((l.intensity - 1) / 4) * (h - pad * 2),
    log: l,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[600px]">
        {/* grid */}
        {[1, 2, 3, 4, 5].map((lvl) => {
          const y = h - pad - ((lvl - 1) / 4) * (h - pad * 2);
          return (
            <g key={lvl}>
              <line
                x1={pad}
                x2={w - pad}
                y1={y}
                y2={y}
                stroke="oklch(1 0 0 / 0.06)"
                strokeDasharray="2 4"
              />
              <text
                x={4}
                y={y + 3}
                fill="oklch(0.7 0.04 280)"
                fontSize="9"
                fontFamily="JetBrains Mono"
              >
                {lvl}
              </text>
            </g>
          );
        })}
        {/* line */}
        <path d={path} fill="none" stroke="url(#grad)" strokeWidth="2.5" />
        <defs>
          <linearGradient id="grad" x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.55 0.24 295)" />
            <stop offset="1" stopColor="oklch(0.78 0.18 195)" />
          </linearGradient>
        </defs>
        {/* peak dots */}
        {pts.map(
          (p) =>
            p.log.isPeak && (
              <g key={p.log.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={EMOTION_MAP[p.log.emotion].color as string}
                  stroke="white"
                  strokeWidth="1"
                />
              </g>
            ),
        )}
        {/* x labels */}
        <text x={pad} y={h - 8} fill="oklch(0.7 0.04 280)" fontSize="9" fontFamily="JetBrains Mono">
          0'
        </text>
        <text
          x={w - pad - 10}
          y={h - 8}
          fill="oklch(0.7 0.04 280)"
          fontSize="9"
          fontFamily="JetBrains Mono"
        >
          {Math.round(maxSec / 60)}'
        </text>
      </svg>
    </div>
  );
}

function Poster({
  variant,
  team,
  opponent,
  score,
  finalResult,
  goldenQuote,
  userQuote,
  generatedUrl,
}: {
  variant: 0 | 1 | 2;
  team: string;
  opponent: string;
  score: { ours: number; theirs: number };
  finalResult: string | null;
  goldenQuote: string;
  userQuote: string;
  generatedUrl?: string;
}) {
  const styles = [
    {
      name: "荣耀叙事",
      bg: "linear-gradient(135deg, oklch(0.3 0.15 295), oklch(0.15 0.08 230))",
      accent: "var(--ecstasy)",
    },
    {
      name: "吐槽梗图",
      bg: "linear-gradient(135deg, oklch(0.25 0.18 30), oklch(0.15 0.05 285))",
      accent: "var(--anger)",
    },
    {
      name: "复盘理性",
      bg: "linear-gradient(135deg, oklch(0.18 0.05 200), oklch(0.1 0.03 270))",
      accent: "var(--accent)",
    },
  ];
  const s = styles[variant];
  // 有 AI 生成图就用 AI 图，否则降级到原渐变假图作为骨架/占位。
  if (generatedUrl) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={generatedUrl}
          alt={`${s.name} · ${team} ${score.ours}-${score.theirs}`}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-[9px] uppercase tracking-widest text-white/80">
          {s.name} · 毒奶观察室
        </div>
      </div>
    );
  }
  return (
    <div
      className="relative aspect-[4/5] overflow-hidden p-4 text-left"
      style={{ background: s.bg }}
    >
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full"
        style={{ background: s.accent, opacity: 0.25, filter: "blur(28px)" }}
      />
      <div className="relative flex h-full flex-col justify-between">
        <div>
          <div className="font-display text-[9px] uppercase tracking-widest opacity-70">
            {s.name}
          </div>
          <div className="mt-1 font-display text-2xl font-bold" style={{ color: s.accent }}>
            {team}
          </div>
          <div className="mt-1 font-mono text-3xl font-bold">
            {score.ours} : {score.theirs}
          </div>
          <div className="text-[10px] uppercase tracking-wider opacity-70">
            vs {opponent} ·{" "}
            {finalResult === "win" ? "WIN" : finalResult === "loss" ? "LOSS" : "DRAW"}
          </div>
        </div>
        <div>
          <div
            className="rounded-lg border-l-2 px-2 py-1 text-xs italic"
            style={{ borderColor: s.accent }}
          >
            "{(variant === 1 ? userQuote : goldenQuote).slice(0, 36)}"
          </div>
          <div className="mt-2 text-[9px] uppercase tracking-widest opacity-50">
            毒奶观察室 · 个人专属
          </div>
        </div>
      </div>
    </div>
  );
}
