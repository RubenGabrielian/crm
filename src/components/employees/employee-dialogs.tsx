"use client";

import { useActionState, useState, useTransition } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getNavigation } from "@/config/navigation";
import {
  deleteEmployee,
  saveEmployee,
  type EmployeeFormState,
} from "@/lib/employees/actions";
import type { Employee } from "@/lib/employees/queries";
import { useNavLabels } from "@/lib/navigation/labels-context";
import { useTenant } from "@/lib/tenant/tenant-context";
import {
  MONEY_PAGES,
  PAGE_PERMISSIONS,
  type Permission,
} from "@/lib/tenant/permissions";

const INITIAL_STATE: EmployeeFormState = {
  ok: false,
  values: {},
  errors: {},
  formError: null,
};

/** What a new employee gets ticked to start with: the day-to-day pages. */
const DEFAULT_PERMISSIONS: Permission[] = ["catalog", "orders", "customers"];

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-11 rounded-2xl" />}>
        <UserPlus />
        Ավելացնել աշխատակից
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Նոր աշխատակից</DialogTitle>
          <DialogDescription>
            Աշխատակիցը կմտնի այս էլ. հասցեով և կտեսնի միայն այն, ինչ նշեք։
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts empty. */}
        <EmployeeForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function EditEmployeeDialog({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label={`Խմբագրել՝ ${employee.fullName}`}
          />
        }
      >
        <Pencil />
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{employee.fullName}</DialogTitle>
          <DialogDescription>{employee.email}</DialogDescription>
        </DialogHeader>
        <EmployeeForm employee={employee} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EmployeeForm({
  employee,
  onSaved,
}: {
  employee?: Employee;
  onSaved: () => void;
}) {
  const tenant = useTenant();
  const { labels } = useNavLabels();
  const [state, formAction, pending] = useActionState(
    async (prev: EmployeeFormState, formData: FormData) => {
      const next = await saveEmployee(prev, formData);
      if (next.ok) onSaved();
      return next;
    },
    INITIAL_STATE,
  );
  const [checked, setChecked] = useState<Set<Permission>>(
    () => new Set(employee?.permissions ?? DEFAULT_PERMISSIONS),
  );

  // Page names as this owner sees them in the menu; pages this business type
  // doesn't have (e.g. the warehouse for services) are left out.
  const menu = getNavigation(tenant.businessType, labels);
  const pageLabel = (page: string) =>
    menu.find((item) => item.href === `/${page}`)?.label;
  const workPages = PAGE_PERMISSIONS.filter(
    (page) => !MONEY_PAGES.includes(page) && pageLabel(page),
  );
  const moneyPages = MONEY_PAGES.filter((page) => pageLabel(page));
  const catalogLabel = pageLabel("catalog") ?? "Կատալոգ";

  function toggle(permission: Permission, on: boolean) {
    setChecked((current) => {
      const next = new Set(current);
      if (on) next.add(permission);
      else next.delete(permission);
      // Editing the catalog needs the catalog page.
      if (permission === "catalog" && !on) next.delete("catalog_edit");
      if (permission === "catalog_edit" && on) next.add("catalog");
      return next;
    });
  }

  const box = (permission: Permission, label: string, hint?: string) => (
    <label
      key={permission}
      className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-muted/60"
    >
      <input
        type="checkbox"
        name="permissions"
        value={permission}
        checked={checked.has(permission)}
        onChange={(event) => toggle(permission, event.currentTarget.checked)}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span className="grid gap-0.5 text-sm">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );

  const nameError = state.errors.full_name;
  const emailError = state.errors.email;
  const permissionsError = state.errors.permissions;

  return (
    <form action={formAction} noValidate className="grid gap-4">
      {employee && <input type="hidden" name="id" value={employee.id} />}
      <FieldGroup className="gap-4">
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor="employee-name">Անուն Ազգանուն</FieldLabel>
          <Input
            id="employee-name"
            name="full_name"
            defaultValue={state.values.full_name ?? employee?.fullName ?? ""}
            maxLength={80}
            autoFocus
            autoComplete="off"
            aria-invalid={nameError ? true : undefined}
          />
          {nameError && <FieldError>{nameError}</FieldError>}
        </Field>

        {!employee && (
          <Field data-invalid={emailError ? true : undefined}>
            <FieldLabel htmlFor="employee-email">Էլ. հասցե</FieldLabel>
            <Input
              id="employee-email"
              name="email"
              type="email"
              placeholder="anun@gmail.com"
              defaultValue={state.values.email ?? ""}
              autoComplete="off"
              aria-invalid={emailError ? true : undefined}
            />
            <FieldDescription>
              Այս հասցեով աշխատակիցը կմտնի համակարգ՝ մուտքի կոդով։
            </FieldDescription>
            {emailError && <FieldError>{emailError}</FieldError>}
          </Field>
        )}

        <fieldset className="grid gap-1">
          <legend className="mb-1 text-sm font-semibold">Ինչ էջեր է տեսնում</legend>
          {workPages.map((page) => box(page, pageLabel(page)!))}
        </fieldset>

        <fieldset className="grid gap-1">
          <legend className="mb-1 text-sm font-semibold">Գումարների շարժ</legend>
          <p className="mb-1 text-xs text-muted-foreground">
            Եկամուտ, շահույթ, ծախսեր և վերաներդրումներ։ Չնշելու դեպքում
            աշխատակիցը դրանք չի տեսնի։
          </p>
          {moneyPages.map((page) =>
            page === "dashboard"
              ? box(
                  page,
                  `${pageLabel(page)}՝ ֆինանսական ամփոփում`,
                  "Առանց սրա գլխավոր էջում կտեսնի միայն պատվերները, պահեստը և իր բաժինները։",
                )
              : box(page, pageLabel(page)!),
          )}
        </fieldset>

        <fieldset className="grid gap-1">
          <legend className="mb-1 text-sm font-semibold">Իրավունքներ</legend>
          {box(
            "catalog_edit",
            `Կարող է ավելացնել, խմբագրել և ջնջել (${catalogLabel})`,
            "Առանց սրա աշխատակիցը միայն կտեսնի ցանկը։",
          )}
          {box(
            "cost_view",
            "Տեսնում է ինքնարժեքը",
            "Ապրանքների և նյութերի ինքնարժեքը։ Չնշելու դեպքում այն թաքցված է ամենուր, իսկ խմբագրելիս պահպանվում է նախկին արժեքը։",
          )}
        </fieldset>
        {permissionsError && <FieldError>{permissionsError}</FieldError>}
      </FieldGroup>

      {state.formError && <FieldError>{state.formError}</FieldError>}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Չեղարկել
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Պահպանվում է…" : employee ? "Պահպանել" : "Ավելացնել"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DeleteEmployeeDialog({ employee }: { employee: Employee }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteEmployee(employee.id);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            aria-label={`Հեռացնել՝ ${employee.fullName}`}
          />
        }
      >
        <Trash2 />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="leading-snug">
            Հեռացնե՞լ «{employee.fullName}»
          </DialogTitle>
          <DialogDescription>
            {employee.email} հասցեով այլևս չի կարողանա մտնել ձեր բիզնես։
          </DialogDescription>
        </DialogHeader>
        {error && <FieldError>{error}</FieldError>}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Չեղարկել
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
            {pending ? "Հեռացվում է…" : "Հեռացնել"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
