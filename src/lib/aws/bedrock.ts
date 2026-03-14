import {
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { bedrockClient } from "./config";
import type {
  CompanyProfile,
  BenchmarkItem,
  InsightCategory,
} from "./types";
import type { BedrockUsage } from "./bedrock-types";

export type { BedrockUsage };

// ============================================================
// Model IDs
// ============================================================

export const MODELS = {
  SONNET: "anthropic.claude-sonnet-4-20250514-v1:0",
  OPUS: "anthropic.claude-opus-4-20250514-v1:0",
} as const;

type ModelId = (typeof MODELS)[keyof typeof MODELS];

// ============================================================
// Types
// ============================================================

export interface ExtractedCompanyData {
  companyName: string | null;
  industry: string | null;
  stage: string | null;
  arr: number | null;
  arrGrowth: number | null;
  employees: number | null;
  gtmMotion: string | null;
  primaryChannel: string | null;
  channelMix: {
    outbound: number | null;
    inbound: number | null;
    plg: number | null;
    partner: number | null;
    marketplace: number | null;
    events: number | null;
  };
  winRate: number | null;
  salesCycleDays: number | null;
  cac: number | null;
  ltv: number | null;
  ltvCacRatio: number | null;
  nrr: number | null;
  grossRetention: number | null;
  monthlyChurn: number | null;
  acv: number | null;
  pricingModel: string | null;
  tierCount: number | null;
  hasFreeTier: boolean | null;
  hasPartnerProgram: boolean | null;
  partnerCount: number | null;
  partnerRevenuePct: number | null;
  marketplacePresence: string[];
  cosellWinRate: number | null;
  techStack: {
    crm: string | null;
    salesEngagement: string | null;
    conversationIntel: string | null;
    dataEnrichment: string | null;
  };
}

export interface Insight {
  insightText: string;
  category: InsightCategory;
  impactScore: number;
  confidence: number;
  relatedSegments: string[];
}

// ============================================================
// Core: Invoke Bedrock
// ============================================================

async function invokeModel(
  model: ModelId,
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    retries?: number;
  }
): Promise<{ text: string; usage: BedrockUsage }> {
  const maxRetries = options?.retries ?? 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const body = JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const response = await bedrockClient.send(
        new InvokeModelCommand({
          modelId: model,
          contentType: "application/json",
          accept: "application/json",
          body: new TextEncoder().encode(body),
        })
      );

      const result = JSON.parse(new TextDecoder().decode(response.body));

      const usage: BedrockUsage = {
        inputTokens: result.usage?.input_tokens ?? 0,
        outputTokens: result.usage?.output_tokens ?? 0,
        model,
      };

      logUsage(usage);

      const text =
        result.content?.[0]?.text ?? result.completion ?? "";

      return { text, usage };
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        (err.name === "ThrottlingException" ||
          err.name === "ServiceUnavailableException" ||
          err.name === "ModelTimeoutException");

      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.warn(
          `Bedrock retry ${attempt + 1}/${maxRetries} after ${delay}ms:`,
          err instanceof Error ? err.message : err
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }

  throw new Error("Bedrock invocation failed after all retries");
}

// ============================================================
// Core: Invoke Bedrock with Streaming
// ============================================================

export async function* invokeModelStream(
  model: ModelId,
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): AsyncGenerator<string, BedrockUsage> {
  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.5,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const response = await bedrockClient.send(
    new InvokeModelWithResponseStreamCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: new TextEncoder().encode(body),
    })
  );

  let inputTokens = 0;
  let outputTokens = 0;

  if (response.body) {
    for await (const event of response.body) {
      if (event.chunk?.bytes) {
        const chunk = JSON.parse(
          new TextDecoder().decode(event.chunk.bytes)
        );

        if (chunk.type === "content_block_delta" && chunk.delta?.text) {
          yield chunk.delta.text;
        }

        if (chunk.type === "message_delta" && chunk.usage) {
          outputTokens = chunk.usage.output_tokens ?? outputTokens;
        }

        if (chunk.type === "message_start" && chunk.message?.usage) {
          inputTokens = chunk.message.usage.input_tokens ?? 0;
        }
      }
    }
  }

  const usage: BedrockUsage = { inputTokens, outputTokens, model };
  logUsage(usage);
  return usage;
}

