import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import bcrypt from 'bcrypt'
import { authOptions } from '@/shared/lib/auth'
import { getServiceClient } from '@/shared/utils/supabase/service'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    try {
        const { currentPassword, newPassword, newPasswordRepeat } = await req.json()

        if (!currentPassword || !newPassword || !newPasswordRepeat) {
            return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 })
        }

        if (newPassword !== newPasswordRepeat) {
            return NextResponse.json({ error: 'Пароли не совпадают' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Пароль должен содержать минимум 6 символов' }, { status: 400 })
        }

        const supabase = getServiceClient()

        const { data: user } = await supabase
            .from('User')
            .select('password')
            .eq('email', session.user.email)
            .maybeSingle()

        if (!user?.password) {
            return NextResponse.json(
                { error: 'У этого аккаунта нет пароля — вход выполнен через внешний сервис' },
                { status: 400 }
            )
        }

        const valid = await bcrypt.compare(currentPassword, user.password)
        if (!valid) {
            return NextResponse.json({ error: 'Текущий пароль указан неверно' }, { status: 400 })
        }

        const hashed = await bcrypt.hash(newPassword, 10)

        const { error: updateError } = await supabase
            .from('User')
            .update({ password: hashed })
            .eq('email', session.user.email)

        if (updateError) {
            console.error('[CHANGE_PASSWORD] Update error:', updateError)
            return NextResponse.json({ error: 'Не удалось обновить пароль' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[CHANGE_PASSWORD]', err)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}
