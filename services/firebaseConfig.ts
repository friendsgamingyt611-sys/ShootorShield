
// --- FIREBASE CONFIGURATION PLUG-IN ---
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Go to Project Settings -> General -> "Your apps" -> Web (</>)
// 4. Copy the config values below

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

// Safe Environment Helper
export const getEnv = (key: string): string => {
    // This allows the app to run without crashing if keys aren't set
    return '';
};
