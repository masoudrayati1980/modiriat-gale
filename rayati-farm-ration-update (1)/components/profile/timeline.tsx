'use client'

import {
  ArrowLeftRight,
  Baby,
  CalendarPlus,
  Flag,
  Heart,
  LogOut,
  Pill,
  Scale,
  Sparkles,
  Stethoscope,
  Syringe,
  Thermometer,
  Gauge,
  Utensils,
} from 'lucide-react'
import type { TimelineItem, TimelineKind } from '@/lib/flock'
import { formatJalaliLong } from '@/lib/date'
import { cn } from '@/lib/utils'

const ICON: Record<TimelineKind, typeof Flag> = {
  birth: Sparkles,
  entry: CalendarPlus,
  weight: Scale,
  bcs: Gauge,
  disease: Thermometer,
  treatment: Stethoscope,
  medication: Pill,
  vaccine: Syringe,
  mating: Heart,
  lambing: Baby,
  movement: ArrowLeftRight,
  ration: Utensils,
  event: Flag,
  exit: LogOut,
}

const TONE: Partial<Record<TimelineKind, string>> = {
  disease: 'bg-destructive/12 text-destructive',
  exit: 'bg-destructive/12 text-destructive',
  lambing: 'bg-tag text-tag-foreground',
  birth: 'bg-tag text-tag-foreground',
  mating: 'bg-tag/50 text-tag-foreground',
  ration: 'bg-primary/10 text-primary',
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) {
    return <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">هنوز رویدادی ثبت نشده است.</p>
  }
  return (
    <ol className="relative flex flex-col gap-0">
      {items.map((item, i) => {
        const Icon = ICON[item.kind]
        return (
          <li key={item.key} className="relative flex gap-3 pb-5">
            {i < items.length - 1 ? <span aria-hidden className="absolute right-[17px] top-9 bottom-0 w-px bg-border" /> : null}
            <span className={cn('z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-background', TONE[item.kind] ?? 'bg-secondary text-secondary-foreground')}>
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
              <time dateTime={item.date} className="text-xs text-muted-foreground">
                {formatJalaliLong(item.date)}
              </time>
              <p className="text-sm font-semibold text-pretty">{item.title}</p>
              {item.detail ? <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
