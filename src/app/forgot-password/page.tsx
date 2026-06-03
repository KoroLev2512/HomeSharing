'use client'

import { useReducer } from 'react'
import Link from 'next/link'
import { Input } from '@/widgets/Input'
import styles from './styles.module.scss'

type State = {
    email: string
    error: string
    isSubmitting: boolean
    isSuccess: boolean
}

const initial: State = { email: '', error: '', isSubmitting: false, isSuccess: false }

type Action =
    | { type: 'setEmail'; value: string }
    | { type: 'setError'; value: string }
    | { type: 'setSubmitting'; value: boolean }
    | { type: 'setSuccess' }

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'setEmail': return { ...state, email: action.value }
        case 'setError': return { ...state, error: action.value }
        case 'setSubmitting': return { ...state, isSubmitting: action.value }
        case 'setSuccess': return { ...state, isSuccess: true, isSubmitting: false }
        default: return state
    }
}

export default function ForgotPasswordPage() {
    const [state, dispatch] = useReducer(reducer, initial)
    const { email, error, isSubmitting, isSuccess } = state

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch({ type: 'setError', value: '' })
        dispatch({ type: 'setSubmitting', value: true })
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (!res.ok) {
                dispatch({ type: 'setError', value: data.error ?? 'Ошибка сервера' })
                dispatch({ type: 'setSubmitting', value: false })
            } else {
                dispatch({ type: 'setSuccess' })
            }
        } catch {
            dispatch({ type: 'setError', value: 'Не удалось отправить запрос' })
            dispatch({ type: 'setSubmitting', value: false })
        }
    }

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
                        <h1 className={styles.title}>Письмо отправлено</h1>
                        <p className={styles.description}>
                            Если аккаунт с адресом <strong>{email}</strong> существует, на него придёт письмо со ссылкой для сброса пароля.
                            Ссылка действительна 1 час.
                        </p>
                        <Link href="/login" className={styles.loginButton} style={{ marginTop: '0.5rem' }}>
                            Вернуться ко входу
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className={styles.header}>
                            <h1 className={styles.title}>Забыли пароль?</h1>
                            <p className={styles.description}>
                                Введите email вашего аккаунта — мы отправим ссылку для сброса пароля.
                            </p>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                label="Почта"
                                type="email"
                                value={email}
                                onChange={(e) => dispatch({ type: 'setEmail', value: e.target.value })}
                                placeholder="example@email.com"
                                required
                                disabled={isSubmitting}
                                autoComplete="email"
                                size="medium"
                                state={isSubmitting ? 'disabled' : error ? 'error' : 'enabled'}
                            />

                            <button className={styles.loginButton} type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
                            </button>
                        </form>

                        <div className={styles.separator} />

                        <div className={styles.registerLink}>
                            <p>
                                Вспомнили пароль?{' '}
                                <Link href="/login" className={styles.registerLinkText}>Войти</Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
