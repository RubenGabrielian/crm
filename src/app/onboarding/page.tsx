import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { StepIndicator } from "@/components/auth/step-indicator";
import {
  findTenantByOwner,
  getCurrentUser,
} from "@/lib/tenant/get-current-tenant";

export const metadata: Metadata = { title: "Բիզնեսի տեսակը" };

// Depends on who is signed in.
export const instant = false;

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  // Already set up: nothing to do here.
  if (await findTenantByOwner(user.id)) redirect("/dashboard");

  return (
    <AuthShell>
      <StepIndicator steps={["Տվյալներ", "Կոդ", "Բիզնես"]} current={3} />
      <h1 className="animate-rise mt-8 text-[2.1rem] leading-tight font-semibold tracking-tight text-balance sm:text-[2.5rem]">
        Ի՞նչ եք վաճառում
      </h1>
      <p className="mt-3 text-muted-foreground">
        Ընտրությունից կախված՝ Mardouk-ը կհարմարվի ձեր բիզնեսին։
      </p>
      {/* The company name was entered at registration; it can still be corrected here. */}
      <div className="mt-8">
        <OnboardingForm
          defaultName={
            typeof user.user_metadata?.company_name === "string"
              ? user.user_metadata.company_name
              : ""
          }
        />
      </div>
    </AuthShell>
  );
}
