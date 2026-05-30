import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/AppShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong max-w-md rounded-3xl p-10 text-center">
        <h1 className="title-stroke text-7xl">404</h1>
        <h2 className="mt-4 font-display text-xl">这页比赛取消了</h2>
        <p className="mt-2 text-sm text-muted-foreground">不在咱们直播列表里，回大厅再选一场吧。</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-display text-sm uppercase tracking-wider neon-border-primary"
        >
          回大厅
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong max-w-md rounded-3xl p-10 text-center">
        <h1 className="font-display text-xl">这页崩了</h1>
        <p className="mt-2 text-sm text-muted-foreground">服务器掉线，重试一下。</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-primary px-5 py-2.5 font-display text-sm uppercase tracking-wider neon-border-primary"
          >
            再试
          </button>
          <a
            href="/"
            className="rounded-xl border border-border px-5 py-2.5 font-display text-sm uppercase tracking-wider"
          >
            回大厅
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "毒奶观察室 · AI 电竞赛事搭子" },
      { name: "description", content: "孤单观赛？让 AI 搭子陪你赛前预测、赛中开喷、赛后整活。" },
      { name: "author", content: "毒奶观察室" },
      { property: "og:title", content: "毒奶观察室 · AI 电竞赛事搭子" },
      {
        property: "og:description",
        content: "孤单观赛？让 AI 搭子陪你赛前预测、赛中开喷、赛后整活。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "毒奶观察室 · AI 电竞赛事搭子" },
      {
        name: "twitter:description",
        content: "孤单观赛？让 AI 搭子陪你赛前预测、赛中开喷、赛后整活。",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/58ff67b4-c6d2-46ad-a57d-efc7364e04eb/id-preview-ecfee8f3--2c37f9d7-9efc-453f-90d3-f424cbb0ff80.lovable.app-1780141719568.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/58ff67b4-c6d2-46ad-a57d-efc7364e04eb/id-preview-ecfee8f3--2c37f9d7-9efc-453f-90d3-f424cbb0ff80.lovable.app-1780141719568.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Rajdhani:wght@600;700&family=JetBrains+Mono:wght@500;700&family=Noto+Sans+SC:wght@400;500;700;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ParticleBackground />
      <AppShell>
        <AnimatedOutlet />
      </AppShell>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

// 路由级页面过渡：用 pathname 做 key，路由换时上一页 fade-out、下一页 fade-in。
function AnimatedOutlet() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
