"use client";

import { motion } from "motion/react";
import type { Person } from "@/lib/types";
import { readableTextColor } from "@/lib/utils";

interface PersonPickerProps {
  people: Person[];
  onChoose: (id: string) => void;
}

/** Pantalla de bienvenida estilo "perfiles": ¿quién eres? */
export function PersonPicker({ people, onChoose }: PersonPickerProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl sm:text-3xl font-bold mb-2 text-center"
      >
        ¿Quién eres?
      </motion.h1>
      <p className="text-[var(--muted)] mb-8 text-center">
        Elige tu perfil para empezar a usar el planner familiar.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-lg">
        {people.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            onClick={() => onChoose(p.id)}
            className="flex flex-col items-center gap-2 rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <span
              className="h-16 w-16 rounded-full flex items-center justify-center text-3xl shadow-inner"
              style={{ background: p.color, color: readableTextColor(p.color) }}
            >
              {p.avatar_emoji ?? p.name[0]}
            </span>
            <span className="font-medium text-sm">{p.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
