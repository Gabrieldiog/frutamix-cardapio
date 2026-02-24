import { createBrowserClient } from '@supabase/ssr';

const dbSchema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'public';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { db: { schema: dbSchema } } as unknown as Parameters<typeof createBrowserClient>[2]
    );
}
