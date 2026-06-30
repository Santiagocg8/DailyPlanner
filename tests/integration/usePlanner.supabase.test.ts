// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock del cliente Supabase con un query builder encadenable. Cubre la rama
// "remota" de usePlanner (carga inicial, realtime y mutaciones), que el test
// en modo local no ejercita. vi.hoisted permite construir el mock antes de
// que vi.mock (hoisteado) lo referencie.
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>;
type Op = { op: string; table: string; col?: string; val?: string; row?: Row; patch?: Row };

const h = vi.hoisted(() => {
  const seed: Record<string, Row[]> = {
    people: [{ id: "p1", name: "Santi", color: "#3b82f6", avatar_emoji: "🧔", is_admin: true }],
    categories: [{ id: "c1", name: "Casa", color: "#8b5cf6" }],
    tasks: [
      {
        id: "t1",
        title: "Cena",
        notes: null,
        scheduled_at: "2026-01-01T00:00:00Z",
        duration_min: 30,
        person_id: "p1",
        category_id: "c1",
        status: "pending",
        created_at: "",
      },
    ],
  };
  const ops: Op[] = [];
  const ctrl = { nullData: false };

  function builder(table: string) {
    const b = {
      select: vi.fn(() => b),
      order: vi.fn(() =>
        Promise.resolve({ data: ctrl.nullData ? null : seed[table] ?? [], error: null })
      ),
      insert: vi.fn((row: Row) => {
        ops.push({ op: "insert", table, row });
        return Promise.resolve({ data: null, error: null });
      }),
      update: vi.fn((patch: Row) => ({
        eq: vi.fn((col: string, val: string) => {
          ops.push({ op: "update", table, col, val, patch });
          return Promise.resolve({ data: null, error: null });
        }),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn((col: string, val: string) => {
          ops.push({ op: "delete", table, col, val });
          return Promise.resolve({ data: null, error: null });
        }),
      })),
    };
    return b;
  }

  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn(() => channel),
  };

  const client = {
    from: vi.fn((table: string) => builder(table)),
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  };

  return { client, ops, channel, ctrl };
});

vi.mock("@/lib/supabase", () => ({
  supabase: h.client,
  isSupabaseEnabled: true,
}));

import { usePlanner } from "@/lib/usePlanner";

/** Monta el hook y espera a que termine la carga inicial desde Supabase. */
async function mountReady() {
  const view = renderHook(() => usePlanner());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

beforeEach(() => {
  h.ops.length = 0;
  h.ctrl.nullData = false;
  vi.clearAllMocks();
});

describe("usePlanner (modo Supabase)", () => {
  it("carga personas, categorías y tareas desde Supabase al montar", async () => {
    const { result } = await mountReady();

    expect(result.current.people[0].name).toBe("Santi");
    expect(result.current.categories[0].name).toBe("Casa");
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.isRealtime).toBe(true);
  });

  it("tolera respuestas con data null (cae a listas vacías)", async () => {
    h.ctrl.nullData = true;
    const { result } = await mountReady();

    expect(result.current.people).toEqual([]);
    expect(result.current.categories).toEqual([]);
    expect(result.current.tasks).toEqual([]);
  });

  it("se suscribe a realtime en las 3 tablas y limpia el canal al desmontar", async () => {
    const { unmount } = await mountReady();

    expect(h.client.channel).toHaveBeenCalledWith("planner-changes");
    expect(h.channel.on).toHaveBeenCalledTimes(3);
    expect(h.channel.subscribe).toHaveBeenCalledTimes(1);

    unmount();
    expect(h.client.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("createTask inserta en la tabla tasks", async () => {
    const { result } = await mountReady();

    await act(async () => {
      await result.current.createTask({
        title: "Nueva",
        notes: null,
        scheduled_at: "2026-02-02T10:00:00Z",
        duration_min: 45,
        person_id: null,
        category_id: null,
        status: "pending",
      });
    });

    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "insert", table: "tasks" })
    );
  });

  it("updateTask actualiza por id en tasks", async () => {
    const { result } = await mountReady();

    await act(async () => {
      await result.current.updateTask("t1", { status: "done" });
    });

    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "update", table: "tasks", col: "id", val: "t1" })
    );
  });

  it("deleteTask elimina por id en tasks", async () => {
    const { result } = await mountReady();

    await act(async () => {
      await result.current.deleteTask("t1");
    });

    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "delete", table: "tasks", col: "id", val: "t1" })
    );
  });

  it("createPerson / updatePerson / deletePerson operan sobre people", async () => {
    const { result } = await mountReady();

    await act(async () => {
      await result.current.createPerson({
        name: "Yuli",
        color: "#ec4899",
        avatar_emoji: null,
        is_admin: false,
      });
      await result.current.updatePerson("p1", { name: "Santiago" });
      await result.current.deletePerson("p1");
    });

    expect(h.ops).toContainEqual(expect.objectContaining({ op: "insert", table: "people" }));
    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "update", table: "people", val: "p1" })
    );
    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "delete", table: "people", val: "p1" })
    );
  });

  it("createCategory / updateCategory / deleteCategory operan sobre categories", async () => {
    const { result } = await mountReady();

    await act(async () => {
      await result.current.createCategory({ name: "Jardín", color: "#10b981" });
      await result.current.updateCategory("c1", { name: "Hogar" });
      await result.current.deleteCategory("c1");
    });

    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "insert", table: "categories" })
    );
    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "update", table: "categories", val: "c1" })
    );
    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "delete", table: "categories", val: "c1" })
    );
  });
});
