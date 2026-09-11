// Pulls the same `global_api_config` Firebase Remote Config blob the
// Flutter app reads in lib/constants/api_config.dart's init() — this app's
// endpoint URLs have drifted from their hardcoded fallbacks more than once
// already (domain rotations: net22->net50->net52->net77, MovieBox's real
// fast-download host is netfilm.world, not the aoneroom.com URL baked into
// older app builds), and Remote Config is the operator's actual live source
// of truth for all of it, same as the app.
//
// No Firebase SDK needed — this is a plain REST call to the same endpoint
// the client SDKs use internally, authenticated with just the public
// Android app's apiKey (not a secret; it's already shipped in the APK's
// google-services.json). Project values from
// lib/firebase_options.dart / android/app/google-services.json.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_NUMBER = "887317405460";
const API_KEY = "AIzaSyAOvh82_2ThtEG5OYDoYWtb_EGJjuQq8GE";
const APP_ID = "1:887317405460:android:96a76f50e5bdaa248bac01";
const PACKAGE_NAME = "com.primeflix.app";

const FETCH_URL = `https://firebaseremoteconfig.googleapis.com/v1/projects/${PROJECT_NUMBER}/namespaces/firebase:fetch?key=${API_KEY}`;

// os.tmpdir(), not process.cwd() — the project directory is read-only on
// Vercel's deployment bundle (only /tmp is writable there), and this cache
// is disposable either way (lost on every cold start).
const CACHE_PATH = path.join(os.tmpdir(), "prime-flix-remote-config.json");
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // re-fetch at most once an hour

type CacheShape = { config: Record<string, string>; timestampMs: number };

function readCache(): CacheShape | null {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function writeCache(config: Record<string, string>) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify({ config, timestampMs: Date.now() }));
}

let inFlight: Promise<Record<string, string>> | null = null;

async function fetchGlobalApiConfig(): Promise<Record<string, string>> {
  const res = await fetch(FETCH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      appId: APP_ID,
      // Firebase's fetch API expects a Firebase Installations-shaped id but
      // doesn't appear to validate it against a real registration — any
      // syntactically plausible instance id works for an anonymous fetch.
      appInstanceId: "cAAAAAAAAAAAAAAAAAAAAA",
      sdkVersion: "22.0.0",
      packageName: PACKAGE_NAME,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Remote Config fetch HTTP ${res.status}`);
  const json = await res.json();
  const raw = json.entries?.global_api_config;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function getRemoteApiConfig(): Promise<Record<string, string>> {
  const cached = readCache();
  if (cached && Date.now() - cached.timestampMs < REFRESH_INTERVAL_MS) {
    return cached.config;
  }
  if (inFlight) return inFlight;

  inFlight = fetchGlobalApiConfig()
    .then((config) => {
      writeCache(config);
      return config;
    })
    .catch((e) => {
      console.error("remoteConfig: fetch failed, falling back to hardcoded defaults:", e);
      return cached?.config ?? {}; // stale cache beats nothing
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Returns the remote-config value for `key`, or `fallback` if unset/unreachable. */
export async function getConfig(key: string, fallback: string): Promise<string> {
  const config = await getRemoteApiConfig();
  return config[key] || fallback;
}
