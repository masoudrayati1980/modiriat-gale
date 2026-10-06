'use client'

import { useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, NativeSelect } from '@/components/flock-ui'
import { JalaliDateInput } from '@/components/jalali-date-input'
import {
  db,
  type Animal,
  type BirthType,
  type DiseaseStatus,
  type EventCategory,
  type ExitType,
  type FlockData,
  type LambingEase,
  type MatingMethod,
  type PregnancyState,
  type Route,
  type Severity,
  type Sex,
  type TreatmentType,
} from '@/lib/db'
import {
  BCS_SCALE,
  COMMON_VACCINES,
  DISEASE_STATUS_LABEL,
  EASE_LABEL,
  EVENT_CATEGORY_LABEL,
  EXIT_TYPE_LABEL,
  MATING_METHOD_LABEL,
  PREGNANCY_LABEL,
  ROUTE_LABEL,
  SEVERITY_LABEL,
  SEX_SHORT,
  TREATMENT_TYPE_LABEL,
  bcsLabel,
} from '@/lib/constants'
import { addDays, fa, formatJalali, todayISO } from '@/lib/date'
import { animalLabel, expectedLambingDate, inbreedingWarning, nextAnimalCode } from '@/lib/flock'

export interface RecordFormProps {
  data: FlockData
  animal: Animal
  onDone: () => void
}

const num = (v: string) => (v === '' ? undefined : Number(v))

function FormActions({ saving, label = 'ثبت' }: { saving: boolean; label?: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="submit" size="lg" disabled={saving} className="min-w-32">
        {saving ? 'در حال ذخیره…' : label}
      </Button>
    </div>
  )
}

function useSubmit(onDone: () => void, success: string) {
  const [saving, setSaving] = useState(false)
  const run = async (fn: () => Promise<unknown>) => {
    setSaving(true)
    try {
      await fn()
      toast.success(success)
      onDone()
    } catch (err) {
      console.log('[v0] save error', err)
      toast.error('ذخیره ناموفق بود')
    } finally {
      setSaving(false)
    }
  }
  return { saving, run }
}

export function WeightForm({ animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const { saving, run } = useSubmit(onDone, 'وزن ثبت شد')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!weight) return toast.error('وزن را وارد کنید')
        run(() => db.weights.add({ animalId: animal.id!, date, weight: Number(weight), note: note || undefined }))
      }}
    >
      <Field label="تاریخ وزن‌کشی"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <Field label="وزن (کیلوگرم)" htmlFor="w">
        <Input id="w" type="number" step="0.1" min="0" dir="ltr" inputMode="decimal" autoFocus value={weight} onChange={(e) => setWeight(e.target.value)} className="h-12 text-left text-lg" />
      </Field>
      <Field label="یادداشت" htmlFor="wn"><Input id="wn" value={note} onChange={(e) => setNote(e.target.value)} className="h-10" /></Field>
      <FormActions saving={saving} />
    </form>
  )
}

