"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { SelectionChip } from "./SelectionChip";
import { TypingIndicator } from "./TypingIndicator";
import { SELECTION_PREFIX, parseSelectionMessage } from "@/lib/ui-moments";
import type { AgentSlot, ChatMessage, CheckoutOrder, Role } from "@/lib/types";

// User messages that came from a UI-moment interaction rather than being typed.
// They stay in conversation history (so the agent has the data) but don't render
// as an ordinary bubble: the contact form is hidden entirely, and structured
// [selection] messages render as a compact chip instead.
function isHiddenSubmission(role: Role, content: string): boolean {
  if (role !== "user") return false;
  return (
    content.startsWith("Here are my details:") ||
    content.startsWith(SELECTION_PREFIX)
  );
}

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingMessageId: string | null;
  onChoice: (label: string) => void;
  onSelection: (update: Partial<CheckoutOrder["services"]>, humanLabel: string) => void;
  onCustomerSelection: (
    update: Partial<CheckoutOrder["customer"]>,
    humanLabel: string,
  ) => void;
  onContactData: (update: Partial<CheckoutOrder["customer"]>) => void;
  onOrderChange: (update: Partial<CheckoutOrder["services"]>) => void;
  order: CheckoutOrder["services"];
  customer: CheckoutOrder["customer"];
  availability: AgentSlot[];
}

export function MessageList({
  messages,
  isStreaming,
  streamingMessageId,
  onChoice,
  onSelection,
  onCustomerSelection,
  onContactData,
  onOrderChange,
  order,
  customer,
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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-8">
      {messages.map((m) => {
        if (isHiddenSubmission(m.role, m.content)) {
          const selection = parseSelectionMessage(m.content);
          if (selection) {
            return <SelectionChip key={m.id} label={selection.humanLabel} />;
          }
          // Contact-form submission — stays in history but renders nothing.
          return null;
        }
        return (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            onChoice={m.role === "assistant" ? onChoice : undefined}
            onSelection={m.role === "assistant" ? onSelection : undefined}
            onCustomerSelection={
              m.role === "assistant" ? onCustomerSelection : undefined
            }
            onContactData={m.role === "assistant" ? onContactData : undefined}
            onOrderChange={m.role === "assistant" ? onOrderChange : undefined}
            order={order}
            customer={customer}
            isStreaming={isStreaming && m.id === streamingMessageId}
            availability={availability}
          />
        );
      })}
      {showTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
