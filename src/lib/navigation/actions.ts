"use server";

import { revalidatePath } from "next/cache";
import { NAV_HREFS, NAV_LABEL_MAX } from "@/config/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import { cleanNavLabels } from "./labels";

/**
 * Renames one menu item for the signed-in user only. An empty name brings
 * back the built-in one.
 */
export async function renameNavItem(
  href: string,
  label: string,
): Promise<{ ok: boolean; error: string | null }> {
  if (!NAV_HREFS.includes(href)) return { ok: false, error: "Անհայտ բաժին" };
  const text = label.trim().replace(/\s+/g, " ");
  if (text.length > NAV_LABEL_MAX)
    return { ok: false, error: `Առավելագույնը ${NAV_LABEL_MAX} նիշ` };

  const auth = await createAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return { ok: false, error: "Մուտք գործեք նորից" };

  const labels = cleanNavLabels(user.user_metadata?.nav_labels);
  if (text) labels[href] = text;
  else delete labels[href];

  const { error } = await auth.auth.updateUser({ data: { nav_labels: labels } });
  if (error) {
    console.error("saving menu name failed:", error);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  // Pages read names from the session token, which keeps the old metadata
  // until it is reissued; reissue it now so the change shows everywhere.
  const { error: refreshError } = await auth.auth.refreshSession();
  if (refreshError) console.error("refreshing session failed:", refreshError);

  revalidatePath("/", "layout");
  return { ok: true, error: null };
}

/**
 * Renames the customer comment ("Մեկնաբանություն") for the signed-in user
 * only. An empty name brings back the built-in one.
 */
export async function renameCommentLabel(
  label: string,
): Promise<{ ok: boolean; error: string | null }> {
  const text = label.trim().replace(/\s+/g, " ");
  if (text.length > NAV_LABEL_MAX)
    return { ok: false, error: `Առավելագույնը ${NAV_LABEL_MAX} նիշ` };

  const auth = await createAuthClient();
  const { error } = await auth.auth.updateUser({
    data: { comment_label: text || null },
  });
  if (error) {
    console.error("saving comment name failed:", error);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  // Pages read names from the session token, which keeps the old metadata
  // until it is reissued; reissue it now so the change shows everywhere.
  const { error: refreshError } = await auth.auth.refreshSession();
  if (refreshError) console.error("refreshing session failed:", refreshError);

  revalidatePath("/", "layout");
  return { ok: true, error: null };
}
