
const s = require('./_shared.cjs');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return s.json(405, {
        error: 'Only POST requests are allowed.'
      }, { Allow: 'POST' });
    }

    const origin = event.headers.origin;
    const host = event.headers.host;

    if (
      !origin ||
      new URL(origin).host !== host ||
      new URL(origin).protocol !== 'https:'
    ) {
      return s.json(403, {
        error: 'Request origin not authorized.'
      });
    }

    const a = await s.access(event);

    if (!a) {
      return s.json(401, {
        error: 'Please connect Google Calendar in Settings.'
      });
    }

    const data = JSON.parse(event.body || '{}');

    const title = String(data.title || '').trim();
    const date = String(data.date || '');
    const start = String(data.start || '');
    const end = String(data.end || '');
    const location = String(data.location || '');
    const details = String(data.details || '');

    if (
      !title ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !/^\d{2}:\d{2}$/.test(start) ||
      !/^\d{2}:\d{2}$/.test(end) ||
      end <= start
    ) {
      return s.json(400, {
        error: 'Please enter a valid title, date and appointment times.'
      });
    }

    const timezone = 'America/Chicago';

    const appointment = {
      summary: title,
      location,
      description: details,
      start: {
        dateTime: date + 'T' + start + ':00',
        timeZone: timezone
      },
      end: {
        dateTime: date + 'T' + end + ':00',
        timeZone: timezone
      }
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + a.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointment)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        'Google Calendar creation failed:',
        response.status,
        result.error?.message
      );

      return s.json(502, {
        error: 'Google Calendar could not save the appointment.'
      });
    }

    return s.json(201, {
      success: true,
      googleEventId: result.id,
      url: result.htmlLink || ''
    });

  } catch (err) {
    console.error('Calendar creation error:', err.message);

    return s.json(500, {
      error: 'Unable to create appointment.'
    });
  }
};
