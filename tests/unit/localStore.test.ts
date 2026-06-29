// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { newId, defaultData, loadLocal, saveLocal } from "@/lib/localStore";

// localStorage no existe en Node — jsdom lo provee; lo limpiamos entre tests.
beforeEach(() => {
  localStorage.clear();
});

describe("newId", () => {
  it("returns a non-empty string", () => {
    expect(typeof newId()).toBe("string");
    expect(newId().length).toBeGreaterThan(0);
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 100 }, () => newId()));
    expect(ids.size).toBe(100);
  });
});

describe("defaultData", () => {
  it("includes at least one admin person", () => {
    const data = defaultData();
    expect(data.people.some((p) => p.is_admin)).toBe(true);
  });

  it("starts with no tasks", () => {
    expect(defaultData().tasks).toHaveLength(0);
  });

  it("includes at least one category", () => {
    expect(defaultData().categories.length).toBeGreaterThan(0);
  });

  it("all people have a color and name", () => {
    defaultData().people.forEach((p) => {
      expect(p.name).toBeTruthy();
      expect(p.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

describe("loadLocal", () => {
  it("returns defaultData when localStorage is empty", () => {
    const data = loadLocal();
    expect(data.people.length).toBeGreaterThan(0);
    expect(data.tasks).toHaveLength(0);
  });

  it("persists defaultData to localStorage on first load", () => {
    loadLocal();
    expect(localStorage.getItem("daily-planner:data:v1")).not.toBeNull();
  });

  it("returns previously saved data", () => {
    const saved = { people: [], categories: [], tasks: [] };
    localStorage.setItem("daily-planner:data:v1", JSON.stringify(saved));
    expect(loadLocal()).toEqual(saved);
  });

  it("falls back to defaultData when localStorage is corrupted", () => {
    localStorage.setItem("daily-planner:data:v1", "{{invalid json");
    const data = loadLocal();
    expect(data.people.length).toBeGreaterThan(0);
  });
});

describe("saveLocal", () => {
  it("persists data that loadLocal can recover", () => {
    const data = defaultData();
    data.tasks.push({
      id: newId(),
      title: "Tarea test",
      notes: null,
      scheduled_at: new Date().toISOString(),
      duration_min: 30,
      person_id: null,
      category_id: null,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    saveLocal(data);
    const recovered = loadLocal();
    expect(recovered.tasks).toHaveLength(1);
    expect(recovered.tasks[0].title).toBe("Tarea test");
  });
});
