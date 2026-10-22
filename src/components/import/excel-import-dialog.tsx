"use client";

import { useActionState, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { cn } from "cn";
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
import {
  importCatalog,
  importWarehouse,
  type ImportState,
} from "@/lib/import/actions";

const ACTIONS = { catalog: importCatalog, warehouse: importWarehouse };
const TEMPLATES = {
  catalog: "/api/import/catalog-template",
  warehouse: "/api/import/warehouse-template",
};

const INITIAL: ImportState = { done: false, summary: [], errors: [], formError: null };

/** Excel import: download the template, fill it in, upload it back. */
export function ExcelImportDialog({
  target,
  description,
}: {
  target: "catalog" | "warehouse";
  /** What the file adds or changes, shown under the title. */
  description: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        <FileSpreadsheet />
        Excel
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ներմուծել Excel-ից</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts clean. */}
        <ImportForm target={target} />
      </DialogContent>
    </Dialog>
  );
}

function ImportForm({ target }: { target: "catalog" | "warehouse" }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    async (prev: ImportState, formData: FormData) => {
      const next = await ACTIONS[target](prev, formData);
      // React clears the form after the action, so the file must be picked again.
      setFileName(null);
      return next;
    },
    INITIAL,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <ol className="grid gap-3 text-sm">
        <li className="flex items-start gap-3">
          <Step n={1} />
          <div className="grid gap-2">
            <span>Ներբեռնեք օրինակը և լրացրեք այն՝ առանց վերնագրերը փոխելու։</span>
            <a
              href={TEMPLATES[target]}
              download
              className="inline-flex w-fit items-center gap-2 rounded-full border border-input bg-card px-3.5 py-1.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="size-4" aria-hidden />
              Ներբեռնել օրինակը (.xlsx)
            </a>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <Step n={2} />
          <div className="grid w-full gap-2">
            <span>Ընտրեք լրացված ֆայլը։</span>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-input px-4 py-4 transition-colors hover:bg-muted/50 has-focus-visible:ring-2 has-focus-visible:ring-ring",
                fileName && "border-primary/50 bg-primary/5",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Upload className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {fileName ?? "Ընտրել ֆայլ"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  .xlsx, մինչև 5 ՄԲ
                </span>
              </span>
              <input
                type="file"
                name="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={(event) =>
                  setFileName(event.currentTarget.files?.[0]?.name ?? null)
                }
              />
            </label>
          </div>
        </li>
      </ol>

      {state.formError && <FieldError>{state.formError}</FieldError>}

      {state.done && (
        <section
          role="status"
          className="grid gap-2 rounded-2xl bg-muted px-4 py-3 text-sm"
        >
          <p className="flex items-center gap-2 font-medium">
            <CircleCheck className="size-4 text-emerald-600" aria-hidden />
            Ներմուծումն ավարտվեց
          </p>
          <p className="tabular-nums text-muted-foreground">{state.summary.join(" · ")}</p>
          {state.errors.length > 0 && (
            <ul className="grid max-h-48 gap-1.5 overflow-y-auto border-t pt-2">
              {state.errors.map((error) => (
                <li key={`${error.sheet}-${error.row}`} className="flex gap-2 text-xs">
                  <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" aria-hidden />
                  <span>
                    <span className="font-medium">
                      {error.sheet}, տող {error.row}՝
                    </span>{" "}
                    {error.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {state.done ? "Փակել" : "Չեղարկել"}
        </DialogClose>
        <Button type="submit" disabled={pending || !fileName}>
          {pending ? "Ներմուծվում է…" : "Ներմուծել"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {n}
    </span>
  );
}
