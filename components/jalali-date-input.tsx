'use client'

import { useId } from 'react'
import { JALALI_MONTHS, currentJalaliYear, fa, isoToJalaliParts, jalaliPartsToISO, monthLength, todayISO } from '@/lib/date'
import { cn } from '@/lib/utils'

interface Props {
  value?: string
  onChange: (iso: string | undefined) => void
  id?: string
  allowEmpty?: boolean
  className?: string
}

const selectClass =
  'h-10 appearance-none rounded-lg border border-input bg-card px-2 text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40'

export function JalaliDateInput({ value, onChange, id, allowEmpty, className }: Props) {
  const autoId = useId()
  const baseId = id ?? autoId
  const parts = value ? isoToJalaliParts(value) : undefined
  const thisYear = currentJalaliYear()
  const years = Array.from({ length: 21 }, (_, i) => thisYear + 1 - i)

  const update = (jy: number, jm: number, jd: number) => onChange(jalaliPartsToISO(jy, jm, jd))

  if (!parts) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          type="button"
          id={baseId}
          onClick={() => onChange(todayISO())}
          className="h-10 flex-1 rounded-lg border border-dashed border-input bg-card px-3 text-sm text-muted-foreground hover:bg-muted"
        >
          انتخاب تاریخ
        </button>
      </div>
    )
  }

  const days = monthLength(parts.jy, parts.jm)

  return (
    <div className={cn('flex items-center gap-1.5', className)} role="group" aria-label="تاریخ شمسی">
      <select
        id={baseId}
        aria-label="روز"
        className={cn(selectClass, 'w-16')}
        value={parts.jd}
        onChange={(e) => update(parts.jy, parts.jm, Number(e.target.value))}
      >
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {fa(String(d))}
          </option>
        ))}
      </select>
      <select
        aria-label="ماه"
        className={cn(selectClass, 'min-w-0 flex-1')}
        value={parts.jm}
        onChange={(e) => update(parts.jy, Number(e.target.value), parts.jd)}
      >
        {JALALI_MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <select
        aria-label="سال"
        className={cn(selectClass, 'w-20')}
        value={parts.jy}
        onChange={(e) => update(Number(e.target.value), parts.jm, parts.jd)}
      >
        {(years.includes(parts.jy) ? years : [parts.jy, ...years]).map((y) => (
          <option key={y} value={y}>
            {fa(String(y))}
          </option>
        ))}
      </select>
      {allowEmpty ? (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="h-10 rounded-lg px-2 text-xs text-muted-foreground hover:bg-muted"
          aria-label="پاک کردن تاریخ"
        >
          پاک
        </button>
      ) : null}
    </div>
  )
}
