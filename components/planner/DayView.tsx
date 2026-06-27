"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Category, ColorMode, Person, Task } from "@/lib/types";
import {
  addMinutes,
  DAY_START_HOUR,
  HOUR_HEIGHT,
  isSameDay,
  isTaskActive,
  offsetForDate,
  parseISO,
  timelineHours,
} from "@/lib/time";
import { TaskCard } from "./TaskCard";

interface TaskLayout {
  task: Task;
  col: number;
  totalCols: number;
}

// Duración visual mínima: 48px height / 72px per hour * 60 min = 40 min.
// El layout debe usar la misma duración efectiva que se renderiza para evitar solapamiento visual.
const MIN_VISUAL_DURATION = Math.ceil((48 / HOUR_HEIGHT) * 60);

function visualEnd(task: Task): Date {
  const start = parseISO(task.scheduled_at);
  return addMinutes(start, Math.max(task.duration_min, MIN_VISUAL_DURATION));
}

function computeLayout(tasks: Task[]): TaskLayout[] {
  if (tasks.length === 0) return [];

  const sorted = [...tasks].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const colEnds: Date[] = [];
  const assigned: { task: Task; col: number }[] = [];

  for (const task of sorted) {
    const start = parseISO(task.scheduled_at);
    const end = visualEnd(task);
    let col = colEnds.findIndex((e) => e <= start);
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(end);
    } else {
      colEnds[col] = end;
    }
    assigned.push({ task, col });
  }

  return assigned.map(({ task, col }) => {
    const start = parseISO(task.scheduled_at);
    const end = visualEnd(task);
    const concurrent = assigned.filter(({ task: o }) => {
      const os = parseISO(o.scheduled_at);
      const oe = visualEnd(o);
      return os < end && oe > start;
    });
    const totalCols = Math.max(...concurrent.map((t) => t.col)) + 1;
    return { task, col, totalCols };
  });
}

interface DayViewProps {
  day: Date;
  now: Date;
  tasks: Task[];
  people: Person[];
  categories: Category[];
  colorMode: ColorMode;
  onToggleDone: (t: Task) => void;
  onPostpone: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onPreview: (t: Task) => void;
}

export function DayView({
  day,
  now,
  tasks,
  people,
  categories,
  colorMode,
  onToggleDone,
  onPostpone,
  onEdit,
  onDelete,
  onPreview,
}: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const catsById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const dayTasks = useMemo(
    () =>
      tasks
        .filter((t) => isSameDay(parseISO(t.scheduled_at), day))
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [tasks, day]
  );

  const layouts = useMemo(() => computeLayout(dayTasks), [dayTasks]);

  const isToday = isSameDay(day, now);
  const hours = timelineHours();

  function colorFor(task: Task): string {
    if (colorMode === "person") return peopleById.get(task.person_id ?? "")?.color ?? "#94a3b8";
    return catsById.get(task.category_id ?? "")?.color ?? "#94a3b8";
  }

  // Auto-scroll a la hora actual al abrir (solo si es hoy).
  useEffect(() => {
    if (!isToday || !scrollRef.current) return;
    const target = Math.max(0, offsetForDate(now) - 120);
    scrollRef.current.scrollTo({ top: target, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, isToday]);

  const nowOffset = offsetForDate(now);

  return (
    <div ref={scrollRef} className="relative overflow-y-auto h-full px-3 sm:px-4">
      <div
        className="relative"
        style={{ height: hours.length * HOUR_HEIGHT + HOUR_HEIGHT }}
      >
        {/* Líneas y etiquetas de horas */}
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-start"
            style={{ top: i * HOUR_HEIGHT }}
          >
            <span className="w-12 shrink-0 -mt-2 text-xs text-[var(--muted)] tabular-nums">
              {String(h).padStart(2, "0")}:00
            </span>
            <div className="flex-1 border-t border-[var(--border)] h-0" />
          </div>
        ))}

        {/* Línea "ahora" */}
        {isToday && nowOffset >= 0 && (
          <div
            className="absolute left-10 right-0 z-20 flex items-center pointer-events-none"
            style={{ top: nowOffset }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow" />
            <div className="flex-1 border-t-2 border-red-500" />
          </div>
        )}

        {/* Tareas posicionadas por hora */}
        <div className="absolute left-14 right-1 top-0">
          {layouts.map(({ task, col, totalCols }) => {
            const top = offsetForDate(parseISO(task.scheduled_at));
            const height = Math.max(48, (task.duration_min / 60) * HOUR_HEIGHT - 6);
            const widthPct = 100 / totalCols;
            const leftPct = (col / totalCols) * 100;
            return (
              <div
                key={task.id}
                className="absolute"
                style={{
                  top,
                  height,
                  left: `${leftPct}%`,
                  width: `calc(${widthPct}% - ${col < totalCols - 1 ? 4 : 0}px)`,
                }}
              >
                <TaskCard
                  task={task}
                  color={colorFor(task)}
                  person={peopleById.get(task.person_id ?? "")}
                  category={catsById.get(task.category_id ?? "")}
                  active={isToday && isTaskActive(task, now)}
                  compact={totalCols > 1}
                  onToggleDone={() => onToggleDone(task)}
                  onPostpone={() => onPostpone(task)}
                  onEdit={() => onEdit(task)}
                  onDelete={() => onDelete(task)}
                  onPreview={() => onPreview(task)}
                />
              </div>
            );
          })}

          {dayTasks.length === 0 && (
            <div className="absolute left-0 right-0 top-24 text-center text-sm text-[var(--muted)]">
              No hay tareas para este día. Toca <span className="font-semibold">+</span> para agregar una.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
