"use client";

import { useRef } from "react";
import { Check, Clock, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { Category, Person, Task } from "@/lib/types";
import { cn, readableTextColor } from "@/lib/utils";
import { format, parseISO } from "@/lib/time";

interface TaskCardProps {
  task: Task;
  color: string;
  person?: Person;
  category?: Category;
  active?: boolean;
  compact?: boolean;
  onToggleDone: () => void;
  onPostpone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreview?: () => void;
}

export function TaskCard({
  task,
  color,
  person,
  category,
  active = false,
  compact = false,
  onToggleDone,
  onPostpone,
  onEdit,
  onDelete,
  onPreview,
}: TaskCardProps) {
  const done = task.status === "done";
  const text = readableTextColor(color);
  const start = parseISO(task.scheduled_at);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  function startLongPress() {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      onPreview?.();
    }, 400);
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function handleCardClick() {
    if (!didLongPress.current) onPreview?.();
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative h-full rounded-2xl px-3 py-2 shadow-sm border overflow-hidden transition-all cursor-pointer select-none",
        active && "ring-2 ring-offset-2 ring-offset-[var(--background)]",
        done && "opacity-60"
      )}
      style={{
        background: color,
        color: text,
        borderColor: "rgba(0,0,0,0.06)",
        boxShadow: active ? `0 0 0 0 ${color}` : undefined,
      }}
      onClick={handleCardClick}
      onTouchStart={startLongPress}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      onMouseDown={startLongPress}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
    >
      {/* Acciones — esquina superior derecha */}
      <div
        className="absolute top-1 right-1 flex items-center gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!compact && (
          <IconAction label="Postergar" onClick={onPostpone} text={text}>
            <RotateCcw className="h-3 w-3" />
          </IconAction>
        )}
        <IconAction label="Editar" onClick={onEdit} text={text}>
          <Pencil className="h-3 w-3" />
        </IconAction>
        <IconAction label="Eliminar" onClick={onDelete} text={text}>
          <Trash2 className="h-3 w-3" />
        </IconAction>
      </div>

      <div className="flex items-start gap-2 pr-16">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label={done ? "Marcar como pendiente" : "Marcar como completada"}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{ borderColor: text }}
        >
          {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={cn("font-semibold leading-tight truncate", done && "line-through")}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 text-xs opacity-90 mt-0.5">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(start, "HH:mm")}
            </span>
            {!compact && person && <span className="truncate">{person.avatar_emoji} {person.name}</span>}
            {!compact && category && <span className="truncate">· {category.name}</span>}
          </div>
          {!compact && task.notes && (
            <p className="text-xs opacity-80 mt-1 line-clamp-2">{task.notes}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function IconAction({
  children,
  label,
  onClick,
  text,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  text: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-black/20 transition-colors"
      style={{ color: text }}
    >
      {children}
    </button>
  );
}
