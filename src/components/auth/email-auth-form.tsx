"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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

const COPY = {
  login: {
    title: "Մուտք",
    intro: "Մուտքագրեք ձեր էլ. հասցեն, և մենք կուղարկենք մուտքի կոդը։",
    otherText: "Դեռ հաշիվ չունե՞ք։",
    otherLink: "Գրանցվել",
    otherHref: "/auth/register",
  },
  register: {
    title: "Գրանցում",
    intro: "Լրացրեք տվյալները։ Գաղտնաբառ պետք չէ. հաստատման կոդը կստանաք էլ. փոստով։",
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
}[] = [
  { name: "companyName", label: "Ընկերության անվանումը", type: "text", autoComplete: "organization", registerOnly: true },
  { name: "fullName", label: "Անուն Ազգանուն", type: "text", autoComplete: "name", registerOnly: true },
  { name: "phone", label: "Հեռախոսահամար", type: "tel", autoComplete: "tel", placeholder: "077 123456", registerOnly: true },
  { name: "email", label: "Էլ. հասցե", type: "email", autoComplete: "email", placeholder: "name@example.com", registerOnly: false },
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
  const fields = FIELDS.filter((field) => mode === "register" || !field.registerOnly);

  const [details, setDetails] = useState<RegisterDetails>({
    companyName: "",
    fullName: "",
    phone: "",
    email: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
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
    <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-soft sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>

      {sentTo === null ? (
        <form onSubmit={requestCode} noValidate className="mt-2 grid gap-5">
          <p className="text-sm text-muted-foreground">{copy.intro}</p>
          <FieldGroup className="gap-4">
            {fields.map((field, index) => {
              const id = `auth-${field.name}`;
              const fieldError = fieldErrors[field.name];
              return (
                <Field key={field.name} data-invalid={fieldError ? true : undefined}>
                  <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                  <Input
                    id={id}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    placeholder={field.placeholder}
                    value={details[field.name]}
                    onChange={(event) =>
                      setDetails({ ...details, [field.name]: event.currentTarget.value })
                    }
                    className="h-10"
                    autoFocus={index === 0}
                    required
                    aria-invalid={fieldError ? true : undefined}
                    aria-describedby={fieldError ? `${id}-error` : undefined}
                  />
                  {fieldError && <FieldError id={`${id}-error`}>{fieldError}</FieldError>}
                </Field>
              );
            })}
          </FieldGroup>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={pending}>
            {pending ? "Ուղարկվում է…" : "Ստանալ կոդը"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="mt-2 grid gap-5">
          <p className="text-sm text-muted-foreground">
            Կոդն ուղարկվել է{" "}
            <span className="font-medium break-all text-foreground">{sentTo}</span> հասցեին։
            Ստուգեք նաև «Սպամ» պանակը։
          </p>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="auth-code">Հաստատման կոդ</FieldLabel>
            <Input
              id="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(event) => setCode(event.currentTarget.value.replace(/\D/g, ""))}
              className="h-11 text-center text-lg tracking-[0.4em] tabular-nums"
              autoFocus
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "auth-code-error" : undefined}
            />
            {error ? (
              <FieldError id="auth-code-error">{error}</FieldError>
            ) : (
              <FieldDescription>Կարող եք նաև սեղմել նամակի հղումը։</FieldDescription>
            )}
          </Field>
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full text-base"
            disabled={pending || code.length < 6}
          >
            {pending ? "Ստուգվում է…" : "Հաստատել"}
          </Button>
          <div className="flex justify-between text-sm">
            <button
              type="button"
              className="text-muted-foreground underline-offset-2 hover:underline"
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
              className="text-muted-foreground underline-offset-2 hover:underline"
              disabled={pending}
              onClick={() => requestCode()}
            >
              Ուղարկել նորից
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">
        {copy.otherText}{" "}
        <Link
          href={copy.otherHref}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {copy.otherLink}
        </Link>
      </p>
    </div>
  );
}
