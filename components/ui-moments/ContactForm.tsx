"use client";

import { useState } from "react";
import { User, Mail, Phone, MapPin } from "lucide-react";
import {
  cn,
  formatPhone,
  isValidEmail,
  isValidPhone,
} from "@/lib/utils";
import type { ContactFormData } from "@/lib/types";

interface Props {
  data: ContactFormData;
  onSubmit: (label: string) => void;
  disabled?: boolean;
}

interface Fields {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Errors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const INITIAL: Fields = { name: "", email: "", phone: "", address: "" };

export function ContactForm({ data, onSubmit, disabled }: Props) {
  const [fields, setFields] = useState<Fields>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(next: Fields): Errors {
    const errs: Errors = {};
    if (!next.name.trim()) errs.name = "Required";
    if (!next.email.trim()) errs.email = "Required";
    else if (!isValidEmail(next.email)) errs.email = "Enter a valid email";
    if (!next.phone.trim()) errs.phone = "Required";
    else if (!isValidPhone(next.phone)) errs.phone = "Enter a 10-digit number";
    if (!next.address.trim()) errs.address = "Required";
    return errs;
  }

  function update<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || submitted) return;
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitted(true);
    const message = [
      "Here are my details:",
      `Name: ${fields.name.trim()}`,
      `Email: ${fields.email.trim()}`,
      `Phone: ${formatPhone(fields.phone)}`,
      `Address: ${fields.address.trim()}`,
    ].join("\n");
    onSubmit(message);
  }

  const isLocked = disabled || submitted;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="mb-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          {data.prompt ?? "Your details"}
        </h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          So we know who&apos;s booking and where to send the crew.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          icon={User}
          label="Full name"
          value={fields.name}
          onChange={(v) => update("name", v)}
          error={errors.name}
          disabled={isLocked}
          autoComplete="name"
          placeholder="Jane Doe"
        />
        <Field
          icon={Mail}
          label="Email"
          type="email"
          value={fields.email}
          onChange={(v) => update("email", v)}
          error={errors.email}
          disabled={isLocked}
          autoComplete="email"
          placeholder="jane@example.com"
        />
        <Field
          icon={Phone}
          label="Phone"
          type="tel"
          value={fields.phone}
          onChange={(v) => update("phone", v)}
          error={errors.phone}
          disabled={isLocked}
          autoComplete="tel"
          placeholder="(713) 555-0123"
        />
        <Field
          icon={MapPin}
          label="Service address"
          value={fields.address}
          onChange={(v) => update("address", v)}
          error={errors.address}
          disabled={isLocked}
          autoComplete="street-address"
          placeholder="123 Main St, Houston, TX"
          className="sm:col-span-2"
        />
      </div>

      <button
        type="submit"
        disabled={isLocked}
        className={cn(
          "mt-5 w-full rounded-lg bg-primary px-4 py-3 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground transition",
          "hover:bg-primary/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isLocked && "cursor-not-allowed opacity-60",
        )}
      >
        {submitted ? "Sent" : "Continue"}
      </button>
    </form>
  );
}

interface FieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  error,
  disabled,
  type = "text",
  autoComplete,
  placeholder,
  className,
}: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15",
          error ? "border-red-500/60" : "border-border",
          disabled && "opacity-60",
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed"
        />
      </div>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </label>
  );
}
