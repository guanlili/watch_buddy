import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// 赛博风多行输入框：与 Input 配套。
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={cn(
        "w-full resize-none rounded-lg bg-white/5 px-3 py-2 text-sm outline-none transition",
        "ring-1 ring-border focus:ring-accent",
        "placeholder:text-muted-foreground/70",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    />
  );
});
