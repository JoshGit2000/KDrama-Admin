import { db } from '../admin'

/**
 * Returns the number of documents in the `fcmTokens` collection.
 * Uses Firestore's count() aggregate — costs exactly 1 read regardless
 * of how many tokens exist in the collection.
 */
export async function getAppUserCount(): Promise<number> {
  try {
    const snapshot = await db.collection('fcmTokens').count().get()
    return snapshot.data().count
  } catch (error) {
    console.error('Error counting fcmTokens:', error)
    return 0
  }
}
