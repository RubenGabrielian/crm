"use client";

import type { ReactNode } from "react";
import {
  Bell,
  Check,
  Cloud,
  Link2,
  Mail,
  MessageSquareText,
  PackagePlus,
  Shapes,
  ShoppingBag,
} from "lucide-react";
import { cn } from "cn";
import { formatMoney, formatNumber } from "@/lib/format";
import { BearArt, BrowserFrame, DemoStage, PlayToggle } from "./devices";
import { easeOut, progress, typed, within } from "./timeline";
import { useLoopClock } from "./use-loop-clock";

/**
 * Four small, scripted walkthroughs of real screens of the app, one per
 * feature on the landing page. Names and numbers are illustrative.
 */

// ── Shared bits ───────────────────────────────────────────────

function DemoShell({
  tint,
  playing,
  onToggle,
  showToggle,
  overlay,
  children,
}: {
  tint: string;
  playing: boolean;
  onToggle: () => void;
  showToggle: boolean;
  /** Something that floats over the window's edge, like a phone message. */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <DemoStage tint={tint}>
        <div aria-hidden>{children}</div>
        {overlay}
      </DemoStage>
      {showToggle && (
        <div className="mt-3 flex justify-end">
          <PlayToggle playing={playing} onToggle={onToggle} />
        </div>
      )}
    </div>
  );
}

function AppHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[15px] font-semibold">{title}</span>
      <span className="flex items-center gap-2">{children}</span>
    </div>
  );
}

function Toast({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[11px] font-medium whitespace-nowrap text-white shadow-lg transition-all duration-400",
        show ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      {children}
    </span>
  );
}

function Ripple({ show }: { show: boolean }) {
  return show ? <span className="tap-ripple" /> : null;
}

// ── 1. The product link, with a sale and free delivery ────────

const L = {
  click: 800,
  open: 1050,
  sale: [1500, 1950],
  delivery: [2400, 2800],
  copy: 3500,
  copied: 3700,
  close: 5100,
  dm: 5300,
  end: 9200,
} as const;

