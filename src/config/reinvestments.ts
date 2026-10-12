export const REINVESTMENT_STATUSES = ["planned", "in_progress", "done"] as const;
export type ReinvestmentStatus = (typeof REINVESTMENT_STATUSES)[number];

export const REINVESTMENT_STATUS_LABELS: Record<ReinvestmentStatus, string> = {
  planned: "Պլանավորված",
  in_progress: "Ընթացքում",
  done: "Ավարտված",
};

export function isReinvestmentStatus(value: unknown): value is ReinvestmentStatus {
  return REINVESTMENT_STATUSES.includes(value as ReinvestmentStatus);
}
