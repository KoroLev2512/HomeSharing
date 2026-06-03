import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { getServiceClient } from '@/shared/utils/supabase/service'
import { sendPasswordResetEmail } from '@/shared/lib/mailer'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
        }

        const supabase = getServiceClient()

        const { data: user } = await supabase
            .from('User')
            .select('id, email')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle()

        // Always respond with success to avoid user enumeration
        if (!user) {
            return NextResponse.json({ success: true })
        }

        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = await bcrypt.hash(rawToken, 10)
        const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()

        await supabase.from('VerificationToken').delete().eq('identifier', email)

        const { error: insertError } = await supabase.from('VerificationToken').insert({
            identifier: email,
            token: tokenHash,
            expires,
        })

        if (insertError) {
            console.error('[FORGOT_PASSWORD] Insert token error:', insertError)
            return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
        }

        const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
        const resetLink = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`

        await sendPasswordResetEmail(email, resetLink)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('[FORGOT_PASSWORD]', err)
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
    }
}
