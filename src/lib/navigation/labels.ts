import "server-only";

import { NAV_HREFS, NAV_LABEL_MAX, type NavLabels } from "@/config/navigation";
import { getCurrentUser } from "@/lib/tenant/get-current-tenant";

/** Keeps only known menu paths with sensible names. */
export function cleanNavLabels(value: unknown): NavLabels {
  if (!value || typeof value !== "object") return {};
  const labels: NavLabels = {};
  for (const [href, label] of Object.entries(value)) {
    if (!NAV_HREFS.includes(href) || typeof label !== "string") continue;
    const text = label.trim().slice(0, NAV_LABEL_MAX);
    if (text) labels[href] = text;
  }
  return labels;
}

/** Built-in name of the customer comment, used until the user renames it. */
export const DEFAULT_COMMENT_LABEL = "Մեկնաբանություն";

/** The user's own name for the customer comment (e.g. "Նախընտրություններ"). */
export async function getCommentLabel(): Promise<string> {
  const user = await getCurrentUser();
  const label = user?.user_metadata?.comment_label;
  return typeof label === "string" && label.trim()
    ? label.trim().slice(0, NAV_LABEL_MAX)
    : DEFAULT_COMMENT_LABEL;
}

/**
 * The signed-in user's own menu names. Saved in their Supabase user metadata,
 * so they belong to that person only.
 */
export async function getNavLabels(): Promise<NavLabels> {
  const user = await getCurrentUser();
  return cleanNavLabels(user?.user_metadata?.nav_labels);
}
