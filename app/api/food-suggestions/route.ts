import type { NextRequest } from "next/server";
import { ALICIA_PROFILE, FAMILY_PROFILE, SNACK_KEYWORDS } from "@/lib/pantry";

function buildPrompt(keyword: string, isAlicia: boolean): string {
  if (isAlicia) {
    const isSnack = SNACK_KEYWORDS.some((k) => keyword.toLowerCase().includes(k));

    if (isSnack) {
      const fruits = ALICIA_PROFILE.fruits.join(", ");
      return (
        `Tengo estas frutas disponibles: ${fruits}. ` +
        `Sugiere 6 compotas para el ${keyword} de una bebé de ${ALICIA_PROFILE.ageMonths} meses. ` +
        `Pueden ser compotas simples o combinadas de dos frutas, sin azúcar añadida. ` +
        `Usa únicamente las frutas de la lista. ` +
        `Nombra cada una como "Compota de [fruta]" o "Compota de [fruta1] y [fruta2]". ` +
        `Responde solo con los nombres separados por coma, sin numeración ni texto adicional.`
      );
    }

    const ingredients = ALICIA_PROFILE.ingredients.join(", ");
    return (
      `Tengo estos ingredientes disponibles en casa: ${ingredients}. ` +
      `Sugiere 6 preparaciones concretas para el ${keyword} de una bebé de ${ALICIA_PROFILE.ageMonths} meses. ` +
      `Las preparaciones deben ser blandas, en puré o trozos pequeños, sin sal añadida y sin miel. ` +
      `Usa únicamente ingredientes de la lista. ` +
      `Responde solo con los nombres de las preparaciones separados por coma, sin numeración ni texto adicional.`
    );
  }

  // Perfil familiar
  const ingredients = FAMILY_PROFILE.ingredients.join(", ");
  const dishes = FAMILY_PROFILE.typicalDishes.join(", ");
  return (
    `Tengo estos ingredientes disponibles en casa: ${ingredients}. ` +
    `También preparo platos como: ${dishes}. ` +
    `Sugiere 6 preparaciones concretas para el ${keyword}, estilo colombiano (Medellín). ` +
    `Usa los ingredientes disponibles o los platos típicos mencionados. ` +
    `Responde únicamente con los nombres separados por coma, sin numeración ni texto adicional.`
  );
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return Response.json({ suggestions: [] });

  const { keyword, isAlicia } = await request.json();
  if (!keyword) return Response.json({ suggestions: [] });

  const prompt = buildPrompt(keyword, !!isAlicia);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dailyplanner.app",
        "X-Title": "Daily Planner",
      },
      body: JSON.stringify({
        model: "google/gemma-4-26b-a4b-it:free",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return Response.json({ suggestions: [] });

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const suggestions = [...new Set(
      text
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
    )].slice(0, 6);

    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] });
  }
}
