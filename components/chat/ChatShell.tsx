"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import { parseAgentMd } from "@/lib/agent";
import { loadMessages, saveMessages, clearMessages } from "@/lib/storage";
import type { AgentSlot, ChatMessage } from "@/lib/types";

function id() {
  return Math.random().toString(36).slice(2, 10);
}

export function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentMdRaw, setAgentMdRaw] = useState<string | null>(null);
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const restored = loadMessages();
    // localStorage isn't available during SSR, so hydration must happen post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restored.length > 0) setMessages(restored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveMessages(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/agent");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const text = await res.text();
        if (!cancelled) setAgentMdRaw(text);
      } catch (err) {
        if (!cancelled) {
          setAgentLoadError(
            err instanceof Error ? err.message : "unknown error",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewChat = useCallback(() => {
    clearMessages();
    setMessages([]);
    setInput("");
  }, []);

  const availability: AgentSlot[] = useMemo(() => {
    if (!agentMdRaw) return [];
    try {
      return parseAgentMd(agentMdRaw).availability;
    } catch {
      return [];
    }
  }, [agentMdRaw]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!agentMdRaw || isStreaming || !text.trim()) return;

      const userMsg: ChatMessage = {
        id: id(),
        role: "user",
        content: text.trim(),
      };
      const assistantId = id();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);
      setStreamingId(assistantId);

      try {
        const apiMessages = [...messagesRef.current, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, agentMdRaw }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || `Chat API ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: acc } : m,
            ),
          );
        }
        acc += decoder.decode();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: acc } : m,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Sorry — something went wrong (${msg}).` }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        setStreamingId(null);
      }
    },
    [agentMdRaw, isStreaming],
  );

  const inputDisabled = isStreaming || !agentMdRaw;
  // Start page uses the full light-blue backdrop; the chat view stays on the neutral background.
  const isStart = messages.length === 0 && !agentLoadError;

  return (
    <div className={`flex h-dvh flex-col ${isStart ? "bg-[#eaf1fc]" : "bg-background"}`}>
      <header
        className={`flex items-center justify-between px-6 py-4 ${
          isStart
            ? "border-b border-transparent"
            : "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        }`}
      >
        <button
          type="button"
          onClick={handleNewChat}
          disabled={isStreaming}
          aria-label="Return to home"
          className="-m-1 flex items-center gap-3 rounded-lg p-1 transition hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Image
            src="/dvsh-logo.webp"
            alt="Dryer Vent Superheroes"
            width={52}
            height={44}
            className="h-11 w-auto"
            priority
          />
          <div className="leading-tight text-left">
            <p className="font-heading text-base font-semibold tracking-tight text-foreground">
              Dryer Vent Superheroes
            </p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Booking Assistant · Houston, TX
            </p>
          </div>
        </button>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <a
            href="tel:+16156322980"
            className="hidden hover:text-foreground sm:inline"
          >
            (615) 632-2980
          </a>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleNewChat}
              disabled={isStreaming}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:bg-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {agentLoadError ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <p className="text-sm text-muted-foreground">
                Couldn&apos;t load our pricing data ({agentLoadError}).
                Reload the page to retry.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              onSuggestion={(s) => sendMessage(s)}
              disabled={inputDisabled}
            />
          ) : (
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              streamingMessageId={streamingId}
              onChoice={(label) => sendMessage(label)}
              availability={availability}
            />
          )}
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => sendMessage(input)}
          disabled={inputDisabled}
          transparent={isStart}
        />
      </main>
    </div>
  );
}
