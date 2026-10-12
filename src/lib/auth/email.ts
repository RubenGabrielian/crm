import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM || "onboarding@resend.dev";

export const resendConfigured = Boolean(apiKey);

/** Emails the one-time code, with a button for people who prefer to click. */
export async function sendCodeEmail(input: {
  to: string;
  code: string;
  link: string;
}): Promise<{ ok: boolean; error: string | null }> {
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set" };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.to,
    subject: `${input.code} – ձեր հաստատման կոդը`,
    text: `Ձեր հաստատման կոդը՝ ${input.code}\n\nԿամ բացեք այս հղումը՝ ${input.link}\n\nԵթե դուք չեք փորձել մուտք գործել, պարզապես անտեսեք այս նամակը։`,
    html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:440px;margin:0 auto;padding:24px;color:#1f1729">
  <p style="margin:0 0 16px;font-size:16px">Ձեր հաստատման կոդը՝</p>
  <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:8px">${input.code}</p>
  <p style="margin:0 0 24px">
    <a href="${input.link}" style="display:inline-block;background:#2b1f3a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px">Մուտք գործել մեկ սեղմումով</a>
  </p>
  <p style="margin:0;font-size:13px;color:#6f6780">Կոդը վավեր է սահմանափակ ժամանակ։ Եթե դուք չեք փորձել մուտք գործել, պարզապես անտեսեք այս նամակը։</p>
</div>`,
  });

  if (error) return { ok: false, error: `${error.name}: ${error.message}` };
  return { ok: true, error: null };
}
