"use client";

// All local-only, in the browser (localStorage) — there's no account/backend
// here, same as the Flutter app's own Hive-based continue-watching, which is
// also purely on-device rather than synced.

const AUDIO_LANG_PREF_KEY = "mb:preferredAudioLang";
const CONTINUE_WATCHING_KEY = "mb:continueWatching";
const PROGRESS_SAVE_THRESHOLD_SECONDS = 10; // ignore the first few seconds so opening a title doesn't immediately show as "in progress"
const NEAR_END_FRACTION = 0.95; // drop from continue-watching once basically finished

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private browsing / storage disabled — degrade silently
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// --- Audio language preference — global, not per-title: picking Hindi on
// one title means the *next* title you open also tries to start in Hindi
// (falling back to Original Audio if that title has no Hindi dub), rather
// than only remembering a choice for the one title it was picked on. ---

export function getPreferredAudioLang(): string | null {
  return safeGet(AUDIO_LANG_PREF_KEY);
}

export function setPreferredAudioLang(lanCode: string) {
  if (!lanCode) return;
  safeSet(AUDIO_LANG_PREF_KEY, lanCode);
}

// --- Continue watching ---

export type ContinueWatchingEntry = {
  familyId: string;
  subjectId: string;
  detailPath: string;
  title: string;
  poster: string;
  type: number;
  season?: number;
  episode?: number;
  position: number;
  duration: number;
  updatedAt: number;
};

function readAll(): Record<string, ContinueWatchingEntry> {
  try {
    return JSON.parse(safeGet(CONTINUE_WATCHING_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, ContinueWatchingEntry>) {
  safeSet(CONTINUE_WATCHING_KEY, JSON.stringify(map));
}

export function saveProgress(entry: Omit<ContinueWatchingEntry, "updatedAt">) {
  if (entry.position < PROGRESS_SAVE_THRESHOLD_SECONDS) return;
  const map = readAll();
  if (entry.duration > 0 && entry.position / entry.duration >= NEAR_END_FRACTION) {
    delete map[entry.familyId];
  } else {
    map[entry.familyId] = { ...entry, updatedAt: Date.now() };
  }
  writeAll(map);
}

export function getProgress(familyId: string): ContinueWatchingEntry | null {
  return readAll()[familyId] ?? null;
}

export function removeProgress(familyId: string) {
  const map = readAll();
  delete map[familyId];
  writeAll(map);
}

export function listContinueWatching(): ContinueWatchingEntry[] {
  return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
}
