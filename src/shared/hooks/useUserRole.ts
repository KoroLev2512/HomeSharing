import { useSession } from 'next-auth/react'

export const useUserRole = () => {
  const { data: session } = useSession()

  if (!session?.user) {
    return {
      isAdmin: false,
      isUser: false,
      role: null
    }
  }

  const isAdmin = session.user.isAdmin || false
  const isUser = session.user.isUser || false

  let role: 'admin' | 'service' | 'user' | null = null
  if (isAdmin) role = 'admin'
  else if (isUser) role = 'user'

  return {
    isAdmin,
    isUser,
    role
  }
} 