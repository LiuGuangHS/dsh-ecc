import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { discover } from '../index.mjs'

const dshRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const skillsRoot = join(dshRoot, 'skills')
const directories = (await readdir(skillsRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
const skills = await discover(skillsRoot)
const upstream = JSON.parse(await readFile(join(dshRoot, 'upstream.json'), 'utf8'))

assert.ok(skills.length > 0, 'no DSH skills discovered')
assert.equal(upstream.skillCount, skills.length, 'upstream manifest skill count must match generated skills')
assert.equal(skills.length, directories.length, 'every generated skill directory must be discoverable')
assert.equal(new Set(skills.map((skill) => skill.name)).size, skills.length, 'skill names must be unique')
for (const skill of skills) {
  assert.match(skill.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `invalid skill name: ${skill.name}`)
  assert.ok(skill.description, `missing description: ${skill.name}`)
}

console.log(`Verified ${skills.length} DSH skills`)
