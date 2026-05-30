import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// 赛博风文本输入框：glass 背景 + 霓虹 focus ring。
// 与 src/components/ui/input.tsx 区分（那个是 shadcn 默认风格）。
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={cn(
          "w-full rounded-lg bg-white/5 px-3 py-2 text-sm outline-none transition",
          "ring-1 ring-border focus:ring-accent",
          "placeholder:text-muted-foreground/70",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      />
    );
  },
);
