'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { loadAll, type Animal, type FlockData } from './db'
import { addDays, diffDays, formatJalali, isoToJalaliParts, relativeDays, todayISO } from './date'
import {
  EASE_LABEL,
  EVENT_CATEGORY_LABEL,
  EXIT_TYPE_LABEL,
  GESTATION_DAYS,
  MATING_METHOD_LABEL,
  PREGNANCY_CHECK_AFTER_DAYS,
  PREGNANCY_LABEL,
  SEVERITY_LABEL,
  TREATMENT_TYPE_LABEL,
} from './constants'
import { fa } from './date'

export function useFlock(): FlockData | undefined {
  return useLiveQuery(loadAll, [])
}

const byDateDesc = <T extends { date: string }>(a: T, b: T) => b.date.localeCompare(a.date)

export function latestWeight(data: FlockData, animalId: number) {
  return data.weights.filter((w) => w.animalId === animalId).sort(byDateDesc)[0]
}

export function latestBcs(data: FlockData, animalId: number) {
  return data.bcs.filter((w) => w.animalId === animalId).sort(byDateDesc)[0]
}

export function lastLambing(data: FlockData, animalId: number) {
  return data.lambings.filter((l) => l.eweId === animalId).sort(byDateDesc)[0]
}

export function openMating(data: FlockData, animalId: number) {
  return data.matings
    .filter((m) => m.eweId === animalId && !m.closed && m.pregnancy !== 'open')
    .sort(byDateDesc)[0]
}

export function animalLabel(a?: Animal) {
  if (!a) return '—'
  return a.name ? `${a.name} (${fa(a.earTag)})` : `گوشواره ${fa(a.earTag)}`
}

export function reproductiveStatus(data: FlockData, animal: Animal): string {
  if (animal.sex === 'male') {
    const services = data.matings.filter((m) => m.ramId === animal.id).length
    return services ? `${fa(services)} جفت‌گیری ثبت‌شده` : 'قوچ'
  }
  const mating = openMating(data, animal.id!)
  if (mating) {
    if (mating.pregnancy === 'pregnant') {
      return `آبستن — زایش ${relativeDays(mating.expectedDate)}`
    }
    return 'جفت‌گیری شده (منتظر تشخیص)'
  }
  const last = lastLambing(data, animal.id!)
  if (last && diffDays(last.date, todayISO()) < 90) return 'شیرده / تازه‌زا'
  return 'خشک / آماده جفت‌گیری'
}

export type AlertKind = 'vaccine' | 'lambing' | 'followup' | 'disease' | 'withdrawal' | 'pregcheck' | 'bcs'
export type AlertLevel = 'danger' | 'warning' | 'info'

export interface FlockAlert {
  key: string
  animalId: number
  kind: AlertKind
  level: AlertLevel
  title: string
  detail: string
  date?: string
}

