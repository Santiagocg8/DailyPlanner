# 🗓️ Planner Familiar

Planificador diario compartido para toda la familia (papás, hijos, empleados).
Tareas con hora, vistas por **día / semana / mes**, colores por **persona** o
**grupo**, auto-scroll a la hora actual y sincronización en vivo entre
dispositivos.

## Características

- **Acceso sin login**: cada quien elige su perfil (estilo "Netflix").
- **Vista Día** con línea de "ahora" y auto-scroll a la hora actual; resalta la
  tarea activa.
- **Vistas Semana y Mes** con navegación de fechas.
- **CRUD de tareas**: crear, editar, eliminar; marcar completada/pendiente y
  **postergar** (+30 min).
- **Colores** por persona o por grupo (toggle en la barra superior).
- **Tiempo real** entre celular, iPad y PC (con Supabase).
- **PWA**: instalable en la pantalla de inicio del celular/iPad.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Motion ·
date-fns · lucide-react · Supabase.

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:3000
```

Sin configurar Supabase, la app funciona en **modo local** (los datos se
guardan en `localStorage` de cada dispositivo, sin sincronización). Trae datos
de ejemplo (4 personas, 3 grupos) para empezar de inmediato.

## Sincronización entre dispositivos (Supabase)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el script [`supabase/schema.sql`](supabase/schema.sql)
   (crea las tablas `people`, `categories`, `tasks`, activa Realtime y carga
   datos iniciales).
3. Copia `.env.local.example` a `.env.local` y rellena con los valores de
   **Settings → API**:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. Reinicia `npm run dev`. Ahora todos los dispositivos ven el mismo planner en
   vivo.

## Despliegue en Vercel (gratis)

1. Sube el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **New Project** → importa el repo.
3. En **Environment Variables**, agrega `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Deploy**. Comparte la URL con la familia.

## Personalizar personas y grupos

- **Modo local**: edita los datos de ejemplo en
  [`lib/localStore.ts`](lib/localStore.ts) (`defaultData`).
- **Con Supabase**: edita las filas de `people` y `categories` desde el
  **Table Editor** del panel.

## Estructura

```
app/                  # rutas, layout, manifest PWA
components/planner/    # DayView, WeekView, MonthView, TaskCard, TaskDialog, ViewSwitcher, Planner
components/people/     # PersonPicker
components/ui/         # Button, Modal
lib/                   # supabase, usePlanner (datos+realtime), time, types, utils
supabase/schema.sql    # esquema de base de datos
```
