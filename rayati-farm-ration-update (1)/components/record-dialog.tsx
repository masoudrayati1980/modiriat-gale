'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Animal, FlockData } from '@/lib/db'
import { animalLabel } from '@/lib/flock'
import {
  BcsForm,
  DiseaseForm,
  EventForm,
  ExitForm,
  LambingForm,
  MatingForm,
  MovementForm,
  PregnancyForm,
  TreatmentForm,
  VaccineForm,
  WeightForm,
  type RecordFormProps,
} from '@/components/record-forms'

export type RecordKind =
  | 'weight'
  | 'bcs'
  | 'disease'
  | 'treatment'
  | 'vaccine'
  | 'mating'
  | 'pregnancy'
  | 'lambing'
  | 'movement'
  | 'event'
  | 'exit'

export const RECORD_META: Record<RecordKind, { title: string; form: (p: RecordFormProps) => React.ReactNode }> = {
  weight: { title: 'ثبت وزن', form: WeightForm },
  bcs: { title: 'ثبت نمره وضعیت بدنی (BCS)', form: BcsForm },
  disease: { title: 'ثبت بیماری / مشکل', form: DiseaseForm },
  treatment: { title: 'ثبت درمان و دارو', form: TreatmentForm },
  vaccine: { title: 'ثبت واکسن', form: VaccineForm },
  mating: { title: 'ثبت جفت‌گیری', form: MatingForm },
  pregnancy: { title: 'ثبت تشخیص آبستنی', form: PregnancyForm },
  lambing: { title: 'ثبت زایش', form: LambingForm },
  movement: { title: 'جابه‌جایی جایگاه', form: MovementForm },
  event: { title: 'ثبت رویداد', form: EventForm },
  exit: { title: 'فروش / حذف / تلفات', form: ExitForm },
}

export function RecordDialog({
  kind,
  data,
  animal,
  onClose,
}: {
  kind: RecordKind | null
  data: FlockData
  animal: Animal
  onClose: () => void
}) {
  const meta = kind ? RECORD_META[kind] : null
  const Form = meta?.form
  return (
    <Dialog open={!!kind} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg" dir="rtl">
        {meta && Form ? (
          <>
            <DialogHeader className="text-right">
              <DialogTitle className="text-lg">{meta.title}</DialogTitle>
              <DialogDescription>{animalLabel(animal)}</DialogDescription>
            </DialogHeader>
            <Form data={data} animal={animal} onDone={onClose} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
