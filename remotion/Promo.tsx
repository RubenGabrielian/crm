import { AbsoluteFill, Series } from "remotion";
import {
  ChaosScene,
  CheckoutScene,
  CopyLinkScene,
  DashboardScene,
  EndScene,
  ExcelScene,
  HookScene,
  IntroScene,
  NewOrderScene,
  SendLinkScene,
} from "./scenes";
import { theme } from "./theme";
import { SCENES } from "./timeline";

/**
 * The story: the problem (Instagram shop run from Excel and DMs), the product,
 * then the whole flow: copy a product link, send it, the customer buys, the
 * owner sees the order, and the dashboard shows the real profit.
 */
export function Promo() {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.paper, fontFamily: theme.font, color: theme.ink }}>
      <Series>
        <Series.Sequence durationInFrames={SCENES.hook}>
          <HookScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.excel}>
          <ExcelScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.chaos}>
          <ChaosScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.intro}>
          <IntroScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.copyLink}>
          <CopyLinkScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.sendLink}>
          <SendLinkScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.checkout}>
          <CheckoutScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.newOrder}>
          <NewOrderScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.dashboard}>
          <DashboardScene />
        </Series.Sequence>
        <Series.Sequence durationInFrames={SCENES.end}>
          <EndScene />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
}
