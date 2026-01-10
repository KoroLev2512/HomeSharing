import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcrypt'

export async function POST(req: Request) {
    try {
        // Check environment variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('[SIGNUP_ERROR] Missing Supabase environment variables')
            return NextResponse.json({ error: 'Ошибка конфигурации сервера' }, { status: 500 })
        }

        const { mail: email, password, password_repeat, name } = await req.json()

        if (!email || !password || !password_repeat) {
            return NextResponse.json({ error: 'Email и пароль обязательны для заполнения' }, { status: 400 })
        }

        if (password !== password_repeat) {
            return NextResponse.json({ error: 'Пароли не совпадают' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Пароль должен содержать минимум 6 символов' }, { status: 400 })
        }

        // Use service role key for server-side operations to bypass RLS
        // This is safe because this is a server-side API route
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })
        
        if (!supabase) {
            console.error('[SIGNUP_ERROR] Failed to create Supabase client')
            return NextResponse.json({ error: 'Ошибка конфигурации сервера' }, { status: 500 })
        }

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('User')
            .select('id, email')
            .eq('email', email)
            .maybeSingle()

        // If there's an error that's not "not found", return error
        if (checkError && checkError.code !== 'PGRST116') {
            console.error('[SIGNUP_ERROR] Check user error:', checkError)
            return NextResponse.json({ error: 'Не удалось проверить существование пользователя' }, { status: 500 })
        }

        if (existingUser) {
            return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user in Supabase
        const { data: user, error: insertError } = await supabase
            .from('User')
            .insert({
                email,
                password: hashedPassword,
                name: name || null,
                isAdmin: false,
                isUser: true,
                isService: false,
            })
            .select()
            .single()

        if (insertError) {
            console.error('[SIGNUP_ERROR] Insert error:', insertError)
            // Check for duplicate email error
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 })
            }
            return NextResponse.json({ 
                error: 'Не удалось создать пользователя',
                details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
            }, { status: 500 })
        }

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } }, { status: 201 })
    } catch (error) {
        console.error('[SIGNUP_ERROR]', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ 
            error: 'Внутренняя ошибка сервера',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, { status: 500 })
    }
}