export function BcsForm({ animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [score, setScore] = useState(3)
  const [note, setNote] = useState('')
  const { saving, run } = useSubmit(onDone, 'BCS ثبت شد')
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); run(() => db.bcs.add({ animalId: animal.id!, date, score, note: note || undefined })) }}>
      <Field label="تاریخ"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">نمره وضعیت بدنی (۱ تا ۵) — {bcsLabel(score)}</legend>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-9">
          {BCS_SCALE.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={score === s}
              onClick={() => setScore(s)}
              className={`h-11 rounded-lg border text-sm font-semibold ${score === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}
            >
              {fa(s)}
            </button>
          ))}
        </div>
      </fieldset>
      <Field label="یادداشت" htmlFor="bn"><Input id="bn" value={note} onChange={(e) => setNote(e.target.value)} className="h-10" /></Field>
      <FormActions saving={saving} />
    </form>
  )
}

export function DiseaseForm({ animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [name, setName] = useState('')
  const [symptoms, setSymptoms] = useState('')
  const [severity, setSeverity] = useState<Severity>('moderate')
  const [status, setStatus] = useState<DiseaseStatus>('active')
  const { saving, run } = useSubmit(onDone, 'بیماری ثبت شد')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return toast.error('نام بیماری یا مشکل را وارد کنید')
        run(() => db.diseases.add({ animalId: animal.id!, date, name: name.trim(), symptoms: symptoms || undefined, severity, status, recoveredDate: status === 'recovered' ? date : undefined }))
      }}
    >
      <Field label="تاریخ شروع / تشخیص"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <Field label="بیماری / مشکل" htmlFor="dn"><Input id="dn" autoFocus value={name} onChange={(e) => setName(e.target.value)} className="h-10" placeholder="مثلاً ورم پستان، لنگش، اسهال" /></Field>
      <Field label="علائم" htmlFor="ds"><Textarea id="ds" rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="شدت" htmlFor="dsev">
          <NativeSelect id="dsev" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            {Object.entries(SEVERITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
        </Field>
        <Field label="وضعیت" htmlFor="dst">
          <NativeSelect id="dst" value={status} onChange={(e) => setStatus(e.target.value as DiseaseStatus)}>
            {Object.entries(DISEASE_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
        </Field>
      </div>
      <FormActions saving={saving} />
    </form>
  )
}

interface MedRow {
  drug: string
  dose: string
  route: Route
  durationDays: string
  withdrawalDays: string
}
const emptyMed = (): MedRow => ({ drug: '', dose: '', route: 'IM', durationDays: '', withdrawalDays: '' })

export function TreatmentForm({ data, animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState<TreatmentType>('treatment')
  const [diseaseId, setDiseaseId] = useState<number | undefined>()
  const [description, setDescription] = useState('')
  const [vet, setVet] = useState('')
  const [cost, setCost] = useState('')
  const [followUp, setFollowUp] = useState<string | undefined>()
  const [meds, setMeds] = useState<MedRow[]>([emptyMed()])
  const { saving, run } = useSubmit(onDone, 'درمان ثبت شد')
  const diseases = data.diseases.filter((d) => d.animalId === animal.id && d.status !== 'recovered')

  const updateMed = (i: number, patch: Partial<MedRow>) => setMeds((m) => m.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!description.trim()) return toast.error('شرح اقدام را وارد کنید')
        run(() =>
          db.transaction('rw', db.treatments, db.medications, async () => {
            const treatmentId = (await db.treatments.add({
              animalId: animal.id!, date, type, diseaseId, description: description.trim(), vet: vet || undefined, cost: num(cost), followUpDate: followUp, followUpDone: false,
            })) as number
            for (const m of meds.filter((x) => x.drug.trim())) {
              await db.medications.add({
                animalId: animal.id!, treatmentId, date, drug: m.drug.trim(), dose: m.dose || undefined, route: m.route, durationDays: num(m.durationDays), withdrawalDays: num(m.withdrawalDays),
              })
            }
          }),
        )
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="نوع اقدام" htmlFor="tt">
          <NativeSelect id="tt" value={type} onChange={(e) => setType(e.target.value as TreatmentType)}>
            {Object.entries(TREATMENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
        </Field>
        <Field label="مرتبط با بیماری" htmlFor="td">
          <NativeSelect id="td" value={diseaseId ?? ''} onChange={(e) => setDiseaseId(num(e.target.value))}>
            <option value="">هیچ‌کدام</option>
            {diseases.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </NativeSelect>
        </Field>
      </div>
      <Field label="تاریخ"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <Field label="شرح اقدام" htmlFor="tdesc"><Textarea id="tdesc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="دامپزشک / مسئول" htmlFor="tv"><Input id="tv" value={vet} onChange={(e) => setVet(e.target.value)} className="h-10" /></Field>
        <Field label="هزینه (تومان)" htmlFor="tc"><Input id="tc" type="number" min="0" dir="ltr" value={cost} onChange={(e) => setCost(e.target.value)} className="h-10 text-left" /></Field>
      </div>
      <Field label="تاریخ پیگیری بعدی"><JalaliDateInput value={followUp} onChange={setFollowUp} allowEmpty /></Field>

      <fieldset className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
        <legend className="px-1 text-sm font-semibold">داروهای مصرف‌شده</legend>
        {meds.map((m, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 border-b pb-3 last:border-0 last:pb-0">
            <Input aria-label="نام دارو" placeholder="نام دارو" value={m.drug} onChange={(e) => updateMed(i, { drug: e.target.value })} className="col-span-2 h-10" />
            <Input aria-label="دوز" placeholder="دوز (مثلاً ۵ سی‌سی)" value={m.dose} onChange={(e) => updateMed(i, { dose: e.target.value })} className="h-10" />
            <NativeSelect aria-label="راه تجویز" value={m.route} onChange={(e) => updateMed(i, { route: e.target.value as Route })}>
              {Object.entries(ROUTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </NativeSelect>
            <Input aria-label="مدت مصرف (روز)" placeholder="مدت (روز)" type="number" min="0" value={m.durationDays} onChange={(e) => updateMed(i, { durationDays: e.target.value })} className="h-10" />
            <Input aria-label="دوره منع مصرف (روز)" placeholder="منع مصرف (روز)" type="number" min="0" value={m.withdrawalDays} onChange={(e) => updateMed(i, { withdrawalDays: e.target.value })} className="h-10" />
            {meds.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" className="col-span-2 justify-self-start text-destructive" onClick={() => setMeds((x) => x.filter((_, idx) => idx !== i))}>
                <X aria-hidden /> حذف این دارو
              </Button>
            ) : null}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="self-start bg-card" onClick={() => setMeds((x) => [...x, emptyMed()])}>
          <Plus aria-hidden /> داروی دیگر
        </Button>
      </fieldset>
      <FormActions saving={saving} />
    </form>
  )
}

export function VaccineForm({ data, animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [vaccine, setVaccine] = useState('')
  const [dose, setDose] = useState('')
  const [batch, setBatch] = useState('')
  const [nextDue, setNextDue] = useState<string | undefined>(addDays(todayISO(), 180))
  const [applyPen, setApplyPen] = useState(false)
  const { saving, run } = useSubmit(onDone, 'واکسن ثبت شد')
  const pen = data.pens.find((p) => p.id === animal.penId)
  const penMates = pen ? data.animals.filter((a) => a.penId === pen.id && a.status === 'active') : []

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!vaccine.trim()) return toast.error('نام واکسن را وارد کنید')
        const targets = applyPen ? penMates.map((a) => a.id!) : [animal.id!]
        run(() => db.vaccinations.bulkAdd(targets.map((id) => ({ animalId: id, date, vaccine: vaccine.trim(), dose: dose || undefined, batch: batch || undefined, nextDueDate: nextDue }))))
      }}
    >
      <Field label="نام واکسن" htmlFor="vn">
        <Input id="vn" list="vaccine-list" autoFocus value={vaccine} onChange={(e) => setVaccine(e.target.value)} className="h-10" />
        <datalist id="vaccine-list">{COMMON_VACCINES.map((v) => <option key={v} value={v} />)}</datalist>
      </Field>
      <Field label="تاریخ تزریق"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="دوز" htmlFor="vd"><Input id="vd" value={dose} onChange={(e) => setDose(e.target.value)} className="h-10" /></Field>
        <Field label="شماره سری ساخت" htmlFor="vb"><Input id="vb" dir="ltr" value={batch} onChange={(e) => setBatch(e.target.value)} className="h-10 text-left" /></Field>
      </div>
      <Field label="نوبت بعدی">
        <JalaliDateInput value={nextDue} onChange={setNextDue} allowEmpty />
        <div className="flex flex-wrap gap-2">
          {[[21, '۲۱ روز (یادآور)'], [90, '۳ ماه'], [180, '۶ ماه'], [365, '۱ سال']].map(([d, l]) => (
            <button key={d} type="button" onClick={() => setNextDue(addDays(date, d as number))} className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-muted">
              {l}
            </button>
          ))}
        </div>
      </Field>
      {pen && penMates.length > 1 ? (
        <label className="flex items-start gap-3 rounded-lg border bg-accent p-3 text-sm">
          <input type="checkbox" className="mt-1 size-4 accent-primary" checked={applyPen} onChange={(e) => setApplyPen(e.target.checked)} />
          <span>
            ثبت گروهی برای همه دام‌های فعال جایگاه «{pen.name}» ({fa(penMates.length)} رأس)
          </span>
        </label>
      ) : null}
      <FormActions saving={saving} />
    </form>
  )
}

export function MatingForm({ data, animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [ramId, setRamId] = useState<number | undefined>()
  const [ramLabel, setRamLabel] = useState('')
  const [method, setMethod] = useState<MatingMethod>('natural')
  const [note, setNote] = useState('')
  const { saving, run } = useSubmit(onDone, 'جفت‌گیری ثبت شد')
  const rams = data.animals.filter((a) => a.sex === 'male' && a.status === 'active')
  const warning = inbreedingWarning(data, animal.id, ramId)

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => db.matings.add({ eweId: animal.id!, ramId, ramLabel: ramId ? undefined : ramLabel || undefined, date, method, pregnancy: 'unknown', expectedDate: expectedLambingDate(date), note: note || undefined }))
      }}
    >
      <Field label="تاریخ جفت‌گیری / تلقیح"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <Field label="روش" htmlFor="mm">
        <NativeSelect id="mm" value={method} onChange={(e) => setMethod(e.target.value as MatingMethod)}>
          {Object.entries(MATING_METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </NativeSelect>
      </Field>
      <Field label="قوچ" htmlFor="mr">
        <NativeSelect id="mr" value={ramId ?? ''} onChange={(e) => setRamId(num(e.target.value))}>
          <option value="">قوچ خارج از گله / اسپرم</option>
          {rams.map((r) => <option key={r.id} value={r.id}>{r.earTag}{r.name ? ` — ${r.name}` : ''} ({r.breed})</option>)}
        </NativeSelect>
        {!ramId ? <Input aria-label="مشخصات قوچ خارج از گله" placeholder="کد یا مشخصات قوچ / اسپرم" value={ramLabel} onChange={(e) => setRamLabel(e.target.value)} className="h-10" /> : null}
      </Field>
      {warning ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          هشدار خویشاوندی: {warning}
        </p>
      ) : null}
      <p className="rounded-lg bg-muted p-3 text-sm">
        تاریخ پیش‌بینی زایش (۱۴۷ روز): <strong>{formatJalali(expectedLambingDate(date))}</strong>
      </p>
      <Field label="یادداشت" htmlFor="mnote"><Input id="mnote" value={note} onChange={(e) => setNote(e.target.value)} className="h-10" /></Field>
      <FormActions saving={saving} />
    </form>
  )
}

export function PregnancyForm({ data, animal, onDone }: RecordFormProps) {
  const open = data.matings.filter((m) => m.eweId === animal.id && !m.closed).sort((a, b) => b.date.localeCompare(a.date))
  const [matingId, setMatingId] = useState<number | undefined>(open[0]?.id)
  const [result, setResult] = useState<PregnancyState>('pregnant')
  const [date, setDate] = useState(todayISO())
  const { saving, run } = useSubmit(onDone, 'نتیجه آبستنی ثبت شد')

  if (!open.length) {
    return <p className="text-sm leading-relaxed text-muted-foreground">برای این میش جفت‌گیری بازی ثبت نشده است. ابتدا جفت‌گیری را ثبت کنید.</p>
  }
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!matingId) return
        run(() => db.matings.update(matingId, { pregnancy: result, checkDate: date }))
      }}
    >
      <Field label="جفت‌گیری مربوط" htmlFor="pm">
        <NativeSelect id="pm" value={matingId ?? ''} onChange={(e) => setMatingId(num(e.target.value))}>
          {open.map((m) => <option key={m.id} value={m.id}>{formatJalali(m.date)} — {MATING_METHOD_LABEL[m.method]}</option>)}
        </NativeSelect>
      </Field>
      <Field label="تاریخ تشخیص (سونوگرافی / معاینه)"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="mb-1.5 text-sm font-medium">نتیجه</legend>
        {(['pregnant', 'open', 'unknown'] as PregnancyState[]).map((s) => (
          <button key={s} type="button" aria-pressed={result === s} onClick={() => setResult(s)} className={`h-11 rounded-lg border text-sm font-medium ${result === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}>
            {PREGNANCY_LABEL[s]}
          </button>
        ))}
      </fieldset>
      <FormActions saving={saving} />
    </form>
  )
}

