
const { handler } = require('./auth-status.cjs');

exports.default = async (request, context) => {
  const event = {
    headers: Object.fromEntries(request.headers)
  };

  const result = await handler(event);

  return new Response(result.body || '', {
    status: result.statusCode || 200,
    headers: result.headers || {}
  });
};
