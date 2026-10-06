'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertList } from '@/components/alert-list'
import { EarTag, EmptyState, LoadingBlock } from '@/components/flock-ui'
import { useFlock, computeAlerts, buildTimeline, animalLabel } from '@/lib/flock'
import { addDays, diffDays, fa, formatJalali, formatJalaliLong, isoToJalaliParts, relativeDays, todayISO } from '@/lib/date'
import { seedDemo } from '@/lib/seed'

export function Dashboard() {
  const data = useFlock()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [seeding, setSeeding] = useState(false)

  if (!data) return <LoadingBlock />

  const today = todayISO()
  const active = data.animals.filter((a) => a.status === 'active')

  if (!data.animals.length) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-balance">به گله‌یار خوش آمدید</h1>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            پرونده الکترونیکی هر گوسفند را از تولد تا خروج از گله ثبت کنید: وزن، BCS، درمان، واکسن، جفت‌گیری، زایش و شجره‌نامه. همه اطلاعات روی همین دستگاه و بدون نیاز به اینترنت ذخیره می‌شود.
          </p>
        </div>
        <EmptyState
          title="هنوز دامی ثبت نشده است"
          description="اولین دام را ثبت کنید یا برای آشنایی با برنامه، یک گله نمونه بارگذاری کنید (بعداً از بخش پشتیبان قابل پاک کردن است)."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="lg" nativeButton={false} render={<Link href="/animals/new" />}>ثبت اولین دام</Button>
              <Button
                size="lg"
                variant="outline"
                disabled={seeding}
                onClick={async () => {
                  setSeeding(true)
                  await seedDemo()
                  toast.success('گله نمونه بارگذاری شد')
                  setSeeding(false)
                }}
              >
                {seeding ? 'در حال بارگذاری…' : 'بارگذاری گله نمونه'}
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const ewes = active.filter((a) => a.sex === 'female')
  const rams = active.filter((a) => a.sex === 'male')
  const young = active.filter((a) => a.birthDate && diffDays(a.birthDate, today) < 180)
  const pregnant = data.matings.filter((m) => !m.closed && m.pregnancy === 'pregnant' && active.some((a) => a.id === m.eweId))
  const jy = isoToJalaliParts(today).jy
  const thisYear = (iso: string) => isoToJalaliParts(iso).jy === jy
  const lambingsYear = data.lambings.filter((l) => thisYear(l.date))
  const lambsYear = lambingsYear.reduce((s, l) => s + l.alive, 0)
  const deathsYear = data.exits.filter((x) => x.type === 'dead' && thisYear(x.date)).length
  const alerts = computeAlerts(data)

  const upcoming = data.matings
    .filter((m) => !m.closed && m.pregnancy !== 'open' && m.expectedDate >= addDays(today, -30))
    .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate))
    .slice(0, 6)

  const recent = data.animals
    .flatMap((a) => buildTimeline(data, a).map((t) => ({ ...t, animal: a })))
    .filter((t) => t.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const exact = data!.animals.find((a) => a.earTag === q || a.code === q)
    if (exact) router.push(`/animals/view?id=${exact.id}`)
    else router.push(`/herd?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{formatJalaliLong(today)}</p>
          <h1 className="text-2xl font-bold md:text-3xl">وضعیت امروز گله</h1>
        </div>
        <form onSubmit={onSearch} role="search" className="flex w-full gap-2 md:w-96">
          <label htmlFor="quick-search" className="sr-only">جستجوی شماره گوشواره</label>
          <Input id="quick-search" dir="ltr" inputMode="numeric" placeholder="شماره گوشواره یا کد دام" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 text-left" />
          <Button type="submit" size="lg" aria-label="جستجو">
            <Search aria-hidden />
          </Button>
        </form>
      </div>

      <section aria-label="آمار گله" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="دام فعال" value={active.length} highlight />
        <Stat label="میش" value={ewes.length} />
        <Stat label="قوچ" value={rams.length} />
        <Stat label="بره زیر ۶ ماه" value={young.length} />
        <Stat label="میش آبستن" value={pregnant.length} />
        <Stat label="بره زنده امسال" value={lambsYear} sub={deathsYear ? `${fa(deathsYear)} تلفات امسال` : undefined} />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="flex flex-col gap-3 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">هشدارها و کارهای پیش رو</h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">{fa(alerts.length)}</span>
          </div>
          <AlertList alerts={alerts} data={data} showAnimal limit={10} />
        </section>

        <section className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-lg font-semibold">زایش‌های پیش رو</h2>
          {upcoming.length ? (
            <ul className="flex flex-col divide-y rounded-xl border bg-card">
              {upcoming.map((m) => {
                const ewe = data.animals.find((a) => a.id === m.eweId)
                if (!ewe) return null
                return (
                  <li key={m.id}>
                    <Link href={`/animals/view?id=${ewe.id}`} className="flex items-center gap-3 p-3 hover:bg-muted">
                      <EarTag value={ewe.earTag} size="sm" />
                      <span className="flex flex-1 flex-col">
                        <span className="text-sm font-medium">{formatJalali(m.expectedDate)}</span>
                        <span className="text-xs text-muted-foreground">{m.pregnancy === 'pregnant' ? 'آبستنی تأیید شده' : 'منتظر تشخیص'}</span>
                      </span>
                      <span className="text-xs font-medium">{relativeDays(m.expectedDate)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">زایشی در پیش نیست.</p>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">آخرین ثبت‌ها</h2>
        <ul className="flex flex-col divide-y rounded-xl border bg-card">
          {recent.map((t) => (
            <li key={`${t.animal.id}-${t.key}`}>
              <Link href={`/animals/view?id=${t.animal.id}`} className="flex items-center gap-3 p-3 hover:bg-muted">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{formatJalali(t.date)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{animalLabel(t.animal)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Stat({ label, value, sub, highlight }: { label: string; value: number; sub?: string; highlight?: boolean }) {
  return (
    <div className={highlight ? 'flex flex-col gap-1 rounded-xl bg-primary p-4 text-primary-foreground' : 'flex flex-col gap-1 rounded-xl border bg-card p-4'}>
      <span className={highlight ? 'text-xs text-primary-foreground/80' : 'text-xs text-muted-foreground'}>{label}</span>
      <span className="text-3xl font-bold">{fa(value)}</span>
      {sub ? <span className={highlight ? 'text-xs text-primary-foreground/80' : 'text-xs text-muted-foreground'}>{sub}</span> : null}
    </div>
  )
}
