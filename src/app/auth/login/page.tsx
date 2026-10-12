import type { Metadata } from "next";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

export const metadata: Metadata = { title: "Մուտք" };

export default async function LoginPage({ searchParams }: PageProps<"/auth/login">) {
  const { error } = await searchParams;
  return <EmailAuthForm mode="login" linkFailed={error === "link"} />;
}