/** `time` drives the demo from outside (the promo video); otherwise it runs on its own clock. */
export function LinkDemo({ time }: { time?: number } = {}) {
  const {
    ref,
    t: clockT,
    playing,
    setPlaying,
    reduced,
  } = useLoopClock({
    manual: time !== undefined,
    end: L.end,
    frozen: L.copied + 400,
  });
  const t = time ?? clockT;
  const open = within(t, L.open, L.close);
  const saleText = typed(t, L.sale, "15");
  const sale = Number(saleText || 0);
  const deliveryText =
    t < L.delivery[0] ? "1 000" : t < L.delivery[0] + 250 ? "" : "0";
  const delivery =
    deliveryText === "" ? null : Number(deliveryText.replace(/\s/g, ""));
  const salePrice = Math.round(9900 * (100 - sale)) / 100;
  const field = within(t, L.sale[0] - 150, L.sale[1] + 350)
    ? "sale"
    : within(t, L.delivery[0] - 150, L.delivery[1] + 350)
      ? "delivery"
      : null;
  const copied = t >= L.copied;

  return (
    <div ref={ref}>
      <DemoShell
        tint="bg-[#f0f5ff]"
        playing={playing}
        onToggle={() => setPlaying((value) => !value)}
        showToggle={!reduced && time === undefined}
        overlay={
          <div
            aria-hidden
            className={cn(
              "absolute -right-1 -bottom-8 w-[14.5rem] rounded-2xl bg-white p-3 shadow-[0_24px_50px_-18px_rgb(20_20_22/0.45)] ring-1 ring-black/5 transition-all duration-500 sm:-right-5",
              t >= L.dm
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0",
            )}
          >
            <span className="flex items-center gap-2 text-[11px]">
              <span className="size-6 rounded-full bg-[linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)] p-[2px]">
                <span className="flex size-full items-center justify-center rounded-full bg-white text-[9px] font-semibold">
                  Ա
                </span>
              </span>
              <span className="font-semibold">Անի Մ.</span>
              <span className="text-muted-foreground">DM</span>
            </span>
            <span className="mt-2 ml-auto block w-fit rounded-2xl rounded-br-md bg-[#185aef] px-3 py-1.5 text-[11px] text-white">
              Ահա հղումը՝ 15% զեղչով
            </span>
            <span className="mt-1.5 ml-auto flex w-[90%] items-center gap-2 rounded-xl border bg-white p-1.5">
              <span className="flex size-8 shrink-0 items-end justify-center overflow-hidden rounded-lg bg-[#f4ece2]">
                <BearArt className="h-7" />
              </span>
              <span className="min-w-0 text-[10px]">
                <span className="block truncate font-semibold">
                  Փափուկ արջուկ
                </span>
                <span className="block text-muted-foreground">
                  8 415 ֏, անվճար առաքում
                </span>
              </span>
            </span>
          </div>
        }
      >
        <BrowserFrame url="numa.am/catalog">
          <div className="relative h-[21rem] bg-[#eef0f3] p-3 @sm:p-4">
            <AppHeader title="Ապրանքներ">
              <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-white">
                + Ապրանք
              </span>
            </AppHeader>
            <div className="mt-3 flex flex-col gap-1 rounded-2xl bg-white p-1.5">
              <ProductRow
                art={<BearArt className="h-9" />}
                title="Փափուկ արջուկ, 40 սմ"
                stock="22 հատ"
                price="9 900 ֏"
                highlight
                tap={within(t, L.click - 200, L.click + 450)}
              />
              <ProductRow
                art={<Shapes className="size-4 text-[#b5653c]" />}
                tone="bg-[#fbe6d8]"
                title="Կավե կենդանիներ"
                stock="11 հատ"
                price="7 400 ֏"
              />
              <ProductRow
                art={<Cloud className="size-4 text-[#5b7fd6]" />}
                tone="bg-[#e3ecff]"
                title="Խաղալիք-բարձ"
                stock="8 հատ"
                price="12 500 ֏"
              />
            </div>

            {/* The copy-link dialog */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-[#141416]/25 p-3 transition-opacity duration-300",
                open ? "opacity-100" : "opacity-0",
              )}
            >
              <div
                className={cn(
                  "w-full max-w-[17.5rem] rounded-2xl bg-white p-4 shadow-xl transition-transform duration-300",
                  open ? "scale-100" : "scale-95",
                )}
              >
                <span className="block text-[13px] font-semibold">
                  Վճարման հղում
                </span>
                <span className="block text-[10.5px] text-muted-foreground">
                  Փափուկ արջուկ, 40 սմ
                </span>
                <span className="mt-3 grid grid-cols-2 gap-2">
                  <MiniInput
                    label="Զեղչ, %"
                    value={saleText}
                    active={field === "sale"}
                  />
                  <MiniInput
                    label="Առաքում (֏)"
                    value={deliveryText}
                    active={field === "delivery"}
                  />
                </span>
                <span className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 rounded-xl bg-muted px-3 py-2 text-[11px] tabular-nums">
                  <span className="text-muted-foreground">Գինը հղումով</span>
                  <span className="text-right">
                    {sale > 0 && (
                      <s className="mr-1 text-muted-foreground">9 900 ֏</s>
                    )}
                    {formatMoney(salePrice)}
                  </span>
                  <span className="text-muted-foreground">Առաքում</span>
                  <span className="text-right">
                    {delivery === null
                      ? "—"
                      : delivery > 0
                        ? formatMoney(delivery)
                        : "Անվճար"}
                  </span>
                  <span className="mt-1 border-t pt-1 font-semibold">
                    Ընդամենը
                  </span>
                  <span className="mt-1 border-t pt-1 text-right font-semibold">
                    {formatMoney(salePrice + (delivery ?? 1000))}
                  </span>
                </span>
                <span
                  className={cn(
                    "relative mt-3 flex h-9 items-center justify-center gap-1.5 overflow-hidden rounded-xl text-[12px] font-medium text-white transition-colors duration-300",
                    copied ? "bg-emerald-600" : "bg-primary",
                  )}
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Link2 className="size-3.5" />
                  )}
                  {copied ? "Պատճենվեց" : "Պատճենել հղումը"}
                  <Ripple show={within(t, L.copy - 200, L.copy + 450)} />
                </span>
              </div>
            </div>

            <Toast show={within(t, L.copied, L.close + 700)}>
              <Check className="size-3.5 text-emerald-400" />
              Հղումը պատճենվեց
            </Toast>
          </div>
        </BrowserFrame>
      </DemoShell>
    </div>
  );
}

