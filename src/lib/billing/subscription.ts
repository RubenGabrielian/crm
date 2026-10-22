import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findProSubscriptionByEmail, saveSubscription } from "./lemonsqueezy";
import { requireAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/tenant/get-current-tenant";

export type Subscription = {
  status: string;
  renewsAt: string | null;
  endsAt: string | null;
  customerPortalUrl: string | null;
};

/**
 * TEMPORARY, for testing: while false, every account gets every Pro feature
 * (no demo pages, no expense limit, sale links and public checkout open).
 * Set back to true to enforce the free/Pro limits again.
 */
export const PRO_LIMITS_ENABLED = false;

/** Whether this subscription unlocks Pro features (always, while limits are off). */
export function hasProAccess(subscription: Subscription | null): boolean {
  return !PRO_LIMITS_ENABLED || isProSubscription(subscription);
}

/** Lemon Squeezy statuses that still give access. past_due is the retry window. */
const PAID_STATUSES = new Set(["active", "on_trial", "past_due"]);

export function isProSubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  if (PAID_STATUSES.has(subscription.status)) return true;
  // A cancelled subscription keeps Pro until the paid period ends.
  return (
    subscription.status === "cancelled" &&
    subscription.endsAt !== null &&
    new Date(subscription.endsAt) > new Date()
  );
}

/**
 * The signed-in user's subscription, read through their own session so RLS
 * only ever returns their row. Null when they never subscribed.
 */
export const getCurrentSubscription = cache(async (): Promise<Subscription | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const auth = await createAuthClient();
  return readSubscription(auth, user.id);
});

async function readSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, renews_at, ends_at, customer_portal_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("loading subscription failed:", error);
    return null;
  }
  if (!data) return null;
  return {
    status: data.status,
    renewsAt: data.renews_at,
    endsAt: data.ends_at,
    customerPortalUrl: data.customer_portal_url,
  };
}

/** Whether the signed-in user has Pro. Server actions check this before paid features. */
export async function isCurrentUserPro(): Promise<boolean> {
  return hasProAccess(await getCurrentSubscription());
}

/**
 * Whether a business owner has Pro, for the public checkout where nobody is
 * signed in: read with the secret key. Only Pro sellers can take orders there.
 */
export const isOwnerPro = cache(async (ownerId: string): Promise<boolean> => {
  if (!PRO_LIMITS_ENABLED) return true;
  return isProSubscription(await readSubscription(requireAdminClient(), ownerId));
});

/**
 * Right after paying: asks Lemon Squeezy for the signed-in user's subscription
 * and saves it, in case the webhook hasn't arrived. True when it saved one
 * that gives Pro.
 */
export async function syncSubscriptionFromLemonSqueezy(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.email) return false;
  try {
    const found = await findProSubscriptionByEmail(user.email);
    if (!found) return false;
    const { error } = await saveSubscription(requireAdminClient(), user.id, found);
    if (error) {
      console.error("saving synced subscription failed:", error);
      return false;
    }
    return isProSubscription({
      status: String(found.attributes.status),
      renewsAt: (found.attributes.renews_at as string | null) ?? null,
      endsAt: (found.attributes.ends_at as string | null) ?? null,
      customerPortalUrl: null,
    });
  } catch (error) {
    console.error("syncing subscription failed:", error);
    return false;
  }
}
