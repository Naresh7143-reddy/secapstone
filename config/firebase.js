const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Initialize Firebase Admin.
 *
 * Credentials are resolved in this order:
 *   1. FIREBASE_SERVICE_ACCOUNT  -> full service-account JSON as a string
 *      (recommended on Render – paste the JSON into one env var)
 *   2. firebase-admin-config.json file in the project root (local dev)
 *
 * If neither is present the app still boots (so /health works), but any
 * route that verifies a token will return 503 until credentials are added.
 */
let initialized = false;

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      console.error('⚠️  FIREBASE_SERVICE_ACCOUNT is not valid JSON:', err.message);
      return null;
    }
  }

  const filePath = path.join(__dirname, '../firebase-admin-config.json');
  if (fs.existsSync(filePath)) {
    return require(filePath);
  }

  return null;
}

const serviceAccount = loadServiceAccount();

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
  });
  initialized = true;
  console.log('✅ Firebase Admin initialized');
} else {
  console.warn(
    '⚠️  Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT ' +
    'or add firebase-admin-config.json. Auth-protected routes will fail until then.'
  );
}

const auth = initialized ? admin.auth() : null;

module.exports = { auth, admin, initialized };
