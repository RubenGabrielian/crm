export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">{children}</main>
  );
}
