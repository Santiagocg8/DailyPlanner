"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Shield, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Category, Person } from "@/lib/types";
import { cn, readableTextColor } from "@/lib/utils";

const PALETTE = [
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#f59e0b", "#84cc16", "#22c55e", "#10b981",
  "#06b6d4", "#3b82f6", "#6d5efc", "#8b5cf6",
  "#a855f7", "#14b8a6", "#64748b", "#0ea5e9",
];

const FAMILY_EMOJIS = [
  "👶", "🧒", "👦", "👧", "🧑", "👨", "👩", "👱",
  "🧔", "👴", "👵", "🧓", "👨‍🦰", "👩‍🦰", "👨‍🦱", "👩‍🦱",
  "👨‍🦳", "👩‍🦳", "👨‍🦲", "👩‍🦲", "🧹", "👨‍🍳", "👩‍🍳", "🐶",
];

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  people: Person[];
  categories: Category[];
  currentPersonId: string | null;
  onUpdatePerson: (id: string, patch: Partial<Omit<Person, "id">>) => void;
  onCreatePerson: (input: Omit<Person, "id">) => void;
  onDeletePerson: (id: string) => void;
  onUpdateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  onCreateCategory: (input: Omit<Category, "id">) => void;
  onDeleteCategory: (id: string) => void;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]";

export function AdminPanel({
  open,
  onClose,
  people,
  categories,
  currentPersonId,
  onUpdatePerson,
  onCreatePerson,
  onDeletePerson,
  onUpdateCategory,
  onCreateCategory,
  onDeleteCategory,
}: AdminPanelProps) {
  return (
    <Modal open={open} onClose={onClose} title="Administración">
      <div className="space-y-6">
        {/* --- Personas --- */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-[var(--muted)] uppercase tracking-wide">
            Personas
          </h3>
          <div className="space-y-2">
            {people.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                isMe={p.id === currentPersonId}
                onUpdate={(patch) => onUpdatePerson(p.id, patch)}
                onDelete={() => onDeletePerson(p.id)}
              />
            ))}
          </div>
          <AddRow
            placeholder="Nueva persona…"
            showColor
            onAdd={(name, color) =>
              onCreatePerson({ name, color, avatar_emoji: "🙂", is_admin: false })
            }
          />
        </section>

        {/* --- Grupos --- */}
        <section>
          <h3 className="text-sm font-semibold mb-2 text-[var(--muted)] uppercase tracking-wide">
            Grupos de tareas
          </h3>
          <div className="space-y-2">
            {categories.map((c) => (
              <CategoryRow
                key={c.id}
                category={c}
                onUpdate={(patch) => onUpdateCategory(c.id, patch)}
                onDelete={() => onDeleteCategory(c.id)}
              />
            ))}
          </div>
          <AddRow
            placeholder="Nuevo grupo…"
            onAdd={(name) => onCreateCategory({ name, color: "#8b5cf6" })}
          />
        </section>
      </div>

      <div className="flex justify-end pt-5">
        <Button onClick={onClose}>Listo</Button>
      </div>
    </Modal>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 w-9 rounded-full border-2 border-white shadow ring-1 ring-[var(--border)]"
        style={{ background: value }}
        aria-label="Cambiar color"
      />
      {open && (
        <div className="absolute z-20 mt-1 left-0 grid grid-cols-4 gap-2 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { onChange(c); setOpen(false); }}
              className={cn(
                "h-8 w-8 rounded-full transition-transform hover:scale-110",
                c === value && "ring-2 ring-offset-2 ring-[var(--foreground)]"
              )}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 w-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center text-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Cambiar emoji"
      >
        {value || "🙂"}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 left-0 grid grid-cols-6 gap-1 p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl w-52">
          {FAMILY_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => { onChange(e); setOpen(false); }}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center text-lg transition-colors hover:bg-black/8 dark:hover:bg-white/10",
                e === value && "bg-[var(--primary)]/15 ring-1 ring-[var(--primary)]"
              )}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonRow({
  person,
  isMe,
  onUpdate,
  onDelete,
}: {
  person: Person;
  isMe: boolean;
  onUpdate: (patch: Partial<Omit<Person, "id">>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(person.name);

  useEffect(() => { setName(person.name); }, [person.name]);

  return (
    <div className="flex items-center gap-2">
      <ColorPicker value={person.color} onChange={(color) => onUpdate({ color })} />
      <EmojiPicker
        value={person.avatar_emoji ?? ""}
        onChange={(e) => onUpdate({ avatar_emoji: e })}
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onUpdate({ name })}
        className={inputClass}
        aria-label="Nombre"
      />
      <button
        type="button"
        onClick={() => onUpdate({ is_admin: !person.is_admin })}
        title={person.is_admin ? "Es administrador (quitar)" : "Hacer administrador"}
        className={cn(
          "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors",
          person.is_admin
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--muted)]"
        )}
      >
        {person.is_admin ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
      </button>
      <DeleteButton onDelete={onDelete} disabled={isMe} disabledHint="No puedes eliminar tu propio perfil" />
    </div>
  );
}

function CategoryRow({
  category,
  onUpdate,
  onDelete,
}: {
  category: Category;
  onUpdate: (patch: Partial<Omit<Category, "id">>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);

  useEffect(() => { setName(category.name); }, [category.name]);

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onUpdate({ name })}
        className={inputClass}
        aria-label="Nombre del grupo"
      />
      <DeleteButton onDelete={onDelete} />
    </div>
  );
}

function DeleteButton({
  onDelete,
  disabled = false,
  disabledHint,
}: {
  onDelete: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={disabled}
      title={disabled ? disabledHint : "Eliminar"}
      className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/** Fila para agregar un nuevo elemento (persona o grupo). */
function AddRow({
  placeholder,
  showColor = false,
  onAdd,
}: {
  placeholder: string;
  showColor?: boolean;
  onAdd: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[Math.floor(PALETTE.length / 2)]);

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, color);
    setName("");
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      {showColor && <ColorPicker value={color} onChange={setColor} />}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && add()}
        placeholder={placeholder}
        className={inputClass}
      />
      <Button type="button" size="icon" variant="outline" onClick={add} aria-label="Agregar">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
