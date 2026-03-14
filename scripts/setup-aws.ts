/**
 * Project Horizon — AWS Infrastructure Setup
 *
 * Creates all DynamoDB tables and S3 bucket required by the platform.
 * Run with: npx tsx scripts/setup-aws.ts
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  type CreateTableCommandInput,
} from "@aws-sdk/client-dynamodb";
import {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  HeadBucketCommand,
  type BucketLocationConstraint,
} from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "us-east-1";
const dynamo = new DynamoDBClient({ region: REGION });
const s3 = new S3Client({ region: REGION });

const TABLES = {
  COMPANIES: process.env.DYNAMODB_COMPANIES_TABLE || "horizon-companies",
  BENCHMARKS: process.env.DYNAMODB_BENCHMARKS_TABLE || "horizon-benchmarks",
  SOURCES: process.env.DYNAMODB_SOURCES_TABLE || "horizon-sources",
  INSIGHTS: process.env.DYNAMODB_INSIGHTS_TABLE || "horizon-insights",
};

const BUCKET = process.env.S3_DATA_BUCKET || "horizon-data";

// ============================================================
// Table Definitions
// ============================================================

const tableDefinitions: CreateTableCommandInput[] = [
  // Table 1: horizon-companies
  {
    TableName: TABLES.COMPANIES,
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "gsi1pk", AttributeType: "S" },
      { AttributeName: "gsi1sk", AttributeType: "S" },
      { AttributeName: "gsi2pk", AttributeType: "S" },
      { AttributeName: "gsi2sk", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "gsi1pk", KeyType: "HASH" },
          { AttributeName: "gsi1sk", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "GSI2",
        KeySchema: [
          { AttributeName: "gsi2pk", KeyType: "HASH" },
          { AttributeName: "gsi2sk", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },

  // Table 2: horizon-benchmarks
  {
    TableName: TABLES.BENCHMARKS,
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
      { AttributeName: "segmentType", AttributeType: "S" },
      { AttributeName: "metricName", AttributeType: "S" },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: "GSI1",
        KeySchema: [
          { AttributeName: "segmentType", KeyType: "HASH" },
          { AttributeName: "metricName", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },

  // Table 3: horizon-sources
  {
    TableName: TABLES.SOURCES,
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },

  // Table 4: horizon-insights
  {
    TableName: TABLES.INSIGHTS,
    KeySchema: [
      { AttributeName: "pk", KeyType: "HASH" },
      { AttributeName: "sk", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "pk", AttributeType: "S" },
      { AttributeName: "sk", AttributeType: "S" },
    ],
    BillingMode: "PAY_PER_REQUEST",
  },
];

// ============================================================
// Helpers
// ============================================================

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamo.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      err.name === "ResourceNotFoundException"
    ) {
      return false;
    }
    throw err;
  }
}

async function bucketExists(bucket: string): Promise<boolean> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Create Tables
// ============================================================

async function createTables(): Promise<void> {
  console.log("\n📋 Creating DynamoDB tables...\n");

  for (const def of tableDefinitions) {
    const name = def.TableName!;

    if (await tableExists(name)) {
      console.log(`  ✓ ${name} — already exists, skipping`);
      continue;
    }

    try {
      await dynamo.send(new CreateTableCommand(def));
      console.log(`  ✓ ${name} — created`);
    } catch (err: unknown) {
      console.error(
        `  ✗ ${name} — failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}

// ============================================================
// Create S3 Bucket
// ============================================================

async function createBucket(): Promise<void> {
  console.log("\n🪣 Creating S3 bucket...\n");

  if (await bucketExists(BUCKET)) {
    console.log(`  ✓ ${BUCKET} — already exists, skipping`);
  } else {
    try {
      await s3.send(new CreateBucketCommand({
        Bucket: BUCKET,
        ...(REGION !== "us-east-1" && {
          CreateBucketConfiguration: {
            LocationConstraint: REGION as BucketLocationConstraint,
          },
        }),
      }));
      console.log(`  ✓ ${BUCKET} — created`);
    } catch (err: unknown) {
      console.error(
        `  ✗ ${BUCKET} — failed:`,
        err instanceof Error ? err.message : err
      );
      return;
    }
  }

  // Configure CORS
  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: BUCKET,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
              AllowedOrigins: [
                "http://localhost:3000",
                "https://*.amplifyapp.com",
              ],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    console.log(`  ✓ ${BUCKET} — CORS configured`);
  } catch (err: unknown) {
    console.error(
      `  ✗ CORS config failed:`,
      err instanceof Error ? err.message : err
    );
  }

  // Create folder markers
  const folders = ["imports/", "exports/", "reports/", "snapshots/"];
  for (const folder of folders) {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: folder,
          Body: "",
        })
      );
    } catch {
      // Non-critical — folders are just prefixes
    }
  }
  console.log(`  ✓ ${BUCKET} — folders created: ${folders.join(", ")}`);
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
  console.log("═══════════════════════════════════════════");
  console.log("  Project Horizon — AWS Setup");
  console.log(`  Region: ${REGION}`);
  console.log("═══════════════════════════════════════════");

  await createTables();
  await createBucket();

  console.log("\n✅ Setup complete!\n");
  console.log("Next steps:");
  console.log("  1. Verify tables in AWS Console → DynamoDB → Tables");
  console.log("  2. Verify bucket in AWS Console → S3 → Buckets");
  console.log("  3. Run seed data: npx tsx scripts/seed-aws.ts");
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err);
  process.exit(1);
});
