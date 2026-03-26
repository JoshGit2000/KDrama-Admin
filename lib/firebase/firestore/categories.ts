import { db } from '../admin'

const COLLECTION = 'categories'

export interface Category {
  id: string
  name: string
  slug?: string
  createdAt: string
  updatedAt: string
}

type CreateCategoryInput = Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>> & {
  name: string
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    const snapshot = await db.collection(COLLECTION).get()

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }) as Category)
      .sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to fetch categories')
  }
}

export async function createCategory(data: CreateCategoryInput): Promise<Category> {
  try {
    const now = new Date().toISOString()
    const payload = {
      name: data.name.trim(),
      slug: data.slug ?? data.name.toLowerCase().trim().replace(/\s+/g, '-'),
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await db.collection(COLLECTION).add(payload)
    const doc = await docRef.get()

    return {
      id: doc.id,
      ...doc.data(),
    } as Category
  } catch (error) {
    console.error('Error creating category:', error)
    throw new Error('Failed to create category')
  }
}

export async function seedCategories(): Promise<void> {
  const defaultCategories = [
    'Romance',
    'Comedy',
    'Drama',
    'Thriller',
    'Action',
    'Fantasy',
    'Historical',
  ]

  try {
    const snapshot = await db.collection(COLLECTION).get()
    if (!snapshot.empty) return

    const batch = db.batch()
    const now = new Date().toISOString()

    defaultCategories.forEach((name) => {
      const ref = db.collection(COLLECTION).doc()
      batch.set(ref, {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: now,
        updatedAt: now,
      })
    })

    await batch.commit()
  } catch (error) {
    console.error('Error seeding categories:', error)
    throw new Error('Failed to seed categories')
  }
}
