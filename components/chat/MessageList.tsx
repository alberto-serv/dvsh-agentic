"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { AgentSlot, ChatMessage, Role } from "@/lib/types";

function isHiddenSubmission(role: Role, content: string): boolean {
  if (role !== "user") return false;
  return content.startsWith("Here are my details:");
}

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  onChoice: (label: string) => void;
  availability: AgentSlot[];
}

export function MessageList({
  messages,
  isStreaming,
  streamingMessageId,
  onChoice,
  availability,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  const lastMessage = messages[messages.length - 1];
  const showTyping =
    isStreaming &&
    (lastMessage?.role !== "assistant" || lastMessage.content.length === 0);

  // Submissions that come from a UI moment (the contact form) stay in
  // conversation history so the agent has the data, but they don't render
  // as a bubble — the form itself was the interaction.
  const visibleMessages = messages.filter(
    (m) => !isHiddenSubmission(m.role, m.content),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-8">
      {visibleMessages.map((m) => (
        <MessageBubble
          key={m.id}
          role={m.role}
          content={m.content}
          onChoice={m.role === "assistant" ? onChoice : undefined}
          isStreaming={isStreaming && m.id === streamingMessageId}
          availability={availability}
        />
      ))}
      {showTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
