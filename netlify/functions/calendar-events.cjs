const s = require('./_shared.cjs');

exports.handler = async (event) => {
  try {
    const a = await s.access(event);

    if (!a) {
      return s.json(401, {
        error: 'Connect Google Calendar in Settings.'
      });
    }

    const response = await fetch(
      'https://oauth2.googleapis.com/tokeninfo',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          access_token: a.token
        })
      }
    );

    if (!response.ok) {
      return s.json(502, {
        error: 'Unable to inspect Google token permissions',
        status: response.status
      });
    }

    const info = await response.json();

    return s.json(200, {
      diagnostic: 'Google Calendar permission check',
      permissions: info.scope
        ? info.scope.split(' ')
        : [],
      expires_in: info.expires_in
    });

  } catch (err) {
    return s.json(502, {
      error: err.message
    });
  }
};
