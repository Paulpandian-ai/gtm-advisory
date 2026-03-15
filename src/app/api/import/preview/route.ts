import { NextRequest, NextResponse } from "next/server";

/* ── Column auto-match heuristics ──────────────────────── */

const FIELD_MAP: Record<string, string> = {
  companyname: "companyName",
  company: "companyName",
  name: "companyName",
  industry: "industry",
  vertical: "industry",
  stage: "stage",
  fundingstage: "stage",
  arr: "arr",
  annualrecurringrevenue: "arr",
  revenue: "arr",
  employees: "employees",
  headcount: "employees",
  employeecount: "employees",
  funding: "funding",
  totalfunding: "funding",
  gtmmotion: "gtmMotion",
  motion: "gtmMotion",
  gotomarketmotion: "gtmMotion",
  winrate: "winRate",
  salescycle: "salesCycleLength",
  salescyclelength: "salesCycleLength",
  salescycledays: "salesCycleLength",
  cac: "cac",
  customeracquisitioncost: "cac",
  ltv: "ltv",
  lifetimevalue: "ltv",
  nrr: "nrr",
  netrevenueretention: "nrr",
  churnrate: "churnRate",
  churn: "churnRate",
  monthlychurn: "churnRate",
  pricingmodel: "pricingModel",
  pricing: "pricingModel",
  freetier: "freeTier",
  partnerprogram: "partnerProgram",
  website: "website",
  hqlocation: "hqLocation",
  location: "hqLocation",
  founded: "founded",
  description: "description",
  growth: "growth",
};

function normalize(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function suggestMapping(
  headers: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const key = normalize(header);
    mapping[header] = FIELD_MAP[key] ?? "— skip —";
  }
  return mapping;
}

/* ── Simple CSV parser (no dependency needed server-side) ─ */

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse header
  const headers = parseCsvLine(lines[0]);

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  return { headers, rows };
}

/** Parse a single CSV line handling quoted fields. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * POST /api/import/preview
 *
 * Body: { csv: string }  (raw CSV text)
 *
 * Returns:
 *   {
 *     headers: string[],
 *     preview: Record<string, string>[],   // first 5 rows
 *     totalRows: number,
 *     mapping: Record<string, string>,      // suggested column → db field
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const csvText: string = body.csv;

    if (!csvText || typeof csvText !== "string") {
      return NextResponse.json(
        { error: "csv field is required (string)" },
        { status: 400 }
      );
    }

    const { headers, rows } = parseCsv(csvText);

    if (headers.length === 0) {
      return NextResponse.json(
        { error: "CSV has no headers" },
        { status: 400 }
      );
    }

    const mapping = suggestMapping(headers);

    return NextResponse.json({
      headers,
      preview: rows.slice(0, 5),
      totalRows: rows.length,
      mapping,
    });
  } catch (error) {
    console.error("Import preview failed:", error);
    return NextResponse.json(
      { error: "Failed to parse CSV" },
      { status: 500 }
    );
  }
}
