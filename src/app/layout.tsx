import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/** Numa brand type: Fedra Sans Arm for Armenian and Latin text. */
const fedra = localFont({
  variable: "--font-fedra",
  display: "swap",
  // Fedra draws U+058F (֏) as a pomegranate; the dram sign comes from `dram`.
  declarations: [
    { prop: "unicode-range", value: "U+0000-058E, U+0590-10FFFF" },
  ],
  src: [
    { path: "./fonts/FedraSansArm-Light.otf", weight: "300" },
    { path: "./fonts/FedraSansArm-Book.otf", weight: "400" },
    { path: "./fonts/FedraSansArm-Medium.otf", weight: "500" },
    { path: "./fonts/FedraSansArm-Demi.otf", weight: "600" },
    { path: "./fonts/FedraSansArm-Bold.otf", weight: "700" },
  ],
});

/** Numa brand numbers: Montserrat, used for the digits 0–9 only. */
const digits = localFont({
  variable: "--font-digits",
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+0030-0039" }],
  src: [
    { path: "./fonts/Montserrat-400.woff2", weight: "400" },
    { path: "./fonts/Montserrat-500.woff2", weight: "500" },
    { path: "./fonts/Montserrat-600.woff2", weight: "600" },
    { path: "./fonts/Montserrat-700.woff2", weight: "700" },
  ],
});

/** The dram sign ֏ alone, from Noto Sans Armenian (OFL). */
const dram = localFont({
  variable: "--font-dram",
  display: "swap",
  declarations: [{ prop: "unicode-range", value: "U+058F" }],
  src: [
    { path: "./fonts/Dram-400.woff2", weight: "400" },
    { path: "./fonts/Dram-600.woff2", weight: "600" },
    { path: "./fonts/Dram-700.woff2", weight: "700" },
  ],
});

export const metadata: Metadata = {
  title: "Numa",
  description: "Պատվերներ, պահեստ և մաքուր շահույթ՝ մեկ տեղում",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hy" className={`${fedra.variable} ${digits.variable} ${dram.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
