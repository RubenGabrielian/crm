import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { formatNumber, pop, rise, useAt } from "./motion";
import { CANVAS, theme } from "./theme";

export const card: CSSProperties = {
  backgroundColor: theme.card,
  borderRadius: 28,
  boxShadow: "0 1px 2px rgba(20,20,22,0.03), 0 10px 26px -20px rgba(20,20,22,0.18)",
};

export const blackPill: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 44,
  padding: "0 22px",
  borderRadius: 999,
  backgroundColor: theme.ink,
  color: "#fff",
  fontSize: 16,
  fontWeight: 500,
};

/** Full-frame scene background that eases in, so cuts feel like quick dissolves. */
export function Scene({
  background = theme.paper,
  color = theme.ink,
  children,
}: {
  background?: string;
  color?: string;
  children: ReactNode;
}) {
  const enter = useAt(0, { damping: 20, stiffness: 160 });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        color,
        opacity: Math.min(enter * 1.4, 1),
        transform: `scale(${1.05 - 0.05 * Math.min(enter, 1)})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
}

/** The headline of a scene, pinned near the top. `step` adds a numbered chip. */
export function Caption({ text, step, dark }: { text: string; step?: number; dark?: boolean }) {
  const { height } = useVideoConfig();
  const enter = useAt(3, { damping: 16, stiffness: 150 });
  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        right: 56,
        top: height * 0.065,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        ...rise(enter, 40),
      }}
    >
      {step !== undefined && (
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 999,
            backgroundColor: theme.accent,
            color: theme.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            fontWeight: 600,
          }}
        >
          {step}
        </div>
      )}
      <div
        style={{
          backgroundColor: dark ? "#fff" : theme.ink,
          color: dark ? theme.ink : "#fff",
          fontSize: 52,
          lineHeight: 1.2,
          fontWeight: 600,
          textAlign: "center",
          padding: "26px 40px",
          borderRadius: 40,
          boxShadow: "0 30px 60px -30px rgba(20,20,22,0.5)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/**
 * The mock admin window. It has its own 1400×900 pixel space; `focus` is the
 * canvas point placed at the centre of the frame and `zoom` scales it.
 */
export function AppWindow({
  active,
  focus,
  zoom,
  children,
}: {
  active: string;
  focus: { x: number; y: number };
  zoom: number;
  children: ReactNode;
}) {
  const { width, height } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: CANVAS.width,
        height: CANVAS.height,
        transformOrigin: "0 0",
        transform: `translate(${width / 2 - focus.x * zoom}px, ${height * 0.57 - focus.y * zoom}px) scale(${zoom})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 36,
          backgroundColor: theme.paper,
          boxShadow: "0 40px 90px -40px rgba(20,20,22,0.35), 0 0 0 1px rgba(20,20,22,0.05)",
          overflow: "hidden",
        }}
      >
        <Sidebar active={active} />
        <div style={{ position: "absolute", left: 250, top: 0, right: 0, bottom: 0 }}>{children}</div>
      </div>
    </div>
  );
}

const NAV = [
  { id: "dashboard", label: "Գլխավոր" },
  { id: "products", label: "Ապրանքներ" },
  { id: "orders", label: "Պատվերներ" },
  { id: "inventory", label: "Պահեստ" },
  { id: "crm", label: "CRM" },
  { id: "expenses", label: "Ծախսեր" },
];

function Sidebar({ active }: { active: string }) {
  return (
    <div style={{ ...card, position: "absolute", left: 14, top: 14, bottom: 14, width: 222, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 18, borderBottom: `1px solid ${theme.line}` }}>
        <Logo size={42} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Mardouk</div>
          <div style={{ fontSize: 12, color: theme.mist }}>Առցանց խանութ</div>
        </div>
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV.map((item) => {
          const isActive = item.id === active;
          return (
            <div
              key={item.id}
              style={{
                height: 42,
                borderRadius: 999,
                padding: "0 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 15,
                fontWeight: 500,
                backgroundColor: isActive ? theme.ink : "transparent",
                color: isActive ? "#fff" : theme.mist,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: "currentColor", opacity: 0.7 }} />
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Logo({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 999,
        backgroundColor: theme.accent,
        color: theme.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.46,
        fontWeight: 600,
      }}
    >
      M
    </div>
  );
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <div style={{ position: "absolute", left: 40, top: 34, fontSize: 38, fontWeight: 600 }}>{children}</div>;
}

/** One table row in the mock admin: 4 columns, the last one free-form. */
export function TableRow({
  cells,
  last,
  header,
  style,
}: {
  cells: string[];
  last?: ReactNode;
  header?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1.1fr 0.9fr 190px",
        alignItems: "center",
        height: header ? 46 : 68,
        padding: "0 20px",
        fontSize: header ? 13 : 17,
        color: header ? theme.mist : theme.ink,
        backgroundColor: header ? theme.muted : "transparent",
        borderRadius: header ? 999 : 0,
        borderBottom: header ? "none" : `1px solid ${theme.line}`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontWeight: header ? 500 : 600 }}>
        {!header && <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 16, backgroundColor: theme.muted }} />}
        {cells[0]}
      </div>
      <div>{cells[1]}</div>
      <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{cells[2]}</div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>{last}</div>
    </div>
  );
}

