import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let isInitialized = false;

export function initFirestore() {
  if (isInitialized) return db;

  try {
    let credential = null;

    // Option 1: Full JSON string via Environment Variable (Recommended for Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = cert(parsed);
      console.log(`[Firestore] Initializing using FIREBASE_SERVICE_ACCOUNT_JSON for project "${parsed.project_id}"...`);
    }
    // Option 2: Local JSON file path (e.g. ./firebase.json)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      let resolvedPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

      if (!fs.existsSync(resolvedPath)) {
        resolvedPath = path.resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      }

      if (fs.existsSync(resolvedPath)) {
        const fileContent = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
        credential = cert(fileContent);
        console.log(`[Firestore] Initializing using file at "${resolvedPath}" for project "${fileContent.project_id}"...`);
      }
    }
    // Option 3: Default check for firebase.json or serviceAccountKey.json
    else if (fs.existsSync(path.resolve(process.cwd(), 'firebase.json')) || fs.existsSync(path.resolve(__dirname, '../firebase.json'))) {
      const p = fs.existsSync(path.resolve(process.cwd(), 'firebase.json'))
        ? path.resolve(process.cwd(), 'firebase.json')
        : path.resolve(__dirname, '../firebase.json');
      const fileContent = JSON.parse(fs.readFileSync(p, 'utf-8'));
      credential = cert(fileContent);
      console.log(`[Firestore] Found credentials in firebase.json for project "${fileContent.project_id}"...`);
    }
    else if (fs.existsSync(path.resolve(process.cwd(), 'serviceAccountKey.json'))) {
      const fileContent = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'serviceAccountKey.json'), 'utf-8'));
      credential = cert(fileContent);
      console.log(`[Firestore] Found default serviceAccountKey.json for project "${fileContent.project_id}"...`);
    }
    // Option 4: Individual environment variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      });
      console.log(`[Firestore] Initializing using environment variables for project "${process.env.FIREBASE_PROJECT_ID}"...`);
    }

    if (credential) {
      const apps = getApps();
      const app = !apps.length ? initializeApp({ credential }) : apps[0];
      db = getFirestore(app);
      isInitialized = true;
      console.log('✅ [Firestore] Successfully connected to Google Cloud Firestore!');
      return db;
    }

  } catch (err) {
    console.error('⚠️ [Firestore] Failed to initialize Firestore:', err.message);
  }

  isInitialized = true;
  console.log('ℹ️ [Firestore] No Firestore credentials detected. Falling back to local JSON storage.');
  return null;
}

export function getFirestoreDb() {
  if (!isInitialized) {
    return initFirestore();
  }
  return db;
}

export function isFirestoreEnabled() {
  const firestore = getFirestoreDb();
  return Boolean(firestore);
}
