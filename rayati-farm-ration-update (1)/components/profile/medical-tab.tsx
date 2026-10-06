'use client'

import { Button } from '@/components/ui/button'
import { RecordTable } from '@/components/profile/record-table'
import { db, type Animal, type FlockData } from '@/lib/db'
import { DISEASE_STATUS_LABEL, ROUTE_LABEL, SEVERITY_LABEL, TREATMENT_TYPE_LABEL } from '@/lib/constants'
import { addDays, fa, formatJalali, todayISO } from '@/lib/date'
import type { RecordKind } from '@/components/record-dialog'

const desc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

export function MedicalTab({ data, animal, open }: { data: FlockData; animal: Animal; open: (k: RecordKind) => void }) {
  const id = animal.id!
  const diseases = data.diseases.filter((d) => d.animalId === id).sort(desc)
  const treatments = data.treatments.filter((d) => d.animalId === id).sort(desc)
  const meds = data.medications.filter((d) => d.animalId === id).sort(desc)
  const vaccines = data.vaccinations.filter((d) => d.animalId === id).sort(desc)
  const today = todayISO()

  return (
    <div className="flex flex-col gap-4">
      <RecordTable
        title="بیماری‌ها و مشکلات"
        table="diseases"
        rows={diseases}
        action={<Button size="sm" variant="outline" onClick={() => open('disease')}>افزودن</Button>}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'بیماری', cell: (r) => <span className="font-medium">{r.name}</span> },
          { header: 'شدت', cell: (r) => SEVERITY_LABEL[r.severity] },
          {
            header: 'وضعیت',
            cell: (r) =>
              r.status === 'active' ? (
                <button
                  type="button"
                  className="rounded-full bg-destructive/12 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/20"
                  onClick={() => db.diseases.update(r.id!, { status: 'recovered', recoveredDate: today })}
                  title="علامت‌گذاری به‌عنوان بهبود یافته"
                >
                  درگیر — ثبت بهبود
                </button>
              ) : (
                <span className="text-xs">{DISEASE_STATUS_LABEL[r.status]}{r.recoveredDate ? ` (${formatJalali(r.recoveredDate)})` : ''}</span>
              ),
          },
          { header: 'علائم', cell: (r) => <span className="text-muted-foreground">{r.symptoms ?? '—'}</span> },
        ]}
      />
      <RecordTable
        title="درمان‌ها و اقدامات دامپزشکی"
        table="treatments"
        rows={treatments}
        action={<Button size="sm" variant="outline" onClick={() => open('treatment')}>افزودن</Button>}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'نوع', cell: (r) => TREATMENT_TYPE_LABEL[r.type] },
          { header: 'شرح', cell: (r) => r.description },
          { header: 'دامپزشک', cell: (r) => r.vet ?? '—' },
          { header: 'هزینه', cell: (r) => (r.cost ? `${fa(r.cost)} تومان` : '—') },
          {
            header: 'پیگیری',
            cell: (r) =>
              r.followUpDate ? (
                r.followUpDone ? (
                  <span className="text-xs text-success">انجام شد</span>
                ) : (
                  <button type="button" className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-tag-foreground hover:bg-warning/30" onClick={() => db.treatments.update(r.id!, { followUpDone: true })}>
                    {formatJalali(r.followUpDate)} — انجام شد؟
                  </button>
                )
              ) : (
                '—'
              ),
          },
        ]}
      />
      <RecordTable
        title="داروهای مصرف‌شده"
        table="medications"
        rows={meds}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'دارو', cell: (r) => <span className="font-medium">{r.drug}</span> },
          { header: 'دوز', cell: (r) => r.dose ?? '—' },
          { header: 'راه تجویز', cell: (r) => (r.route ? ROUTE_LABEL[r.route] : '—') },
          { header: 'مدت', cell: (r) => (r.durationDays ? `${fa(r.durationDays)} روز` : '—') },
          {
            header: 'پایان منع مصرف',
            cell: (r) => {
              if (!r.withdrawalDays) return '—'
              const end = addDays(addDays(r.date, r.durationDays ?? 0), r.withdrawalDays)
              return <span className={end >= today ? 'font-semibold text-destructive' : 'text-muted-foreground'}>{formatJalali(end)}</span>
            },
          },
        ]}
      />
      <RecordTable
        title="واکسیناسیون"
        table="vaccinations"
        rows={vaccines}
        action={<Button size="sm" variant="outline" onClick={() => open('vaccine')}>افزودن</Button>}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'واکسن', cell: (r) => <span className="font-medium">{r.vaccine}</span> },
          { header: 'دوز', cell: (r) => r.dose ?? '—' },
          { header: 'سری ساخت', cell: (r) => r.batch ?? '—' },
          { header: 'نوبت بعد', cell: (r) => (r.nextDueDate ? <span className={r.nextDueDate <= today ? 'font-semibold text-destructive' : ''}>{formatJalali(r.nextDueDate)}</span> : '—') },
        ]}
      />
    </div>
  )
}
