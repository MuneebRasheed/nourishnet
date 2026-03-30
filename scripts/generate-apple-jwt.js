#!/usr/bin/env node
/**
 * Generates Apple's OAuth client secret (JWT) for Supabase → Auth → Apple → Secret Key.
 * Native sign-in still uses signInWithIdToken; this satisfies Supabase's required field.
 *
 * Usage: set env vars (see .env.example), then: yarn generate-apple-jwt
 * Copy the printed line into the dashboard. Regenerate before expiry (default 180d).
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

function fail(message) {
  console.error(message);
  process.exit(1);
}

const p8Path = process.env.APPLE_P8_PATH;
const teamId = process.env.APPLE_TEAM_ID;
const keyId = process.env.APPLE_KEY_ID;
const expiresIn = process.env.APPLE_JWT_EXPIRES_IN || '180d';

let clientId = process.env.APPLE_CLIENT_ID;
if (!clientId) {
  try {
    const appJson = require(path.join(__dirname, '..', 'app.json'));
    clientId = appJson.expo?.ios?.bundleIdentifier;
  } catch {
    /* ignore */
  }
}

if (!p8Path) {
  fail('Missing APPLE_P8_PATH (path to AuthKey_XXXXXXXXXX.p8).');
}
if (!teamId) {
  fail('Missing APPLE_TEAM_ID.');
}
if (!keyId) {
  fail('Missing APPLE_KEY_ID.');
}
if (!clientId) {
  fail('Missing APPLE_CLIENT_ID and could not read expo.ios.bundleIdentifier from app.json.');
}

const resolvedP8 = path.isAbsolute(p8Path)
  ? p8Path
  : path.join(process.cwd(), p8Path);

if (!fs.existsSync(resolvedP8)) {
  fail(`P8 file not found: ${resolvedP8}`);
}

const privateKey = fs.readFileSync(resolvedP8);
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn,
  audience: 'https://appleid.apple.com',
  issuer: teamId,
  subject: clientId,
  keyid: keyId,
});

console.error(
  'Paste the next line into Supabase → Authentication → Providers → Apple → Secret Key.'
);
console.error(
  `JWT lifetime: ${expiresIn} (set APPLE_JWT_EXPIRES_IN to change; max ~6 months per Apple).`
);
console.log(token);
