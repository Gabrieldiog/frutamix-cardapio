import { createClient, SupabaseClient } from '@supabase/supabase-js';

const dbSchema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'public';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { db: { schema: dbSchema as string } } as Record<string, unknown>
        ) as SupabaseClient;
    }
    return _supabaseAdmin;
}

// Backward compatible export - lazy initialization via Proxy
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
