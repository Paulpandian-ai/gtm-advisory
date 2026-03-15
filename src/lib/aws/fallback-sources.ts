/**
 * Fallback data source records matching the 8 seeded entries in horizon-sources.
 * Used when DynamoDB is unavailable so the UI always has data.
 */

interface FallbackSource {
  pk: string;
  sk: string;
  id: string;
  name: string;
  type: string;
  url?: string;
  description: string;
  lastUpdated: string;
  recordCount: number;
  reliability: number;
}

const now = new Date().toISOString();

export const FALLBACK_SOURCES: FallbackSource[] = [
  {
    pk: "SOURCE#openview-2024",
    sk: "META",
    id: "openview-2024",
    name: "OpenView SaaS Benchmarks 2024",
    type: "Survey",
    url: "https://openviewpartners.com/benchmarks",
    description: "Annual SaaS benchmarks survey covering 600+ companies",
    lastUpdated: now,
    recordCount: 640,
    reliability: 0.92,
  },
  {
    pk: "SOURCE#bessemer-cloud",
    sk: "META",
    id: "bessemer-cloud",
    name: "Bessemer Cloud Index",
    type: "Public Filing",
    description: "Public cloud company performance data from SEC filings",
    lastUpdated: now,
    recordCount: 85,
    reliability: 0.98,
  },
  {
    pk: "SOURCE#tomasz-tunguz",
    sk: "META",
    id: "tomasz-tunguz",
    name: "Tomasz Tunguz Research",
    type: "Manual",
    url: "https://tomtunguz.com",
    description: "VC research and SaaS benchmarking data",
    lastUpdated: now,
    recordCount: 200,
    reliability: 0.85,
  },
  {
    pk: "SOURCE#saastr-survey",
    sk: "META",
    id: "saastr-survey",
    name: "SaaStr Annual Survey",
    type: "Survey",
    description: "Community-sourced SaaS metrics from SaaStr events",
    lastUpdated: now,
    recordCount: 450,
    reliability: 0.80,
  },
  {
    pk: "SOURCE#keybanc-saas",
    sk: "META",
    id: "keybanc-saas",
    name: "KeyBanc SaaS Survey",
    type: "Survey",
    description: "Private SaaS company survey by KeyBanc Capital Markets",
    lastUpdated: now,
    recordCount: 300,
    reliability: 0.90,
  },
  {
    pk: "SOURCE#iconiq-growth",
    sk: "META",
    id: "iconiq-growth",
    name: "ICONIQ Growth Data",
    type: "Survey",
    description: "Growth metrics from ICONIQ Capital portfolio and network",
    lastUpdated: now,
    recordCount: 150,
    reliability: 0.88,
  },
  {
    pk: "SOURCE#wing-benchmarks",
    sk: "META",
    id: "wing-benchmarks",
    name: "Wing VC Benchmarks",
    type: "CSV",
    description: "Enterprise SaaS benchmarks from Wing Venture Capital",
    lastUpdated: now,
    recordCount: 180,
    reliability: 0.86,
  },
  {
    pk: "SOURCE#internal-advisory",
    sk: "META",
    id: "internal-advisory",
    name: "Internal Advisory Data",
    type: "Manual",
    description: "Proprietary data from GTM advisory engagements",
    lastUpdated: now,
    recordCount: 120,
    reliability: 0.95,
  },
];

/** Return all fallback sources. */
export function getAllFallbackSources(): FallbackSource[] {
  return FALLBACK_SOURCES;
}

/** Find a single fallback source by id. */
export function getFallbackSourceById(
  id: string
): FallbackSource | undefined {
  return FALLBACK_SOURCES.find((s) => s.id === id);
}