export function StatusPill({ children, tone }: { children: ReactNode; tone: "new" | "done" }) {
  const colors = tone === "new" ? { bg: "#fef3c7", fg: "#78350f" } : { bg: theme.green, fg: theme.greenInk };
  return (
    <span style={{ fontSize: 14, fontWeight: 500, padding: "7px 16px", borderRadius: 999, backgroundColor: colors.bg, color: colors.fg }}>
      {children}
    </span>
  );
}

export function Cursor({ x, y, pressing, opacity = 1 }: { x: number; y: number; pressing: boolean; opacity?: number }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${pressing ? 0.85 : 1})`, transformOrigin: "0 0" }}>
      {pressing && (
        <div style={{ position: "absolute", left: -26, top: -26, width: 52, height: 52, borderRadius: 999, backgroundColor: "rgba(139,111,247,0.35)" }} />
      )}
      <svg width="34" height="34" viewBox="0 0 24 24" style={{ position: "relative", filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.3))" }}>
        <path d="M4 2.5v17l4.6-4.3 2.9 6.6 2.7-1.2-2.9-6.5H18L4 2.5z" fill={theme.ink} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** A phone-shaped card for the chat and checkout scenes, scaled to fit the frame. */
export function Phone({ children, background = theme.card }: { children: ReactNode; background?: string }) {
  const { width, height } = useVideoConfig();
  const enter = useAt(6, { damping: 16, stiffness: 120 });
  const scale = Math.min(1, (height * 0.68) / 1180);
  return (
    <div
      style={{
        position: "absolute",
        left: width / 2 - 330,
        top: height * 0.27,
        width: 660,
        height: 1180,
        borderRadius: 64,
        backgroundColor: background,
        boxShadow: "0 50px 100px -40px rgba(20,20,22,0.45), 0 0 0 10px #141416",
        overflow: "hidden",
        transformOrigin: "50% 0",
        opacity: Math.min(enter, 1),
        transform: `translateY(${(1 - enter) * 120}px) scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
}

// ── Dashboard pieces ─────────────────────────────────────────────────────
export function Tile({ label, value, suffix, tone, delay }: { label: string; value: number; suffix: string; tone: string; delay: number }) {
  const enter = useAt(delay);
  const count = useAt(delay + 4, { damping: 26, stiffness: 140, mass: 0.8 });
  return (
    <div style={{ ...card, backgroundColor: tone, padding: 22, height: 164, position: "relative", ...rise(enter, 50) }}>
      <div style={{ fontSize: 15, fontWeight: 500 }}>{label}</div>
      <div style={{ position: "absolute", left: 22, bottom: 22, fontSize: 32, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {formatNumber(value * (count > 0.995 ? 1 : count))}
        {suffix}
      </div>
    </div>
  );
}

export function Panel({
  left,
  top,
  width,
  height,
  title,
  delay,
  children,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  title: string;
  delay: number;
  children: ReactNode;
}) {
  const enter = useAt(delay);
  return (
    <div style={{ ...card, position: "absolute", left, top, width, height, ...rise(enter, 60) }}>
      <div style={{ position: "absolute", left: 28, top: 26, fontSize: 19, fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}

export function Bar({ value, delay, highlight }: { value: number; delay: number; highlight: boolean }) {
  const grow = useAt(delay, { damping: 13, stiffness: 120 });
  return <div style={{ flex: 1, height: `${value * grow}%`, borderRadius: 999, backgroundColor: highlight ? theme.ink : theme.accent }} />;
}

export function ProfitLine({ label, value, width, strong, delay }: { label: string; value: string; width: number; strong?: boolean; delay: number }) {
  const enter = useAt(delay);
  return (
    <div style={{ opacity: Math.min(enter, 1), transform: `translateX(${(1 - enter) * 30}px)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: strong ? 600 : 400, color: strong ? theme.ink : theme.mist }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <div style={{ marginTop: 7, height: 9, borderRadius: 999, backgroundColor: theme.muted }}>
        <div style={{ width: `${width * Math.min(enter, 1)}%`, height: "100%", borderRadius: 999, backgroundColor: strong ? theme.ink : "rgba(20,20,22,0.35)" }} />
      </div>
    </div>
  );
}

export function NetProfit({ delay }: { delay: number }) {
  const enter = useAt(delay, { damping: 11, stiffness: 160 });
  const count = useAt(delay + 2, { damping: 26, stiffness: 140, mass: 0.8 });
  return (
    <div style={{ position: "absolute", left: 28, right: 28, bottom: 28, padding: 20, borderRadius: 24, backgroundColor: theme.accent, ...pop(enter, 0.8) }}>
      <div style={{ fontSize: 15, fontWeight: 500 }}>Մաքուր շահույթ</div>
      <div style={{ fontSize: 34, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {formatNumber(151000 * (count > 0.995 ? 1 : count))} ֏
      </div>
    </div>
  );
}
