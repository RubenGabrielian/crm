import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop, rise, useAt, useRamp, useTyped } from "./motion";
import { theme } from "./theme";
import {
  AppWindow,
  Bar,
  Caption,
  Cursor,
  Logo,
  NetProfit,
  PageTitle,
  Panel,
  Phone,
  ProfitLine,
  Scene,
  StatusPill,
  TableRow,
  Tile,
  blackPill,
  card,
} from "./ui";

const centred: CSSProperties = {
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 70,
};

// ── 1. Hook ──────────────────────────────────────────────────────────────
export function HookScene() {
  const posts = [theme.accent, theme.peach, theme.mint];
  const line1 = useAt(16);
  const line2 = useAt(26);

  return (
    <Scene background={theme.ink} color="#fff">
      <AbsoluteFill style={centred}>
        <div style={{ display: "flex", gap: 24 }}>
          {posts.map((color, index) => (
            <Post key={color} color={color} delay={2 + index * 5} likes={["248", "1.2K", "613"][index]} />
          ))}
        </div>
        <div style={{ marginTop: 70, fontSize: 104, lineHeight: 1.1, fontWeight: 600 }}>
          <div style={rise(line1, 60)}>Instagram-ում</div>
          <div style={rise(line2, 60)}>խանո՞ւթ ունեք</div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

function Post({ color, delay, likes }: { color: string; delay: number; likes: string }) {
  const enter = useAt(delay, { damping: 11, stiffness: 170 });
  return (
    <div style={{ width: 250, ...pop(enter, 0.5) }}>
      <div style={{ height: 250, borderRadius: 40, backgroundColor: color }} />
      <div style={{ marginTop: 14, fontSize: 30, fontWeight: 500, textAlign: "left", opacity: 0.85 }}>♥ {likes}</div>
    </div>
  );
}

// ── 2–3. The Excel mess ──────────────────────────────────────────────────
const SHEET = [
  ["Անի", "Գնացք x2", "24000", "ուղարկե՞լ եմ"],
  ["Կարեն", "Արջուկ", "#REF!", "???"],
  ["Մարիամ", "Խորանարդ", "6400", "վճարե՞լ է"],
  ["Դավիթ", "Գնացք", "12000", "կորել է"],
  ["Լիլիթ", "Արջուկ x3", "#VALUE!", "չգիտեմ"],
];

function Spreadsheet({ appear }: { appear: boolean }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...card, width: 900, borderRadius: 30, overflow: "hidden", boxShadow: "0 40px 80px -40px rgba(20,20,22,0.4)" }}>
      <div style={{ backgroundColor: "#1d6f42", color: "#fff", padding: "18px 26px", fontSize: 28, fontWeight: 600, textAlign: "left" }}>
        Պատվերներ_վերջնական_2.xlsx
      </div>
      {SHEET.map((row, rowIndex) => {
        const shown = appear ? Math.min(Math.max((frame - 10 - rowIndex * 6) / 6, 0), 1) : 1;
        return (
          <div
            key={row[0]}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr 1fr 1.4fr",
              borderTop: `2px solid ${theme.line}`,
              opacity: shown,
              transform: `translateX(${(1 - shown) * -30}px)`,
            }}
          >
            {row.map((cell, cellIndex) => {
              const bad = /[#?]|կորել|չգիտեմ/.test(cell);
              return (
                <div
                  key={cellIndex}
                  style={{
                    padding: "20px 18px",
                    fontSize: 29,
                    textAlign: "left",
                    borderLeft: cellIndex ? `2px solid ${theme.line}` : "none",
                    backgroundColor: bad ? "#fde2e4" : "transparent",
                    color: bad ? "#a01d2f" : theme.ink,
                    fontWeight: bad ? 600 : 400,
                  }}
                >
                  {cell}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Bubble({ text, delay, style }: { text: string; delay: number; style: CSSProperties }) {
  const enter = useAt(delay, { damping: 11, stiffness: 180 });
  return (
    <div
      style={{
        position: "absolute",
        padding: "22px 32px",
        borderRadius: 40,
        backgroundColor: theme.ink,
        color: "#fff",
        fontSize: 36,
        fontWeight: 500,
        boxShadow: "0 24px 50px -20px rgba(20,20,22,0.5)",
        ...style,
        ...pop(enter, 0.4),
      }}
    >
      {text}
    </div>
  );
}

export function ExcelScene() {
  const { height } = useVideoConfig();
  return (
    <Scene>
      <Caption text="Պատվերները վարում եք Excel-ո՞վ" />
      <AbsoluteFill style={{ alignItems: "center", top: height * 0.27 }}>
        <Spreadsheet appear />
      </AbsoluteFill>
      <Bubble text="Պատվերս ո՞ւր է" delay={52} style={{ left: 70, top: height * 0.66 }} />
      <Bubble text="Դեռ առկա՞ է" delay={62} style={{ right: 70, top: height * 0.72 }} />
      <Bubble text="Գինը ինչքա՞ն է" delay={72} style={{ left: 150, top: height * 0.8 }} />
    </Scene>
  );
}

export function ChaosScene() {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const text = useAt(8, { damping: 12, stiffness: 160 });
  // A quick, decaying shake.
  const shake = Math.sin(frame * 1.7) * 14 * Math.max(0, 1 - frame / 34);

  return (
    <Scene>
      <AbsoluteFill style={{ alignItems: "center", top: height * 0.2 }}>
        <div style={{ transform: `translateX(${shake}px) rotate(${-4 + shake / 6}deg)`, opacity: 0.55 }}>
          <Spreadsheet appear={false} />
        </div>
      </AbsoluteFill>
      <Stamp text="Կորած պատվերներ" delay={4} style={{ left: 80, top: height * 0.24, rotate: "-7deg" }} />
      <Stamp text="Շահույթը՝ ???" delay={12} style={{ right: 70, top: height * 0.36, rotate: "6deg" }} />
      <Stamp text="Պահեստում կա՞" delay={20} style={{ left: 140, top: height * 0.47, rotate: "-3deg" }} />
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: height * 0.64,
          fontSize: 86,
          lineHeight: 1.1,
          fontWeight: 600,
          textAlign: "center",
          ...rise(text, 70),
        }}
      >
        Ամեն ինչ խառնվե՞լ է
      </div>
    </Scene>
  );
}

function Stamp({ text, delay, style }: { text: string; delay: number; style: CSSProperties & { rotate: string } }) {
  const enter = useAt(delay, { damping: 9, stiffness: 220 });
  const { rotate, ...position } = style;
  return (
    <div
      style={{
        position: "absolute",
        padding: "18px 34px",
        borderRadius: 26,
        backgroundColor: "#d1344b",
        color: "#fff",
        fontSize: 46,
        fontWeight: 600,
        boxShadow: "0 24px 50px -20px rgba(209,52,75,0.7)",
        ...position,
        opacity: Math.min(enter, 1),
        transform: `rotate(${rotate}) scale(${lerp(1.8, 1, Math.min(enter, 1.1))})`,
      }}
    >
      {text}
    </div>
  );
}

// ── 4. Meet the product ──────────────────────────────────────────────────
export function IntroScene() {
  const logo = useAt(4, { damping: 10, stiffness: 170 });
  const hello = useAt(12);
  const name = useAt(18, { damping: 12, stiffness: 150 });
  const tagline = useAt(30);

  return (
    <Scene background={theme.accent}>
      <AbsoluteFill style={centred}>
        <div style={{ transform: `scale(${logo})` }}>
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 999,
              backgroundColor: theme.ink,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 110,
              fontWeight: 600,
            }}
          >
            M
          </div>
        </div>
        <div style={{ marginTop: 50, fontSize: 52, fontWeight: 500, ...rise(hello) }}>Ծանոթացեք՝</div>
        <div style={{ fontSize: 150, lineHeight: 1.1, fontWeight: 600, ...pop(name, 0.8) }}>Mardouk</div>
        <div style={{ marginTop: 30, fontSize: 48, lineHeight: 1.25, fontWeight: 500, ...rise(tagline) }}>
          Պատվերներ, պահեստ և շահույթ՝
          <br />
          մեկ տեղում
        </div>
      </AbsoluteFill>
    </Scene>
  );
}

// ── 5. Copy the product link ─────────────────────────────────────────────
const PRODUCTS = [
  { name: "Փայտե գնացք", price: "12 000 ֏", stock: "15" },
  { name: "Փափուկ արջուկ", price: "9 500 ֏", stock: "8" },
  { name: "Խորանարդներ", price: "6 400 ֏", stock: "21" },
];

export function CopyLinkScene() {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const CLICK = 56;
  const target = { x: 1262, y: 272 };

  const punchIn = useAt(26, { damping: 20, stiffness: 80, mass: 1 });
  const move = useAt(20, { damping: 22, stiffness: 90 });
  const copied = frame >= CLICK + 2;
  const chip = useAt(CLICK + 6, { damping: 12, stiffness: 150 });

  const wide = width / 1190;
  const focus = { x: lerp(825, 880, punchIn), y: lerp(450, 330, punchIn) };

  return (
    <Scene>
      <Caption step={1} text="Պատճենեք ապրանքի հղումը" />
      <AppWindow active="products" focus={focus} zoom={lerp(wide, 1.05, punchIn)}>
        <PageTitle>Ապրանքներ</PageTitle>
        <div style={{ ...blackPill, position: "absolute", right: 40, top: 110 }}>+ Ավելացնել ապրանք</div>
        <div style={{ ...card, position: "absolute", left: 40, right: 40, top: 178, padding: 14 }}>
          <TableRow header cells={["Անվանում", "Գին", "Առկա քանակ"]} />
          {PRODUCTS.map((product, index) => (
            <TableRow
              key={product.name}
              cells={[product.name, product.price, product.stock]}
              last={
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: `1px solid ${index === 0 && copied ? theme.accent : theme.line}`,
                    backgroundColor: index === 0 && copied ? theme.accent : theme.card,
                    transform: `scale(${index === 0 && frame >= CLICK && frame < CLICK + 5 ? 0.92 : 1})`,
                  }}
                >
                  {index === 0 && copied ? "✓ Պատճենվեց" : "Պատճենել հղումը"}
                </span>
              }
            />
          ))}
        </div>

        {/* The copied link lifts off the button. */}
        <div
          style={{
            ...blackPill,
            position: "absolute",
            left: 560,
            top: 440,
            height: 54,
            fontSize: 18,
            boxShadow: "0 24px 50px -20px rgba(20,20,22,0.6)",
            opacity: Math.min(chip, 1),
            transform: `translateY(${(1 - chip) * -50}px) scale(${lerp(0.7, 1, Math.min(chip, 1))})`,
          }}
        >
          mardouk.am/checkout/gnacq
        </div>

        <Cursor
          x={lerp(700, target.x - 250, move)}
          y={lerp(760, target.y, move)}
          pressing={frame >= CLICK && frame < CLICK + 5}
        />
      </AppWindow>
    </Scene>
  );
}

// ── 6. Send it in a DM ───────────────────────────────────────────────────
function Chat({ side, delay, children }: { side: "them" | "me"; delay: number; children: ReactNode }) {
  const enter = useAt(delay, { damping: 13, stiffness: 170 });
  const mine = side === "me";
  return (
    <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginTop: 22 }}>
      <div
        style={{
          maxWidth: 500,
          padding: "22px 28px",
          borderRadius: 38,
          borderBottomRightRadius: mine ? 10 : 38,
          borderBottomLeftRadius: mine ? 38 : 10,
          backgroundColor: mine ? theme.ink : theme.muted,
          color: mine ? "#fff" : theme.ink,
          fontSize: 31,
          lineHeight: 1.3,
          transformOrigin: mine ? "100% 100%" : "0 100%",
          ...pop(enter, 0.5),
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function SendLinkScene() {
  return (
    <Scene>
      <Caption step={2} text="Ուղարկեք հաճախորդին" />
      <Phone>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "34px 34px 26px", borderBottom: `2px solid ${theme.line}` }}>
          <div style={{ width: 76, height: 76, borderRadius: 999, backgroundColor: theme.peach }} />
          <div>
            <div style={{ fontSize: 32, fontWeight: 600 }}>ani.sargsyan</div>
            <div style={{ fontSize: 24, color: theme.mist }}>Instagram</div>
          </div>
        </div>
        <div style={{ padding: "10px 30px" }}>
          <Chat side="them" delay={12}>
            Բարև։ Փայտե գնացքը դեռ կա՞
          </Chat>
          <Chat side="me" delay={30}>
            Այո, կա։ Պատվիրեք այս հղումով
          </Chat>
          <Chat side="me" delay={44}>
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <div style={{ width: 96, height: 96, flexShrink: 0, borderRadius: 24, backgroundColor: theme.accent }} />
              <div>
                <div style={{ fontWeight: 600 }}>Փայտե գնացք</div>
                <div style={{ opacity: 0.75 }}>12 000 ֏</div>
                <div style={{ fontSize: 21, opacity: 0.6, textDecoration: "underline" }}>mardouk.am/checkout/gnacq</div>
              </div>
            </div>
          </Chat>
          <Chat side="them" delay={70}>
            Շնորհակալ եմ, հիմա կպատվիրեմ
          </Chat>
        </div>
      </Phone>
    </Scene>
  );
}

// ── 7. The customer buys ─────────────────────────────────────────────────
function CheckoutField({ label, value, typing }: { label: string; value: string; typing?: boolean }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 26, fontWeight: 500 }}>{label}</div>
      <div
        style={{
          marginTop: 10,
          height: 78,
          borderRadius: 26,
          border: `2.5px solid ${typing ? "#8b6ff7" : theme.line}`,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          fontSize: 30,
        }}
      >
        {value}
        {typing && <span style={{ width: 3, height: 36, marginLeft: 3, backgroundColor: theme.ink, opacity: frame % 12 < 7 ? 1 : 0 }} />}
      </div>
    </div>
  );
}

