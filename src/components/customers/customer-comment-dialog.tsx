"use client";

import { useState, useTransition } from "react";
import { MessageSquarePlus } from "lucide-react";
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
import { updateCustomerComment } from "@/lib/customers/actions";
import { useNavLabels } from "@/lib/navigation/labels-context";

/** Shows the comment (or an "add" button); clicking it opens the editor. */
export function CustomerCommentDialog({
  customerId,
  customerName,
  comment,
}: {
  customerId: string;
  customerName: string;
  comment: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { commentLabel } = useNavLabels();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {comment ? (
        <DialogTrigger
          title="Խմբագրել մեկնաբանությունը"
          className="line-clamp-3 cursor-pointer rounded-md text-left font-normal whitespace-pre-line outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {comment}
        </DialogTrigger>
      ) : (
        <DialogTrigger
          render={<Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" />}
        >
          <MessageSquarePlus />
          Ավելացնել
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{commentLabel}</DialogTitle>
          <DialogDescription>{customerName}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from the saved text. */}
        <CommentForm
          customerId={customerId}
          comment={comment ?? ""}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function CommentForm({
  customerId,
  comment,
  onSaved,
}: {
  customerId: string;
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
      const result = await updateCustomerComment(customerId, text);
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
        placeholder="Օրինակ՝ նախընտրում է առաքումը երեկոյան"
        className="w-full resize-y rounded-xl border border-input bg-card px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
      />
      {error && <FieldError>{error}</FieldError>}
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Չեղարկել</DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Պահպանվում է…" : "Պահպանել"}
        </Button>
      </DialogFooter>
    </form>
  );
}
