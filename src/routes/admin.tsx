import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Save, Play, Copy } from "lucide-react";
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

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "毒奶观察室 · Prompt Admin" }] }),
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
  // 这样 admin 在 frame 上点试运行也能看到完整拼装后的 prompt。
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

function AdminPage() {
  const [selectedId, setSelectedId] = useState<PromptId>("buddy.persona");
  // 当前编辑器内的文本（可能未保存）
  const [draft, setDraft] = useState<string>(() => getPromptTemplate("buddy.persona"));
  // 触发版本号，用来让 sidebar / 编辑器在 save/reset 后重新读 storage
  const [version, setVersion] = useState(0);

  const meta = PROMPT_META[selectedId];
  // 直接每渲染读一次 localStorage —— 极轻量。version 是 save/reset 后的刷新触发器。
  void version;
  const stored = getPromptTemplate(selectedId);
  const isDefault = !isOverridden(selectedId);
  const dirty = draft !== stored;

  // 切换选中 prompt 时，把 draft 重置为该 prompt 当前生效值。
  useEffect(() => {
    setDraft(getPromptTemplate(selectedId));
  }, [selectedId, version]);

  // 变量表单 state（每个 prompt 单独一份示例值）
  const [vars, setVars] = useState<Record<string, string>>({});
  useEffect(() => {
    const sample = SAMPLE_VARS[selectedId] ?? {};
    const next: Record<string, string> = {};
    for (const k of meta.knownVars) {
      next[k] = sample[k] !== undefined ? String(sample[k]) : "";
    }
    setVars(next);
  }, [selectedId, meta.knownVars]);

  // 试运行
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
      // 跟默认一样就别落 storage，留干净
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

  // 按 group 分组渲染侧边栏
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
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex items-baseline justify-between">
          <h1 className="font-display text-2xl">
            Prompt Admin
            <span className="ml-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              localStorage override · 仅本浏览器生效
            </span>
          </h1>
          <a
            href="/"
            className="text-xs font-display uppercase tracking-wider text-muted-foreground hover:text-accent"
          >
            ← 回主站
          </a>
        </header>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-border bg-white/[0.02] p-3">
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
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition ${
                            active
                              ? "bg-accent/30 text-accent"
                              : "text-foreground/80 hover:bg-white/5"
                          }`}
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
            {/* hidden version probe to force re-render when localStorage changes */}
            <span className="hidden" data-version={version} />
          </aside>

          {/* Editor */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <div className="font-display text-sm">{meta.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
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

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                rows={Math.min(28, Math.max(10, draft.split("\n").length + 1))}
                className="w-full resize-y rounded-lg border border-border bg-black/30 p-3 font-mono text-xs leading-relaxed outline-none focus:border-accent"
              />

              {meta.knownVars.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    可用变量 (substitute 会替换 {`{{name}}`})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.knownVars.map((v) => (
                      <code
                        key={v}
                        className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-accent"
                      >
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-display uppercase tracking-wider text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  保存
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isDefault && !dirty}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs font-display uppercase tracking-wider transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  重置为默认
                </button>
                <button
                  type="button"
                  onClick={handleCopyAssembled}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/5 px-3 py-1.5 text-xs font-display uppercase tracking-wider transition hover:bg-white/10"
                >
                  <Copy className="h-3.5 w-3.5" />
                  复制完整 prompt
                </button>
              </div>
            </div>

            {/* Vars + Run */}
            <div className="rounded-2xl border border-border bg-white/[0.02] p-4">
              <div className="mb-3 font-display text-sm">试运行</div>
              {meta.knownVars.length === 0 ? (
                <div className="mb-3 text-xs text-muted-foreground">
                  该 prompt 没有变量，直接试运行。
                </div>
              ) : (
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  {meta.knownVars.map((k) => (
                    <label key={k} className="flex flex-col gap-1">
                      <span className="font-mono text-[11px] text-muted-foreground">{k}</span>
                      <input
                        value={vars[k] ?? ""}
                        onChange={(e) => setVars((cur) => ({ ...cur, [k]: e.target.value }))}
                        className="rounded-lg bg-white/5 px-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-accent"
                      />
                    </label>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={handleRun}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-display uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    运行中
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    用当前草稿运行
                  </>
                )}
              </button>

              {output && (
                <div className="mt-4">
                  <div className="mb-2 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                    输出
                  </div>
                  {output.kind === "text" ? (
                    <pre className="whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-sm leading-relaxed">
                      {output.value}
                    </pre>
                  ) : (
                    <div className="rounded-lg bg-black/40 p-3">
                      <img
                        src={output.value}
                        alt="generated"
                        className="max-h-[600px] w-auto rounded"
                      />
                      <a
                        href={output.value}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-[11px] text-accent underline"
                      >
                        在新标签打开原图
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