function ProductRow({
  art,
  tone = "bg-[#f4ece2]",
  title,
  stock,
  price,
  highlight,
  tap,
}: {
  art: ReactNode;
  tone?: string;
  title: string;
  stock: string;
  price: string;
  highlight?: boolean;
  tap?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-3 rounded-xl px-2 py-2",
        highlight && "bg-[#f0f5ff]",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg",
          tone,
          highlight && "items-end",
        )}
      >
        {art}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold">
          {title}
        </span>
        <span className="block text-[10.5px] text-muted-foreground">
          {stock}
        </span>
      </span>
      <span className="hidden text-[12px] font-semibold tabular-nums @sm:block">
        {price}
      </span>
      <span className="relative flex shrink-0 items-center gap-1 rounded-lg border bg-white px-2 py-1.5 text-[10.5px] font-medium">
        <Link2 className="size-3" />
        <span className="hidden @md:inline">Պատճենել հղումը</span>
        <span className="@md:hidden">Հղում</span>
        <Ripple show={!!tap} />
      </span>
    </span>
  );
}

function MiniInput({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <span className="block">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          "mt-0.5 flex h-8 items-center rounded-lg border px-2.5 text-[12px] tabular-nums transition-[border-color,box-shadow] duration-300",
          active
            ? "border-[#185aef] shadow-[0_0_0_3px_rgb(24_90_239/0.18)]"
            : "border-border",
        )}
      >
        <span className={cn(active && "field-caret")}>{value}</span>
      </span>
    </span>
  );
}

// ── 2. Orders: status, payment and a comment, from the table ─

type Status = "new" | "confirmed" | "completed";

const STATUS: Record<Status, { label: string; tone: string }> = {
  new: { label: "Նոր", tone: "bg-amber-100 text-amber-900" },
  confirmed: { label: "Հաստատված", tone: "bg-blue-100 text-blue-900" },
  completed: { label: "Առաքված", tone: "bg-emerald-100 text-emerald-900" },
};

const O = {
  arrive: 600,
  openMenu: 1900,
  hover: 2350,
  pick: 2750,
  toastOut: 4300,
  pay: 4000,
  method: 4500,
  comment: [5300, 6600],
  end: 10000,
} as const;

const ORDER_ROWS: {
  name: string;
  item: string;
  total: string;
  status: Status;
  paid: boolean;
  method: string;
}[] = [
  {
    name: "Գոռ Հ.",
    item: "Կավե կենդանիներ",
    total: "7 400 ֏",
    status: "confirmed",
    paid: true,
    method: "Քարտով",
  },
  {
    name: "Լիլիթ Ա.",
    item: "Խաղալիք-բարձ",
    total: "12 500 ֏",
    status: "completed",
    paid: true,
    method: "Փոխանցում",
  },
  {
    name: "Մարիամ Ս.",
    item: "Փափուկ արջուկ",
    total: "8 415 ֏",
    status: "new",
    paid: false,
    method: "Կանխիկ",
  },
];

