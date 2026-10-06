'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { StatTile } from '@/components/flock-ui'
import { RecordTable } from '@/components/profile/record-table'
import type { Animal, FlockData } from '@/lib/db'
import { bcsLabel } from '@/lib/constants'
import { diffDays, fa, formatAge, formatJalali } from '@/lib/date'
import { averageDailyGain } from '@/lib/flock'
import type { RecordKind } from '@/components/record-dialog'

const chartConfig = {
  weight: { label: 'وزن (کیلوگرم)', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function WeightTab({ data, animal, open }: { data: FlockData; animal: Animal; open: (k: RecordKind) => void }) {
  const weights = data.weights.filter((w) => w.animalId === animal.id).sort((a, b) => a.date.localeCompare(b.date))
  const bcs = data.bcs.filter((w) => w.animalId === animal.id).sort((a, b) => b.date.localeCompare(a.date))
  const adg = averageDailyGain(weights)
  const last = weights[weights.length - 1]
  const prev = weights[weights.length - 2]
  const recentAdg = last && prev && diffDays(prev.date, last.date) > 0 ? ((last.weight - prev.weight) * 1000) / diffDays(prev.date, last.date) : undefined

  const chartData = weights.map((w) => ({ date: formatJalali(w.date), weight: w.weight }))
  const tableRows = [...weights].reverse().map((w, i, arr) => {
    const before = arr[i + 1]
    const days = before ? diffDays(before.date, w.date) : 0
    return { ...w, gain: before && days > 0 ? ((w.weight - before.weight) * 1000) / days : undefined }
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="وزن فعلی" value={last ? `${fa(last.weight)} کیلو` : '—'} sub={last ? formatJalali(last.date) : undefined} />
        <StatTile label="افزایش وزن روزانه (کل)" value={adg !== undefined ? `${fa(Math.round(adg))} گرم` : '—'} />
        <StatTile label="افزایش وزن روزانه (اخیر)" value={recentAdg !== undefined ? `${fa(Math.round(recentAdg))} گرم` : '—'} />
        <StatTile label="سن" value={formatAge(animal.birthDate)} />
      </div>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">روند رشد</h3>
          <Button size="sm" variant="outline" onClick={() => open('weight')}>ثبت وزن</Button>
        </div>
        {weights.length >= 2 ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full" dir="ltr">
            <LineChart data={chartData} margin={{ left: 0, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} width={36} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="weight" type="monotone" stroke="var(--color-weight)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--color-weight)' }} />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">برای نمایش نمودار، حداقل دو وزن ثبت کنید.</p>
        )}
      </section>

      <RecordTable
        title="سوابق وزن‌کشی"
        table="weights"
        rows={tableRows}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'وزن', cell: (r) => <span className="font-semibold">{fa(r.weight)} کیلو</span> },
          { header: 'افزایش روزانه', cell: (r) => (r.gain !== undefined ? <span className={r.gain < 0 ? 'text-destructive' : ''}>{fa(Math.round(r.gain))} گرم</span> : '—') },
          { header: 'سن', cell: (r) => formatAge(animal.birthDate, r.date) },
          { header: 'یادداشت', cell: (r) => r.note ?? '—' },
        ]}
      />

      <RecordTable
        title="نمره وضعیت بدنی (BCS)"
        table="bcs"
        rows={bcs}
        action={<Button size="sm" variant="outline" onClick={() => open('bcs')}>ثبت BCS</Button>}
        columns={[
          { header: 'تاریخ', cell: (r) => formatJalali(r.date) },
          { header: 'نمره', cell: (r) => <span className="font-semibold">{fa(r.score)}</span> },
          { header: 'ارزیابی', cell: (r) => bcsLabel(r.score) },
          { header: 'یادداشت', cell: (r) => r.note ?? '—' },
        ]}
      />
    </div>
  )
}
