import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AnimalViewPage } from '@/components/animal-pages'
import { LoadingBlock } from '@/components/flock-ui'

export const metadata: Metadata = { title: 'پرونده دام | گله‌یار' }

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AnimalViewPage />
    </Suspense>
  )
}
