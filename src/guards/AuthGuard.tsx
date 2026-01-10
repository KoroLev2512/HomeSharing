'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface CustomUser {
  name?: string | null
  email?: string | null
  image?: string | null
  isAdmin?: boolean
  isService?: boolean
}

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'user' | 'admin' | 'service'
}

const LoadingSpinner = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
)

export const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const { data: session, status } = useSession()

  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (requiredRole && session && session.user) {
      const user = session.user as CustomUser
      const userRole = user.isAdmin ? 'admin' :
          user.isService ? 'service' : 'user'

      if (userRole !== requiredRole && userRole !== 'admin') {
        router.push('/')
        return
      }
    }
  }, [session, status, router, requiredRole])

  if (status === 'loading') {
    return <LoadingSpinner />
  }

  if (requiredRole && session && session.user) {
    const user = session.user as CustomUser
    const userRole = user.isAdmin ? 'admin' :
        user.isService ? 'service' : 'user'

    if (userRole !== requiredRole && userRole !== 'admin') {
      return null
    }
  }

  return <>{children}</>
}
