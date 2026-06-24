import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase. Es `null` cuando no hay variables de entorno configuradas,
 * en cuyo caso la app cae a un almacenamiento local (localStorage) para poder
 * probarse sin base de datos. En producción (Vercel) se definen las 2 vars y
 * se activa la sincronización en tiempo real entre dispositivos.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseEnabled = supabase !== null;
