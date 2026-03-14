import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

const REGION = process.env.AWS_REGION || "us-east-1";

const dynamoClient = new DynamoDBClient({ region: REGION });
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export const s3Client = new S3Client({ region: REGION });
export const bedrockClient = new BedrockRuntimeClient({ region: REGION });

export const TABLES = {
  COMPANIES: process.env.DYNAMODB_COMPANIES_TABLE || "horizon-companies",
  BENCHMARKS: process.env.DYNAMODB_BENCHMARKS_TABLE || "horizon-benchmarks",
  SOURCES: process.env.DYNAMODB_SOURCES_TABLE || "horizon-sources",
  INSIGHTS: process.env.DYNAMODB_INSIGHTS_TABLE || "horizon-insights",
};

export const BUCKETS = {
  DATA: process.env.S3_DATA_BUCKET || "horizon-data",
};
