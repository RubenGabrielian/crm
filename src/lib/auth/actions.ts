"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/server";
import { resendConfigured, sendCodeEmail } from "./email";
import { isBusinessType } from "@/lib/tenant/features";
import { findTenantByOwner, getCurrentUser } from "@/lib/tenant/get-current-tenant";

type Result = { ok: boolean; error: string | null };

export type RegisterDetails = {
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
};

type FieldErrors = Partial<Record<keyof RegisterDetails, string>>;
type SendResult = Result & { email: string | null; fieldErrors: FieldErrors };

const REQUIRED = "Պարտադիր դաշտ է";

function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Local Armenian numbers such as 077 123456 become +374...; null if not a phone number. */
function normalizePhone(raw: string): string | null {
  let phone = raw.replace(/[\s\-()]/g, "");
  if (/^0\d{8}$/.test(phone)) phone = `+374${phone.slice(1)}`;
  else if (/^374\d{8}$/.test(phone)) phone = `+${phone}`;
  return /^\+\d{8,15}$/.test(phone) ? phone : null;
}

function authErrorMessage(error: { code?: string; status?: number; message: string }) {
  const text = `${error.code ?? ""} ${error.message}`.toLowerCase();
  if (text.includes("signups not allowed") || text.includes("otp_disabled")) {
    return "Այս էլ. հասցեով հաշիվ չի գտնվել։ Նախ գրանցվեք։";
  }
  if (error.status === 429 || text.includes("rate limit")) {
    return "Շատ հաճախ եք փորձում։ Սպասեք մեկ րոպե և նորից փորձեք։";
  }
  if (text.includes("expired") || text.includes("invalid")) {
    return "Կոդը սխալ է կամ ժամկետն անցել է։";
  }
  if (text.includes("sending") || text.includes("smtp")) {
    return "Չհաջողվեց ուղարկել նամակը։ Փորձեք մի փոքր ուշ։";
  }
  return "Չհաջողվեց։ Փորձեք կրկին։";
}

