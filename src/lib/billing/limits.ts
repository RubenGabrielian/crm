/** The pay page every upgrade prompt links to. */
export const BILLING_PATH = "/billing";

/** Pages a free account uses fully; every other app page is shown as a demo. */
export const FREE_PATHS = ["/catalog", "/orders", "/expenses", BILLING_PATH];

/** How many expenses (one-off and monthly together) a free account can add. */
export const FREE_EXPENSE_LIMIT = 2;
