import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/shared/configs/publicEnv";

export const createClient = () =>
  createBrowserClient(
    publicEnv.supabaseUrl,
    publicEnv.supabaseAnonKey,
  );
