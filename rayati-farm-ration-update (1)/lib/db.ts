import Dexie, { type EntityTable } from 'dexie'

export type Sex = 'male' | 'female'
export type AnimalStatus = 'active' | 'sold' | 'dead' | 'culled'
export type Origin = 'born' | 'purchased'
export type BirthType = 'single' | 'twin' | 'triplet' | 'quad'

export interface Animal {
  id?: number
  code: string
  earTag: string
  name?: string
  sex: Sex
  breed: string
  color?: string
  birthDate?: string
  entryDate: string
  origin: Origin
  sireId?: number
  damId?: number
  sireLabel?: string
  damLabel?: string
  status: AnimalStatus
  penId?: number
  photo?: string
  birthWeight?: number
  birthType?: BirthType
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface Pen {
  id?: number
  name: string
  kind?: string
  capacity?: number
}

export interface Ration {
  id?: number
  code: string
  name?: string
  ingredients?: string
  dailyKgPerHead?: number
  notes?: string
  active: boolean
  createdAt: number
  updatedAt: number
}

export interface PenRationAssignment {
  id?: number
  penId: number
  rationId: number
  startDate: string
  note?: string
}

export interface WeightRecord {
  id?: number
  animalId: number
  date: string
  weight: number
  note?: string
}

export interface BcsRecord {
  id?: number
  animalId: number
  date: string
  score: number
  note?: string
}

export type Severity = 'mild' | 'moderate' | 'severe'
export type DiseaseStatus = 'active' | 'recovered' | 'chronic'

export interface Disease {
  id?: number
  animalId: number
  date: string
  name: string
  symptoms?: string
  severity: Severity
  status: DiseaseStatus
  recoveredDate?: string
  note?: string
}

export type TreatmentType =
  | 'treatment'
  | 'therapy'
  | 'surgery'
  | 'deworming'
  | 'hoof'
  | 'exam'
  | 'other'

export interface Treatment {
  id?: number
  animalId: number
  date: string
  type: TreatmentType
  diseaseId?: number
  description: string
  vet?: string
  cost?: number
  followUpDate?: string
  followUpDone?: boolean
}

export type Route = 'IM' | 'SC' | 'IV' | 'oral' | 'topical' | 'other'

export interface Medication {
  id?: number
  animalId: number
  treatmentId?: number
  date: string
  drug: string
  dose?: string
  route?: Route
  durationDays?: number
  withdrawalDays?: number
  note?: string
}

export interface Vaccination {
  id?: number
  animalId: number
  date: string
  vaccine: string
  dose?: string
  batch?: string
  nextDueDate?: string
  note?: string
}

export type MatingMethod = 'natural' | 'ai' | 'synchronized'
export type PregnancyState = 'unknown' | 'pregnant' | 'open'

export interface Mating {
  id?: number
  eweId: number
  ramId?: number
  ramLabel?: string
  date: string
  method: MatingMethod
  pregnancy: PregnancyState
  checkDate?: string
  expectedDate: string
  closed?: boolean
  note?: string
}

export type LambingEase = 'normal' | 'assisted' | 'difficult' | 'cesarean' | 'abortion'

export interface Lambing {
  id?: number
  eweId: number
  matingId?: number
  sireId?: number
  date: string
  total: number
  alive: number
  dead: number
  ease: LambingEase
  note?: string
}

export interface Lamb {
  id?: number
  lambingId: number
  damId: number
  sex: Sex
  birthWeight?: number
  alive: boolean
  animalId?: number
}

export interface Movement {
  id?: number
  animalId: number
  date: string
  fromPenId?: number
  toPenId: number
  reason?: string
}

export type EventCategory =
  | 'observation'
  | 'shearing'
  | 'hoof'
  | 'tag'
  | 'injury'
  | 'other'

export interface FarmEvent {
  id?: number
  animalId: number
  date: string
  category: EventCategory
  title: string
  description?: string
}

export type ExitType = 'sold' | 'dead' | 'culled'

export interface ExitRecord {
  id?: number
  animalId: number
  date: string
  type: ExitType
  reason?: string
  price?: number
  weight?: number
  buyer?: string
  note?: string
}

export class FlockDB extends Dexie {
  animals!: EntityTable<Animal, 'id'>
  pens!: EntityTable<Pen, 'id'>
  rations!: EntityTable<Ration, 'id'>
  penRations!: EntityTable<PenRationAssignment, 'id'>
  weights!: EntityTable<WeightRecord, 'id'>
  bcs!: EntityTable<BcsRecord, 'id'>
  diseases!: EntityTable<Disease, 'id'>
  treatments!: EntityTable<Treatment, 'id'>
  medications!: EntityTable<Medication, 'id'>
  vaccinations!: EntityTable<Vaccination, 'id'>
  matings!: EntityTable<Mating, 'id'>
  lambings!: EntityTable<Lambing, 'id'>
  lambs!: EntityTable<Lamb, 'id'>
  movements!: EntityTable<Movement, 'id'>
  events!: EntityTable<FarmEvent, 'id'>
  exits!: EntityTable<ExitRecord, 'id'>

