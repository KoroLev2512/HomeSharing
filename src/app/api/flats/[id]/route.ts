import { NextResponse } from 'next/server'
import { getServiceClient } from '@/shared/utils/supabase/service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/shared/lib/auth'

// GET /api/flats/[id] - получить квартиру по ID
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getServiceClient()
        
        const { data: flat, error } = await supabase
            .from('Flat')
            .select('*')
            .eq('id', id)
            .eq('userId', session.user.id)
            .single()

        if (error || !flat) {
            return NextResponse.json({ error: 'Flat not found' }, { status: 404 })
        }

        return NextResponse.json({ flat }, { status: 200 })
    } catch (error) {
        console.error('[FLAT_GET_ERROR]', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PUT /api/flats/[id] - обновить квартиру
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { address, imageUrl, dateStart, dateEnd, tagFlat, tagLock, isDisabled, wifiLogin, wifiPass, price, rating } = body

        const supabase = getServiceClient()
        
        // Проверяем, что квартира принадлежит пользователю
        const { data: existingFlat, error: checkError } = await supabase
            .from('Flat')
            .select('id')
            .eq('id', id)
            .eq('userId', session.user.id)
            .single()

        if (checkError || !existingFlat) {
            return NextResponse.json({ error: 'Flat not found' }, { status: 404 })
        }

        const updateData: any = {}
        if (address !== undefined) updateData.address = address
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl
        if (dateStart !== undefined) updateData.dateStart = new Date(dateStart).toISOString()
        if (dateEnd !== undefined) updateData.dateEnd = new Date(dateEnd).toISOString()
        if (tagFlat !== undefined) updateData.tagFlat = tagFlat
        if (tagLock !== undefined) updateData.tagLock = tagLock
        if (isDisabled !== undefined) updateData.isDisabled = isDisabled
        if (wifiLogin !== undefined) updateData.wifiLogin = wifiLogin
        if (wifiPass !== undefined) updateData.wifiPass = wifiPass
        if (price !== undefined) updateData.price = price
        if (rating !== undefined) updateData.rating = rating

        const { data: flat, error } = await supabase
            .from('Flat')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('[FLAT_PUT_ERROR]', error)
            return NextResponse.json({ error: 'Failed to update flat' }, { status: 500 })
        }

        return NextResponse.json({ flat }, { status: 200 })
    } catch (error) {
        console.error('[FLAT_PUT_ERROR]', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE /api/flats/[id] - удалить квартиру
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getServiceClient()
        
        // Проверяем, что квартира принадлежит пользователю
        const { data: existingFlat, error: checkError } = await supabase
            .from('Flat')
            .select('id')
            .eq('id', id)
            .eq('userId', session.user.id)
            .single()

        if (checkError || !existingFlat) {
            return NextResponse.json({ error: 'Flat not found' }, { status: 404 })
        }

        const { error } = await supabase
            .from('Flat')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('[FLAT_DELETE_ERROR]', error)
            return NextResponse.json({ error: 'Failed to delete flat' }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error('[FLAT_DELETE_ERROR]', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}