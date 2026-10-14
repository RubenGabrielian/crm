"use client";

import { useState, useTransition } from "react";
import { MessageSquare, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { updateOrderComment } from "@/lib/orders/actions";

/** Icon button that opens the order's comment; filled when one exists. */
export function OrderCommentDialog({
  orderId,
  label,
  comment,
}: {
  orderId: string;
  /** e.g. "#655C48EC, Անի". */
  label: string;
  comment: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${comment ? "Խմբագրել" : "Ավելացնել"} մեկնաբանությունը՝ ${label}`}
            className={comment ? "text-ring" : undefined}
          />
        }
      >
        {comment ? <MessageSquareText /> : <MessageSquare />}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Մեկնաբանություն</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from the saved text. */}
        <CommentForm
          orderId={orderId}
          comment={comment ?? ""}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CommentForm({
  orderId,
  comment,
  onSaved,
}: {
  orderId: string;
  comment: string;
  onSaved: () => void;
}) {
  const [text, setText] = useState(comment);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateOrderComment(orderId, text);
      if (result.ok) onSaved();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <textarea
        aria-label="Մեկնաբանություն"
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
        rows={5}
        maxLength={2000}
        autoFocus
        placeholder="Օրինակ՝ առաքել երեկոյան 18:00-ից հետո"
        className="w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
      />
      {error && <FieldError>{error}</FieldError>}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Չեղարկել
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Պահպանվում է…" : "Պահպանել"}
        </Button>
      </DialogFooter>
    </form>
  );
}
