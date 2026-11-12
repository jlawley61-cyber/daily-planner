# Daily Planner 2.0 — secure Google Calendar connection

This is a deployable Netlify source project, not a live deployment. It uses Netlify Functions and Netlify Blobs to store an encrypted Google refresh token on the server. Calendar access remains read-only. Gmail is not requested. Local tasks, appointments, and notes remain browser-local and are NOT synced across devices.

## 1. Back up your data
In your existing planner, go to Settings > Export backup. Save the JSON somewhere safe before deploying.

## 2. Deploy this project (IMPORTANT: not Netlify Drop)
Netlify Drop is intended for static sites and will not build the server functions in this project. Use a Git-connected Netlify deployment:
- Create a **private** GitHub repository containing the extracted project files at its root (including `package.json`, `netlify.toml`, and `netlify/functions/`).
- In Netlify, open your existing `spiffy-macaron-d179f7` project, then configure continuous deployment from that repository. Confirm the publish directory is `.` and functions directory is `netlify/functions`.
- Do not publish the project repository or store secrets in its files.
- Deploy only after adding the environment variables below.

## 3. Configure Google Cloud
In the existing Google Cloud project, use a **Web application** OAuth client. Set **Authorized redirect URIs** to exactly:
`https://spiffy-macaron-d179f7.netlify.app/.netlify/functions/auth-callback`
Keep **Authorized JavaScript origins** set to:
`https://spiffy-macaron-d179f7.netlify.app`
Enable Google Calendar API. The requested scopes are `openid`, `email`, and `https://www.googleapis.com/auth/calendar.readonly`.

For a Google OAuth consent screen in **Testing** status, add the calendar Google account as a test user. IMPORTANT: Google refresh tokens for external apps in Testing mode with Calendar scopes generally expire after 7 days. Production status may reduce this limitation, but Google may require app verification depending on scopes and user access. Do not assume permanent access while Testing.

## 4. Netlify environment variables
In Netlify > Project configuration > Environment variables, create:
- `GOOGLE_CLIENT_ID`: the existing Google Web OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: the corresponding Google OAuth client secret (server-side only).
- `GOOGLE_REDIRECT_URI`: `https://spiffy-macaron-d179f7.netlify.app/.netlify/functions/auth-callback`
- `ALLOWED_GOOGLE_EMAIL`: the Google account authorized to use this planner (for example `jlawley61@gmail.com`).
- `SESSION_SECRET`: a randomly generated secret (at least 32 bytes of randomness, represented as hex/base64).
- `TOKEN_ENCRYPTION_KEY`: base64 encoding of exactly 32 random bytes.

Generate both secrets locally with Node.js (do NOT share the output):
`node -e "const c=require('crypto'); console.log('SESSION_SECRET='+c.randomBytes(32).toString('hex')); console.log('TOKEN_ENCRYPTION_KEY='+c.randomBytes(32).toString('base64'))"`

Use Netlify's environment variable UI, not a `.env` file committed to Git. Set them for Functions / production deployment and redeploy after adding them. Keep the encryption key stable or stored refresh tokens become unreadable.

## 5. Test
Visit `https://spiffy-macaron-d179f7.netlify.app` > Settings > Connect Google Calendar. Google redirects to the secure callback and back to the planner. Verify that events load. Close and reopen the browser and check again. Test on another device by visiting the same URL and signing in once there. Refresh happens every 5 minutes while the planner is open.

If Google requires reconnection after roughly seven days, check the OAuth Testing status. If you see a 500 or 502 error, inspect Netlify Functions logs. A private Git repository alone does not protect the public site; this version restricts Google Calendar data to the allowed Google account but does not password-protect the planner's local-only task interface.

## Limitations
- Google read-only; appointments created inside planner are local only.
- Browser-local tasks and notes do not sync between devices.
- One allowlisted Google account.
- Netlify Functions and Blobs availability and quotas depend on your Netlify plan.
- This code passed syntax checks but has not been tested against your live Google or Netlify accounts.
