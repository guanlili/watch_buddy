import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  Copy,
  FileText,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Swords,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  PROMPT_DEFAULTS,
  PROMPT_META,
  getPromptTemplate,
  setPromptOverride,
  resetPromptOverride,
  isOverridden,
  substitute,
  type PromptId,
} from "@/lib/prompts/registry";
import { chatCompletion } from "@/lib/api/chat.functions";
import { generatePoster } from "@/lib/api/image.functions";
import { GlassCard } from "@/components/GlassCard";
import { NeonButton } from "@/components/NeonButton";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { LoadingOverlay } from "@/components/StatusOverlay";
import { cn } from "@/lib/utils";
import {
  DEFAULT_OPS_CONFIG,
  emotionLabelText,
  getOpsConfig,
  resetOpsConfig,
  setOpsConfig,
  type OpsConfig,
  type OpsPushTemplate,
  type OpsRecommendedMatchConfig,
} from "@/lib/ops-config";
import type { EmotionLabel, MatchEvent } from "@/lib/mock/types";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "毒奶观察室 · 运营配置台" }] }),
  component: AdminPage,
});

const ALL_IDS = Object.keys(PROMPT_DEFAULTS) as PromptId[];

// 为每个 prompt 提供一组示例变量值；按 knownVars 自动出表单。
const SAMPLE_VARS: Partial<Record<PromptId, Record<string, string | number>>> = {
  "poster.variant.0": {
    focus:
      "画面 C 位人物：电竞选手「JackeyLove」操作着游戏角色「卡莎」，请清晰画出该角色的标志性外观、武器与技能特效。",
    moodByResult: "高耸闪亮、金光爆裂",
    team: "TES",
    homeScore: 2,
    awayScore: 1,
    opponent: "JDG",
    slogan: "今晚我们是冠军心态",
    commonInfo: "主队：TES，对手：JDG，比分：2 : 1，结果：胜利 VICTORY",
  },
  "poster.variant.1": {
    focus: "画面 C 位：游戏角色「鲁班七号」的萌系外观。",
    moodByResult: "得意大笑、眯眼坏笑",
    team: "AG",
    titleByResult: "赢麻了",
    homeScore: 4,
    awayScore: 1,
    opponent: "狼队",
    slogan: "对面破防了",
    commonInfo: "主队：AG，对手：狼队，比分：4 : 1，结果：胜利 VICTORY",
  },
  "poster.variant.2": {
    focus: "",
    team: "EDG",
    opponent: "FPX",
    homeScore: 13,
    awayScore: 7,
    resultLabel: "胜利 VICTORY",
    slogan: "数据不会骗人",
    commonInfo: "主队：EDG，对手：FPX，比分：13 : 7，结果：胜利 VICTORY",
  },
  // frame 的"组合预览"用：三个 fragment 槽位预填默认（朋友圈 + 死忠粉 + 朋友圈要求）
  "post-match-copy.frame": {
    team_name: "TES",
    fan_type: "死忠粉型",
    emotion_intensity: 8,
    competition_name: "英雄联盟职业联赛 (LPL)",
    home_team: "TES",
    away_team: "JDG",
    home_score: 2,
    away_score: 1,
    result: "win",
    key_event: "37 分钟绝境偷家",
    peak_minute: 37,
    pre_match_expectation: "稳住后期，靠 JackeyLove carry",
    user_quote: "这波偷家真的封神",
    emotion_type: "狂喜",
    output_scenario: "朋友圈",
    scenario_locator: PROMPT_DEFAULTS["post-match-copy.scenario.friend_circle"],
    fan_style: PROMPT_DEFAULTS["post-match-copy.fan-style.diehard"],
    generation_requirement: PROMPT_DEFAULTS["post-match-copy.requirement.friend_circle"],
  },
};

type AdminTab = "ops" | "prompts";
const EMOTION_OPTIONS: EmotionLabel[] = ["ecstasy", "tension", "anger", "devastated", "calm"];

