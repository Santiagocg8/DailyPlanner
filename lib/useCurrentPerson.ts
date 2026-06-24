"use client";

import { useEffect, useState } from "react";

const KEY = "daily-planner:me";

/** Recuerda qué persona del hogar está usando este dispositivo. */
export function useCurrentPerson() {
  const [personId, setPersonId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPersonId(window.localStorage.getItem(KEY));
    setReady(true);
  }, []);

  function choose(id: string) {
    window.localStorage.setItem(KEY, id);
    setPersonId(id);
  }

  function clear() {
    window.localStorage.removeItem(KEY);
    setPersonId(null);
  }

  return { personId, ready, choose, clear };
}
