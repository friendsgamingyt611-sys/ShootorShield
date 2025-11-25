
// --- LOCAL BACKEND REPLACEMENT ---
// This file previously exported Firebase instances.
// It now exports nulls or mocks to ensure existing imports don't crash,
// while the actual logic has been moved to services/auth.ts and services/playerService.ts
// using LocalStorage.

console.log("⚡ System running in ZERO-CONFIG / LOCAL-ONLY mode.");

export const auth = null;
export const db = null;

// The app has been refactored to not use these exports for logic, 
// but we keep the file to prevent build errors from dangling imports 
// until all files are fully updated.
