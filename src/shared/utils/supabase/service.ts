import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const fallbackKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
