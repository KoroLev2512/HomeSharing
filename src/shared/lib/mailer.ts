import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
})

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    await transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'noreply@homesharing.ru',
        to,
        subject: 'Сброс пароля — HomeSharing',
        html: `
            <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem 1.5rem; color: #111;">
                <h1 style="font-size: 1.5rem; font-weight: 600; margin: 0 0 1rem;">Сброс пароля</h1>
                <p style="margin: 0 0 1.5rem; color: #545454; line-height: 1.5;">
                    Мы получили запрос на сброс пароля для вашего аккаунта HomeSharing.<br>
                    Ссылка действительна 1 час.
                </p>
                <a href="${resetLink}"
                   style="display: inline-block; padding: 0.75rem 1.5rem; background: #000; color: #fff;
                          text-decoration: none; border-radius: 0.625rem; font-size: 1rem; font-weight: 500;">
                    Сбросить пароль
                </a>
                <p style="margin: 1.5rem 0 0; font-size: 0.875rem; color: #757575;">
                    Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.
                </p>
            </div>
        `,
    })
}