/** `time` drives the demo from outside (the promo video); otherwise it runs on its own clock. */
export function OrdersDemo({ time }: { time?: number } = {}) {
  const {
    ref,
    t: clockT,
    playing,
    setPlaying,
    reduced,
  } = useLoopClock({
    manual: time !== undefined,
    end: O.end,
    frozen: O.comment[1] + 400,
  });
  const t = time ?? clockT;
  const arrived = t >= O.arrive;
  const picked = t >= O.pick;
  const menuOpen = within(t, O.openMenu, O.pick + 250);
  const comment = typed(t, O.comment, "Առաքել վաղը՝ 18:00-ից հետո");

  return (
    <div ref={ref}>
      <DemoShell
        tint="bg-[#fff4e8]"
        playing={playing}
        onToggle={() => setPlaying((value) => !value)}
        showToggle={!reduced && time === undefined}
      >
        <BrowserFrame url="numa.am/orders">
          <div className="relative h-[21.5rem] bg-[#eef0f3] p-3 @sm:p-4">
            <AppHeader title="Պատվերներ">
              <span className="relative flex size-8 items-center justify-center rounded-full bg-white">
                <Bell className="size-4" />
                {arrived && !picked && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#185aef] text-[9px] font-semibold text-white">
                    1
                  </span>
                )}
              </span>
              <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-white">
                + Պատվեր
              </span>
            </AppHeader>

            <div className="mt-3 rounded-2xl bg-white p-1.5">
              <span className="grid grid-cols-[minmax(0,1fr)_auto_7.5rem] gap-2.5 rounded-lg bg-muted/70 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                <span>Հաճախորդ</span>
                <span>Ընդամենը</span>
                <span className="text-right">Կարգավիճակ, վճարում</span>
              </span>
              {arrived && (
                <OrderRow
                  fresh
                  name="Անի Մ."
                  item="Փափուկ արջուկ × 2"
                  total="16 830 ֏"
                  status={picked ? "completed" : "new"}
                  paid={t >= O.pay}
                  method={t >= O.method ? "POS" : "Նշված չէ"}
                  comment={t >= O.comment[0] ? comment : null}
                  commentTyping={within(t, O.comment[0], O.comment[1] + 300)}
                  tapStatus={within(t, O.openMenu - 200, O.openMenu + 450)}
                  tapPay={within(t, O.pay - 200, O.pay + 450)}
                  menu={
                    menuOpen ? (
                      <span className="pop-in absolute top-full right-0 z-20 mt-1 flex w-28 flex-col rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5">
                        {(["new", "confirmed", "completed"] as const).map(
                          (value) => (
                            <span
                              key={value}
                              className={cn(
                                "relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10.5px]",
                                value === "completed" &&
                                  t >= O.hover &&
                                  "bg-muted font-medium",
                              )}
                            >
                              <span
                                className={cn(
                                  "size-2 rounded-full",
                                  STATUS[value].tone,
                                )}
                              />
                              {STATUS[value].label}
                              {value === "completed" && (
                                <Ripple
                                  show={within(t, O.pick - 150, O.pick + 400)}
                                />
                              )}
                            </span>
                          ),
                        )}
                      </span>
                    ) : null
                  }
                />
              )}
              {ORDER_ROWS.map((row) => (
                <OrderRow key={row.name} {...row} />
              ))}
            </div>

            <Toast show={within(t, O.pick + 150, O.toastOut)}>
              <Mail className="size-3.5 text-[#fed740]" />
              Նամակ ուղարկվեց Անիին՝ «Առաքված է»
            </Toast>
          </div>
        </BrowserFrame>
      </DemoShell>
    </div>
  );
}

function OrderRow({
  name,
  item,
  total,
  status,
  paid,
  method,
  comment,
  commentTyping,
  fresh,
  tapStatus,
  tapPay,
  menu,
}: {
  name: string;
  item: string;
  total: string;
  status: Status;
  paid: boolean;
  method: string;
  comment?: string | null;
  commentTyping?: boolean;
  fresh?: boolean;
  tapStatus?: boolean;
  tapPay?: boolean;
  menu?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto_7.5rem] items-center gap-2.5 rounded-xl px-2.5 py-2",
        fresh && "order-in bg-[#f0f5ff]",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-semibold">{name}</span>
        <span className="block truncate text-[10.5px] text-muted-foreground">
          {item}
        </span>
        {comment !== undefined && comment !== null && (
          <span className="mt-1 flex max-w-full items-center gap-1 rounded-md bg-[#e8efff] px-1.5 py-0.5 text-[10px] text-[#1146c4]">
            <MessageSquareText className="size-3 shrink-0" />
            <span className={cn("truncate", commentTyping && "field-caret")}>
              {comment}
            </span>
          </span>
        )}
      </span>
      <span className="text-[12px] font-semibold tabular-nums">{total}</span>
      <span className="flex flex-col items-end gap-1">
        <span className="relative">
          <span
            className={cn(
              "relative block rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors duration-500",
              STATUS[status].tone,
            )}
          >
            {STATUS[status].label}
            <Ripple show={!!tapStatus} />
          </span>
          {menu}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[9.5px] text-muted-foreground">{method}</span>
          <span
            className={cn(
              "relative rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors duration-500",
              paid
                ? "bg-emerald-100 text-emerald-900"
                : "bg-rose-100 text-rose-900",
            )}
          >
            {paid ? "Վճարված" : "Չվճարված"}
            <Ripple show={!!tapPay} />
          </span>
        </span>
      </span>
    </span>
  );
}

