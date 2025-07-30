const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const message = JSON.stringify(event.body || event);
  const topicArn = process.env.TOPIC_ARN;

  try {
    const result = await sns
      .publish({
        TopicArn: topicArn,
        Message: message
      })
      .promise();

    console.log('Message published:', result.MessageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ messageId: result.MessageId })
    };
  } catch (error) {
    console.error('Publish failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Publish failed' })
    };
  }
};
