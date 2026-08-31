import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { createSnapshot } from './upstream-lib.mjs'

const dshRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const snapshot = await createSnapshot(join(dshRoot, 'skills'))
const existing = JSON.parse(await readFile(join(dshRoot, 'upstream.json'), 'utf8').catch(() => '{}'))
const manifest = {
  schemaVersion: 1,
  repository: 'https://github.com/affaan-m/ECC',
  source: 'skills',
  upstreamCommit: process.env.DSH_ECC_UPSTREAM_COMMIT ?? existing.upstreamCommit ?? null,
  snapshot,
  generatedBy: 'dsh/scripts/update-manifest.mjs'
}
await writeFile(join(dshRoot, 'upstream.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Updated upstream snapshot for ${snapshot.skillCount} skills`)
