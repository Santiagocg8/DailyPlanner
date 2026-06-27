"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Clock, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import type { Category, Person, Task } from "@/lib/types";
import { cn, readableTextColor } from "@/lib/utils";
import { format, parseISO } from "@/lib/time";

interface TaskPreviewSheetProps {
  open: boolean;
  task: Task | null;
  color: string;
  person?: Person;
  category?: Category;
  onClose: () => void;
  onToggleDone: () => void;
  onPostpone: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_LABELS: Record<Task["status"], string> = {
  pending: "Pendiente",
  done: "Completada",
  postponed: "Postergada",
};

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function TaskPreviewSheet({
  open,
  task,
  color,
  person,
  category,
  onClose,
  onToggleDone,
  onPostpone,
  onEdit,
  onDelete,
}: TaskPreviewSheetProps) {
  const taskRef = useRef(task);
  const colorRef = useRef(color);
  const personRef = useRef(person);
  const categoryRef = useRef(category);

  if (task) {
    taskRef.current = task;
    colorRef.current = color;
    personRef.current = person;
    categoryRef.current = category;
  }

  const t = taskRef.current;
  const c = colorRef.current;
  const p = personRef.current;
  const cat = categoryRef.current;

  return (
    <AnimatePresence>
      {open && t && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[var(--surface)] shadow-2xl border border-[var(--border)] max-h-[85vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
          >
            {/* Franja de color */}
            <div className="h-1.5 rounded-t-3xl" style={{ background: c }} />

            {/* Indicador de arrastre */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
            </div>

            <div className="px-5 pt-3 pb-8 space-y-4">
              {/* Título + botón cerrar */}
              <div className="flex items-start justify-between gap-3">
                <h2
                  className={cn(
                    "text-xl font-bold leading-snug flex-1",
                    t.status === "done" && "line-through opacity-60"
                  )}
                >
                  {t.title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="mt-0.5 shrink-0 h-7 w-7 rounded-full flex items-center justify-center bg-[var(--border)] hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Badge de estado */}
              <span
                className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: c, color: readableTextColor(c) }}
              >
                {STATUS_LABELS[t.status]}
              </span>

              {/* Metadatos */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[var(--muted)]">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>
                    {format(parseISO(t.scheduled_at), "HH:mm")}
                    {" · "}
                    {formatDuration(t.duration_min)}
                  </span>
                </div>
                {p && (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0"
                      style={{ background: p.color }}
                    >
                      {p.avatar_emoji ?? p.name[0]}
                    </span>
                    <span>{p.name}</span>
                  </div>
                )}
                {cat && (
                  <div className="flex items-center gap-2 text-[var(--muted)]">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                )}
              </div>

              {/* Notas completas */}
              {t.notes && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--border)]/20 px-4 py-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{t.notes}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <SheetAction
                  onClick={() => {
                    onToggleDone();
                    onClose();
                  }}
                  style={{ background: c, color: readableTextColor(c) }}
                >
                  <Check className="h-4 w-4" />
                  {t.status === "done" ? "Marcar pendiente" : "Completar"}
                </SheetAction>
                <SheetAction
                  onClick={() => {
                    onPostpone();
                    onClose();
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Postergar 30 min
                </SheetAction>
                <SheetAction
                  onClick={() => {
                    onClose();
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </SheetAction>
                <SheetAction
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  danger
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </SheetAction>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SheetAction({
  children,
  onClick,
  style,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  style?: React.CSSProperties;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={cn(
        "flex items-center justify-center gap-2 h-12 rounded-2xl text-sm font-medium transition-colors active:scale-95",
        !style && !danger &&
          "border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5",
        danger &&
          "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
      )}
    >
      {children}
    </button>
  );
}
