import type { Metadata } from "next";
import { EmailAuthForm } from "@/components/auth/email-auth-form";

export const metadata: Metadata = { title: "Գրանցում" };

export default function RegisterPage() {
  return <EmailAuthForm mode="register" />;
}
