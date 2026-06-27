import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type MealType = "desayuno" | "almuerzo" | "snack";

function detectMealType(title: string): MealType | null {
  const lower = title.toLowerCase();
  if (lower.includes("desayuno")) return "desayuno";
  if (lower.includes("almuerzo") || lower.includes("comida")) return "almuerzo";
  if (
    lower.includes("algo") ||
    lower.includes("media mañana") ||
    lower.includes("media manana") ||
    lower.includes("media tarde") ||
    lower.includes("merienda") ||
    lower.includes("snack")
  )
    return "snack";
  return null;
}

const MEAL_CONTEXT: Record<MealType, string> = {
  desayuno:
    "desayuno para una bebé de 10 meses. Alimentos habituales: huevos revueltos suaves, queso fresco rallado, galletas de arroz, avena cocida, frutas como banano o aguacate, nestum. La bebé come sólidos blandos o puré.",
  almuerzo:
    "almuerzo para una bebé de 10 meses. Puede comer casi todo en formato blando: verduras cocidas, legumbres aplastadas, pollo desmenuzado, pescado suave, arroz, pasta pequeña, puré de vegetales con proteína.",
  snack:
    "merienda o snack para una bebé de 10 meses. Opciones ideales: frutas blandas (banano, mango, papaya, pera), yogurt natural sin azúcar, compotas de frutas, galletas blandas.",
};

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const mealType = detectMealType(title);
    if (!mealType) {
      return NextResponse.json({ suggestions: [] });
    }

    const model = genai.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `Sugiere 3 ideas creativas y variadas de ${MEAL_CONTEXT[mealType]}

Responde SOLO con un array JSON válido de 3 strings. Cada string debe ser una sugerencia concisa (máximo 60 caracteres), apetitosa y específica. No incluyas explicaciones, solo el JSON.

Ejemplo de formato: ["Puré de batata con pollo", "Avena con banano y canela", "Revuelto de huevo con aguacate"]`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    let suggestions: string[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      suggestions = match ? JSON.parse(match[0]) : [];
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ suggestions, mealType });
  } catch (err) {
    console.error("food-ideas error:", err);
    return NextResponse.json({ error: "Error generating suggestions" }, { status: 500 });
  }
}
