import type { ReactNode } from "react";
import { Bell, Check, Lock, Menu, Minus, Plus } from "lucide-react";
import { cn } from "cn";
import { formatMoney, formatNumber } from "@/lib/format";
import { BearArt, StatusBar } from "./devices";
import { NumaMark } from "@/components/brand/numa-logo";
import { easeOut, lerp, progress, typed, within } from "./timeline";

/**
 * One illustrative sale, shown on two phones: the customer orders a plush
 * bear through a product link, and the shop owner sees the order, the stock
 * and the profit change, then marks it delivered and the customer gets an
 * email. Used by the landing hero and the sign-in pages.
 */

// Milliseconds into the loop at which each beat happens.
export const T = {
  qty: 900,
  name: [1400, 2500],
  phone: [2700, 3600],
  address: [3800, 4800],
  press: 5150,
  success: 5750,
  send: [5750, 6700],
  banner: 6700,
  bannerOut: 8700,
  stock: 7500,
  profit: [8100, 9400],
  tap: 10100,
  delivered: 10500,
  reply: [10600, 11600],
  email: 11600,
  end: 15500,
} as const;

/** Without motion: the moment where every part of the story is visible. */
export const FROZEN = T.email + 900;

const NAME = "Անի Մարտիրոսյան";
const PHONE = "094 12 34 56";
const ADDRESS = "Կոմիտաս 12, բն. 8";
const PRICE = 9900;
const SALE_PRICE = 8415; // 15% off through the link

/** Everything both phones show at moment `t`. */
export function saleStateAt(t: number) {
  const arrived = t >= T.banner;
  return {
    customer: {
      qty: t >= T.qty ? 2 : 1,
      name: typed(t, T.name, NAME),
      phone: typed(t, T.phone, PHONE),
      address: typed(t, T.address, ADDRESS),
      field: within(t, T.name[0], T.name[1] + 200)
        ? ("name" as const)
        : within(t, T.phone[0], T.phone[1] + 200)
          ? ("phone" as const)
          : within(t, T.address[0], T.address[1] + 200)
            ? ("address" as const)
            : null,
      // The checkout page scrolls as the customer moves down the form.
      scroll: t < T.phone[0] - 200 ? 0 : t < T.address[0] - 200 ? 72 : 146,
      pressed: t >= T.press,
      success: t >= T.success,
      emailIn: t >= T.email,
      tapPlus: within(t, T.qty - 250, T.qty + 400),
      tapOrder: within(t, T.press - 200, T.press + 450),
    },
    owner: {
      arrived,
      fresh: within(t, T.banner, T.banner + 2400),
      banner: within(t, T.banner, T.bannerOut),
      delivered: t >= T.delivered,
      tapStatus: within(t, T.tap, T.tap + 500),
      ordersToday: arrived ? 4 : 3,
      salesToday: arrived
        ? lerp(41250, 58080, easeOut(progress(t, [T.banner, T.banner + 700])))
        : 41250,
      flashToday: within(t, T.banner, T.banner + 900),
      stockUpdated: t >= T.stock,
      flashStock: within(t, T.stock, T.stock + 1100),
      profit: lerp(412750, 422380, easeOut(progress(t, T.profit))),
      profitDelta: t >= T.profit[0],
    },
    /** The owner's phone buzzes as the order lands. */
    buzz: within(t, T.banner, T.banner + 550),
  };
}

// ── The customer's phone: our real checkout page ──────────────

