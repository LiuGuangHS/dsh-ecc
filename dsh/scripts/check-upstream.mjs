import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { diffSnapshots, validateManifest } from './upstream-lib.mjs'

const dshRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await readFile(join(dshRoot, 'upstream.json'), 'utf8'))
validateManifest(manifest)
const branch = process.env.DSH_ECC_UPSTREAM_BRANCH ?? 'main'
if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.includes('..')) {
  console.error('Upstream status: blocked (invalid branch name)')
  process.exitCode = 3
  process.exit()
}
if (!manifest.upstreamCommit) {
  console.error('Upstream status: blocked (manifest has no pinned upstream commit)')
  process.exitCode = 3
  process.exit()
}
const url = new URL(`https://api.github.com/repos/affaan-m/ECC/compare/${manifest.upstreamCommit}...${encodeURIComponent(branch)}`)
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 10000)
try {
  const response = await fetch(url, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'dsh-ecc-upstream-check' },
    signal: controller.signal
  })
  if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`)
  const result = await response.json()
  const files = (result.files ?? []).filter((file) => file.filename.startsWith('skills/'))
  if (files.length === 0) {
    console.log('Upstream status: current (no Skill changes)')
    process.exitCode = 0
  } else {
    console.log(`Upstream status: drifted (${files.length} Skill source changes)`)
    for (const file of files) console.log(`- ${file.status}: ${file.filename}`)
    process.exitCode = 2
  }
} catch (error) {
  console.error(`Upstream status: blocked (${error.name === 'AbortError' ? 'request timed out' : error.message})`)
  process.exitCode = 3
} finally {
  clearTimeout(timeout)
}
