'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftRight,
  Baby,
  Flag,
  Gauge,
  Heart,
  LogOut,
  Pencil,
  Printer,
  Scale,
  Stethoscope,
  Syringe,
  Thermometer,
  Trash2,
  ScanSearch,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertList } from '@/components/alert-list'
import { AnimalLink, EarTag, StatusBadge } from '@/components/flock-ui'
import { RecordDialog, type RecordKind } from '@/components/record-dialog'
import { Timeline } from '@/components/profile/timeline'
import { MedicalTab } from '@/components/profile/medical-tab'
import { ReproTab } from '@/components/profile/repro-tab'
import { WeightTab } from '@/components/profile/weight-tab'
import { PedigreeTab } from '@/components/profile/pedigree-tab'
import { EventsTab } from '@/components/profile/events-tab'
import { RationTab } from '@/components/profile/ration-tab'
import { deleteAnimalCascade, type Animal, type FlockData } from '@/lib/db'
import { BIRTH_TYPE_LABEL, ORIGIN_LABEL, SEX_LABEL, bcsLabel } from '@/lib/constants'
import { fa, formatAge, formatJalali, todayISO } from '@/lib/date'
import { buildTimeline, computeAlerts, lastLambing, latestBcs, latestWeight, rationForAnimalAtDate, reproductiveStatus } from '@/lib/flock'
import { cn } from '@/lib/utils'

const QUICK: { kind: RecordKind; label: string; icon: typeof Scale; femaleOnly?: boolean }[] = [
  { kind: 'weight', label: 'ثبت وزن', icon: Scale },
  { kind: 'treatment', label: 'ثبت درمان', icon: Stethoscope },
  { kind: 'vaccine', label: 'ثبت واکسن', icon: Syringe },
  { kind: 'lambing', label: 'ثبت زایش', icon: Baby, femaleOnly: true },
  { kind: 'event', label: 'ثبت رویداد', icon: Flag },
  { kind: 'bcs', label: 'ثبت BCS', icon: Gauge },
  { kind: 'disease', label: 'ثبت بیماری', icon: Thermometer },
  { kind: 'mating', label: 'جفت‌گیری', icon: Heart, femaleOnly: true },
  { kind: 'pregnancy', label: 'تشخیص آبستنی', icon: ScanSearch, femaleOnly: true },
  { kind: 'movement', label: 'جابه‌جایی', icon: ArrowLeftRight },
  { kind: 'exit', label: 'فروش / حذف', icon: LogOut },
]

function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-bold leading-snug text-pretty">{value}</span>
      {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
    </div>
  )
}

