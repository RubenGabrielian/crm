"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { formatNumber } from "@/lib/format";

type Tab = {
  key: string;
  label: string;
  dot: string;
  module: string;
  title: string;
  text: string;
  points: string[];
  note: string;
  preview: React.ReactNode;
};

const TABS: Tab[] = [
  {
    key: "link",
    label: "Զեղչով հղում",
    dot: "bg-violet-500",
    module: "Պատվեր հղումով",
    title: "Զեղչն ու առաքումը՝ հենց հղման մեջ",
    text: "Պատճենելիս ընտրում եք զեղչի տոկոսը և առաքման արժեքը։ Հաճախորդը տեսնում է հին գինը՝ խաչված, և վերջնական գումարը։",
    points: [
      "Անվճար առաքում՝ մեկ թվով (0 ֏)",
      "Հղումը պաշտպանված է. URL-ը փոխելով զեղչ չի ստացվի",
      "Պատվերը պահպանվում է նույն զեղչով և առաքմամբ",
    ],
    note: "Հարմար է Story-ի ակցիաների և մշտական հաճախորդների համար։",
    preview: <LinkPreview />,
  },
  {
    key: "materials",
    label: "Նյութերի դուրսգրում",
    dot: "bg-amber-500",
    module: "Պահեստ և նյութեր",
    title: "Ամեն վաճառքից՝ նաև տոպրակ, պիտակ, լցոն",
    text: "Ապրանքի մեջ մեկ անգամ նշում եք, թե ինչ նյութեր է այն օգտագործում։ Հետո յուրաքանչյուր վաճառք և նվեր դրանք ինքն է հանում պահեստից։",
    points: [
      "Ցանկացած միավոր՝ հատ, գրամ, մետր",
      "Նյութի գինը մտնում է ապրանքի ինքնարժեքի մեջ",
      "Պատվերը ջնջելիս նյութերը վերադառնում են պահեստ",
    ],
    note: "Նյութի պակասը չի խանգարում վաճառքին, բայց անմիջապես երևում է կարմիրով։",
    preview: <MaterialsPreview />,
  },
  {
    key: "breakeven",
    label: "Զրոյական կետ",
    dot: "bg-emerald-500",
    module: "Վահանակ",
    title: "Որ օրն եք դուրս եկել զրոյի",
    text: "Վահանակը ցույց է տալիս, թե վաճառքից ստացված շահույթը որքանով է ծածկել մարքեթինգի ծախսը, և որ օրից սկսած ամեն վաճառքը մաքուր եկամուտ է։",
    points: [
      "Ամսվա կամ ցանկացած ժամանակահատվածի համար",
      "Եթե դեռ չի հասել՝ որքան գումար և քանի հատ է մնում",
      "Մաքուր շահույթ, ROAS, CAC և շահութաբերություն՝ կողքին",
    ],
    note: "Մարքեթինգը, ինքնարժեքը և նյութերը հաշվվում են առանձին, որպեսզի տեսնեք, թե որտեղ է գնում գումարը։",
    preview: <BreakEvenPreview />,
  },
  {
    key: "payments",
    label: "Վճարումներ",
    dot: "bg-sky-500",
    module: "Պատվերներ",
    title: "Կարգավիճակը մի բան է, վճարումը՝ այլ",
    text: "Պատվերը կարող է հաստատված լինել վաղվա համար, իսկ վճարումը՝ դեռ չկատարված։ Երկուսն էլ փոխվում են անմիջապես աղյուսակից։",
    points: [
      "Կանխիկ, քարտով, փոխանցում կամ POS",
      "Վճարված / Չվճարված՝ գունավոր նշանով",
      "Մեկնաբանություն յուրաքանչյուր պատվերի համար",
    ],
    note: "Օրվա վերջում միանգամից երևում է, թե որ պատվերների գումարն է դեռ սպասվում։",
    preview: <PaymentsPreview />,
  },
];

