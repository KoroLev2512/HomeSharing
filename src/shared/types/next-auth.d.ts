import NextAuth from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id?: string
            name?: string | null
            email?: string | null
            image?: string | null
            isAdmin?: boolean
            isService?: boolean
            isUser?: boolean
        }
    }

    interface User {
        id?: string
        isAdmin?: boolean
        isService?: boolean
        isUser?: boolean
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string
        isAdmin?: boolean
        isService?: boolean
        isUser?: boolean
    }
}
