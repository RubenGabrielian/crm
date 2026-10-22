import "server-only";

import ExcelJS from "exceljs";

/*
 * Excel templates the admin downloads, fills in and uploads back. Columns are
 * found by their header text, so the admin may reorder or drop optional ones.
 */

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 1000;

export type TemplateColumn = {
  header: string;
  width?: number;
  /** Shown as a comment on the header cell. */
  note?: string;
  /** Allowed values, offered as a dropdown in the column. */
  choices?: string[];
  /** Grey column the import ignores, e.g. the current stock. */
  readOnly?: boolean;
};

const HEADER_FILL = "FF1F2A44";
const READ_ONLY_FILL = "FFF1F2F6";

/** A sheet with a bold, frozen header row and the columns' dropdowns. */
export function addTemplateSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: TemplateColumn[],
  rows: (string | number | null)[][] = [],
) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = columns.map((column) => ({
    header: column.header,
    width: column.width ?? Math.max(16, column.header.length + 6),
  }));
  const header = sheet.getRow(1);
  header.height = 24;
  columns.forEach((column, index) => {
    const cell = header.getCell(index + 1);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: column.readOnly ? "FF8A91A5" : HEADER_FILL },
    };
    cell.alignment = { vertical: "middle" };
    if (column.note) cell.note = column.note;
  });
  for (const row of rows) sheet.addRow(row);

  // Dropdowns and grey read-only cells down to a generous number of rows.
  const lastRow = Math.max(rows.length + 200, 300);
  columns.forEach((column, index) => {
    if (!column.choices && !column.readOnly) return;
    for (let row = 2; row <= lastRow; row++) {
      const cell = sheet.getRow(row).getCell(index + 1);
      if (column.choices)
        cell.dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${column.choices.join(",")}"`],
        };
      if (column.readOnly && row <= rows.length + 1)
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: READ_ONLY_FILL } };
    }
  });
  return sheet;
}

/** A sheet of plain lines, for the "how to fill in" instructions. */
export function addNotesSheet(workbook: ExcelJS.Workbook, name: string, lines: string[]) {
  const sheet = workbook.addWorksheet(name);
  sheet.getColumn(1).width = 110;
  lines.forEach((line, index) => {
    const cell = sheet.getCell(index + 1, 1);
    cell.value = line;
    cell.alignment = { wrapText: true, vertical: "top" };
    if (index === 0) cell.font = { bold: true, size: 14 };
  });
  return sheet;
}

export async function xlsxResponse(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** "Գին (֏) *" and "գին (֏)" are the same header. */
export function headerKey(text: string): string {
  return text.replace(/\*/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Any cell value (number, text, rich text, formula, date) as trimmed text. */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value.trim();
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("").trim();
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("text" in value) return String(value.text).trim();
  }
  return String(value).trim();
}

export type SheetRow = {
  /** The row number as Excel shows it, for error messages. */
  number: number;
  /** The cell under a header (matched with headerKey), as text. */
  get: (header: string) => string;
};

export type ReadResult =
  | { ok: true; workbook: ExcelJS.Workbook }
  | { ok: false; error: string };

/** Opens an uploaded .xlsx file, with the size and type checks. */
export async function readUpload(file: FormDataEntryValue | null): Promise<ReadResult> {
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Ընտրեք Excel ֆայլը (.xlsx)" };
  if (!file.name.toLowerCase().endsWith(".xlsx"))
    return { ok: false, error: "Ֆայլը պետք է լինի .xlsx ձևաչափով։ Պահպանեք այն որպես Excel Workbook։" };
  if (file.size > IMPORT_MAX_BYTES)
    return { ok: false, error: "Ֆայլը պետք է լինի մինչև 5 ՄԲ" };
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch (error) {
    console.error("reading uploaded xlsx failed:", error);
    return { ok: false, error: "Չհաջողվեց կարդալ ֆայլը։ Օգտագործեք ներբեռնված օրինակը։" };
  }
  return { ok: true, workbook };
}

/** The example sheet of a template; it is never imported. */
export const EXAMPLE_SHEET = "Օրինակ";

/**
 * The filled rows of the first sheet whose header row has `required`
 * (preferring one named `name`, never the example sheet). Null when no sheet
 * has that column.
 */
export function readRows(
  workbook: ExcelJS.Workbook,
  required: string,
  name?: string,
): SheetRow[] | null {
  const sheets = workbook.worksheets
    .filter((sheet) => sheet.name !== EXAMPLE_SHEET)
    .sort((a, b) => Number(b.name === name) - Number(a.name === name));
  for (const sheet of sheets) {
    const columns = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, column) => {
      const key = headerKey(cellText(cell.value));
      if (key && !columns.has(key)) columns.set(key, column);
    });
    if (!columns.has(headerKey(required))) continue;

    const rows: SheetRow[] = [];
    sheet.eachRow((row, number) => {
      if (number === 1) return;
      const get = (header: string) => {
        const column = columns.get(headerKey(header));
        return column ? cellText(row.getCell(column).value) : "";
      };
      const filled = [...columns.values()].some(
        (column) => cellText(row.getCell(column).value) !== "",
      );
      if (filled) rows.push({ number, get });
    });
    return rows;
  }
  return null;
}
