"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import type { Category, ColorMode, Person, Task } from "@/lib/types";
import { cn, readableTextColor } from "@/lib/utils";
import { format, isSameDay, parseISO, weekDays, locale } from "@/lib/time";

interface WeekViewProps {
  anchor: Date;
  now: Date;
  tasks: Task[];
  people: Person[];
  categories: Category[];
  colorMode: ColorMode;
  onSelectDay: (d: Date) => void;
  onEdit: (t: Task) => void;
}

export function WeekView({
  anchor,
  now,
  tasks,
  people,
  categories,
  colorMode,
  onSelectDay,
  onEdit,
}: WeekViewProps) {
  const days = weekDays(anchor);
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const catsById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  function colorFor(task: Task): string {
    if (colorMode === "person") return peopleById.get(task.person_id ?? "")?.color ?? "#94a3b8";
    return catsById.get(task.category_id ?? "")?.color ?? "#94a3b8";
  }

  return (
    <div className="h-full overflow-auto">
      <div className="grid grid-cols-7 gap-2 min-w-[640px] p-1">
        {days.map((day) => {
          const dayTasks = tasks
            .filter((t) => isSameDay(parseISO(t.scheduled_at), day))
            .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
          const isToday = isSameDay(day, now);
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
            >
              <button
                onClick={() => onSelectDay(day)}
                className={cn(
                  "px-2 py-2 text-center border-b border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                  isToday && "bg-[var(--primary)] text-[var(--primary-foreground)]"
                )}
              >
                <div className="text-[10px] uppercase opacity-80">
                  {format(day, "EEE", { locale })}
                </div>
                <div className="text-lg font-semibold leading-none">{format(day, "d")}</div>
              </button>
              <div className="flex-1 p-1.5 space-y-1.5 min-h-[120px]">
                {dayTasks.map((task) => {
                  const color = colorFor(task);
                  return (
                    <motion.button
                      layout
                      key={task.id}
                      onClick={() => onEdit(task)}
                      className={cn(
                        "w-full text-left rounded-lg px-2 py-1 text-xs font-medium truncate",
                        task.status === "done" && "opacity-60 line-through"
                      )}
                      style={{ background: color, color: readableTextColor(color) }}
                    >
                      {format(parseISO(task.scheduled_at), "HH:mm")} {task.title}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