// ── 3. Warehouse: every sale also uses bags, labels and filling ─

type StockKey = "bear" | "clay" | "bag" | "label" | "filling";

const STOCK_ITEMS: {
  key: StockKey;
  name: string;
  unit: string;
  of: number;
  material: boolean;
}[] = [
  { key: "bear", name: "Փափուկ արջուկ", unit: "հատ", of: 60, material: false },
  {
    key: "clay",
    name: "Կավե կենդանիներ",
    unit: "հատ",
    of: 40,
    material: false,
  },
  { key: "bag", name: "Տոպրակ", unit: "հատ", of: 120, material: true },
  { key: "label", name: "Պիտակ", unit: "հատ", of: 300, material: true },
  { key: "filling", name: "Լցոն", unit: "գ", of: 6000, material: true },
];

const STOCK_START: Record<StockKey, number> = {
  bear: 24,
  clay: 12,
  bag: 40,
  label: 64,
  filling: 1200,
};

const STOCK_EVENTS: {
  at: number;
  kind: "sale" | "receive";
  text: string;
  changes: Partial<Record<StockKey, number>>;
}[] = [
  {
    at: 900,
    kind: "sale",
    text: "Անի Մ., Փափուկ արջուկ × 2",
    changes: { bear: -2, bag: -2, label: -2, filling: -200 },
  },
  {
    at: 3100,
    kind: "sale",
    text: "Գոռ Հ., Կավե կենդանիներ",
    changes: { clay: -1, bag: -1, label: -1 },
  },
  {
    at: 5300,
    kind: "sale",
    text: "Նարե Կ., Փափուկ արջուկ × 3",
    changes: { bear: -3, bag: -3, label: -3, filling: -300 },
  },
  {
    at: 7600,
    kind: "receive",
    text: "Լցոն +5 000 գ",
    changes: { filling: 5000 },
  },
];
const STOCK_END = 10600;

