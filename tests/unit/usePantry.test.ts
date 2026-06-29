// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mockeamos el módulo de supabase para aislar el hook del backend
vi.mock("@/lib/supabase", () => ({
  supabase: null,
  isSupabaseEnabled: false,
}));

import { usePantry } from "@/lib/usePantry";

const LS_KEY = "pantry_items";

beforeEach(() => {
  localStorage.clear();
});

describe("usePantry (modo local)", () => {
  it("inicia con lista vacía cuando localStorage está vacío", () => {
    const { result } = renderHook(() => usePantry());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.loading).toBe(false);
  });

  it("carga items existentes de localStorage", () => {
    const existing = [
      { id: "1", name: "Arroz", is_baby_safe: true, is_fruit: false, created_at: "" },
    ];
    localStorage.setItem(LS_KEY, JSON.stringify(existing));

    const { result } = renderHook(() => usePantry());
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Arroz");
  });

  it("addItem agrega un ingrediente", async () => {
    const { result } = renderHook(() => usePantry());

    await act(async () => {
      await result.current.addItem("Huevos", false, false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Huevos");
    expect(result.current.items[0].is_baby_safe).toBe(false);
  });

  it("addItem respeta los flags is_baby_safe e is_fruit", async () => {
    const { result } = renderHook(() => usePantry());

    await act(async () => {
      await result.current.addItem("Manzana", true, true);
    });

    expect(result.current.items[0].is_baby_safe).toBe(true);
    expect(result.current.items[0].is_fruit).toBe(true);
  });

  it("updateItem modifica un campo del item", async () => {
    const { result } = renderHook(() => usePantry());

    await act(async () => {
      await result.current.addItem("Pera", false, true);
    });

    const id = result.current.items[0].id;

    await act(async () => {
      await result.current.updateItem(id, { is_baby_safe: true });
    });

    expect(result.current.items[0].is_baby_safe).toBe(true);
    expect(result.current.items[0].is_fruit).toBe(true); // sin cambios
  });

  it("removeItem elimina el item correcto", async () => {
    const { result } = renderHook(() => usePantry());

    await act(async () => {
      await result.current.addItem("Leche", false, false);
      await result.current.addItem("Queso", false, false);
    });

    const idToRemove = result.current.items[0].id;

    await act(async () => {
      await result.current.removeItem(idToRemove);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Queso");
  });

  it("los cambios persisten en localStorage", async () => {
    const { result } = renderHook(() => usePantry());

    await act(async () => {
      await result.current.addItem("Avena", false, false);
    });

    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Avena");
  });
});
