import { useEffect, useState } from 'react'
import { APP_SETTINGS_ID, db } from '../lib/db'
import './ReviewReminder.css'

const REVIEW_INTERVAL_DAYS = 14
const REVIEW_INTERVAL_MS = REVIEW_INTERVAL_DAYS * 24 * 60 * 60 * 1000

export function ReviewReminder() {
  const [dueForReview, setDueForReview] = useState(false)

  useEffect(() => {
    db.appSettings.get(APP_SETTINGS_ID).then((settings) => {
      if (!settings) {
        // First-ever load: start the clock now rather than showing a
        // reminder before the user has had a chance to use the app.
        db.appSettings.put({ id: APP_SETTINGS_ID, lastReviewedAt: new Date().toISOString() })
        return
      }
      if (!settings.lastReviewedAt) return
      const elapsed = Date.now() - new Date(settings.lastReviewedAt).getTime()
      setDueForReview(elapsed > REVIEW_INTERVAL_MS)
    })
  }, [])

  async function markReviewed() {
    await db.appSettings.put({ id: APP_SETTINGS_ID, lastReviewedAt: new Date().toISOString() })
    setDueForReview(false)
  }

  if (!dueForReview) return null

  return (
    <div className="review-reminder" role="status">
      <span>It's been a couple of weeks — want to review your numbers?</span>
      <button type="button" onClick={markReviewed}>
        Mark as reviewed
      </button>
    </div>
  )
}
