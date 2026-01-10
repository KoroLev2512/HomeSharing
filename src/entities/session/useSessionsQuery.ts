import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

type SessionInfo = {
  id: string;
  email: string;
  name?: string;
  expires?: string;
};

export const useSessionsQuery = () => {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ["sessions", session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        return [];
      }

      // NextAuth использует JWT стратегию, поэтому возвращаем текущую сессию
      // Если нужна поддержка множественных сессий, нужно переключиться на database стратегию
      return [{
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || undefined,
      }] as SessionInfo[];
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000,
  });
};
