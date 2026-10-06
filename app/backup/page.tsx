import { Suspense } from 'react'
import type { Metadata } from 'next'
import { BackupPanel } from '@/components/backup-panel'
import { LoadingBlock } from '@/components/flock-ui'

export const metadata: Metadata = { title: 'پشتیبان‌گیری | گله‌یار' }

export default function Page() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <BackupPanel />
    </Suspense>
  )
}
