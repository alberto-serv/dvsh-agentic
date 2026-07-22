"use client";

import { ArrowUp } from "lucide-react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  transparent?: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  transparent,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  useEffect(() => {
    if (disabled) return;
    textareaRef.current?.focus();
  }, [disabled]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) onSubmit();
      }}
      className={cn(
        "px-4 py-4 sm:px-8",
        transparent
          ? "bg-transparent"
          : "border-t border-border bg-background",
      )}
    >
      <div
        className={cn(
          "mx-auto flex gap-3 border transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15",
          transparent
            ? "max-w-5xl items-center rounded-full border-[#e2d9c9] bg-white py-2 pl-7 pr-2 shadow-[0_14px_34px_-16px_rgba(20,24,29,0.28)]"
            : "max-w-3xl items-end rounded-2xl border-border bg-surface px-4 py-3 shadow-sm",
        )}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder={
            transparent
              ? "Tell us what needs cleaning…"
              : "Tell me what you need cleaned…"
          }
          className={cn(
            "flex-1 resize-none bg-transparent text-foreground outline-none disabled:opacity-60",
            transparent
              ? "py-1.5 text-[17px] placeholder:text-[#a89f8f]"
              : "py-1 text-[15px] leading-relaxed placeholder:text-muted-foreground",
          )}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40",
            transparent
              ? "h-12 w-12 bg-[#1d61c4] text-white hover:bg-[#164da3] disabled:hover:bg-[#1d61c4]"
              : "h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90 disabled:hover:bg-primary",
          )}
          aria-label="Send"
        >
          <ArrowUp className={transparent ? "h-5 w-5" : "h-4 w-4"} />
        </button>
      </div>
      <p
        className={cn(
          "mx-auto mt-3 text-center",
          transparent
            ? "max-w-5xl text-[12.5px] text-[#a89f8f]"
            : "max-w-3xl text-[11px] text-muted-foreground",
        )}
      >
        {transparent
          ? "Superheroes AI can make mistakes — confirm important details before booking."
          : "Dryer Vent Superheroes AI can make mistakes."}
      </p>
    </form>
  );
}
