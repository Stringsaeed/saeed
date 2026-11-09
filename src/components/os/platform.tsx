"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { PLATFORM_STORAGE_KEY } from "./platform-constants";

export { PLATFORM_STORAGE_KEY };

// The site renders as one of three platforms, like a React Native app:
// iOS and Android dress the phone in their own conventions; web drops the
// phone and lays the same screens out as a plain page.
export type Platform = "ios" | "android" | "web";

export const PLATFORMS: readonly Platform[] = [
  "ios",
  "android",
  "web",
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  ios: "iOS",
  android: "Android",
  web: "Web",
};

const DEFAULT_PLATFORM: Platform = "ios";

export function isPlatform(value: unknown): value is Platform {
  return value === "ios" || value === "android" || value === "web";
}

// The html element carries the platform so CSS can style before React
// loads; see PlatformScript for how it gets there. React reads it back
// through this store, so server and client agree during hydration and the
// client corrects itself right after.
const listeners = new Set<() => void>();

function readPlatform(): Platform {
  if (typeof document === "undefined") return DEFAULT_PLATFORM;
  const value = document.documentElement.dataset.platform;
  return isPlatform(value) ? value : DEFAULT_PLATFORM;
}

function writePlatform(platform: Platform) {
  document.documentElement.dataset.platform = platform;
  try {
    window.localStorage.setItem(PLATFORM_STORAGE_KEY, platform);
  } catch {
    // Private windows may refuse storage; the attribute still applies.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverSnapshot = () => DEFAULT_PLATFORM;

type PlatformContextValue = {
  platform: Platform;
  setPlatform: (platform: Platform) => void;
  /** True once the client has read its stored preference. Before that the
   *  server's default (iOS) is showing. */
  ready: boolean;
};

const PlatformContext = createContext<PlatformContextValue>({
  platform: DEFAULT_PLATFORM,
  setPlatform: () => {},
  ready: false,
});

export function PlatformProvider({ children }: { children: ReactNode }) {
  const platform = useSyncExternalStore(
    subscribe,
    readPlatform,
    serverSnapshot,
  );
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const setPlatform = useCallback((next: Platform) => {
    if (!isPlatform(next)) return;
    writePlatform(next);
  }, []);

  // Another tab changing the platform changes this one too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PLATFORM_STORAGE_KEY) return;
      if (isPlatform(event.newValue)) writePlatform(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({
      platform,
      setPlatform,
      ready,
    }),
    [
      platform,
      setPlatform,
      ready,
    ],
  );

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  return useContext(PlatformContext);
}
