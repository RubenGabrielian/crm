import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const API = "https://api.lemonsqueezy.com/v1";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

/**
 * Creates a Lemon Squeezy checkout for the Numa Pro plan and returns its URL.
 * The Supabase user id rides along in custom data, so the webhook knows whose
 * subscription it is.
 */
export async function createProCheckout({
  userId,
  email,
  redirectUrl,
}: {
  userId: string;
  email: string | undefined;
  redirectUrl: string;
}): Promise<string> {
  const response = await fetch(`${API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${env("LEMONSQUEEZY_API_KEY")}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: { email, custom: { user_id: userId } },
          product_options: { redirect_url: redirectUrl },
        },
        relationships: {
          store: { data: { type: "stores", id: env("LEMONSQUEEZY_STORE_ID") } },
          variant: { data: { type: "variants", id: env("LEMONSQUEEZY_VARIANT_ID") } },
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Lemon Squeezy checkout failed (${response.status}): ${await response.text()}`);
  }
  const json = (await response.json()) as { data: { attributes: { url: string } } };
  return json.data.attributes.url;
}

/** Checks the X-Signature header: a hex HMAC-SHA256 of the raw body. */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", env("LEMONSQUEEZY_WEBHOOK_SECRET"))
    .update(rawBody)
    .digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export type LemonSqueezySubscription = {
  id: string;
  attributes: Record<string, unknown>;
};

/**
 * The newest Numa Pro subscription bought with this email, asked from Lemon
 * Squeezy directly. Lets the pay page activate Pro when the webhook can't
 * reach the app (e.g. on localhost) or is late.
 */
export async function findProSubscriptionByEmail(
  email: string,
): Promise<LemonSqueezySubscription | null> {
  const query = new URLSearchParams({
    "filter[store_id]": env("LEMONSQUEEZY_STORE_ID"),
    "filter[variant_id]": env("LEMONSQUEEZY_VARIANT_ID"),
    "filter[user_email]": email,
  });
  const response = await fetch(`${API}/subscriptions?${query}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${env("LEMONSQUEEZY_API_KEY")}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Lemon Squeezy subscriptions failed (${response.status}): ${await response.text()}`);
  }
  const json = (await response.json()) as { data: LemonSqueezySubscription[] };
  const newest = json.data.sort((a, b) =>
    String(b.attributes.created_at).localeCompare(String(a.attributes.created_at)),
  );
  return newest[0] ?? null;
}

/** Mirrors a Lemon Squeezy subscription into the user's subscriptions row. */
export async function saveSubscription(
  admin: SupabaseClient,
  userId: string,
  subscription: LemonSqueezySubscription,
) {
  const attributes = subscription.attributes;
  const urls = attributes.urls as { customer_portal?: string } | undefined;
  return admin.from("subscriptions").upsert(
    {
      user_id: userId,
      ls_subscription_id: subscription.id,
      ls_customer_id: String(attributes.customer_id),
      ls_variant_id: String(attributes.variant_id),
      status: attributes.status as string,
      renews_at: attributes.renews_at ?? null,
      ends_at: attributes.ends_at ?? null,
      customer_portal_url: urls?.customer_portal ?? null,
      test_mode: Boolean(attributes.test_mode),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}
