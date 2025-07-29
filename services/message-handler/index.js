exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event));

  const body = JSON.parse(event.body || '{}');

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Message received!',
      input: body
    })
  };
};
