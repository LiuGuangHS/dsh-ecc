# ECC for DeepSeek Harness

Everything Claude Code packaged as a native DeepSeek Harness Cordis bundle.
Skills are loaded on demand through the DSH `skills` registry instead of being
injected into every prompt.

## Install

```sh
dsh plugin --profile web add @liuguanghs/dsh-ecc
```

Restart `dsh web` after installation. ECC skills then appear in the normal DSH
Skill catalog and load through the `skill` tool.

For development from this repository:

```sh
cd dsh
npm run build
npm run verify
dsh plugin --profile web add "$PWD"
```

## Scope

The `0.1.x` releases provide the canonical ECC Skill surface from `skills/`.
Commands, agents, rules, hooks and MCP configurations are being adapted to their
native DSH destinations instead of being copied as Claude Code files.

The implementation contract is documented in
[`docs/DSH-ECC-PORTING-SPEC.md`](docs/DSH-ECC-PORTING-SPEC.md). The live execution
plan and per-surface mapping are tracked in
[`docs/ECC-DSH-MAPPING.md`](docs/ECC-DSH-MAPPING.md).

A capability is usable only after it has a DSH registration point, explicit
permissions, lifecycle cleanup, tests and a documented invocation. A copied source
file alone is not considered a port.

This is an independent community adaptation of
[affaan-m/ECC](https://github.com/affaan-m/ECC), distributed under its MIT
license. It is not affiliated with or endorsed by the original ECC authors or
DeepSeek.
