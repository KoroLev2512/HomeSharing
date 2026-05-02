import { handle } from '@/shared/lib/bookingsService';

export class MeService {
    static async setHost(isHost: boolean): Promise<void> {
        await handle(
            await fetch('/api/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isHost }),
            }),
        );
    }

    static async uploadAvatar(file: File): Promise<string> {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/me/avatar', {
            method: 'POST',
            body: form,
        });
        const data = (await handle(res)) as { image: string };
        return data.image;
    }

    static async resetAvatar(): Promise<void> {
        await handle(
            await fetch('/api/me/avatar', {
                method: 'DELETE',
            }),
        );
    }
}
