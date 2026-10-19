import type { CSSProperties } from "react";
import { NumaMark, NumaWordmark } from "@/components/brand/numa-logo";
import { StatusBar } from "@/components/landing/devices";

// ── The owner's Instagram inbox, overflowing ─────────────────

const DMS = [
  { name: "Անի Մ.", text: "Արջուկը դեռ կա՞", time: "10:24", unread: 3 },
  { name: "Գոռ Հ.", text: "Գինը որքա՞ն է", time: "10:21", unread: 2 },
  { name: "Լիլիթ Ա.", text: "Ե՞րբ կառաքեք", time: "10:17", unread: 4 },
  { name: "Մարիամ Ս.", text: "Վճարել եմ, ստուգեք", time: "10:09", unread: 1 },
  { name: "Նարե Կ.", text: "Հասցեն գրել էի…", time: "09:58", unread: 2 },
  { name: "Արամ Պ.", text: "Մեծ չափսը կա՞", time: "09:41", unread: 5 },
  { name: "Սոնա Գ.", text: "Պատվերս ո՞ւր է", time: "09:30", unread: 3 },
];

export function InboxScreen({ unread }: { unread: number }) {
  return (
    <div className="flex h-full flex-col bg-white text-foreground">
      <StatusBar />
      <div className="flex items-center justify-between px-4 pt-1 pb-3">
        <span className="text-[17px] font-semibold">Հաղորդագրություններ</span>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff3b5c] px-2 text-[12px] font-semibold text-white tabular-nums">
          {unread}
        </span>
      </div>
      <div className="mx-3 rounded-xl bg-muted px-3 py-2 text-[12px] text-muted-foreground">
        Որոնել
      </div>
      <div className="mt-2 flex flex-col">
        {DMS.map((dm) => (
          <div key={dm.name} className="flex items-center gap-3 px-4 py-2.5">
            <span className="size-11 shrink-0 rounded-full bg-[linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)] p-[2px]">
              <span className="flex size-full items-center justify-center rounded-full bg-white text-[13px] font-semibold">
                {dm.name.charAt(0)}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold">
                {dm.name}
              </span>
              <span className="block truncate text-[12px] font-medium text-foreground">
                {dm.text}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-muted-foreground">
                {dm.time}
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-[#185aef] text-[10px] font-semibold text-white">
                {dm.unread}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Paper chaos ──────────────────────────────────────────────

export function NotebookCard({
  lines,
  style,
}: {
  lines: { text: string; crossed?: boolean; red?: boolean }[];
  style?: CSSProperties;
}) {
  return (
    <div
      className="w-[300px] rounded-xl bg-[#fbf7ee] px-5 pt-5 pb-6 shadow-[0_24px_50px_-20px_rgb(20_20_22/0.45)]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to bottom, transparent 0 29px, #ddd5c2 29px 30px)",
        backgroundPositionY: 12,
        ...style,
      }}
    >
      {lines.map((line) => (
        <p
          key={line.text}
          className="text-[18px] leading-[30px] text-[#3b3a7a]"
          style={{
            fontFamily: "'Comic Sans MS', 'Segoe Print', cursive",
            textDecoration: line.crossed ? "line-through" : undefined,
            color: line.red ? "#d63a4a" : undefined,
          }}
        >
          {line.text}
        </p>
      ))}
    </div>
  );
}

export function ExcelCard({ style }: { style?: CSSProperties }) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-[#c9c2b0] bg-white shadow-[0_24px_50px_-20px_rgb(20_20_22/0.45)]"
      style={style}
    >
      <div className="grid grid-cols-[40px_110px_110px] border-b bg-[#f3f3f3] text-[12px] text-[#666]">
        <span className="border-r px-2 py-1" />
        <span className="border-r px-2 py-1 text-center">D</span>
        <span className="px-2 py-1 text-center">E</span>
      </div>
      <div className="grid grid-cols-[40px_110px_110px] text-[14px]">
        <span className="border-r bg-[#f3f3f3] px-2 py-1.5 text-[12px] text-[#666]">
          49
        </span>
        <span className="border-r px-2 py-1.5 font-mono text-[#d63a4a] ring-2 ring-[#1e7145] ring-inset">
          #REF!
        </span>
        <span className="px-2 py-1.5 font-mono text-[#d63a4a]">#VALUE!</span>
      </div>
    </div>
  );
}

export function StickyNote({
  text,
  style,
}: {
  text: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className="w-[210px] rounded-md bg-[#fff2a8] px-4 py-4 text-[17px] leading-snug text-[#5a4a00] shadow-[0_20px_40px_-18px_rgb(20_20_22/0.5)]"
      style={{
        fontFamily: "'Comic Sans MS', 'Segoe Print', cursive",
        ...style,
      }}
    >
      {text}
    </div>
  );
}

// ── Brand ────────────────────────────────────────────────────

export function NumaLogo({
  size = 120,
  dark,
}: {
  size?: number;
  dark?: boolean;
}) {
  // On the brand blue: the official wordmark. On paper: icon + name.
  if (dark) {
    return (
      <span style={{ display: "inline-flex", height: size, color: "#ffffff" }}>
        <NumaWordmark className="h-full w-auto" tagline />
      </span>
    );
  }
  return (
    <div className="flex items-center" style={{ gap: size * 0.3 }}>
      <NumaMark className="shrink-0" style={{ width: size, height: size }} />
      <span
        className="font-bold"
        style={{
          fontSize: size * 0.68,
          letterSpacing: "-0.02em",
          color: "#101828",
        }}
      >
        Numa
      </span>
    </div>
  );
}

/** The 30-day guarantee stamp from the pricing section, turned by `rotation`. */
export function GuaranteeSeal({
  size,
  rotation,
}: {
  size: number;
  rotation: number;
}) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden>
      <defs>
        <path
          id="video-seal-ring"
          d="M60 60 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0"
        />
      </defs>
      <circle cx="60" cy="60" r="59" fill="#fed740" />
      <circle cx="60" cy="60" r="35" fill="#141416" />
      <g transform={`rotate(${rotation} 60 60)`}>
        <text fill="#141416" fontSize="9.5" fontWeight="600">
          <textPath
            href="#video-seal-ring"
            textLength="276"
            lengthAdjust="spacing"
          >
            գումարի վերադարձ • 30 օր երաշխիք •
          </textPath>
        </text>
      </g>
      <text
        x="60"
        y="61"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="24"
        fontWeight="700"
      >
        30
      </text>
      <text x="60" y="76" textAnchor="middle" fill="#fed740" fontSize="10">
        օր
      </text>
    </svg>
  );
}
