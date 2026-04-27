'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import { Input } from '@/widgets/Input'
import { supportedOAuthProviders, type SupportedOAuthProvider } from '@/shared/configs/authProviders'
import styles from './styles.module.scss'

export default function LoginPage() {
    const { data: session, status } = useSession()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            router.replace('/')
        }
    }, [router, session, status])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })
            
            if (result?.error) {
                setError('Неверный email или пароль')
            } else if (result?.ok) {
                router.push('/')
            }
        } catch (err) {
            setError('Ошибка при входе: ' + (err instanceof Error ? err.message : ''))
        } finally {
            setIsLoading(false)
        }
    }

    const handleOAuthLogin = async (provider: SupportedOAuthProvider) => {
        setIsLoading(true)
        setError('')
        try {
            await signIn(provider, { callbackUrl: '/' })
        } catch (err) {
            setError('Ошибка при входе через ' + provider)
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.loginContainer}>
                <Link href="/listings" className={styles.backButton}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Назад</span>
                </Link>
                
                <div className={styles.header}>
                    <h1 className={styles.title}>Войдите в аккаунт</h1>
                    <p className={styles.description}>
                        Войдите в систему, чтобы получить доступ к панели управления, настройкам и объектам.
                    </p>
                </div>

                {error && (
                    <div className={styles.error}>{error}</div>
                )}

                <form onSubmit={handleLogin} className={styles.form}>
                    <Input
                        label="Почта"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                        disabled={isLoading}
                        autoComplete="username"
                        size="medium"
                        state={isLoading ? "disabled" : error && email ? "error" : "enabled"}
                        errorMessage={error && email ? "Неверный email или пароль" : undefined}
                    />

                    <Input
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                        size="medium"
                        showPasswordToggle={true}
                        state={isLoading ? "disabled" : error && password ? "error" : "enabled"}
                        errorMessage={error && password ? "Неверный email или пароль" : undefined}
                    />

                    <button 
                        className={styles.loginButton} 
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>

                    <div className={styles.divider}>
                        <span>или</span>
                    </div>

                    <div className={styles.oauthButtons}>
                        {supportedOAuthProviders.map((provider) => (
                            <button
                                key={provider.id}
                                type="button"
                                className={styles.oauthButton}
                                onClick={() => handleOAuthLogin(provider.id)}
                                disabled={isLoading}
                            >
                                <Image
                                    src={provider.iconSrc}
                                    alt={provider.iconAlt}
                                    width={24}
                                    height={24}
                                />
                                <span>Войти через {provider.label}</span>
                            </button>
                        ))}
                    </div>

                    <Link href="/forgot-password" className={styles.forgotPassword}>
                        Забыли пароль?
                    </Link>
                </form>

                <div className={styles.separator}></div>

                <div className={styles.registerLink}>
                    <p>
                        Нет аккаунта?{' '}
                        <Link href="/register" className={styles.registerLinkText}>
                            Создать
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
