import "@testing-library/jest-dom";

// Node.js 26 tiene localStorage experimental que queda undefined sin --localstorage-file.
// Proveemos una implementación en memoria para que todos los tests que usen
// localStorage funcionen sin depender del entorno del runner.
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
};

Object.defineProperty(globalThis, "localStorage", {
  value: createLocalStorageMock(),
  writable: true,
});
