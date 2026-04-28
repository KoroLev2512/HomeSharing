import { AuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { getServiceClient } from "@/shared/utils/supabase/service"
import { serverEnv } from "@/shared/configs/serverEnv"

const oauthProviders = []

if (serverEnv.github) {
    oauthProviders.push(
        GithubProvider({
            clientId: serverEnv.github.clientId,
            clientSecret: serverEnv.github.clientSecret,
        }),
    )
}

if (serverEnv.google) {
    oauthProviders.push(
        GoogleProvider({
            clientId: serverEnv.google.clientId,
            clientSecret: serverEnv.google.clientSecret,
        }),
    )
}

export const authOptions: AuthOptions = {
    providers: [
        ...oauthProviders,
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.error("[AUTH] Missing credentials")
                    return null
                }

                try {
                    const supabase = getServiceClient()

                    const { data: user, error } = await supabase
                        .from('User')
                        .select('*')
                        .eq('email', credentials.email)
                        .maybeSingle()

                    if (error) {
                        console.error("[AUTH] Database error:", error)
                        return null
                    }

                    if (!user) {
                        console.error("[AUTH] User not found:", credentials.email)
                        return null
                    }

                    if (!user.password) {
                        console.error("[AUTH] User has no password:", credentials.email)
                        return null
                    }

                    // Verify password
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    )

                    if (!isPasswordValid) {
                        console.error("[AUTH] Invalid password for user:", credentials.email)
                        return null
                    }

                    console.log("[AUTH] Successfully authenticated user:", user.email)

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        isAdmin: user.isAdmin ?? false,
                        isService: user.isService ?? false,
                        isUser: user.isUser ?? true,
                    }
                } catch (error) {
                    console.error("[AUTH] Authentication error:", error);
                    return null
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id
                token.name = user.name
                token.email = user.email
                token.image = user.image
                token.picture = user.image
                token.isAdmin = user.isAdmin
                token.isService = user.isService
                token.isUser = user.isUser
            }

            if (trigger === 'update' && session?.user) {
                if (typeof session.user.name !== 'undefined') token.name = session.user.name
                if (typeof session.user.email !== 'undefined') token.email = session.user.email
                if (typeof session.user.image !== 'undefined') {
                    token.image = session.user.image
                    token.picture = session.user.image
                }
                if (typeof session.user.isService !== 'undefined') token.isService = session.user.isService
                if (typeof session.user.isAdmin !== 'undefined') token.isAdmin = session.user.isAdmin
                if (typeof session.user.isUser !== 'undefined') token.isUser = session.user.isUser
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.name = token.name ?? session.user.name
                session.user.email = token.email ?? session.user.email
                session.user.image = (token.image ?? token.picture) ?? session.user.image
                session.user.isAdmin = token.isAdmin
                session.user.isService = token.isService
                session.user.isUser = token.isUser
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: serverEnv.nextAuthSecret,
}
