import { test, expect, type Page } from "@playwright/test";

// Nombres de personas en el entorno Supabase (dev) | entorno local (seed data)
const ADMIN_PATTERN = /Santi|Papá/;
const NON_ADMIN_PATTERN = /Jaque|Yuli|Mamá|Hijo|Empleada/;

async function goToPersonPicker(page: Page) {
  // Elimina solo la selección de persona (daily-planner:me) para volver al picker.
  // La fuente de datos (Supabase o localStorage) no se toca.
  await page.goto("/");
  await page.evaluate(() => window.localStorage.removeItem("daily-planner:me"));
  await page.reload();
  // Espera a que aparezca el heading del picker
  await page.waitForSelector("text=¿Quién eres?", { state: "visible" });
  // Espera a que los botones de persona animen hasta opacity 1
  await page
    .locator("button")
    .filter({ hasText: ADMIN_PATTERN })
    .first()
    .waitFor({ state: "visible" });
}

test.beforeEach(async ({ page }) => {
  await goToPersonPicker(page);
});

test.describe("Selección de perfil", () => {
  test("muestra la pantalla de bienvenida", async ({ page }) => {
    await expect(page.getByText("¿Quién eres?")).toBeVisible();
    await expect(page.getByText("Elige tu perfil para empezar")).toBeVisible();
  });

  test("muestra botones de persona visibles", async ({ page }) => {
    // Verifica que hay al menos 2 personas
    const personBtns = page.locator("button").filter({ hasText: /\w{3}/ });
    await expect(personBtns.first()).toBeVisible();
    expect(await personBtns.count()).toBeGreaterThanOrEqual(2);
  });

  test("seleccionar el admin muestra el botón de administración", async ({ page }) => {
    await page.locator("button").filter({ hasText: ADMIN_PATTERN }).first().click();
    await expect(page.getByTitle("Administrar personas y grupos")).toBeVisible();
  });

  test("seleccionar un no-admin no muestra el botón de administración", async ({ page }) => {
    await page.locator("button").filter({ hasText: NON_ADMIN_PATTERN }).first().click();

    await expect(page.getByRole("button", { name: /día/i })).toBeVisible();
    await expect(page.getByTitle("Administrar personas y grupos")).not.toBeAttached();
  });
});

test.describe("Panel de administración", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("button").filter({ hasText: ADMIN_PATTERN }).first().click();
    await page.waitForSelector("[title='Administrar personas y grupos']");
    await page.getByTitle("Administrar personas y grupos").click();
    await page.waitForSelector("text=Administración");
  });

  test("muestra los tres tabs: Personas, Grupos, Despensa", async ({ page }) => {
    await expect(page.locator("button", { hasText: "Personas" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Grupos" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Despensa" })).toBeVisible();
  });

  test("el tab Despensa se abre sin errores de consola", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.locator("button", { hasText: "Despensa" }).click();

    await expect(page.getByPlaceholder("Agregar ingrediente…")).toBeVisible();
    await expect(page.getByText(/ingredientes disponibles en casa/i)).toBeVisible();

    const realErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("404") && !e.includes("ERR_")
    );
    expect(realErrors).toHaveLength(0);
  });

  test("puede agregar un ingrediente en la Despensa", async ({ page }) => {
    await page.locator("button", { hasText: "Despensa" }).click();
    await expect(page.getByPlaceholder("Agregar ingrediente…")).toBeVisible();

    await page.getByPlaceholder("Agregar ingrediente…").fill("Espinaca E2E");
    await page.getByRole("button", { name: "Agregar", exact: true }).click();

    await expect(page.getByText("Espinaca E2E")).toBeVisible();
  });

  test("el tab Grupos muestra el input de nuevo grupo", async ({ page }) => {
    await page.locator("button", { hasText: "Grupos" }).click();
    await expect(page.getByPlaceholder("Nuevo grupo…")).toBeVisible();
  });

  test("el tab Personas muestra el perfil activo", async ({ page }) => {
    await expect(page.getByText("Perfil activo")).toBeVisible();
  });
});

