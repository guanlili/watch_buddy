import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, KeyRound, Menu, UserCog } from "lucide-react";
import type { ReactNode } from "react";

import { useAppStore } from "@/lib/mock/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// 给所有页面套一层公共顶栏：品牌 + 当前页签 + 右上角菜单（编辑档案 / 运营配置台）。
// 用 pathname 判断是否在隐藏列表里——首页 / 这种全屏 hero 不上 shell。

const ROUTE_LABELS: Record<string, string> = {
  "/onboarding": "档案设置",
  "/welcome-card": "欢迎卡",
  "/chat": "AI 搭子",
  "/pre-match": "赛前阵地",
  "/match": "直播间",
  "/post-match": "赛后剧场",
  "/admin": "运营配置台",
};

const HIDDEN_ROUTES = new Set<string>(["/"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (HIDDEN_ROUTES.has(pathname)) {
    return <>{children}</>;
  }
  return (
    <>
      <ShellHeader pathname={pathname} />
      {children}
    </>
  );
}

function ShellHeader({ pathname }: { pathname: string }) {
  const hasProfile = useAppStore((s) => !!s.profile);
  const label = ROUTE_LABELS[pathname] ?? "";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-accent/20",
        "bg-background/70 backdrop-blur-md",
        "pt-[env(safe-area-inset-top)]",
      )}
    >
      {/* 底部细霓虹线 */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3 px-4">
        {/* Left: brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2 transition hover:opacity-80">
          <img src="/logo.png" alt="毒奶观察室" className="h-8 w-auto" />
        </Link>

        {/* Center: page label (breadcrumb-ish) */}
        {label && (
          <div className="hidden flex-1 items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground sm:flex">
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="text-accent/90">{label}</span>
          </div>
        )}
        {label && (
          <div className="flex flex-1 items-center justify-end pr-2 font-mono text-[10px] uppercase tracking-widest text-accent/80 sm:hidden">
            {label}
          </div>
        )}

        {/* Right: settings menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/60 bg-white/5 transition hover:border-accent/70 hover:bg-accent/10"
            aria-label="菜单"
          >
            <Menu className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            {hasProfile ? (
              <DropdownMenuItem asChild>
                <Link to="/onboarding" search={{ edit: 1 }} className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  编辑档案
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/onboarding" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  填写档案
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                运营配置台
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
