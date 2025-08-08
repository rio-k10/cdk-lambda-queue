const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({});

exports.handler = async (event) => {
  const path = event?.path || '/';
  const method = (event?.httpMethod || 'GET').toUpperCase();

  if (method === 'GET' && path === '/health') {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (method !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let body = event.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
  } catch (_) {
    // leave as string if not JSON
  }

  const type = path.startsWith('/uipath')
    ? 'UiPathDocument'
    : path.startsWith('/roboyo')
    ? 'RoboyoRequest'
    : 'GenericMessage';

  const topicArn = process.env.TOPIC_ARN;
  const message = typeof body === 'string' ? body : JSON.stringify(body ?? {});

  const attrs = {
    messageType: { DataType: 'String', StringValue: type },
    sourcePath: { DataType: 'String', StringValue: path }
  };

  const out = await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Message: message,
      MessageAttributes: attrs
    })
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ messageId: out.MessageId, type })
  };
};
