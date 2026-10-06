'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { LoadingBlock, NativeSelect, PageHeader, StatTile } from '@/components/flock-ui'
import { EASE_LABEL, EXIT_TYPE_LABEL } from '@/lib/constants'
import { currentJalaliYear, diffDays, fa, formatJalali, isoToJalaliParts, todayISO } from '@/lib/date'
import { animalRationHistory, averageDailyGain, rationForPenAtDate, useFlock } from '@/lib/flock'
import { downloadCsv } from '@/lib/export'

const breedChart = { count: { label: 'تعداد', color: 'var(--chart-1)' } } satisfies ChartConfig

const pct = (a: number, b: number) => (b ? `${fa(Math.round((a / b) * 100))}٪` : '—')

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export function Reports() {
  const data = useFlock()
  const [year, setYear] = useState<number>(currentJalaliYear())
  const [rationAnimalId, setRationAnimalId] = useState<number | undefined>()
  if (!data) return <LoadingBlock />

  const today = todayISO()
  const inYear = (iso: string) => isoToJalaliParts(iso).jy === year
  const active = data.animals.filter((a) => a.status === 'active')
  const ageDays = (iso?: string) => (iso ? diffDays(iso, today) : Infinity)

  const comp = {
    ewes: active.filter((a) => a.sex === 'female' && ageDays(a.birthDate) >= 365).length,
    rams: active.filter((a) => a.sex === 'male' && ageDays(a.birthDate) >= 365).length,
    youngF: active.filter((a) => a.sex === 'female' && ageDays(a.birthDate) < 365).length,
    youngM: active.filter((a) => a.sex === 'male' && ageDays(a.birthDate) < 365).length,
  }

  const breedCounts = Object.entries(
    active.reduce<Record<string, number>>((acc, a) => ((acc[a.breed] = (acc[a.breed] ?? 0) + 1), acc), {}),
  )
    .map(([breed, count]) => ({ breed, count }))
    .sort((a, b) => b.count - a.count)

  const matings = data.matings.filter((m) => inYear(m.date))
  const matedEwes = new Set(matings.map((m) => m.eweId)).size
  const conceived = matings.filter((m) => m.pregnancy === 'pregnant' || m.closed).length
  const checked = matings.filter((m) => m.pregnancy !== 'unknown' || m.closed).length
  const lambings = data.lambings.filter((l) => inYear(l.date))
  const lambsBorn = lambings.reduce((s, l) => s + l.total, 0)
  const lambsAlive = lambings.reduce((s, l) => s + l.alive, 0)
  const multiples = lambings.filter((l) => l.total > 1).length
  const easeCounts = lambings.reduce<Record<string, number>>((acc, l) => ((acc[l.ease] = (acc[l.ease] ?? 0) + 1), acc), {})

  const yearLambs = data.animals.filter((a) => a.birthDate && inYear(a.birthDate) && a.origin === 'born')
  const birthWeights = (sex: 'male' | 'female') => yearLambs.filter((a) => a.sex === sex && a.birthWeight).map((a) => a.birthWeight!)
  const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : undefined)
  const lambAdg = yearLambs
    .map((a) => averageDailyGain(data.weights.filter((w) => w.animalId === a.id)))
    .filter((x): x is number => x !== undefined)
  const lambDeaths = data.exits.filter((x) => x.type === 'dead' && inYear(x.date) && yearLambs.some((a) => a.id === x.animalId)).length

  const rationPenRows = data.pens.map((pen) => {
      const assignment = rationForPenAtDate(data, pen.id, today)
      const ration = assignment ? data.rations.find((r) => r.id === assignment.rationId) : undefined
      const animalCount = active.filter((a) => a.penId === pen.id).length
      return {
        pen,
        assignment,
        ration,
        animalCount,
        dailyFeedKg: ration?.dailyKgPerHead != null ? ration.dailyKgPerHead * animalCount : undefined,
      }
    })

  const rationAnimals = [...data.animals]
    .filter((a) => a.status === 'active')
    .sort((a, b) => a.earTag.localeCompare(b.earTag, 'fa', { numeric: true }))

  const selectedRationAnimal = data.animals.find((a) => a.id === rationAnimalId)
  const selectedRationHistory = selectedRationAnimal ? animalRationHistory(data, selectedRationAnimal.id!) : []

  function exportRationHistory() {
    if (!selectedRationAnimal) return
    downloadCsv(
      `ration-history-${selectedRationAnimal.earTag}.csv`,
      ['دام', 'از تاریخ', 'تا تاریخ', 'جایگاه', 'شماره جیره', 'نام جیره', 'مصرف ثبت‌شده هر رأس در روز'],
      selectedRationHistory.map((row) => {
        const ration = row.rationId ? data.rations.find((r) => r.id === row.rationId) : undefined
        return [
          selectedRationAnimal.earTag,
          formatJalali(row.startDate),
          row.endDate ? formatJalali(row.endDate) : '',
          row.penName,
          row.rationCode ? `جیره ${row.rationCode}` : 'ثبت نشده',
          row.rationName ?? '',
          ration?.dailyKgPerHead ?? '',
        ]
      }),
    )
  }

  const diseases = data.diseases.filter((d) => inYear(d.date))
  const diseaseFreq = Object.entries(diseases.reduce<Record<string, number>>((acc, d) => ((acc[d.name] = (acc[d.name] ?? 0) + 1), acc), {})).sort((a, b) => b[1] - a[1])
  const treatmentCost = data.treatments.filter((t) => inYear(t.date)).reduce((s, t) => s + (t.cost ?? 0), 0)
  const vaccinations = data.vaccinations.filter((v) => inYear(v.date)).length

  const exits = data.exits.filter((x) => inYear(x.date))
  const sold = exits.filter((x) => x.type === 'sold')
  const revenue = sold.reduce((s, x) => s + (x.price ?? 0), 0)
  const deaths = exits.filter((x) => x.type === 'dead')
  const avgHerd = active.length + exits.length
  const deathCauses = Object.entries(deaths.reduce<Record<string, number>>((acc, d) => ((acc[d.reason || 'نامشخص'] = (acc[d.reason || 'نامشخص'] ?? 0) + 1), acc), {}))

  const years = Array.from(
    new Set([currentJalaliYear(), ...data.lambings.map((l) => isoToJalaliParts(l.date).jy), ...data.matings.map((m) => isoToJalaliParts(m.date).jy)]),
  ).sort((a, b) => b - a)

  function exportSummary() {
    downloadCsv(`report-${year}.csv`, ['شاخص', 'مقدار'], [
      ['سال', year],
      ['دام فعال', active.length],
      ['میش بالغ', comp.ewes],
      ['قوچ بالغ', comp.rams],
      ['میش جفت‌گیری‌شده', matedEwes],
      ['نرخ آبستنی', pct(conceived, checked)],
      ['تعداد زایش', lambings.length],
      ['بره متولد', lambsBorn],
      ['بره زنده', lambsAlive],
      ['دوقلوزایی (بره در هر زایش)', lambings.length ? (lambsBorn / lambings.length).toFixed(2) : ''],
      ['تلفات بره', lambDeaths],
      ['هزینه درمان (تومان)', treatmentCost],
      ['فروش (رأس)', sold.length],
      ['درآمد فروش (تومان)', revenue],
      ['تلفات (رأس)', deaths.length],
    ])
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="گزارش‌ها و آمار گله"
        description="شاخص‌های کلیدی ترکیب گله، تولیدمثل، رشد، سلامت و خروجی‌ها"
        actions={
          <>
            <NativeSelect aria-label="سال گزارش" value={year} onChange={(e) => setYear(Number(e.target.value))} className="h-11 w-32">
              {years.map((y) => <option key={y} value={y}>سال {fa(String(y))}</option>)}
            </NativeSelect>
            <Button variant="outline" size="lg" className="bg-card" onClick={exportSummary}><Download aria-hidden /> CSV</Button>
            <Button variant="outline" size="lg" className="bg-card print:hidden" onClick={() => window.print()}><Printer aria-hidden /> چاپ</Button>
          </>
        }
      />

      <Section title="ترکیب گله (دام‌های فعال)">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatTile label="کل دام فعال" value={fa(active.length)} />
          <StatTile label="میش بالغ" value={fa(comp.ewes)} />
          <StatTile label="قوچ بالغ" value={fa(comp.rams)} />
          <StatTile label="بره / شیشک ماده" value={fa(comp.youngF)} sub="زیر یک سال" />
          <StatTile label="بره / شیشک نر" value={fa(comp.youngM)} sub="زیر یک سال" />
        </div>
        {breedCounts.length ? (
          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">توزیع نژاد</h3>
            <ChartContainer config={breedChart} className="aspect-auto h-56 w-full" dir="ltr">
              <BarChart data={breedCounts} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="breed" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        ) : null}
      </Section>

      <Section title={`تولیدمثل — سال ${fa(String(year))}`}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="میش جفت‌گیری‌شده" value={fa(matedEwes)} />
          <StatTile label="نرخ آبستنی" value={pct(conceived, checked)} sub={`از ${fa(checked)} تشخیص`} />
          <StatTile label="تعداد زایش" value={fa(lambings.length)} sub={`${fa(multiples)} چندقلوزایی`} />
          <StatTile label="بره در هر زایش" value={lambings.length ? fa(lambsBorn / lambings.length, 2) : '—'} />
          <StatTile label="بره متولد" value={fa(lambsBorn)} />
          <StatTile label="بره زنده هنگام تولد" value={fa(lambsAlive)} sub={pct(lambsAlive, lambsBorn)} />
          <StatTile label="نرخ بره‌زایی" value={pct(lambsAlive, matedEwes)} sub="بره زنده به میش جفت‌گیری‌شده" />
          <StatTile label="تلفات بره پس از تولد" value={fa(lambDeaths)} sub={pct(lambDeaths, yearLambs.length)} />
        </div>
        {lambings.length ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(easeCounts).map(([k, v]) => (
              <span key={k} className="rounded-full border bg-card px-3 py-1 text-sm">
                {EASE_LABEL[k as keyof typeof EASE_LABEL]}: <strong>{fa(v)}</strong>
              </span>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="رشد بره‌ها">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="بره‌های متولد امسال" value={fa(yearLambs.length)} />
          <StatTile label="میانگین وزن تولد نر" value={avg(birthWeights('male')) ? `${fa(avg(birthWeights('male'))!, 1)} کیلو` : '—'} />
          <StatTile label="میانگین وزن تولد ماده" value={avg(birthWeights('female')) ? `${fa(avg(birthWeights('female'))!, 1)} کیلو` : '—'} />
          <StatTile label="میانگین افزایش وزن روزانه" value={avg(lambAdg) ? `${fa(Math.round(avg(lambAdg)!))} گرم` : '—'} />
        </div>
      </Section>

      <Section title="جیره و تغذیه">
        <div className="grid gap-3 md:grid-cols-2">
          <StatTile
            label="جایگاه‌های دارای جیره"
            value={fa(rationPenRows.filter((x) => x.ration).length)}
            sub={`از ${fa(data.pens.length)} جایگاه`}
          />
          <StatTile
            label="دام‌های فعال دارای جیره"
            value={fa(active.filter((a) => rationForPenAtDate(data, a.penId, today)).length)}
            sub={`از ${fa(active.length)} دام فعال`}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/60 text-right">
              <tr>
                <th className="p-3">جایگاه</th>
                <th className="p-3">دام فعال</th>
                <th className="p-3">جیره فعلی</th>
                <th className="p-3">مصرف/رأس/روز</th>
                <th className="p-3">مصرف کل/روز</th>
                <th className="p-3">از تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {rationPenRows.map(({ pen, assignment, ration, animalCount, dailyFeedKg }) => (
                <tr key={pen.id} className="border-t">
                  <td className="p-3 font-medium">{pen.name}</td>
                  <td className="p-3">{fa(animalCount)}</td>
                  <td className="p-3 font-semibold">{ration ? `جیره ${fa(ration.code)}${ration.name ? ` — ${ration.name}` : ''}` : 'ثبت نشده'}</td>
                  <td className="p-3">{ration?.dailyKgPerHead != null ? `${fa(ration.dailyKgPerHead)} کیلو` : '—'}</td>
                  <td className="p-3">{dailyFeedKg != null ? `${fa(dailyFeedKg)} کیلو` : '—'}</td>
                  <td className="p-3">{assignment ? formatJalali(assignment.startDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <NativeSelect
                aria-label="انتخاب دام برای گزارش سابقه جیره"
                value={rationAnimalId ?? ''}
                onChange={(e) => setRationAnimalId(e.target.value ? Number(e.target.value) : undefined)}
                className="h-11"
              >
                <option value="">انتخاب دام برای مشاهده سابقه جیره…</option>
                {rationAnimals.map((a) => (
                  <option key={a.id} value={a.id}>{fa(a.earTag)}{a.name ? ` — ${a.name}` : ''}</option>
                ))}
              </NativeSelect>
            </div>
            <Button variant="outline" onClick={exportRationHistory} disabled={!selectedRationAnimal || !selectedRationHistory.length} className="bg-card">
              <Download aria-hidden /> خروجی سابقه جیره
            </Button>
          </div>

          {selectedRationAnimal ? (
            selectedRationHistory.length ? (
              <div className="mt-4 overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/60 text-right">
                    <tr>
                      <th className="p-3">از</th>
                      <th className="p-3">تا</th>
                      <th className="p-3">جایگاه</th>
                      <th className="p-3">جیره</th>
                      <th className="p-3">مصرف/روز</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRationHistory.map((row, index) => {
                      const ration = row.rationId ? data.rations.find((r) => r.id === row.rationId) : undefined
                      return (
                        <tr key={`${row.startDate}-${row.penId ?? 'none'}-${row.rationId ?? 'none'}-${index}`} className="border-t">
                          <td className="p-3 whitespace-nowrap">{formatJalali(row.startDate)}</td>
                          <td className="p-3 whitespace-nowrap">{row.endDate ? formatJalali(row.endDate) : 'تا امروز'}</td>
                          <td className="p-3">{row.penName}</td>
                          <td className="p-3 font-semibold">{row.rationCode ? `جیره ${fa(row.rationCode)}${row.rationName ? ` — ${row.rationName}` : ''}` : 'ثبت نشده'}</td>
                          <td className="p-3">{ration?.dailyKgPerHead != null ? `${fa(ration.dailyKgPerHead)} کیلو/رأس/روز` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="mt-4 text-sm text-muted-foreground">برای این دام هنوز سابقه جیره‌ای ثبت نشده است.</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">با انتخاب دام، سابقه جیره بر اساس جایگاه‌های طی‌شده نمایش داده می‌شود.</p>
          )}
        </div>
      </Section>

      <Section title="سلامت">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="موارد بیماری" value={fa(diseases.length)} />
          <StatTile label="بیماری فعال (اکنون)" value={fa(data.diseases.filter((d) => d.status === 'active').length)} />
          <StatTile label="واکسن تزریق‌شده" value={fa(vaccinations)} sub="دُز" />
          <StatTile label="هزینه درمان" value={`${fa(treatmentCost)}`} sub="تومان" />
        </div>
        {diseaseFreq.length ? (
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {diseaseFreq.map(([name, count]) => (
              <li key={name} className="flex items-center justify-between p-3 text-sm">
                <span>{name}</span>
                <span className="font-semibold">{fa(count)} مورد</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      <Section title="فروش، حذف و تلفات">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="فروش" value={`${fa(sold.length)} رأس`} />
          <StatTile label="درآمد فروش" value={fa(revenue)} sub="تومان" />
          <StatTile label="حذف" value={`${fa(exits.filter((x) => x.type === 'culled').length)} رأس`} />
          <StatTile label="تلفات" value={`${fa(deaths.length)} رأس`} sub={`نرخ تلفات ${pct(deaths.length, avgHerd)}`} />
        </div>
        {deathCauses.length ? (
          <ul className="flex flex-col divide-y rounded-xl border bg-card">
            {deathCauses.map(([cause, count]) => (
              <li key={cause} className="flex items-center justify-between p-3 text-sm">
                <span>{EXIT_TYPE_LABEL.dead}: {cause}</span>
                <span className="font-semibold">{fa(count)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>
    </div>
  )
}
