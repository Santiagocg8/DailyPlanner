# CONVENTIONS.md

Convenciones de código del proyecto. Claude debe seguir estas reglas al escribir o modificar cualquier código.

## Reglas que SIEMPRE aplican

- Código en inglés (nombres de variables, funciones, archivos). Comentarios y docs en español.
- No dejar `console.log`, `debugger` ni código comentado "por si acaso".
- No introducir dependencias nuevas sin confirmar primero.
- Prefiere claridad sobre brevedad: un nombre largo y claro gana a uno corto y críptico.
- Formato y lint los maneja la herramienta (Prettier + ESLint). No pelees con el formateador.

## Nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes | PascalCase | `UserCard`, `LoginForm` |
| Funciones / variables | camelCase | `getUserData`, `isLoading` |
| Constantes globales | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Tipos / Interfaces | PascalCase | `User`, `OrderStatus` |
| Hooks | camelCase con prefijo `use` | `useAuth`, `useCart` |
| Booleanos | prefijo `is`, `has`, `should` | `isActive`, `hasAccess` |
| Archivos de componente | PascalCase | `UserCard.tsx` |
| Otros archivos | kebab-case | `format-currency.ts` |
| Carpetas | kebab-case | `user-profile/` |

## Estructura de carpetas

```
/src
  /components    → componentes reutilizables (UI sin lógica de negocio)
  /features      → módulos por dominio (auth, cart, profile...)
  /pages         → páginas / vistas / rutas
  /hooks         → custom hooks compartidos
  /utils         → funciones puras auxiliares
  /services      → llamadas a API y lógica externa
  /types         → tipos y interfaces compartidas
  /constants     → constantes globales
/tests           → ver TESTING.md
```

Regla: si algo pertenece a un solo feature, vive dentro de `/features/<nombre>`, no en la raíz de `/src`.

## Imports

Orden y agrupación (separados por línea en blanco):

```ts
// 1. Librerías externas
import { useState } from 'react';
import clsx from 'clsx';

// 2. Imports internos (alias absolutos)
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

// 3. Relativos / mismo módulo
import { formatPrice } from './utils';

// 4. Tipos
import type { User } from '@/types';
```

- Usa imports absolutos con alias (`@/`) en lugar de `../../../`.
- Importa tipos con `import type`.

## Funciones

- Una función hace una sola cosa. Si necesita un comentario para explicar "este bloque hace X", probablemente ese bloque debería ser su propia función.
- Máximo recomendado: ~40 líneas por función. Si crece más, divídela.
- Prefiere `early return` sobre anidar `if`:

```ts
// ✅ Bien
function getDiscount(user: User): number {
  if (!user.isActive) return 0;
  if (!user.isPremium) return 5;
  return 20;
}

// ❌ Evitar
function getDiscount(user: User): number {
  let discount = 0;
  if (user.isActive) {
    if (user.isPremium) {
      discount = 20;
    } else {
      discount = 5;
    }
  }
  return discount;
}
```

## Componentes (React)

- Un componente por archivo. El nombre del archivo = nombre del componente.
- Componentes funcionales con hooks. Nada de clases.
- Props tipadas con `interface` o `type`. Nada de `any`.
- Extrae lógica compleja a hooks; el componente se enfoca en renderizar.

```tsx
interface UserCardProps {
  user: User;
  onSelect?: (id: string) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  return (
    <button onClick={() => onSelect?.(user.id)}>
      {user.name}
    </button>
  );
}
```

## TypeScript

- `strict` activado. Nada de `any` salvo justificación explícita en comentario.
- Prefiere `type`/`interface` sobre estructuras implícitas.
- Tipa los retornos de funciones públicas y servicios.
- Evita `as` (casting) salvo que sea inevitable.

## Manejo de errores

- No silenciar errores con `catch` vacío.
- Errores esperados se manejan; errores inesperados se propagan o se loguean con contexto.
- Los mensajes de error son accionables: dicen qué pasó y, si aplica, qué hacer.

```ts
try {
  await saveOrder(order);
} catch (error) {
  // ❌ catch {}
  // ✅
  logger.error('Failed to save order', { orderId: order.id, error });
  throw new OrderSaveError('No se pudo guardar la orden', { cause: error });
}
```

## Comentarios

- Comenta el **por qué**, no el **qué**. El código ya dice qué hace.
- Nada de comentarios obvios (`// incrementa i`).
- Usa comentarios para decisiones no evidentes, workarounds y advertencias.

```ts
// ✅ El proveedor rechaza más de 50 items por request, por eso paginamos.
const chunks = chunk(items, 50);
```

## Git

- Commits en formato Conventional Commits: `tipo: descripción`
  - `feat:` nueva funcionalidad
  - `fix:` corrección de bug
  - `refactor:` cambio interno sin alterar comportamiento
  - `test:` agregar o corregir tests
  - `docs:` documentación
  - `chore:` tareas de mantenimiento
- Descripción en presente y minúscula: `feat: agrega login con Google`
- Un commit = un cambio lógico. No mezcles refactor con feature.
- Los PRs requieren lint + tests pasando (ver TESTING.md).

## Definición de "código terminado"

Antes de dar por terminado cualquier cambio:

1. El lint pasa sin errores (`npm run lint`).
2. El formato está aplicado (`npm run format`).
3. No quedan `console.log` ni `debugger`.
4. No hay `any` sin justificar.
5. Los tests pasan (ver TESTING.md).