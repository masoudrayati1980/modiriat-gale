import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AnimalNewPage } from '@/components/animal-pages'
import { LoadingBlock } from '@/components/flock-ui'

export const metadata: Metadata = { title: 'ثبت دام جدید | گله‌یار' }

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AnimalNewPage />
    </Suspense>
  )
}
