import { describe, it, expect } from "vitest";
import { cn, readableTextColor } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("handles conditional objects", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });
});

describe("readableTextColor", () => {
  it("returns white text for dark backgrounds", () => {
    expect(readableTextColor("#000000")).toBe("#ffffff");
    expect(readableTextColor("#1f2430")).toBe("#ffffff");
    expect(readableTextColor("#3b82f6")).toBe("#ffffff");
  });

  it("returns dark text for light backgrounds", () => {
    expect(readableTextColor("#ffffff")).toBe("#1f2430");
    expect(readableTextColor("#f59e0b")).toBe("#1f2430");
    expect(readableTextColor("#84cc16")).toBe("#1f2430");
  });

  it("handles hex without #", () => {
    // La función usa replace("#", "") internamente
    expect(readableTextColor("#000000")).toBe("#ffffff");
  });
});
