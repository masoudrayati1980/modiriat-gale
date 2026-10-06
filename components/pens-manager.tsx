'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, Utensils } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, LoadingBlock, NativeSelect, PageHeader } from '@/components/flock-ui'
import { JalaliDateInput } from '@/components/jalali-date-input'
import { db } from '@/lib/db'
import { fa, formatJalali, todayISO } from '@/lib/date'
import { rationForPenAtDate, useFlock } from '@/lib/flock'
import { cn } from '@/lib/utils'

export function PensManager() {
  const data = useFlock()
  const [name, setName] = useState('')
  const [kind, setKind] = useState('')
  const [capacity, setCapacity] = useState('')

  const [rationCode, setRationCode] = useState('')
  const [rationName, setRationName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [dailyKg, setDailyKg] = useState('')
  const [rationNote, setRationNote] = useState('')
  const [rationDates, setRationDates] = useState<Record<number, string>>({})

  if (!data) return <LoadingBlock />
  const flock = data

  async function addPen(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return toast.error('نام جایگاه را وارد کنید')
    await db.pens.add({ name: name.trim(), kind: kind || undefined, capacity: capacity ? Number(capacity) : undefined })
    setName('')
    setKind('')
    setCapacity('')
    toast.success('جایگاه اضافه شد')
  }

  async function addRation(e: React.FormEvent) {
    e.preventDefault()
    const code = rationCode.trim()
    if (!code) return toast.error('شماره جیره را وارد کنید')
    if (flock.rations.some((r) => r.code.trim() === code)) return toast.error('این شماره جیره قبلاً ثبت شده است')
    const now = Date.now()
    try {
      await db.rations.add({
        code,
        name: rationName.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        dailyKgPerHead: dailyKg ? Number(dailyKg) : undefined,
        notes: rationNote.trim() || undefined,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      setRationCode('')
      setRationName('')
      setIngredients('')
      setDailyKg('')
      setRationNote('')
      toast.success('جیره اضافه شد')
    } catch {
      toast.error('ذخیره جیره ناموفق بود')
    }
  }

  async function assignRation(penId: number, rationId: number, startDate: string) {
    if (!rationId) return
    const latest = rationForPenAtDate(flock, penId, startDate)
    if (latest?.rationId === rationId) return toast.info('این جیره از همین تاریخ فعال است')
    try {
      await db.penRations.add({ penId, rationId, startDate })
      toast.success('جیره جایگاه ثبت شد')
    } catch {
      toast.error('ثبت جیره جایگاه ناموفق بود')
    }
  }

  async function remove(id: number, count: number) {
    if (count > 0) return toast.error('ابتدا دام‌های این جایگاه را جابه‌جا کنید')
    if (!window.confirm('این جایگاه حذف شود؟')) return
    await db.transaction('rw', db.pens, db.penRations, async () => {
      await db.penRations.where('penId').equals(id).delete()
      await db.pens.delete(id)
    })
    toast.success('جایگاه حذف شد')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="جایگاه‌ها و جیره"
        description="جایگاه‌ها را تعریف کنید و برای هر جایگاه جیره فعلی و تاریخچه تغییر جیره را ثبت کنید."
      />

      <form onSubmit={addPen} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4 sm:items-end">
        <Field label="نام جایگاه" htmlFor="pn"><Input id="pn" value={name} onChange={(e) => setName(e.target.value)} className="h-10" placeholder="مثلاً سالن ۱" /></Field>
        <Field label="نوع" htmlFor="pk"><Input id="pk" value={kind} onChange={(e) => setKind(e.target.value)} className="h-10" placeholder="سالن، بهاربند، زایشگاه…" /></Field>
        <Field label="ظرفیت (رأس)" htmlFor="pc"><Input id="pc" type="number" min="0" dir="ltr" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="h-10 text-left" /></Field>
        <Button type="submit" size="lg">افزودن جایگاه</Button>
      </form>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <Utensils className="size-5 text-primary" aria-hidden />
          <div>
            <h2 className="font-semibold">تعریف جیره</h2>
            <p className="text-xs text-muted-foreground">شماره جیره را ثابت نگه دارید؛ با تغییر جیره، رکورد جدید با تاریخ شروع ثبت کنید.</p>
          </div>
        </div>
        <form onSubmit={addRation} className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Field label="شماره جیره *" htmlFor="rationCode">
            <Input id="rationCode" value={rationCode} onChange={(e) => setRationCode(e.target.value)} className="h-10" placeholder="مثلاً ۱" />
          </Field>
          <Field label="نام جیره" htmlFor="rationName">
            <Input id="rationName" value={rationName} onChange={(e) => setRationName(e.target.value)} className="h-10" placeholder="مثلاً پرواری" />
          </Field>
          <Field label="مصرف روزانه هر رأس (کیلو)" htmlFor="dailyKg" hint="اختیاری">
            <Input id="dailyKg" type="number" min="0" step="0.01" dir="ltr" value={dailyKg} onChange={(e) => setDailyKg(e.target.value)} className="h-10 text-left" />
          </Field>
          <Field label="مواد تشکیل‌دهنده" htmlFor="ingredients" hint="اختیاری">
            <Input id="ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} className="h-10" placeholder="یونجه، جو، کنسانتره…" />
          </Field>
          <div className="flex items-end"><Button type="submit" size="lg" className="w-full">افزودن جیره</Button></div>
          <div className="md:col-span-2 lg:col-span-5">
            <Field label="یادداشت جیره" htmlFor="rationNote">
              <Textarea id="rationNote" rows={2} value={rationNote} onChange={(e) => setRationNote(e.target.value)} placeholder="مثلاً برای بره‌های ۲۰ تا ۳۰ کیلو" />
            </Field>
          </div>
        </form>

        {data.rations.length ? (
          <div className="mt-5 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/60 text-right">
                <tr>
                  <th className="p-3">شماره جیره</th>
                  <th className="p-3">نام</th>
                  <th className="p-3">مصرف روزانه</th>
                  <th className="p-3">مواد تشکیل‌دهنده</th>
                  <th className="p-3">توضیح</th>
                </tr>
              </thead>
              <tbody>
                {data.rations.sort((a, b) => a.code.localeCompare(b.code, 'fa')).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-bold">{fa(r.code)}</td>
                    <td className="p-3">{r.name ?? '—'}</td>
                    <td className="p-3">{r.dailyKgPerHead != null ? `${fa(r.dailyKgPerHead)} کیلو/روز` : '—'}</td>
                    <td className="p-3">{r.ingredients ?? '—'}</td>
                    <td className="p-3">{r.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">هنوز جیره‌ای تعریف نشده است.</p>
        )}
      </section>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.pens.map((p) => {
          const count = data.animals.filter((a) => a.penId === p.id && a.status === 'active').length
          const full = p.capacity ? count / p.capacity : 0
          const assignment = rationForPenAtDate(data, p.id, todayISO())
          const ration = assignment ? data.rations.find((r) => r.id === assignment.rationId) : undefined

          return (
            <li key={p.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.kind ?? 'جایگاه'}</span>
                </div>
                <button type="button" onClick={() => remove(p.id!, count)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`حذف ${p.name}`}>
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{fa(count)}</span>
                <span className="text-sm text-muted-foreground">{p.capacity ? `از ${fa(p.capacity)} رأس` : 'رأس'}</span>
              </div>

              {p.capacity ? (
                <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={count} aria-valuemax={p.capacity} aria-label="میزان پر بودن">
                  <div className={cn('h-full rounded-full', full > 1 ? 'bg-destructive' : 'bg-primary')} style={{ width: `${Math.min(100, full * 100)}%` }} />
                </div>
              ) : null}

              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">جیره فعلی</div>
                <div className="mt-1 text-base font-bold">
                  {ration ? `جیره ${fa(ration.code)}${ration.name ? ` — ${ration.name}` : ''}` : 'ثبت نشده'}
                </div>
                {assignment ? <div className="mt-1 text-xs text-muted-foreground">از {formatJalali(assignment.startDate)}</div> : null}
                {data.rations.length ? (
                  <>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]">
                    <NativeSelect
                      value={ration?.id ?? ''}
                      onChange={(e) => assignRation(p.id!, Number(e.target.value), rationDates[p.id!] ?? todayISO())}
                      aria-label={`جیره جدید برای ${p.name}`}
                    >
                      <option value="">بدون تغییر</option>
                      {data.rations.filter((r) => r.active).map((r) => (
                        <option key={r.id} value={r.id}>جیره {fa(r.code)}{r.name ? ` — ${r.name}` : ''}</option>
                      ))}
                    </NativeSelect>
                    <JalaliDateInput
                      value={rationDates[p.id!] ?? todayISO()}
                      onChange={(v) => setRationDates((x) => ({ ...x, [p.id!]: v ?? todayISO() }))}
                    />
                    </div>
                    <span className="text-xs text-muted-foreground">با انتخاب جیره، تاریخ شروع همان رکورد ذخیره می‌شود؛ بنابراین تغییرات گذشته هم قابل ثبت هستند.</span>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">ابتدا یک جیره تعریف کنید.</p>
                )}
              </div>

              <Link href={`/herd?pen=${p.id}`} className="text-sm font-medium text-primary hover:underline">مشاهده دام‌ها</Link>
            </li>
          )
        })}
      </ul>
      {!data.pens.length ? <p className="text-sm text-muted-foreground">هنوز جایگاهی تعریف نشده است.</p> : null}
    </div>
  )
}
