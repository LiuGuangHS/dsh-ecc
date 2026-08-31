import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

function hash(content) {
  return createHash('sha256').update(content).digest('hex')
}

async function createSnapshot(skillsRoot) {
  const entries = await readdir(skillsRoot, { withFileTypes: true })
  const skills = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue
    let content
    try {
      content = await readFile(join(skillsRoot, entry.name, 'SKILL.md'))
    } catch {
      continue
    }
    skills.push({ name: entry.name, hash: hash(content) })
  }
  return {
    algorithm: 'sha256',
    skillCount: skills.length,
    digest: hash(skills.map((skill) => `${skill.name}:${skill.hash}`).join('\n')),
    skills
  }
}

function diffSnapshots(before, after) {
  const previous = new Map((before.skills ?? []).map((skill) => [skill.name, skill.hash]))
  const current = new Map((after.skills ?? []).map((skill) => [skill.name, skill.hash]))
  const added = [...current.keys()].filter((name) => !previous.has(name)).sort()
  const removed = [...previous.keys()].filter((name) => !current.has(name)).sort()
  const changed = [...current.keys()].filter((name) => previous.has(name) && previous.get(name) !== current.get(name)).sort()
  return { added, removed, changed }
}

function validateManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1) throw new Error('unsupported upstream manifest schema')
  if (manifest.upstreamCommit != null && !/^[a-f0-9]{40}$/.test(manifest.upstreamCommit)) throw new Error('invalid upstream commit')
  if (typeof manifest.repository !== 'string' || !manifest.repository.startsWith('https://github.com/')) {
    throw new Error('invalid upstream repository')
  }
  const snapshot = manifest.snapshot
  if (!snapshot || snapshot.algorithm !== 'sha256' || !Array.isArray(snapshot.skills)) {
    throw new Error('invalid upstream snapshot')
  }
  if (snapshot.skillCount !== snapshot.skills.length) throw new Error('upstream snapshot skill count mismatch')
  if (!/^[a-f0-9]{64}$/.test(snapshot.digest)) throw new Error('invalid upstream snapshot digest')
  const names = snapshot.skills.map((skill) => skill.name)
  if (names.some((name, index) => index > 0 && names[index - 1].localeCompare(name) >= 0)) {
    throw new Error('upstream snapshot skills must be sorted and unique')
  }
  for (const skill of snapshot.skills) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.name) || !/^[a-f0-9]{64}$/.test(skill.hash)) {
      throw new Error('invalid upstream snapshot skill entry')
    }
  }
  const digest = hash(snapshot.skills.map((skill) => `${skill.name}:${skill.hash}`).join('\n'))
  if (snapshot.digest !== digest) throw new Error('upstream snapshot digest mismatch')
  return true
}

export { createSnapshot, diffSnapshots, validateManifest }
