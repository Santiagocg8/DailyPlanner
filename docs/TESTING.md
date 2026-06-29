# TESTING.md

Guía de pruebas del proyecto. Claude debe seguir estas reglas al escribir, modificar o revisar tests.

## Reglas que SIEMPRE aplican

- Toda lógica nueva (funciones, hooks, servicios) requiere tests.
- No marcar una tarea como terminada sin que los tests pasen: `npm test`.
- No bajar la cobertura existente. Mínimo global: **80%**.
- No usar `console.log` en tests. Si necesitas depurar, quítalo antes de terminar.
- Un test que falla y se "arregla" comentándolo o con `.skip` NO cuenta como arreglado.

## Stack de testing

- **Runner:** Vitest
- **Librería de componentes:** @testing-library/react
- **E2E:** Playwright
- **Mocks de red:** MSW (Mock Service Worker)

> Ajusta esta sección a tus herramientas reales (Jest, Cypress, etc.).

## Estructura de carpetas

```
/tests
  /unit          → funciones puras, utils, hooks aislados
  /integration   → varios módulos juntos (ej. servicio + API mockeada)
  /e2e           → flujos completos de usuario (Playwright)
```

Los tests unitarios de un componente pueden vivir junto al componente:
`Button.tsx` → `Button.test.tsx`.

## Convenciones de nombres

- Archivos: `nombre.test.ts` o `nombre.test.tsx`
- Describe el sujeto bajo prueba: `describe('formatCurrency', ...)`
- Los `it`/`test` describen comportamiento esperado, en presente:
  - ✅ `it('returns 0 when the cart is empty')`
  - ❌ `it('test cart')`

## Patrón AAA (Arrange, Act, Assert)

Estructura cada test en tres bloques claros:

```ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/utils/formatCurrency';

describe('formatCurrency', () => {
  it('formats a number as COP currency', () => {
    // Arrange
    const amount = 1500;

    // Act
    const result = formatCurrency(amount, 'COP');

    // Assert
    expect(result).toBe('$ 1.500');
  });

  it('returns "$ 0" when the amount is zero', () => {
    expect(formatCurrency(0, 'COP')).toBe('$ 0');
  });
});
```

## Ejemplo: test de componente

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Guardar</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });
});
```

## Qué probar (y qué no)

Probar:
- Casos felices (entrada válida → salida esperada).
- Casos límite: vacío, cero, negativos, listas con un solo elemento, valores nulos.
- Manejo de errores: qué pasa cuando algo falla.
- Comportamiento visible al usuario (lo que ve y hace), no detalles internos.

No probar:
- Detalles de implementación (nombres de variables internas, estado privado).
- Librerías de terceros (asume que ya están probadas).
- Estilos exactos de CSS salvo que sean críticos para la funcionalidad.

## Mocks y datos de prueba

- Mockea llamadas de red con MSW, no con stubs manuales dispersos.
- Centraliza datos de prueba reutilizables en `/tests/fixtures`.
- Cada test debe ser independiente: nada de depender del orden de ejecución.
- Limpia el estado entre tests (`beforeEach` / `afterEach`).

## Comandos

```bash
npm test              # corre todos los tests una vez
npm run test:watch    # modo watch durante desarrollo
npm run test:coverage # reporte de cobertura
npm run test:e2e      # tests end-to-end con Playwright
```

## Definición de "terminado" para una feature

Una tarea no está completa hasta que:

1. Tiene tests unitarios para la lógica nueva.
2. Todos los tests pasan (`npm test`).
3. La cobertura no bajó respecto a la rama base.
4. El lint pasa sin errores (`npm run lint`).