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

The first release provides the canonical ECC Skill surface from `skills/`.
Commands, agents, rules, and hooks require DSH-specific lifecycle and permission
adapters and are intentionally not presented as supported yet.

This is an independent community adaptation of
[affaan-m/ECC](https://github.com/affaan-m/ECC), distributed under its MIT
license. It is not affiliated with or endorsed by the original ECC authors or
DeepSeek.
