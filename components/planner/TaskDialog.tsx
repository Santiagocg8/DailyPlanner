"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Category, Person, Task, TaskInput, TaskStatus } from "@/lib/types";

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
  onSave: (input: TaskInput, id?: string) => void;
  onDelete?: (id: string) => void;
}

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelClass = "block text-xs font-medium text-[var(--muted)] mb-1";

/** Minutos seleccionables para la hora (cada 15 min). */
const MINUTE_OPTIONS = [0, 15, 30, 45];
/** Duraciones seleccionables (de 15 en 15, hasta 4 horas). */
const DURATION_OPTIONS = Array.from({ length: 16 }, (_, i) => (i + 1) * 15);

/** Convierte un Date a string para <input type="date"> (yyyy-MM-dd). */
function toDateInput(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Redondea los minutos de un Date al múltiplo de 15 más cercano. */
function snapToQuarter(d: Date): { hour: number; minute: number } {
  let minute = Math.round(d.getMinutes() / 15) * 15;
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

export function TaskDialog({
  open,
  onClose,
  task,
  defaultDate,
  defaultPersonId,
  people,
  categories,
  onSave,
  onDelete,
}: TaskDialogProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(toDateInput(defaultDate));
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [duration, setDuration] = useState(30);
  const [personId, setPersonId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>("pending");

  // Rellenar el formulario al abrir.
  useEffect(() => {
    if (!open) return;
    if (task) {
      const d = new Date(task.scheduled_at);
      const snapped = snapToQuarter(d);
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setDate(toDateInput(d));
      setHour(snapped.hour);
      setMinute(snapped.minute);
      setDuration(task.duration_min);
      setPersonId(task.person_id ?? "");
      setCategoryId(task.category_id ?? "");
      setStatus(task.status);
    } else {
      const snapped = snapToQuarter(defaultDate);
      setTitle("");
      setNotes("");
      setDate(toDateInput(defaultDate));
      setHour(snapped.hour);
      setMinute(snapped.minute);
      setDuration(30);
      setPersonId(defaultPersonId ?? "");
      setCategoryId("");
      setStatus("pending");
    }
  }, [open, task, defaultDate, defaultPersonId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    // Combina la fecha (yyyy-MM-dd) con la hora y minutos elegidos.
    const [y, mo, da] = date.split("-").map(Number);
    const scheduled = new Date(y, mo - 1, da, hour, minute, 0, 0);
    const input: TaskInput = {
      title: title.trim(),
      notes: notes.trim() || null,
      scheduled_at: scheduled.toISOString(),
      duration_min: Number(duration) || 30,
      person_id: personId || null,
      category_id: categoryId || null,
      status,
    };
    onSave(input, task?.id);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? "Editar tarea" : "Nueva tarea"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>¿Qué hay que hacer?</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Regar las plantas"
            className={inputClass}
          />
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

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Hora</label>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className={inputClass}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Minutos</label>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className={inputClass}
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Duración</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputClass}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {formatDuration(d)}
                </option>
              ))}
            </select>
          </div>
        </div>

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
          <label className={labelClass}>Notas (opcional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Detalles…"
          />
        </div>

        {task && (
          <div>
            <label className={labelClass}>Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className={inputClass}
            >
              <option value="pending">Pendiente</option>
              <option value="done">Completada</option>
              <option value="postponed">Postergada</option>
            </select>
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
