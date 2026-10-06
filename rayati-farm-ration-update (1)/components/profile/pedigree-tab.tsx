'use client'

import Link from 'next/link'
import type { Animal, FlockData } from '@/lib/db'
import { SEX_SHORT } from '@/lib/constants'
import { fa, formatJalali } from '@/lib/date'
import { cn } from '@/lib/utils'
import { RecordTable } from '@/components/profile/record-table'
import { AnimalLink } from '@/components/flock-ui'

interface Node {
  role: string
  animal?: Animal
  label?: string
}

function PedigreeCard({ node, highlight }: { node: Node; highlight?: boolean }) {
  const content = (
    <div
      className={cn(
        'flex min-h-16 flex-col justify-center gap-0.5 rounded-lg border bg-card px-3 py-2 text-sm',
        highlight && 'border-primary bg-primary text-primary-foreground',
        !node.animal && !node.label && 'border-dashed text-muted-foreground',
      )}
    >
      <span className={cn('text-xs', highlight ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{node.role}</span>
      {node.animal ? (
        <>
          <span className="font-semibold">
            {fa(node.animal.earTag)}
            {node.animal.name ? ` · ${node.animal.name}` : ''}
          </span>
          <span className={cn('text-xs', highlight ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{node.animal.breed}</span>
        </>
      ) : (
        <span className="font-medium">{node.label || 'نامشخص'}</span>
      )}
    </div>
  )
  if (node.animal && !highlight) {
    return (
      <Link href={`/animals/view?id=${node.animal.id}`} className="block transition-opacity hover:opacity-80">
        {content}
      </Link>
    )
  }
  return content
}

export function PedigreeTab({ data, animal }: { data: FlockData; animal: Animal }) {
  const find = (id?: number) => data.animals.find((a) => a.id === id)
  const sire = find(animal.sireId)
  const dam = find(animal.damId)
  const gp = (parent: Animal | undefined, which: 'sire' | 'dam') => {
    const a = parent ? find(which === 'sire' ? parent.sireId : parent.damId) : undefined
    return { animal: a, label: parent ? (which === 'sire' ? parent.sireLabel : parent.damLabel) : undefined }
  }

  const offspring = data.animals
    .filter((a) => a.sireId === animal.id || a.damId === animal.id)
    .sort((a, b) => (b.birthDate ?? '').localeCompare(a.birthDate ?? ''))

  const siblings = data.animals.filter(
    (a) => a.id !== animal.id && ((animal.damId && a.damId === animal.damId) || (animal.sireId && a.sireId === animal.sireId)),
  )

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border bg-muted/40 p-4">
        <h3 className="mb-4 font-semibold">شجره‌نامه (سه نسل)</h3>
        <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <PedigreeCard node={{ role: 'دام', animal }} highlight />
          </div>
          <div className="flex flex-col gap-3">
            <PedigreeCard node={{ role: 'پدر', animal: sire, label: animal.sireLabel }} />
            <PedigreeCard node={{ role: 'مادر', animal: dam, label: animal.damLabel }} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <PedigreeCard node={{ role: 'پدرِ پدر', ...gp(sire, 'sire') }} />
            <PedigreeCard node={{ role: 'مادرِ پدر', ...gp(sire, 'dam') }} />
            <PedigreeCard node={{ role: 'پدرِ مادر', ...gp(dam, 'sire') }} />
            <PedigreeCard node={{ role: 'مادرِ مادر', ...gp(dam, 'dam') }} />
          </div>
        </div>
      </section>

      <RecordTable
        title={`فرزندان (${fa(offspring.length)})`}
        rows={offspring}
        columns={[
          { header: 'گوشواره', cell: (r) => <AnimalLink animal={r} /> },
          { header: 'جنسیت', cell: (r) => SEX_SHORT[r.sex] },
          { header: 'تاریخ تولد', cell: (r) => formatJalali(r.birthDate) },
          { header: animal.sex === 'male' ? 'مادر' : 'پدر', cell: (r) => <AnimalLink animal={find(animal.sex === 'male' ? r.damId : r.sireId)} fallback={animal.sex === 'male' ? r.damLabel : r.sireLabel} /> },
        ]}
      />

      <RecordTable
        title={`خواهر و برادرها (${fa(siblings.length)})`}
        rows={siblings}
        columns={[
          { header: 'گوشواره', cell: (r) => <AnimalLink animal={r} /> },
          { header: 'جنسیت', cell: (r) => SEX_SHORT[r.sex] },
          { header: 'نسبت', cell: (r) => (r.damId === animal.damId && r.sireId === animal.sireId ? 'تنی' : 'ناتنی') },
          { header: 'تاریخ تولد', cell: (r) => formatJalali(r.birthDate) },
        ]}
      />
    </div>
  )
}