/** Where the link in the email brings the user back to. */
async function confirmUrl() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}/auth/confirm`;
}


const SEND_FAILED = "Չհաջողվեց ուղարկել նամակը։ Փորձեք մի փոքր ուշ։";

/**
 * Local development only (`next dev`): any email signs in straight away, no
 * code to type. Production builds always run with NODE_ENV=production.
 */
const SKIP_EMAIL_CODE = process.env.NODE_ENV === "development";

/** Dev shortcut: create the account if needed, sign in and go on. */
async function devSignIn(
  email: string,
  profile: Record<string, string | null> | undefined,
): Promise<Result> {
  const admin = getAdminClient();
  if (!admin) {
    return { ok: false, error: "Dev մուտքի համար .env.local-ում պետք է SUPABASE_SECRET_KEY" };
  }
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: profile ?? {},
  });
  if (createError && createError.code !== "email_exists") {
    console.error("dev sign-in: creating user failed:", createError);
    return { ok: false, error: authErrorMessage(createError) };
  }

  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties) {
    console.error("dev sign-in: generating link failed:", error);
    return { ok: false, error: "Dev մուտքը չհաջողվեց" };
  }
  // Uses the token right here, so the session cookie is set without an email.
  const auth = await createAuthClient();
  const { error: verifyError } = await auth.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "email",
  });
  if (verifyError) {
    console.error("dev sign-in: verifying failed:", verifyError);
    return { ok: false, error: "Dev մուտքը չհաջողվեց" };
  }
  console.warn(`[dev] signed in as ${email} without an email code`);
  // New accounts continue to onboarding from there.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/**
 * Creates a one-time code for the address and emails it.
 *
 * Preferred path: Supabase only generates the code and we send the email
 * ourselves through Resend. That needs SUPABASE_SECRET_KEY and RESEND_API_KEY.
 * Without them, Supabase sends its own email instead.
 */
async function issueCode(
  email: string,
  options: { profile?: Record<string, string | null>; allowNewAccount: boolean },
): Promise<Result> {
  if (SKIP_EMAIL_CODE) return devSignIn(email, options.profile);

  const admin = getAdminClient();

  if (!admin || !resendConfigured) {
    const auth = await createAuthClient();
    const { error } = await auth.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: options.allowNewAccount,
        emailRedirectTo: await confirmUrl(),
        data: options.profile,
      },
    });
    if (error) {
      console.error("sending code through Supabase failed:", error);
      return { ok: false, error: authErrorMessage(error) };
    }
    return { ok: true, error: null };
  }

  if (options.profile) {
    // Registration: create the account with its details. An address that is
    // already registered simply gets a login code.
    const { error } = await admin.auth.admin.createUser({
      email,
      user_metadata: options.profile,
    });
    if (error && error.code !== "email_exists") {
      console.error("creating user failed:", error);
      return { ok: false, error: authErrorMessage(error) };
    }
  }

  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties) {
    console.error("generating login code failed:", error);
    return { ok: false, error: error ? authErrorMessage(error) : SEND_FAILED };
  }

  const link = new URL(await confirmUrl());
  link.searchParams.set("token_hash", data.properties.hashed_token);
  link.searchParams.set("type", "email");

  const sent = await sendCodeEmail({
    to: email,
    code: data.properties.email_otp,
    link: link.toString(),
  });
  if (!sent.ok) {
    console.error("Resend failed:", sent.error);
    return { ok: false, error: SEND_FAILED };
  }
  return { ok: true, error: null };
}

/** Login, step 1: email a one-time code to an existing account. */
export async function sendLoginCode(rawEmail: string): Promise<SendResult> {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    return {
      ok: false,
      email: null,
      error: null,
      fieldErrors: { email: "Մուտքագրեք ճիշտ էլ. հասցե" },
    };
  }

  const result = await issueCode(email, { allowNewAccount: false });
  return { ...result, email, fieldErrors: {} };
}

/**
 * Register, step 1: validate the details and email a one-time code.
 * Only the email is verified; name, phone and company are saved on the account.
 */
export async function sendRegisterCode(details: RegisterDetails): Promise<SendResult> {
  const companyName = details.companyName.trim();
  const fullName = details.fullName.trim();
  const phone = normalizePhone(details.phone);
  const email = normalizeEmail(details.email);

  const fieldErrors: FieldErrors = {};
  if (!companyName) fieldErrors.companyName = REQUIRED;
  else if (companyName.length > 60) fieldErrors.companyName = "Առավելագույնը 60 նիշ";
  if (!fullName) fieldErrors.fullName = REQUIRED;
  if (!details.phone.trim()) fieldErrors.phone = REQUIRED;
  else if (!phone) fieldErrors.phone = "Մուտքագրեք ճիշտ հեռախոսահամար, օրինակ՝ 077 123456";
  if (!details.email.trim()) fieldErrors.email = REQUIRED;
  else if (!email) fieldErrors.email = "Մուտքագրեք ճիշտ էլ. հասցե";

  if (Object.keys(fieldErrors).length > 0 || !email) {
    return { ok: false, email: null, error: null, fieldErrors };
  }

  const result = await issueCode(email, {
    allowNewAccount: true,
    profile: { company_name: companyName, full_name: fullName, phone },
  });
  return { ...result, email, fieldErrors: {} };
}

/** Step 2: check the emailed code. On success the session cookie is set and we move on. */
export async function verifyEmailCode(email: string, code: string): Promise<Result> {
  const token = code.replace(/\D/g, "");
  if (token.length < 6) return { ok: false, error: "Մուտքագրեք նամակով ստացված կոդը" };

  const auth = await createAuthClient();
  const { error } = await auth.auth.verifyOtp({ email, token, type: "email" });
  if (error) {
    console.error("verifying email code failed:", error);
    return { ok: false, error: authErrorMessage(error) };
  }
  // Pages cached for the signed-out visitor must not be shown to the user.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const auth = await createAuthClient();
  await auth.auth.signOut();
  // Forget the signed-in pages, so the next person can't go back to them.
  revalidatePath("/", "layout");
  redirect("/auth/login");
}

/** Onboarding: create the signed-in user's business. */
export async function createTenant(name: string, businessType: string): Promise<Result> {
  const supabase = await createAuthClient();
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (await findTenantByOwner(user.id)) redirect("/dashboard");

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Մուտքագրեք բիզնեսի անվանումը" };
  if (trimmed.length > 60) return { ok: false, error: "Անվանումը պետք է լինի մինչև 60 նիշ" };
  if (!isBusinessType(businessType)) return { ok: false, error: "Ընտրեք բիզնեսի տեսակը" };

  const { data: tenant, error } = await supabase
    .from("tenants")
    // The owner is always the verified session user, never a value from the form.
    .insert({ name: trimmed, business_type: businessType, owner_id: user.id })
    .select("id")
    .single();

  if (error) {
    console.error("creating tenant failed:", error);
    return { ok: false, error: "Չհաջողվեց պահպանել։ Փորձեք կրկին։" };
  }

  // Starting list of order sources; the owner can change it later.
  const { error: sourcesError } = await supabase.from("order_sources").insert([
    { tenant_id: tenant.id, name: "Instagram DM" },
    { tenant_id: tenant.id, name: "Meta Ads" },
  ]);
  if (sourcesError) console.error("seeding order sources failed:", sourcesError);

  // The browser may still remember "/dashboard → /onboarding" from a moment
  // ago (client cache, see staleTimes); clear it so the redirect lands.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
