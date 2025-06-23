import nodemailer from 'nodemailer'

export async function sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify?token=${token}`
    const transporter = nodemailer.createTransport({
        host: 'smtp.yourdomain.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })

    await transporter.sendMail({
        to: email,
        from: '"LockBox CRM" <no-reply@yourdomain.com>',
        subject: 'Подтверждение email',
        html: `Нажмите <a href="${url}">сюда</a>, чтобы подтвердить email.`
    })
}
