import { db, type Animal } from './db'
import { addDays, isoToJalaliParts, todayISO } from './date'
import { GESTATION_DAYS } from './constants'

export async function seedDemo() {
  const today = todayISO()
  const year = isoToJalaliParts(today).jy
  const d = (offset: number) => addDays(today, offset)
  const now = Date.now()
  let seq = 1
  const code = () => `${year}-${String(seq++).padStart(4, '0')}`

  await db.transaction('rw', db.tables, async () => {
    const [penA, penB, penC] = (await db.pens.bulkAdd(
      [{ name: 'سالن میش‌ها', kind: 'سالن', capacity: 80 }, { name: 'بهاربند قوچ‌ها', kind: 'بهاربند', capacity: 15 }, { name: 'زایشگاه', kind: 'زایشگاه', capacity: 20 }],
      { allKeys: true },
    )) as number[]

    const ration1 = (await db.rations.add({
      code: '1',
      name: 'میش نگهداری',
      ingredients: 'یونجه، کاه، جو، کنسانتره',
      dailyKgPerHead: 1.6,
      notes: 'نمونه برای تست گزارش جیره',
      active: true,
      createdAt: now,
      updatedAt: now,
    })) as number
    const ration2 = (await db.rations.add({
      code: '2',
      name: 'پرواری',
      ingredients: 'یونجه، جو، کنسانتره پرواری',
      dailyKgPerHead: 1.8,
      notes: 'نمونه جیره پرواری',
      active: true,
      createdAt: now,
      updatedAt: now,
    })) as number
    const ration3 = (await db.rations.add({
      code: '3',
      name: 'زایشگاه',
      ingredients: 'یونجه باکیفیت، جو، کنسانتره شیردهی',
      dailyKgPerHead: 2.0,
      notes: 'نمونه جیره زایشگاه',
      active: true,
      createdAt: now,
      updatedAt: now,
    })) as number
    await db.penRations.bulkAdd([
      { penId: penA, rationId: ration1, startDate: d(-240) },
      { penId: penA, rationId: ration2, startDate: d(-60), note: 'تغییر برای دوره پرواری' },
      { penId: penB, rationId: ration2, startDate: d(-240) },
      { penId: penC, rationId: ration3, startDate: d(-240) },
    ])

    const base = (a: Partial<Animal>): Animal => ({
      code: code(), earTag: '', sex: 'female', breed: 'افشاری', entryDate: d(-900), origin: 'purchased', status: 'active', createdAt: now, updatedAt: now, ...a,
    } as Animal)

    const ram1 = (await db.animals.add(base({ earTag: '101', name: 'سلطان', sex: 'male', breed: 'افشاری', birthDate: d(-1300), penId: penB, sireLabel: 'ایستگاه اصلاح نژاد', damLabel: 'نامشخص' }))) as number
    const ram2 = (await db.animals.add(base({ earTag: '102', name: 'ببر', sex: 'male', breed: 'رومانوف', birthDate: d(-900), penId: penB }))) as number
    const ewe1 = (await db.animals.add(base({ earTag: '201', name: 'گلی', birthDate: d(-1500), penId: penC }))) as number
    const ewe2 = (await db.animals.add(base({ earTag: '202', birthDate: d(-1100), penId: penA }))) as number
    const ewe3 = (await db.animals.add(base({ earTag: '203', name: 'سفیدک', breed: 'لری بختیاری', birthDate: d(-1000), penId: penA }))) as number
    const ewe4 = (await db.animals.add(base({ earTag: '204', breed: 'آمیخته', birthDate: d(-800), penId: penA, origin: 'born', entryDate: d(-800), damId: ewe1, sireId: ram1, birthType: 'twin', birthWeight: 4.1 }))) as number
    const ewe5 = (await db.animals.add(base({ earTag: '205', birthDate: d(-1200), penId: penA }))) as number

    const lamb1Birth = d(-120)
    const lambingId = (await db.lambings.add({ eweId: ewe2, sireId: ram1, date: lamb1Birth, total: 2, alive: 2, dead: 0, ease: 'normal' })) as number
    const lamb1 = (await db.animals.add(base({ earTag: '301', sex: 'male', breed: 'افشاری', birthDate: lamb1Birth, entryDate: lamb1Birth, origin: 'born', damId: ewe2, sireId: ram1, penId: penA, birthType: 'twin', birthWeight: 4.3 }))) as number
    const lamb2 = (await db.animals.add(base({ earTag: '302', sex: 'female', breed: 'افشاری', birthDate: lamb1Birth, entryDate: lamb1Birth, origin: 'born', damId: ewe2, sireId: ram1, penId: penA, birthType: 'twin', birthWeight: 3.9 }))) as number
    await db.lambs.bulkAdd([
      { lambingId, damId: ewe2, sex: 'male', birthWeight: 4.3, alive: true, animalId: lamb1 },
      { lambingId, damId: ewe2, sex: 'female', birthWeight: 3.9, alive: true, animalId: lamb2 },
    ])
    await db.matings.add({ eweId: ewe2, ramId: ram1, date: addDays(lamb1Birth, -GESTATION_DAYS), method: 'natural', pregnancy: 'pregnant', expectedDate: lamb1Birth, closed: true })

    const lambsWeights = [[0, 4.3, 3.9], [30, 11.2, 10.1], [60, 18.5, 16.2], [90, 25.4, 22.0], [118, 31.6, 27.4]]
    for (const [off, w1, w2] of lambsWeights) {
      await db.weights.add({ animalId: lamb1, date: addDays(lamb1Birth, off), weight: w1, note: off === 0 ? 'وزن تولد' : undefined })
      await db.weights.add({ animalId: lamb2, date: addDays(lamb1Birth, off), weight: w2, note: off === 0 ? 'وزن تولد' : undefined })
    }

    await db.matings.bulkAdd([
      { eweId: ewe1, ramId: ram1, date: d(-140), method: 'natural', pregnancy: 'pregnant', checkDate: d(-95), expectedDate: d(-140 + GESTATION_DAYS) },
      { eweId: ewe3, ramId: ram2, date: d(-40), method: 'synchronized', pregnancy: 'unknown', expectedDate: d(-40 + GESTATION_DAYS) },
      { eweId: ewe5, ramId: ram2, date: d(-80), method: 'natural', pregnancy: 'pregnant', checkDate: d(-40), expectedDate: d(-80 + GESTATION_DAYS) },
    ])

    for (const [id, ws] of [[ewe1, [62, 64, 66]], [ewe2, [58, 52, 55]], [ewe3, [60, 61, 63]], [ewe4, [48, 52, 55]], [ewe5, [57, 59, 61]], [ram1, [88, 90, 92]], [ram2, [76, 79, 81]]] as [number, number[]][]) {
      for (let i = 0; i < ws.length; i++) await db.weights.add({ animalId: id, date: d(-180 + i * 75), weight: ws[i] })
    }
    await db.bcs.bulkAdd([
      { animalId: ewe1, date: d(-10), score: 3.5 },
      { animalId: ewe2, date: d(-10), score: 2.5 },
      { animalId: ewe3, date: d(-10), score: 3 },
      { animalId: ewe4, date: d(-10), score: 1.5, note: 'نیاز به بررسی دندان و انگل' },
      { animalId: ram1, date: d(-10), score: 3.5 },
    ])

    for (const id of [ram1, ram2, ewe1, ewe2, ewe3, ewe4, ewe5]) {
      await db.vaccinations.add({ animalId: id, date: d(-175), vaccine: 'آنتروتوکسمی', dose: '۲ سی‌سی', nextDueDate: d(5) })
      await db.vaccinations.add({ animalId: id, date: d(-60), vaccine: 'تب برفکی', dose: '۱ سی‌سی', nextDueDate: d(120) })
    }

    const diseaseId = (await db.diseases.add({ animalId: ewe2, date: d(-3), name: 'ورم پستان', symptoms: 'تورم و گرمی پستان راست', severity: 'moderate', status: 'active' })) as number
    const treatmentId = (await db.treatments.add({ animalId: ewe2, date: d(-3), type: 'treatment', diseaseId, description: 'آنتی‌بیوتیک و دوشیدن کامل', vet: 'دکتر رضایی', cost: 450000, followUpDate: d(1), followUpDone: false })) as number
    await db.medications.add({ animalId: ewe2, treatmentId, date: d(-3), drug: 'پنی‌استرپ', dose: '۵ سی‌سی', route: 'IM', durationDays: 3, withdrawalDays: 21 })
    await db.treatments.add({ animalId: ewe4, date: d(-30), type: 'deworming', description: 'داروی ضدانگل خوراکی', cost: 80000 })
    await db.medications.add({ animalId: ewe4, date: d(-30), drug: 'آلبندازول', dose: '۱۰ سی‌سی', route: 'oral' })

    await db.movements.bulkAdd([
      { animalId: ewe1, date: d(-7), fromPenId: penA, toPenId: penC, reason: 'نزدیک زایش' },
    ])
    await db.events.bulkAdd([
      { animalId: ewe1, date: d(-200), category: 'shearing', title: 'پشم‌چینی بهاره' },
      { animalId: ram1, date: d(-25), category: 'hoof', title: 'سم‌چینی' },
      { animalId: ewe3, date: d(-15), category: 'observation', title: 'کاهش اشتها', description: 'تحت نظر' },
    ])

    const soldId = (await db.animals.add(base({ earTag: '150', sex: 'male', birthDate: d(-400), status: 'sold' }))) as number
    await db.exits.add({ animalId: soldId, date: d(-20), type: 'sold', price: 12_500_000, weight: 52, buyer: 'کشتارگاه' })
  })
}
