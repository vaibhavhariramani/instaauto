import admin from 'firebase-admin';
import { isProduction } from '../config/env';

declare global {
  var __firestoreDb: admin.firestore.Firestore | undefined;
}

// Not wired up to anything yet — DB_BACKEND is always 'postgres' today. This singleton exists
// so a future Firestore-backed repository implementation has a client to import, following the
// same global-singleton pattern as lib/prisma.ts (avoids re-initializing on hot reload in dev).
function getFirestoreDb(): admin.firestore.Firestore {
  const app = admin.apps[0] ?? admin.initializeApp();
  return app.firestore();
}

export const firestoreDb = global.__firestoreDb ?? getFirestoreDb();

if (!isProduction) {
  global.__firestoreDb = firestoreDb;
}
