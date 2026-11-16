
const { handler } = require('./auth-callback.cjs');

exports.default = async (request, context) => {
  const url = new URL(request.url);

  const event = {
    headers: Object.fromEntries(request.headers),
    queryStringParameters: Object.fromEntries(url.searchParams)
  };

  const result = await handler(event);

  const headers = new Headers(result.headers || {});

  const cookies =
    result.multiValueHeaders?.['Set-Cookie'] ||
    result.multiValueHeaders?.['set-cookie'] ||
    [];

  for (const cookie of cookies) {
    headers.append('Set-Cookie', cookie);
  }

  return new Response(result.body || '', {
    status: result.statusCode || 200,
    headers
  });
};
