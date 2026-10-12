import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM || "onboarding@resend.dev";

export const emailConfigured = Boolean(apiKey);

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Sends one email through Resend. Never throws; failures come back as `error`. */
export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Shown as the sender's name, e.g. the business name. */
  fromName?: string;
}): Promise<{ ok: boolean; error: string | null }> {
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set" };

  // Characters that would break the "Name <address>" header are dropped.
  const name = input.fromName?.replace(/[<>"\r\n]/g, "").trim();
  const from = name ? `${name} <${fromAddress}>` : fromAddress;

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (error) return { ok: false, error: `${error.name}: ${error.message}` };
    return { ok: true, error: null };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
  }
}
