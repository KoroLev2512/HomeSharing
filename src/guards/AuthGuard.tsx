'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLayoutEffect } from 'react'
import styles from './AuthGuard.module.scss'

interface CustomUser {
  name?: string | null
  email?: string | null
  image?: string | null
  isAdmin?: boolean
  isHost?: boolean
}

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'admin' | 'service'
}

const LoadingSpinner = () => (
  <div className={styles.root}>
    <div className={styles.spinner} />
  </div>
)

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const { data: session, status } = useSession()

  const { push } = useRouter()

  useLayoutEffect(() => {
    if (status === 'loading') return

    if (requiredRole && session && session.user) {
      const user = session.user as CustomUser
      const userRole = user.isAdmin ? 'admin' :
          user.isHost ? 'service' : 'user'

      if (userRole !== requiredRole && userRole !== 'admin') {
        push('/')
        return
      }
    }
  }, [session, status, push, requiredRole])

  if (status === 'loading') {
    return <LoadingSpinner />
  }

  if (requiredRole && session && session.user) {
    const user = session.user as CustomUser
    const userRole = user.isAdmin ? 'admin' :
        user.isHost ? 'service' : 'user'

    if (userRole !== requiredRole && userRole !== 'admin') {
      return null
    }
  }

  return <>{children}</>
}
