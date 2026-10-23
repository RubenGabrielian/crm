import ExcelJS from "exceljs";
import {
  EXAMPLE_SHEET,
  addNotesSheet,
  addTemplateSheet,
  xlsxResponse,
} from "@/lib/import/excel";
import {
  CATALOG_SHEET,
  catalogColumns,
  catalogExamples,
  catalogNotes,
} from "@/lib/import/templates";
import { requirePermission } from "@/lib/tenant/get-current-tenant";

/** Empty catalog template for the signed-in business, with examples and notes. */
export async function GET() {
  const tenant = await requirePermission("catalog_edit");
  const type = tenant.businessType;
  const columns = catalogColumns(type);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Numa";
  addTemplateSheet(workbook, CATALOG_SHEET[type], columns);
  addTemplateSheet(workbook, EXAMPLE_SHEET, columns, catalogExamples(type));
  addNotesSheet(workbook, "Ինչպես լրացնել", catalogNotes(type));

  return xlsxResponse(workbook, "numa-catalog.xlsx");
}
