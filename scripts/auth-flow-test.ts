/**
 * Simple auth flow test script.
 * Usage (PowerShell):
 *   $env:USERNAME="testuser"; $env:PASSWORD="secret"; npx tsx scripts/auth-flow-test.ts
 *
 * It will:
 * 1. POST /api/login
 * 2. Capture Set-Cookie header
 * 3. GET /api/auth/user with that cookie
 * 4. Print results
 */

import 'dotenv/config';
import assert from 'assert';

const BASE = process.env.BASE_URL || 'http://localhost:' + (process.env.PORT || '5000');
const USERNAME = process.env.USERNAME || process.argv[2];
const PASSWORD = process.env.PASSWORD || process.argv[3];

if (!USERNAME || !PASSWORD) {
  console.error('Provide USERNAME and PASSWORD via env or args.');
  process.exit(1);
}

async function run() {
  console.log('[TEST] Logging in at', BASE);
  const loginRes = await fetch(BASE + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
    redirect: 'manual',
  });

  const setCookie = loginRes.headers.get('set-cookie');
  console.log('[TEST] Login status:', loginRes.status);
  console.log('[TEST] Set-Cookie header:', setCookie);

  if (loginRes.status !== 200) {
    const body = await loginRes.text();
    console.error('[TEST] Login failed body:', body);
    process.exit(1);
  }

  assert(setCookie, 'No Set-Cookie header returned; session cookie not set.');
  const cookiePair = setCookie.split(';')[0];
  console.log('[TEST] Using cookie for next request:', cookiePair);

  const userRes = await fetch(BASE + '/api/auth/user', {
    headers: { Cookie: cookiePair },
  });
  console.log('[TEST] /api/auth/user status:', userRes.status);
  const bodyText = await userRes.text();
  console.log('[TEST] Body:', bodyText);

  if (userRes.status !== 200) {
    throw new Error('Auth user fetch failed: ' + userRes.status);
  }
  console.log('[TEST] SUCCESS: Auth flow works.');
}

run().catch((e) => {
  console.error('[TEST] Error:', e);
  process.exit(1);
});
