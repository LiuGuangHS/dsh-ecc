import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createSnapshot, diffSnapshots, validateManifest } from '../../dsh/scripts/upstream-lib.mjs'

let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`  ✓ ${name}`)
    passed += 1
  } catch (error) {
    console.log(`  ✗ ${name}`)
    console.error(`    ${error.message}`)
    failed += 1
  }
}

async function skill(root, name, body) {
  const directory = join(root, name)
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'SKILL.md'), `---\nname: ${name}\ndescription: ${name}\n---\n${body}\n`)
}

await test('creates a deterministic snapshot of canonical Skill files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ecc-snapshot-'))
  await skill(root, 'beta', 'two')
  await skill(root, 'alpha', 'one')
  const first = await createSnapshot(root)
  const second = await createSnapshot(root)
  assert.equal(first.skillCount, 2)
  assert.deepEqual(first.skills.map((item) => item.name), ['alpha', 'beta'])
  assert.deepEqual(first, second)
})

await test('reports added, removed and changed Skills', () => {
  const before = { skills: [{ name: 'gone', hash: '1' }, { name: 'same', hash: '2' }, { name: 'changed', hash: '3' }] }
  const after = { skills: [{ name: 'same', hash: '2' }, { name: 'changed', hash: '4' }, { name: 'added', hash: '5' }] }
  assert.deepEqual(diffSnapshots(before, after), {
    added: ['added'],
    removed: ['gone'],
    changed: ['changed']
  })
})

await test('validates manifest structure and snapshot consistency', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ecc-manifest-'))
  await skill(root, 'only', 'body')
  const snapshot = await createSnapshot(root)
  const manifest = {
    schemaVersion: 1,
    repository: 'https://github.com/affaan-m/ECC',
    source: 'skills',
    snapshot
  }
  assert.equal(validateManifest(manifest), true)
  assert.throws(() => validateManifest({ ...manifest, snapshot: { ...snapshot, skillCount: 2 } }), /skill count/i)
})

console.log(`\nPassed: ${passed}`)
console.log(`Failed: ${failed}`)
process.exitCode = failed > 0 ? 1 : 0
