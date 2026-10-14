"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { useMaterials } from "./materials-context";

type Row = { key: number; materialId: string; quantity: string };

const SELECT_CLASS =
  "h-10 w-full min-w-0 rounded-xl border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * "This product uses …" editor. Sent with the form as one hidden JSON field,
 * so the product and its materials are saved together.
 */
export function MaterialUsesField({
  initial,
  error,
}: {
  initial: { materialId: string; quantity: number }[];
  error?: string;
}) {
  const materials = useMaterials();
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((use, index) => ({
      key: index,
      materialId: use.materialId,
      quantity: String(use.quantity),
    })),
  );
  const [nextKey, setNextKey] = useState(initial.length);

  const update = (key: number, change: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...change } : row)),
    );
  const add = () => {
    const used = new Set(rows.map((row) => row.materialId));
    const free = materials.find((material) => !used.has(material.id));
    setRows((current) => [
      ...current,
      { key: nextKey, materialId: free?.id ?? "", quantity: "1" },
    ]);
    setNextKey(nextKey + 1);
  };

  const materialsCost = rows.reduce((sum, row) => {
    const material = materials.find((m) => m.id === row.materialId);
    return (
      sum + (material ? material.unitCost * (Number(row.quantity) || 0) : 0)
    );
  }, 0);

  const payload = JSON.stringify(
    rows.map((row) => ({
      materialId: row.materialId,
      quantity: Number(row.quantity),
    })),
  );

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel>
        Ծախսվող նյութեր
        <span className="font-normal text-muted-foreground">(ոչ պարտադիր)</span>
      </FieldLabel>
      <input type="hidden" name="materials" value={payload} />

      {materials.length === 0 ? (
        <FieldDescription>
          Ավելացրեք փաթեթավորումը կամ այլ նյութերը{" "}
          <Link
            href="/inventory"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Պահեստ
          </Link>{" "}
          էջում, հետո ընտրեք դրանք այստեղ։
        </FieldDescription>
      ) : (
        <>
          <FieldDescription>
            Ամեն 1 վաճառված հատի համար պահեստից ավտոմատ կհանվի։
          </FieldDescription>
          {rows.length > 0 && (
            <ul className="flex flex-col gap-2">
              {rows.map((row) => {
                const unit =
                  materials.find((m) => m.id === row.materialId)?.unit ?? "հատ";
                return (
                  <li
                    key={row.key}
                    className="grid grid-cols-[1fr_6.5rem_auto] items-center gap-2"
                  >
                    <select
                      aria-label="Նյութ"
                      value={row.materialId}
                      onChange={(event) =>
                        update(row.key, {
                          materialId: event.currentTarget.value,
                        })
                      }
                      className={SELECT_CLASS}
                    >
                      <option value="" disabled>
                        Ընտրեք
                      </option>
                      {materials.map((material) => (
                        <option
                          key={material.id}
                          value={material.id}
                          disabled={
                            material.id !== row.materialId &&
                            rows.some(
                              (other) => other.materialId === material.id,
                            )
                          }
                        >
                          {material.name}
                        </option>
                      ))}
                    </select>
                    <span className="relative">
                      <Input
                        aria-label={`Քանակ (${unit})`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.quantity}
                        onChange={(event) =>
                          update(row.key, {
                            quantity: event.currentTarget.value,
                          })
                        }
                        className="pr-9 tabular-nums"
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                        {unit}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Հեռացնել նյութը"
                      onClick={() =>
                        setRows((current) =>
                          current.filter((r) => r.key !== row.key),
                        )
                      }
                    >
                      <X />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {rows.length > 0 && (
            <p className="text-xs tabular-nums text-muted-foreground">
              Նյութերի արժեքը մեկ հատի համար՝{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(Math.round(materialsCost * 100) / 100)}
              </span>
              ։ Ավելանում է ինքնարժեքին՝ փոփոխական ծախսի մեջ։
            </p>
          )}
          {rows.length < materials.length && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={add}
            >
              <Plus />
              Ավելացնել նյութ
            </Button>
          )}
        </>
      )}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
