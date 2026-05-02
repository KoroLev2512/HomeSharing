/**
 * Создаёт нового пользователя-администратора или повышает существующего.
 *
 * Использование:
 *   node --env-file=.env.local scripts/make-admin.mjs <email> [password]
 *
 * Если пользователь с таким email уже есть — устанавливает ему isAdmin=true.
 * Если нет — создаёт нового с указанным паролем (по умолчанию "admin123").
 */

import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const email    = process.argv[2];
const password = process.argv[3] ?? 'admin123';

if (!email) {
    console.error('Usage: node --env-file=.env.local scripts/make-admin.mjs <email> [password]');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// bcrypt is ESM-incompatible in some envs; we use a dynamic import fallback.
async function hashPassword(plain) {
    try {
        const { default: bcrypt } = await import('bcrypt');
        return bcrypt.hash(plain, 10);
    } catch {
        // Fallback: SHA-256 hex (not secure, only for local dev/testing)
        console.warn('⚠  bcrypt not available — using SHA-256 fallback (dev only)');
        return createHash('sha256').update(plain).digest('hex');
    }
}

async function run() {
    // Check if user already exists
    const { data: existing, error: findErr } = await supabase
        .from('User')
        .select('id, email, isAdmin, name')
        .eq('email', email)
        .maybeSingle();

    if (findErr) {
        console.error('DB error:', findErr.message);
        process.exit(1);
    }

    if (existing) {
        const { error: updErr } = await supabase
            .from('User')
            .update({ isAdmin: true })
            .eq('id', existing.id);

        if (updErr) {
            console.error('Failed to update user:', updErr.message);
            process.exit(1);
        }

        console.log(`✅ Пользователь ${existing.email} (${existing.name ?? 'без имени'}) повышен до администратора.`);
        console.log(`   isAdmin = true`);
        return;
    }

    // Create new user
    const hashed = await hashPassword(password);
    const id     = randomBytes(12).toString('hex'); // cuid2 alternative

    const { error: insertErr } = await supabase.from('User').insert({
        id,
        email,
        password: hashed,
        name: 'Администратор',
        isAdmin: true,
        isUser: true,
        isService: false,
    });

    if (insertErr) {
        console.error('Failed to create user:', insertErr.message);
        process.exit(1);
    }

    console.log(`✅ Новый администратор создан:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   isAdmin:  true`);
    console.log();
    console.log('   Войдите на /login с этими данными.');
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
