"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, MailCheck } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  sendLoginCode,
  sendRegisterCode,
  verifyEmailCode,
  type RegisterDetails,
} from "@/lib/auth/actions";
import { StepIndicator } from "./step-indicator";

const COPY = {
  login: {
    title: "Բարի վերադարձ",
    intro:
      "Մուտքագրեք ձեր էլ. հասցեն, և մենք կուղարկենք մուտքի կոդը։ Գաղտնաբառ պետք չէ։",
    steps: ["Էլ. հասցե", "Կոդ"],
    otherText: "Դեռ հաշիվ չունե՞ք։",
    otherLink: "Գրանցվել",
    otherHref: "/auth/register",
  },
  register: {
    title: "Ստեղծեք ձեր խանութը",
    intro:
      "Մեկ րոպե, և պատրաստ եք ընդունել պատվերներ։ Հաստատման կոդը կգա էլ. փոստով, գաղտնաբառ պետք չէ։",
    steps: ["Տվյալներ", "Կոդ", "Բիզնես"],
    otherText: "Արդեն հաշիվ ունե՞ք։",
    otherLink: "Մուտք գործել",
    otherHref: "/auth/login",
  },
};

type FieldName = keyof RegisterDetails;

const FIELDS: {
  name: FieldName;
  label: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  registerOnly: boolean;
  /** Shares a row with its neighbour on wider screens. */
  half?: boolean;
}[] = [
  {
    name: "companyName",
    label: "Ընկերության անվանումը",
    type: "text",
    autoComplete: "organization",
    placeholder: "Օրինակ՝ Փափուկ աշխարհ",
    registerOnly: true,
  },
  {
    name: "fullName",
    label: "Անուն Ազգանուն",
    type: "text",
    autoComplete: "name",
    registerOnly: true,
    half: true,
  },
  {
    name: "phone",
    label: "Հեռախոսահամար",
    type: "tel",
    autoComplete: "tel",
    placeholder: "077 123456",
    registerOnly: true,
    half: true,
  },
  {
    name: "email",
    label: "Էլ. հասցե",
    type: "email",
    autoComplete: "email",
    placeholder: "name@example.com",
    registerOnly: false,
  },
];

