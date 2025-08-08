const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true }
});
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const records = event.Records || [];
  const failures = [];

  for (const r of records) {
    try {
      const body = JSON.parse(r.body);
      // If via SNS->SQS, payload is nested
      const payload =
        typeof body === 'object' && body?.Message
          ? parseMaybeJson(body.Message)
          : body;
      const attrs = body?.MessageAttributes || {};
      const messageType =
        attrs?.messageType?.Value ||
        attrs?.messageType?.stringValue ||
        'Unknown';
      const id = body?.MessageId || r.messageId;

      const item = {
        id,
        type: messageType,
        receivedAt: new Date().toISOString(),
        payload
      };

      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      console.log('Saved item', id);
    } catch (e) {
      console.error('Failed record', r.messageId, e);
      failures.push({ itemIdentifier: r.messageId });
    }
  }

  // Partial batch response: only re-drive failed ones
  if (failures.length > 0) return { batchItemFailures: failures };
  return {};
};

function parseMaybeJson(x) {
  try {
    return JSON.parse(x);
  } catch {
    return x;
  }
}
