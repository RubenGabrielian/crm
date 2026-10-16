import { AuthShell } from "@/components/auth/auth-shell";

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return <AuthShell>{children}</AuthShell>;
}
