<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md

Guía para agentes de código (Claude Code, Cursor, Copilot, etc.) que trabajan en este proyecto.
Mantener este archivo corto: se carga en cada petición. El detalle vive en `/docs` (ver Referencias).

## Stack

SPA en **React 18 + TypeScript + Vite**, con **Supabase** como backend (PostgreSQL, Auth, Storage, RLS).
Estilos con Tailwind CSS. Tests con Vitest + Testing Library; E2E con Playwright.

## Comandos

```bash
npm run dev            # servidor de desarrollo
npm run build          # build de producción
npm test               # corre todos los tests una vez
npm run test:coverage  # tests + reporte de cobertura
npm run lint           # ESLint + chequeo de tipos
npm run format         # aplica Prettier
```

## Límites (boundaries)

Siempre:
- Correr `npm run lint` y `npm test` antes de dar una tarea por terminada.
- Pasar el acceso a datos por la capa de servicios (`/src/services`), nunca importar Supabase desde un componente.
- Agregar o actualizar tests para el código que cambies, aunque no se pida.

Pregunta antes de:
- Agregar dependencias nuevas.
- Crear archivos o carpetas de nivel superior en `/src`.
- Cambiar el esquema de la base de datos o las políticas RLS.

Nunca:
- Commitear secretos ni el archivo `.env`.
- Poner la `service_role key` de Supabase en código del cliente.
- Editar a mano `src/types/database.types.ts` (se genera desde Supabase).
- Confiar en filtrado del frontend como mecanismo de seguridad: la autorización vive en RLS.

## Git

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Un commit = un cambio lógico. Los PRs requieren lint y tests en verde.

## Referencias (leer cuando la tarea lo requiera)

- Convenciones de código y nombres → ./docs/CONVENTIONS.md
- Estrategia y ejemplos de pruebas → ./docs/TESTING.md
- Arquitectura, capas y reglas de Supabase/RLS → ./docs/ARCHITECTURE.md
