import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api/client'

function makeHeaders(init: Record<string, string> = {}) {
  return new Headers({ ...init })
}

describe('ApiError', () => {
  it('parses RFC 9457 problem details', () => {
    const err = new ApiError(
      {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'Domain not found.',
        code: 'not_found',
        request_id: '01m7tyhaes538dx8x7xhb8mfwf',
      },
      404,
      makeHeaders(),
    )
    expect(err.status).toBe(404)
    expect(err.code).toBe('not_found')
    expect(err.detail).toBe('Domain not found.')
    expect(err.requestId).toBe('01m7tyhaes538dx8x7xhb8mfwf')
    expect(err.isNotFound).toBe(true)
    expect(err.isUnauthorized).toBe(false)
  })

  it('exposes validation field errors', () => {
    const err = new ApiError(
      {
        title: 'Validation failed',
        status: 422,
        detail: 'The request data failed validation.',
        code: 'validation_failed',
        errors: [{ field: 'name', message: 'The name field is required.' }],
      },
      422,
      makeHeaders(),
    )
    expect(err.isValidation).toBe(true)
    expect(err.fieldErrors).toEqual([{ field: 'name', message: 'The name field is required.' }])
  })

  it('falls back to the Retry-After header for rate limiting', () => {
    const err = new ApiError({ status: 429, code: 'rate_limited' }, 429, makeHeaders({ 'retry-after': '30' }))
    expect(err.isRateLimited).toBe(true)
    expect(err.retryAfter).toBe(30)
  })

  it('picks request id from headers when missing from the body', () => {
    const err = new ApiError({ status: 500 }, 500, makeHeaders({ 'request-id': '01m7abc' }))
    expect(err.requestId).toBe('01m7abc')
  })
})
