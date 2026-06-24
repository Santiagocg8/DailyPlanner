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

/** Convierte un Date a string compatible con <input type="datetime-local">. */
function toLocalInput(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
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
  const [when, setWhen] = useState(toLocalInput(defaultDate));
  const [duration, setDuration] = useState(30);
  const [personId, setPersonId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<TaskStatus>("pending");

  // Rellenar el formulario al abrir.
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setWhen(toLocalInput(new Date(task.scheduled_at)));
      setDuration(task.duration_min);
      setPersonId(task.person_id ?? "");
      setCategoryId(task.category_id ?? "");
      setStatus(task.status);
    } else {
      setTitle("");
      setNotes("");
      setWhen(toLocalInput(defaultDate));
      setDuration(30);
      setPersonId(defaultPersonId ?? "");
      setCategoryId("");
      setStatus("pending");
    }
  }, [open, task, defaultDate, defaultPersonId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const input: TaskInput = {
      title: title.trim(),
      notes: notes.trim() || null,
      scheduled_at: new Date(when).toISOString(),
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Fecha y hora</label>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Duración (min)</label>
            <input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputClass}
            />
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
