export interface IAdminUser {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    isAdmin: boolean;
    isHost: boolean;
    isUser: boolean;
    createdAt: string;
}
