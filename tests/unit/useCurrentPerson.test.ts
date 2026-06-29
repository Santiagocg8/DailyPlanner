// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCurrentPerson } from "@/lib/useCurrentPerson";

const LS_KEY = "daily-planner:me";

beforeEach(() => {
  localStorage.clear();
});

describe("useCurrentPerson", () => {
  it("arranca con personId null cuando localStorage está vacío", () => {
    const { result } = renderHook(() => useCurrentPerson());
    expect(result.current.personId).toBeNull();
    expect(result.current.ready).toBe(true);
  });

  it("carga el personId guardado en localStorage al montar", () => {
    localStorage.setItem(LS_KEY, "abc-123");
    const { result } = renderHook(() => useCurrentPerson());
    expect(result.current.personId).toBe("abc-123");
  });

  it("choose() guarda el id en localStorage y actualiza el estado", () => {
    const { result } = renderHook(() => useCurrentPerson());
    act(() => result.current.choose("uuid-santi"));
    expect(result.current.personId).toBe("uuid-santi");
    expect(localStorage.getItem(LS_KEY)).toBe("uuid-santi");
  });

  it("clear() elimina el id de localStorage y pone personId en null", () => {
    localStorage.setItem(LS_KEY, "uuid-santi");
    const { result } = renderHook(() => useCurrentPerson());
    act(() => result.current.clear());
    expect(result.current.personId).toBeNull();
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });
});

/**
 * Tests para la condición de mostrar PersonPicker en Planner.
 *
 * Bug corregido: cuando el ID guardado en localStorage (modo local) no coincide
 * con ninguna persona de Supabase, currentPerson queda null y los botones de
 * perfil/admin eran invisibles sin que el PersonPicker apareciera.
 *
 * Fix: (!personId || !currentPerson) && people.length > 0
 */
describe("lógica de PersonPicker - regresión ID obsoleto", () => {
  type Person = { id: string; name: string };

  function shouldShowPicker(
    personId: string | null,
    currentPerson: Person | null,
    people: Person[]
  ): boolean {
    return (!personId || !currentPerson) && people.length > 0;
  }

  const supabasePeople: Person[] = [
    { id: "uuid-santi", name: "Santi" },
    { id: "uuid-yuli", name: "Yuli" },
  ];

  it("muestra PersonPicker cuando no hay personId guardado", () => {
    expect(shouldShowPicker(null, null, supabasePeople)).toBe(true);
  });

  it("no muestra PersonPicker cuando personId coincide con una persona real", () => {
    const person = supabasePeople[0];
    expect(shouldShowPicker(person.id, person, supabasePeople)).toBe(false);
  });

  it("muestra PersonPicker cuando el personId es un ID obsoleto (modo local) que no existe en Supabase", () => {
    const staleLocalId = "local-generado-uuid-viejo";
    // currentPerson sería null porque people.find() no encuentra ese ID
    expect(shouldShowPicker(staleLocalId, null, supabasePeople)).toBe(true);
  });

  it("no muestra PersonPicker cuando people está vacío (Supabase aún cargando)", () => {
    // Evitamos mostrar PersonPicker antes de tener la lista real
    expect(shouldShowPicker(null, null, [])).toBe(false);
    expect(shouldShowPicker("stale-id", null, [])).toBe(false);
  });
});
