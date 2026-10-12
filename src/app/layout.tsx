import type { Metadata } from "next";
import { Noto_Sans_Armenian, Outfit } from "next/font/google";
import "./globals.css";

const notoArmenian = Noto_Sans_Armenian({
  variable: "--font-noto-armenian",
  subsets: ["armenian", "latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Բիզնեսի կառավարում",
  description: "Պատվերներ, հաճախորդներ և վաճառք՝ մեկ տեղում",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hy" className={`${outfit.variable} ${notoArmenian.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
