import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/lib/supabase", () => ({
  supabase: null,
  isSupabaseEnabled: false,
}));

import { usePlanner } from "@/lib/usePlanner";

beforeEach(() => {
  localStorage.clear();
});

describe("usePlanner (modo local)", () => {
  it("carga con loading=false e isRealtime=false", () => {
    const { result } = renderHook(() => usePlanner());
    expect(result.current.loading).toBe(false);
    expect(result.current.isRealtime).toBe(false);
  });

  it("carga los datos seed cuando localStorage está vacío", () => {
    const { result } = renderHook(() => usePlanner());
    // localStore.ts siembra 4 personas por defecto
    expect(result.current.people.length).toBeGreaterThan(0);
    expect(result.current.categories.length).toBeGreaterThan(0);
  });

  describe("tasks", () => {
    it("createTask aumenta el total de tareas en 1", async () => {
      const { result } = renderHook(() => usePlanner());
      const initial = result.current.tasks.length;

      await act(async () => {
        await result.current.createTask({
          title: "Desayuno",
          notes: null,
          scheduled_at: "2024-06-15T08:00:00.000Z",
          duration_min: 30,
          person_id: null,
          category_id: null,
          status: "pending",
        });
      });

      expect(result.current.tasks).toHaveLength(initial + 1);
      expect(result.current.tasks.some((t) => t.title === "Desayuno")).toBe(true);
    });

    it("updateTask modifica el título de la tarea", async () => {
      const { result } = renderHook(() => usePlanner());

      await act(async () => {
        await result.current.createTask({
          title: "Almuerzo",
          notes: null,
          scheduled_at: "2024-06-15T12:00:00.000Z",
          duration_min: 60,
          person_id: null,
          category_id: null,
          status: "pending",
        });
      });

      const task = result.current.tasks.find((t) => t.title === "Almuerzo")!;

      await act(async () => {
        await result.current.updateTask(task.id, { title: "Almuerzo actualizado" });
      });

      expect(result.current.tasks.some((t) => t.title === "Almuerzo actualizado")).toBe(true);
      expect(result.current.tasks.some((t) => t.title === "Almuerzo")).toBe(false);
    });

    it("deleteTask elimina exactamente una tarea", async () => {
      const { result } = renderHook(() => usePlanner());

      await act(async () => {
        await result.current.createTask({
          title: "Cena",
          notes: null,
          scheduled_at: "2024-06-15T19:00:00.000Z",
          duration_min: 45,
          person_id: null,
          category_id: null,
          status: "pending",
        });
      });

      const countBefore = result.current.tasks.length;
      const task = result.current.tasks.find((t) => t.title === "Cena")!;

      await act(async () => {
        await result.current.deleteTask(task.id);
      });

      expect(result.current.tasks).toHaveLength(countBefore - 1);
      expect(result.current.tasks.some((t) => t.title === "Cena")).toBe(false);
    });

    it("updateTask solo modifica la tarea indicada, no las demás", async () => {
      const { result } = renderHook(() => usePlanner());

      await act(async () => {
        await result.current.createTask({
          title: "Tarea A",
          notes: null,
          scheduled_at: "2024-06-15T08:00:00.000Z",
          duration_min: 30,
          person_id: null,
          category_id: null,
          status: "pending",
        });
        await result.current.createTask({
          title: "Tarea B",
          notes: null,
          scheduled_at: "2024-06-15T09:00:00.000Z",
          duration_min: 30,
          person_id: null,
          category_id: null,
          status: "pending",
        });
      });

      const a = result.current.tasks.find((t) => t.title === "Tarea A")!;

      await act(async () => {
        await result.current.updateTask(a.id, { status: "done" });
      });

      expect(result.current.tasks.find((t) => t.id === a.id)!.status).toBe("done");
      expect(result.current.tasks.find((t) => t.title === "Tarea B")!.status).toBe("pending");
    });
  });

  describe("people", () => {
    it("createPerson agrega una persona", async () => {
      const { result } = renderHook(() => usePlanner());
      const initial = result.current.people.length;

      await act(async () => {
        await result.current.createPerson({ name: "Santi", color: "#3b82f6", avatar_emoji: null, is_admin: false });
      });

      expect(result.current.people).toHaveLength(initial + 1);
      expect(result.current.people.some((p) => p.name === "Santi")).toBe(true);
    });

    it("updatePerson modifica el nombre", async () => {
      const { result } = renderHook(() => usePlanner());

      await act(async () => {
        await result.current.createPerson({ name: "Santiago", color: "#3b82f6", avatar_emoji: null, is_admin: false });
      });

      const person = result.current.people.find((p) => p.name === "Santiago")!;

      await act(async () => {
        await result.current.updatePerson(person.id, { name: "Santiago C." });
      });

      expect(result.current.people.some((p) => p.name === "Santiago C.")).toBe(true);
      expect(result.current.people.some((p) => p.name === "Santiago")).toBe(false);
    });

    it("deletePerson elimina la persona y desvincula sus tareas", async () => {
      const { result } = renderHook(() => usePlanner());

      await act(async () => {
        await result.current.createPerson({ name: "Temporal", color: "#f59e0b", avatar_emoji: null, is_admin: false });
      });

      const person = result.current.people.find((p) => p.name === "Temporal")!;

      await act(async () => {
        await result.current.createTask({
          title: "Tarea de Temporal",
          notes: null,
          scheduled_at: "2024-06-15T09:00:00.000Z",
          duration_min: 30,
          person_id: person.id,
          category_id: null,
          status: "pending",
        });
      });

      const taskCountBefore = result.current.tasks.length;

      await act(async () => {
        await result.current.deletePerson(person.id);
      });

      expect(result.current.people.some((p) => p.name === "Temporal")).toBe(false);
      // La tarea persiste pero con person_id = null
      expect(result.current.tasks).toHaveLength(taskCountBefore);
      const updatedTask = result.current.tasks.find((t) => t.title === "Tarea de Temporal")!;
      expect(updatedTask.person_id).toBeNull();
    });

    it("deletePerson conserva las tareas que no son de esa persona", async () => {
      const { result } = renderHook(() => usePlanner());

      await act(async () => {
        await result.current.createPerson({
          name: "Borrable",
          color: "#000000",
          avatar_emoji: null,
          is_admin: false,
        });
      });
      const person = result.current.people.find((p) => p.name === "Borrable")!;

      await act(async () => {
        await result.current.createTask({
          title: "Suya",
          notes: null,
          scheduled_at: "2024-06-15T08:00:00.000Z",
          duration_min: 30,
          person_id: person.id,
          category_id: null,
          status: "pending",
        });
        await result.current.createTask({
          title: "Ajena",
          notes: null,
          scheduled_at: "2024-06-15T09:00:00.000Z",
          duration_min: 30,
          person_id: null,
          category_id: null,
          status: "pending",
        });
      });

      await act(async () => {
        await result.current.deletePerson(person.id);
      });

      expect(result.current.tasks.find((t) => t.title === "Suya")!.person_id).toBeNull();
      expect(result.current.tasks.some((t) => t.title === "Ajena")).toBe(true);
    });
  });

  describe("categories", () => {
    it("updateCategory renombra solo la categoría indicada", async () => {
      const { result } = renderHook(() => usePlanner());
      const cat = result.current.categories[0];
      const otraAntes = result.current.categories[1].name;

      await act(async () => {
        await result.current.updateCategory(cat.id, { name: "Renombrada" });
      });

      expect(result.current.categories.find((c) => c.id === cat.id)!.name).toBe("Renombrada");
      expect(result.current.categories.some((c) => c.name === otraAntes)).toBe(true);
    });

    it("createCategory agrega una categoría", async () => {
      const { result } = renderHook(() => usePlanner());
      const initial = result.current.categories.length;

      await act(async () => {
        await result.current.createCategory({ name: "Trabajo", color: "#6366f1" });
      });

      expect(result.current.categories).toHaveLength(initial + 1);
      expect(result.current.categories.some((c) => c.name === "Trabajo")).toBe(true);
    });

    it("deleteCategory desvincula tareas con esa categoría", async () => {
      const { result } = renderHook(() => usePlanner());

      await act(async () => {
        await result.current.createCategory({ name: "Salud", color: "#22c55e" });
      });

      const cat = result.current.categories.find((c) => c.name === "Salud")!;

      await act(async () => {
        await result.current.createTask({
          title: "Ejercicio",
          notes: null,
          scheduled_at: "2024-06-15T07:00:00.000Z",
          duration_min: 60,
          person_id: null,
          category_id: cat.id,
          status: "pending",
        });
      });

      const taskCountBefore = result.current.tasks.length;

      await act(async () => {
        await result.current.deleteCategory(cat.id);
      });

      expect(result.current.categories.some((c) => c.name === "Salud")).toBe(false);
      expect(result.current.tasks).toHaveLength(taskCountBefore);
      const updatedTask = result.current.tasks.find((t) => t.title === "Ejercicio")!;
      expect(updatedTask.category_id).toBeNull();
    });

    it("deleteCategory conserva las tareas de otras categorías", async () => {
      const { result } = renderHook(() => usePlanner());

      await act(async () => {
        await result.current.createCategory({ name: "Temporal", color: "#111111" });
      });
      const cat = result.current.categories.find((c) => c.name === "Temporal")!;

      await act(async () => {
        await result.current.createTask({
          title: "Con categoría",
          notes: null,
          scheduled_at: "2024-06-15T08:00:00.000Z",
          duration_min: 30,
          person_id: null,
          category_id: cat.id,
          status: "pending",
        });
        await result.current.createTask({
          title: "Sin categoría",
          notes: null,
          scheduled_at: "2024-06-15T09:00:00.000Z",
          duration_min: 30,
          person_id: null,
          category_id: null,
          status: "pending",
        });
      });

      await act(async () => {
        await result.current.deleteCategory(cat.id);
      });

      expect(result.current.tasks.find((t) => t.title === "Con categoría")!.category_id).toBeNull();
      expect(result.current.tasks.some((t) => t.title === "Sin categoría")).toBe(true);
    });
  });

  it("los cambios persisten entre renders del hook", async () => {
    const { result, rerender } = renderHook(() => usePlanner());
    const initial = result.current.people.length;

    await act(async () => {
      await result.current.createPerson({ name: "Mama Test", color: "#ec4899", avatar_emoji: null, is_admin: false });
    });

    rerender();

    expect(result.current.people).toHaveLength(initial + 1);
    expect(result.current.people.some((p) => p.name === "Mama Test")).toBe(true);
  });
});
