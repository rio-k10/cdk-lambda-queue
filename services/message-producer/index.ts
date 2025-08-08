import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({});

/**
 * Main Lambda handler.
 */
export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  // Handle request methods
  const { method, path, body } = parseRequest(event);
  if (method === 'GET' && path.endsWith('/health')) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }
  if (method !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Check SNS message type
  const type = getMessageType(path);
  const topicArn = process.env.TOPIC_ARN!;

  // Send the message to SNS
  const result = await sendMessage(topicArn, body, type, path);

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId: result.MessageId, type })
  };
}

/**
 * Parse the incoming API Gateway request and normalise into
 * a usable shape for downstream functions.
 */
function parseRequest(event: APIGatewayProxyEventV2) {
  const method = getMethod(event);
  const path = getPath(event);
  const body = parseValidJson(event.body);

  return { method, path, body };
}

/**
 * Simple helper to parse JSON without throwing.
 */
function parseValidJson(input?: string | null): any {
  if (!input) return null;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

/**
 * Map an API Gateway path to a logical message type.
 */
function getMessageType(path: string): string {
  if (path.startsWith('/uipath')) return 'UiPathDocument';
  if (path.startsWith('/roboyo')) return 'RoboyoRequest';
  return 'GenericMessage';
}

/**
 * Publish a message to SNS.
 */
async function sendMessage(
  topicArn: string,
  payload: any,
  type: string,
  path: string
) {
  const message =
    typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
  const command = new PublishCommand({
    TopicArn: topicArn,
    Message: message,
    MessageAttributes: {
      messageType: { DataType: 'String', StringValue: type },
      sourcePath: { DataType: 'String', StringValue: path }
    }
  });

  return sns.send(command);
}

/**
 * Extract the HTTP method from the event.
 */
function getMethod(event: any): string {
  if (event?.requestContext?.http?.method)
    return event.requestContext.http.method.toUpperCase();
  if (event?.httpMethod) return event.httpMethod.toUpperCase();
  return 'GET';
}

/**
 * Extract the path from the event.
 * Handles both rawPath and path for compatibility.
 */
function getPath(event: any): string {
  if (event?.rawPath) return event.rawPath;
  if (event?.path) return event.path;
  return '/';
}
