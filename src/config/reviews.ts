export type Review = {
  /** The person's name, as they agreed to be shown. */
  name: string;
  /** Their business, e.g. "Արևիկ Խաղալիքներ". */
  business: string;
  /** Their own words. */
  text: string;
};

/**
 * Customer reviews shown on the landing page. The section stays hidden while
 * this list is empty. Add only real reviews from real customers who agreed to
 * be quoted: invented testimonials mislead visitors and are illegal to publish
 * as genuine in many countries.
 */
export const REVIEWS: Review[] = [];
