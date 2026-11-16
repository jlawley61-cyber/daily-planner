
const { handler } = require('./calendar-events.cjs');

exports.default = async (request, context) => {
  const url = new URL(request.url);

  const event = {
    headers: Object.fromEntries(request.headers),
    queryStringParameters: Object.fromEntries(url.searchParams)
  };

  const result = await handler(event);

  return new Response(result.body || '', {
    status: result.statusCode || 200,
    headers: result.headers || {}
  });
};

