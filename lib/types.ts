export type TaskStatus = "pending" | "done" | "postponed";

export interface Person {
  id: string;
  name: string;
  color: string; // hex, ej. "#6d5efc"
  avatar_emoji: string | null;
  is_admin: boolean; // los admin pueden editar personas y grupos
}

export interface Category {
  id: string;
  name: string;
  color: string; // hex
}

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  scheduled_at: string; // ISO timestamp
  duration_min: number;
  person_id: string | null;
  category_id: string | null;
  status: TaskStatus;
  created_at: string;
}

/** Datos para crear/editar una tarea (sin campos generados). */
export type TaskInput = Omit<Task, "id" | "created_at">;

export type ColorMode = "person" | "category";
export type ViewMode = "day" | "week" | "month";
