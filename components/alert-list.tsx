'use client'

import Link from 'next/link'
import { Baby, Bell, Pill, Scale, Stethoscope, Syringe, Thermometer, CircleCheck } from 'lucide-react'
import type { Animal, FlockData } from '@/lib/db'
import type { AlertKind, FlockAlert } from '@/lib/flock'
import { fa } from '@/lib/date'
import { cn } from '@/lib/utils'

const ICONS: Record<AlertKind, typeof Bell> = {
  vaccine: Syringe,
  lambing: Baby,
  followup: Stethoscope,
  disease: Thermometer,
  withdrawal: Pill,
  pregcheck: Bell,
  bcs: Scale,
}

interface AlertGroup {
  key: string
  alert: FlockAlert
  animals: Animal[]
}

function group(alerts: FlockAlert[], data: FlockData, merge: boolean): AlertGroup[] {
  const map = new Map<string, AlertGroup>()
  for (const a of alerts) {
    const animal = data.animals.find((x) => x.id === a.animalId)
    const key = merge ? `${a.kind}|${a.level}|${a.title}|${a.detail}` : a.key
    const existing = map.get(key)
    if (existing) {
      if (animal) existing.animals.push(animal)
    } else {
      map.set(key, { key, alert: a, animals: animal ? [animal] : [] })
    }
  }
  return [...map.values()]
}

function TagChip({ animal }: { animal: Animal }) {
  return (
    <Link
      href={`/animals/view?id=${animal.id}`}
      className="rounded-md bg-tag px-2 py-1 text-xs font-bold tabular-nums text-tag-foreground hover:ring-2 hover:ring-tag-foreground/20"
      aria-label={`پرونده دام ${animal.earTag}`}
    >
      {fa(animal.earTag)}
    </Link>
  )
}

export function AlertList({
  alerts,
  data,
  showAnimal,
  limit,
}: {
  alerts: FlockAlert[]
  data: FlockData
  showAnimal?: boolean
  limit?: number
}) {
  if (!alerts.length) {
    return (
      <p className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <CircleCheck className="size-5 text-success" aria-hidden />
        هشداری وجود ندارد.
      </p>
    )
  }
  const groups = group(alerts, data, !!showAnimal)
  const shown = limit ? groups.slice(0, limit) : groups

  return (
    <ul className="flex flex-col gap-2">
      {shown.map(({ key, alert: a, animals }) => {
        const Icon = ICONS[a.kind]
        return (
          <li key={key} className="flex items-start gap-3 rounded-xl border bg-card p-3">
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                a.level === 'danger' && 'bg-destructive/12 text-destructive',
                a.level === 'warning' && 'bg-warning/20 text-tag-foreground',
                a.level === 'info' && 'bg-secondary text-secondary-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="flex flex-col">
                <span className="text-sm font-semibold">
                  {a.title}
                  {showAnimal && animals.length > 1 ? <span className="font-normal text-muted-foreground"> — {fa(animals.length)} رأس</span> : null}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">{a.detail}</span>
              </span>
              {showAnimal && animals.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {animals.slice(0, 12).map((animal) => (
                    <TagChip key={animal.id} animal={animal} />
                  ))}
                  {animals.length > 12 ? <span className="self-center text-xs text-muted-foreground">+{fa(animals.length - 12)}</span> : null}
                </span>
              ) : null}
            </span>
          </li>
        )
      })}
      {limit && groups.length > limit ? (
        <li className="text-center text-xs text-muted-foreground">و {fa(groups.length - limit)} مورد دیگر</li>
      ) : null}
    </ul>
  )
}
