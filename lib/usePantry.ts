"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { supabase, isSupabaseEnabled } from "./supabase";
import type { PantryItem } from "./types";

const LS_KEY = "pantry_items";

function loadLocal(): PantryItem[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveLocal(items: PantryItem[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export function usePantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  // useId da un identificador estable y único por instancia, sin la impureza
  // de Math.random() durante el render.
  const channelId = `pantry-changes-${useId()}`;

  useEffect(() => {
    let cancelled = false;

    async function loadFromSupabase() {
      if (!supabase) return;
      const { data } = await supabase
        .from("pantry_items")
        .select("*")
        .order("name");
      if (cancelled) return;
      setItems((data as PantryItem[]) ?? []);
      setLoading(false);
    }

    if (isSupabaseEnabled && supabase) {
      const client = supabase;
      loadFromSupabase();
      const channel = client
        .channel(channelId)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "pantry_items" },
          loadFromSupabase
        )
        .subscribe();
      return () => {
        cancelled = true;
        client.removeChannel(channel);
      };
    } else {
      // Carga inicial desde localStorage y suscripción a cambios en otras
      // pestañas: lectura legítima de un sistema externo en el montaje.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(loadLocal());
      setLoading(false);
      const onStorage = () => setItems(loadLocal());
      window.addEventListener("storage", onStorage);
      return () => {
        cancelled = true;
        window.removeEventListener("storage", onStorage);
      };
    }
  }, [channelId]);

  const addItem = useCallback(
    async (name: string, isBabySafe: boolean, isFruit: boolean) => {
      if (supabase) {
        await supabase
          .from("pantry_items")
          .insert({ name: name.trim(), is_baby_safe: isBabySafe, is_fruit: isFruit });
        return;
      }
      const next = [
        ...loadLocal(),
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          is_baby_safe: isBabySafe,
          is_fruit: isFruit,
          created_at: new Date().toISOString(),
        },
      ];
      saveLocal(next);
      setItems(next);
    },
    []
  );

  const updateItem = useCallback(
    async (
      id: string,
      patch: Partial<Pick<PantryItem, "name" | "is_baby_safe" | "is_fruit">>
    ) => {
      if (supabase) {
        await supabase.from("pantry_items").update(patch).eq("id", id);
        return;
      }
      const next = loadLocal().map((i) => (i.id === id ? { ...i, ...patch } : i));
      saveLocal(next);
      setItems(next);
    },
    []
  );

  const removeItem = useCallback(async (id: string) => {
    if (supabase) {
      await supabase.from("pantry_items").delete().eq("id", id);
      return;
    }
    const next = loadLocal().filter((i) => i.id !== id);
    saveLocal(next);
    setItems(next);
  }, []);

  return { items, loading, addItem, updateItem, removeItem };
}
