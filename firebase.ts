import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function initFirebase() {
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  } else {
    getApp();
  }

  // Analytics should only run in browser
  if (typeof window !== "undefined") {
    try {
      return getAnalytics();
    } catch (e) {
      return null;
    }
  }

  return null;
}

const analytics = initFirebase();

let rtdb = null as any;
let auth = null as any;
if (typeof window !== 'undefined') {
  try {
    rtdb = getDatabase();
    auth = getAuth();
  } catch (e) {
    rtdb = null;
  }
}

export { analytics, rtdb, auth };
