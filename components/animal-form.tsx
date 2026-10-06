'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Camera, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, NativeSelect } from '@/components/flock-ui'
import { JalaliDateInput } from '@/components/jalali-date-input'
import { db, type Animal, type BirthType, type FlockData, type Origin, type Sex } from '@/lib/db'
import { BIRTH_TYPE_LABEL, BREEDS, ORIGIN_LABEL, SEX_LABEL } from '@/lib/constants'
import { todayISO } from '@/lib/date'
import { nextAnimalCode } from '@/lib/flock'

async function resizeImage(file: File, max = 640): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    await img.decode()
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function AnimalForm({ data, existing }: { data: FlockData; existing?: Animal }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Animal>>(
    existing ?? {
      code: nextAnimalCode(data.animals),
      sex: 'female',
      breed: BREEDS[0],
      origin: 'born',
      status: 'active',
      entryDate: todayISO(),
      birthDate: todayISO(),
      birthType: 'single',
    },
  )
  const set = <K extends keyof Animal>(key: K, value: Animal[K]) => setForm((f) => ({ ...f, [key]: value }))

  const others = useMemo(() => data.animals.filter((a) => a.id !== existing?.id), [data.animals, existing?.id])
  const rams = others.filter((a) => a.sex === 'male')
  const ewes = others.filter((a) => a.sex === 'female')

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      set('photo', await resizeImage(file))
    } catch {
      toast.error('بارگذاری عکس ناموفق بود')
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = form.code?.trim()
    const earTag = form.earTag?.trim()
    if (!code || !earTag) {
      toast.error('کد یکتا و شماره گوشواره الزامی است')
      return
    }
    if (others.some((a) => a.code === code)) {
      toast.error('این کد یکتا قبلاً برای دام دیگری ثبت شده است')
      return
    }
    if (others.some((a) => a.earTag === earTag && a.status === 'active')) {
      toast.error('این شماره گوشواره برای دام فعال دیگری ثبت شده است')
      return
    }
    setSaving(true)
    const now = Date.now()
    const record: Animal = {
      ...(form as Animal),
      code,
      earTag,
      breed: form.breed?.trim() || 'نامشخص',
      entryDate: form.entryDate ?? todayISO(),
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    }
    try {
      if (existing?.id) {
        await db.animals.put({ ...record, id: existing.id })
        toast.success('شناسنامه به‌روزرسانی شد')
        router.push(`/animals/view?id=${existing.id}`)
      } else {
        const id = await db.transaction('rw', db.animals, db.weights, db.movements, async () => {
          const newId = (await db.animals.add(record)) as number
          if (record.birthWeight && record.birthDate) {
            await db.weights.add({ animalId: newId, date: record.birthDate, weight: record.birthWeight, note: 'وزن تولد' })
          }
          if (record.penId) {
            await db.movements.add({ animalId: newId, date: record.entryDate, toPenId: record.penId, reason: 'ورود اولیه' })
          }
          return newId
        })
        toast.success('دام جدید ثبت شد')
        router.push(`/animals/view?id=${id}`)
      }
    } catch {
      toast.error('ذخیره ناموفق بود')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 md:flex-row">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex size-36 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input bg-muted text-muted-foreground hover:border-ring"
          >
            {form.photo ? (
              <Image src={form.photo || '/placeholder.svg'} alt="عکس دام" fill unoptimized className="object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm">
                <Camera className="size-7" aria-hidden />
                افزودن عکس
              </span>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto} aria-label="انتخاب عکس" />
          {form.photo ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => set('photo', undefined)}>
              <Trash2 aria-hidden />
              حذف عکس
            </Button>
          ) : null}
        </div>

        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <Field label="کد یکتای دام *" htmlFor="code" hint="به‌صورت خودکار ساخته می‌شود، قابل تغییر است">
            <Input id="code" dir="ltr" value={form.code ?? ''} onChange={(e) => set('code', e.target.value)} className="h-10 text-left font-mono" required />
          </Field>
          <Field label="شماره گوشواره *" htmlFor="earTag">
            <Input id="earTag" dir="ltr" inputMode="numeric" value={form.earTag ?? ''} onChange={(e) => set('earTag', e.target.value)} className="h-10 text-left font-mono" required />
          </Field>
          <Field label="نام (اختیاری)" htmlFor="name">
            <Input id="name" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className="h-10" />
          </Field>
          <Field label="جنسیت" htmlFor="sex">
            <NativeSelect id="sex" value={form.sex} onChange={(e) => set('sex', e.target.value as Sex)}>
              {Object.entries(SEX_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
        <h2 className="font-semibold sm:col-span-2 lg:col-span-3">مشخصات</h2>
        <Field label="نژاد" htmlFor="breed">
          <Input id="breed" list="breed-list" value={form.breed ?? ''} onChange={(e) => set('breed', e.target.value)} className="h-10" />
          <datalist id="breed-list">
            {BREEDS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
        <Field label="رنگ / علائم ظاهری" htmlFor="color">
          <Input id="color" value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} className="h-10" />
        </Field>
        <Field label="منشأ" htmlFor="origin">
          <NativeSelect id="origin" value={form.origin} onChange={(e) => set('origin', e.target.value as Origin)}>
            {Object.entries(ORIGIN_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="تاریخ تولد" htmlFor="birthDate">
          <JalaliDateInput id="birthDate" value={form.birthDate} onChange={(v) => set('birthDate', v)} allowEmpty />
        </Field>
        <Field label="تاریخ ورود به گله" htmlFor="entryDate">
          <JalaliDateInput id="entryDate" value={form.entryDate} onChange={(v) => set('entryDate', v ?? todayISO())} />
        </Field>
        <Field label="جایگاه فعلی" htmlFor="pen" hint={data.pens.length ? undefined : 'از بخش جایگاه‌ها، جایگاه تعریف کنید'}>
          <NativeSelect id="pen" value={form.penId ?? ''} onChange={(e) => set('penId', e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">بدون جایگاه</option>
            {data.pens.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="وزن تولد (کیلوگرم)" htmlFor="bw">
          <Input id="bw" type="number" step="0.1" min="0" dir="ltr" value={form.birthWeight ?? ''} onChange={(e) => set('birthWeight', e.target.value ? Number(e.target.value) : undefined)} className="h-10 text-left" />
        </Field>
        <Field label="نوع تولد" htmlFor="birthType">
          <NativeSelect id="birthType" value={form.birthType ?? ''} onChange={(e) => set('birthType', (e.target.value || undefined) as BirthType | undefined)}>
            <option value="">نامشخص</option>
            {Object.entries(BIRTH_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </NativeSelect>
        </Field>
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">والدین</h2>
        <Field label="پدر (قوچ)" htmlFor="sire" hint="اگر پدر در گله ثبت نشده، شماره یا نام را در کادر پایین بنویسید">
          <NativeSelect id="sire" value={form.sireId ?? ''} onChange={(e) => set('sireId', e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">انتخاب از گله…</option>
            {rams.map((a) => (
              <option key={a.id} value={a.id}>{a.earTag}{a.name ? ` — ${a.name}` : ''} ({a.breed})</option>
            ))}
          </NativeSelect>
          {!form.sireId ? (
            <Input placeholder="پدر خارج از گله (مثلاً قوچ ایستگاه)" value={form.sireLabel ?? ''} onChange={(e) => set('sireLabel', e.target.value)} className="h-10" aria-label="پدر خارج از گله" />
          ) : null}
        </Field>
        <Field label="مادر (میش)" htmlFor="dam">
          <NativeSelect id="dam" value={form.damId ?? ''} onChange={(e) => set('damId', e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">انتخاب از گله…</option>
            {ewes.map((a) => (
              <option key={a.id} value={a.id}>{a.earTag}{a.name ? ` — ${a.name}` : ''} ({a.breed})</option>
            ))}
          </NativeSelect>
          {!form.damId ? (
            <Input placeholder="مادر خارج از گله" value={form.damLabel ?? ''} onChange={(e) => set('damLabel', e.target.value)} className="h-10" aria-label="مادر خارج از گله" />
          ) : null}
        </Field>
      </section>

      <section className="rounded-xl border bg-card p-5">
        <Field label="یادداشت" htmlFor="notes">
          <Textarea id="notes" rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </section>

      <div className="sticky bottom-20 z-10 flex gap-2 lg:bottom-4">
        <Button type="submit" size="lg" disabled={saving} className="flex-1 sm:flex-none sm:px-10">
          {saving ? 'در حال ذخیره…' : existing ? 'ذخیره تغییرات' : 'ثبت دام'}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={() => router.back()} className="bg-card">
          انصراف
        </Button>
      </div>
    </form>
  )
}
