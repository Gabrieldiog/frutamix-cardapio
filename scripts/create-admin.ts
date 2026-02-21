// Script para criar o primeiro usuário admin
// Rodar com: npx tsx scripts/create-admin.ts <email> <senha>
// Requer as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY exportadas no terminal

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Exporte NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de rodar');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('Uso: npx tsx scripts/create-admin.ts <email> <senha>');
        process.exit(1);
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (error) {
        if (error.message.includes('already been registered')) {
            console.log('Usuário admin já existe!');
        } else {
            console.error('Erro ao criar admin:', error.message);
        }
        return;
    }

    console.log('Admin criado com sucesso!');
    console.log('Email:', data.user.email);
    console.log('ID:', data.user.id);
}

createAdmin();
