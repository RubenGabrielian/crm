import type { Metadata } from "next";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

export const metadata: Metadata = { title: "Մուտք" };

// Reads the ?error= flag from the URL, so it is rendered per request.
export const instant = false;

export default async function LoginPage({ searchParams }: PageProps<"/auth/login">) {
  const { error } = await searchParams;
  return <EmailAuthForm mode="login" linkFailed={error === "link"} />;
}
