import "server-only";

import {
  BASE_PRODUCT_FIELDS,
  ITEM_KIND_LABELS,
  productColumns,
  type ProductField,
} from "@/config/product-fields";
import type { BusinessType } from "@/lib/tenant/features";
import type { TemplateColumn } from "./excel";

/* Column headers of the two Excel templates; the import reads by these. */

/** Mixed businesses say per row whether it is a good or a service. */
export const KIND_HEADER = "Տեսակ";

export const CATALOG_SHEET: Record<BusinessType, string> = {
  ecommerce: "Ապրանքներ",
  service: "Դասընթացներ",
  mixed: "Կատալոգ",
};

/** Every field a catalog row can have, with its header. */
export function catalogFields(type: BusinessType): { field: ProductField; header: string }[] {
  return [...BASE_PRODUCT_FIELDS, ...productColumns(type)].map((field) => ({
    field,
    header: field.required ? `${field.label} *` : field.label,
  }));
}

export function catalogColumns(type: BusinessType): TemplateColumn[] {
  const kind: TemplateColumn[] =
    type === "mixed"
      ? [
          {
            header: KIND_HEADER,
            width: 16,
            choices: [ITEM_KIND_LABELS.product, ITEM_KIND_LABELS.service],
            note: "Ապրանք (պահեստով) կամ Ծառայություն։ Դատարկ՝ Ապրանք։",
          },
        ]
      : [];
  return [
    ...kind,
    ...catalogFields(type).map(({ field, header }) => ({
      header,
      width: field.name === "title" ? 32 : 18,
      note:
        field.kind === "text"
          ? undefined
          : field.kind === "integer"
            ? "Ամբողջ թիվ"
            : "Թիվ՝ դրամով, առանց ֏ նշանի",
    })),
  ];
}

/** Example rows for the "Օրինակ" sheet, in catalogColumns order. */
export function catalogExamples(type: BusinessType): (string | number)[][] {
  if (type === "service")
    return [
      ["Անգլերեն A1", 25000, "Անի Սարգսյան", 8, "Երք, Հնգ 19:00"],
      ["Գրաֆիկ դիզայն", 40000, "Արմեն Հակոբյան", 10, ""],
    ];
  if (type === "mixed")
    // Kind, title, price, unit cost, delivery, stock, duration
    return [
      [ITEM_KIND_LABELS.product, "Դիմապակի", 85000, 52000, 0, 4, ""],
      [ITEM_KIND_LABELS.service, "Տեղադրում", 15000, 3000, "", "", "1 ժամ"],
    ];
  return [
    ["Ձեռագործ մոմ", 6500, 2500, 1000, 20],
    ["Կավե բաժակ", 9000, 3800, 1000, 12],
  ];
}

export function catalogNotes(type: BusinessType): string[] {
  const item = type === "service" ? "դասընթաց" : "ապրանք";
  return [
    "Ինչպես լրացնել",
    `1. «${CATALOG_SHEET[type]}» թերթում յուրաքանչյուր տող մեկ ${item} է։ Վերնագրերը մի փոխեք։`,
    "2. * նշված սյունակները պարտադիր են։ Թվերը գրեք առանց ֏ նշանի և բացատների։",
    ...(type === "mixed"
      ? [
          "3. «Տեսակ» սյունակում ընտրեք Ապրանք կամ Ծառայություն։ Ծառայությունը պահեստ չունի, ինքնարժեքը պարտադիր չէ։",
        ]
      : []),
    `${type === "mixed" ? 4 : 3}. Եթե արդեն կա նույն անվանումով ${item}, այն կթարմացվի, նորը չի ստեղծվի։`,
    `${type === "mixed" ? 5 : 4}. Օրինակները տե՛ս «Օրինակ» թերթում։ Այդ թերթը չի ներմուծվում։`,
    `${type === "mixed" ? 6 : 5}. Պահպանեք ֆայլը (.xlsx) և վերբեռնեք այն նույն էջում՝ «Ներմուծել Excel-ից»։`,
  ];
}

// ── Warehouse ────────────────────────────────────────────────
export const STOCK_SHEET = "Ապրանքներ";
export const MATERIALS_SHEET = "Նյութեր";

export const STOCK = {
  title: "Անվանում",
  available: "Առկա է հիմա",
  receive: "Ավելացնել (ստացված քանակ)",
} as const;

export const MATERIAL = {
  name: "Անվանում",
  unit: "Միավոր",
  unitCost: "Միավորի արժեք (֏)",
  available: "Առկա է հիմա",
  receive: "Ավելացնել (ստացված քանակ)",
} as const;

export const STOCK_COLUMNS: TemplateColumn[] = [
  { header: STOCK.title, width: 34, note: "Ապրանքը պետք է արդեն լինի կատալոգում" },
  { header: STOCK.available, width: 16, readOnly: true, note: "Միայն տեղեկության համար, չի ներմուծվում" },
  { header: STOCK.receive, width: 28, note: "Քանի հատ է ստացվել։ Կավելանա առկա քանակին։ Դատարկ՝ առանց փոփոխության" },
];

export const MATERIAL_COLUMNS: TemplateColumn[] = [
  { header: MATERIAL.name, width: 30, note: "Նոր անվանումով տողից կստեղծվի նոր նյութ" },
  { header: MATERIAL.unit, width: 12, note: "օր.՝ հատ, մ, գ (դատարկ՝ հատ)" },
  { header: MATERIAL.unitCost, width: 20, note: "Մեկ միավորի գինը" },
  { header: MATERIAL.available, width: 16, readOnly: true, note: "Միայն տեղեկության համար, չի ներմուծվում" },
  { header: MATERIAL.receive, width: 28, note: "Քանի միավոր է ստացվել։ Կավելանա առկա քանակին" },
];

export const WAREHOUSE_NOTES = [
  "Ինչպես լրացնել",
  "1. «Ապրանքներ» թերթում արդեն կան ձեր ապրանքները։ «Ավելացնել» սյունակում գրեք, քանի հատ է ստացվել։ Այն կավելանա առկա քանակին։",
  "2. Նոր ապրանք նախ ավելացրեք «Ապրանքներ» էջում (կամ նրա Excel ներմուծմամբ), հետո՝ այստեղ։",
  "3. «Նյութեր» թերթում (փաթեթավորում, տուփեր, ժապավեն…) կարող եք լրացնել ստացված քանակը կամ ավելացնել նոր նյութեր՝ նոր տողով։",
  "4. Մոխրագույն «Առկա է հիմա» սյունակը միայն տեղեկության համար է։ Դատարկ «Ավելացնել» բջիջով տողերը չեն փոխվում։",
  "5. Պահպանեք ֆայլը (.xlsx) և վերբեռնեք այն «Պահեստ» էջում՝ «Ներմուծել Excel-ից»։",
];
