"use client";

import { useSyncExternalStore } from "react";

type StoreStatus = "loading" | "ready" | "error";

type StoreSnapshot<T> = {
  data: T;
  status: StoreStatus;
  error: string | null;
};

export function createPolledStore<T>(
  url: string,
  initial: T,
  parse: (value: unknown) => T,
) {
  const INITIAL: StoreSnapshot<T> = {
    data: initial,
    status: "loading",
    error: null,
  };

  let snapshot = INITIAL;
  const listeners = new Set<() => void>();
  let started = false;
  let interval: number | null = null;
  let inFlight: Promise<void> | null = null;

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function setSnapshot(next: StoreSnapshot<T>) {
    snapshot = next;
    emit();
  }

  async function fetchData() {
    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.status === 401) throw new Error("UNAUTHORIZED");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const value: unknown = await response.json();
        setSnapshot({ data: parse(value), status: "ready", error: null });
      } catch (error) {
        const unauthorized =
          error instanceof Error && error.message === "UNAUTHORIZED";
        setSnapshot({
          ...snapshot,
          status: snapshot.status === "ready" ? "ready" : "error",
          error: unauthorized
            ? "Session expirée. Reconnectez-vous."
            : "Impossible de joindre le serveur.",
        });
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  }

  function refreshWhenVisible() {
    if (document.visibilityState === "visible") void fetchData();
  }

  function start() {
    if (started) return;
    started = true;
    void fetchData();
    interval = window.setInterval(refreshWhenVisible, 10_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
  }

  function stop() {
    if (!started) return;
    started = false;
    if (interval !== null) {
      window.clearInterval(interval);
      interval = null;
    }
    window.removeEventListener("focus", refreshWhenVisible);
    document.removeEventListener("visibilitychange", refreshWhenVisible);
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) start();
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) stop();
    };
  }

  function getSnapshot() {
    return snapshot;
  }

  function getServerSnapshot() {
    return INITIAL;
  }

  function useStore() {
    const current = useSyncExternalStore(
      subscribe,
      getSnapshot,
      getServerSnapshot,
    );
    return { ...current, refresh: fetchData };
  }

  return { useStore, refresh: fetchData };
}
