import { loadFont as loadArmenian } from "@remotion/google-fonts/NotoSansArmenian";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";

const outfit = loadOutfit("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const armenian = loadArmenian("normal", { weights: ["400", "500", "600"], subsets: ["armenian"] });

/** Same tokens as the app (src/app/globals.css). */
export const theme = {
  font: `${outfit.fontFamily}, ${armenian.fontFamily}, sans-serif`,
  paper: "#eef0f3",
  card: "#ffffff",
  ink: "#141416",
  mist: "#72747d",
  line: "#e6e7eb",
  muted: "#f2f3f5",
  accent: "#c9bcff",
  peach: "#fde8cd",
  mint: "#d5f0e3",
  green: "#d1fae5",
  greenInk: "#064e3b",
};

/** The mock app window, in its own pixel space; the camera moves over it. */
export const CANVAS = { width: 1400, height: 900 };
