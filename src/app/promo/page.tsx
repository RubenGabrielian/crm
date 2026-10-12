import type { Metadata } from "next";
import {
  PROMO_FORMATS,
  PromoPlayer,
  type PromoFormat,
} from "@/components/promo/promo-player";

export const metadata: Metadata = {
  title: "Mardouk – գովազդային տեսանյութ",
  // A production tool, not a page for visitors or search engines.
  robots: { index: false, follow: false },
};

// The format and "clean" mode come from the URL.
export const instant = false;

export default async function PromoPage({ searchParams }: PageProps<"/promo">) {
  const params = await searchParams;
  const requested = Array.isArray(params.format) ? params.format[0] : params.format;
  const format: PromoFormat =
    requested && requested in PROMO_FORMATS ? (requested as PromoFormat) : "story";

  return <PromoPlayer format={format} clean={params.clean === "1"} />;
}
