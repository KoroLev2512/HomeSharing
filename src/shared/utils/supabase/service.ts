import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv } from '@/shared/configs/publicEnv';
import { serverEnv } from '@/shared/configs/serverEnv';

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client with the service role key.
 * Bypasses RLS — never import in client code.
 *
 * Falls back to the anon key if `SUPABASE_SERVICE_ROLE_KEY` is missing
 * (useful in preview deploys), but logs a warning because most server
 * routes assume RLS is bypassed.
 */
export const getServiceClient = (): SupabaseClient => {
    if (cached) return cached;

    const url = publicEnv.supabaseUrl;
    const serviceKey = serverEnv.supabaseServiceRoleKey;
    const fallbackKey = publicEnv.supabaseAnonKey;
    const key = serviceKey ?? fallbackKey;

    if (!url || !key) {
        throw new Error('Supabase env vars are not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
    }

    if (!serviceKey) {
        console.warn('[supabase/service] SUPABASE_SERVICE_ROLE_KEY missing — falling back to anon key. Server routes that rely on RLS bypass will misbehave.');
    }

    cached = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    return cached;
};
