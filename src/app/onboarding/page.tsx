import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { findTenantByOwner, getCurrentUser } from "@/lib/tenant/get-current-tenant";

export const metadata: Metadata = { title: "Բիզնեսի տեսակը" };

// Depends on who is signed in.
export const instant = false;

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  // Already set up: nothing to do here.
  if (await findTenantByOwner(user.id)) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Ի՞նչ բիզնես եք ղեկավարում
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ընտրությունից կախված՝ համակարգը կհարմարեցվի ձեր բիզնեսին։
        </p>
      </header>
      {/* The company name was entered at registration; it can still be corrected here. */}
      <OnboardingForm
        defaultName={
          typeof user.user_metadata?.company_name === "string" ? user.user_metadata.company_name : ""
        }
      />
    </main>
  );
}
