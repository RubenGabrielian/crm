"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  Check,
  GraduationCap,
  Package,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createTenant } from "@/lib/auth/actions";
import type { BusinessType } from "@/lib/tenant/features";

const OPTIONS: {
  type: BusinessType;
  icon: LucideIcon;
  title: string;
  examples: string;
}[] = [
  {
    type: "ecommerce",
    icon: Package,
    title: "Ֆիզիկական ապրանքներ",
    examples: "Խաղալիքներ, հագուստ, սնունդ",
  },
  {
    type: "service",
    icon: GraduationCap,
    title: "Ծառայություններ / Դասընթացներ",
    examples: "Անգլերենի դպրոց, խորհրդատվություն",
  },
  {
    type: "mixed",
    icon: Wrench,
    title: "Ապրանք + ծառայություն",
    examples: "Ավտոապակի և տեղադրում, կահույք և հավաքում",
  },
];

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [type, setType] = useState<BusinessType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!type) return;
    setError(null);
    startTransition(async () => {
      // On success the action redirects to the dashboard.
      const result = await createTenant(name, type);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      <fieldset>
        <legend className="sr-only">Բիզնեսի տեսակ</legend>
        <div className="grid gap-3">
          {OPTIONS.map(({ type: value, icon: Icon, title, examples }) => (
            <label
              key={value}
              className={cn(
                "relative flex cursor-pointer items-center gap-4 rounded-3xl border-2 bg-card p-4 pr-12 shadow-soft transition-[border-color,box-shadow]",
                "has-focus-visible:ring-2 has-focus-visible:ring-ring",
                type === value
                  ? "border-[#185aef] shadow-[0_18px_40px_-24px_rgb(24_90_239/0.6)]"
                  : "border-transparent hover:border-border",
              )}
            >
              {type === value && (
                <span className="success-pop absolute top-1/2 right-4 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#185aef] text-white">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
              )}
              <input
                type="radio"
                name="business_type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl",
                  type === value
                    ? "bg-[#e8efff] text-[#1146c4]"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-semibold">{title}</span>
                <span className="text-sm text-muted-foreground">{examples}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="business-name">Բիզնեսի անվանումը</FieldLabel>
        <Input
          id="business-name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          maxLength={60}
          placeholder="Օրինակ՝ Արևիկ Խաղալիքներ"
          className="h-12 rounded-xl px-4 text-base"
          autoComplete="organization"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "business-name-error" : undefined}
        />
        {error && <FieldError id="business-name-error">{error}</FieldError>}
      </Field>

      <Button
        type="submit"
        size="lg"
        className="h-12 w-full rounded-xl text-base"
        disabled={pending || !type || !name.trim()}
      >
        {pending ? "Պահպանվում է…" : "Բացել վահանակը"}
        {!pending && <ArrowRight className="size-4" aria-hidden />}
      </Button>
    </form>
  );
}
