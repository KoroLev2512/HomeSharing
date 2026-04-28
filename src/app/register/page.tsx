'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, useSession } from 'next-auth/react'
import Image from 'next/image'
import { Input } from '@/widgets/Input'
import styles from './styles.module.scss'
import AccountService from '@/shared/lib/accountService'
import { supportedOAuthProviders, type SupportedOAuthProvider } from '@/shared/configs/authProviders'

export default function RegisterPage() {
    const { data: session, status } = useSession()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [agreeToTerms, setAgreeToTerms] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const router = useRouter()

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            router.replace('/')
        }
    }, [router, session, status])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleOAuthRegister = async (provider: SupportedOAuthProvider) => {
        setIsLoading(true)
        setError('')
        try {
            await signIn(provider, { callbackUrl: '/' })
        } catch (err) {
            setError('Ошибка при регистрации через ' + provider)
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        if (!agreeToTerms) {
            setError('Необходимо согласиться с политикой конфиденциальности и пользовательским соглашением')
            setIsLoading(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают')
            setIsLoading(false)
            return
        }
        if (formData.password.length < 6) {
            setError('Пароль должен содержать минимум 6 символов')
            setIsLoading(false)
            return
        }
        try {
            const result = await AccountService.signup(
                formData.email,
                formData.password,
                formData.confirmPassword,
                formData.name
            )
            if (result && result.success) {
                setSuccess('Регистрация успешна! Теперь вы можете войти в систему.')
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            } else {
                setError(result?.error || 'Ошибка регистрации')
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Произошла ошибка при регистрации')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.registerContainer}>
                <Link href="/listings" className={styles.backButton}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Назад</span>
                </Link>
                
                <div className={styles.header}>
                    <h1 className={styles.title}>Создайте аккаунт</h1>
                    <p className={styles.description}>
                        Получите удобный способ управлять доступом к своим объектам.
                    </p>
                </div>

                {error && (
                    <div className={styles.error}>{error}</div>
                )}

                {success && (
                    <div className={styles.success}>{success}</div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {supportedOAuthProviders.map((provider) => (
                        <button
                            key={provider.id}
                            type="button"
                            className={styles.oauthButton}
                            onClick={() => handleOAuthRegister(provider.id)}
                            disabled={isLoading}
                        >
                            <Image
                                src={provider.iconSrc}
                                alt={provider.iconAlt}
                                width={24}
                                height={24}
                            />
                            <span>Регистрация через {provider.label}</span>
                        </button>
                    ))}

                    <Input
                        label="Имя"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Иванов Иван Иванович"
                        required
                        disabled={isLoading}
                        autoComplete="name"
                        size="medium"
                        state={isLoading ? "disabled" : error && formData.name ? "error" : "enabled"}
                        errorMessage={error && formData.name ? error : undefined}
                    />

                    <Input
                        label="Почта"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@email.com"
                        required
                        disabled={isLoading}
                        autoComplete="username"
                        size="medium"
                        state={isLoading ? "disabled" : error && formData.email ? "error" : "enabled"}
                        errorMessage={error && formData.email ? error : undefined}
                    />

                    <Input
                        label="Пароль"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        autoComplete="new-password"
                        size="medium"
                        showPasswordToggle={true}
                        state={isLoading ? "disabled" : error && formData.password ? "error" : "enabled"}
                        errorMessage={error && formData.password ? error : undefined}
                    />

                    <Input
                        label="Повторите пароль"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        autoComplete="new-password"
                        size="medium"
                        showPasswordToggle={true}
                        state={isLoading ? "disabled" : error && formData.confirmPassword ? "error" : "enabled"}
                        errorMessage={error && formData.confirmPassword ? error : undefined}
                    />


                    <div className={styles.consent}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={agreeToTerms}
                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                className={styles.checkbox}
                                disabled={isLoading}
                            />
                            <span className={styles.consentText}>
                                Нажимая на кнопку, вы соглашаетесь с{' '}
                                <Link href="https://home-share.ru/privacy" className={styles.consentLink} target="_blank" rel="noopener noreferrer">
                                    политикой конфиденциальности
                                </Link>
                                {' '}и{' '}
                                <Link href="https://home-share.ru/terms" className={styles.consentLink} target="_blank" rel="noopener noreferrer">
                                    пользовательским соглашением компании
                                </Link>
                            </span>
                        </label>
                    </div>

                    <button 
                        className={styles.registerButton} 
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>

                <div className={styles.separator}></div>

                <div className={styles.loginLink}>
                    <p>
                        Уже зарегистрированы?{' '}
                        <Link href="/login" className={styles.loginLinkText}>
                            Войти
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
} 
