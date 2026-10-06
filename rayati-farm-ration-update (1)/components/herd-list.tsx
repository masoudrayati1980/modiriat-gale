'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Download, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AnimalAvatar, EarTag, EmptyState, LoadingBlock, NativeSelect, PageHeader, StatusBadge } from '@/components/flock-ui'
import type { AnimalStatus, Sex } from '@/lib/db'
import { SEX_SHORT, STATUS_LABEL } from '@/lib/constants'
import { diffDays, fa, formatAge, formatJalali, todayISO } from '@/lib/date'
import { latestBcs, latestWeight, reproductiveStatus, useFlock } from '@/lib/flock'
import { downloadCsv } from '@/lib/export'

type AgeGroup = 'all' | 'lamb' | 'young' | 'adult'

export function HerdList() {
  const data = useFlock()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState<AnimalStatus | 'all'>('active')
  const [sex, setSex] = useState<Sex | 'all'>('all')
  const [breed, setBreed] = useState('all')
  const [pen, setPen] = useState(params.get('pen') ?? 'all')
  const [age, setAge] = useState<AgeGroup>('all')

  const rows = useMemo(() => {
    if (!data) return []
    const today = todayISO()
    const term = q.trim().toLowerCase()
    return data.animals
      .filter((a) => status === 'all' || a.status === status)
      .filter((a) => sex === 'all' || a.sex === sex)
      .filter((a) => breed === 'all' || a.breed === breed)
      .filter((a) => pen === 'all' || String(a.penId ?? 'none') === pen)
      .filter((a) => {
        if (age === 'all') return true
        if (!a.birthDate) return age === 'adult'
        const days = diffDays(a.birthDate, today)
        if (age === 'lamb') return days < 180
        if (age === 'young') return days >= 180 && days < 365
        return days >= 365
      })
      .filter((a) => !term || [a.earTag, a.code, a.name ?? '', a.breed, a.color ?? ''].some((v) => v.toLowerCase().includes(term)))
      .sort((a, b) => a.earTag.localeCompare(b.earTag, 'fa', { numeric: true }))
      .map((a) => ({
        animal: a,
        weight: latestWeight(data, a.id!),
        bcs: latestBcs(data, a.id!),
        repro: reproductiveStatus(data, a),
        pen: data.pens.find((p) => p.id === a.penId)?.name,
      }))
  }, [data, q, status, sex, breed, pen, age])

  if (!data) return <LoadingBlock />

  const breeds = Array.from(new Set(data.animals.map((a) => a.breed))).sort()

  function exportCsv() {
    downloadCsv(
      'galle.csv',
      ['کد', 'گوشواره', 'نام', 'جنسیت', 'نژاد', 'تاریخ تولد', 'وضعیت', 'جایگاه', 'آخرین وزن', 'BCS', 'وضعیت تولیدمثل'],
      rows.map((r) => [
        r.animal.code, r.animal.earTag, r.animal.name ?? '', SEX_SHORT[r.animal.sex], r.animal.breed, formatJalali(r.animal.birthDate),
        STATUS_LABEL[r.animal.status], r.pen ?? '', r.weight?.weight ?? '', r.bcs?.score ?? '', r.repro,
      ]),
    )
  }

  return (
    <div>
      <PageHeader
        title="گله"
        description={`${fa(rows.length)} دام مطابق فیلترها`}
        actions={
          <>
            <Button variant="outline" size="lg" onClick={exportCsv} className="bg-card">
              <Download aria-hidden /> خروجی اکسل (CSV)
            </Button>
            <Button size="lg" nativeButton={false} render={<Link href="/animals/new" />}>
              <Plus aria-hidden /> دام جدید
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="جستجو" placeholder="جستجو: گوشواره، کد، نام، نژاد…" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 pr-9" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <NativeSelect aria-label="وضعیت" value={status} onChange={(e) => setStatus(e.target.value as AnimalStatus | 'all')}>
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
          <NativeSelect aria-label="جنسیت" value={sex} onChange={(e) => setSex(e.target.value as Sex | 'all')}>
            <option value="all">نر و ماده</option>
            <option value="female">میش‌ها</option>
            <option value="male">قوچ‌ها</option>
          </NativeSelect>
          <NativeSelect aria-label="نژاد" value={breed} onChange={(e) => setBreed(e.target.value)}>
            <option value="all">همه نژادها</option>
            {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
          </NativeSelect>
          <NativeSelect aria-label="جایگاه" value={pen} onChange={(e) => setPen(e.target.value)}>
            <option value="all">همه جایگاه‌ها</option>
            {data.pens.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            <option value="none">بدون جایگاه</option>
          </NativeSelect>
          <NativeSelect aria-label="گروه سنی" value={age} onChange={(e) => setAge(e.target.value as AgeGroup)} className="col-span-2 md:col-span-1">
            <option value="all">همه سنین</option>
            <option value="lamb">بره (زیر ۶ ماه)</option>
            <option value="young">شیشک / تیشتر (۶–۱۲ ماه)</option>
            <option value="adult">بالغ (بالای ۱ سال)</option>
          </NativeSelect>
        </div>
      </div>

      {!rows.length ? (
        <EmptyState title="دامی پیدا نشد" description="فیلترها را تغییر دهید یا دام جدید ثبت کنید." />
      ) : (
        <>
          <ul className="flex flex-col gap-2 md:hidden">
            {rows.map(({ animal, weight, repro }) => (
              <li key={animal.id}>
                <Link href={`/animals/view?id=${animal.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-3 active:bg-muted">
                  <AnimalAvatar animal={animal} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{animal.name || SEX_SHORT[animal.sex]}</span>
                      <span className="text-xs text-muted-foreground">{animal.breed}</span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {formatAge(animal.birthDate)} · {weight ? `${fa(weight.weight)} کیلو` : 'بدون وزن'} · {repro}
                    </span>
                  </div>
                  <EarTag value={animal.earTag} size="sm" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-right text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">گوشواره</th>
                  <th scope="col" className="px-4 py-3 font-medium">دام</th>
                  <th scope="col" className="px-4 py-3 font-medium">سن</th>
                  <th scope="col" className="px-4 py-3 font-medium">وزن</th>
                  <th scope="col" className="px-4 py-3 font-medium">BCS</th>
                  <th scope="col" className="px-4 py-3 font-medium">جایگاه</th>
                  <th scope="col" className="px-4 py-3 font-medium">تولیدمثل</th>
                  <th scope="col" className="px-4 py-3 font-medium">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ animal, weight, bcs, repro, pen: penName }) => (
                  <tr key={animal.id} className="border-t transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <Link href={`/animals/view?id=${animal.id}`} className="inline-block" aria-label={`پرونده دام ${animal.earTag}`}>
                        <EarTag value={animal.earTag} size="sm" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/animals/view?id=${animal.id}`} className="flex items-center gap-3">
                        <AnimalAvatar animal={animal} className="size-10" />
                        <span className="flex flex-col">
                          <span className="font-semibold">{animal.name || SEX_SHORT[animal.sex]}</span>
                          <span className="text-xs text-muted-foreground">{SEX_SHORT[animal.sex]} · {animal.breed}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatAge(animal.birthDate)}</td>
                    <td className="px-4 py-3">{weight ? `${fa(weight.weight)} کیلو` : '—'}</td>
                    <td className="px-4 py-3">{bcs ? fa(bcs.score) : '—'}</td>
                    <td className="px-4 py-3">{penName ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{repro}</td>
                    <td className="px-4 py-3"><StatusBadge status={animal.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
