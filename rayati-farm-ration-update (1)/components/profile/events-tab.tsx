'use client'

import { Button } from '@/components/ui/button'
import { RecordTable } from '@/components/profile/record-table'
import type { Animal, FlockData } from '@/lib/db'
import { EVENT_CATEGORY_LABEL, EXIT_TYPE_LABEL } from '@/lib/constants'
import { fa, formatJalali } from '@/lib/date'
import type { RecordKind } from '@/components/record-dialog'

const desc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

export function EventsTab({ data, animal, open }: { data: FlockData; animal: Animal; open: (k: RecordKind) => void }) {
  const id = animal.id!
  const penName = (pid?: number) => data.pens.find((p) => p.id === pid)?.name ?? '—'

  return (
    <div className="flex flex-col gap-4">
      <RecordTable
        title="رویدادهای عمومی"
        table="events"
        rows={data.events.filter((e) => e.animalId === id).sort(desc)}
        action={<Button size="sm" variant="outline" onClick={() => open('event')}>ثبت رویداد</Button>}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'نوع', cell: (r) => EVENT_CATEGORY_LABEL[r.category] },
          { header: 'عنوان', cell: (r) => <span className="font-medium">{r.title}</span> },
          { header: 'توضیحات', cell: (r) => <span className="text-muted-foreground">{r.description ?? '—'}</span> },
        ]}
      />
      <RecordTable
        title="جابه‌جایی بین جایگاه‌ها"
        table="movements"
        rows={data.movements.filter((e) => e.animalId === id).sort(desc)}
        action={<Button size="sm" variant="outline" onClick={() => open('movement')}>جابه‌جایی</Button>}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'از', cell: (r) => penName(r.fromPenId) },
          { header: 'به', cell: (r) => <span className="font-medium">{penName(r.toPenId)}</span> },
          { header: 'دلیل', cell: (r) => r.reason ?? '—' },
        ]}
      />
      <RecordTable
        title="فروش / حذف / تلفات"
        table="exits"
        rows={data.exits.filter((e) => e.animalId === id).sort(desc)}
        action={animal.status === 'active' ? <Button size="sm" variant="outline" onClick={() => open('exit')}>ثبت خروج</Button> : undefined}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'نوع', cell: (r) => EXIT_TYPE_LABEL[r.type] },
          { header: 'دلیل', cell: (r) => r.reason ?? '—' },
          { header: 'مبلغ', cell: (r) => (r.price ? `${fa(r.price)} تومان` : '—') },
          { header: 'خریدار', cell: (r) => r.buyer ?? '—' },
        ]}
      />
    </div>
  )
}
