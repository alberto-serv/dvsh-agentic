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
import { AddonPicker } from "@/components/ui-moments/AddonPicker";
import { OrderBuilder } from "@/components/ui-moments/OrderBuilder";
import { CardSkeleton } from "./CardSkeleton";
import type { AgentSlot, CheckoutOrder, UIMoment } from "@/lib/types";

const UI_MOMENT_OPEN = "<<<UI_MOMENT>>>";

// The model writes **bold** for emphasis. Render it as real emphasis rather
// than leaking literal asterisks into the bubble. Built from React elements —
// no HTML injection, no markdown dependency.
function renderInlineEmphasis(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

type SkeletonKind = "date_picker" | "order_builder" | "contact_form" | "generic";

// Peek at the component name inside the still-streaming (unterminated) UI moment
// so we can show a skeleton shaped like the card that's arriving.
function peekStreamingCard(content: string): SkeletonKind {
  const idx = content.lastIndexOf(UI_MOMENT_OPEN);
  if (idx === -1) return "generic";
  const partial = content.slice(idx + UI_MOMENT_OPEN.length);
  const match = partial.match(/"component"\s*:\s*"(\w+)"/);
  const name = match?.[1];
  if (name === "date_picker" || name === "order_builder" || name === "contact_form") {
    return name;
  }
  return "generic";
}

type SelectionHandler = (
  update: Partial<CheckoutOrder["services"]>,
  humanLabel: string,
) => void;
type CustomerSelectionHandler = (
  update: Partial<CheckoutOrder["customer"]>,
  humanLabel: string,
) => void;
type ContactDataHandler = (update: Partial<CheckoutOrder["customer"]>) => void;
type OrderChangeHandler = (update: Partial<CheckoutOrder["services"]>) => void;

interface Props {
  role: "user" | "assistant";
  content: string;
  onChoice?: (label: string) => void;
  onSelection?: SelectionHandler;
  onCustomerSelection?: CustomerSelectionHandler;
  onContactData?: ContactDataHandler;
  onOrderChange?: OrderChangeHandler;
  order?: CheckoutOrder["services"];
  customer?: CheckoutOrder["customer"];
  isStreaming?: boolean;
  availability?: AgentSlot[];
}

export function MessageBubble({
  role,
  content,
  onChoice,
  onSelection,
  onCustomerSelection,
  onContactData,
  onOrderChange,
  order,
  customer,
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
  const selectionHandler: SelectionHandler = onSelection ?? (() => {});
  const customerSelectionHandler: CustomerSelectionHandler =
    onCustomerSelection ?? (() => {});
  const contactDataHandler: ContactDataHandler = onContactData ?? (() => {});
  const orderChangeHandler: OrderChangeHandler = onOrderChange ?? (() => {});
  const orderServices: CheckoutOrder["services"] = order ?? {
    selectedServices: [],
  };
  const customerData: CheckoutOrder["customer"] = customer ?? {};

  return (
    <div className="flex items-start gap-3">
      <Avatar />
      <div className="flex max-w-[88%] flex-col gap-2.5">
        {hasText && (
          <div className="rounded-2xl rounded-bl-sm bg-surface px-4 py-3 text-[15px] leading-relaxed text-foreground ring-1 ring-border/70">
            <p className="whitespace-pre-wrap">{renderInlineEmphasis(text)}</p>
          </div>
        )}

        {isStreaming && isOpenMoment && (
          <CardSkeleton kind={peekStreamingCard(content)} />
        )}

        {uiMoments.map((moment, i) => (
          <UIMomentCard
            key={i}
            moment={moment}
            onChoice={choiceHandler}
            onSelection={selectionHandler}
            onCustomerSelection={customerSelectionHandler}
            onContactData={contactDataHandler}
            onOrderChange={orderChangeHandler}
            order={orderServices}
            customer={customerData}
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
  onSelection,
  onCustomerSelection,
  onContactData,
  onOrderChange,
  order,
  customer,
  availability,
  disabled,
}: {
  moment: UIMoment;
  onChoice: (label: string) => void;
  onSelection: SelectionHandler;
  onCustomerSelection: CustomerSelectionHandler;
  onContactData: ContactDataHandler;
  onOrderChange: OrderChangeHandler;
  order: CheckoutOrder["services"];
  customer: CheckoutOrder["customer"];
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
          onSelect={onCustomerSelection}
          disabled={disabled}
        />
      );
    case "tier_picker":
      return (
        <TierPicker
          data={moment.data}
          order={order}
          onSelect={onSelection}
          disabled={disabled}
        />
      );
    case "date_picker":
      return (
        <DatePicker
          data={moment.data}
          availability={availability ?? []}
          onSelect={onCustomerSelection}
          disabled={disabled}
        />
      );
    case "contact_form":
      return (
        <ContactForm
          data={moment.data}
          onSubmit={onChoice}
          onContactData={onContactData}
          disabled={disabled}
        />
      );
    case "recurrence_picker":
      return (
        <RecurrencePicker
          data={moment.data}
          order={order}
          onSelect={onSelection}
          disabled={disabled}
        />
      );
    case "addon_picker":
      return (
        <AddonPicker
          data={moment.data}
          onSelect={onSelection}
          disabled={disabled}
        />
      );
    case "order_builder":
      return (
        <OrderBuilder
          data={moment.data}
          order={order}
          onSelect={onSelection}
          onOrderChange={onOrderChange}
          disabled={disabled}
        />
      );
    case "booking_handoff":
      return (
        <BookingHandoff
          data={moment.data}
          order={order}
          customer={customer}
        />
      );
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
