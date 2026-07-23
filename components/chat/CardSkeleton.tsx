import { cn } from "@/lib/utils";

// A placeholder card shown while a UI moment is still streaming in, shaped to
// roughly match the card type that's arriving so the swap-in feels seamless.
type SkeletonKind =
  | "date_picker"
  | "order_builder"
  | "contact_form"
  | "generic";

function Bar({ className }: { className?: string }) {
  return (
    <div className={cn("rounded bg-muted-foreground/15", className)} />
  );
}

export function CardSkeleton({ kind }: { kind: SkeletonKind }) {
  return (
    <div className="animate-pulse-soft overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <Bar className="h-4 w-40" />
      </div>
      <div className="px-5 py-4">
        {kind === "date_picker" && <DatePickerBody />}
        {kind === "order_builder" && <OrderBuilderBody />}
        {kind === "contact_form" && <ContactFormBody />}
        {kind === "generic" && <GenericBody />}
      </div>
    </div>
  );
}

function DatePickerBody() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Bar className="h-4 w-4" />
        <Bar className="h-4 w-28" />
        <Bar className="h-4 w-4" />
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 35 }).map((_, i) => (
          <Bar key={i} className="aspect-square w-full" />
        ))}
      </div>
    </div>
  );
}

function OrderBuilderBody() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-5 w-5 shrink-0 rounded-full bg-muted-foreground/15" />
          <Bar className="h-4 flex-1" />
          <Bar className="h-4 w-12" />
        </div>
      ))}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <Bar className="h-4 w-20" />
        <Bar className="h-5 w-16" />
      </div>
    </div>
  );
}

function ContactFormBody() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn("space-y-1.5", i === 3 && "sm:col-span-2")}>
          <Bar className="h-3 w-20" />
          <Bar className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

function GenericBody() {
  return (
    <div className="space-y-2.5">
      <Bar className="h-4 w-full" />
      <Bar className="h-4 w-4/5" />
      <Bar className="h-4 w-2/3" />
    </div>
  );
}
