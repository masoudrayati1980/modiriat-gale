import type {
  AnimalStatus,
  BirthType,
  DiseaseStatus,
  EventCategory,
  ExitType,
  LambingEase,
  MatingMethod,
  Origin,
  PregnancyState,
  Route,
  Severity,
  Sex,
  TreatmentType,
} from './db'

export const GESTATION_DAYS = 147
export const PREGNANCY_CHECK_AFTER_DAYS = 35

export const BREEDS = [
  'افشاری',
  'لری بختیاری',
  'شال',
  'قزل',
  'مغانی',
  'بلوچی',
  'کردی',
  'زل',
  'سنجابی',
  'کبوده',
  'مهربان',
  'زندی',
  'رومانوف',
  'دورپر',
  'آمیخته',
]

export const COMMON_VACCINES = [
  'آنتروتوکسمی',
  'شاربن',
  'تب برفکی',
  'آبله',
  'بروسلوز (رو - ۱)',
  'طاعون نشخوارکنندگان کوچک (PPR)',
  'لنگش (کلستریدیوم)',
  'پاستورلوز',
  'آگالاکسی',
]

export const SEX_LABEL: Record<Sex, string> = { male: 'نر (قوچ)', female: 'ماده (میش)' }
export const SEX_SHORT: Record<Sex, string> = { male: 'نر', female: 'ماده' }

export const STATUS_LABEL: Record<AnimalStatus, string> = {
  active: 'فعال در گله',
  sold: 'فروخته شده',
  dead: 'تلف شده',
  culled: 'حذف شده',
}

export const ORIGIN_LABEL: Record<Origin, string> = {
  born: 'متولد گله',
  purchased: 'خریداری شده',
}

export const BIRTH_TYPE_LABEL: Record<BirthType, string> = {
  single: 'تک‌قلو',
  twin: 'دوقلو',
  triplet: 'سه‌قلو',
  quad: 'چهارقلو',
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  mild: 'خفیف',
  moderate: 'متوسط',
  severe: 'شدید',
}

export const DISEASE_STATUS_LABEL: Record<DiseaseStatus, string> = {
  active: 'درگیر',
  recovered: 'بهبود یافته',
  chronic: 'مزمن',
}

export const TREATMENT_TYPE_LABEL: Record<TreatmentType, string> = {
  treatment: 'درمان',
  therapy: 'تراپی / مراقبت',
  surgery: 'جراحی',
  deworming: 'ضدانگل',
  hoof: 'سم‌چینی',
  exam: 'معاینه',
  other: 'سایر',
}

export const ROUTE_LABEL: Record<Route, string> = {
  IM: 'عضلانی (IM)',
  SC: 'زیرجلدی (SC)',
  IV: 'وریدی (IV)',
  oral: 'خوراکی',
  topical: 'موضعی',
  other: 'سایر',
}

export const MATING_METHOD_LABEL: Record<MatingMethod, string> = {
  natural: 'طبیعی',
  ai: 'تلقیح مصنوعی',
  synchronized: 'همزمان‌سازی (اسفنج)',
}

export const PREGNANCY_LABEL: Record<PregnancyState, string> = {
  unknown: 'بررسی نشده',
  pregnant: 'آبستن',
  open: 'غیرآبستن',
}

export const EASE_LABEL: Record<LambingEase, string> = {
  normal: 'طبیعی',
  assisted: 'با کمک',
  difficult: 'سخت‌زایی',
  cesarean: 'سزارین',
  abortion: 'سقط',
}

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  observation: 'مشاهده',
  shearing: 'پشم‌چینی',
  hoof: 'سم‌چینی',
  tag: 'گوشواره / علامت‌گذاری',
  injury: 'آسیب‌دیدگی',
  other: 'سایر',
}

export const EXIT_TYPE_LABEL: Record<ExitType, string> = {
  sold: 'فروش',
  dead: 'تلفات',
  culled: 'حذف',
}

export const BCS_SCALE = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

export function bcsLabel(score?: number) {
  if (score === undefined) return '—'
  if (score < 2) return 'لاغر'
  if (score < 2.5) return 'کمی لاغر'
  if (score <= 3.5) return 'مطلوب'
  if (score <= 4) return 'کمی چاق'
  return 'چاق'
}