export function CheckoutScene() {
  const frame = useCurrentFrame();
  const TAP = 92;
  const name = useTyped("Անի Սարգսյան", 26);
  const phone = useTyped("077 123 456", 54);
  const done = useAt(TAP + 6, { damping: 13, stiffness: 150 });
  const check = useAt(TAP + 12, { damping: 9, stiffness: 200 });
  const tap = useRamp(TAP, TAP + 10);

  return (
    <Scene>
      <Caption step={3} text="Հաճախորդը պատվիրում է մեկ րոպեում" />
      <Phone>
        <div style={{ height: 300, backgroundColor: theme.peach, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* A simple toy train drawn from shapes. */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <div style={{ width: 90, height: 120, borderRadius: 22, backgroundColor: theme.ink }} />
            <div style={{ width: 170, height: 80, borderRadius: 22, backgroundColor: "#8b6ff7" }} />
          </div>
        </div>
        <div style={{ padding: "30px 36px" }}>
          <div style={{ fontSize: 24, color: theme.mist }}>Արևիկ Խաղալիքներ</div>
          <div style={{ fontSize: 44, fontWeight: 600 }}>Փայտե գնացք</div>
          <div style={{ fontSize: 54, fontWeight: 600 }}>12 000 ֏</div>
          <CheckoutField label="Անուն Ազգանուն" value={name.value} typing={name.typing} />
          <CheckoutField label="Հեռախոս" value={phone.value} typing={phone.typing} />
          <CheckoutField label="Հասցե" value={frame > 74 ? "Երևան, Աբովյան 12" : ""} />
          <div
            style={{
              ...blackPill,
              marginTop: 34,
              height: 92,
              fontSize: 34,
              fontWeight: 600,
              transform: `scale(${frame >= TAP && frame < TAP + 5 ? 0.95 : 1})`,
            }}
          >
            Պատվիրել
          </div>
        </div>

        {/* Tap ripple on the button, then the confirmation covers the form. */}
        <div
          style={{
            position: "absolute",
            left: 330 - 60,
            top: 1010,
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: "rgba(139,111,247,0.45)",
            opacity: frame >= TAP ? 1 - tap : 0,
            transform: `scale(${0.4 + tap * 1.4})`,
          }}
        />
        <AbsoluteFill
          style={{
            backgroundColor: theme.card,
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 50,
            opacity: Math.min(done, 1),
          }}
        >
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: 999,
              backgroundColor: theme.green,
              color: theme.greenInk,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 110,
              fontWeight: 600,
              transform: `scale(${check})`,
            }}
          >
            ✓
          </div>
          <div style={{ marginTop: 40, fontSize: 54, lineHeight: 1.15, fontWeight: 600 }}>Պատվերն ընդունված է</div>
          <div style={{ marginTop: 16, fontSize: 30, color: theme.mist }}>Շուտով կկապվենք ձեզ հետ</div>
        </AbsoluteFill>
      </Phone>
    </Scene>
  );
}

