const AWS = require('aws-sdk');
const sns = new AWS.SNS();

exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log('Function ARN:', context.invokedFunctionArn);

  const message = JSON.stringify(event.body);
  const topicArn = process.env.TOPIC_ARN;

  try {
    const result = await sns
      .publish({
        TopicArn: topicArn,
        Message: message
      })
      .promise();

    console.log('Message published to SNS:', result.MessageId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Message pushed to topic.',
        messageId: result.MessageId
      })
    };
  } catch (error) {
    console.error('Failed to publish message to SNS:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to publish message to topic.'
      })
    };
  }
};
