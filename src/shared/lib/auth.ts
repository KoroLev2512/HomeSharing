import { AuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { getServiceClient } from "@/shared/utils/supabase/service"
import { serverEnv } from "@/shared/configs/serverEnv"
import { createEsiaMockProvider } from "@/shared/lib/esiaProvider"

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

if (serverEnv.esiaMockEnabled) {
    oauthProviders.push(createEsiaMockProvider())
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
                        isHost: user.isService ?? false,
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
        async jwt({ token, user, account, trigger, session }) {
            if (user && account?.provider === "esia") {
                try {
                    const supabase = getServiceClient()
                    const email = user.email ?? ""
                    let dbUser: any = null

                    if (email) {
                        const { data: existing } = await supabase
                            .from("User")
                            .select("*")
                            .eq("email", email)
                            .maybeSingle()
                        dbUser = existing
                    }

                    if (!dbUser) {
                        const { data: created, error: createError } = await supabase
                            .from("User")
                            .insert({
                                email: email || `esia-${user.id}@example.local`,
                                name: user.name ?? null,
                                image: null,
                                password: null,
                                isAdmin: false,
                                isUser: true,
                                isService: false,
                            })
                            .select()
                            .single()

                        if (createError) {
                            console.error("[AUTH][esia] Failed to create user:", createError)
                        }
                        dbUser = created
                    }

                    if (dbUser) {
                        token.id = dbUser.id
                        token.name = dbUser.name ?? user.name ?? null
                        token.email = dbUser.email ?? email
                        token.image = dbUser.image ?? null
                        token.picture = dbUser.image ?? null
                        token.isAdmin = dbUser.isAdmin ?? false
                        token.isHost = dbUser.isService ?? false
                        token.isUser = dbUser.isUser ?? true
                    } else if (user) {
                        // Не выходим из jwt до общего merge: при сбое Supabase иначе токен остаётся пустым и OAuth падает → редирект на /login.
                        token.id = user.id
                        token.name = user.name
                        token.email = user.email
                        token.image = user.image
                        token.picture = user.image
                        token.isAdmin = user.isAdmin ?? false
                        token.isHost = user.isHost ?? false
                        token.isUser = user.isUser ?? true
                    }
                    return token
                } catch (err) {
                    console.error("[AUTH][esia] jwt linking failed:", err)
                }
            }

            if (user) {
                token.id = user.id
                token.name = user.name
                token.email = user.email
                token.image = user.image
                token.picture = user.image
                token.isAdmin = user.isAdmin
                token.isHost = user.isHost
                token.isUser = user.isUser
            }

            if (trigger === 'update' && session?.user) {
                if (typeof session.user.name !== 'undefined') token.name = session.user.name
                if (typeof session.user.email !== 'undefined') token.email = session.user.email
                if (typeof session.user.image !== 'undefined') {
                    token.image = session.user.image
                    token.picture = session.user.image
                }
                if (typeof session.user.isHost !== 'undefined') token.isHost = session.user.isHost
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
                session.user.isHost = token.isHost
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
