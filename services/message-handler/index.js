const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const message =
    typeof event?.body === 'string'
      ? event.body
      : JSON.stringify(event?.body ?? event);
  const topicArn = process.env.TOPIC_ARN;

  try {
    const out = await sns.send(
      new PublishCommand({ TopicArn: topicArn, Message: message })
    );
    console.log('Message published:', out.MessageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ messageId: out.MessageId })
    };
  } catch (error) {
    console.error('Publish failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Publish failed' })
    };
  }
};
