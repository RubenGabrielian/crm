"use client";

import { useState, useTransition } from "react";
import { Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OrderSource } from "@/lib/orders/queries";
import { addOrderSource, deleteOrderSource } from "@/lib/orders/source-actions";

export function ManageSourcesDialog({ sources }: { sources: OrderSource[] }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addOrderSource(name);
      if (result.ok) setName("");
      else setError(result.error);
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteOrderSource(id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        <Tags />
        Աղբյուրներ
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Պատվերների աղբյուրներ</DialogTitle>
          <DialogDescription>
            Որտեղից են գալիս պատվերները։ Այս ցանկից կարող եք ընտրել
            յուրաքանչյուր պատվերի համար։
          </DialogDescription>
        </DialogHeader>

        {sources.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {sources.map((source) => (
              <li
                key={source.id}
                className="flex items-center justify-between gap-3 py-1 pr-1 pl-3"
              >
                <span className="min-w-0 truncate text-sm">{source.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Ջնջել՝ ${source.name}`}
                  disabled={pending}
                  onClick={() => remove(source.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Դեռ աղբյուրներ չկան։ Ավելացրեք առաջինը։
          </p>
        )}

        <form onSubmit={add} noValidate>
          <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor="new-source">Նոր աղբյուր</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="new-source"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Օրինակ՝ TikTok"
                maxLength={40}
                autoComplete="off"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "new-source-error" : undefined}
              />
              <Button type="submit" disabled={pending || !name.trim()}>
                Ավելացնել
              </Button>
            </div>
            {error && <FieldError id="new-source-error">{error}</FieldError>}
          </Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}
