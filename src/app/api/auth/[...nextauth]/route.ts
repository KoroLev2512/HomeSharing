import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcrypt'
import prisma from '@/lib/prisma'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

const handler = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null
                const user = await prisma.user.findUnique({ where: { email: credentials.email } })
                if (!user) return null

                const isValid = await compare(credentials.password, user.password)
                if (!isValid) return null

                return user
            }
        })
    ],
    pages: {
        signIn: '/login',
        error: '/login?error=credentials'
    },
    session: { strategy: 'jwt' },
    callbacks: {
        async session({ session, token }) {
            if (token.sub) session.user.id = token.sub
            return session
        }
    }
})

export { handler as GET, handler as POST }