// ============================================================
// Use Case 1: Report Parser
// ============================================================

const EXTRACTION_SYSTEM_PROMPT = `You are a GTM data analyst. Extract all go-to-market metrics from the following text.
Return ONLY a JSON object with these fields (use null for anything not explicitly stated):
{
  "companyName": string | null,
  "industry": string | null,
  "stage": string | null,
  "arr": number | null,
  "arrGrowth": number | null,
  "employees": number | null,
  "gtmMotion": string | null,
  "primaryChannel": string | null,
  "channelMix": {"outbound": number|null, "inbound": number|null, "plg": number|null, "partner": number|null, "marketplace": number|null, "events": number|null},
  "winRate": number | null,
  "salesCycleDays": number | null,
  "cac": number | null,
  "ltv": number | null,
  "ltvCacRatio": number | null,
  "nrr": number | null,
  "grossRetention": number | null,
  "monthlyChurn": number | null,
  "acv": number | null,
  "pricingModel": string | null,
  "tierCount": number | null,
  "hasFreeTier": boolean | null,
  "hasPartnerProgram": boolean | null,
  "partnerCount": number | null,
  "partnerRevenuePct": number | null,
  "marketplacePresence": string[],
  "cosellWinRate": number | null,
  "techStack": {"crm": string|null, "salesEngagement": string|null, "conversationIntel": string|null, "dataEnrichment": string|null}
}
Be precise. Only include data explicitly stated in the text. Do not infer or estimate.
Return valid JSON only — no markdown fences, no commentary.`;

export async function extractGTMData(
  text: string
): Promise<{ data: ExtractedCompanyData; usage: BedrockUsage }> {
  const { text: responseText, usage } = await invokeModel(
    MODELS.SONNET,
    EXTRACTION_SYSTEM_PROMPT,
    text,
    { maxTokens: 2048, temperature: 0 }
  );

  const cleaned = responseText
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  const data = JSON.parse(cleaned) as ExtractedCompanyData;
  return { data, usage };
}

// ============================================================
// Use Case 2: Insight Generator
// ============================================================

const INSIGHT_SYSTEM_PROMPT = `You are a GTM strategy analyst. Given benchmark data across different segments, identify the most interesting and actionable patterns.

Return a JSON array of exactly 10 insights, each with this structure:
{
  "insightText": "Clear, specific insight statement",
  "category": "Pricing" | "Sales Efficiency" | "Growth" | "Channel Mix" | "Ecosystem" | "Market Trend" | "Competitive",
  "impactScore": 1-10 (how impactful this insight is for GTM strategy),
  "confidence": 0.0-1.0 (how confident you are based on the data),
  "relatedSegments": ["segment names relevant to this insight"]
}

Focus on:
- Cross-segment patterns (e.g., PLG companies have 2x better NRR than Sales-Led)
- Stage-specific inflection points (e.g., partner revenue jumps 3x from Series A to B)
- Metric correlations (e.g., companies with <20 day sales cycles have 40% higher win rates)
- Outlier observations (e.g., DevTools has the lowest CAC but highest churn)
- Actionable recommendations tied to specific data points

Return valid JSON only — no markdown fences, no commentary.`;

export async function generateInsights(
  benchmarkData: BenchmarkItem[]
): Promise<{ insights: Insight[]; usage: BedrockUsage }> {
  const dataStr = JSON.stringify(
    benchmarkData.map((b) => ({
      segment: `${b.segmentType}/${b.segmentValue}`,
      metric: b.metricName,
      p25: b.p25,
      p50: b.p50,
      p75: b.p75,
      mean: b.mean,
      n: b.sampleSize,
      unit: b.unit,
    })),
    null,
    2
  );

  const { text: responseText, usage } = await invokeModel(
    MODELS.SONNET,
    INSIGHT_SYSTEM_PROMPT,
    `Here is the benchmark data:\n\n${dataStr}`,
    { maxTokens: 4096, temperature: 0.3 }
  );

  const cleaned = responseText
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  const insights = JSON.parse(cleaned) as Insight[];
  return { insights, usage };
}

