import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Truncate an opaque public id for display, e.g. `dom_01m7ty…`. */
export function shortId(id: string, head = 4, tail = 4): string {
  if (!id) return ''
  if (id.length <= head + tail + 1) return id
  return `${id.slice(0, head)}…${id.slice(-tail)}`
}

/** Format an ISO 8601 timestamp for display. */
export type TimeFormatPref = '12h' | '24h'
export type DateFormatPref = 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'YYYY-MM-DD' | 'MMM D, YYYY'

interface DateTimePreferences {
  timeFormat: TimeFormatPref
  dateFormat: DateFormatPref
}

let dateTimePreferences: DateTimePreferences = { timeFormat: '24h', dateFormat: 'YYYY-MM-DD' }

/** Set the global date/time presentation (driven by user preferences). */
export function setDateTimePreferences(prefs: Partial<DateTimePreferences>) {
  dateTimePreferences = { ...dateTimePreferences, ...prefs }
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDateParts(date: Date): string {
  const day = pad2(date.getDate())
  const month = pad2(date.getMonth() + 1)
  const year = String(date.getFullYear())
  switch (dateTimePreferences.dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`
    case 'MMM D, YYYY':
      return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${year}`
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`
  }
}

function formatTimeParts(date: Date): string {
  const minutes = pad2(date.getMinutes())
  if (dateTimePreferences.timeFormat === '12h') {
    const hours24 = date.getHours()
    const hours12 = hours24 % 12 || 12
    const suffix = hours24 < 12 ? 'AM' : 'PM'
    return `${pad2(hours12)}:${minutes} ${suffix}`
  }
  return `${pad2(date.getHours())}:${minutes}`
}

/** Format an ISO 8601 timestamp as a date only. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return formatDateParts(date)
}

/** Format an ISO 8601 timestamp including time. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${formatDateParts(date)} ${formatTimeParts(date)}`
}

/** Relative time, e.g. "3m ago". */
export function relativeTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 2592000) return rtf.format(Math.round(seconds / 86400), 'day')
  if (abs < 31536000) return rtf.format(Math.round(seconds / 2592000), 'month')
  return rtf.format(Math.round(seconds / 31536000), 'year')
}

/** Format a monetary amount with a currency code. */
export function formatMoney(amount: string | number | null | undefined, currency?: string | null): string {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(num)) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(num)
  } catch {
    return `${num.toFixed(2)} ${currency || ''}`.trim()
  }
}

/** Build a URL query string, skipping null/undefined/empty values. */
export function toQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    search.set(key, String(value))
  }
  const s = search.toString()
  return s ? `?${s}` : ''
}
