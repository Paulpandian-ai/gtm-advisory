import { NextRequest, NextResponse } from "next/server";
import { extractGTMData } from "@/lib/aws/bedrock";
import type { ExtractedCompanyData } from "@/lib/aws/bedrock";

/* ── Confidence scoring ───────────────────────────────────── */

type Confidence = "high" | "medium" | "low" | "not_found";

interface FieldConfidence {
  field: string;
  confidence: Confidence;
}

function scoreConfidence(
  data: ExtractedCompanyData
): FieldConfidence[] {
  const fields: { key: keyof ExtractedCompanyData; label: string }[] = [
    { key: "companyName", label: "Company Name" },
    { key: "industry", label: "Industry" },
    { key: "stage", label: "Stage" },
    { key: "arr", label: "ARR" },
    { key: "arrGrowth", label: "Growth" },
    { key: "winRate", label: "Win Rate" },
    { key: "salesCycleDays", label: "Sales Cycle" },
    { key: "cac", label: "CAC" },
    { key: "ltv", label: "LTV" },
    { key: "nrr", label: "NRR" },
    { key: "gtmMotion", label: "GTM Motion" },
    { key: "pricingModel", label: "Pricing Model" },
    { key: "hasPartnerProgram", label: "Partner Data" },
    { key: "marketplacePresence", label: "Marketplace Presence" },
  ];

  // Core identifiers get "high" when present, everything else "medium"
  const coreFields = new Set(["companyName", "industry", "stage", "arr"]);

  return fields.map(({ key, label }) => {
    const val = data[key];
    const isNull =
      val === null ||
      val === undefined ||
      (Array.isArray(val) && val.length === 0);

    if (isNull) return { field: label, confidence: "not_found" as Confidence };

    return {
      field: label,
      confidence: coreFields.has(key)
        ? ("high" as Confidence)
        : ("medium" as Confidence),
    };
  });
}

/* ── URL fetching helper ─────────────────────────────────── */

async function fetchPageContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; GTMAdvisory/1.0; +https://gtm-advisory.com)",
      Accept: "text/html,application/xhtml+xml,text/plain",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();

  // Strip HTML tags to get plain text — good enough for Claude to parse
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Limit to ~12k chars so we don't blow out the context
  return text.slice(0, 12_000);
}

/* ── Route handler ────────────────────────────────────────── */

/**
 * POST /api/parse-report
 *
 * Body: { text?: string, url?: string }
 *
 * Returns:
 * {
 *   data: ExtractedCompanyData,
 *   confidences: FieldConfidence[],
 *   usage: { inputTokens, outputTokens, model },
 *   sourceText: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, url } = body as { text?: string; url?: string };

    if (!text && !url) {
      return NextResponse.json(
        { error: "Provide either text or url in the request body" },
        { status: 400 }
      );
    }

    // 1. Resolve source text
    let sourceText: string;

    if (url) {
      try {
        sourceText = await fetchPageContent(url);
      } catch (err) {
        return NextResponse.json(
          {
            error: `Could not fetch URL: ${err instanceof Error ? err.message : "unknown error"}`,
          },
          { status: 422 }
        );
      }
    } else {
      sourceText = (text as string).slice(0, 12_000);
    }

    if (sourceText.length < 20) {
      return NextResponse.json(
        { error: "Text too short to extract meaningful data" },
        { status: 400 }
      );
    }

    // 2. Call Bedrock Claude for extraction
    const { data, usage } = await extractGTMData(sourceText);

    // 3. Score confidence per field
    const confidences = scoreConfidence(data);

    return NextResponse.json({
      data,
      confidences,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        model: usage.model,
      },
      sourceText,
    });
  } catch (error) {
    console.error("Parse report failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to parse report",
      },
      { status: 500 }
    );
  }
}