function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("ops");

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-accent">
              OPS · ADMIN
            </div>
            <h1 className="mt-1 font-display text-2xl glow-text-accent sm:text-3xl">运营配置台</h1>
            <div className="mt-1 font-mono text-[11px] text-muted-foreground">
              赛事、文字直播、推荐位、推送文案和 Prompt 调试
            </div>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-1 font-display text-xs uppercase tracking-wider text-muted-foreground hover:text-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            回主站
          </a>
        </header>

        <div className="mb-5 flex flex-wrap gap-2">
          <AdminTabButton active={tab === "ops"} onClick={() => setTab("ops")}>
            <Settings className="h-4 w-4" />
            运营配置
          </AdminTabButton>
          <AdminTabButton active={tab === "prompts"} onClick={() => setTab("prompts")}>
            <FileText className="h-4 w-4" />
            Prompt 调试
          </AdminTabButton>
        </div>

        {tab === "ops" ? <OpsAdminPanel /> : <PromptAdminPanel />}
      </div>
    </main>
  );
}

function AdminTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 font-display text-xs uppercase tracking-wider transition",
        active
          ? "bg-accent/25 text-accent neon-border-accent"
          : "border border-border bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function OpsAdminPanel() {
  const [config, setConfigDraft] = useState<OpsConfig>(() => getOpsConfig());
  const [jsonDraft, setJsonDraft] = useState(() => JSON.stringify(getOpsConfig(), null, 2));
  const primaryMatch = config.matches[0];

  function updateConfig(updater: (current: OpsConfig) => OpsConfig) {
    setConfigDraft((current) => {
      const next = updater(current);
      setJsonDraft(JSON.stringify(next, null, 2));
      return next;
    });
  }

  function saveConfig() {
    setOpsConfig(config);
    toast.success("运营配置已保存到本地");
  }

  function resetConfig() {
    resetOpsConfig();
    setConfigDraft(DEFAULT_OPS_CONFIG);
    setJsonDraft(JSON.stringify(DEFAULT_OPS_CONFIG, null, 2));
    toast.info("已恢复默认运营配置");
  }

  function importJson() {
    try {
      const parsed = JSON.parse(jsonDraft) as OpsConfig;
      if (parsed.version !== 1 || !Array.isArray(parsed.matches)) {
        throw new Error("JSON 结构不符合 OpsConfig");
      }
      setConfigDraft(parsed);
      toast.success("JSON 已导入草稿，记得保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "JSON 解析失败");
    }
  }

  function copyJson() {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast.success("已复制运营配置 JSON");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <GlassCard glow="accent">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-display text-base">
                <Swords className="h-4 w-4 text-accent" />
                赛事基础信息
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                控制运营当前主推赛事，后续可扩展成多场赛事列表。
              </p>
            </div>
            <div className="flex gap-2">
              <NeonButton variant="accent" size="sm" onClick={saveConfig}>
                <Save className="mr-1 inline h-3.5 w-3.5" />
                保存
              </NeonButton>
              <NeonButton variant="ghost" size="sm" onClick={resetConfig}>
                <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
                恢复默认
              </NeonButton>
            </div>
          </div>

          {primaryMatch && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <LabeledInput
                label="赛事名称"
                value={primaryMatch.tournamentName}
                onChange={(value) =>
                  updateConfig((current) => ({
                    ...current,
                    matches: current.matches.map((match, index) =>
                      index === 0 ? { ...match, tournamentName: value } : match,
                    ),
                  }))
                }
              />
              <LabeledInput
                label="主队"
                value={primaryMatch.homeTeamFull}
                onChange={(value) =>
                  updateConfig((current) => ({
                    ...current,
                    matches: current.matches.map((match, index) =>
                      index === 0 ? { ...match, homeTeamFull: value, homeTeam: value } : match,
                    ),
                  }))
                }
              />
              <LabeledInput
                label="客队"
                value={primaryMatch.awayTeamFull}
                onChange={(value) =>
                  updateConfig((current) => ({
                    ...current,
                    matches: current.matches.map((match, index) =>
                      index === 0 ? { ...match, awayTeamFull: value, awayTeam: value } : match,
                    ),
                  }))
                }
              />
              <LabeledInput
                label="开赛展示"
                value={primaryMatch.startTimeText}
                onChange={(value) =>
                  updateConfig((current) => ({
                    ...current,
                    matches: current.matches.map((match, index) =>
                      index === 0 ? { ...match, startTimeText: value } : match,
                    ),
                  }))
                }
              />
            </div>
          )}
        </GlassCard>

        <GlassCard glow="primary">
          <SectionTitle icon={CalendarClock} title="推荐赛事配置" />
          <div className="mt-4 space-y-3">
            {config.recommendations.map((match, index) => (
              <RecommendationEditor
                key={match.id}
                match={match}
                onChange={(patch) =>
                  updateConfig((current) => ({
                    ...current,
                    recommendations: current.recommendations.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, ...patch } : item,
                    ),
                  }))
                }
                onRemove={() =>
                  updateConfig((current) => ({
                    ...current,
                    recommendations: current.recommendations.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  }))
                }
              />
            ))}
          </div>
          <NeonButton
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() =>
              updateConfig((current) => ({
                ...current,
                recommendations: [
                  ...current.recommendations,
                  {
                    id: `ops-match-${Date.now()}`,
                    enabled: true,
                    pinned: false,
                    tournamentId: "custom",
                    tournamentName: "自定义赛事",
                    team1: "主队",
                    team2: "客队",
                    startOffsetMinutes: 60,
                    isLive: false,
                    weight: 50,
                  },
                ],
              }))
            }
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            新增推荐
          </NeonButton>
        </GlassCard>

        <GlassCard glow="ember">
          <SectionTitle icon={FileText} title="赛事文字直播事件流" />
          <div className="mt-4 space-y-3">
            {primaryMatch?.timeline.map((event, index) => (
              <TimelineEventEditor
                key={`${event.seconds}-${index}`}
                event={event}
                index={index}
                onChange={(nextEvent) =>
                  updateConfig((current) => ({
                    ...current,
                    matches: current.matches.map((match, matchIndex) =>
                      matchIndex === 0
                        ? {
                            ...match,
                            timeline: match.timeline.map((item, itemIndex) =>
                              itemIndex === index ? nextEvent : item,
                            ),
                          }
                        : match,
                    ),
                  }))
                }
                onRemove={() =>
                  updateConfig((current) => ({
                    ...current,
                    matches: current.matches.map((match, matchIndex) =>
                      matchIndex === 0
                        ? {
                            ...match,
                            timeline: match.timeline.filter((_, itemIndex) => itemIndex !== index),
                          }
                        : match,
                    ),
                  }))
                }
              />
            ))}
          </div>
          <NeonButton
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() =>
              updateConfig((current) => ({
                ...current,
                matches: current.matches.map((match, matchIndex) =>
                  matchIndex === 0
                    ? {
                        ...match,
                        timeline: [
                          ...match.timeline,
                          {
                            seconds: 60,
                            type: "objective",
                            text: "新增事件 · 这里填写文字直播内容",
                            agentReaction: {
                              text: "这里填写 AI 搭子的实时反应",
                              emotion: "tension",
                              intensity: 3,
                            },
                          },
                        ],
                      }
                    : match,
                ),
              }))
            }
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            新增事件
          </NeonButton>
        </GlassCard>
      </section>

      <aside className="space-y-4">
        <GlassCard strong glow="primary">
          <SectionTitle icon={Bell} title="推送文案配置" />
          <div className="mt-4 space-y-3">
            {config.pushTemplates.map((template, index) => (
              <PushTemplateEditor
                key={template.id}
                template={template}
                onChange={(patch) =>
                  updateConfig((current) => ({
                    ...current,
                    pushTemplates: current.pushTemplates.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, ...patch } : item,
                    ),
                  }))
                }
              />
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-base">JSON 导入 / 导出</div>
            <button
              type="button"
              onClick={copyJson}
              title="复制 JSON"
              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-white/5 hover:bg-white/10"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <Textarea
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
            rows={14}
            spellCheck={false}
            className="bg-black/30 font-mono text-[11px]"
          />
          <NeonButton variant="ghost" size="sm" className="mt-3 w-full" onClick={importJson}>
            导入为草稿
          </NeonButton>
        </GlassCard>
      </aside>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 font-display text-base">
      <Icon className="h-4 w-4 text-accent" />
      {title}
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <Input value={value} type={type} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function RecommendationEditor({
  match,
  onChange,
  onRemove,
}: {
  match: OpsRecommendedMatchConfig;
  onChange: (patch: Partial<OpsRecommendedMatchConfig>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white/[0.03] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-display text-sm">
          {match.team1} vs {match.team2}
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="删除推荐"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LabeledInput
          label="赛事"
          value={match.tournamentName}
          onChange={(value) => onChange({ tournamentName: value })}
        />
        <LabeledInput
          label="主队"
          value={match.team1}
          onChange={(value) => onChange({ team1: value })}
        />
        <LabeledInput
          label="客队"
          value={match.team2}
          onChange={(value) => onChange({ team2: value })}
        />
        <LabeledInput
          label="开赛偏移分钟"
          value={match.startOffsetMinutes}
          type="number"
          onChange={(value) => onChange({ startOffsetMinutes: Number(value) })}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <ToggleLabel
          label="启用"
          checked={match.enabled}
          onChange={(checked) => onChange({ enabled: checked })}
        />
        <ToggleLabel
          label="直播中"
          checked={match.isLive}
          onChange={(checked) => onChange({ isLive: checked })}
        />
        <ToggleLabel
          label="置顶"
          checked={match.pinned}
          onChange={(checked) => onChange({ pinned: checked })}
        />
      </div>
    </div>
  );
}

function TimelineEventEditor({
  event,
  index,
  onChange,
  onRemove,
}: {
  event: MatchEvent;
  index: number;
  onChange: (event: MatchEvent) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white/[0.03] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-display text-sm">
          #{index + 1} · {Math.floor(event.seconds / 60)}:
          {String(event.seconds % 60).padStart(2, "0")}
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="删除事件"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-[120px_160px_1fr]">
        <LabeledInput
          label="秒数"
          value={event.seconds}
          type="number"
          onChange={(value) => onChange({ ...event, seconds: Number(value) })}
        />
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] text-muted-foreground">事件类型</span>
          <select
            value={event.type}
            onChange={(changeEvent) =>
              onChange({ ...event, type: changeEvent.target.value as MatchEvent["type"] })
            }
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            {["kickoff", "team_kill", "objective", "ace", "concede", "comeback", "endgame"].map(
              (type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] text-muted-foreground">文字直播</span>
          <Textarea
            value={event.text}
            onChange={(changeEvent) => onChange({ ...event, text: changeEvent.target.value })}
            rows={2}
            className="bg-black/20 text-sm"
          />
        </label>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_160px_120px]">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] text-muted-foreground">AI 反应</span>
          <Textarea
            value={event.agentReaction.text}
            onChange={(changeEvent) =>
              onChange({
                ...event,
                agentReaction: { ...event.agentReaction, text: changeEvent.target.value },
              })
            }
            rows={2}
            className="bg-black/20 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] text-muted-foreground">情绪</span>
          <select
            value={event.agentReaction.emotion}
            onChange={(changeEvent) =>
              onChange({
                ...event,
                agentReaction: {
                  ...event.agentReaction,
                  emotion: changeEvent.target.value as EmotionLabel,
                },
              })
            }
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            {EMOTION_OPTIONS.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotionLabelText(emotion)}
              </option>
            ))}
          </select>
        </label>
        <LabeledInput
          label="强度 1-5"
          value={event.agentReaction.intensity}
          type="number"
          onChange={(value) =>
            onChange({
              ...event,
              agentReaction: {
                ...event.agentReaction,
                intensity: Math.min(5, Math.max(1, Number(value))) as 1 | 2 | 3 | 4 | 5,
              },
            })
          }
        />
      </div>
    </div>
  );
}

