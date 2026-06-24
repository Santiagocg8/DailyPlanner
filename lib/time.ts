import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addMonths,
  addMinutes,
  isSameDay,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import type { Task, ViewMode } from "./types";

/** Hora de inicio y fin que muestra el timeline del día. */
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 23;
/** Altura en píxeles de cada hora en el timeline. */
export const HOUR_HEIGHT = 72;

export { isSameDay, format, parseISO, addDays, addMonths, addMinutes };
export const locale = es;

/** Rango [desde, hasta] (ISO) a consultar según la vista y la fecha de ancla. */
export function rangeFor(view: ViewMode, anchor: Date): { from: string; to: string } {
  if (view === "day") {
    return { from: startOfDay(anchor).toISOString(), to: endOfDay(anchor).toISOString() };
  }
  if (view === "week") {
    return {
      from: startOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
      to: endOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
    };
  }
  return {
    from: startOfMonth(anchor).toISOString(),
    to: endOfMonth(anchor).toISOString(),
  };
}

/** Días de la semana (lunes a domingo) que contiene la fecha. */
export function weekDays(anchor: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(anchor, { weekStartsOn: 1 }),
    end: endOfWeek(anchor, { weekStartsOn: 1 }),
  });
}

/** Celdas del mes para la grilla (incluye días de relleno para completar semanas). */
export function monthGridDays(anchor: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 }),
  });
}

/** Posición vertical (px) de una hora dentro del timeline. */
export function offsetForDate(date: Date): number {
  const minutes = (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
  return (minutes / 60) * HOUR_HEIGHT;
}

/** ¿La hora actual cae dentro de la duración de la tarea? (tarea "activa"). */
export function isTaskActive(task: Task, now: Date): boolean {
  const start = parseISO(task.scheduled_at);
  if (!isSameDay(start, now)) return false;
  const end = addMinutes(start, task.duration_min);
  return now >= start && now < end;
}

/** Etiqueta del encabezado según la vista. */
export function headerLabel(view: ViewMode, anchor: Date): string {
  if (view === "day") return format(anchor, "EEEE d 'de' MMMM", { locale: es });
  if (view === "week") {
    const days = weekDays(anchor);
    const a = days[0];
    const b = days[6];
    return `${format(a, "d MMM", { locale: es })} – ${format(b, "d MMM yyyy", { locale: es })}`;
  }
  return format(anchor, "MMMM yyyy", { locale: es });
}

/** Lista de horas que dibuja el timeline. */
export function timelineHours(): number[] {
  const hours: number[] = [];
  for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h++) hours.push(h);
  return hours;
}
