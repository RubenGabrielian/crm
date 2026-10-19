import { useCurrentFrame } from "remotion";
import { useLayout } from "./layout";
import { pop } from "./motion";

/**
 * The burned-in Armenian caption at the top of the safe area. Words spring
 * up one after another; words listed in `accent` are drawn in violet.
 */
export function Caption({
  text,
  accent = [],
  delay = 4,
  dark,
  scale = 1,
}: {
  text: string;
  accent?: string[];
  delay?: number;
  dark?: boolean;
  /** Shrinks a long caption so it stays on two lines. */
  scale?: number;
}) {
  const frame = useCurrentFrame();
  const { captionTop, captionSize, width } = useLayout();
  const words = text.split(" ");
  return (
    <div
      style={{
        position: "absolute",
        top: captionTop,
        left: 70,
        width: width - 140,
        textAlign: "center",
        fontSize: captionSize * scale,
        lineHeight: 1.12,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: dark ? "#ffffff" : "#141416",
        textWrap: "balance",
      }}
    >
      {words.map((word, index) => {
        const p = pop(frame, delay + index * 3);
        const isAccent = accent.some((item) => word.includes(item));
        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              marginRight: "0.26em",
              transform: `translateY(${(1 - p) * 40}px)`,
              opacity: p,
              color: isAccent ? (dark ? "#fed740" : "#185aef") : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
