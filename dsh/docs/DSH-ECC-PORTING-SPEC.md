# DSH ECC Porting Specification

## Purpose

This document defines how Everything Claude Code (ECC) capabilities become native DeepSeek Harness (DSH) capabilities. The goal is functional parity at the correct DSH extension point, not a file-for-file copy of Claude Code configuration.

The root ECC tree remains the canonical content source. The `dsh/` package is an independent adaptation layer and must not change the behavior of the root Claude Code package.

## Capability Mapping

| ECC surface | DSH destination | Required behavior |
| --- | --- | --- |
| Skill | `skills` provider | Discover summaries and load bodies on demand |
| Command | DSH command, tool, or workflow entrypoint | Validate input, enforce caller policy, handle cancellation and errors |
| Agent | Agent preset or subagent profile | Scope prompt, tools, model route, workspace and concurrency |
| Rule | System prompt section, scoped rule, Skill content, or tool guard | Apply at the narrowest correct scope without unnecessary context injection |
| Hook | DSH Event listener, tool guard, or lifecycle handler | Declare event input, blocking behavior, timeout, cleanup and audit behavior |
| MCP configuration | DSH MCP bundle/provider | Declare transport, authentication, tool schemas and approval boundaries |
| Script | Host utility or controlled workflow step | Use validated arguments and an explicit permission boundary |
| Install/update metadata | Cordis Bundle metadata and package manifest | Support install, upgrade, rollback and source traceability |

## Porting States

Every source item must have exactly one state in the matrix:

- `source-only`: exists in ECC but has no DSH implementation yet.
- `mapped`: target DSH destination and acceptance criteria are defined.
- `in-progress`: implementation is being developed.
- `ported`: implementation exists and focused tests pass.
- `verified`: implementation passes isolated Harness integration tests.
- `blocked`: a DSH capability or security decision is missing; record the blocker.
- `not-applicable`: the source behavior is Claude Code-specific or has no safe DSH equivalent; record the reason.

`copied` is never an acceptance state. A copied file can still be `source-only`.

## Completion Contract

A port is complete only when all applicable criteria pass:

1. The capability has a DSH-native owner and registration point.
2. Inputs crossing a trust boundary are validated.
3. User invocation and model invocation policy are explicit.
4. Tools, files, network, model and external process access are scoped.
5. Cancellation, timeout and failure behavior are defined.
6. All side effects belong to the current Fiber or official DSH lifecycle.
7. Stop, update and uninstall remove registrations and unfinished work.
8. Tests cover the normal path, invalid input and the highest-risk boundary.
9. Documentation states how a user invokes the capability.
10. The capability is included in the package and compatibility manifest.

## Scope and Security Rules

- Keep knowledge content on the Skill surface; do not inject all Skills into every prompt.
- Use DSH services and events, never guessed internal APIs.
- Use plain JavaScript/ESM for runtime package code; no TypeScript, JSX, `require`, or bundler-only syntax.
- Do not serialize live Cordis objects. Copy only the leaf data needed by a business response.
- Do not execute Claude Code hook shell commands unchanged.
- Treat upstream files, fetched data and package metadata as untrusted input.
- Mutating actions require an explicit DSH permission and, where appropriate, user confirmation.
- Secrets must come from DSH credential surfaces or environment configuration, never from source files, logs or test fixtures.
- A failed upstream check must not silently produce a release.

## Test Tiers

Each capability uses the smallest sufficient test set, with higher tiers required for higher risk:

- **Unit:** parser, mapper, manifest and pure policy logic.
- **Package:** build, generated content, tarball allowlist and license.
- **Harness integration:** Bundle mount, catalog/list/get, invocation and lifecycle teardown.
- **Security:** path traversal, prompt injection, unauthorized tool use, secret exposure and dangerous operation bypass.
- **End-to-end:** a real isolated DSH profile for install, restart, upgrade, use and uninstall.

A feature is `verified` only after its required tier is recorded in the matrix.

## Release Rules

- Use patch versions for compatible fixes and incremental capability additions: `0.1.1`, `0.1.2`, and so on.
- Use a minor version only when a new public DSH capability contract requires a meaningful compatibility boundary.
- Use a major version only for intentional breaking changes.
- Every release runs `npm test`, package-content checks and the applicable Harness integration suite.
- Every release records the ECC upstream commit when the exported source has been explicitly reviewed; otherwise the manifest must say it is unpinned and release documentation must not claim an exact upstream correspondence.
- Publishing is performed by the `dsh-vX.Y.Z` GitHub tag through npm Trusted Publishing.
- A tag version must equal `dsh/package.json` version. No manual version override is allowed in CI.

## Definition of Complete

The DSH port is complete when:

- all 286 Skills are `verified`;
- all 94 Commands are either `verified` or explicitly `not-applicable` with a documented replacement;
- all 68 Agents are either `verified` or explicitly `not-applicable` with a documented replacement;
- all 122 Rules are assigned to the correct DSH scope and tested;
- all 5 Hooks are represented by DSH Events, guards or lifecycle handlers;
- applicable MCP configurations have a DSH-native provider or a documented safe alternative;
- users can install, use, upgrade, inspect, roll back and remove the package;
- upstream drift is visible before a release;
- CI verifies package integrity and release provenance.

The completion metric is functional and verifiable coverage, not equal file counts.
