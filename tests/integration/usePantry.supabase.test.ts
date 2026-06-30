// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock del cliente Supabase para cubrir la rama "remota" de usePantry (carga
// inicial, suscripción realtime y mutaciones), no ejercitada por el test local.
// ---------------------------------------------------------------------------
type Row = Record<string, unknown>;
type Op = { op: string; table: string; col?: string; val?: string; row?: Row; patch?: Row };

const h = vi.hoisted(() => {
  const seed: Record<string, Row[]> = {
    pantry_items: [
      { id: "i1", name: "Arroz", is_baby_safe: true, is_fruit: false, created_at: "" },
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

import { usePantry } from "@/lib/usePantry";

async function mountReady() {
  const view = renderHook(() => usePantry());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

beforeEach(() => {
  h.ops.length = 0;
  h.ctrl.nullData = false;
  vi.clearAllMocks();
});

describe("usePantry (modo Supabase)", () => {
  it("carga los ingredientes desde Supabase al montar", async () => {
    const { result } = await mountReady();

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Arroz");
  });

  it("tolera una respuesta con data null (lista vacía)", async () => {
    h.ctrl.nullData = true;
    const { result } = await mountReady();

    expect(result.current.items).toEqual([]);
  });

  it("se suscribe a realtime y limpia el canal al desmontar", async () => {
    const { unmount } = await mountReady();

    expect(h.client.channel).toHaveBeenCalledTimes(1);
    expect(h.channel.on).toHaveBeenCalledTimes(1);
    expect(h.channel.subscribe).toHaveBeenCalledTimes(1);

    unmount();
    expect(h.client.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("addItem inserta en pantry_items", async () => {
    const { result } = await mountReady();

    await act(async () => {
      await result.current.addItem("Huevos", false, true);
    });

    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "insert", table: "pantry_items" })
    );
    const inserted = h.ops.find((o) => o.op === "insert");
    expect(inserted?.row).toMatchObject({ name: "Huevos", is_baby_safe: false, is_fruit: true });
  });

  it("updateItem actualiza por id en pantry_items", async () => {
    const { result } = await mountReady();

    await act(async () => {
      await result.current.updateItem("i1", { is_baby_safe: false });
    });

    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "update", table: "pantry_items", col: "id", val: "i1" })
    );
  });

  it("removeItem elimina por id en pantry_items", async () => {
    const { result } = await mountReady();

    await act(async () => {
      await result.current.removeItem("i1");
    });

    expect(h.ops).toContainEqual(
      expect.objectContaining({ op: "delete", table: "pantry_items", col: "id", val: "i1" })
    );
  });
});
