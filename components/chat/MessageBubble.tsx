import Image from "next/image";
import {
  parseUIMoments,
  hasOpenUIMoment,
  textBeforeOpenMoment,
} from "@/lib/ui-moments";
import { QuoteSummary } from "@/components/ui-moments/QuoteSummary";
import { SlotPicker } from "@/components/ui-moments/SlotPicker";
import { BookingHandoff } from "@/components/ui-moments/BookingHandoff";
import { TierPicker } from "@/components/ui-moments/TierPicker";
import { DatePicker } from "@/components/ui-moments/DatePicker";
import { ContactForm } from "@/components/ui-moments/ContactForm";
import { RecurrencePicker } from "@/components/ui-moments/RecurrencePicker";
import type { AgentSlot, UIMoment } from "@/lib/types";

interface Props {
  role: "user" | "assistant";
  content: string;
  onChoice?: (label: string) => void;
  isStreaming?: boolean;
  availability?: AgentSlot[];
}

export function MessageBubble({
  role,
  content,
  onChoice,
  isStreaming,
  availability,
}: Props) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  const isOpenMoment = hasOpenUIMoment(content);
  const { text, uiMoments } = isOpenMoment
    ? { text: textBeforeOpenMoment(content), uiMoments: [] as UIMoment[] }
    : parseUIMoments(content);

  const hasText = text.length > 0;
  const choiceHandler = onChoice ?? (() => {});

  return (
    <div className="flex items-start gap-3">
      <Avatar />
      <div className="flex max-w-[88%] flex-col gap-2.5">
        {hasText && (
          <div className="rounded-2xl rounded-bl-sm bg-surface px-4 py-3 text-[15px] leading-relaxed text-foreground ring-1 ring-border/70">
            <p className="whitespace-pre-wrap">{text}</p>
          </div>
        )}

        {isStreaming && isOpenMoment && (
          <div className="rounded-2xl rounded-bl-sm bg-surface px-4 py-2.5 text-sm italic text-muted-foreground ring-1 ring-border/70">
            Preparing card…
          </div>
        )}

        {uiMoments.map((moment, i) => (
          <UIMomentCard
            key={i}
            moment={moment}
            onChoice={choiceHandler}
            availability={availability}
            disabled={!onChoice}
          />
        ))}
      </div>
    </div>
  );
}

function UIMomentCard({
  moment,
  onChoice,
  availability,
  disabled,
}: {
  moment: UIMoment;
  onChoice: (label: string) => void;
  availability?: AgentSlot[];
  disabled: boolean;
}) {
  switch (moment.component) {
    case "quote_summary":
      return <QuoteSummary data={moment.data} />;
    case "slot_picker":
      return (
        <SlotPicker
          data={moment.data}
          onSelect={onChoice}
          disabled={disabled}
        />
      );
    case "tier_picker":
      return (
        <TierPicker
          data={moment.data}
          onSelect={onChoice}
          disabled={disabled}
        />
      );
    case "date_picker":
      return (
        <DatePicker
          data={moment.data}
          availability={availability ?? []}
          onSelect={onChoice}
          disabled={disabled}
        />
      );
    case "contact_form":
      return (
        <ContactForm
          data={moment.data}
          onSubmit={onChoice}
          disabled={disabled}
        />
      );
    case "recurrence_picker":
      return (
        <RecurrencePicker
          data={moment.data}
          onSelect={onChoice}
          disabled={disabled}
        />
      );
    case "booking_handoff":
      return <BookingHandoff data={moment.data} />;
  }
}

function Avatar() {
  return (
    <div className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white shadow-[0_4px_14px_-2px_rgba(21,38,68,0.35)] ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
      <Image
        src="/dvsh-avatar.png"
        alt=""
        fill
        sizes="44px"
        className="object-cover"
      />
    </div>
  );
}
