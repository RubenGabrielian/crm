import ExcelJS from "exceljs";
import { addNotesSheet, addTemplateSheet, xlsxResponse } from "@/lib/import/excel";
import {
  MATERIALS_SHEET,
  MATERIAL_COLUMNS,
  STOCK_COLUMNS,
  STOCK_SHEET,
  WAREHOUSE_NOTES,
} from "@/lib/import/templates";
import { listInventory } from "@/lib/inventory/queries";
import { listMaterials } from "@/lib/materials/queries";
import {
  getCurrentAccess,
  requirePermission,
} from "@/lib/tenant/get-current-tenant";
import { can } from "@/lib/tenant/permissions";

/**
 * Warehouse template, filled with the business's products and materials and
 * their current stock, so the admin only types what arrived.
 */
export async function GET() {
  const tenant = await requirePermission("inventory");
  const showCost = can(await getCurrentAccess(), "cost_view");
  const [{ rows }, { materials }] = await Promise.all([
    listInventory(tenant.id),
    listMaterials(tenant.id),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Numa";
  addTemplateSheet(
    workbook,
    STOCK_SHEET,
    STOCK_COLUMNS,
    rows.map((row) => [row.title, row.available, null]),
  );
  addTemplateSheet(
    workbook,
    MATERIALS_SHEET,
    MATERIAL_COLUMNS,
    materials.map((material) => [
      material.name,
      material.unit,
      showCost ? material.unitCost : null,
      material.available,
      null,
    ]),
  );
  addNotesSheet(workbook, "Ինչպես լրացնել", WAREHOUSE_NOTES);

  return xlsxResponse(workbook, "numa-warehouse.xlsx");
}
