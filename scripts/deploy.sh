#!/usr/bin/env bash
#
# deploy.sh — Create AWS resources and seed data for Project Horizon.
#
# Usage: ./scripts/deploy.sh [--region us-east-1]
#
set -euo pipefail

REGION="${1:-us-east-1}"
echo "═══════════════════════════════════════════"
echo "  Project Horizon — AWS Setup"
echo "  Region: $REGION"
echo "═══════════════════════════════════════════"

# ── DynamoDB Tables ─────────────────────────────────────

create_table() {
  local TABLE_NAME=$1
  local HAS_GSI=${2:-false}

  if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" &>/dev/null; then
    echo "  ✓ Table $TABLE_NAME already exists"
    return
  fi

  echo "  Creating table $TABLE_NAME..."

  local GSI_FLAG=""
  if [ "$HAS_GSI" = "true" ]; then
    GSI_FLAG='--global-secondary-indexes
      [
        {
          "IndexName": "GSI1",
          "KeySchema": [
            {"AttributeName": "gsi1pk", "KeyType": "HASH"},
            {"AttributeName": "gsi1sk", "KeyType": "RANGE"}
          ],
          "Projection": {"ProjectionType": "ALL"}
        }
      ]
      --attribute-definitions
        AttributeName=pk,AttributeType=S
        AttributeName=sk,AttributeType=S
        AttributeName=gsi1pk,AttributeType=S
        AttributeName=gsi1sk,AttributeType=S'
  fi

  if [ "$HAS_GSI" = "true" ]; then
    aws dynamodb create-table \
      --table-name "$TABLE_NAME" \
      --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
      --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
        AttributeName=gsi1pk,AttributeType=S \
        AttributeName=gsi1sk,AttributeType=S \
      --global-secondary-indexes \
        '[{"IndexName":"GSI1","KeySchema":[{"AttributeName":"gsi1pk","KeyType":"HASH"},{"AttributeName":"gsi1sk","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
      --billing-mode PAY_PER_REQUEST \
      --region "$REGION" \
      --no-cli-pager
  else
    aws dynamodb create-table \
      --table-name "$TABLE_NAME" \
      --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
      --attribute-definitions \
        AttributeName=pk,AttributeType=S \
        AttributeName=sk,AttributeType=S \
      --billing-mode PAY_PER_REQUEST \
      --region "$REGION" \
      --no-cli-pager
  fi

  echo "  ✓ Created $TABLE_NAME"
}

echo ""
echo "📦 DynamoDB Tables"
create_table "horizon-companies" "true"
create_table "horizon-benchmarks" "true"
create_table "horizon-sources" "false"
create_table "horizon-insights" "false"

# ── S3 Bucket ───────────────────────────────────────────

BUCKET="horizon-data"
echo ""
echo "📂 S3 Bucket"
if aws s3 ls "s3://$BUCKET" --region "$REGION" &>/dev/null; then
  echo "  ✓ Bucket $BUCKET already exists"
else
  echo "  Creating bucket $BUCKET..."
  if [ "$REGION" = "us-east-1" ]; then
    aws s3 mb "s3://$BUCKET" --region "$REGION"
  else
    aws s3 mb "s3://$BUCKET" --region "$REGION" \
      --create-bucket-configuration "LocationConstraint=$REGION"
  fi
  echo "  ✓ Created $BUCKET"
fi

# ── Seed Data ───────────────────────────────────────────

echo ""
echo "🌱 Seeding Data"
npx tsx scripts/seed-aws.ts
echo "  ✓ Seed data loaded"

# ── Environment Variables ───────────────────────────────

echo ""
echo "═══════════════════════════════════════════"
echo "  Configure these in Amplify Console:"
echo "═══════════════════════════════════════════"
echo ""
echo "  APP_REGION=$REGION"
echo "  DYNAMODB_COMPANIES_TABLE=horizon-companies"
echo "  DYNAMODB_BENCHMARKS_TABLE=horizon-benchmarks"
echo "  DYNAMODB_SOURCES_TABLE=horizon-sources"
echo "  DYNAMODB_INSIGHTS_TABLE=horizon-insights"
echo "  S3_DATA_BUCKET=horizon-data"
echo ""
echo "  Done! Deploy to Amplify and configure the"
echo "  service role with scripts/iam-policy.json"
echo "═══════════════════════════════════════════"
