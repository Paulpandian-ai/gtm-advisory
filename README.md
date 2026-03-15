# Project Horizon — GTM Benchmark Intelligence Platform

A Next.js application for collecting, benchmarking, and analyzing go-to-market
metrics across SaaS companies. Powered by AWS (DynamoDB, S3, Bedrock Claude).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Amplify (CDN + SSR)                  │
├─────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Dashboard │ │Benchmarks│ │Companies │ │Curation  │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       └─────────┬──┴───────────┬┴─────────────┘             │
│            API Routes (src/app/api/)                         │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │sources │ │companies │ │benchmarks│ │parse-rpt │         │
│  └────┬───┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
├───────┴──────────┴────────────┴─────────────┴───────────────┤
│  Intelligence Layer                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │  Benchmark   │ │   Insight    │ │  GTM Score   │         │
│  │  Calculator  │ │  Generator   │ │   Scorer     │         │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘         │
├─────────┴────────────────┴────────────────┴─────────────────┤
│                        AWS SDK                               │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│  │ DynamoDB │      │    S3    │      │ Bedrock  │           │
│  │ 4 tables │      │  bucket  │      │ Claude   │           │
│  └──────────┘      └──────────┘      └──────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** 20+
- **AWS Account** with:
  - DynamoDB access
  - S3 access
  - Bedrock model access (Claude Sonnet 4) — submit use case details form
- **AWS CLI** configured with credentials

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Create AWS resources and seed data
./scripts/deploy.sh

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── benchmarks/         # GET benchmarks, POST compare, POST recalculate
│   │   ├── companies/          # GET list, POST create, GET [id], GET [id]/score
│   │   ├── dashboard/          # GET aggregated stats
│   │   ├── import/             # POST preview, POST execute
│   │   ├── insights/           # POST generate
│   │   ├── parse-report/       # POST AI extraction
│   │   ├── sources/            # GET/POST data sources
│   │   └── upload-url/         # POST presigned S3 URL
│   ├── benchmarks/             # Benchmark Explorer page
│   ├── companies/              # Company Profiles + [id] detail
│   ├── curation/               # Data Curation (5 tabs)
│   ├── settings/               # Settings page
│   ├── sources/                # Data Sources page
│   └── page.tsx                # Dashboard
├── components/
│   ├── benchmarks/             # Benchmark tab components
│   ├── curation/               # Curation components (manual entry, bulk import, AI parser, etc.)
│   ├── ui/                     # shadcn/ui primitives
│   └── sidebar.tsx             # Navigation sidebar
└── lib/
    ├── aws/
    │   ├── config.ts           # AWS SDK clients + table constants
    │   ├── dynamo.ts           # DynamoDB helpers (CRUD, query, scan, batch)
    │   ├── bedrock.ts          # Bedrock Claude integration
    │   ├── bedrock-stream.ts   # SSE streaming utilities
    │   ├── fallback-benchmarks.ts  # In-memory fallback data
    │   └── fallback-sources.ts     # In-memory fallback sources
    ├── intelligence/
    │   ├── benchmark-calculator.ts  # Recalculate benchmarks from company data
    │   ├── insight-generator.ts     # Rule-based + AI-generated insights
    │   └── gtm-scorer.ts           # GTM Health Score (0-100)
    └── utils.ts                # Tailwind cn() utility
```

## DynamoDB Tables

| Table | PK | SK | Purpose |
|-------|----|----|---------|
| `horizon-companies` | `COMPANY#<id>` | `PROFILE`, `REVENUE#<period>`, `SALES#<period>`, etc. | Company profiles + metrics |
| `horizon-benchmarks` | `BENCH#<type>#<value>` | `METRIC#<name>` | Aggregated benchmark stats |
| `horizon-sources` | `SOURCE#<id>` | `META` | Data source registry |
| `horizon-insights` | `INSIGHT#<id>` | `GENERATED#<ts>` | AI-generated insights |

## Key Features

- **Benchmark Explorer** — Compare metrics by stage, industry, GTM motion
- **AI Report Parser** — Paste article text or URL, Claude extracts structured GTM data
- **Company Profiles** — Searchable directory with detail pages, radar charts, GTM Score gauge
- **Data Curation** — Manual entry, bulk CSV import, data quality dashboard
- **Intelligence Layer** — Automated benchmark recalculation, rule-based + AI insights
- **GTM Health Score** — 0-100 score based on growth, sales efficiency, retention, channels, ecosystem

## Deployment (AWS Amplify)

```bash
# 1. Create AWS resources
./scripts/deploy.sh --region us-east-1

# 2. Connect repo to Amplify Console
#    - amplify.yml is auto-detected

# 3. Set environment variables in Amplify Console:
#    AWS_REGION, DYNAMODB_*_TABLE, S3_DATA_BUCKET

# 4. Attach IAM policy (scripts/iam-policy.json) to the Amplify service role
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run setup:aws` | Create DynamoDB tables |
| `npm run seed:aws` | Seed benchmark data |
| `npm run recalculate` | Recalculate benchmarks from company data |

## Cost Estimate

At low usage (< 100 companies, occasional AI calls):

| Service | Monthly Cost |
|---------|-------------|
| DynamoDB (on-demand) | $0–2 |
| S3 | $0.01 |
| Bedrock Claude | $0–3 (per extraction) |
| Amplify Hosting | $0–5 |
| **Total** | **$0–10/month** |

Scales with DynamoDB read/write capacity and Bedrock invocations.
