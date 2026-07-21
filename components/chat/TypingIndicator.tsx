import Image from "next/image";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="relative mt-0.5 flex h-11 w-11 shrink-0 animate-pulse-soft items-center justify-center rounded-full bg-primary shadow-[0_4px_14px_-2px_rgba(21,38,68,0.4)] ring-2 ring-[#00dbe6]/30 ring-offset-2 ring-offset-background">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary" />
        <Image
          src="/dvsh-v.svg"
          alt=""
          width={32}
          height={32}
          className="relative h-6 w-6 object-contain drop-shadow-[0_0_6px_rgba(0,219,230,0.6)]"
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
