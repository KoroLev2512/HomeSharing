/**
 * LEGACY API
 *
 * These handlers preserve the old `Flat` domain for compatibility / migration only.
 * Active product work should use `listings` and `host/listings`.
 */
import { NextResponse } from 'next/server'
import { getServiceClient } from '@/shared/utils/supabase/service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/shared/lib/auth'

// GET /api/flats - получить все квартиры пользователя
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getServiceClient()
        
        const { data: flats, error } = await supabase
            .from('Flat')
            .select('*')
            .eq('userId', session.user.id)
            .order('createdAt', { ascending: false })

        if (error) {
            console.error('[FLATS_GET_ERROR]', error)
            return NextResponse.json({ error: 'Failed to fetch flats' }, { status: 500 })
        }

        return NextResponse.json({ flats }, { status: 200 })
    } catch (error) {
        console.error('[FLATS_GET_ERROR]', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/flats - создать новую квартиру
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { address, imageUrl, dateStart, dateEnd, tagFlat, tagLock, isDisabled, wifiLogin, wifiPass, price, rating } = body

        if (!address || !dateStart || !dateEnd) {
            return NextResponse.json({ error: 'Address, dateStart, and dateEnd are required' }, { status: 400 })
        }

        const supabase = getServiceClient()
        
        const { data: flat, error } = await supabase
            .from('Flat')
            .insert({
                userId: session.user.id,
                address,
                imageUrl: imageUrl || null,
                dateStart: new Date(dateStart).toISOString(),
                dateEnd: new Date(dateEnd).toISOString(),
                tagFlat: tagFlat || null,
                tagLock: tagLock || null,
                isDisabled: isDisabled || false,
                wifiLogin: wifiLogin || null,
                wifiPass: wifiPass || null,
                price: price || null,
                rating: rating || 5.0,
            })
            .select()
            .single()

        if (error) {
            console.error('[FLATS_POST_ERROR]', error)
            return NextResponse.json({ error: 'Failed to create flat' }, { status: 500 })
        }

        return NextResponse.json({ flat }, { status: 201 })
    } catch (error) {
        console.error('[FLATS_POST_ERROR]', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
