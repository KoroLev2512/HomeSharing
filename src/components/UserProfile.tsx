'use client'

import { useSession, signOut } from 'next-auth/react'
import { useUserRole } from '@/shared/hooks/useUserRole'
import Link from 'next/link'

export const UserProfile = () => {
  const { data: session, status } = useSession()
  const { role } = useUserRole()

  if (status === 'loading') {
    return (
      <div className="user-profile-loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="user-profile-not-auth">
        <Link href="/login" className="login-link">
          Войти в систему
        </Link>
      </div>
    )
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'service':
        return 'Сервис'
      case 'user':
        return 'Пользователь'
      default:
        return 'Неизвестно'
    }
  }

  return (
    <div className="user-profile">
      <div className="user-info">
        <div className="user-avatar">
          {session.user.image ? (
            <img 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="user-details">
          <div className="user-name">
            {session.user.name || session.user.email}
          </div>
          <div className="user-email">
            {session.user.email}
          </div>
          <div className="user-role">
            {getRoleLabel(role)}
          </div>
        </div>
      </div>
      
      <div className="user-actions">
        <button 
          onClick={handleSignOut}
          className="sign-out-button"
        >
          Выйти
        </button>
      </div>
    </div>
  )
} 