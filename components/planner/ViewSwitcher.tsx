"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { headerLabel } from "@/lib/time";

interface ViewSwitcherProps {
  view: ViewMode;
  anchor: Date;
  onViewChange: (v: ViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

const views: { key: ViewMode; label: string }[] = [
  { key: "day", label: "Día" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
];

export function ViewSwitcher({
  view,
  anchor,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: ViewSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={onPrev} aria-label="Anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNext} aria-label="Siguiente">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Hoy
        </Button>
        <span className="ml-2 font-semibold capitalize">{headerLabel(view, anchor)}</span>
      </div>

      <div className="inline-flex rounded-full bg-black/5 dark:bg-white/10 p-1">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onViewChange(v.key)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
              view === v.key
                ? "bg-[var(--surface)] shadow text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
