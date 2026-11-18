
const { handler } = require('./calendar-create.cjs');

exports.default = async (request, context) => {
  const url = new URL(request.url);

  const event = {
    httpMethod: request.method,
    headers: Object.fromEntries(request.headers),
    queryStringParameters: Object.fromEntries(url.searchParams),
    body: await request.text()
  };

  const result = await handler(event);

  return new Response(result.body || '', {
    status: result.statusCode || 200,
    headers: result.headers || {}
  });
};
