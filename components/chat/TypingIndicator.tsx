import Image from "next/image";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="relative mt-0.5 h-11 w-11 shrink-0 animate-pulse-soft overflow-hidden rounded-full bg-white shadow-[0_4px_14px_-2px_rgba(21,38,68,0.35)] ring-2 ring-primary/25 ring-offset-2 ring-offset-background">
        <Image
          src="/dvsh-avatar.png"
          alt=""
          fill
          sizes="44px"
          className="object-cover"
        />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-surface px-4 py-3.5 ring-1 ring-border/70">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}
