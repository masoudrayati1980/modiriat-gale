import { toGregorian, toJalaali, jalaaliMonthLength } from 'jalaali-js'

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]

const pad = (n: number) => String(n).padStart(2, '0')

export function fa(value: number | string | undefined | null, digits?: number): string {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'number') {
    return value.toLocaleString('fa-IR', {
      maximumFractionDigits: digits ?? 2,
    })
  }
  return value.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function diffDays(fromIso: string, toIso: string): number {
  const ms = parseISO(toIso).getTime() - parseISO(fromIso).getTime()
  return Math.round(ms / 86_400_000)
}

export function isoToJalaliParts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return toJalaali(y, m, d)
}

export function jalaliPartsToISO(jy: number, jm: number, jd: number): string {
  const safeDay = Math.min(jd, jalaaliMonthLength(jy, jm))
  const g = toGregorian(jy, jm, safeDay)
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`
}

export function monthLength(jy: number, jm: number) {
  return jalaaliMonthLength(jy, jm)
}

export function formatJalali(iso?: string): string {
  if (!iso) return '—'
  const { jy, jm, jd } = isoToJalaliParts(iso)
  return fa(`${jy}/${pad(jm)}/${pad(jd)}`)
}

export function formatJalaliLong(iso?: string): string {
  if (!iso) return '—'
  const { jy, jm, jd } = isoToJalaliParts(iso)
  return `${fa(String(jd))} ${JALALI_MONTHS[jm - 1]} ${fa(String(jy))}`
}

export function currentJalaliYear(): number {
  return isoToJalaliParts(todayISO()).jy
}

export function formatAge(birthIso?: string, refIso: string = todayISO()): string {
  if (!birthIso) return '—'
  const days = diffDays(birthIso, refIso)
  if (days < 0) return '—'
  if (days < 60) return `${fa(days)} روز`
  const months = Math.floor(days / 30.44)
  if (months < 24) return `${fa(months)} ماه`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem ? `${fa(years)} سال و ${fa(rem)} ماه` : `${fa(years)} سال`
}

export function relativeDays(iso: string, refIso: string = todayISO()): string {
  const d = diffDays(refIso, iso)
  if (d === 0) return 'امروز'
  if (d === 1) return 'فردا'
  if (d === -1) return 'دیروز'
  if (d > 0) return `${fa(d)} روز دیگر`
  return `${fa(-d)} روز گذشته`
}
