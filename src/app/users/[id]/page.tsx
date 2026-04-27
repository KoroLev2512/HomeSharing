'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { SecondaryButton } from '../../../widgets/Button'
import Loader from '@/shared/ui/Loader/Loader'

export default function UserProfilePage() {
    const params = useParams()
    const userId = params?.id as string
    const { data: session, status } = useSession()

    if (status === 'loading') {
        return (
            <div style={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <Loader />
            </div>
        )
    }

    if (!session?.user) {
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

    const isOwnProfile = session.user.id === userId
    const roles: string[] = []

    if (session.user.isAdmin) roles.push('Администратор')
    if (session.user.isService) roles.push('Сервис')
    if (session.user.isUser || roles.length === 0) roles.push('Пользователь')

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
                    <p><strong>Имя:</strong> {session.user.name || 'Не указано'}</p>
                    <p><strong>Email:</strong> {session.user.email || 'Не указано'}</p>
                    <p><strong>Роли:</strong> {roles.join(', ')}</p>
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
