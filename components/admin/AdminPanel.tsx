"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Shield, ShieldCheck, Baby, Apple, Users, Tag, ShoppingBasket } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Category, Person } from "@/lib/types";
import { cn, readableTextColor } from "@/lib/utils";
import { usePantry } from "@/lib/usePantry";

type AdminTab = "personas" | "grupos" | "despensa";

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
  onChangeProfile: () => void;
  onUpdatePerson: (id: string, patch: Partial<Omit<Person, "id">>) => void;
  onCreatePerson: (input: Omit<Person, "id">) => void;
  onDeletePerson: (id: string) => void;
  onUpdateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  onCreateCategory: (input: Omit<Category, "id">) => void;
  onDeleteCategory: (id: string) => void;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]";

function PantrySection() {
  const { items, loading, addItem, updateItem, removeItem } = usePantry();
  const [name, setName] = useState("");
  const [isBabySafe, setIsBabySafe] = useState(false);
  const [isFruit, setIsFruit] = useState(false);

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    addItem(trimmed, isBabySafe, isFruit);
    setName("");
    setIsBabySafe(false);
    setIsFruit(false);
  }

  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs text-[var(--muted)]">
        Ingredientes disponibles en casa. Marca <Baby className="inline h-3 w-3" /> si es apto para Alicia y <Apple className="inline h-3 w-3" /> si es una fruta.
      </p>

      <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: "calc(60vh - 180px)" }}>
        {loading && (
          <p className="text-xs text-[var(--muted)] italic">Cargando…</p>
        )}
        {!loading && items.length === 0 && (
          <p className="text-xs text-[var(--muted)] italic">Sin ingredientes aún.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-black/3 dark:hover:bg-white/5">
            <span className="flex-1 text-sm truncate">{item.name}</span>
            <button
              type="button"
              title="Apto para Alicia (bebé)"
              onClick={() => updateItem(item.id, { is_baby_safe: !item.is_baby_safe })}
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                item.is_baby_safe
                  ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
              )}
            >
              <Baby className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Es una fruta (compotas)"
              onClick={() => updateItem(item.id, { is_fruit: !item.is_fruit })}
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                item.is_fruit
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                  : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10"
              )}
            >
              <Apple className="h-3.5 w-3.5" />
            </button>
            <DeleteButton onDelete={() => removeItem(item.id)} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-[var(--border)]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Agregar ingrediente…"
          className={inputClass}
        />
        <button
          type="button"
          title="Apto para Alicia"
          onClick={() => setIsBabySafe((v) => !v)}
          className={cn(
            "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors",
            isBabySafe
              ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30"
              : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10 border border-[var(--border)]"
          )}
        >
          <Baby className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Es fruta"
          onClick={() => setIsFruit((v) => !v)}
          className={cn(
            "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors",
            isFruit
              ? "bg-green-100 text-green-600 dark:bg-green-900/30"
              : "text-[var(--muted)] hover:bg-black/5 dark:hover:bg-white/10 border border-[var(--border)]"
          )}
        >
          <Apple className="h-3.5 w-3.5" />
        </button>
        <Button type="button" size="icon" variant="outline" onClick={add} aria-label="Agregar">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "personas", label: "Personas", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "grupos", label: "Grupos", icon: <Tag className="h-3.5 w-3.5" /> },
  { id: "despensa", label: "Despensa", icon: <ShoppingBasket className="h-3.5 w-3.5" /> },
];

export function AdminPanel({
  open,
  onClose,
  people,
  categories,
  currentPersonId,
  onChangeProfile,
  onUpdatePerson,
  onCreatePerson,
  onDeletePerson,
  onUpdateCategory,
  onCreateCategory,
  onDeleteCategory,
}: AdminPanelProps) {
  const currentPerson = people.find((p) => p.id === currentPersonId) ?? null;
  const [tab, setTab] = useState<AdminTab>("personas");

  return (
    <Modal open={open} onClose={onClose} title="Administración">
      <div className="flex flex-col gap-4">

        {/* Perfil activo */}
        {currentPerson && (
          <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--border)]/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: currentPerson.color, color: readableTextColor(currentPerson.color) }}
              >
                {currentPerson.avatar_emoji ?? currentPerson.name[0]}
              </span>
              <div>
                <p className="text-sm font-medium leading-tight">{currentPerson.name}</p>
                <p className="text-xs text-[var(--muted)]">Perfil activo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { onClose(); onChangeProfile(); }}
              className="text-xs text-[var(--primary)] hover:underline font-medium"
            >
              Cambiar
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl bg-[var(--border)]/30 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                tab === t.id
                  ? "bg-[var(--surface)] shadow-sm text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[240px]">
          {tab === "personas" && (
            <section className="space-y-2">
              {people.map((p) => (
                <PersonRow
                  key={p.id}
                  person={p}
                  isMe={p.id === currentPersonId}
                  onUpdate={(patch) => onUpdatePerson(p.id, patch)}
                  onDelete={() => onDeletePerson(p.id)}
                />
              ))}
              <AddRow
                placeholder="Nueva persona…"
                showColor
                onAdd={(name, color) =>
                  onCreatePerson({ name, color, avatar_emoji: "🙂", is_admin: false })
                }
              />
            </section>
          )}

          {tab === "grupos" && (
            <section className="space-y-2">
              {categories.map((c) => (
                <CategoryRow
                  key={c.id}
                  category={c}
                  onUpdate={(patch) => onUpdateCategory(c.id, patch)}
                  onDelete={() => onDeleteCategory(c.id)}
                />
              ))}
              <AddRow
                placeholder="Nuevo grupo…"
                onAdd={(name) => onCreateCategory({ name, color: "#8b5cf6" })}
              />
            </section>
          )}

          {tab === "despensa" && <PantrySection />}
        </div>
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
