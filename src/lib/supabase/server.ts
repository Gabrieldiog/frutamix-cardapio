import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const dbSchema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'public';

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            db: { schema: dbSchema },
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, { ...options, maxAge: 28800 });
                        });
                    } catch {
                        // Ignore errors in Server Components (read-only)
                    }
                },
            },
        } as unknown as Parameters<typeof createServerClient>[2]
    );
}
