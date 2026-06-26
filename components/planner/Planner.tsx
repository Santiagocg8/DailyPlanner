"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Wifi, WifiOff, Settings } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { usePlanner } from "@/lib/usePlanner";
import { useCurrentPerson } from "@/lib/useCurrentPerson";
import type { ColorMode, Task, TaskInput, ViewMode } from "@/lib/types";
import { addDays, addMinutes, addMonths, parseISO } from "@/lib/time";
import { ViewSwitcher } from "./ViewSwitcher";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { TaskDialog } from "./TaskDialog";
import { TaskPreviewSheet } from "./TaskPreviewSheet";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { PersonPicker } from "@/components/people/PersonPicker";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export function Planner() {
  const planner = usePlanner();
  const { people, categories, tasks, loading, isRealtime } = planner;
  const me = useCurrentPerson();

  const [view, setView] = useState<ViewMode>("day");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [now, setNow] = useState<Date>(() => new Date());
  const colorMode: ColorMode = "person";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Reloj que actualiza "ahora" cada minuto (mueve la línea y la tarea activa).
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const currentPerson = useMemo(
    () => people.find((p) => p.id === me.personId) ?? null,
    [people, me.personId]
  );

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const catsById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  function colorFor(task: Task): string {
    if (colorMode === "person") return peopleById.get(task.person_id ?? "")?.color ?? "#94a3b8";
    return catsById.get(task.category_id ?? "")?.color ?? "#94a3b8";
  }

  function navigate(dir: number) {
    if (view === "month") setAnchor((a) => addMonths(a, dir));
    else if (view === "week") setAnchor((a) => addDays(a, dir * 7));
    else setAnchor((a) => addDays(a, dir));
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(t: Task) {
    setEditing(t);
    setDialogOpen(true);
  }

  function handleSave(input: TaskInput, id?: string) {
    if (id) planner.updateTask(id, input);
    else planner.createTask(input);
  }

  function toggleDone(t: Task) {
    planner.updateTask(t.id, { status: t.status === "done" ? "pending" : "done" });
  }

  function postpone(t: Task) {
    const next = addMinutes(parseISO(t.scheduled_at), 30);
    planner.updateTask(t.id, { scheduled_at: next.toISOString(), status: "postponed" });
  }

  function requestDelete(id: string) {
    setConfirmDeleteId(id);
  }

  function confirmDelete() {
    if (confirmDeleteId) {
      planner.deleteTask(confirmDeleteId);
      if (previewTask?.id === confirmDeleteId) setPreviewTask(null);
      if (editing?.id === confirmDeleteId) setDialogOpen(false);
    }
    setConfirmDeleteId(null);
  }

  // Esperar a saber si hay perfil elegido.
  if (!me.ready || loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
        Cargando…
      </div>
    );
  }

  // Pantalla de selección de perfil.
  if (!me.personId && people.length > 0) {
    return <PersonPicker people={people} onChoose={me.choose} />;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Encabezado */}
      <header className="px-3 sm:px-6 pt-4 pb-3 space-y-3 border-b border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗓️</span>
            <h1 className="text-lg font-bold">Planner Familiar</h1>
            <span
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[var(--muted)] ml-2"
              title={isRealtime ? "Sincronizado entre dispositivos" : "Modo local (este dispositivo)"}
            >
              {isRealtime ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isRealtime ? "En vivo" : "Local"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentPerson?.is_admin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdminOpen(true)}
                title="Administrar personas y grupos"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            {currentPerson && (
              <button
                onClick={me.clear}
                className="flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 border border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Cambiar de perfil"
              >
                <span
                  className="h-7 w-7 rounded-full flex items-center justify-center text-sm"
                  style={{ background: currentPerson.color }}
                >
                  {currentPerson.avatar_emoji ?? currentPerson.name[0]}
                </span>
                <span className="text-sm font-medium">{currentPerson.name}</span>
              </button>
            )}
          </div>
        </div>

        <ViewSwitcher
          view={view}
          anchor={anchor}
          onViewChange={setView}
          onPrev={() => navigate(-1)}
          onNext={() => navigate(1)}
          onToday={() => setAnchor(new Date())}
        />
      </header>

      {/* Cuerpo */}
      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {view === "day" && (
              <DayView
                day={anchor}
                now={now}
                tasks={tasks}
                people={people}
                categories={categories}
                colorMode={colorMode}
                onToggleDone={toggleDone}
                onPostpone={postpone}
                onEdit={openEdit}
                onDelete={(t) => requestDelete(t.id)}
                onPreview={(t) => setPreviewTask(t)}
              />
            )}
            {view === "week" && (
              <WeekView
                anchor={anchor}
                now={now}
                tasks={tasks}
                people={people}
                categories={categories}
                colorMode={colorMode}
                onSelectDay={(d) => {
                  setAnchor(d);
                  setView("day");
                }}
                onEdit={openEdit}
              />
            )}
            {view === "month" && (
              <MonthView
                anchor={anchor}
                now={now}
                tasks={tasks}
                people={people}
                categories={categories}
                colorMode={colorMode}
                onSelectDay={(d) => {
                  setAnchor(d);
                  setView("day");
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Botón flotante para agregar */}
      <Button
        onClick={openCreate}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 shadow-lg z-30",
          "sm:bottom-8 sm:right-8"
        )}
        size="icon"
        aria-label="Agregar tarea"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </Button>

      <TaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={editing}
        defaultDate={anchor}
        defaultPersonId={me.personId}
        people={people}
        categories={categories}
        onSave={handleSave}
        onDelete={(id) => requestDelete(id)}
      />

      {currentPerson?.is_admin && (
        <AdminPanel
          open={adminOpen}
          onClose={() => setAdminOpen(false)}
          people={people}
          categories={categories}
          currentPersonId={me.personId}
          onChangeProfile={me.clear}
          onUpdatePerson={planner.updatePerson}
          onCreatePerson={planner.createPerson}
          onDeletePerson={planner.deletePerson}
          onUpdateCategory={planner.updateCategory}
          onCreateCategory={planner.createCategory}
          onDeleteCategory={planner.deleteCategory}
        />
      )}

      <TaskPreviewSheet
        open={previewTask !== null}
        task={previewTask}
        color={previewTask ? colorFor(previewTask) : "#94a3b8"}
        person={previewTask ? peopleById.get(previewTask.person_id ?? "") : undefined}
        category={previewTask ? catsById.get(previewTask.category_id ?? "") : undefined}
        onClose={() => setPreviewTask(null)}
        onToggleDone={() => previewTask && toggleDone(previewTask)}
        onPostpone={() => previewTask && postpone(previewTask)}
        onEdit={() => { if (previewTask) { setPreviewTask(null); openEdit(previewTask); } }}
        onDelete={() => { if (previewTask) { requestDelete(previewTask.id); setPreviewTask(null); } }}
      />

      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Eliminar tarea"
      >
        <p className="text-sm text-[var(--muted)] mb-6">
          ¿Estás seguro que deseas eliminar esta tarea? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
