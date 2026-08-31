import assert from 'node:assert/strict'
import { mkdtemp, mkdir, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, discover, parseFrontmatter } from '../../dsh/index.mjs'

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

await test('parses folded frontmatter and invocation policy', () => {
  const parsed = parseFrontmatter(`---\nname: sample\ndescription: >\n  First line\n  second line\ndisable-model-invocation: true\n---\nBody\n`)
  assert.equal(parsed.metadata.description, 'First line second line')
  assert.equal(parsed.body, 'Body\n')
})

await test('discovers valid skills and ignores malformed entries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ecc-'))
  await mkdir(join(root, 'valid'))
  await mkdir(join(root, 'invalid'))
  await writeFile(join(root, 'valid', 'SKILL.md'), '---\nname: valid\ndescription: Works\n---\nContent\n')
  await writeFile(join(root, 'invalid', 'SKILL.md'), 'No frontmatter\n')
  const skills = await discover(root)
  assert.deepEqual(skills.map((skill) => skill.name), ['valid'])
})

await test('registers a lifecycle-owned provider and loads package resources', async () => {
  let provider
  let disposed = false
  const disposer = () => { disposed = true }
  const ctx = {
    skills: {
      registerProvider(factory) {
        provider = factory()
        return disposer
      }
    }
  }
  assert.equal(apply(ctx), disposer)
  const candidate = (await provider.list()).find((skill) => skill.name === 'coding-standards')
  assert.ok(candidate)
  const skill = await provider.get(candidate)
  assert.equal(skill.name, 'coding-standards')
  assert.equal(skill.resourceBase.kind, 'directory')
  assert.match(skill.content, /coding/i)
  disposer()
  assert.equal(disposed, true)
})

await test('rejects forged candidates outside the package skill root', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ecc-forged-'))
  const outside = join(root, 'outside.md')
  await writeFile(outside, '---\nname: forged\ndescription: forged\n---\nsecret\n')
  let provider
  apply({ skills: { registerProvider(factory) { provider = factory(); return () => {} } } })
  const skill = await provider.get({ path: outside, locator: root })
  assert.equal(skill, undefined)
})

await test('rejects package skill symlinks that escape the package root', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-ecc-symlink-'))
  const externalRoot = await mkdtemp(join(tmpdir(), 'dsh-ecc-external-'))
  const outside = join(externalRoot, 'outside.md')
  const packageSkill = join(root, 'skill')
  await writeFile(outside, '---\nname: escaped\ndescription: escaped\n---\nsecret\n')
  await mkdir(packageSkill)
  await symlink(outside, join(packageSkill, 'SKILL.md'))
  const skills = await discover(root)
  assert.deepEqual(skills, [])
})

console.log(`\nPassed: ${passed}`)
console.log(`Failed: ${failed}`)
process.exitCode = failed > 0 ? 1 : 0
