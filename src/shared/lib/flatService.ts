/**
 * LEGACY LAYER
 *
 * This service belongs to the archived `Flat` domain.
 * It is kept only for reference / migration work and is not part of the active runtime flow.
 * Use `listings` / `host/listings` services for new product work.
 */
import { IFlatCard } from '@/shared/store/flats'

export interface FlatData {
    id?: string
    address: string
    imageUrl?: string
    dateStart: string | Date
    dateEnd: string | Date
    tagFlat?: string
    tagLock?: string
    isDisabled?: boolean
    wifiLogin?: string
    wifiPass?: string
    price?: string
    rating?: number
}

class FlatService {
    static async getFlats(): Promise<IFlatCard[]> {
        try {
            const response = await fetch('/api/flats', {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to fetch flats')
            }

            const data = await response.json()
            return this.transformFlats(data.flats || [])
        } catch (error) {
            console.error('[FlatService] Get flats error:', error)
            return []
        }
    }

    static async getFlat(id: string): Promise<IFlatCard | null> {
        try {
            const response = await fetch(`/api/flats/${id}`, {
                method: 'GET',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to fetch flat')
            }

            const data = await response.json()
            return this.transformFlat(data.flat)
        } catch (error) {
            console.error('[FlatService] Get flat error:', error)
            return null
        }
    }

    static async createFlat(flatData: FlatData): Promise<IFlatCard | null> {
        try {
            const response = await fetch('/api/flats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(flatData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create flat')
            }

            const data = await response.json()
            return this.transformFlat(data.flat)
        } catch (error) {
            console.error('[FlatService] Create flat error:', error)
            throw error
        }
    }

    static async updateFlat(id: string, flatData: Partial<FlatData>): Promise<IFlatCard | null> {
        try {
            const response = await fetch(`/api/flats/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(flatData),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update flat')
            }

            const data = await response.json()
            return this.transformFlat(data.flat)
        } catch (error) {
            console.error('[FlatService] Update flat error:', error)
            throw error
        }
    }

    static async deleteFlat(id: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/flats/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete flat')
            }

            return true
        } catch (error) {
            console.error('[FlatService] Delete flat error:', error)
            throw error
        }
    }

    // Преобразование данных из Supabase в формат IFlatCard
    private static transformFlats(flats: any[]): IFlatCard[] {
        return flats.map(flat => this.transformFlat(flat))
    }

    private static transformFlat(flat: any): IFlatCard {
        const tags: Record<string, { name: string; text: string }> = {
            lilac: { name: 'lilac-tag', text: 'Квартира занята' },
            orange: { name: 'orange-tag', text: 'Требуется уборка' },
            gray: { name: 'gray-tag', text: 'Доступ истек' },
            green: { name: 'green-tag', text: 'Не требуется' },
            yellow: { name: 'yellow-tag', text: 'Закрыт' },
        }

        const dateStart = new Date(flat.dateStart)
        const dateEnd = new Date(flat.dateEnd)
        
        const formatDate = (date: Date) => {
            const day = date.getDate()
            const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июнь', 'июль', 'авг', 'сен', 'окт', 'ноя', 'дек']
            const month = months[date.getMonth()]
            return `${day} ${month}. ${date.getFullYear()}`
        }

        const formatDateShort = (date: Date) => {
            const day = String(date.getDate()).padStart(2, '0')
            const month = String(date.getMonth() + 1).padStart(2, '0')
            return `${day}.${month}.${date.getFullYear()}`
        }

        // Используем изображение из URL или дефолтное
        const imageUrl = flat.imageUrl || '/rooms/room.png'
        
        // Для изображений используем строку пути (Next.js Image будет работать с путями)
        const img = imageUrl

        return {
            id: flat.id,
            address: flat.address,
            img: img,
            dateRange: `${formatDate(dateStart)} – ${formatDate(dateEnd)}`,
            dateStart: formatDateShort(dateStart),
            dateEnd: formatDateShort(dateEnd),
            tagFlat: flat.tagFlat ? tags[flat.tagFlat] : undefined,
            tagLock: flat.tagLock ? tags[flat.tagLock] : undefined,
            isDisabled: flat.isDisabled || false,
            wifiLogin: flat.wifiLogin || '',
            wifiPass: flat.wifiPass || '',
            persons: [], // TODO: добавить поддержку persons
            price: flat.price || '30 000 ₽',
            rating: flat.rating || 5.0,
        }
    }
}

export default FlatService
