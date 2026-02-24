import { createClient, SupabaseClient } from '@supabase/supabase-js';

const dbSchema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'public';

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!_supabase) {
        _supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { db: { schema: dbSchema as string } } as Record<string, unknown>
        ) as SupabaseClient;
    }
    return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
    },
});
