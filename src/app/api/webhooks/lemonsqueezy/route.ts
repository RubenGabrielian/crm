import { NextResponse } from "next/server";
import { isValidWebhookSignature, saveSubscription } from "@/lib/billing/lemonsqueezy";
import { getAdminClient } from "@/lib/supabase/admin";

type WebhookPayload = {
  meta: { event_name: string; custom_data?: { user_id?: string } };
  data: { id: string; type: string; attributes: Record<string, unknown> };
};

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
]);

/**
 * Lemon Squeezy calls this for every subscription change. It verifies the
 * signature, then mirrors the subscription into Supabase with the secret key.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get("x-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SECRET_KEY missing" }, { status: 500 });

  const { meta, data } = JSON.parse(rawBody) as WebhookPayload;
  const attributes = data.attributes;

  if (SUBSCRIPTION_EVENTS.has(meta.event_name)) {
    const userId = meta.custom_data?.user_id;
    if (!userId) {
      // Not started from Numa's checkout, so there's nobody to link it to.
      console.warn(`lemonsqueezy ${meta.event_name} ${data.id} has no user_id`);
      return NextResponse.json({ ok: true });
    }

    const { error } = await saveSubscription(admin, userId, data);
    if (error) {
      console.error("saving subscription failed:", error);
      // A 500 makes Lemon Squeezy retry the delivery.
      return NextResponse.json({ error: "db" }, { status: 500 });
    }
  } else if (meta.event_name === "subscription_payment_success") {
    // A renewal went through: the subscription is active again.
    const { error } = await admin
      .from("subscriptions")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("ls_subscription_id", String(attributes.subscription_id));
    if (error) {
      console.error("marking payment failed:", error);
      return NextResponse.json({ error: "db" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