export function computeAlerts(data: FlockData, onlyAnimalId?: number): FlockAlert[] {
  const today = todayISO()
  const active = new Set(
    data.animals.filter((a) => a.status === 'active').map((a) => a.id!),
  )
  const scope = (id: number) => active.has(id) && (onlyAnimalId === undefined || id === onlyAnimalId)
  const alerts: FlockAlert[] = []

  const latestVaccine = new Map<string, (typeof data.vaccinations)[number]>()
  for (const v of data.vaccinations) {
    const key = `${v.animalId}|${v.vaccine}`
    const prev = latestVaccine.get(key)
    if (!prev || prev.date < v.date) latestVaccine.set(key, v)
  }
  for (const v of latestVaccine.values()) {
    if (!scope(v.animalId) || !v.nextDueDate) continue
    const days = diffDays(today, v.nextDueDate)
    if (days <= 14) {
      alerts.push({
        key: `vac-${v.id}`,
        animalId: v.animalId,
        kind: 'vaccine',
        level: days < 0 ? 'danger' : 'warning',
        title: `واکسن ${v.vaccine}`,
        detail: days < 0 ? `سررسید گذشته (${relativeDays(v.nextDueDate)})` : `سررسید ${relativeDays(v.nextDueDate)}`,
        date: v.nextDueDate,
      })
    }
  }

  for (const m of data.matings) {
    if (!scope(m.eweId) || m.closed || m.pregnancy === 'open') continue
    const days = diffDays(today, m.expectedDate)
    if (days <= 21 && days >= -30) {
      alerts.push({
        key: `lamb-${m.id}`,
        animalId: m.eweId,
        kind: 'lambing',
        level: days <= 3 ? 'danger' : 'warning',
        title: 'زایش نزدیک',
        detail: `تاریخ پیش‌بینی ${formatJalali(m.expectedDate)} (${relativeDays(m.expectedDate)})`,
        date: m.expectedDate,
      })
    }
    if (m.pregnancy === 'unknown' && diffDays(m.date, today) >= PREGNANCY_CHECK_AFTER_DAYS) {
      alerts.push({
        key: `preg-${m.id}`,
        animalId: m.eweId,
        kind: 'pregcheck',
        level: 'info',
        title: 'نیاز به تشخیص آبستنی',
        detail: `${fa(diffDays(m.date, today))} روز از جفت‌گیری گذشته`,
        date: m.date,
      })
    }
  }

  for (const t of data.treatments) {
    if (!scope(t.animalId) || !t.followUpDate || t.followUpDone) continue
    const days = diffDays(today, t.followUpDate)
    if (days <= 3) {
      alerts.push({
        key: `fu-${t.id}`,
        animalId: t.animalId,
        kind: 'followup',
        level: days < 0 ? 'danger' : 'warning',
        title: `پیگیری ${TREATMENT_TYPE_LABEL[t.type]}`,
        detail: `${t.description} — ${relativeDays(t.followUpDate)}`,
        date: t.followUpDate,
      })
    }
  }

  for (const d of data.diseases) {
    if (!scope(d.animalId) || d.status !== 'active') continue
    alerts.push({
      key: `dis-${d.id}`,
      animalId: d.animalId,
      kind: 'disease',
      level: d.severity === 'severe' ? 'danger' : 'warning',
      title: `بیماری فعال: ${d.name}`,
      detail: `شدت ${SEVERITY_LABEL[d.severity]} — از ${formatJalali(d.date)}`,
      date: d.date,
    })
  }

  for (const med of data.medications) {
    if (!scope(med.animalId) || !med.withdrawalDays) continue
    const start = addDays(med.date, med.durationDays ?? 0)
    const end = addDays(start, med.withdrawalDays)
    if (end >= today) {
      alerts.push({
        key: `wd-${med.id}`,
        animalId: med.animalId,
        kind: 'withdrawal',
        level: 'warning',
        title: `دوره منع مصرف ${med.drug}`,
        detail: `گوشت و شیر تا ${formatJalali(end)} قابل فروش نیست`,
        date: end,
      })
    }
  }

  const latestBcsByAnimal = new Map<number, (typeof data.bcs)[number]>()
  for (const b of data.bcs) {
    const prev = latestBcsByAnimal.get(b.animalId)
    if (!prev || prev.date < b.date) latestBcsByAnimal.set(b.animalId, b)
  }
  for (const b of latestBcsByAnimal.values()) {
    if (!scope(b.animalId) || b.score >= 2) continue
    alerts.push({
      key: `bcs-${b.id}`,
      animalId: b.animalId,
      kind: 'bcs',
      level: 'warning',
      title: 'وضعیت بدنی پایین',
      detail: `BCS ${fa(b.score)} در ${formatJalali(b.date)}`,
      date: b.date,
    })
  }

  const rank: Record<AlertLevel, number> = { danger: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => rank[a.level] - rank[b.level] || (a.date ?? '').localeCompare(b.date ?? ''))
}

export type TimelineKind =
  | 'birth'
  | 'entry'
  | 'weight'
  | 'bcs'
  | 'disease'
  | 'treatment'
  | 'medication'
  | 'vaccine'
  | 'mating'
  | 'lambing'
  | 'movement'
  | 'ration'
  | 'event'
  | 'exit'

export interface TimelineItem {
  key: string
  date: string
  kind: TimelineKind
  title: string
  detail?: string
}

