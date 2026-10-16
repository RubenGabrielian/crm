import "./style.css";
import type { CSSProperties } from "react";
import { AbsoluteFill, Series } from "remotion";
import { loadFont as loadArmenian } from "@remotion/google-fonts/NotoSansArmenian";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { CheckoutScene } from "./scenes/checkout";
import { CtaScene } from "./scenes/cta";
import { HookScene } from "./scenes/hook";
import { LinkScene } from "./scenes/link";
import { OwnerScene } from "./scenes/owner";
import { PainScene } from "./scenes/pain";
import { ProfitScene } from "./scenes/profit";
import { StockScene } from "./scenes/stock";
import { TurnScene } from "./scenes/turn";
import { SCENES } from "./timeline";

const outfit = loadOutfit("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
const armenian = loadArmenian("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["armenian"],
});

/**
 * The 30-second ad. Scene lengths come from timeline.ts and match the
 * voice-over script (voiceover-timing.md). The same component renders 9:16,
 * 4:5 and 1:1; each scene lays itself out for the frame it is given.
 */
export function Promo() {
  return (
    <AbsoluteFill
      className="font-sans text-foreground antialiased"
      style={
        {
          "--font-outfit": outfit.fontFamily,
          "--font-noto-armenian": armenian.fontFamily,
        } as CSSProperties
      }
    >
      <Series>
        <Series.Sequence durationInFrames={SCENES.hook} name="1 Hook">
          <HookScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.pain} name="2 Pain">
          <PainScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.turn} name="3 Turn">
          <TurnScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.link} name="4 Sale link">
          <LinkScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.checkout} name="5 Customer orders">
          <CheckoutScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.owner} name="6 You see it">
          <OwnerScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.stock} name="7 Stock">
          <StockScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.profit} name="8 Profit">
          <ProfitScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.cta} name="9 Call to action">
          <CtaScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
