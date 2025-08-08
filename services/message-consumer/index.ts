import type { SQSEvent, SQSRecord, SQSBatchResponse } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true }
});

/**
 * Main Lambda handler.
 */
export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const failures: { itemIdentifier: string }[] = [];

  // Process sequentially for simplicity
  for (const rec of event.Records) {
    try {
      await processRecord(rec);
    } catch (err) {
      console.error('Record failed', { messageId: rec.messageId, err });
      failures.push({ itemIdentifier: rec.messageId });
    }
  }

  // Partial batch response so only failed items are retried.
  return { batchItemFailures: failures };
}

/**
 * Parse a JSON string safely, returning the original string if parsing fails.
 */
function parseJson<T = unknown>(
  input: string | null | undefined
): T | string | null | undefined {
  if (typeof input !== 'string') return input;
  try {
    return JSON.parse(input) as T;
  } catch {
    return input;
  }
}

/** Unwrap the SNS envelope from an SQS record. */
function unwrapSnsEnvelope(record: SQSRecord): {
  id: string;
  payload: unknown;
  messageType: string;
} {
  // Body is JSON. If it came via SNS->SQS, it has { Message, MessageAttributes, MessageId }
  const body = parseJson<any>(record.body) ?? {};
  const payload = body?.Message ? parseJson(body.Message) : body;

  const attrs = body?.MessageAttributes ?? {};
  const messageType =
    attrs?.messageType?.Value || attrs?.messageType?.stringValue || 'Unknown';

  const id = body?.MessageId || record.messageId;

  return { id: String(id), payload, messageType };
}

/** Build a DynamoDB item from the SQS record data. */
function buildItem(id: string, messageType: string, payload: unknown) {
  return {
    id,
    type: messageType,
    receivedAt: new Date().toISOString(),
    payload
  };
}

/** Store an item in DynamoDB. */
async function putItem(item: Record<string, unknown>) {
  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}

/**
 * Process a single SQS record.
 * Unwraps the SNS envelope, builds the item, and stores it in DynamoDB.
 */
async function processRecord(record: SQSRecord): Promise<void> {
  const { id, payload, messageType } = unwrapSnsEnvelope(record);
  const item = buildItem(id, messageType, payload);
  await putItem(item);
  console.log('Stored item', { id, messageType });
}