export function DetailTabs() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <div className="rounded-[2rem] bg-card p-3 shadow-soft sm:p-4">
      <div
        role="tablist"
        aria-label="Մանրամասներ"
        className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-muted p-1"
      >
        {TABS.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`detail-tab-${item.key}`}
            aria-selected={index === active}
            aria-controls="detail-panel"
            onClick={() => setActive(index)}
            className={cn(
              "flex shrink-0 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              index === active
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden className={cn("size-2 rounded-full", item.dot)} />
            {item.label}
          </button>
        ))}
      </div>

      <div
        key={tab.key}
        id="detail-panel"
        role="tabpanel"
        aria-labelledby={`detail-tab-${tab.key}`}
        className="detail-panel grid gap-8 p-4 pt-8 sm:p-8 lg:grid-cols-2 lg:items-center"
      >
        <div>
          <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-violet-700">
            {tab.module}
          </span>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-balance">
            {tab.title}
          </h3>
          <p className="mt-3 text-muted-foreground">{tab.text}</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {tab.points.map((point) => (
              <li key={point} className="flex gap-2.5 text-sm">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  aria-hidden
                />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            {tab.note}
          </p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-apricot/40 via-muted to-[#d9f2e6] p-5 sm:p-8">
          {tab.preview}
        </div>
      </div>
    </div>
  );
}

// ── Small UI previews (illustrative numbers) ─────────────────

function LinkPreview() {
  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-card p-5 shadow-[0_20px_50px_-25px_rgb(20_20_22/0.4)]">
      <p className="font-semibold">Վճարման հղում</p>
      <p className="text-sm text-muted-foreground">Մեծ Արարատ 70սմ</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Box label="Զեղչ, %" value="15" />
        <Box label="Առաքում (֏)" value="0" />
      </div>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-1.5 rounded-xl bg-muted px-3.5 py-3 text-sm tabular-nums">
        <dt className="text-muted-foreground">Գինը հղումով</dt>
        <dd className="text-right">
          <s className="mr-1.5 text-muted-foreground">13 900 ֏</s>11 815 ֏
        </dd>
        <dt className="text-muted-foreground">Առաքում</dt>
        <dd className="text-right">Անվճար</dd>
        <dt className="mt-1 border-t pt-2 font-semibold">Ընդամենը</dt>
        <dd className="mt-1 border-t pt-2 text-right font-semibold">
          11 815 ֏
        </dd>
      </dl>
      <span className="mt-4 flex h-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
        Պատճենել հղումը
      </span>
    </div>
  );
}

function MaterialsPreview() {
  const items = [
    { name: "Փոքր Արարատ", use: "1 հատ", left: 71, of: 300 },
    { name: "Տոպրակ փոքր", use: "2 հատ", left: 289, of: 518 },
    { name: "Պիտակ MARDUK", use: "1 հատ", left: 34, of: 600 },
    { name: "Սինտեպոն", use: "100 գ", left: 4200, of: 15000 },
  ];
  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-card p-5 shadow-[0_20px_50px_-25px_rgb(20_20_22/0.4)]">
      <p className="text-sm font-semibold">1 վաճառքը հանում է</p>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item) => {
          const share = item.left / item.of;
          const low = share < 0.15;
          return (
            <li key={item.name}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  −{item.use}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      low ? "bg-amber-500" : "bg-ring",
                    )}
                    style={{ width: `${share * 100}%` }}
                  />
                </span>
                <span
                  className={cn(
                    "w-12 text-right text-xs font-semibold tabular-nums",
                    low && "text-amber-700",
                  )}
                >
                  {formatNumber(item.left)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BreakEvenPreview() {
  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-card p-5 shadow-[0_20px_50px_-25px_rgb(20_20_22/0.4)]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">Զրոյական կետ</p>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900">
          Հասավ 12.10-ին
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full rounded-full bg-emerald-500" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Մարքեթինգ</dt>
          <dd className="font-semibold tabular-nums">100 000 ֏</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Զրոյից վեր</dt>
          <dd className="font-semibold text-emerald-700 tabular-nums">
            186 400 ֏
          </dd>
        </div>
      </dl>
      <div className="mt-4 rounded-xl bg-muted px-3.5 py-3">
        <p className="text-xs text-muted-foreground">Մաքուր շահույթ</p>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          186 400 ֏
        </p>
      </div>
    </div>
  );
}

function PaymentsPreview() {
  const rows = [
    {
      name: "Նարե Կ.",
      status: "Հաստատված",
      sTone: "bg-blue-100 text-blue-900",
      paid: false,
      method: "POS",
    },
    {
      name: "Արամ Պ.",
      status: "Առաքված",
      sTone: "bg-emerald-100 text-emerald-900",
      paid: true,
      method: "Քարտով",
    },
    {
      name: "Սոնա Գ.",
      status: "Նոր",
      sTone: "bg-amber-100 text-amber-900",
      paid: false,
      method: "Կանխիկ",
    },
  ];
  return (
    <div className="mx-auto max-w-sm rounded-2xl bg-card p-3 shadow-[0_20px_50px_-25px_rgb(20_20_22/0.4)]">
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex items-center gap-3 border-b border-border/60 px-2 py-3 last:border-0"
        >
          <span className="flex-1 text-sm font-medium">{row.name}</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              row.sTone,
            )}
          >
            {row.status}
          </span>
          <span className="flex flex-col items-end gap-1">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                row.paid
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-rose-100 text-rose-900",
              )}
            >
              {row.paid ? "Վճարված" : "Չվճարված"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {row.method}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 rounded-xl border px-3 py-2 text-sm tabular-nums">
        {value}
      </p>
    </div>
  );
}
