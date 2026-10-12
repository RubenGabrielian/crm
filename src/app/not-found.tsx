import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-start justify-center gap-2 px-2">
      <h1 className="text-2xl font-semibold tracking-tight">Էջը չի գտնվել</h1>
      <p className="text-sm text-muted-foreground">
        Այս հասցեով էջ չկա, կամ այն հասանելի չէ ձեր բիզնեսի տեսակի համար։
      </p>
      <Link
        href="/dashboard"
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Վերադառնալ գլխավոր էջ
      </Link>
    </main>
  );
}
