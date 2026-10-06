import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AnimalEditPage } from '@/components/animal-pages'
import { LoadingBlock } from '@/components/flock-ui'

export const metadata: Metadata = { title: 'ویرایش شناسنامه | گله‌یار' }

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AnimalEditPage />
    </Suspense>
  )
}
