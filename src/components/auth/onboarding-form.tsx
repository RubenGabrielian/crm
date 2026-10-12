"use client";

import { useState, useTransition } from "react";
import { GraduationCap, Package, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createTenant } from "@/lib/auth/actions";
import type { BusinessType } from "@/lib/tenant/features";

const OPTIONS: { type: BusinessType; icon: LucideIcon; title: string; examples: string }[] = [
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
        <div className="grid gap-4 sm:grid-cols-2">
          {OPTIONS.map(({ type: value, icon: Icon, title, examples }) => (
            <label
              key={value}
              className={cn(
                "relative flex cursor-pointer flex-col gap-3 rounded-3xl bg-card p-6 shadow-soft transition-colors",
                "has-focus-visible:ring-2 has-focus-visible:ring-ring",
                type === value ? "border-primary ring-1 ring-primary" : "hover:border-foreground/30",
              )}
            >
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
                  "flex size-12 items-center justify-center rounded-xl",
                  type === value ? "bg-apricot text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-base font-semibold">{title}</span>
              <span className="text-sm text-muted-foreground">{examples}</span>
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
          className="h-10"
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
        className="h-11 w-full text-base sm:w-auto sm:justify-self-end sm:px-8"
        disabled={pending || !type || !name.trim()}
      >
        {pending ? "Պահպանվում է…" : "Շարունակել"}
      </Button>
    </form>
  );
}
