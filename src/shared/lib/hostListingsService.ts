import type { IListing } from '@/shared/types/listing';
import type { IListingDraft } from '@/shared/lib/hostListingsRepo';
import { handle } from '@/shared/lib/bookingsService';

export class HostListingsService {
    static async list(): Promise<IListing[]> {
        const data = (await handle(await fetch('/api/host/listings'))) as { listings: IListing[] };
        return data.listings;
    }

    static async getById(id: string): Promise<IListing> {
        const data = (await handle(await fetch(`/api/host/listings/${encodeURIComponent(id)}`))) as {
            listing: IListing;
        };
        return data.listing;
    }

    static async create(draft: IListingDraft): Promise<IListing> {
        const res = await fetch('/api/host/listings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draft),
        });
        const data = (await handle(res)) as { listing: IListing };
        return data.listing;
    }

    static async update(id: string, draft: IListingDraft): Promise<IListing> {
        const res = await fetch(`/api/host/listings/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draft),
        });
        const data = (await handle(res)) as { listing: IListing };
        return data.listing;
    }

    static async remove(id: string): Promise<void> {
        await handle(
            await fetch(`/api/host/listings/${encodeURIComponent(id)}`, {
                method: 'DELETE',
            }),
        );
    }
}
