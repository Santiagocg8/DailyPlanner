"use client";

import { useMemo } from "react";
import type { Category, ColorMode, Person, Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO, monthGridDays, locale } from "@/lib/time";
import { isSameMonth } from "date-fns";

interface MonthViewProps {
  anchor: Date;
  now: Date;
  tasks: Task[];
  people: Person[];
  categories: Category[];
  colorMode: ColorMode;
  onSelectDay: (d: Date) => void;
}

const weekdayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MonthView({
  anchor,
  now,
  tasks,
  people,
  categories,
  colorMode,
  onSelectDay,
}: MonthViewProps) {
  const days = monthGridDays(anchor);
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const catsById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  function colorFor(task: Task): string {
    if (colorMode === "person") return peopleById.get(task.person_id ?? "")?.color ?? "#94a3b8";
    return catsById.get(task.category_id ?? "")?.color ?? "#94a3b8";
  }

  return (
    <div className="h-full overflow-auto p-1">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayLabels.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-[var(--muted)] py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayTasks = tasks
            .filter((t) => isSameDay(parseISO(t.scheduled_at), day))
            .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
          const inMonth = isSameMonth(day, anchor);
          const isToday = isSameDay(day, now);
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              className={cn(
                "flex flex-col items-stretch rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 min-h-[84px] text-left hover:ring-2 hover:ring-[var(--ring)] transition-all",
                !inMonth && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold self-end h-6 w-6 flex items-center justify-center rounded-full",
                  isToday && "bg-[var(--primary)] text-[var(--primary-foreground)]"
                )}
              >
                {format(day, "d", { locale })}
              </span>
              <div className="flex-1 space-y-1 mt-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-1 text-[10px] truncate"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: colorFor(task) }}
                    />
                    <span className={cn("truncate", task.status === "done" && "line-through opacity-60")}>
                      {task.title}
                    </span>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-[var(--muted)]">+{dayTasks.length - 3} más</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