// ── 8. The owner sees the order ──────────────────────────────────────────
export function NewOrderScene() {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const row = useAt(18, { damping: 14, stiffness: 140 });
  const flash = 1 - useRamp(18, 70);
  const toast = useAt(30, { damping: 12, stiffness: 170 });
  const stock = useAt(66, { damping: 11, stiffness: 170 });

  return (
    <Scene>
      <Caption step={4} text="Նոր պատվերն արդեն ձեզ մոտ է" />
      <AppWindow active="orders" focus={{ x: 825, y: 420 }} zoom={width / 1100}>
        <PageTitle>Պատվերներ</PageTitle>
        <div style={{ position: "absolute", left: 40, top: 122, fontSize: 15, color: theme.mist }}>
          Ընդամենը՝ {frame >= 18 ? 3 : 2}
        </div>
        <div style={{ ...card, position: "absolute", left: 40, right: 40, top: 178, padding: 14 }}>
          <TableRow header cells={["Հաճախորդ", "Ապրանք", "Գումար"]} />
          <div style={{ height: 68 * Math.min(row, 1), opacity: Math.min(row, 1), overflow: "hidden" }}>
            <TableRow
              cells={["Անի Սարգսյան", "Փայտե գնացք", "12 000 ֏"]}
              last={<StatusPill tone="new">Նոր</StatusPill>}
              style={{ backgroundColor: `rgba(201,188,255,${0.6 * flash})`, borderRadius: 18 }}
            />
          </div>
          <TableRow cells={["Կարեն Պետրոսյան", "Փափուկ արջուկ", "9 500 ֏"]} last={<StatusPill tone="done">Առաքված</StatusPill>} />
          <TableRow cells={["Մարիամ Հակոբյան", "Խորանարդներ", "6 400 ֏"]} last={<StatusPill tone="done">Առաքված</StatusPill>} />
        </div>

        <div
          style={{
            position: "absolute",
            left: 325,
            top: 500,
            width: 500,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "18px 22px",
            borderRadius: 26,
            backgroundColor: theme.ink,
            color: "#fff",
            boxShadow: "0 30px 60px -24px rgba(20,20,22,0.55)",
            ...rise(toast, 60),
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              flexShrink: 0,
              borderRadius: 999,
              backgroundColor: theme.accent,
              color: theme.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            1
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600 }}>Նոր պատվեր</div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>Անի Սարգսյան, 12 000 ֏</div>
          </div>
        </div>

        <div
          style={{
            ...card,
            position: "absolute",
            left: 325,
            top: 610,
            width: 500,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 19,
            ...pop(stock, 0.7),
          }}
        >
          <span style={{ fontWeight: 600 }}>Պահեստ. Փայտե գնացք</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: theme.mist, textDecoration: "line-through" }}>15</span>
            {"  →  "}
            <span style={{ fontWeight: 600, fontSize: 24 }}>14</span>
          </span>
        </div>
      </AppWindow>
    </Scene>
  );
}

