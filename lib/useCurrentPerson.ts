"use client";

import { useEffect, useState } from "react";

const KEY = "daily-planner:me";

/** Recuerda qué persona del hogar está usando este dispositivo. */
export function useCurrentPerson() {
  const [personId, setPersonId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Lectura de localStorage tras el montaje (no existe en el servidor): el
  // estado inicial es null/false para evitar desajustes de hidratación y se
  // sincroniza una vez en el cliente. La regla sobre-marca este caso válido.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPersonId(window.localStorage.getItem(KEY));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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
