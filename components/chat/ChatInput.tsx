"use client";

import { ArrowUp } from "lucide-react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: Props) {
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
      className="border-t border-border bg-background px-4 py-4 sm:px-8"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Tell me what you need cleaned…"
          className="flex-1 resize-none bg-transparent py-1 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primary",
          )}
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
        Dryer Vent Superheroes AI can make mistakes.
      </p>
    </form>
  );
}