export function AnimalProfile({ data, animal }: { data: FlockData; animal: Animal }) {
  const router = useRouter()
  const [dialog, setDialog] = useState<RecordKind | null>(null)
  const id = animal.id!
  const sire = data.animals.find((a) => a.id === animal.sireId)
  const dam = data.animals.find((a) => a.id === animal.damId)
  const pen = data.pens.find((p) => p.id === animal.penId)
  const currentRationState = animal.status === 'active' ? rationForAnimalAtDate(data, id, todayISO()) : undefined
  const weight = latestWeight(data, id)
  const bcs = latestBcs(data, id)
  const lambing = lastLambing(data, id)
  const alerts = computeAlerts(data, id)
  const timeline = buildTimeline(data, animal)
  const isActive = animal.status === 'active'
  const quick = QUICK.filter((q) => (!q.femaleOnly || animal.sex === 'female') && (isActive || q.kind === 'event'))

  async function onDelete() {
    if (!window.confirm('پرونده این دام و تمام سوابقش برای همیشه حذف شود؟ (برای فروش یا تلفات از «فروش / حذف» استفاده کنید)')) return
    await deleteAnimalCascade(id)
    toast.success('پرونده حذف شد')
    router.push('/herd')
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 md:flex-row md:p-6">
        <div className="relative size-32 shrink-0 self-center overflow-hidden rounded-xl bg-secondary md:size-40 md:self-start">
          {animal.photo ? (
            <Image src={animal.photo || '/placeholder.svg'} alt={`عکس دام ${animal.earTag}`} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-lg font-bold text-secondary-foreground">
              {animal.sex === 'male' ? 'قوچ' : 'میش'}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <EarTag value={animal.earTag} size="lg" />
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">{animal.name || `دام ${fa(animal.earTag)}`}</h1>
                <span className="font-mono text-sm text-muted-foreground" dir="ltr">
                  {animal.code}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <StatusBadge status={animal.status} />
              <Button variant="outline" size="icon" onClick={() => window.print()} aria-label="چاپ پرونده">
                <Printer aria-hidden />
              </Button>
              <Button variant="outline" size="icon" nativeButton={false} render={<Link href={`/animals/edit?id=${id}`} />} aria-label="ویرایش شناسنامه">
                <Pencil aria-hidden />
              </Button>
              <Button variant="outline" size="icon" onClick={onDelete} aria-label="حذف پرونده" className="text-destructive">
                <Trash2 aria-hidden />
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <InfoItem label="جنسیت">{SEX_LABEL[animal.sex]}</InfoItem>
            <InfoItem label="نژاد">{animal.breed}</InfoItem>
            <InfoItem label="تاریخ تولد">
              {formatJalali(animal.birthDate)}
              {animal.birthDate ? <span className="text-muted-foreground"> ({formatAge(animal.birthDate)})</span> : null}
            </InfoItem>
            <InfoItem label="تاریخ ورود">{formatJalali(animal.entryDate)} · {ORIGIN_LABEL[animal.origin]}</InfoItem>
            <InfoItem label="پدر"><AnimalLink animal={sire} fallback={animal.sireLabel} /></InfoItem>
            <InfoItem label="مادر"><AnimalLink animal={dam} fallback={animal.damLabel} /></InfoItem>
            <InfoItem label="جایگاه">{pen?.name ?? '—'}</InfoItem>
            <InfoItem label="جیره فعلی">
              {currentRationState?.ration ? `جیره ${fa(currentRationState.ration.code)}${currentRationState.ration.name ? ` — ${currentRationState.ration.name}` : ''}` : animal.status === 'active' ? 'ثبت نشده' : '—'}
            </InfoItem>
            <InfoItem label="نوع تولد">{animal.birthType ? BIRTH_TYPE_LABEL[animal.birthType] : '—'}</InfoItem>
          </dl>
          {animal.notes ? <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed">{animal.notes}</p> : null}
        </div>
      </section>

      <section aria-label="خلاصه وضعیت" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="وزن فعلی" value={weight ? `${fa(weight.weight)} کیلوگرم` : 'ثبت نشده'} sub={weight ? formatJalali(weight.date) : undefined} />
        <SummaryCard label="وضعیت بدنی (BCS)" value={bcs ? `${fa(bcs.score)} — ${bcsLabel(bcs.score)}` : 'ثبت نشده'} sub={bcs ? formatJalali(bcs.date) : undefined} />
        <SummaryCard label="وضعیت تولیدمثل" value={reproductiveStatus(data, animal)} />
        <SummaryCard
          label="آخرین زایش"
          value={animal.sex === 'male' ? '—' : lambing ? formatJalali(lambing.date) : 'ندارد'}
          sub={lambing ? `${fa(lambing.total)} بره، ${fa(lambing.alive)} زنده` : undefined}
        />
      </section>

      {isActive || quick.length ? (
        <section aria-label="ثبت سریع" className="print:hidden">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {quick.map(({ kind, label, icon: Icon }, i) => (
              <button
                key={kind}
                type="button"
                onClick={() => setDialog(kind)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                  i < 5 ? 'border-primary/20 bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-card hover:bg-muted',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="هشدارها" className="flex flex-col gap-2">
        <h2 className="font-semibold">هشدارها و پیگیری‌ها</h2>
        <AlertList alerts={alerts} data={data} />
      </section>

      <Tabs defaultValue="summary" className="gap-4">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <TabsList className="h-11 w-max">
            <TabsTrigger value="summary" className="px-4">خلاصه و Timeline</TabsTrigger>
            <TabsTrigger value="medical" className="px-4">پزشکی</TabsTrigger>
            <TabsTrigger value="repro" className="px-4">تولیدمثل</TabsTrigger>
            <TabsTrigger value="weight" className="px-4">وزن و BCS</TabsTrigger>
            <TabsTrigger value="ration" className="px-4">جیره</TabsTrigger>
            <TabsTrigger value="pedigree" className="px-4">شجره</TabsTrigger>
            <TabsTrigger value="events" className="px-4">رویدادها</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="summary">
          <section className="rounded-xl border bg-card p-4 md:p-6">
            <h3 className="mb-4 font-semibold">سیر زندگی دام</h3>
            <Timeline items={timeline} />
          </section>
        </TabsContent>
        <TabsContent value="medical"><MedicalTab data={data} animal={animal} open={setDialog} /></TabsContent>
        <TabsContent value="repro"><ReproTab data={data} animal={animal} open={setDialog} /></TabsContent>
        <TabsContent value="weight"><WeightTab data={data} animal={animal} open={setDialog} /></TabsContent>
        <TabsContent value="ration"><RationTab data={data} animal={animal} /></TabsContent>
        <TabsContent value="pedigree"><PedigreeTab data={data} animal={animal} /></TabsContent>
        <TabsContent value="events"><EventsTab data={data} animal={animal} open={setDialog} /></TabsContent>
      </Tabs>

      <RecordDialog kind={dialog} data={data} animal={animal} onClose={() => setDialog(null)} />
    </div>
  )
}
