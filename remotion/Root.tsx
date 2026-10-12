import { Composition } from "remotion";
import { Promo } from "./Promo";
import { DURATION, FPS } from "./timeline";

/** Every size renders the same animation; the camera adapts to the frame. */
export function RemotionRoot() {
  return (
    <>
      <Composition id="Promo" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
      <Composition id="PromoFeed" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1350} />
      <Composition id="PromoSquare" component={Promo} durationInFrames={DURATION} fps={FPS} width={1080} height={1080} />
    </>
  );
}