test.describe("Planner diario", () => {
  test.beforeEach(async ({ page }) => {
    await page.locator("button").filter({ hasText: ADMIN_PATTERN }).first().click();
    await page.waitForSelector("[aria-label='Agregar tarea']");
  });

  test("muestra las vistas día/semana/mes", async ({ page }) => {
    await expect(page.locator("button", { hasText: "Día" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Semana" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Mes" })).toBeVisible();
  });

  test("el botón + abre el diálogo de nueva tarea", async ({ page }) => {
    await page.getByRole("button", { name: "Agregar tarea" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("cambiar de perfil regresa a la selección", async ({ page }) => {
    await page.getByTitle("Cambiar de perfil").click();
    await page.waitForSelector("text=¿Quién eres?", { state: "visible" });
    await expect(page.getByText("¿Quién eres?")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Sugerencias de comida (OpenRouter)
//
// Al escribir una palabra clave de comida ("almuerzo") en el título de una
// tarea, el diálogo llama a /api/food-suggestions (que a su vez consulta
// OpenRouter) y despliega las sugerencias como chips clicables.
//
// Estrategia híbrida:
//  - Los tests por perfil interceptan /api/food-suggestions con una respuesta
//    fija → deterministas: validan el flujo y el despliegue en la UI sin
//    depender de la latencia del modelo gratuito de OpenRouter.
//  - Un test adicional llama a OpenRouter de verdad, pero es tolerante: si el
//    modelo responde, valida que las sugerencias reales se vean en la UI; si
//    tarda o devuelve vacío, hace skip (la integración ya está cubierta por
//    los tests unitarios de la ruta).
// ---------------------------------------------------------------------------
const SUGGESTIONS_API = "**/api/food-suggestions";
const ALMUERZO = "almuerzo";

const MOCK_FAMILIA = ["Arroz con pollo", "Sancocho", "Pasta al horno"];
const MOCK_ALICIA = ["Puré de papa y zanahoria", "Avena con manzana", "Compota de pera"];

const titleInput = (page: Page) => page.getByPlaceholder("Ej. Regar las plantas");

/** Selecciona un perfil del picker y espera a que cargue el planner. */
async function selectProfile(page: Page, pattern: RegExp | string) {
  await page.locator("button").filter({ hasText: pattern }).first().click();
  await page.waitForSelector("[aria-label='Agregar tarea']");
}

/** Abre el diálogo de nueva tarea desde el botón flotante. */
async function openNewTaskDialog(page: Page) {
  await page.getByRole("button", { name: "Agregar tarea" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("Sugerencias de comida (almuerzo)", () => {
  test("al ingresar 'almuerzo' como admin, se despliegan las sugerencias en la UI", async ({
    page,
  }) => {
    // Intercepta la llamada a OpenRouter con una respuesta determinista y
    // captura el cuerpo enviado para validar el contrato.
    let sentBody: { keyword?: string; isAlicia?: boolean } | null = null;
    await page.route(SUGGESTIONS_API, async (route) => {
      sentBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ suggestions: MOCK_FAMILIA }),
      });
    });

    await selectProfile(page, ADMIN_PATTERN);
    await openNewTaskDialog(page);

    await titleInput(page).fill(ALMUERZO);

    // Las sugerencias aparecen como chips clicables.
    await expect(page.getByText("Sugerencias:", { exact: false })).toBeVisible();
    for (const s of MOCK_FAMILIA) {
      await expect(page.getByRole("button", { name: s })).toBeVisible();
    }

    // El cuerpo enviado a la API lleva la palabra clave y isAlicia=false.
    expect(sentBody).not.toBeNull();
    expect(sentBody!.keyword).toBe(ALMUERZO);
    expect(sentBody!.isAlicia).toBe(false);

    // Al hacer clic en un chip, su texto rellena el título.
    await page.getByRole("button", { name: MOCK_FAMILIA[0] }).click();
    await expect(titleInput(page)).toHaveValue(MOCK_FAMILIA[0]);
  });

  test("al ingresar 'almuerzo' como Alicia (bebé), se piden sugerencias de bebé", async ({
    page,
  }) => {
    // Alicia solo existe en el entorno con Supabase; si no está, se omite.
    const tieneAlicia =
      (await page.locator("button").filter({ hasText: /Alicia/ }).count()) > 0;
    test.skip(!tieneAlicia, "No hay perfil Alicia en este entorno");

    let sentBody: { keyword?: string; isAlicia?: boolean } | null = null;
    await page.route(SUGGESTIONS_API, async (route) => {
      sentBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ suggestions: MOCK_ALICIA }),
      });
    });

    await selectProfile(page, /Alicia/);
    await openNewTaskDialog(page);

    await titleInput(page).fill(ALMUERZO);

    // El encabezado indica que las sugerencias son para Alicia (perfil bebé).
    await expect(page.getByText(/Sugerencias para Alicia/)).toBeVisible();
    for (const s of MOCK_ALICIA) {
      await expect(page.getByRole("button", { name: s })).toBeVisible();
    }

    // La API recibe isAlicia=true para ajustar el prompt a un bebé.
    expect(sentBody).not.toBeNull();
    expect(sentBody!.keyword).toBe(ALMUERZO);
    expect(sentBody!.isAlicia).toBe(true);

    await page.getByRole("button", { name: MOCK_ALICIA[0] }).click();
    await expect(titleInput(page)).toHaveValue(MOCK_ALICIA[0]);
  });

  test("una palabra sin comida no dispara sugerencias", async ({ page }) => {
    let llamadas = 0;
    await page.route(SUGGESTIONS_API, async (route) => {
      llamadas += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ suggestions: MOCK_FAMILIA }),
      });
    });

    await selectProfile(page, ADMIN_PATTERN);
    await openNewTaskDialog(page);

    await titleInput(page).fill("Regar las plantas");

    // Se espera el tiempo del debounce (600ms) con margen para confirmar que
    // no se hizo ninguna llamada ni se mostraron sugerencias.
    await page.waitForTimeout(1200);
    expect(llamadas).toBe(0);
    await expect(page.getByText("Sugerencias:", { exact: false })).not.toBeVisible();
  });

  test("la API real de OpenRouter devuelve sugerencias para 'almuerzo' (tolerante)", async ({
    page,
  }) => {
    // El modelo gratuito de OpenRouter puede ser lento; ampliamos el timeout.
    test.setTimeout(90_000);

    await selectProfile(page, ADMIN_PATTERN);
    await openNewTaskDialog(page);

    // Espera la respuesta real de la API (sin interceptar). Si tarda demasiado,
    // resuelve a null para hacer skip en lugar de fallar.
    const respPromise = page
      .waitForResponse(
        (r) => r.url().includes("/api/food-suggestions") && r.request().method() === "POST",
        { timeout: 75_000 }
      )
      .then((r) => r.json() as Promise<{ suggestions?: string[] }>)
      .catch(() => null);

    await titleInput(page).fill(ALMUERZO);
    const body = await respPromise;

    test.skip(
      !body || !body.suggestions?.length,
      "OpenRouter (modelo free) no devolvió sugerencias a tiempo; integración cubierta por tests unitarios."
    );

    // Si llegaron sugerencias reales, deben renderizarse como chips en la UI.
    const primera = body!.suggestions![0];
    await expect(page.getByRole("button", { name: primera })).toBeVisible();
  });
});
