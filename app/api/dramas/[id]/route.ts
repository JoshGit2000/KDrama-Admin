import { NextRequest, NextResponse } from 'next/server'
import { getDramaById, updateDrama, deleteDrama } from '@/lib/firebase/firestore/dramas'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const drama = await getDramaById(params.id)
    
    if (!drama) {
      return NextResponse.json({ error: 'Drama not found' }, { status: 404 })
    }

    return NextResponse.json(drama)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch drama' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const drama = await updateDrama(params.id, data)
    
    return NextResponse.json(drama)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update drama' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteDrama(params.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete drama' },
      { status: 500 }
    )
  }
}