/** `time` drives the demo from outside (the promo video); otherwise it runs on its own clock. */
export function StockDemo({ time }: { time?: number } = {}) {
  const {
    ref,
    t: clockT,
    playing,
    setPlaying,
    reduced,
  } = useLoopClock({
    manual: time !== undefined,
    end: STOCK_END,
    // Without motion: right after the third sale, when filling runs low.
    frozen: 6300,
  });
  const t = time ?? clockT;
  const happened = STOCK_EVENTS.filter((event) => t >= event.at);
  const values = { ...STOCK_START };
  for (const event of happened) {
    for (const [key, change] of Object.entries(event.changes)) {
      values[key as StockKey] += change;
    }
  }
  const latest = happened[happened.length - 1];
  const flashing =
    latest && within(t, latest.at, latest.at + 1200) ? latest : null;

  return (
    <div ref={ref}>
      <DemoShell
        tint="bg-[#eaf7f0]"
        playing={playing}
        onToggle={() => setPlaying((value) => !value)}
        showToggle={!reduced && time === undefined}
      >
        <BrowserFrame url="numa.am/inventory">
          <div className="overflow-hidden bg-[#eef0f3] p-3 @sm:p-4">
            <AppHeader title="Պահեստ">
              <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium">
                + Նյութ
              </span>
            </AppHeader>
            <div className="mt-3 grid gap-2 @md:grid-cols-[1.25fr_1fr]">
              <div className="rounded-2xl bg-white px-3 py-2.5">
                {[false, true].map((material) => (
                  <div
                    key={String(material)}
                    className={cn(material && "mt-2 border-t pt-2")}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {material ? "Նյութեր և փաթեթավորում" : "Ապրանքներ"}
                    </span>
                    {STOCK_ITEMS.filter(
                      (item) => item.material === material,
                    ).map((item) => {
                      const change = flashing?.changes[item.key];
                      return (
                        <StockLine
                          key={item.key}
                          name={item.name}
                          unit={item.unit}
                          value={values[item.key]}
                          of={item.of}
                          material={item.material}
                          change={change}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="hidden rounded-2xl bg-white px-3 py-2.5 @md:block">
                <span className="text-[10px] text-muted-foreground">
                  Վերջին շարժերը
                </span>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {happened
                    .slice(-3)
                    .reverse()
                    .map((event) => (
                      <li
                        key={event.at}
                        className="order-in flex items-start gap-2 rounded-xl bg-muted/70 px-2.5 py-2 text-[10.5px]"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                            event.kind === "sale"
                              ? "bg-[#e8efff] text-[#1146c4]"
                              : "bg-emerald-100 text-emerald-700",
                          )}
                        >
                          {event.kind === "sale" ? (
                            <ShoppingBag className="size-3" />
                          ) : (
                            <PackagePlus className="size-3" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {event.kind === "sale" ? "Վաճառք" : "Մուտք"}
                          </span>
                          <span className="block truncate text-muted-foreground">
                            {event.text}
                          </span>
                        </span>
                      </li>
                    ))}
                  {happened.length === 0 && (
                    <li className="px-1 py-2 text-[10.5px] text-muted-foreground">
                      Սպասում ենք առաջին վաճառքին…
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </BrowserFrame>
      </DemoShell>
    </div>
  );
}

function StockLine({
  name,
  unit,
  value,
  of,
  material,
  change,
}: {
  name: string;
  unit: string;
  value: number;
  of: number;
  material: boolean;
  change?: number;
}) {
  const share = value / of;
  const low = share < 0.15;
  return (
    <span className="block py-1.5">
      <span className="flex items-baseline justify-between gap-2 text-[11.5px]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{name}</span>
          {change !== undefined && (
            <span
              className={cn(
                "delta-in shrink-0 text-[10px] font-semibold",
                change > 0 ? "text-emerald-700" : "text-amber-700",
              )}
            >
              {change > 0 ? "+" : "−"}
              {formatNumber(Math.abs(change))}
            </span>
          )}
          {low && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 text-[9.5px] font-medium text-amber-900">
              Քիչ է մնացել
            </span>
          )}
        </span>
        <span
          className={cn(
            "shrink-0 rounded px-1 font-semibold tabular-nums transition-colors duration-500",
            change !== undefined &&
              (change > 0
                ? "bg-emerald-100 text-emerald-900"
                : "bg-amber-100 text-amber-900"),
          )}
        >
          {formatNumber(value)} {unit}
        </span>
      </span>
      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            "block h-full rounded-full transition-[width,background-color] duration-700",
            low ? "bg-amber-500" : material ? "bg-[#185aef]" : "bg-primary",
          )}
          style={{ width: `${Math.min(share, 1) * 100}%` }}
        />
      </span>
    </span>
  );
}

// ── 4. Dashboard: net profit, break-even and sources ──────────

const P = {
  count: [200, 1700],
  chart: [300, 1900],
  breakEven: [900, 2100],
  sources: [1100, 2400],
  end: 2600,
} as const;

const CHART_POINTS = [
  62, 58, 60, 50, 54, 44, 47, 40, 43, 34, 38, 30, 33, 24, 27, 20,
];
const CHART_LINE = CHART_POINTS.map(
  (y, i) => `${i === 0 ? "M" : "L"}${i * 20} ${y}`,
).join(" ");
const CHART_AREA = `${CHART_LINE} L300 90 L0 90 Z`;

const SOURCES = [
  { name: "Instagram DM", share: 64 },
  { name: "Meta Ads", share: 27 },
  { name: "Խանութ", share: 9 },
];

export function ProfitDemo({ time }: { time?: number } = {}) {
  // Plays once when it comes into view; short enough to need no pause button.
  const { ref, t: clockT } = useLoopClock({
    end: P.end,
    frozen: P.end,
    loop: false,
    manual: time !== undefined,
  });
  const t = time ?? clockT;
  const count = easeOut(progress(t, P.count));
  const chart = easeOut(progress(t, P.chart));
  const breakEven = easeOut(progress(t, P.breakEven));
  const sources = easeOut(progress(t, P.sources));
  // October in the example: 742 300 − 251 200 − 14 720 − 54 000 = 422 380.
  const sales = Math.round((742300 * count) / 10) * 10;
  const net = Math.round((422380 * count) / 10) * 10;
  const margin = Math.round(56.9 * count * 10) / 10;

  return (
    <div ref={ref}>
      <DemoShell
        tint="bg-[#ecf3ff]"
        playing={false}
        onToggle={() => {}}
        showToggle={false}
      >
        <BrowserFrame url="numa.am/dashboard">
          <div className="bg-[#eef0f3] p-3 @sm:p-4">
            <AppHeader title="Վահանակ">
              <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-medium">
                Այս ամիս
              </span>
            </AppHeader>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Kpi label="Վաճառք" value={formatMoney(sales)} />
              <Kpi label="Մաքուր շահույթ" value={formatMoney(net)} dark />
              <Kpi
                label="Շահութաբերություն"
                value={`${formatNumber(margin)}%`}
              />
            </div>
            <div className="mt-2 rounded-2xl bg-white p-3">
              <span className="text-[10.5px] text-muted-foreground">
                Վաճառքի դինամիկա
              </span>
              <svg
                viewBox="0 0 300 90"
                className="mt-2 h-20 w-full overflow-visible"
                aria-hidden
              >
                <defs>
                  <linearGradient
                    id="profit-demo-area"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#185aef" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#185aef" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={CHART_AREA}
                  fill="url(#profit-demo-area)"
                  opacity={chart}
                />
                <path
                  d={CHART_LINE}
                  fill="none"
                  stroke="#185aef"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - chart}
                />
              </svg>
              <span className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>1 հոկտ.</span>
                <span>16 հոկտ.</span>
              </span>
            </div>
            <div className="mt-2 grid gap-2 @md:grid-cols-2">
              <div className="rounded-2xl bg-white p-3">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold">
                    Զրոյական կետ
                  </span>
                  <span
                    className={cn(
                      "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 transition-opacity duration-500",
                      t >= P.breakEven[1] ? "opacity-100" : "opacity-0",
                    )}
                  >
                    Հասավ 4-ին
                  </span>
                </span>
                <span className="mt-2.5 block h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-emerald-500"
                    style={{ width: `${breakEven * 100}%` }}
                  />
                </span>
                <span className="mt-2 block text-[10.5px] text-muted-foreground">
                  Մարքեթինգը՝ 54 000 ֏, ծածկված է
                </span>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <span className="text-[11px] font-semibold">Աղբյուրներ</span>
                <span className="mt-1.5 flex flex-col gap-1.5">
                  {SOURCES.map((source) => (
                    <span
                      key={source.name}
                      className="flex items-center gap-2 text-[10.5px]"
                    >
                      <span className="w-[4.6rem] shrink-0 truncate text-muted-foreground">
                        {source.name}
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-[#185aef]"
                          style={{ width: `${source.share * sources}%` }}
                        />
                      </span>
                      <span className="w-7 text-right font-semibold tabular-nums">
                        {Math.round(source.share * sources)}%
                      </span>
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </BrowserFrame>
      </DemoShell>
    </div>
  );
}

function Kpi({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <span
      className={cn(
        "min-w-0 rounded-2xl px-2.5 py-2.5 @sm:px-3",
        dark ? "bg-primary text-white" : "bg-white",
      )}
    >
      <span
        className={cn(
          "block truncate text-[9.5px] @sm:text-[10.5px]",
          dark ? "text-white/60" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span className="mt-1 block truncate text-[12.5px] font-semibold tracking-tight tabular-nums @sm:text-[15px]">
        {value}
      </span>
    </span>
  );
}
