import { db } from '../admin'

export type MediaChangeType = 'add' | 'update' | 'delete'

/**
 * Bumps catalogUpdatedAt in settings/app and records WHICH doc changed.
 * The mobile app reads lastChangedMediaId + lastChangeType to fetch only
 * that 1 document — instead of re-fetching all 120 media docs.
 *
 * @param changedId  The Firestore document ID that was added/updated/deleted
 * @param changeType 'add' | 'update' | 'delete'
 */
export async function bumpCatalogVersion(
  changedId: string,
  changeType: MediaChangeType = 'update'
): Promise<void> {
  await db.doc('settings/app').set(
    {
      catalogUpdatedAt:    Date.now(),
      lastChangedMediaId:  changedId,
      lastChangeType:      changeType,
    },
    { merge: true }
  )
}

/**
 * Bumps notificationsUpdatedAt to now in settings/app.
 * Call this after sending or deleting a notification.
 * The mobile app's NotificationContext listens to this field and fetches
 * fresh notifications only when it changes.
 */
export async function bumpNotificationsVersion(): Promise<void> {
  await db.doc('settings/app').set(
    { notificationsUpdatedAt: Date.now() },
    { merge: true }
  )
}
