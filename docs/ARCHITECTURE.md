# Arquitectura — Planner Familiar

## Diagrama high-level

```
┌─────────────────────────────────────────────────────────┐
│                      Browser / PWA                       │
│                                                         │
│  ┌──────────┐   ┌──────────────────────────────────┐    │
│  │  Next.js │   │         React Client Tree        │    │
│  │  Server  │──▶│  Planner (raíz)                  │    │
│  │  (SSR)   │   │   ├─ usePlanner        ──┐       │    │
│  └──────────┘   │   ├─ usePantry         ──┤──▶ Supabase Realtime
│                 │   ├─ useCurrentPerson  ──┘       │    │
│                 │   ├─ DayView / WeekView / Month  │    │
│                 │   ├─ TaskDialog                  │    │
│                 │   └─ AdminPanel (solo admins)    │    │
│                 └──────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
         │ API Route                          │ REST/WS
         ▼                                    ▼
┌─────────────────┐              ┌────────────────────────┐
│  /api/food-     │──▶ OpenRouter│      Supabase          │
│  suggestions    │   (LLM)      │  tables: people,       │
└─────────────────┘              │  categories, tasks,    │
                                 │  pantry_items          │
                                 └────────────────────────┘
```

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | ^16.2.9 |
| UI | React | 19.2.4 |
| Estilos | Tailwind CSS v4 | ^4 |
| Base de datos / Realtime | Supabase | ^2.108.2 |
| LLM | OpenRouter → Gemma 4 | vía API REST |
| Animaciones | Motion (ex Framer Motion) | ^12 |
| Fechas | date-fns | ^4.4 |
| Iconos | lucide-react | ^1.21 |
| Deploy | Vercel | — |

---

## Capas de aplicación

```
app/                 ← Next.js App Router: rutas, layout, metadata
components/          ← UI: presentación y composición
lib/                 ← Lógica, hooks, tipos, utilidades
```

### 1. `app/` — Capa de enrutamiento

Responsabilidades: layout global, metadatos PWA, rutas de API.

```
app/
├── layout.tsx            # Root layout: fuentes, metadata, viewport
├── page.tsx              # Única página → monta <Planner />
├── globals.css           # Variables CSS globales (tokens de diseño)
├── manifest.ts           # Web App Manifest (PWA)
└── api/
    └── food-suggestions/
        └── route.ts      # POST — sugiere comidas vía LLM
```

- `page.tsx` es un **Server Component** que solo importa `<Planner />`.
- La app es efectivamente una **SPA** montada en `/`; no hay más rutas de página.
- No hay `use client` en `page.tsx` ni `layout.tsx` — la hidratación queda en manos de los componentes client que los necesitan.

### 2. `components/` — Capa de presentación

Responsabilidades: renderizado, interacción de usuario, composición visual.

```
components/
├── admin/
│   └── AdminPanel.tsx        # Modal con tabs: Personas · Grupos · Despensa
├── people/
│   └── PersonPicker.tsx      # Selección de perfil al arrancar
├── planner/
│   ├── Planner.tsx           # Raíz del árbol client; orquesta todo
│   ├── DayView.tsx           # Timeline por hora (vista día)
│   ├── WeekView.tsx          # Grilla 7 días
│   ├── MonthView.tsx         # Grilla mensual
│   ├── TaskCard.tsx          # Chip de tarea en el timeline
│   ├── TaskDialog.tsx        # Modal crear/editar tarea + sugerencias IA
│   ├── TaskPreviewSheet.tsx  # Bottom sheet de detalle de tarea
│   └── ViewSwitcher.tsx      # Tabs Día / Semana / Mes + navegación
└── ui/
    ├── Button.tsx            # Botón base (variantes: primary, outline, ghost, danger)
    ├── Modal.tsx             # Dialog animado reutilizable
    └── DrumPicker.tsx        # Selector scroll-snap (horas/minutos)
```

