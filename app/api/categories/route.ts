import { NextRequest, NextResponse } from 'next/server'
import { getAllCategories, createCategory, seedCategories } from '@/lib/firebase/firestore/categories'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const seed = searchParams.get('seed')

    if (seed === 'true') {
      await seedCategories()
      return NextResponse.json({ message: 'Categories seeded successfully' })
    }

    const categories = await getAllCategories()
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const category = await createCategory(data)
    
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}