function PushTemplateEditor({
  template,
  onChange,
}: {
  template: OpsPushTemplate;
  onChange: (patch: Partial<OpsPushTemplate>) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white/[0.03] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="font-display text-sm">{template.label}</div>
        <ToggleLabel
          label="启用"
          checked={template.enabled}
          onChange={(checked) => onChange({ enabled: checked })}
        />
      </div>
      <div className="space-y-3">
        <LabeledInput
          label="标题"
          value={template.title}
          onChange={(value) => onChange({ title: value })}
        />
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] text-muted-foreground">正文</span>
          <Textarea
            value={template.body}
            onChange={(event) => onChange({ body: event.target.value })}
            rows={3}
            className="bg-black/20 text-sm"
          />
        </label>
        <LabeledInput
          label="按钮"
          value={template.cta}
          onChange={(value) => onChange({ cta: value })}
        />
      </div>
    </div>
  );
}

function ToggleLabel({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-current"
      />
      {label}
    </label>
  );
}

function PromptAdminPanel() {
  const [selectedId, setSelectedId] = useState<PromptId>("buddy.persona");
  const [draft, setDraft] = useState<string>(() => getPromptTemplate("buddy.persona"));
  // version 是 save / reset 后的刷新触发器：strict 一点的 React 不会自动重读 localStorage。
  const [version, setVersion] = useState(0);

  const meta = PROMPT_META[selectedId];
  void version;
  const stored = getPromptTemplate(selectedId);
  const isDefault = !isOverridden(selectedId);
  const dirty = draft !== stored;

  useEffect(() => {
    setDraft(getPromptTemplate(selectedId));
  }, [selectedId, version]);

  const [vars, setVars] = useState<Record<string, string>>({});
  useEffect(() => {
    const sample = SAMPLE_VARS[selectedId] ?? {};
    const next: Record<string, string> = {};
    for (const k of meta.knownVars) {
      next[k] = sample[k] !== undefined ? String(sample[k]) : "";
    }
    setVars(next);
  }, [selectedId, meta.knownVars]);

  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ kind: "text" | "image"; value: string } | null>(null);

  async function handleRun() {
    setRunning(true);
    setOutput(null);
    try {
      const filled = substitute(draft, vars);
      if (meta.runVia === "image") {
        const { url } = await generatePoster({ data: { prompt: filled } });
        setOutput({ kind: "image", value: url });
      } else {
        const { reply } = await chatCompletion({
          data: {
            messages: [
              { role: "system", content: filled },
              { role: "user", content: "请按上面要求直接生成结果，不要任何前缀说明。" },
            ],
            temperature: 0.85,
          },
        });
        setOutput({ kind: "text", value: reply });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`试运行失败：${msg}`);
    } finally {
      setRunning(false);
    }
  }

  function handleSave() {
    if (draft === PROMPT_DEFAULTS[selectedId]) {
      resetPromptOverride(selectedId);
      toast.success("已保存（与默认一致，未写入 override）");
    } else {
      setPromptOverride(selectedId, draft);
      toast.success("已保存到本地，对该浏览器生效");
    }
    setVersion((v) => v + 1);
  }

  function handleReset() {
    resetPromptOverride(selectedId);
    setDraft(PROMPT_DEFAULTS[selectedId]);
    setVersion((v) => v + 1);
    toast.info("已重置为默认");
  }

  function handleCopyAssembled() {
    const filled = substitute(draft, vars);
    navigator.clipboard.writeText(filled).then(() => toast.success("已复制完整 prompt"));
  }

  const groups = useMemo(() => {
    const map = new Map<string, PromptId[]>();
    for (const id of ALL_IDS) {
      const g = PROMPT_META[id].group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(id);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <GlassCard className="!p-3 lg:sticky lg:top-4 lg:h-fit">
        <div className="space-y-4">
          {groups.map(([group, ids]) => (
            <div key={group}>
              <div className="mb-2 px-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                {group}
              </div>
              <div className="space-y-0.5">
                {ids.map((id) => {
                  const overridden = isOverridden(id);
                  const active = id === selectedId;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition",
                        active
                          ? "bg-accent/25 text-accent neon-border-accent"
                          : "text-foreground/80 hover:bg-white/5",
                      )}
                    >
                      <span className="truncate">{PROMPT_META[id].label}</span>
                      {overridden && (
                        <span className="ml-2 shrink-0 rounded bg-primary/30 px-1.5 py-px text-[9px] font-mono uppercase tracking-wider text-primary">
                          改
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <span className="hidden" data-version={version} />
      </GlassCard>

      {/* Editor + Run */}
      <section className="space-y-4">
        {/* Editor */}
        <GlassCard glow="accent">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display text-base">{meta.label}</div>
              <div className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">
                id: {meta.id} · 运行端: {meta.runVia === "image" ? "Seedream 生图" : "聊天 LLM"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dirty && (
                <span className="rounded bg-amber-500/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-amber-300">
                  未保存
                </span>
              )}
              {!isDefault && !dirty && (
                <span className="rounded bg-primary/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary">
                  已 override
                </span>
              )}
            </div>
          </div>

          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            rows={Math.min(28, Math.max(10, draft.split("\n").length + 1))}
            className="resize-y bg-black/30 font-mono text-xs leading-relaxed"
          />

          {meta.knownVars.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                可用变量（substitute 会替换 {`{{name}}`} 或 {`{name}`}）
              </div>
              <div className="flex flex-wrap gap-1.5">
                {meta.knownVars.map((v) => (
                  <code
                    key={v}
                    className="rounded bg-accent/15 px-2 py-0.5 text-[11px] text-accent"
                  >
                    {`{${v}}`}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <NeonButton variant="accent" size="sm" onClick={handleSave} disabled={!dirty}>
              <Save className="mr-1 inline h-3.5 w-3.5" />
              保存
            </NeonButton>
            <NeonButton
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isDefault && !dirty}
            >
              <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
              重置默认
            </NeonButton>
            <NeonButton variant="ghost" size="sm" onClick={handleCopyAssembled}>
              <Copy className="mr-1 inline h-3.5 w-3.5" />
              复制完整 prompt
            </NeonButton>
          </div>
        </GlassCard>

        {/* Run */}
        <GlassCard glow="primary">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-base">试运行</div>
            {meta.runVia === "image" && (
              <div className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary">
                会生成真图 · 计费
              </div>
            )}
          </div>

          {meta.knownVars.length === 0 ? (
            <div className="mb-3 text-xs text-muted-foreground">
              该 prompt 没有变量，直接试运行即可。
            </div>
          ) : (
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              {meta.knownVars.map((k) => (
                <label key={k} className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] text-muted-foreground">{k}</span>
                  <Input
                    value={vars[k] ?? ""}
                    onChange={(e) => setVars((cur) => ({ ...cur, [k]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          )}

          <NeonButton variant="primary" size="sm" onClick={handleRun} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />
                运行中
              </>
            ) : (
              <>
                <Play className="mr-1 inline h-3.5 w-3.5" />
                用当前草稿运行
              </>
            )}
          </NeonButton>

          {(running || output) && (
            <div className="relative mt-4">
              <div className="mb-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                输出
              </div>
              <div className="relative min-h-[120px] overflow-hidden rounded-lg bg-black/40 p-3">
                {output?.kind === "text" && (
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">{output.value}</pre>
                )}
                {output?.kind === "image" && (
                  <div className="space-y-2">
                    <img
                      src={output.value}
                      alt="generated"
                      className="max-h-[600px] w-auto rounded"
                    />
                    <a
                      href={output.value}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-[11px] text-accent underline"
                    >
                      在新标签打开原图
                    </a>
                  </div>
                )}
                {running && <LoadingOverlay message="呼叫模型中…" />}
              </div>
            </div>
          )}
        </GlassCard>
      </section>
    </div>
  );
}