export function CustomerScreen({
  qty,
  name,
  phone,
  address,
  field,
  scroll,
  pressed,
  success,
  emailIn,
  tapPlus,
  tapOrder,
}: {
  qty: number;
  name: string;
  phone: string;
  address: string;
  field: "name" | "phone" | "address" | null;
  scroll: number;
  pressed: boolean;
  success: boolean;
  emailIn: boolean;
  tapPlus: boolean;
  tapOrder: boolean;
}) {
  return (
    <div className="relative flex h-full flex-col bg-white text-foreground">
      <StatusBar />

      {/* The email the customer receives when the order is delivered */}
      <div
        className={cn(
          "absolute inset-x-2 top-9 z-20 rounded-2xl bg-white/95 p-3 shadow-[0_14px_34px_-12px_rgb(20_20_22/0.4)] ring-1 ring-black/5 backdrop-blur transition-all duration-500",
          emailIn ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0",
        )}
      >
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <NumaMark className="size-4" />
          Էլ. նամակ, հիմա
        </span>
        <span className="mt-1 block text-[12px] font-semibold">
          Ձեր պատվերն առաքված է
        </span>
        <span className="block text-[11px] text-muted-foreground">
          Բարև, Անի։ Պատվեր #A4F2-ը ճանապարհին է։
        </span>
      </div>

      <div className="mx-3 flex shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-3 py-1.5 text-[10px] text-muted-foreground">
        <Lock className="size-2.5" />
        numa.am/checkout/…
      </div>

      {success ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-6 text-center">
          <span className="success-pop flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="size-7" strokeWidth={2.5} />
          </span>
          <span className="mt-4 text-[15px] font-semibold">
            Պատվերն ընդունված է
          </span>
          <span className="mt-1 text-[12px] text-muted-foreground">
            Շուտով կկապվենք ձեզ հետ՝ առաքումը հաստատելու համար։
          </span>
          <span className="mt-5 flex w-full items-center gap-2.5 rounded-2xl bg-muted p-2.5 text-left">
            <span className="flex size-10 shrink-0 items-end justify-center overflow-hidden rounded-xl bg-[#f4ece2]">
              <BearArt className="h-9" />
            </span>
            <span className="min-w-0 flex-1 text-[11px]">
              <span className="block truncate font-semibold">
                Փափուկ արջուկ × 2
              </span>
              <span className="block text-muted-foreground">
                Առաքումն անվճար է
              </span>
            </span>
            <span className="text-[12px] font-semibold tabular-nums">
              16 830 ֏
            </span>
          </span>
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="px-3 pt-2 pb-6 transition-transform duration-700 ease-out"
            style={{ transform: `translateY(-${scroll}px)` }}
          >
            <div className="relative flex h-[8.5rem] items-end justify-center overflow-hidden rounded-2xl bg-[#f4ece2]">
              <BearArt className="h-[8.25rem]" />
              <span className="absolute top-2 left-2 rounded-full bg-[#185aef] px-2 py-0.5 text-[10px] font-semibold text-white">
                −15%
              </span>
            </div>
            <span className="mt-2.5 block text-[10px] text-muted-foreground">
              Փափուկ աշխարհ
            </span>
            <span className="block text-[14px] leading-tight font-semibold">
              Փափուկ արջուկ, 40 սմ
            </span>
            <span className="mt-0.5 flex items-baseline gap-1.5 text-[15px] font-semibold tabular-nums">
              {formatMoney(SALE_PRICE)}
              <s className="text-[11px] font-normal text-muted-foreground">
                {formatMoney(PRICE)}
              </s>
            </span>

            <span className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Քանակ</span>
              <span className="flex items-center gap-1.5">
                <StepButton>
                  <Minus className="size-3" />
                </StepButton>
                <span className="w-6 text-center text-[13px] font-semibold tabular-nums">
                  {qty}
                </span>
                <StepButton tap={tapPlus}>
                  <Plus className="size-3" />
                </StepButton>
              </span>
            </span>

            <FakeField
              label="Անուն Ազգանուն"
              value={name}
              active={field === "name"}
            />
            <FakeField
              label="Հեռախոս"
              value={phone}
              active={field === "phone"}
            />
            <FakeField
              label="Հասցե"
              value={address}
              active={field === "address"}
            />

            <span className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 rounded-xl bg-muted px-3 py-2 text-[11px] tabular-nums">
              <span className="text-muted-foreground">
                {formatMoney(PRICE)} × {qty}
              </span>
              <span className="text-right">{formatMoney(PRICE * qty)}</span>
              <span className="text-muted-foreground">Զեղչ 15%</span>
              <span className="text-right">
                −{formatMoney((PRICE - SALE_PRICE) * qty)}
              </span>
              <span className="text-muted-foreground">Առաքում</span>
              <span className="text-right">Անվճար</span>
              <span className="mt-1 border-t pt-1 font-semibold">Ընդամենը</span>
              <span className="mt-1 border-t pt-1 text-right font-semibold">
                {formatMoney(SALE_PRICE * qty)}
              </span>
            </span>

            <span
              className={cn(
                "relative mt-3 flex h-10 items-center justify-center overflow-hidden rounded-xl bg-primary text-[13px] font-medium text-white transition-transform duration-200",
                pressed && "scale-[0.97]",
              )}
            >
              {pressed ? "Ուղարկվում է…" : "Պատվիրել"}
              {tapOrder && <span className="tap-ripple" />}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StepButton({ children, tap }: { children: ReactNode; tap?: boolean }) {
  return (
    <span className="relative flex size-7 items-center justify-center rounded-lg border bg-white">
      {children}
      {tap && <span className="tap-ripple" />}
    </span>
  );
}

function FakeField({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <span className="mt-2 block">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "mt-0.5 flex h-[30px] items-center rounded-lg border px-2.5 text-[12px] transition-[border-color,box-shadow] duration-300",
          active
            ? "border-[#185aef] shadow-[0_0_0_3px_rgb(24_90_239/0.18)]"
            : "border-border",
        )}
      >
        <span className={cn("truncate", active && "field-caret")}>{value}</span>
      </span>
    </span>
  );
}

// ── The owner's phone: the orders page of the app ─────────────

type Status = "new" | "confirmed" | "completed";

const STATUS_STYLE: Record<Status, string> = {
  new: "bg-amber-100 text-amber-900",
  confirmed: "bg-blue-100 text-blue-900",
  completed: "bg-emerald-100 text-emerald-900",
};
const STATUS_LABEL: Record<Status, string> = {
  new: "Նոր",
  confirmed: "Հաստատված",
  completed: "Առաքված",
};

export function OwnerScreen({
  arrived,
  fresh,
  banner,
  delivered,
  tapStatus,
  ordersToday,
  salesToday,
  flashToday,
  stockUpdated,
  flashStock,
  profit,
  profitDelta,
}: {
  arrived: boolean;
  fresh: boolean;
  banner: boolean;
  delivered: boolean;
  tapStatus: boolean;
  ordersToday: number;
  salesToday: number;
  flashToday: boolean;
  stockUpdated: boolean;
  flashStock: boolean;
  profit: number;
  profitDelta: boolean;
}) {
  return (
    <div className="relative flex h-full flex-col bg-[#eef0f3] text-foreground">
      <StatusBar />

      {/* Push notification: a new order */}
      <div
        className={cn(
          "absolute inset-x-2 top-9 z-20 flex items-center gap-2.5 rounded-2xl bg-primary px-3 py-2.5 text-white shadow-lg transition-all duration-500",
          banner ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0",
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Bell className="size-3.5 text-[#fed740]" />
        </span>
        <span className="min-w-0 text-[11px] leading-tight">
          <span className="block font-semibold">Նոր պատվեր՝ 16 830 ֏</span>
          <span className="block truncate opacity-70">
            Անի Մ., Փափուկ արջուկ × 2
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between px-4 pt-1 pb-2.5">
        <span className="flex items-center gap-2 text-[14px] font-semibold">
          <Menu className="size-4" />
          Պատվերներ
        </span>
        <span className="relative flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
          Փ
          {arrived && !delivered && (
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#eef0f3] bg-[#185aef]" />
          )}
        </span>
      </div>

      <div className="mx-3 grid grid-cols-2 gap-2">
        <MiniStat
          label="Պատվեր այսօր"
          value={formatNumber(ordersToday)}
          flash={flashToday}
        />
        <MiniStat
          label="Վաճառք այսօր"
          value={formatMoney(Math.round(salesToday / 10) * 10)}
          flash={flashToday}
        />
      </div>

      <div className="mx-3 mt-2 flex flex-col gap-1.5">
        {arrived && (
          <OrderCard
            name="Անի Մ."
            item="Փափուկ արջուկ × 2"
            source="Instagram DM"
            total="16 830 ֏"
            status={delivered ? "completed" : "new"}
            fresh={fresh}
            tap={tapStatus}
          />
        )}
        <OrderCard
          name="Գոռ Հ."
          item="Կավե կենդանիներ"
          source="Meta Ads"
          total="7 400 ֏"
          status="confirmed"
        />
        <OrderCard
          name="Լիլիթ Ա."
          item="Խաղալիք-բարձ"
          source="Instagram DM"
          total="12 500 ֏"
          status="completed"
        />
      </div>

      <div className="mx-3 mt-2 rounded-2xl bg-white p-3">
        <span className="text-[10px] text-muted-foreground">Պահեստ</span>
        <StockRow
          label="Փափուկ արջուկ"
          value={stockUpdated ? 22 : 24}
          of={60}
          flash={flashStock}
        />
        <StockRow
          label="Տոպրակ"
          value={stockUpdated ? 38 : 40}
          of={120}
          flash={flashStock}
        />
      </div>

      <div className="mx-3 mt-2 rounded-2xl bg-primary p-3 text-white">
        <span className="flex items-center justify-between text-[10px]">
          <span className="opacity-70">Մաքուր շահույթ, հոկտեմբեր</span>
          {profitDelta && (
            <span className="delta-in rounded-full bg-emerald-400/15 px-1.5 py-0.5 font-semibold text-emerald-300">
              +9 630 ֏
            </span>
          )}
        </span>
        <span className="mt-1 block text-[22px] font-semibold tracking-tight tabular-nums">
          {formatMoney(Math.round(profit / 10) * 10)}
        </span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  flash,
}: {
  label: string;
  value: string;
  flash: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-xl px-2.5 py-2 transition-colors duration-500",
        flash ? "bg-[#e8efff]" : "bg-white",
      )}
    >
      <span className="block text-[9.5px] text-muted-foreground">{label}</span>
      <span className="block text-[14px] font-semibold tabular-nums">
        {value}
      </span>
    </span>
  );
}

function OrderCard({
  name,
  item,
  source,
  total,
  status,
  fresh,
  tap,
}: {
  name: string;
  item: string;
  source: string;
  total: string;
  status: Status;
  fresh?: boolean;
  tap?: boolean;
}) {
  return (
    <span
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-white px-3 py-2 transition-shadow duration-700",
        fresh && "order-in shadow-[0_0_0_2px_#fed740]",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold">{name}</span>
        <span className="block truncate text-[10px] text-muted-foreground">
          {item}, {source}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className="text-[12px] font-semibold tabular-nums">{total}</span>
        <span
          className={cn(
            "relative rounded-full px-2 py-0.5 text-[9.5px] font-medium transition-colors duration-500",
            STATUS_STYLE[status],
          )}
        >
          {STATUS_LABEL[status]}
          {tap && <span className="tap-ripple" />}
        </span>
      </span>
    </span>
  );
}

function StockRow({
  label,
  value,
  of,
  flash,
}: {
  label: string;
  value: number;
  of: number;
  flash: boolean;
}) {
  return (
    <span className="mt-2 block">
      <span className="flex items-baseline justify-between text-[11px]">
        <span className="flex items-center gap-1.5">
          {label}
          {flash && (
            <span className="delta-in text-[10px] font-semibold text-amber-700">
              −2
            </span>
          )}
        </span>
        <span
          className={cn(
            "rounded px-1 font-semibold tabular-nums transition-colors duration-500",
            flash && "bg-amber-100 text-amber-900",
          )}
        >
          {value}
        </span>
      </span>
      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-[#185aef] transition-[width] duration-700"
          style={{ width: `${(value / of) * 100}%` }}
        />
      </span>
    </span>
  );
}
