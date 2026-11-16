
const s = require('./_shared.cjs');

exports.handler = async (event) => {
  try {
    const session = s.verify(s.cookie(event, s.COOKIE));

    if (!session || typeof session.email !== 'string') {
      return s.json(200, { authenticated: false });
    }

    const allowed = s.env().ALLOWED_GOOGLE_EMAIL;

    if (session.email.toLowerCase() !== allowed.toLowerCase()) {
      return s.json(200, { authenticated: false });
    }

    const tokenStore = await s.store();

    const saved = await tokenStore.get(
      s.key(session.email),
      { type: 'json' }
    );

    return s.json(200, {
      authenticated: Boolean(saved && saved.refresh)
    });
  } catch (error) {
    console.error('Authentication status check failed:', error);

    return s.json(500, {
      authenticated: false,
      error: 'Authentication status check failed'
    });
  }
};

