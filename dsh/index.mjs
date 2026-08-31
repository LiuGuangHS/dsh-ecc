import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const name = 'dsh-ecc'
const inject = ['skills']
const source = 'ecc'
const rank = 550

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return undefined
  const end = text.indexOf('\n---', 3)
  if (end < 0) return undefined

  const metadata = {}
  let currentKey
  let folded = false
  for (const rawLine of text.slice(3, end).split('\n')) {
    const line = rawLine.trimEnd()
    if (/^[ \t]/.test(line) && currentKey) {
      const value = line.trim()
      if (value) metadata[currentKey] = folded
        ? `${metadata[currentKey]} ${value}`
        : `${metadata[currentKey]}\n${value}`
      continue
    }
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)
    if (!match) {
      currentKey = undefined
      folded = false
      continue
    }
    let value = match[2].trim()
    folded = value === '>' || value === '>-' || value === '>+'
    if (folded) value = ''
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    metadata[match[1]] = value
    currentKey = folded ? match[1] : undefined
  }
  return {
    metadata,
    body: text.slice(end + 4).replace(/^\n+/, '')
  }
}

async function parseSkill(skillPath, signal) {
  let text
  try {
    text = await readFile(skillPath, 'utf8')
  } catch {
    return undefined
  }
  if (signal?.aborted) return undefined
  const parsed = parseFrontmatter(text)
  if (!parsed || !parsed.metadata.name) return undefined
  return parsed
}

async function discover(skillsRoot, signal) {
  let entries
  try {
    entries = await readdir(skillsRoot, { withFileTypes: true })
  } catch {
    return []
  }
  const result = []
  for (const entry of entries) {
    if (signal?.aborted) break
    if (!entry.isDirectory()) continue
    const directory = join(skillsRoot, entry.name)
    const skillPath = join(directory, 'SKILL.md')
    const parsed = await parseSkill(skillPath, signal)
    if (!parsed) continue
    result.push({
      name: parsed.metadata.name,
      description: parsed.metadata.description ?? '',
      ...(parsed.metadata.whenToUse ? { whenToUse: parsed.metadata.whenToUse } : {}),
      invocation: parsed.metadata['disable-model-invocation'] === 'true'
        ? { modelInvocable: false, userInvocable: true }
        : { modelInvocable: true, userInvocable: true },
      source,
      provider: name,
      rank,
      locator: directory,
      path: skillPath,
      metadata: parsed.metadata
    })
  }
  return result
}

function apply(ctx) {
  const skillsRoot = join(dirname(fileURLToPath(import.meta.url)), 'skills')
  ctx.skills.registerProvider(() => ({
    name,
    async list(options = {}) {
      return discover(skillsRoot, options.signal)
    },
    async get(candidate, options = {}) {
      const parsed = await parseSkill(candidate.path, options.signal)
      if (!parsed) return undefined
      return {
        name: parsed.metadata.name,
        description: parsed.metadata.description ?? '',
        ...(parsed.metadata.whenToUse ? { whenToUse: parsed.metadata.whenToUse } : {}),
        invocation: parsed.metadata['disable-model-invocation'] === 'true'
          ? { modelInvocable: false, userInvocable: true }
          : { modelInvocable: true, userInvocable: true },
        source,
        provider: name,
        resourceBase: { kind: 'directory', path: candidate.locator },
        path: candidate.path,
        metadata: parsed.metadata,
        content: parsed.body
      }
    }
  }))
}

export { apply, discover, name, parseFrontmatter, parseSkill, inject }
export default { apply, name, inject }
