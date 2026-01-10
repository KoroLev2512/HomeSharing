'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { Input } from '@/widgets/Input'
import styles from './styles.module.scss'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

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

    const handleOAuthLogin = async (provider: string) => {
        setIsLoading(true)
        setError('')
        try {
            // Map UI provider names to NextAuth provider IDs
            const providerMap: Record<string, string> = {
                'gosuslugi': 'gosuslugi',
                'google': 'google',
                'vk': 'vk',
                'apple': 'apple',
                'github': 'github'
            }
            
            const nextAuthProvider = providerMap[provider]
            if (!nextAuthProvider) {
                setError('Провайдер не настроен')
                setIsLoading(false)
                return
            }
            
            await signIn(nextAuthProvider, { callbackUrl: '/' })
        } catch (err) {
            setError('Ошибка при входе через ' + provider)
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.loginContainer}>
                <Link href="/" className={styles.backButton}>
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

                    <div className={styles.rememberMe}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={styles.checkbox}
                                disabled={isLoading}
                            />
                            <span className={styles.checkboxText}>Оставаться в системе</span>
                        </label>
                    </div>

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
                        <button
                            type="button"
                            className={styles.oauthButton}
                            onClick={() => handleOAuthLogin('gosuslugi')}
                            disabled={isLoading}
                        >
                            <Image
                                src="/icons/gosuslugi_logo.svg"
                                alt="ГосУслуги"
                                width={24}
                                height={24}
                            />
                            <span>Войти через ГосУслуги</span>
                        </button>

                        <button
                            type="button"
                            className={styles.oauthButton}
                            onClick={() => handleOAuthLogin('google')}
                            disabled={isLoading}
                        >
                            <Image
                                src="/icons/google_logo.svg"
                                alt="Google"
                                width={24}
                                height={24}
                            />
                            <span>Войти через Google</span>
                        </button>

                        <button
                            type="button"
                            className={styles.oauthButton}
                            onClick={() => handleOAuthLogin('vk')}
                            disabled={isLoading}
                        >
                            <Image
                                src="/icons/vk_logo.svg"
                                alt="VK"
                                width={24}
                                height={24}
                            />
                            <span>Войти через VK Auth</span>
                        </button>

                        <button
                            type="button"
                            className={styles.oauthButton}
                            onClick={() => handleOAuthLogin('apple')}
                            disabled={isLoading}
                        >
                            <Image
                                src="/icons/apple_logo.svg"
                                alt="Apple"
                                width={24}
                                height={24}
                            />
                            <span>Войти через Apple</span>
                        </button>

                        <button
                            type="button"
                            className={styles.oauthButton}
                            onClick={() => handleOAuthLogin('github')}
                            disabled={isLoading}
                        >
                            <Image
                                src="/icons/github_logo.svg"
                                alt="GitHub"
                                width={24}
                                height={24}
                            />
                            <span>Войти через Github</span>
                        </button>
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