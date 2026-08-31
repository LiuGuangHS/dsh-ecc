import { cp, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const dshRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(dshRoot, '..')
const source = join(repoRoot, 'skills')
const target = join(dshRoot, 'skills')
const staging = join(dshRoot, '.skills-staging')

await rm(staging, { recursive: true, force: true })
try {
  await cp(source, staging, {
    recursive: true,
    force: false,
    errorOnExist: true,
    filter(path) {
      const name = path.split(/[\\/]/).pop()
      return name !== '__pycache__' && !name.endsWith('.pyc') && !name.endsWith('.pyo')
    }
  })
  await rm(target, { recursive: true, force: true })
  await cp(staging, target, { recursive: true })
} finally {
  await rm(staging, { recursive: true, force: true })
}