export function EmailAuthForm({
  mode,
  linkFailed,
}: {
  mode: "login" | "register";
  /** The emailed link was invalid or expired. */
  linkFailed?: boolean;
}) {
  const copy = COPY[mode];
  const fields = FIELDS.filter(
    (field) => mode === "register" || !field.registerOnly,
  );

  const [details, setDetails] = useState<RegisterDetails>({
    companyName: "",
    fullName: "",
    phone: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  // Set once a code has been sent: the address it went to.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    linkFailed ? "Հղումն անվավեր է կամ ժամկետն անցել է։ Խնդրեք նոր կոդ։" : null,
  );
  const [pending, startTransition] = useTransition();

  function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result =
        mode === "register"
          ? await sendRegisterCode(details)
          : await sendLoginCode(details.email);
      if (result.ok) {
        setSentTo(result.email);
        setCode("");
      } else {
        setFieldErrors(result.fieldErrors);
        setError(result.error);
      }
    });
  }

  function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!sentTo) return;
    setError(null);
    startTransition(async () => {
      // On success the action redirects, so only failures come back here.
      const result = await verifyEmailCode(sentTo, code);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div>
      <StepIndicator steps={copy.steps} current={sentTo === null ? 1 : 2} />

      {sentTo === null ? (
        <>
          <h1 className="animate-rise mt-8 text-[2.1rem] leading-tight font-semibold tracking-tight text-balance sm:text-[2.5rem]">
            {copy.title}
          </h1>
          <p className="mt-3 text-muted-foreground">{copy.intro}</p>

          <form onSubmit={requestCode} noValidate className="mt-8 grid gap-6">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              {fields.map((field, index) => {
                const id = `auth-${field.name}`;
                const fieldError = fieldErrors[field.name];
                return (
                  <Field
                    key={field.name}
                    data-invalid={fieldError ? true : undefined}
                    className={field.half ? undefined : "sm:col-span-2"}
                  >
                    <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                    <Input
                      id={id}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      placeholder={field.placeholder}
                      value={details[field.name]}
                      onChange={(event) =>
                        setDetails({
                          ...details,
                          [field.name]: event.currentTarget.value,
                        })
                      }
                      className="h-12 rounded-xl px-4 text-base"
                      autoFocus={index === 0}
                      required
                      aria-invalid={fieldError ? true : undefined}
                      aria-describedby={fieldError ? `${id}-error` : undefined}
                    />
                    {fieldError && (
                      <FieldError id={`${id}-error`}>{fieldError}</FieldError>
                    )}
                  </Field>
                );
              })}
            </FieldGroup>
            {error && <FieldError>{error}</FieldError>}
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl text-base"
              disabled={pending}
            >
              {pending ? "Ուղարկվում է…" : "Ստանալ կոդը"}
              {!pending && <ArrowRight className="size-4" aria-hidden />}
            </Button>
          </form>
        </>
      ) : (
        <>
          <span className="success-pop mt-8 flex size-14 items-center justify-center rounded-2xl bg-[#ece8ff] text-[#5b45d6]">
            <MailCheck className="size-7" strokeWidth={1.75} aria-hidden />
          </span>
          <h1 className="mt-5 text-[2.1rem] leading-tight font-semibold tracking-tight text-balance sm:text-[2.5rem]">
            Ստուգեք էլ. փոստը
          </h1>
          <p className="mt-3 text-muted-foreground">
            Կոդն ուղարկվել է{" "}
            <span className="font-medium break-all text-foreground">
              {sentTo}
            </span>{" "}
            հասցեին։ Ստուգեք նաև «Սպամ» պանակը։
          </p>

          <form onSubmit={verify} noValidate className="mt-8 grid gap-6">
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="auth-code">Հաստատման կոդ</FieldLabel>
              <CodeInput
                value={code}
                onChange={setCode}
                invalid={!!error}
                describedBy={error ? "auth-code-error" : "auth-code-hint"}
              />
              {error ? (
                <FieldError id="auth-code-error">{error}</FieldError>
              ) : (
                <FieldDescription id="auth-code-hint">
                  Կարող եք նաև պարզապես սեղմել նամակի հղումը։
                </FieldDescription>
              )}
            </Field>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-xl text-base"
              disabled={pending || code.length < 6}
            >
              {pending ? "Ստուգվում է…" : "Հաստատել"}
              {!pending && <ArrowRight className="size-4" aria-hidden />}
            </Button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                className="rounded text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                disabled={pending}
                onClick={() => {
                  setSentTo(null);
                  setError(null);
                }}
              >
                Փոխել տվյալները
              </button>
              <button
                type="button"
                className="rounded text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                disabled={pending}
                onClick={() => requestCode()}
              >
                Ուղարկել նորից
              </button>
            </div>
          </form>
        </>
      )}

      <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
        {copy.otherText}{" "}
        <Link
          href={copy.otherHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {copy.otherLink}
        </Link>
      </p>
    </div>
  );
}

/**
 * One real input (so paste, autofill and the numeric keyboard all work)
 * drawn as a row of boxes, one digit per box.
 */
function CodeInput({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  describedBy: string;
}) {
  const [focused, setFocused] = useState(false);
  const boxes = Math.min(Math.max(6, value.length), 8);
  const activeIndex = Math.min(value.length, boxes - 1);

  return (
    <div className="relative">
      <input
        id="auth-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={8}
        value={value}
        onChange={(event) =>
          onChange(event.currentTarget.value.replace(/\D/g, ""))
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
        required
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />
      <div
        aria-hidden
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${boxes}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: boxes }, (_, index) => {
          const char = value[index];
          const active = focused && index === activeIndex;
          return (
            <span
              key={index}
              className={cn(
                "flex h-14 items-center justify-center rounded-xl border bg-card text-2xl font-semibold tabular-nums transition-[border-color,box-shadow] duration-200",
                active &&
                  "border-[#7c5cf5] shadow-[0_0_0_4px_rgb(124_92_245/0.18)]",
                invalid && !active && "border-destructive",
              )}
            >
              {char ??
                (active ? (
                  <span className="code-caret h-6 w-0.5 rounded bg-foreground" />
                ) : null)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
