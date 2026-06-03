'use client'

import { useReducer, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/widgets/Input'
import styles from './styles.module.scss'

type State = {
    password: string
    passwordRepeat: string
    error: string
    isSubmitting: boolean
    isSuccess: boolean
}

const initial: State = { password: '', passwordRepeat: '', error: '', isSubmitting: false, isSuccess: false }

type Action =
    | { type: 'setPassword'; value: string }
    | { type: 'setPasswordRepeat'; value: string }
    | { type: 'setError'; value: string }
    | { type: 'setSubmitting'; value: boolean }
    | { type: 'setSuccess' }

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'setPassword': return { ...state, password: action.value }
        case 'setPasswordRepeat': return { ...state, passwordRepeat: action.value }
        case 'setError': return { ...state, error: action.value }
        case 'setSubmitting': return { ...state, isSubmitting: action.value }
        case 'setSuccess': return { ...state, isSuccess: true, isSubmitting: false }
        default: return state
    }
}

export default function ResetPasswordPage() {
    const [state, dispatch] = useReducer(reducer, initial)
    const { password, passwordRepeat, error, isSubmitting, isSuccess } = state
    const searchParams = useSearchParams()
    const router = useRouter()

    const token = searchParams.get('token')
    const email = searchParams.get('email')

    useEffect(() => {
        if (!token || !email) {
            dispatch({ type: 'setError', value: 'Ссылка недействительна. Запросите новую.' })
        }
    }, [token, email])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== passwordRepeat) {
            dispatch({ type: 'setError', value: 'Пароли не совпадают' })
            return
        }
        dispatch({ type: 'setError', value: '' })
        dispatch({ type: 'setSubmitting', value: true })
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email, password, passwordRepeat }),
            })
            const data = await res.json()
            if (!res.ok) {
                dispatch({ type: 'setError', value: data.error ?? 'Ошибка сервера' })
                dispatch({ type: 'setSubmitting', value: false })
            } else {
                dispatch({ type: 'setSuccess' })
                setTimeout(() => router.push('/login'), 2500)
            }
        } catch {
            dispatch({ type: 'setError', value: 'Не удалось отправить запрос' })
            dispatch({ type: 'setSubmitting', value: false })
        }
    }

    const tokenMissing = !token || !email

    return (
        <div className={styles.wrapper}>
            <div className={styles.loginContainer}>
                <Link href="/login" className={styles.backButton}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Назад</span>
                </Link>

                {isSuccess ? (
                    <div className={styles.successBlock}>
                        <div className={styles.successIcon}>
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <circle cx="16" cy="16" r="16" fill="#000"/>
                                <path d="M9 16.5L13.5 21L23 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h1 className={styles.title}>Пароль изменён</h1>
                        <p className={styles.description}>
                            Вы будете перенаправлены на страницу входа через несколько секунд.
                        </p>
                        <Link href="/login" className={styles.loginButton} style={{ marginTop: '0.5rem' }}>
                            Войти
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className={styles.header}>
                            <h1 className={styles.title}>Новый пароль</h1>
                            <p className={styles.description}>
                                Придумайте новый пароль для вашего аккаунта.
                            </p>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Новый пароль"
                                type="password"
                                value={password}
                                onChange={(e) => dispatch({ type: 'setPassword', value: e.target.value })}
                                placeholder="••••••••"
                                required
                                disabled={isSubmitting || tokenMissing}
                                autoComplete="new-password"
                                size="medium"
                                showPasswordToggle={true}
                                state={isSubmitting || tokenMissing ? 'disabled' : 'enabled'}
                            />

                            <Input
                                label="Повторите пароль"
                                type="password"
                                value={passwordRepeat}
                                onChange={(e) => dispatch({ type: 'setPasswordRepeat', value: e.target.value })}
                                placeholder="••••••••"
                                required
                                disabled={isSubmitting || tokenMissing}
                                autoComplete="new-password"
                                size="medium"
                                showPasswordToggle={true}
                                state={isSubmitting || tokenMissing ? 'disabled' : error && passwordRepeat ? 'error' : 'enabled'}
                                errorMessage={error && passwordRepeat ? error : undefined}
                            />

                            <button
                                className={styles.loginButton}
                                type="submit"
                                disabled={isSubmitting || tokenMissing}
                            >
                                {isSubmitting ? 'Сохранение...' : 'Сохранить пароль'}
                            </button>
                        </form>

                        <div className={styles.separator} />

                        <div className={styles.registerLink}>
                            <p>
                                Ссылка не работает?{' '}
                                <Link href="/forgot-password" className={styles.registerLinkText}>Запросить снова</Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
