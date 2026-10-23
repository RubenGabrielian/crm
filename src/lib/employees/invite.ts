import "server-only";

import { headers } from "next/headers";
import { emailConfigured, escapeHtml, sendEmail } from "@/lib/email/send";

/**
 * The site's public address. SITE_URL wins (set it in production, e.g.
 * https://example.am); otherwise the address the owner is using right now.
 */
async function siteUrl() {
  const configured = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

/**
 * Welcomes a newly added employee and tells them where to sign in.
 * Never throws: a failed email must not undo adding the employee.
 */
export async function sendEmployeeInvite(input: {
  to: string;
  fullName: string;
  businessName: string;
}): Promise<void> {
  if (!emailConfigured) {
    console.warn("employee invite skipped: RESEND_API_KEY is not set");
    return;
  }
  try {
    const loginUrl = `${await siteUrl()}/auth/login`;
    const greeting = `Բարի գալուստ, ${input.fullName}։`;
    const line = `«${input.businessName}»-ը ձեզ հրավիրել է միանալ իր թիմին որպես աշխատակից։`;
    const how = `Մուտք գործելու համար բացեք հղումը և մուտքագրեք այս էլ. հասցեն (${input.to})։ Մենք կուղարկենք մուտքի կոդ, գաղտնաբառ պետք չէ։`;

    const result = await sendEmail({
      to: input.to,
      fromName: input.businessName,
      subject: `Ձեզ հրավիրել են միանալ «${input.businessName}»-ին`,
      text: `${greeting}\n\n${line}\n\n${how}\n\nՄուտք գործել՝ ${loginUrl}`,
      html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f1729">
  <p style="margin:0 0 12px;font-size:20px;font-weight:700">${escapeHtml(greeting)}</p>
  <p style="margin:0 0 16px;font-size:16px">${escapeHtml(line)}</p>
  <p style="margin:0 0 24px;font-size:15px;color:#4a4257">${escapeHtml(how)}</p>
  <p style="margin:0 0 24px">
    <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#2b1f3a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px">Մուտք գործել</a>
  </p>
  <p style="margin:0;padding-top:16px;border-top:1px solid #e7e3ee;font-size:13px;color:#6f6780">Եթե կոճակը չի աշխատում, բացեք այս հասցեն՝ <a href="${escapeHtml(loginUrl)}" style="color:#6f6780">${escapeHtml(loginUrl)}</a></p>
</div>`,
    });
    if (result.ok) console.log("employee invite sent");
    else console.error("employee invite failed:", result.error);
  } catch (cause) {
    console.error("employee invite crashed:", cause);
  }
}
