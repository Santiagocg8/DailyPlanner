import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renderiza el texto de sus hijos", () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("variante primary se aplica por defecto", () => {
    render(<Button>OK</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-[var(--primary)]");
  });

  it("variante danger aplica clases rojas", () => {
    render(<Button variant="danger">Eliminar</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-red-500");
  });

  it("variante ghost no tiene fondo sólido", () => {
    render(<Button variant="ghost">Cancelar</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).not.toContain("bg-[var(--primary)]");
    expect(btn.className).not.toContain("bg-red-500");
  });

  it("variante outline tiene borde", () => {
    render(<Button variant="outline">Editar</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("border");
  });

  it("size sm aplica clases correctas", () => {
    render(<Button size="sm">Pequeño</Button>);
    expect(screen.getByRole("button").className).toContain("h-8");
  });

  it("size icon aplica dimensiones cuadradas", () => {
    render(<Button size="icon">X</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("h-9");
    expect(btn.className).toContain("w-9");
  });

  it("llama onClick al hacer clic", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clic</Button>);

    await userEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("no llama onClick cuando está disabled", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Bloqueado</Button>);

    await userEvent.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("acepta className adicional", () => {
    render(<Button className="mi-clase-extra">Test</Button>);
    expect(screen.getByRole("button").className).toContain("mi-clase-extra");
  });

  it("acepta ref a través de forwardRef", () => {
    const ref = { current: null } as React.RefObject<HTMLButtonElement | null>;
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("displayName es 'Button'", () => {
    expect(Button.displayName).toBe("Button");
  });
});
