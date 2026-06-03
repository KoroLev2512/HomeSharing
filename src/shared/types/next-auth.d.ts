import NextAuth from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user: {
            id?: string
            name?: string | null
            email?: string | null
            image?: string | null
            isAdmin?: boolean
            isHost?: boolean
            isUser?: boolean
            // ЕСИА верификация (§4.1 диплома)
            esiaSub?: string | null
            esiaVerifiedAt?: string | null
        }
    }

    interface User {
        id?: string
        isAdmin?: boolean
        isHost?: boolean
        isUser?: boolean
        esiaSub?: string | null
        esiaVerifiedAt?: string | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string
        name?: string | null
        email?: string | null
        picture?: string | null
        image?: string | null
        isAdmin?: boolean
        isHost?: boolean
        isUser?: boolean
        esiaSub?: string | null
        esiaVerifiedAt?: string | null
    }
}