// ── 9. Statistics ────────────────────────────────────────────────────────
const TILES = [
  { label: "Ընդհանուր մուտք", value: 486000, suffix: " ֏", tone: theme.accent },
  { label: "Մաքուր շահույթ", value: 151000, suffix: " ֏", tone: theme.card },
  { label: "Միջին պատվեր", value: 12150, suffix: " ֏", tone: theme.peach },
  { label: "Շահութաբերություն", value: 31, suffix: "%", tone: theme.mint },
];

const BARS = [42, 58, 35, 71, 64, 88, 52, 76, 95, 68, 81, 100];

export function DashboardScene() {
  const { width } = useVideoConfig();
  const START = 10;

  return (
    <Scene>
      <Caption step={5} text="Եվ տեսնում եք իրական շահույթը" />
      <AppWindow active="dashboard" focus={{ x: 825, y: 450 }} zoom={width / 1190}>
        <PageTitle>Գլխավոր</PageTitle>
        <div style={{ position: "absolute", left: 40, right: 40, top: 112, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {TILES.map((tile, index) => (
            <Tile key={tile.label} {...tile} delay={START + index * 4} />
          ))}
        </div>

        <Panel left={40} top={300} width={640} height={540} title="Մուտքն ըստ օրերի" delay={START + 14}>
          <div style={{ position: "absolute", left: 28, right: 28, bottom: 30, top: 84, display: "flex", alignItems: "flex-end", gap: 12 }}>
            {BARS.map((value, index) => (
              <Bar key={index} value={value} delay={START + 20 + index * 2} highlight={index === 8} />
            ))}
          </div>
        </Panel>

        <Panel left={696} top={300} width={414} height={540} title="Ինչպես է ստացվում շահույթը" delay={START + 18}>
          <div style={{ position: "absolute", left: 28, right: 28, top: 84, display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { label: "Մուտք", value: "486 000 ֏", width: 100, strong: true },
              { label: "Ինքնարժեք", value: "−212 000 ֏", width: 44 },
              { label: "Առաքում", value: "−38 000 ֏", width: 8 },
              { label: "Գովազդ", value: "−54 000 ֏", width: 11 },
              { label: "Այլ ծախսեր", value: "−31 000 ֏", width: 6 },
            ].map((line, index) => (
              <ProfitLine key={line.label} {...line} delay={START + 24 + index * 4} />
            ))}
          </div>
          <NetProfit delay={START + 46} />
        </Panel>
      </AppWindow>
    </Scene>
  );
}

// ── 10. Call to action ───────────────────────────────────────────────────
export function EndScene() {
  const logo = useAt(6, { damping: 10, stiffness: 180 });
  const text = useAt(12);
  const cta = useAt(22, { damping: 11, stiffness: 170 });

  return (
    <Scene background={theme.ink} color="#fff">
      <AbsoluteFill style={centred}>
        <div style={{ transform: `scale(${logo})` }}>
          <Logo size={150} />
        </div>
        <div style={{ marginTop: 30, fontSize: 64, fontWeight: 600, ...rise(text, 40) }}>Mardouk</div>
        <div style={{ marginTop: 30, fontSize: 68, lineHeight: 1.15, fontWeight: 600, ...rise(text, 40) }}>
          Թողեք Excel-ը։
          <br />
          Տեսեք իրական պատկերը։
        </div>
        <div
          style={{
            marginTop: 60,
            padding: "30px 56px",
            borderRadius: 999,
            backgroundColor: theme.accent,
            color: theme.ink,
            fontSize: 46,
            fontWeight: 600,
            transform: `scale(${cta})`,
          }}
        >
          Գրանցվեք՝ mardouk.am
        </div>
      </AbsoluteFill>
    </Scene>
  );
}