export function buildTimeline(data: FlockData, animal: Animal): TimelineItem[] {
  const id = animal.id!
  const penName = (pid?: number) => data.pens.find((p) => p.id === pid)?.name ?? 'نامشخص'
  const items: TimelineItem[] = []

  if (animal.birthDate) {
    items.push({ key: 'birth', date: animal.birthDate, kind: 'birth', title: 'تولد', detail: animal.birthWeight ? `وزن تولد ${fa(animal.birthWeight)} کیلوگرم` : undefined })
  }
  if (animal.origin === 'purchased') {
    items.push({ key: 'entry', date: animal.entryDate, kind: 'entry', title: 'ورود به گله (خرید)' })
  }
  for (const w of data.weights.filter((x) => x.animalId === id)) {
    items.push({ key: `w${w.id}`, date: w.date, kind: 'weight', title: `وزن‌کشی: ${fa(w.weight)} کیلوگرم`, detail: w.note })
  }
  for (const b of data.bcs.filter((x) => x.animalId === id)) {
    items.push({ key: `b${b.id}`, date: b.date, kind: 'bcs', title: `نمره وضعیت بدنی: ${fa(b.score)}`, detail: b.note })
  }
  for (const d of data.diseases.filter((x) => x.animalId === id)) {
    items.push({ key: `d${d.id}`, date: d.date, kind: 'disease', title: `بیماری: ${d.name}`, detail: [SEVERITY_LABEL[d.severity], d.symptoms].filter(Boolean).join(' — ') })
  }
  for (const t of data.treatments.filter((x) => x.animalId === id)) {
    items.push({ key: `t${t.id}`, date: t.date, kind: 'treatment', title: `${TREATMENT_TYPE_LABEL[t.type]}: ${t.description}`, detail: t.vet ? `دامپزشک: ${t.vet}` : undefined })
  }
  for (const m of data.medications.filter((x) => x.animalId === id)) {
    items.push({ key: `m${m.id}`, date: m.date, kind: 'medication', title: `دارو: ${m.drug}`, detail: m.dose })
  }
  for (const v of data.vaccinations.filter((x) => x.animalId === id)) {
    items.push({ key: `v${v.id}`, date: v.date, kind: 'vaccine', title: `واکسن: ${v.vaccine}`, detail: v.nextDueDate ? `نوبت بعد ${formatJalali(v.nextDueDate)}` : undefined })
  }
  for (const m of data.matings.filter((x) => x.eweId === id || x.ramId === id)) {
    const partner = m.eweId === id ? data.animals.find((a) => a.id === m.ramId) : data.animals.find((a) => a.id === m.eweId)
    const partnerText = partner ? animalLabel(partner) : m.ramLabel ?? ''
    items.push({ key: `mt${m.id}`, date: m.date, kind: 'mating', title: `جفت‌گیری (${MATING_METHOD_LABEL[m.method]})`, detail: `${partnerText ? `با ${partnerText} — ` : ''}${PREGNANCY_LABEL[m.pregnancy]}` })
  }
  for (const l of data.lambings.filter((x) => x.eweId === id)) {
    items.push({ key: `l${l.id}`, date: l.date, kind: 'lambing', title: `زایش: ${fa(l.total)} بره (${fa(l.alive)} زنده)`, detail: EASE_LABEL[l.ease] })
  }
  for (const mv of data.movements.filter((x) => x.animalId === id)) {
    items.push({ key: `mv${mv.id}`, date: mv.date, kind: 'movement', title: `انتقال به ${penName(mv.toPenId)}`, detail: mv.fromPenId ? `از ${penName(mv.fromPenId)}${mv.reason ? ` — ${mv.reason}` : ''}` : mv.reason })
  }
  for (const rh of animalRationHistory(data, id).filter((x) => x.rationId)) {
    items.push({
      key: `ration-${rh.startDate}-${rh.penId ?? 'none'}-${rh.rationId}`,
      date: rh.startDate,
      kind: 'ration',
      title: `جیره ${fa(rh.rationCode)} در ${rh.penName}`,
      detail: rh.rationName ? rh.rationName : undefined,
    })
  }
  for (const e of data.events.filter((x) => x.animalId === id)) {
    items.push({ key: `e${e.id}`, date: e.date, kind: 'event', title: `${EVENT_CATEGORY_LABEL[e.category]}: ${e.title}`, detail: e.description })
  }
  for (const x of data.exits.filter((y) => y.animalId === id)) {
    items.push({ key: `x${x.id}`, date: x.date, kind: 'exit', title: `خروج از گله: ${EXIT_TYPE_LABEL[x.type]}`, detail: [x.reason, x.price ? `${fa(x.price)} تومان` : ''].filter(Boolean).join(' — ') })
  }
  return items.sort((a, b) => b.date.localeCompare(a.date))
}

export function expectedLambingDate(matingIso: string) {
  return addDays(matingIso, GESTATION_DAYS)
}

