// giddyup-backend — firebase.js
// gu-002: Firebase Admin SDK init for server-side operations.
// Requires GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON,
// or FIREBASE_SERVICE_ACCOUNT_JSON env var with the JSON string directly.
// PLACEHOLDER — swap with real service account when Firebase project is created.

const admin = require('firebase-admin');

if (!admin.apps.length) {
  let credential;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Production: service account JSON stored as env var string
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Local dev: path to service account JSON file
    credential = admin.credential.applicationDefault();
  } else {
    // Placeholder for development without Firebase project yet
    console.warn('[Firebase] No credentials found — running in placeholder mode. Firestore calls will fail.');
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID ?? 'giddyup-rides',
  });
}

const db = admin.firestore();

module.exports = { admin, db };
