import { describe, it, expect } from 'vitest'
import { TAKES_SPOT, countSpotsFromStatuses } from '@/lib/api/events/capacity'

describe('capacity utils', () => {
  it('TAKES_SPOT contains the three spot-taking statuses', () => {
    expect(new Set(TAKES_SPOT)).toEqual(
      new Set([
        'PAYMENT_SENT_AWAITING_VERIFICATION',
        'PAYMENT_VERIFIED',
        'VERIFIED_CASH',
      ]),
    )
  })

  it('countSpotsFromStatuses counts only spot-taking statuses', () => {
    const statuses = [
      'PENDING_VERIFICATION',
      'PAYMENT_SENT_AWAITING_VERIFICATION',
      'REJECTED',
      'VERIFIED_CASH',
      'PAYMENT_VERIFIED',
      'WAITING_LIST_PROMOTED',
    ] as const

    expect(countSpotsFromStatuses(statuses)).toBe(3)
  })
})

