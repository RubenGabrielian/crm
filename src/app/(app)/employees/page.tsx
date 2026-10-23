import { TriangleAlert, UserCog } from "lucide-react";
import {
  AddEmployeeDialog,
  DeleteEmployeeDialog,
  EditEmployeeDialog,
} from "@/components/employees/employee-dialogs";
import { EmptyState } from "@/components/layout/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getNavigation } from "@/config/navigation";
import { listEmployees } from "@/lib/employees/queries";
import { getNavLabels } from "@/lib/navigation/labels";
import { requireOwner } from "@/lib/tenant/get-current-tenant";
import { isPagePermission } from "@/lib/tenant/permissions";

// Reads live data for the current tenant on every request.
export const instant = false;

export default async function EmployeesPage() {
  // Only the owner manages who works in the business.
  const tenant = await requireOwner();
  const [{ employees, error }, labels] = await Promise.all([
    listEmployees(tenant.id),
    getNavLabels(),
  ]);
  const menu = getNavigation(tenant.businessType, labels);
  const pageLabel = (page: string) =>
    menu.find((item) => item.href === `/${page}`)?.label;

  if (error) {
    console.error("listEmployees failed:", error);
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Չհաջողվեց բեռնել տվյալները"
        description="Ստուգեք կապը տվյալների բազայի հետ և թարմացրեք էջը։"
      />
    );
  }

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={UserCog}
        title="Դեռ աշխատակիցներ չկան"
        description="Ավելացրեք աշխատակցին իր էլ. հասցեով և ընտրեք, թե ինչ էջեր տեսնի և ինչ կարողանա անել։"
        action={<AddEmployeeDialog />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <AddEmployeeDialog />
      </div>
      <div className="overflow-hidden rounded-3xl bg-card p-3 shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Աշխատակից</TableHead>
              <TableHead className="px-4">Հասանելի էջեր</TableHead>
              <TableHead className="px-4">Իրավունքներ</TableHead>
              <TableHead className="px-4">
                <span className="sr-only">Գործողություններ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => {
              const pages = employee.permissions
                .filter(isPagePermission)
                .map(pageLabel)
                .filter(Boolean);
              return (
                <TableRow key={employee.id}>
                  <TableCell className="px-4">
                    <span className="block font-medium">{employee.fullName}</span>
                    <span className="block text-xs text-muted-foreground">
                      {employee.email}
                      {!employee.joined && " · դեռ չի մտել"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-72 px-4 whitespace-normal">
                    <span className="flex flex-wrap gap-1">
                      {pages.map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-muted px-2 py-0.5 text-xs"
                        >
                          {label}
                        </span>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 text-sm text-muted-foreground">
                    <span className="block">
                      {employee.permissions.includes("catalog_edit")
                        ? `Խմբագրում է՝ ${pageLabel("catalog") ?? "կատալոգ"}`
                        : "Միայն դիտում"}
                    </span>
                    <span className="block">
                      {employee.permissions.includes("cost_view")
                        ? "Տեսնում է ինքնարժեքը"
                        : "Ինքնարժեքը թաքցված է"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4">
                    <span className="flex items-center justify-end gap-1">
                      <EditEmployeeDialog employee={employee} />
                      <DeleteEmployeeDialog employee={employee} />
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
