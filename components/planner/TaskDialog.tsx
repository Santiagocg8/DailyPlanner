"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DrumPicker } from "@/components/ui/DrumPicker";
import type { Category, PantryItem, Person, Task, TaskInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ALICIA_PROFILE } from "@/lib/pantry";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  /** Tarea a editar; si es null, se crea una nueva. */
  task: Task | null;
  /** Fecha/hora por defecto al crear. */
  defaultDate: Date;
  /** Persona preseleccionada (quién soy). */
  defaultPersonId: string | null;
  people: Person[];
  categories: Category[];
  pantryItems: PantryItem[];
  onSave: (input: TaskInput, id?: string) => void;
  onDelete?: (id: string) => void;
}

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelClass = "block text-xs font-medium text-[var(--muted)] mb-1";

/** Convierte un Date a string para <input type="date"> (yyyy-MM-dd). */
function toDateInput(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Redondea los minutos de un Date al múltiplo de 5 más cercano. */
function snapToFive(d: Date): { hour: number; minute: number } {
  let minute = Math.round(d.getMinutes() / 5) * 5;
  let hour = d.getHours();
  if (minute === 60) {
    minute = 0;
    hour = (hour + 1) % 24;
  }
  return { hour, minute };
}

/** Formatea una duración en minutos como "1 h 30 min". */
function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

const FOOD_KEYWORDS = [
  "desayuno",
  "almuerzo",
  "cena",
  "comida",
  "merienda",
  "media mañana",
  "media tarde",
  "algo",
  "brunch",
  "postre",
  "aperitivo",
  "snack",
];

function detectFoodKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  return FOOD_KEYWORDS.find((k) => lower.includes(k)) ?? null;
}

const WEEKDAYS = [
  { label: "Lun", day: 1 },
  { label: "Mar", day: 2 },
  { label: "Mié", day: 3 },
  { label: "Jue", day: 4 },
  { label: "Vie", day: 5 },
  { label: "Sáb", day: 6 },
  { label: "Dom", day: 0 },
];

function generateRecurDates(from: string, until: string, days: number[]): Date[] {
  const [fy, fmo, fda] = from.split("-").map(Number);
  const [uy, umo, uda] = until.split("-").map(Number);
  const dates: Date[] = [];
  const cur = new Date(fy, fmo - 1, fda);
  const end = new Date(uy, umo - 1, uda);
  while (cur <= end) {
    if (days.includes(cur.getDay())) dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: String(h).padStart(2, "0"),
}));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5).map((m) => ({
  value: m,
  label: String(m).padStart(2, "0"),
}));
const DURATION_OPTIONS = Array.from({ length: 16 }, (_, i) => (i + 1) * 15).map((d) => ({
  value: d,
  label: formatDuration(d),
}));

