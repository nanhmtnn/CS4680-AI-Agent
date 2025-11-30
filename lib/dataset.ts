// // lib/dataset.ts
// export type Row = Record<string, string | number | null>;

// export type Dataset = {
//   name: string;
//   columns: string[];
//   rows: Row[];
// };

// const MISSING_MARKERS = new Set(["", "na", "n/a", "nan", "null", "none", "?", "-"]);

// function parseCsv(text: string, name: string): Dataset {
//   const lines = text
//     .split(/\r?\n/)
//     .map(l => l.trim())
//     .filter(l => l.length > 0);

//   if (lines.length === 0) {
//     throw new Error("Empty CSV file");
//   }

//   const columns = lines[0].split(",").map(h => h.trim());
//   const rows: Row[] = [];

//   for (let i = 1; i < lines.length; i++) {
//     const values = lines[i].split(",");
//     const row: Row = {};

//     columns.forEach((col, idx) => {
//       let raw = (values[idx] ?? "").trim();
//       if (raw === "") {
//         row[col] = null;
//         return;
//       }

//       const lower = raw.toLowerCase();
//       if (MISSING_MARKERS.has(lower)) {
//         row[col] = null;
//         return;
//       }

//       const num = Number(raw);
//       row[col] = Number.isFinite(num) ? num : raw;
//     });

//     rows.push(row);
//   }

//   return { name, columns, rows };
// }

// export async function loadCsvFromUrl(url: string, name?: string): Promise<Dataset> {
//   const res = await fetch(url);
//   if (!res.ok) {
//     throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
//   }
//   const text = await res.text();
//   const datasetName = name ?? url.split("/").pop() ?? "dataset.csv";
//   return parseCsv(text, datasetName);
// }

// export function getDatasetInfo(dataset: Dataset) {
//   const { columns, rows } = dataset;
//   const rowCount = rows.length;
//   const columnCount = columns.length;

//   const columnSummaries = columns.map(col => {
//     let missing = 0;
//     let numericCount = 0;
//     let stringCount = 0;

//     for (const row of rows) {
//       const v = row[col];
//       if (v === null || v === undefined) {
//         missing++;
//       } else if (typeof v === "number") {
//         numericCount++;
//       } else {
//         stringCount++;
//       }
//     }

//     const type =
//       numericCount > 0 && stringCount === 0
//         ? "numeric"
//         : numericCount === 0
//         ? "categorical/string"
//         : "mixed";

//     return {
//       name: col,
//       type,
//       missingValues: missing,
//       nonMissing: rowCount - missing,
//     };
//   });

//   return {
//     name: dataset.name,
//     rowCount,
//     columnCount,
//     columns: columnSummaries,
//     sampleRows: rows.slice(0, 5),
//   };
// }

// export function cleanDataset(dataset: Dataset) {
//   // Simple cleaning:
//   // - drop rows where ALL values are missing
//   // - keep others as-is
//   const before = dataset.rows.length;

//   const cleanedRows = dataset.rows.filter(row => {
//     return Object.values(row).some(v => v !== null && v !== undefined);
//   });

//   const after = cleanedRows.length;

//   const cleaned: Dataset = {
//     ...dataset,
//     rows: cleanedRows,
//   };

//   return {
//     cleaned,
//     summary: {
//       beforeRows: before,
//       afterRows: after,
//       removedRows: before - after,
//     },
//   };
// }
