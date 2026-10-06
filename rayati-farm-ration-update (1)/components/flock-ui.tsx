'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import type { Animal, AnimalStatus } from '@/lib/db'
import { STATUS_LABEL } from '@/lib/constants'
import { fa } from '@/lib/date'
import { cn } from '@/lib/utils'

export function EarTag({ value, size = 'md', className }: { value: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center rounded-b-xl rounded-t-md bg-tag font-bold tabular-nums tracking-wide text-tag-foreground shadow-sm ring-1 ring-tag-foreground/15',
        size === 'sm' && 'min-w-12 px-2 pb-1 pt-2 text-xs',
        size === 'md' && 'min-w-16 px-3 pb-1.5 pt-3 text-sm',
        size === 'lg' && 'min-w-24 px-4 pb-2 pt-4 text-xl',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-1/2 -translate-x-1/2 rounded-full bg-background ring-1 ring-tag-foreground/20',
          size === 'lg' ? 'top-1.5 size-2' : 'top-1 size-1.5',
        )}
      />
      <span className="sr-only">شماره گوشواره </span>
      {fa(value)}
    </span>
  )
}

const STATUS_STYLE: Record<AnimalStatus, string> = {
  active: 'bg-success/15 text-success',
  sold: 'bg-secondary text-secondary-foreground',
  dead: 'bg-destructive/12 text-destructive',
  culled: 'bg-warning/20 text-tag-foreground',
}

export function StatusBadge({ status }: { status: AnimalStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function AnimalAvatar({ animal, className }: { animal: Animal; className?: string }) {
  if (animal.photo) {
    return (
      <Image
        src={animal.photo || '/placeholder.svg'}
        alt={`عکس دام ${animal.earTag}`}
        width={96}
        height={96}
        unoptimized
        className={cn('size-12 shrink-0 rounded-lg object-cover', className)}
      />
    )
  }
  return (
    <div
      aria-hidden
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-secondary-foreground',
        className,
      )}
    >
      {animal.sex === 'male' ? 'قوچ' : 'میش'}
    </div>
  )
}

export function AnimalLink({ animal, fallback }: { animal?: Animal; fallback?: string }) {
  if (!animal) return <span className="text-muted-foreground">{fallback || 'نامشخص'}</span>
  return (
    <Link href={`/animals/view?id=${animal.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
      {animal.name ? `${animal.name} · ` : ''}
      {fa(animal.earTag)}
    </Link>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function NativeSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-10 w-full appearance-none rounded-lg border border-input bg-card pe-3 ps-9 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-balance md:text-3xl">{title}</h1>
        {description ? <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {description ? <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  )
}

export function LoadingBlock() {
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">در حال بارگذاری</span>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  )
}