**Regla:** Los componentes en `components/` **no acceden a Supabase directamente**. Reciben datos y callbacks por props o consumen hooks de `lib/`.

### 3. `lib/` — Capa de lógica y datos

Responsabilidades: acceso a datos, estado compartido, tipos, utilidades puras.

```
lib/
├── types.ts           # Contratos de dominio (Person, Task, Category, PantryItem…)
├── supabase.ts        # Cliente Supabase singleton (null cuando no hay env vars)
├── usePlanner.ts      # Hook principal: estado de tasks/people/categories + CRUD
├── usePantry.ts       # Hook de despensa: estado de ingredientes + CRUD
├── useCurrentPerson.ts# Hook de sesión: perfil activo por dispositivo (localStorage)
├── localStore.ts      # Implementación localStorage como fallback de Supabase
├── pantry.ts          # Datos estáticos: perfiles de Alicia y familia (fallback IA)
├── time.ts            # Cálculos de fecha/hora + constantes de timeline
└── utils.ts           # cn() (Tailwind merge), readableTextColor()
```

---

## Cliente Supabase

`lib/supabase.ts` exporta **un singleton nullable**:

```ts
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseEnabled = supabase !== null;
```

### Patrón de uso en hooks

Todos los hooks siguen el mismo patrón dual:

```ts
if (isSupabaseEnabled && supabase) {
  // Camino "online": Supabase + Realtime
} else {
  // Camino "offline": localStorage
}
```

Esto permite **desarrollo sin credenciales** y **uso sin internet**, con degradación transparente.

### Canales Realtime

Cada instancia de `usePantry` genera un **nombre de canal único** para evitar colisiones cuando el hook se monta en múltiples lugares simultáneamente:

```ts
const channelId = useRef(`pantry-changes-${Math.random().toString(36).slice(2)}`);
```

`usePlanner` usa el canal fijo `"planner-changes"` porque solo se instancia una vez (en `Planner.tsx`).

**Regla:** si un hook nuevo crea un canal Realtime y puede montarse más de una vez, debe usar nombre único con `useRef`.

---

## Tablas Supabase

| Tabla | Campos clave | Notas |
|---|---|---|
| `people` | `id`, `name`, `color`, `avatar_emoji`, `is_admin` | — |
| `categories` | `id`, `name`, `color` | Grupos de tareas |
| `tasks` | `id`, `title`, `scheduled_at`, `duration_min`, `person_id`, `category_id`, `status`, `notes` | `status`: pending / done / postponed |
| `pantry_items` | `id`, `name`, `is_baby_safe`, `is_fruit` | Despensa |

---

## API Route: sugerencias de comida

`POST /api/food-suggestions`

```
Body:     { keyword: string, isAlicia: boolean, ingredients?: string[], fruits?: string[] }
Response: { suggestions: string[] }
```

- Construye un prompt con los ingredientes de la despensa (o datos estáticos de `lib/pantry.ts` como fallback).
- Llama a **OpenRouter** con el modelo `google/gemma-4-26b-a4b-it:free`.
- Es un **Server-Side Route Handler** — `OPENROUTER_API_KEY` nunca llega al cliente.
- Siempre retorna `{ suggestions: [] }` en cualquier error, nunca lanza.

---

## Gestión de identidad

No hay autenticación. La identidad es **por dispositivo**:

- `useCurrentPerson` persiste el `person_id` elegido en `localStorage` bajo la clave `daily-planner:me`.
- El acceso al `AdminPanel` se controla con `person.is_admin` (campo en `people`).
- No hay sesiones, JWT ni cookies.

**Consecuencia para nuevas features:** Si se necesita autenticación real, el punto de entrada natural es `useCurrentPerson` + Supabase Auth, sin tocar los demás hooks.

---

## Decisiones arquitectónicas

### SPA sobre múltiples rutas
Toda la app vive en `/`. Las "vistas" (día, semana, mes) son **estado React**, no rutas Next.js. Esto simplifica la navegación y evita recargas, apropiado para una PWA familiar de uso offline-first.

