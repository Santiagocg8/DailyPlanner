"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, isSupabaseEnabled } from "./supabase";
import { loadLocal, saveLocal, newId, type PlannerData } from "./localStore";
import type { Category, Person, Task, TaskInput } from "./types";

/**
 * Hook único que expone los datos del planner y las mutaciones, abstrayendo
 * si la fuente es Supabase (con sincronización en tiempo real entre
 * dispositivos) o localStorage (fallback sin configuración).
 */
export function usePlanner() {
  const [people, setPeople] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fuente de verdad en memoria para el modo local. Mantenerla en un ref
  // evita efectos secundarios dentro de los updaters de setState (que en
  // StrictMode se ejecutan dos veces y duplicarían datos).
  const localRef = useRef<PlannerData>({ people: [], categories: [], tasks: [] });

  // --- Carga inicial + suscripción a cambios ---
  useEffect(() => {
    let cancelled = false;

    async function loadFromSupabase() {
      if (!supabase) return;
      const [p, c, t] = await Promise.all([
        supabase.from("people").select("*").order("name"),
        supabase.from("categories").select("*").order("name"),
        supabase.from("tasks").select("*").order("scheduled_at"),
      ]);
      if (cancelled) return;
      setPeople((p.data as Person[]) ?? []);
      setCategories((c.data as Category[]) ?? []);
      setTasks((t.data as Task[]) ?? []);
      setLoading(false);
    }

    function loadFromLocal() {
      const data = loadLocal();
      localRef.current = data;
      setPeople(data.people);
      setCategories(data.categories);
      setTasks(data.tasks);
      setLoading(false);
    }

    if (isSupabaseEnabled && supabase) {
      const client = supabase;
      loadFromSupabase();
      const channel = client
        .channel("planner-changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, loadFromSupabase)
        .on("postgres_changes", { event: "*", schema: "public", table: "people" }, loadFromSupabase)
        .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, loadFromSupabase)
        .subscribe();
      return () => {
        cancelled = true;
        client.removeChannel(channel);
      };
    } else {
      loadFromLocal();
      // Otras pestañas del mismo navegador disparan el evento `storage`.
      const onStorage = () => loadFromLocal();
      window.addEventListener("storage", onStorage);
      return () => {
        cancelled = true;
        window.removeEventListener("storage", onStorage);
      };
    }
  }, []);

  /** Aplica un cambio al estado local: persiste y refresca el estado React. */
  const commitLocal = useCallback((next: PlannerData) => {
    localRef.current = next;
    saveLocal(next);
    setPeople(next.people);
    setCategories(next.categories);
    setTasks(next.tasks);
  }, []);

  // --- Mutaciones de tareas ---
  const createTask = useCallback(
    async (input: TaskInput) => {
      if (supabase) {
        await supabase.from("tasks").insert(input);
        return;
      }
      const task: Task = { ...input, id: newId(), created_at: new Date().toISOString() };
      const cur = localRef.current;
      commitLocal({ ...cur, tasks: [...cur.tasks, task] });
    },
    [commitLocal]
  );

  const updateTask = useCallback(
    async (id: string, patch: Partial<TaskInput>) => {
      if (supabase) {
        await supabase.from("tasks").update(patch).eq("id", id);
        return;
      }
      const cur = localRef.current;
      commitLocal({
        ...cur,
        tasks: cur.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      });
    },
    [commitLocal]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (supabase) {
        await supabase.from("tasks").delete().eq("id", id);
        return;
      }
      const cur = localRef.current;
      commitLocal({ ...cur, tasks: cur.tasks.filter((t) => t.id !== id) });
    },
    [commitLocal]
  );

  // --- Mutaciones de personas ---
  const createPerson = useCallback(
    async (input: Omit<Person, "id">) => {
      if (supabase) {
        await supabase.from("people").insert(input);
        return;
      }
      const cur = localRef.current;
      commitLocal({ ...cur, people: [...cur.people, { ...input, id: newId() }] });
    },
    [commitLocal]
  );

  const updatePerson = useCallback(
    async (id: string, patch: Partial<Omit<Person, "id">>) => {
      if (supabase) {
        await supabase.from("people").update(patch).eq("id", id);
        return;
      }
      const cur = localRef.current;
      commitLocal({
        ...cur,
        people: cur.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      });
    },
    [commitLocal]
  );

  const deletePerson = useCallback(
    async (id: string) => {
      if (supabase) {
        await supabase.from("people").delete().eq("id", id);
        return;
      }
      const cur = localRef.current;
      commitLocal({
        ...cur,
        people: cur.people.filter((p) => p.id !== id),
        // Las tareas de esa persona quedan sin asignar (refleja el ON DELETE SET NULL).
        tasks: cur.tasks.map((t) => (t.person_id === id ? { ...t, person_id: null } : t)),
      });
    },
    [commitLocal]
  );

  // --- Mutaciones de categorías ---
  const createCategory = useCallback(
    async (input: Omit<Category, "id">) => {
      if (supabase) {
        await supabase.from("categories").insert(input);
        return;
      }
      const cur = localRef.current;
      commitLocal({ ...cur, categories: [...cur.categories, { ...input, id: newId() }] });
    },
    [commitLocal]
  );

  const updateCategory = useCallback(
    async (id: string, patch: Partial<Omit<Category, "id">>) => {
      if (supabase) {
        await supabase.from("categories").update(patch).eq("id", id);
        return;
      }
      const cur = localRef.current;
      commitLocal({
        ...cur,
        categories: cur.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });
    },
    [commitLocal]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (supabase) {
        await supabase.from("categories").delete().eq("id", id);
        return;
      }
      const cur = localRef.current;
      commitLocal({
        ...cur,
        categories: cur.categories.filter((c) => c.id !== id),
        tasks: cur.tasks.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
      });
    },
    [commitLocal]
  );

  return {
    people,
    categories,
    tasks,
    loading,
    isRealtime: isSupabaseEnabled,
    createTask,
    updateTask,
    deleteTask,
    createPerson,
    updatePerson,
    deletePerson,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
