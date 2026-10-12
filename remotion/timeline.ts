export const FPS = 30;

/** Length of each scene in frames, in playing order. Retime the video here. */
export const SCENES = {
  hook: 78, // "Do you have a shop on Instagram?"
  excel: 108, // "You track orders in Excel?"
  chaos: 66, // "And it's all a mess?"
  intro: 66, // "Meet Mardouk"
  copyLink: 108, // owner copies the product link
  sendLink: 96, // owner sends it in a DM
  checkout: 138, // customer buys
  newOrder: 120, // owner sees the order
  dashboard: 144, // statistics
  end: 96, // call to action
} as const;

export const DURATION = Object.values(SCENES).reduce((sum, frames) => sum + frames, 0);
