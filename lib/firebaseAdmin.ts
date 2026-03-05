import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let _adminApp: App | null = null;
let _adminDb: Firestore | null = null;

function getAdminApp(): App {
  if (_adminApp) return _adminApp;

  if (getApps().length > 0) {
    _adminApp = getApps()[0];
    return _adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set."
    );
  }

  let serviceAccount: Record<string, string>;

  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    try {
      const decoded = Buffer.from(serviceAccountKey, "base64").toString(
        "utf-8"
      );
      serviceAccount = JSON.parse(decoded);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON or base64-encoded JSON."
      );
    }
  }

  _adminApp = initializeApp(
    { credential: cert(serviceAccount) },
    "visahunt" // Separate app instance so it doesn't clash with HuntWise
  );

  return _adminApp;
}

// Lazy proxy — initialized on first access, not at import time
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_adminDb) {
      _adminDb = getFirestore(getAdminApp(), "visahunt");
    }
    return (_adminDb as any)[prop];
  },
});
