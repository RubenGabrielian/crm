/**
 * Scene lengths in frames (30 fps). They follow the voice-over script in
 * remotion/voiceover-timing.md; change both together.
 */
export const FPS = 30;

export const SCENES = {
  hook: 90, //     0–3 s
  pain: 90, //     3–6 s
  turn: 60, //     6–8 s
  link: 120, //    8–12 s
  checkout: 120, // 12–16 s
  owner: 90, //   16–19 s
  stock: 90, //   19–22 s
  profit: 120, // 22–26 s
  cta: 120, //    26–30 s
} as const;

export const DURATION = Object.values(SCENES).reduce((sum, frames) => sum + frames, 0);
