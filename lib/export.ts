import { db, loadAll, RECORD_TABLES, type FlockData } from './db'

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  download(filename, new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
}

export interface BackupFile {
  app: 'galleyar'
  version: 2
  exportedAt: string
  data: FlockData
}

export async function exportBackup() {
  const data = await loadAll()
  const payload: BackupFile = { app: 'galleyar', version: 2, exportedAt: new Date().toISOString(), data }
  const stamp = new Date().toISOString().slice(0, 10)
  download(`galleyar-backup-${stamp}.json`, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  localStorage.setItem('galleyar:lastBackup', payload.exportedAt)
}

export async function importBackup(file: File) {
  const text = await file.text()
  const parsed = JSON.parse(text) as BackupFile
  if (parsed?.app !== 'galleyar' || !parsed.data) throw new Error('invalid backup')
  await db.transaction('rw', db.tables, async () => {
    for (const name of RECORD_TABLES) {
      await db.table(name).clear()
      const rows = parsed.data[name] ?? []
      if (rows.length) await db.table(name).bulkAdd(rows)
    }
  })
}

export async function clearAll() {
  await db.transaction('rw', db.tables, async () => {
    for (const name of RECORD_TABLES) await db.table(name).clear()
  })
}
