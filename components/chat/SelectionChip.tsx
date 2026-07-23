export function SelectionChip({ label }: { label: string }) {
  return (
    <div className="flex justify-end">
      <span className="inline-flex max-w-[80%] items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
        {label}
      </span>
    </div>
  );
}