### Supabase nullable como capa de datos
El cliente es `null` sin variables de entorno. Cualquier hook que acceda a datos **debe manejar el caso null** y degradar a localStorage. La app es completamente funcional sin base de datos.

### Hooks como única capa de acceso a datos
Los componentes **nunca llaman a Supabase directamente**. Todo pasa por `usePlanner`, `usePantry` o `useCurrentPerson`. Esto centraliza el patrón dual online/offline y facilita cambiar el backend en el futuro.

### Sin estado global (Context / Zustand)
Los datos fluyen por props desde `Planner.tsx` hacia abajo. Es suficiente para la escala actual. Si el árbol crece en profundidad, el siguiente paso natural es un `PlannerContext` que envuelva la raíz.

### Realtime por recarga total, no por patch incremental
Los hooks recargan todos los datos en cada evento Realtime. Es simple y correcto hoy. Una optimización futura aplicaría el `payload` del evento directamente al estado local para reducir roundtrips.

---

## Variables de entorno

| Variable | Exposición | Obligatoria | Descripción |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + Servidor | No* | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + Servidor | No* | Clave anon de Supabase |
| `OPENROUTER_API_KEY` | Solo servidor | No* | Clave de OpenRouter para sugerencias IA |

\* Sin estas variables la app funciona en modo local (localStorage). Las sugerencias de comida retornan `[]` sin `OPENROUTER_API_KEY`.

- **En Vercel:** Settings → Environment Variables.
- **En local:** `.env.local` en la raíz. **No commitear.**

---

## PWA

- `app/manifest.ts` define el Web App Manifest (nombre, iconos, colores).
- `app/layout.tsx` configura `theme-color`, `apple-mobile-web-app-capable` y `viewport` (sin zoom).
- **No hay Service Worker** — las páginas no se cachean offline actualmente. Para soporte offline real se requeriría `next-pwa` u otro plugin.

---

## Estándares para nuevas features y refactors

### Dónde va cada cosa

| Qué añadir | Dónde |
|---|---|
| Nueva entidad de datos | `lib/types.ts` + tabla Supabase + `lib/use<Entidad>.ts` |
| Nueva vista del planner | `components/planner/` |
| Pantalla independiente nueva | `components/<nombre>/` + nueva carpeta en `app/` si necesita ruta |
| Componente UI reutilizable | `components/ui/` |
| Lógica de negocio / cálculos | `lib/<nombre>.ts` — archivo propio si supera ~50 líneas |
| Nueva ruta de API | `app/api/<nombre>/route.ts` |
| Constantes estáticas de dominio | `lib/<nombre>.ts` (ej: `lib/pantry.ts`) |

### Reglas que siempre aplican

1. **Ningún componente llama a Supabase directamente.** Todo pasa por un hook en `lib/`.
2. **Todo hook con Supabase maneja el caso `null`.** Sin variables de entorno la app debe seguir funcionando.
3. **Canales Realtime con nombre único** si el hook puede montarse más de una vez.
4. **Tipos antes que implementación.** Definir la forma en `lib/types.ts` primero.
5. **Estilos con tokens CSS.** Usar `var(--primary)`, `var(--surface)`, `var(--border)`, etc. No hardcodear colores salvo la paleta de marca (PALETTE en AdminPanel).
6. **`npm run lint` pasa sin errores** antes de cualquier PR.
7. **Probar en las tres vistas** (Día, Semana, Mes) si el cambio toca el planner.

### Checklist antes de hacer PR

- [ ] Tipos nuevos o modificados documentados en `lib/types.ts`
- [ ] Ningún componente accede a Supabase directamente
- [ ] Hook nuevo maneja `supabase === null`
- [ ] Canal Realtime nuevo usa nombre único con `useRef`
- [ ] Estilos usan variables CSS del tema
- [ ] `npm run lint` limpio
- [ ] Probado manualmente en las vistas afectadas
