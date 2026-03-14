import {
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  QueryCommandInput,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLES } from "./config";
import type { DynamoItem } from "./types";

// ============================================================
// Core Operations
// ============================================================

export async function putItem<T extends DynamoItem>(
  table: string,
  item: T
): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: table,
      Item: item,
    })
  );
}

export async function getItem<T extends DynamoItem>(
  table: string,
  pk: string,
  sk: string
): Promise<T | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: table,
      Key: { pk, sk },
    })
  );
  return (result.Item as T) ?? null;
}

export async function deleteItem(
  table: string,
  pk: string,
  sk: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: table,
      Key: { pk, sk },
    })
  );
}

export async function updateItem(
  table: string,
  pk: string,
  sk: string,
  updates: Record<string, unknown>
): Promise<void> {
  const keys = Object.keys(updates);
  if (keys.length === 0) return;

  const expressionParts: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  keys.forEach((key, i) => {
    const nameKey = `#k${i}`;
    const valueKey = `:v${i}`;
    expressionParts.push(`${nameKey} = ${valueKey}`);
    names[nameKey] = key;
    values[valueKey] = updates[key];
  });

  await docClient.send(
    new UpdateCommand({
      TableName: table,
      Key: { pk, sk },
      UpdateExpression: `SET ${expressionParts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

// ============================================================
// Query with automatic pagination
// ============================================================

export async function queryItems<T extends DynamoItem>(
  table: string,
  keyCondition: string,
  expressionValues: Record<string, unknown>,
  options?: {
    indexName?: string;
    expressionNames?: Record<string, string>;
    filterExpression?: string;
    scanForward?: boolean;
    limit?: number;
  }
): Promise<T[]> {
  const items: T[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const params: QueryCommandInput = {
      TableName: table,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
      ExclusiveStartKey: lastKey,
      ScanIndexForward: options?.scanForward ?? true,
    };

    if (options?.indexName) params.IndexName = options.indexName;
    if (options?.expressionNames)
      params.ExpressionAttributeNames = options.expressionNames;
    if (options?.filterExpression)
      params.FilterExpression = options.filterExpression;
    if (options?.limit) params.Limit = options.limit;

    const result = await docClient.send(new QueryCommand(params));
    items.push(...((result.Items as T[]) ?? []));
    lastKey = result.LastEvaluatedKey;

    // Stop if we've hit a requested limit
    if (options?.limit && items.length >= options.limit) break;
  } while (lastKey);

  return options?.limit ? items.slice(0, options.limit) : items;
}

// ============================================================
// Scan with filter and automatic pagination
// ============================================================

export async function scanWithFilter<T extends DynamoItem>(
  table: string,
  options?: {
    filterExpression?: string;
    expressionValues?: Record<string, unknown>;
    expressionNames?: Record<string, string>;
    limit?: number;
  }
): Promise<T[]> {
  const items: T[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const params: ScanCommandInput = {
      TableName: table,
      ExclusiveStartKey: lastKey,
    };

    if (options?.filterExpression)
      params.FilterExpression = options.filterExpression;
    if (options?.expressionValues)
      params.ExpressionAttributeValues = options.expressionValues;
    if (options?.expressionNames)
      params.ExpressionAttributeNames = options.expressionNames;

    const result = await docClient.send(new ScanCommand(params));
    items.push(...((result.Items as T[]) ?? []));
    lastKey = result.LastEvaluatedKey;

    if (options?.limit && items.length >= options.limit) break;
  } while (lastKey);

  return options?.limit ? items.slice(0, options.limit) : items;
}

// ============================================================
// Batch write (handles 25-item DynamoDB limit)
// ============================================================

export async function batchWrite<T extends DynamoItem>(
  table: string,
  items: T[]
): Promise<void> {
  const BATCH_SIZE = 25;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const requestItems = {
      [table]: batch.map((item) => ({
        PutRequest: { Item: item },
      })),
    };

    let unprocessed = requestItems;
    let retries = 0;

    do {
      const result = await docClient.send(
        new BatchWriteCommand({ RequestItems: unprocessed })
      );

      unprocessed =
        result.UnprocessedItems as typeof requestItems;

      if (unprocessed && Object.keys(unprocessed).length > 0) {
        retries++;
        // Exponential backoff
        await new Promise((r) =>
          setTimeout(r, Math.pow(2, retries) * 100)
        );
      } else {
        break;
      }
    } while (retries < 5);
  }
}

// ============================================================
// Convenience: query by partition key
// ============================================================

export async function queryByPK<T extends DynamoItem>(
  table: string,
  pk: string,
  skPrefix?: string
): Promise<T[]> {
  if (skPrefix) {
    return queryItems<T>(table, "pk = :pk AND begins_with(sk, :skp)", {
      ":pk": pk,
      ":skp": skPrefix,
    });
  }
  return queryItems<T>(table, "pk = :pk", { ":pk": pk });
}

// ============================================================
// Table name exports for convenience
// ============================================================

export { TABLES };
