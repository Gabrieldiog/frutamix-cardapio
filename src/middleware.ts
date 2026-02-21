import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, { ...options, maxAge: 28800 });
                    });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Accessing /admin (not login) without auth → redirect to login
    if (
        request.nextUrl.pathname.startsWith('/admin') &&
        !request.nextUrl.pathname.startsWith('/admin/login')
    ) {
        if (!user) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // Already logged in and on login page → redirect to admin
    if (request.nextUrl.pathname === '/admin/login' && user) {
        return NextResponse.redirect(new URL('/admin/products', request.url));
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*'],
};
