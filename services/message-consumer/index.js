exports.handler = async (event) => {
  console.log('Consuming event from SQS:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    console.log('Processed message:', body);
    // Process message
    // DynamoDB or other persistent storage logic here
  }
};
