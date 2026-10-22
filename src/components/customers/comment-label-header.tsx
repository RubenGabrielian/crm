"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { NAV_LABEL_MAX } from "@/config/navigation";
import { renameCommentLabel } from "@/lib/navigation/actions";
import { useNavLabels } from "@/lib/navigation/labels-context";

const DEFAULT_LABEL = "Մեկնաբանություն";

/**
 * The comment column's header, renamable with a small pencil. The new name is
 * the signed-in user's own; nobody else sees it.
 */
export function CommentLabelHeader() {
  const { commentLabel, setCommentLabel } = useNavLabels();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(commentLabel);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: string) {
    setError(null);
    const previous = commentLabel;
    setCommentLabel(next.trim() || DEFAULT_LABEL);
    startTransition(async () => {
      const result = await renameCommentLabel(next);
      if (result.ok) setEditing(false);
      else {
        setCommentLabel(previous);
        setError(result.error);
      }
    });
  }

  if (!editing) {
    return (
      <span className="group/label inline-flex items-center gap-1">
        {commentLabel}
        <button
          type="button"
          onClick={() => {
            setValue(commentLabel);
            setEditing(true);
          }}
          aria-label={`Վերանվանել սյունակը՝ ${commentLabel}`}
          title="Վերանվանել"
          className="flex size-6 items-center justify-center rounded-full text-muted-foreground opacity-0 outline-none transition-opacity group-hover/label:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:opacity-60"
        >
          <Pencil className="size-3" aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(value);
      }}
      className="inline-grid gap-1 py-1"
    >
      <span className="flex items-center gap-1">
        <input
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          onFocus={(event) => event.currentTarget.select()}
          maxLength={NAV_LABEL_MAX}
          placeholder={DEFAULT_LABEL}
          aria-label="Սյունակի նոր անվանում"
          autoFocus
          disabled={pending}
          className="h-8 w-40 rounded-lg border border-input bg-card px-2 text-sm font-normal text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="submit"
          aria-label="Պահպանել"
          disabled={pending}
          className="flex size-7 items-center justify-center rounded-full text-primary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          <Check className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Չեղարկել"
          onClick={() => setEditing(false)}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
      {commentLabel !== DEFAULT_LABEL && (
        <button
          type="button"
          onClick={() => save("")}
          disabled={pending}
          className="flex w-fit items-center gap-1 text-xs font-normal text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="size-3" aria-hidden />
          Վերադարձնել «{DEFAULT_LABEL}»
        </button>
      )}
      {error && <span className="text-xs font-normal text-destructive">{error}</span>}
    </form>
  );
}