  constructor() {
    super('galleh-db')
    this.version(1).stores({
      animals: '++id, &code, earTag, sex, breed, status, penId, damId, sireId',
      pens: '++id, name',
      weights: '++id, animalId, date',
      bcs: '++id, animalId, date',
      diseases: '++id, animalId, date, status',
      treatments: '++id, animalId, date, diseaseId',
      medications: '++id, animalId, date, treatmentId',
      vaccinations: '++id, animalId, date, vaccine',
      matings: '++id, eweId, ramId, date',
      lambings: '++id, eweId, date, matingId',
      lambs: '++id, lambingId, damId, animalId',
      movements: '++id, animalId, date',
      events: '++id, animalId, date, category',
      exits: '++id, animalId, date, type',
    })
    this.version(2).stores({
      animals: '++id, &code, earTag, sex, breed, status, penId, damId, sireId',
      pens: '++id, name',
      rations: '++id, &code, active',
      penRations: '++id, penId, rationId, startDate',
      weights: '++id, animalId, date',
      bcs: '++id, animalId, date',
      diseases: '++id, animalId, date, status',
      treatments: '++id, animalId, date, diseaseId',
      medications: '++id, animalId, date, treatmentId',
      vaccinations: '++id, animalId, date, vaccine',
      matings: '++id, eweId, ramId, date',
      lambings: '++id, eweId, date, matingId',
      lambs: '++id, lambingId, damId, animalId',
      movements: '++id, animalId, date',
      events: '++id, animalId, date, category',
      exits: '++id, animalId, date, type',
    })
  }
}

export const db = new FlockDB()

export const RECORD_TABLES = [
  'animals',
  'pens',
  'rations',
  'penRations',
  'weights',
  'bcs',
  'diseases',
  'treatments',
  'medications',
  'vaccinations',
  'matings',
  'lambings',
  'lambs',
  'movements',
  'events',
  'exits',
] as const

export type TableName = (typeof RECORD_TABLES)[number]

export interface FlockData {
  animals: Animal[]
  pens: Pen[]
  rations: Ration[]
  penRations: PenRationAssignment[]
  weights: WeightRecord[]
  bcs: BcsRecord[]
  diseases: Disease[]
  treatments: Treatment[]
  medications: Medication[]
  vaccinations: Vaccination[]
  matings: Mating[]
  lambings: Lambing[]
  lambs: Lamb[]
  movements: Movement[]
  events: FarmEvent[]
  exits: ExitRecord[]
}

export async function loadAll(): Promise<FlockData> {
  const entries = await Promise.all(
    RECORD_TABLES.map(async (name) => [name, await db.table(name).toArray()] as const),
  )
  return Object.fromEntries(entries) as unknown as FlockData
}

export async function deleteAnimalCascade(animalId: number) {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all([
      db.weights.where('animalId').equals(animalId).delete(),
      db.bcs.where('animalId').equals(animalId).delete(),
      db.diseases.where('animalId').equals(animalId).delete(),
      db.treatments.where('animalId').equals(animalId).delete(),
      db.medications.where('animalId').equals(animalId).delete(),
      db.vaccinations.where('animalId').equals(animalId).delete(),
      db.matings.where('eweId').equals(animalId).delete(),
      db.lambings.where('eweId').equals(animalId).delete(),
      db.movements.where('animalId').equals(animalId).delete(),
      db.events.where('animalId').equals(animalId).delete(),
      db.exits.where('animalId').equals(animalId).delete(),
    ])
    await db.animals.where('damId').equals(animalId).modify({ damId: undefined })
    await db.animals.where('sireId').equals(animalId).modify({ sireId: undefined })
    await db.animals.delete(animalId)
  })
}