// ============================================================
// Use Case 3: GTM Score Narrator (streaming)
// ============================================================

const NARRATION_SYSTEM_PROMPT = `You are a senior GTM advisor writing a performance analysis for a SaaS company.

Given the company's metrics and relevant benchmark data, write a 3-4 paragraph analysis of their GTM health.

Structure:
1. Opening paragraph: Overall GTM health assessment with a clear verdict (strong/moderate/needs work)
2. Strengths: Specific metrics that exceed benchmarks, with exact numbers and percentile positions
3. Weaknesses: Areas below benchmark with specific recommendations for improvement
4. Strategic recommendation: One high-impact action they should take next quarter

Use precise numbers. Reference percentiles (e.g., "Your 28% win rate places you at P75 for Series A companies"). Be direct and actionable, not generic.`;

export async function narrateGTMScore(
  company: CompanyProfile,
  benchmarks: BenchmarkItem[],
  companyMetrics: {
    revenue?: Record<string, unknown>;
    sales?: Record<string, unknown>;
    channels?: Record<string, unknown>;
    ecosystem?: Record<string, unknown>;
  }
): Promise<{ narrative: string; usage: BedrockUsage }> {
  const context = JSON.stringify(
    {
      company: {
        name: company.name,
        stage: company.stage,
        industry: company.industry,
        arr: company.arr,
        growth: company.growth,
        employees: company.employees,
        gtmMotion: company.gtmMotion,
      },
      metrics: companyMetrics,
      benchmarks: benchmarks.map((b) => ({
        segment: `${b.segmentType}/${b.segmentValue}`,
        metric: b.metricName,
        p25: b.p25,
        p50: b.p50,
        p75: b.p75,
      })),
    },
    null,
    2
  );

  const { text, usage } = await invokeModel(
    MODELS.SONNET,
    NARRATION_SYSTEM_PROMPT,
    context,
    { maxTokens: 2048, temperature: 0.5 }
  );

  return { narrative: text, usage };
}

/**
 * Streaming variant of narrateGTMScore for SSE responses
 */
export function narrateGTMScoreStream(
  company: CompanyProfile,
  benchmarks: BenchmarkItem[],
  companyMetrics: {
    revenue?: Record<string, unknown>;
    sales?: Record<string, unknown>;
    channels?: Record<string, unknown>;
    ecosystem?: Record<string, unknown>;
  }
): AsyncGenerator<string, BedrockUsage> {
  const context = JSON.stringify(
    {
      company: {
        name: company.name,
        stage: company.stage,
        industry: company.industry,
        arr: company.arr,
        growth: company.growth,
        employees: company.employees,
        gtmMotion: company.gtmMotion,
      },
      metrics: companyMetrics,
      benchmarks: benchmarks.map((b) => ({
        segment: `${b.segmentType}/${b.segmentValue}`,
        metric: b.metricName,
        p25: b.p25,
        p50: b.p50,
        p75: b.p75,
      })),
    },
    null,
    2
  );

  return invokeModelStream(
    MODELS.SONNET,
    NARRATION_SYSTEM_PROMPT,
    context,
    { maxTokens: 2048, temperature: 0.5 }
  );
}

// ============================================================
// Usage Logging
// ============================================================

function logUsage(usage: BedrockUsage): void {
  const costPerInputToken =
    usage.model === MODELS.OPUS ? 0.015 / 1000 : 0.003 / 1000;
  const costPerOutputToken =
    usage.model === MODELS.OPUS ? 0.075 / 1000 : 0.015 / 1000;

  const cost =
    usage.inputTokens * costPerInputToken +
    usage.outputTokens * costPerOutputToken;

  console.log(
    `[Bedrock] ${usage.model.split(".")[1]} | ` +
      `in: ${usage.inputTokens} | out: ${usage.outputTokens} | ` +
      `cost: $${cost.toFixed(4)}`
  );
}
