import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signOut } from "next-auth/react";

export const useDeleteSessionAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId?: string) => {
      // NextAuth использует JWT стратегию, поэтому просто выходим из текущей сессии
      // Если нужна поддержка удаления конкретных сессий, нужно переключиться на database стратегию
      await signOut({ callbackUrl: '/login' });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};
