'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SecondaryButton } from '../../../widgets/Button'
import authStorage, { UserDetails } from '@/shared/lib/authStorage'

export default function UserProfilePage() {
    const params = useParams()
    const router = useRouter()
    const userId = params?.id as string
    const [user, setUser] = useState<UserDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        authStorage.getUserDetails().then((details) => {
            setUser(details)
            setIsLoading(false)
        })
    }, [])

    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div>Загрузка...</div>
            </div>
        )
    }

    if (!user) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                gap: '20px'
            }}>
                <h2>Профиль пользователя</h2>
                <p>Для просмотра профиля необходимо войти в систему</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/login">
                        <SecondaryButton>Войти</SecondaryButton>
                    </Link>
                    <Link href="/register">
                        <SecondaryButton>Регистрация</SecondaryButton>
                    </Link>
                </div>
            </div>
        )
    }

    const isOwnProfile = user.id === userId

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            gap: '20px'
        }}>
            <h2>Профиль пользователя</h2>
            {isOwnProfile ? (
                <div style={{ textAlign: 'center' }}>
                    <h3>Ваш профиль</h3>
                    <p><strong>Имя:</strong> {user.given_name || user.preferred_username || 'Не указано'}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Роли:</strong> {user.roles?.join(', ') || 'Пользователь'}</p>
                </div>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    <p>Профиль пользователя ID: {userId}</p>
                    <p>Детальная информация доступна только владельцу профиля</p>
                </div>
            )}
            <Link href="/">
                <SecondaryButton>На главную</SecondaryButton>
            </Link>
        </div>
    )
}
