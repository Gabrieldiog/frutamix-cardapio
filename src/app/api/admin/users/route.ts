import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const { data, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const users = data.users.map(u => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
        }));

        return NextResponse.json({ users });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

        const body = await request.json();
        const { email, password } = body;

        if (!email?.trim()) return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
        if (!password || password.length < 6) {
            return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password,
            email_confirm: true,
        });

        if (error) {
            if (error.message.includes('already been registered')) {
                return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            user: { id: data.user.id, email: data.user.email, created_at: data.user.created_at }
        }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
