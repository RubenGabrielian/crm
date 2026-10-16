import { Composition } from "remotion";
import { Promo } from "./Promo";
import { DURATION, FPS } from "./timeline";

/** Same 30-second ad in three shapes; every scene re-lays itself out for the frame. */
export function RemotionRoot() {
  return (
    <>
      <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
      <Composition id="PromoFeed" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1350} />
      <Composition id="PromoSquare" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1080} />
    </>
  );
}
