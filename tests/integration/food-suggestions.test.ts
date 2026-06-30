import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/food-suggestions/route";

const makeRequest = (body: Record<string, unknown>) =>
  new NextRequest("http://localhost/api/food-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/food-suggestions", () => {
  const originalEnv = process.env.OPENROUTER_API_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.OPENROUTER_API_KEY = originalEnv;
  });

  it("devuelve suggestions vacías si no hay API key", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const res = await POST(makeRequest({ keyword: "desayuno", isAlicia: false }));
    const data = await res.json();

    expect(data.suggestions).toEqual([]);
  });

  it("devuelve suggestions vacías si no hay keyword", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const res = await POST(makeRequest({ isAlicia: false }));
    const data = await res.json();

    expect(data.suggestions).toEqual([]);
  });

  it("llama a OpenRouter con la API key correcta y devuelve sugerencias", async () => {
    process.env.OPENROUTER_API_KEY = "test-key-123";

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Arroz con pollo, Pasta, Ensalada" } }],
        }),
        { status: 200 }
      )
    );

    const res = await POST(makeRequest({ keyword: "almuerzo", isAlicia: false }));
    const data = await res.json();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(JSON.parse(opts.body as string).messages[0].content).toContain("almuerzo");

    expect(data.suggestions).toHaveLength(3);
    expect(data.suggestions).toContain("Arroz con pollo");
  });

  it("para Alicia (snack), el prompt menciona compotas", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Compota de manzana, Compota de pera" } }],
        }),
        { status: 200 }
      )
    );

    const res = await POST(makeRequest({ keyword: "media mañana", isAlicia: true }));
    const data = await res.json();

    const sentBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(sentBody.messages[0].content).toContain("compota");

    expect(data.suggestions).toContain("Compota de manzana");
  });

  it("para Alicia con comida que no es snack (almuerzo), el prompt pide preparaciones de bebé", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Puré de papa, Avena con manzana" } }],
        }),
        { status: 200 }
      )
    );

    const res = await POST(makeRequest({ keyword: "almuerzo", isAlicia: true }));
    const data = await res.json();

    const sentBody = JSON.parse(
      (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string
    );
    const prompt: string = sentBody.messages[0].content;
    expect(prompt).toContain("preparaciones");
    expect(prompt).toContain("bebé");
    expect(prompt).not.toContain("compotas");

    expect(data.suggestions).toContain("Puré de papa");
  });

  it("usa ingredientes de la despensa si se proveen", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "Sopa de lentejas" } }] }),
        { status: 200 }
      )
    );

    await POST(
      makeRequest({
        keyword: "almuerzo",
        isAlicia: false,
        ingredients: ["lentejas", "cebolla", "tomate"],
      })
    );

    const sentBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(sentBody.messages[0].content).toContain("lentejas");
    expect(sentBody.messages[0].content).toContain("cebolla");
  });

  it("para Alicia (snack) usa las frutas provistas de la despensa", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "Compota de banano" } }] }),
        { status: 200 }
      )
    );

    await POST(
      makeRequest({ keyword: "media mañana", isAlicia: true, fruits: ["banano", "papaya"] })
    );

    const sentBody = JSON.parse(
      (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string
    );
    expect(sentBody.messages[0].content).toContain("banano");
    expect(sentBody.messages[0].content).toContain("papaya");
  });

  it("devuelve suggestions vacías si la respuesta no trae choices", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const res = await POST(makeRequest({ keyword: "almuerzo", isAlicia: false }));
    const data = await res.json();

    expect(data.suggestions).toEqual([]);
  });

  it("devuelve suggestions vacías si la respuesta de OpenRouter falla", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 500 })
    );

    const res = await POST(makeRequest({ keyword: "cena", isAlicia: false }));
    const data = await res.json();

    expect(data.suggestions).toEqual([]);
  });

  it("devuelve suggestions vacías si fetch lanza una excepción", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const res = await POST(makeRequest({ keyword: "cena", isAlicia: false }));
    const data = await res.json();

    expect(data.suggestions).toEqual([]);
  });

  it("deduplica sugerencias repetidas", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Arroz, Arroz, Pasta, Pasta, Sopa, Ensalada" } }],
        }),
        { status: 200 }
      )
    );

    const res = await POST(makeRequest({ keyword: "almuerzo", isAlicia: false }));
    const data = await res.json();

    const unique = new Set(data.suggestions);
    expect(unique.size).toBe(data.suggestions.length);
  });

  it("retorna máximo 6 sugerencias", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "Uno, Dos, Tres, Cuatro, Cinco, Seis, Siete, Ocho",
              },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const res = await POST(makeRequest({ keyword: "cena", isAlicia: false }));
    const data = await res.json();

    expect(data.suggestions.length).toBeLessThanOrEqual(6);
  });
});
