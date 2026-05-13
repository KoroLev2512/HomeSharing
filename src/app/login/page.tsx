'use client'

import { useEffect, useReducer } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getProviders, signIn } from 'next-auth/react'
import type { ClientSafeProvider } from 'next-auth/react'
import Image from 'next/image'
import { Input } from '@/widgets/Input'
import { supportedOAuthProviders, type SupportedOAuthProvider } from '@/shared/configs/authProviders'
import { EsiaIcon } from '@/shared/icons/EsiaIcon'
import styles from './styles.module.scss'

function oauthCallbackErrorMessage(code: string | null): string | null {
    if (!code) return null
    const map: Record<string, string> = {
        Configuration: 'Сервер не настроен для этого способа входа (OAuth).',
        AccessDenied: 'Вход отменён или доступ запрещён.',
        Verification: 'Ссылка входа устарела или уже использована.',
        OAuthSignin: 'Не удалось начать OAuth-вход.',
        OAuthCallback:
            'Ошибка после ответа провайдера (OAuth). Проверьте логи сервера, Supabase и переменные NEXTAUTH_URL / DATABASE_URL.',
        OAuthCreateAccount: 'Не удалось создать аккаунт через OAuth.',
        OAuthAccountNotLinked: 'Аккаунт уже привязан к другому способу входа.',
        Callback: 'Ошибка callback.',
        Default: 'Ошибка входа. Попробуйте снова.',
    }
    return map[code] ?? map.Default
}

type LoginState = {
    email: string
    password: string
    error: string
    oauthProviders: Record<string, ClientSafeProvider> | null
    isSubmitting: boolean
}

const initialLoginState: LoginState = {
    email: '',
    password: '',
    error: '',
    oauthProviders: null,
    isSubmitting: false,
}

type LoginAction =
    | { type: 'setEmail'; value: string }
    | { type: 'setPassword'; value: string }
    | { type: 'setError'; value: string }
    | { type: 'clearError' }
    | { type: 'setOauthProviders'; value: Record<string, ClientSafeProvider> | null }
    | { type: 'setSubmitting'; value: boolean }

function loginReducer(state: LoginState, action: LoginAction): LoginState {
    switch (action.type) {
        case 'setEmail':
            return { ...state, email: action.value }
        case 'setPassword':
            return { ...state, password: action.value }
        case 'setError':
            return { ...state, error: action.value }
        case 'clearError':
            return { ...state, error: '' }
        case 'setOauthProviders':
            return { ...state, oauthProviders: action.value }
        case 'setSubmitting':
            return { ...state, isSubmitting: action.value }
        default:
            return state
    }
}

export default function LoginPage() {
    const [state, dispatch] = useReducer(loginReducer, initialLoginState)
    const { push } = useRouter()

    useEffect(() => {
        const sp = new URLSearchParams(window.location.search)
        const msg = oauthCallbackErrorMessage(sp.get('error'))
        if (msg) dispatch({ type: 'setError', value: msg })
    }, [])

    useEffect(() => {
        let cancelled = false
        getProviders()
            .then((p) => {
                if (!cancelled) dispatch({ type: 'setOauthProviders', value: p })
            })
            .catch(() => {
                if (!cancelled) dispatch({ type: 'setOauthProviders', value: null })
            })
        return () => {
            cancelled = true
        }
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch({ type: 'setSubmitting', value: true })
        dispatch({ type: 'clearError' })
        try {
            const result = await signIn('credentials', {
                email: state.email,
                password: state.password,
                redirect: false,
            })

            if (result?.error) {
                dispatch({ type: 'setError', value: 'Неверная почта или пароль' })
            } else if (result?.ok) {
                push('/')
            }
        } catch (err) {
            dispatch({
                type: 'setError',
                value: 'Ошибка при входе: ' + (err instanceof Error ? err.message : ''),
            })
        } finally {
            dispatch({ type: 'setSubmitting', value: false })
        }
    }

    const handleOAuthLogin = async (provider: SupportedOAuthProvider) => {
        dispatch({ type: 'setSubmitting', value: true })
        dispatch({ type: 'clearError' })
        try {
            const result = await signIn(provider, { callbackUrl: '/', redirect: false })
            if (result?.error) {
                dispatch({
                    type: 'setError',
                    value:
                        result.error === 'Configuration'
                            ? `Вход через ${provider} не настроен на сервере (проверьте переменные окружения).`
                            : `Не удалось войти через ${provider}: ${result.error}`,
                })
                dispatch({ type: 'setSubmitting', value: false })
                return
            }
            if (result?.url) {
                window.location.assign(result.url)
                return
            }
            dispatch({ type: 'setSubmitting', value: false })
        } catch {
            dispatch({ type: 'setError', value: 'Ошибка при входе через ' + provider })
            dispatch({ type: 'setSubmitting', value: false })
        }
    }

    const visibleOAuth = supportedOAuthProviders.filter((p) => state.oauthProviders && state.oauthProviders[p.id])
    const { email, password, error, isSubmitting } = state

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
                        onChange={(e) => dispatch({ type: 'setEmail', value: e.target.value })}
                        placeholder="example@email.com"
                        required
                        disabled={isSubmitting}
                        autoComplete="username"
                        size="medium"
                        state={isSubmitting ? "disabled" : error && email ? "error" : "enabled"}
                        errorMessage={error && email ? "Неверная почта или пароль" : undefined}
                    />

                    <Input
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={(e) => dispatch({ type: 'setPassword', value: e.target.value })}
                        placeholder="••••••••"
                        required
                        disabled={isSubmitting}
                        autoComplete="current-password"
                        size="medium"
                        showPasswordToggle={true}
                        state={isSubmitting ? "disabled" : error && password ? "error" : "enabled"}
                        errorMessage={error && password ? "Неверная почта или пароль" : undefined}
                    />

                    <button
                        className={styles.loginButton}
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                {visibleOAuth.length > 0 && (
                    <>
                        <div className={styles.divider}>
                            <span>или</span>
                        </div>

                        <div className={styles.oauthButtons}>
                            {visibleOAuth.map((provider) => (
                                <button
                                    key={provider.id}
                                    type="button"
                                    className={styles.oauthButton}
                                    onClick={() => void handleOAuthLogin(provider.id)}
                                    disabled={isSubmitting}
                                >
                                    {provider.id === 'esia' ? (
                                        <EsiaIcon />
                                    ) : (
                                        <Image
                                            src={provider.iconSrc}
                                            alt={provider.iconAlt}
                                            width={24}
                                            height={24}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    )}
                                    <span>Войти через {provider.label}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                <Link href="/forgot-password" className={styles.forgotPassword}>
                    Забыли пароль?
                </Link>

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