export function nextAnimalCode(animals: Animal[]): string {
  const year = isoToJalaliParts(todayISO()).jy
  const prefix = `${year}-`
  const max = animals
    .map((a) => a.code)
    .filter((c) => c.startsWith(prefix))
    .map((c) => Number(c.slice(prefix.length)))
    .filter((n) => Number.isFinite(n))
    .reduce((m, n) => Math.max(m, n), 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export function inbreedingWarning(data: FlockData, eweId?: number, ramId?: number): string | null {
  if (!eweId || !ramId) return null
  const ewe = data.animals.find((a) => a.id === eweId)
  const ram = data.animals.find((a) => a.id === ramId)
  if (!ewe || !ram) return null
  if (ewe.sireId === ram.id) return 'این قوچ پدر این میش است.'
  if (ram.damId === ewe.id) return 'این میش مادر این قوچ است.'
  if (ewe.sireId && ewe.sireId === ram.sireId) return 'میش و قوچ از یک پدر هستند (ناتنی/تنی).'
  if (ewe.damId && ewe.damId === ram.damId) return 'میش و قوچ از یک مادر هستند.'
  const grand = (a: Animal) =>
    [a.sireId, a.damId]
      .map((pid) => data.animals.find((x) => x.id === pid))
      .flatMap((p) => (p ? [p.sireId, p.damId] : []))
      .filter(Boolean)
  const shared = grand(ewe).filter((g) => grand(ram).includes(g))
  if (shared.length) return 'میش و قوچ پدربزرگ یا مادربزرگ مشترک دارند.'
  return null
}


export interface AnimalRationHistory {
  startDate: string
  endDate?: string
  penId?: number
  penName: string
  rationId?: number
  rationCode?: string
  rationName?: string
}

export function penAtDate(data: FlockData, animalId: number, date: string): number | undefined {
  const animal = data.animals.find((a) => a.id === animalId)
  if (!animal || date < animal.entryDate) return undefined
  const movements = data.movements
    .filter((m) => m.animalId === animalId && m.date <= date)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.id ?? 0) - (b.id ?? 0))
  return movements.length ? movements[movements.length - 1].toPenId : animal.penId
}

export function rationForPenAtDate(data: FlockData, penId: number | undefined, date: string) {
  if (!penId) return undefined
  return data.penRations
    .filter((x) => x.penId === penId && x.startDate <= date)
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || (b.id ?? 0) - (a.id ?? 0))[0]
}

export function rationForAnimalAtDate(data: FlockData, animalId: number, date: string) {
  const penId = penAtDate(data, animalId, date)
  const assignment = data.penRations
    .filter((x) => x.penId === penId && x.startDate <= date)
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || (b.id ?? 0) - (a.id ?? 0))[0]
  const ration = assignment ? data.rations.find((r) => r.id === assignment.rationId) : undefined
  const pen = penId ? data.pens.find((p) => p.id === penId) : undefined
  return { penId, pen, assignment, ration }
}

export function animalRationHistory(data: FlockData, animalId: number): AnimalRationHistory[] {
  const animal = data.animals.find((a) => a.id === animalId)
  if (!animal) return []

  const exitDates = data.exits
    .filter((x) => x.animalId === animalId)
    .map((x) => x.date)
    .sort()
  const finalDate = exitDates[0]

  const candidatePenIds = new Set<number>()
  if (animal.penId) candidatePenIds.add(animal.penId)
  for (const m of data.movements.filter((x) => x.animalId === animalId)) {
    if (m.fromPenId) candidatePenIds.add(m.fromPenId)
    candidatePenIds.add(m.toPenId)
  }

  const boundaries = new Set<string>([animal.entryDate])
  for (const m of data.movements.filter((x) => x.animalId === animalId)) {
    if (m.date >= animal.entryDate && (!finalDate || m.date <= finalDate)) boundaries.add(m.date)
  }
  for (const a of data.penRations) {
    if (candidatePenIds.has(a.penId) && a.startDate >= animal.entryDate && (!finalDate || a.startDate <= finalDate)) {
      boundaries.add(a.startDate)
    }
  }

  const dates = [...boundaries].sort()
  const history: AnimalRationHistory[] = []
  let current: AnimalRationHistory | undefined

  const sameState = (a?: AnimalRationHistory, b?: AnimalRationHistory) =>
    a?.penId === b?.penId && a?.rationId === b?.rationId

  for (const startDate of dates) {
    const state = rationForAnimalAtDate(data, animalId, startDate)
    const next: AnimalRationHistory = {
      startDate,
      penId: state.penId,
      penName: state.pen?.name ?? 'بدون جایگاه',
      rationId: state.ration?.id,
      rationCode: state.ration?.code,
      rationName: state.ration?.name,
    }
    if (current && sameState(current, next)) continue
    if (current) current.endDate = addDays(startDate, -1)
    current = next
    history.push(current)
  }

  if (current && finalDate) current.endDate = finalDate
  return history
}

export function averageDailyGain(weights: { date: string; weight: number }[]) {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return undefined
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const days = diffDays(first.date, last.date)
  if (days <= 0) return undefined
  return ((last.weight - first.weight) * 1000) / days
}
