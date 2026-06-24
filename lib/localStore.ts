import type { Category, Person, Task } from "./types";

/**
 * Almacenamiento local (localStorage) usado cuando Supabase no está
 * configurado. Permite usar la app de inmediato; los datos viven en el
 * navegador del dispositivo (no se sincronizan entre dispositivos).
 */

const KEY = "daily-planner:data:v1";

export interface PlannerData {
  people: Person[];
  categories: Category[];
  tasks: Task[];
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function defaultData(): PlannerData {
  const mama = newId();
  const papa = newId();
  const hijo = newId();
  const emp = newId();
  const casa = newId();
  const cole = newId();
  const jardin = newId();
  return {
    people: [
      { id: mama, name: "Mamá", color: "#ec4899", avatar_emoji: "👩" },
      { id: papa, name: "Papá", color: "#3b82f6", avatar_emoji: "👨" },
      { id: hijo, name: "Hijo", color: "#22c55e", avatar_emoji: "🧒" },
      { id: emp, name: "Empleada", color: "#f59e0b", avatar_emoji: "🧹" },
    ],
    categories: [
      { id: casa, name: "Casa", color: "#8b5cf6" },
      { id: cole, name: "Colegio", color: "#06b6d4" },
      { id: jardin, name: "Jardín", color: "#10b981" },
    ],
    tasks: [],
  };
}

export function loadLocal(): PlannerData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seed = defaultData();
      window.localStorage.setItem(KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as PlannerData;
  } catch {
    return defaultData();
  }
}

export function saveLocal(data: PlannerData): void {
  if (typeof window === "undefined") return;
  // El evento nativo `storage` notifica a OTRAS pestañas del mismo origen
  // (no a la pestaña actual), así que no necesitamos un evento propio y
  // evitamos reentradas que dupliquen el estado.
  window.localStorage.setItem(KEY, JSON.stringify(data));
}
