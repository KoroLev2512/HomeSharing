import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { getServiceClient } from '@/shared/utils/supabase/service'

export async function POST(req: Request) {
    try {
        const { token, email, password, passwordRepeat } = await req.json()

        if (!token || !email || !password || !passwordRepeat) {
            return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
        }

        if (password !== passwordRepeat) {
            return NextResponse.json({ error: 'Пароли не совпадают' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Пароль должен содержать минимум 6 символов' }, { status: 400 })
        }

        const supabase = getServiceClient()

        const { data: record } = await supabase
            .from('VerificationToken')
            .select('token, expires')
            .eq('identifier', email)
            .maybeSingle()

        if (!record) {
            return NextResponse.json({ error: 'Ссылка недействительна или истекла' }, { status: 400 })
        }

        if (new Date(record.expires) < new Date()) {
            await supabase.from('VerificationToken').delete().eq('identifier', email)
            return NextResponse.json({ error: 'Ссылка истекла. Запросите новую.' }, { status: 400 })
        }

        const valid = await bcrypt.compare(token, record.token)
        if (!valid) {
            return NextResponse.json({ error: 'Ссылка недействительна или истекла' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const { error: updateError } = await supabase
            .from('User')
            .update({ password: hashedPassword })
            .eq('email', email)

        if (updateError) {
            console.error('[RESET_PASSWORD] Update error:', updateError)
            return NextResponse.json({ error: 'Не удалось обновить пароль' }, { status: 500 })
        }

        await supabase.from('VerificationToken').delete().eq('identifier', email)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[RESET_PASSWORD]', err)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}
