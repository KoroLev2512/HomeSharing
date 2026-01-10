import { AuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { createClient } from "@supabase/supabase-js"

export const authOptions: AuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID ?? "",
            clientSecret: process.env.GITHUB_SECRET ?? "",
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
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
                    // Use service role key for server-side operations to bypass RLS
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    
                    if (!supabaseUrl || !supabaseServiceKey) {
                        console.error("[AUTH] Missing Supabase environment variables")
                        return null
                    }

                    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false
                        }
                    })
                    
                    // Query user from Supabase
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
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.isAdmin = user.isAdmin
                token.isService = user.isService
                token.isUser = user.isUser
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
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
    secret: process.env.NEXTAUTH_SECRET,
}

