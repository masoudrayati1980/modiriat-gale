'use client'

import { Button } from '@/components/ui/button'
import { StatTile, AnimalLink } from '@/components/flock-ui'
import { RecordTable } from '@/components/profile/record-table'
import type { Animal, FlockData } from '@/lib/db'
import { EASE_LABEL, MATING_METHOD_LABEL, PREGNANCY_LABEL, SEX_SHORT } from '@/lib/constants'
import { diffDays, fa, formatJalali } from '@/lib/date'
import type { RecordKind } from '@/components/record-dialog'

const desc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

export function ReproTab({ data, animal, open }: { data: FlockData; animal: Animal; open: (k: RecordKind) => void }) {
  const id = animal.id!
  const find = (aid?: number) => data.animals.find((a) => a.id === aid)

  if (animal.sex === 'male') {
    const services = data.matings.filter((m) => m.ramId === id).sort(desc)
    const sired = data.lambings.filter((l) => l.sireId === id)
    const offspring = data.animals.filter((a) => a.sireId === id)
    const conceived = services.filter((m) => m.pregnancy === 'pregnant' || m.closed).length
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="جفت‌گیری‌ها" value={fa(services.length)} />
          <StatTile label="نرخ آبستنی" value={services.length ? `${fa(Math.round((conceived / services.length) * 100))}٪` : '—'} />
          <StatTile label="زایش‌های حاصل" value={fa(sired.length)} />
          <StatTile label="فرزندان ثبت‌شده" value={fa(offspring.length)} />
        </div>
        <RecordTable
          title="جفت‌گیری‌های این قوچ"
          rows={services}
          columns={[
            { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
            { header: 'میش', cell: (r) => <AnimalLink animal={find(r.eweId)} /> },
            { header: 'روش', cell: (r) => MATING_METHOD_LABEL[r.method] },
            { header: 'نتیجه', cell: (r) => PREGNANCY_LABEL[r.pregnancy] },
          ]}
        />
      </div>
    )
  }

  const matings = data.matings.filter((m) => m.eweId === id).sort(desc)
  const lambings = data.lambings.filter((l) => l.eweId === id).sort(desc)
  const lambs = data.lambs.filter((l) => l.damId === id)
  const totalLambs = lambings.reduce((s, l) => s + l.total, 0)
  const aliveLambs = lambings.reduce((s, l) => s + l.alive, 0)
  const sortedAsc = [...lambings].sort((a, b) => a.date.localeCompare(b.date))
  const intervals = sortedAsc.slice(1).map((l, i) => diffDays(sortedAsc[i].date, l.date))
  const avgInterval = intervals.length ? Math.round(intervals.reduce((s, x) => s + x, 0) / intervals.length) : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="تعداد زایش" value={fa(lambings.length)} />
        <StatTile label="کل بره‌ها" value={fa(totalLambs)} sub={`${fa(aliveLambs)} زنده`} />
        <StatTile label="میانگین بره در هر زایش" value={lambings.length ? fa(totalLambs / lambings.length, 1) : '—'} />
        <StatTile label="فاصله بین دو زایش" value={avgInterval ? `${fa(avgInterval)} روز` : '—'} />
      </div>
      <RecordTable
        title="جفت‌گیری و آبستنی"
        table="matings"
        rows={matings}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => open('pregnancy')}>تشخیص آبستنی</Button>
            <Button size="sm" variant="outline" onClick={() => open('mating')}>جفت‌گیری</Button>
          </div>
        }
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'قوچ', cell: (r) => (r.ramId ? <AnimalLink animal={find(r.ramId)} /> : r.ramLabel ?? '—') },
          { header: 'روش', cell: (r) => MATING_METHOD_LABEL[r.method] },
          { header: 'آبستنی', cell: (r) => `${PREGNANCY_LABEL[r.pregnancy]}${r.checkDate ? ` (${formatJalali(r.checkDate)})` : ''}` },
          { header: 'زایش پیش‌بینی', cell: (r) => (r.closed ? <span className="text-muted-foreground">زایش انجام شد</span> : formatJalali(r.expectedDate)) },
        ]}
      />
      <RecordTable
        title="زایش‌ها"
        table="lambings"
        rows={lambings}
        action={<Button size="sm" variant="outline" onClick={() => open('lambing')}>ثبت زایش</Button>}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'نوع', cell: (r) => EASE_LABEL[r.ease] },
          { header: 'تعداد', cell: (r) => fa(r.total) },
          { header: 'زنده / مرده', cell: (r) => `${fa(r.alive)} / ${fa(r.dead)}` },
          { header: 'پدر', cell: (r) => (r.sireId ? <AnimalLink animal={find(r.sireId)} /> : '—') },
        ]}
      />
      <RecordTable
        title="بره‌ها"
        rows={lambs}
        columns={[
          { header: 'تاریخ تولد', cell: (r) => formatJalali(data.lambings.find((l) => l.id === r.lambingId)?.date) },
          { header: 'جنسیت', cell: (r) => SEX_SHORT[r.sex] },
          { header: 'وزن تولد', cell: (r) => (r.birthWeight ? `${fa(r.birthWeight)} کیلو` : '—') },
          { header: 'وضعیت', cell: (r) => (r.alive ? 'زنده' : 'مرده‌زا') },
          { header: 'پرونده', cell: (r) => (r.animalId ? <AnimalLink animal={find(r.animalId)} /> : '—') },
        ]}
      />
    </div>
  )
}