interface LambRow {
  sex: Sex
  birthWeight: string
  alive: boolean
  earTag: string
}

export function LambingForm({ data, animal, onDone }: RecordFormProps) {
  const openMatings = data.matings.filter((m) => m.eweId === animal.id && !m.closed).sort((a, b) => b.date.localeCompare(a.date))
  const [date, setDate] = useState(todayISO())
  const [matingId, setMatingId] = useState<number | undefined>(openMatings[0]?.id)
  const [ease, setEase] = useState<LambingEase>('normal')
  const [note, setNote] = useState('')
  const [register, setRegister] = useState(true)
  const [lambs, setLambs] = useState<LambRow[]>([{ sex: 'female', birthWeight: '', alive: true, earTag: '' }])
  const { saving, run } = useSubmit(onDone, 'زایش ثبت شد')
  const isAbortion = ease === 'abortion'
  const update = (i: number, patch: Partial<LambRow>) => setLambs((l) => l.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))

  async function save() {
    const mating = data.matings.find((m) => m.id === matingId)
    const rows = isAbortion ? lambs.map((l) => ({ ...l, alive: false })) : lambs
    const alive = rows.filter((l) => l.alive).length
    const birthType = (['single', 'twin', 'triplet', 'quad'] as BirthType[])[Math.min(rows.length, 4) - 1]
    await db.transaction('rw', db.tables, async () => {
      const lambingId = (await db.lambings.add({
        eweId: animal.id!, matingId, sireId: mating?.ramId, date, total: rows.length, alive, dead: rows.length - alive, ease, note: note || undefined,
      })) as number
      if (matingId) await db.matings.update(matingId, { closed: true, pregnancy: 'pregnant' })
      const existing = await db.animals.toArray()
      const baseCode = nextAnimalCode(existing)
      const [prefix, seq] = [baseCode.slice(0, baseCode.lastIndexOf('-') + 1), Number(baseCode.slice(baseCode.lastIndexOf('-') + 1))]
      let offset = 0
      for (const row of rows) {
        let animalId: number | undefined
        if (register && row.alive && !isAbortion) {
          const now = Date.now()
          animalId = (await db.animals.add({
            code: `${prefix}${String(seq + offset).padStart(4, '0')}`,
            earTag: row.earTag.trim() || `بره-${seq + offset}`,
            sex: row.sex, breed: animal.breed, birthDate: date, entryDate: date, origin: 'born',
            damId: animal.id, sireId: mating?.ramId, sireLabel: mating?.ramId ? undefined : mating?.ramLabel,
            status: 'active', penId: animal.penId, birthWeight: num(row.birthWeight), birthType, createdAt: now, updatedAt: now,
          })) as number
          offset++
          if (row.birthWeight) await db.weights.add({ animalId, date, weight: Number(row.birthWeight), note: 'وزن تولد' })
        }
        await db.lambs.add({ lambingId, damId: animal.id!, sex: row.sex, birthWeight: num(row.birthWeight), alive: row.alive, animalId })
      }
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (!lambs.length) return toast.error('حداقل یک بره وارد کنید'); run(save) }}>
      <Field label="تاریخ زایش"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="جفت‌گیری مربوط" htmlFor="lm">
          <NativeSelect id="lm" value={matingId ?? ''} onChange={(e) => setMatingId(num(e.target.value))}>
            <option value="">ثبت نشده</option>
            {openMatings.map((m) => <option key={m.id} value={m.id}>{formatJalali(m.date)}</option>)}
          </NativeSelect>
        </Field>
        <Field label="نوع زایش" htmlFor="le">
          <NativeSelect id="le" value={ease} onChange={(e) => setEase(e.target.value as LambingEase)}>
            {Object.entries(EASE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
        <legend className="px-1 text-sm font-semibold">بره‌ها ({fa(lambs.length)})</legend>
        {lambs.map((l, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 border-b pb-3 last:border-0 last:pb-0 sm:grid-cols-4">
            <NativeSelect aria-label={`جنسیت بره ${i + 1}`} value={l.sex} onChange={(e) => update(i, { sex: e.target.value as Sex })}>
              {Object.entries(SEX_SHORT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </NativeSelect>
            <Input aria-label={`وزن تولد بره ${i + 1}`} placeholder="وزن (کیلو)" type="number" step="0.1" min="0" dir="ltr" value={l.birthWeight} onChange={(e) => update(i, { birthWeight: e.target.value })} className="h-10 text-left" />
            {!isAbortion ? (
              <>
                <Input aria-label={`گوشواره بره ${i + 1}`} placeholder="شماره گوشواره" dir="ltr" value={l.earTag} onChange={(e) => update(i, { earTag: e.target.value })} className="h-10 text-left" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" checked={l.alive} onChange={(e) => update(i, { alive: e.target.checked })} />
                  زنده
                </label>
              </>
            ) : null}
            {lambs.length > 1 ? (
              <button type="button" className="col-span-2 justify-self-start text-xs text-destructive sm:col-span-4" onClick={() => setLambs((x) => x.filter((_, idx) => idx !== i))}>
                حذف این بره
              </button>
            ) : null}
          </div>
        ))}
        {lambs.length < 5 ? (
          <Button type="button" variant="outline" size="sm" className="self-start bg-card" onClick={() => setLambs((x) => [...x, { sex: 'male', birthWeight: '', alive: true, earTag: '' }])}>
            <Plus aria-hidden /> بره دیگر
          </Button>
        ) : null}
      </fieldset>
      {!isAbortion ? (
        <label className="flex items-start gap-3 rounded-lg border bg-accent p-3 text-sm">
          <input type="checkbox" className="mt-1 size-4 accent-primary" checked={register} onChange={(e) => setRegister(e.target.checked)} />
          <span>بره‌های زنده به‌صورت خودکار با پدر و مادر در گله ثبت شوند (پرونده جداگانه برای هر بره)</span>
        </label>
      ) : null}
      <Field label="یادداشت" htmlFor="lnote"><Input id="lnote" value={note} onChange={(e) => setNote(e.target.value)} className="h-10" /></Field>
      <FormActions saving={saving} />
    </form>
  )
}

export function MovementForm({ data, animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [toPenId, setToPenId] = useState<number | undefined>(data.pens.find((p) => p.id !== animal.penId)?.id)
  const [reason, setReason] = useState('')
  const { saving, run } = useSubmit(onDone, 'جابه‌جایی ثبت شد')
  if (!data.pens.length) return <p className="text-sm text-muted-foreground">ابتدا از بخش «جایگاه‌ها» جایگاه تعریف کنید.</p>
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!toPenId) return toast.error('جایگاه مقصد را انتخاب کنید')
        run(() => db.transaction('rw', db.movements, db.animals, async () => {
          await db.movements.add({ animalId: animal.id!, date, fromPenId: animal.penId, toPenId, reason: reason || undefined })
          await db.animals.update(animal.id!, { penId: toPenId, updatedAt: Date.now() })
        }))
      }}
    >
      <p className="text-sm text-muted-foreground">جایگاه فعلی: {data.pens.find((p) => p.id === animal.penId)?.name ?? 'بدون جایگاه'}</p>
      <Field label="جایگاه مقصد" htmlFor="mp">
        <NativeSelect id="mp" value={toPenId ?? ''} onChange={(e) => setToPenId(num(e.target.value))}>
          {data.pens.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </NativeSelect>
      </Field>
      <Field label="تاریخ"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <Field label="دلیل" htmlFor="mrs"><Input id="mrs" value={reason} onChange={(e) => setReason(e.target.value)} className="h-10" placeholder="مثلاً انتقال به بخش زایشگاه" /></Field>
      <FormActions saving={saving} />
    </form>
  )
}

export function EventForm({ animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [category, setCategory] = useState<EventCategory>('observation')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { saving, run } = useSubmit(onDone, 'رویداد ثبت شد')
  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return toast.error('عنوان را وارد کنید'); run(() => db.events.add({ animalId: animal.id!, date, category, title: title.trim(), description: description || undefined })) }}>
      <Field label="نوع رویداد" htmlFor="ec">
        <NativeSelect id="ec" value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
          {Object.entries(EVENT_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </NativeSelect>
      </Field>
      <Field label="تاریخ"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <Field label="عنوان" htmlFor="et"><Input id="et" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" /></Field>
      <Field label="توضیحات" htmlFor="ed"><Textarea id="ed" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <FormActions saving={saving} />
    </form>
  )
}

export function ExitForm({ animal, onDone }: RecordFormProps) {
  const [date, setDate] = useState(todayISO())
  const [type, setType] = useState<ExitType>('sold')
  const [reason, setReason] = useState('')
  const [price, setPrice] = useState('')
  const [weight, setWeight] = useState('')
  const [buyer, setBuyer] = useState('')
  const { saving, run } = useSubmit(onDone, 'خروج از گله ثبت شد')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => db.transaction('rw', db.exits, db.animals, async () => {
          await db.exits.add({ animalId: animal.id!, date, type, reason: reason || undefined, price: num(price), weight: num(weight), buyer: buyer || undefined })
          await db.animals.update(animal.id!, { status: type, updatedAt: Date.now() })
        }))
      }}
    >
      <p className="text-sm text-muted-foreground">دام {animalLabel(animal)} از فهرست دام‌های فعال خارج می‌شود اما پرونده‌اش حفظ می‌شود.</p>
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="mb-1.5 text-sm font-medium">نوع خروج</legend>
        {(Object.keys(EXIT_TYPE_LABEL) as ExitType[]).map((t) => (
          <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`h-11 rounded-lg border text-sm font-medium ${type === t ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'}`}>
            {EXIT_TYPE_LABEL[t]}
          </button>
        ))}
      </fieldset>
      <Field label="تاریخ"><JalaliDateInput value={date} onChange={(v) => setDate(v ?? todayISO())} /></Field>
      <Field label={type === 'dead' ? 'علت تلفات' : 'دلیل'} htmlFor="xr"><Input id="xr" value={reason} onChange={(e) => setReason(e.target.value)} className="h-10" /></Field>
      {type !== 'dead' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="مبلغ (تومان)" htmlFor="xp"><Input id="xp" type="number" min="0" dir="ltr" value={price} onChange={(e) => setPrice(e.target.value)} className="h-10 text-left" /></Field>
          <Field label="وزن هنگام خروج" htmlFor="xw"><Input id="xw" type="number" step="0.1" min="0" dir="ltr" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-10 text-left" /></Field>
          <Field label="خریدار" htmlFor="xb" className="col-span-2"><Input id="xb" value={buyer} onChange={(e) => setBuyer(e.target.value)} className="h-10" /></Field>
        </div>
      ) : null}
      <FormActions saving={saving} label="ثبت خروج" />
    </form>
  )
}