export function TaskDialog({
  open,
  onClose,
  task,
  defaultDate,
  defaultPersonId,
  people,
  categories,
  pantryItems,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [date, setDate] = useState(toDateInput(defaultDate));
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(30);
  const [personId, setPersonId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [recurring, setRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState<number[]>([]);
  const [recurUntil, setRecurUntil] = useState("");

  // Sugerencias de alimentos: se disparan cuando el título contiene una palabra clave.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const keyword = detectFoodKeyword(title);
    if (!keyword) {
      setSuggestions([]);
      return;
    }
    const selectedPerson = people.find((p) => p.id === personId);
    const isAlicia =
      selectedPerson?.name.toLowerCase() === ALICIA_PROFILE.nameMatch;

    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const ingredients = pantryItems
          .filter((i) => !isAlicia || i.is_baby_safe)
          .map((i) => i.name);
        const fruits = pantryItems
          .filter((i) => i.is_fruit && (!isAlicia || i.is_baby_safe))
          .map((i) => i.name);
        const res = await fetch("/api/food-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword,
            isAlicia,
            ingredients: ingredients.length > 0 ? ingredients : undefined,
            fruits: fruits.length > 0 ? fruits : undefined,
          }),
        });
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, personId, people, pantryItems]);

  // Rellenar el formulario al abrir.
  useEffect(() => {
    if (!open) return;
    setSuggestions([]);
    if (task) {
      const d = new Date(task.scheduled_at);
      const snapped = snapToFive(d);
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setDate(toDateInput(d));
      setHour(snapped.hour);
      setMinute(snapped.minute);
      setDuration(task.duration_min);
      setPersonId(task.person_id ?? "");
      setCategoryId(task.category_id ?? "");
      setRecurring(false);
      setRecurDays([]);
      setRecurUntil("");
    } else {
      const snapped = snapToFive(defaultDate);
      setTitle("");
      setNotes("");
      setDate(toDateInput(defaultDate));
      setHour(snapped.hour);
      setMinute(snapped.minute);
      setDuration(30);
      setPersonId(defaultPersonId ?? "");
      setCategoryId("");
      setRecurring(false);
      setRecurDays([]);
      setRecurUntil("");
    }
  }, [open, task, defaultDate, defaultPersonId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const base = {
      title: title.trim(),
      notes: notes.trim() || null,
      duration_min: Number(duration) || 30,
      person_id: personId || null,
      category_id: categoryId || null,
    };

    if (!task && recurring && recurDays.length > 0 && recurUntil) {
      for (const d of generateRecurDates(date, recurUntil, recurDays)) {
        d.setHours(hour, minute, 0, 0);
        onSave({ ...base, scheduled_at: d.toISOString(), status: "pending" });
      }
    } else {
      const [y, mo, da] = date.split("-").map(Number);
      const scheduled = new Date(y, mo - 1, da, hour, minute, 0, 0);
      onSave({ ...base, scheduled_at: scheduled.toISOString(), status: task?.status ?? "pending" }, task?.id);
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? "Editar tarea" : "Nueva tarea"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Persona</label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Sin asignar —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.avatar_emoji} {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Grupo</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Sin grupo —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>¿Qué hay que hacer?</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Regar las plantas"
            className={inputClass}
          />
          {suggestionsLoading && (
            <p className="mt-1.5 text-xs text-[var(--muted)]">Buscando sugerencias…</p>
          )}
          {!suggestionsLoading && suggestions.length > 0 && (
            <div className="mt-1.5">
              <p className="text-xs text-[var(--muted)] mb-1">
                {people.find((p) => p.id === personId)?.name.toLowerCase() === ALICIA_PROFILE.nameMatch
                  ? `Sugerencias para Alicia (${ALICIA_PROFILE.ageMonths} meses):`
                  : "Sugerencias:"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTitle(s)}
                    className="px-2.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-xs text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex justify-around mb-2">
            <span className="text-xs font-medium text-[var(--muted)] w-32 text-center">Hora</span>
            <span className="text-xs font-medium text-[var(--muted)] w-20 text-center">Duración</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <DrumPicker options={HOUR_OPTIONS} value={hour} onChange={setHour} width={60} />
            <span className="text-lg font-semibold text-[var(--muted)] pb-px select-none">:</span>
            <DrumPicker options={MINUTE_OPTIONS} value={minute} onChange={setMinute} width={56} />
            <div className="w-px self-stretch bg-[var(--border)] mx-3" />
            <DrumPicker options={DURATION_OPTIONS} value={duration} onChange={setDuration} width={80} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Detalles…"
          />
        </div>

        {!task && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => {
                  setRecurring(e.target.checked);
                  if (e.target.checked && !recurUntil) {
                    const d = new Date(date);
                    d.setDate(d.getDate() + 28);
                    setRecurUntil(toDateInput(d));
                  }
                }}
                className="h-4 w-4 rounded accent-[var(--primary)]"
              />
              <span className="text-sm font-medium">Repetir en otros días</span>
            </label>

            {recurring && (
              <div className="space-y-3">
                <div className="flex gap-1.5">
                  {WEEKDAYS.map(({ label, day }) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() =>
                        setRecurDays((prev) =>
                          prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                        )
                      }
                      className={cn(
                        "flex-1 h-8 rounded-lg text-xs font-semibold transition-colors",
                        recurDays.includes(day)
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div>
                  <label className={labelClass}>Hasta</label>
                  <input
                    type="date"
                    value={recurUntil}
                    min={date}
                    onChange={(e) => setRecurUntil(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          {task && onDelete ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
            >
              Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{task ? "Guardar" : "Agregar"}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
