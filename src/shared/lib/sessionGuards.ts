import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/lib/auth';

export interface AuthenticatedSession {
    userId: string;
    isHost: boolean;
    isAdmin: boolean;
}

/**
 * Loads the NextAuth session and returns a normalized shape, or null if unauthenticated.
 */
export const loadSession = async (): Promise<AuthenticatedSession | null> => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    return {
        userId: session.user.id,
        isHost: Boolean(session.user.isService),
        isAdmin: Boolean(session.user.isAdmin),
    };
};
