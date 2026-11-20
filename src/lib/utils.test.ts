import { describe, expect, it } from 'vitest'
import { formatMoney, shortId, toQueryString } from '@/lib/utils'

describe('shortId', () => {
  it('truncates long opaque ids', () => {
    expect(shortId('ent_01m7tyd5kgq7wsqbkp7stbqvqt')).toBe('ent_…qvqt')
  })

  it('returns short ids unchanged', () => {
    expect(shortId('abc')).toBe('abc')
  })

  it('handles empty input', () => {
    expect(shortId('')).toBe('')
  })
})

describe('formatMoney', () => {
  it('formats a numeric string with a currency', () => {
    const out = formatMoney('42.50', 'EUR')
    expect(out).toContain('42.50')
    expect(out).toContain('€')
  })

  it('returns a dash for missing values', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
    expect(formatMoney('')).toBe('—')
  })

  it('handles invalid numbers', () => {
    expect(formatMoney('not-a-number', 'EUR')).toBe('—')
  })
})

describe('toQueryString', () => {
  it('skips empty values', () => {
    expect(toQueryString({ page: 1, status: '', q: null, enabled: undefined, x: false })).toBe('?page=1&x=false')
  })

  it('returns empty string when no values', () => {
    expect(toQueryString({ a: null, b: '' })).toBe('')
  })
})
