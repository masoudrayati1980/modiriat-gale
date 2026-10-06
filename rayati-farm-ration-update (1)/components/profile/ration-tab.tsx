'use client'

import type { Animal, FlockData } from '@/lib/db'
import { animalRationHistory } from '@/lib/flock'
import { fa, formatJalali } from '@/lib/date'

export function RationTab({ data, animal }: { data: FlockData; animal: Animal }) {
  const history = animalRationHistory(data, animal.id!)

  if (!history.length) {
    return <section className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">هنوز سابقه جیره‌ای برای این دام ثبت نشده است.</p></section>
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-6">
      <div>
        <h3 className="font-semibold">سابقه جیره و جایگاه</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          این جدول جیره ثبت‌شده برای جایگاهی را نشان می‌دهد که دام در هر بازه در آن قرار داشته است. برای تاریخ‌های بدون جیره، «ثبت نشده» نمایش داده می‌شود.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-muted/60 text-right">
            <tr>
              <th className="p-3">از تاریخ</th>
              <th className="p-3">تا تاریخ</th>
              <th className="p-3">جایگاه</th>
              <th className="p-3">جیره</th>
              <th className="p-3">مصرف ثبت‌شده</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row, index) => {
              const ration = row.rationId ? data.rations.find((r) => r.id === row.rationId) : undefined
              return (
                <tr key={`${row.startDate}-${row.penId ?? 'none'}-${row.rationId ?? 'none'}-${index}`} className="border-t">
                  <td className="p-3 whitespace-nowrap">{formatJalali(row.startDate)}</td>
                  <td className="p-3 whitespace-nowrap">{row.endDate ? formatJalali(row.endDate) : 'تا امروز'}</td>
                  <td className="p-3">{row.penName}</td>
                  <td className="p-3 font-semibold">
                    {row.rationCode ? `جیره ${fa(row.rationCode)}${row.rationName ? ` — ${row.rationName}` : ''}` : 'ثبت نشده'}
                  </td>
                  <td className="p-3">
                    {ration?.dailyKgPerHead != null ? `${fa(ration.dailyKgPerHead)} کیلو/رأس/روز` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
