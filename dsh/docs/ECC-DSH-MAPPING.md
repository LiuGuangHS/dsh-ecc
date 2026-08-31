# ECC to DSH Mapping Matrix

This is the execution matrix for the complete DSH adaptation. It is intentionally maintained separately from the root ECC package. The root directories are the source of truth; this document tracks where each capability belongs in DSH and what evidence is required before it is called usable.

## How to Use This Matrix

For every source item:

1. Find its ECC path under `skills/`, `commands/`, `agents/`, `rules/`, `hooks/` or `mcp-configs/`.
2. Assign one DSH destination from the mapping table below.
3. Set the porting state: `source-only`, `mapped`, `in-progress`, `ported`, `verified`, `blocked`, or `not-applicable`.
4. Add the required test tier and a concrete acceptance command or Harness scenario.
5. Implement the smallest native DSH unit that owns the behavior end to end.
6. Update the row only after the tests and user-facing invocation are available.
7. Release compatible changes with the next patch version; reserve minor versions for public contract changes.

A source file copied into `dsh/` without a DSH registration point and tests remains `source-only`.

## Repository Inventory

The current ECC source inventory is:

| Source surface | Count | DSH destination | Current baseline |
| --- | ---: | --- | --- |
| Skills | 286 | Host `skills` provider | Verified catalog and on-demand loading |
| Commands | 94 | DSH commands, tools or workflow entrypoints | Not yet adapted |
| Agents | 68 | DSH agent presets or subagent profiles | Not yet adapted |
| Rules | 122 | System prompt sections, scoped rules, Skills or guards | Not yet adapted |
| Hooks | 5 | DSH Events, tool guards or lifecycle handlers | Not yet adapted |
| MCP configs | inventory required | DSH MCP bundles/providers | Not yet adapted |

Counts are checked from the repository during planning and must be regenerated when the upstream source changes.

## Destination Rules

| ECC source | Use this DSH destination when | Do not use |
| --- | --- | --- |
| Skill knowledge and workflow guidance | `skills.registerProvider` and on-demand body loading | Global prompt injection of all Skills |
| Read-only user workflow | DSH command or tool with validated input | A copied slash command file |
| Multi-step orchestration | DSH workflow entrypoint backed by Skills and agents | Unbounded shell orchestration |
| Specialist role | DSH agent preset/subagent with scoped tools | An unscoped prompt-only agent |
| Always-on safety principle | Host/profile system prompt section | Repeating it in every Skill |
| Context-specific guidance | Workspace, agent or Skill-local scoped rule | Global prompt pollution |
| Deterministic safety check | Tool guard or blocking Event | Best-effort prose instruction only |
| Session/tool lifecycle | DSH Event listener owned by the current Fiber | Persistent unmanaged process |
| External service | DSH MCP provider with credential and approval boundaries | Hardcoded tokens or raw config execution |
| Local helper script | Validated Host utility or controlled workflow step | Arbitrary user-supplied command construction |

## Implementation Waves

| Wave | Scope | Inventory | DSH destination | Exit criteria | Suggested releases |
| --- | --- | ---: | --- | --- | --- |
| 0 | Inventory and contracts | 380+ items | This matrix plus manifests | Every applicable item has destination, state, risk and test tier | no release |
| 1 | Skill runtime hardening | 286 | Provider, resource locator and lifecycle | list/get/error/teardown/install tests pass; package allowlist passes | `0.1.1` onward |
| 2 | Maintenance and source tracking | all adapted items | Manifest and read-only drift checker | upstream commit, changes and blocked network state are visible | patch releases |
| 3 | Safe inspection workflows | 10-20 Commands | DSH commands/tools | `verify`, `review`, `plan`, `tdd` have validated contracts and Harness tests | patch releases |
| 4 | Command families | remaining applicable Commands | DSH commands/workflows | every Command is verified or has a documented replacement | patch releases, then minor when stable |
| 5 | Core engineering agents | 7-10 Agents | Agent presets/subagents | planner, reviewer, tester and security roles have scoped tools and handoffs | patch releases |
| 6 | Specialist agents | remaining applicable Agents | Agent presets/subagents | language, framework and domain roles are routable and tested | patch releases |
| 7 | Rules and safety model | 122 | prompt sections, scopes and guards | no redundant global injection; precedence and blocking tests pass | patch releases |
| 8 | Lifecycle hooks | 5 | Events, guards and lifecycle handlers | stop/update/uninstall cleanup and failure policy are verified | patch releases |
| 9 | External integrations | applicable MCP configs | MCP bundles/providers | credentials, schemas, network and approval behavior are tested | patch releases |
| 10 | Release certification | all | isolated DSH profile | install, restart, use, upgrade, rollback and uninstall pass | `1.0.0` when stable |

The release numbers are guidance, not a requirement to skip patch versions. Do not jump versions merely because a new wave starts.

## Command Adaptation Matrix

| Command family | Examples | DSH shape | Risk | Required evidence |
| --- | --- | --- | --- | --- |
| Verification | `verify`, `e2e`, `build-fix` | read-only tool/workflow | low-medium | invalid input, timeout, structured result, isolated run |
| Planning | `plan`, architecture planning | user command invoking Skills/Agents | low | output schema, cancellation, no mutation |
| Review | `review`, security review | user command plus scoped reviewer | medium | tool allowlist, findings schema, no silent fixes |
| TDD | `tdd`, test workflows | workflow entrypoint | medium | step state, test command validation, cancellation |
| Orchestration | `orchestrate`, team workflows | DSH agent/task orchestration | high | concurrency cap, retry cap, handoff and stop cleanup |
| Documentation | docs and onboarding commands | Skill-backed command/tool | low | path scope, output location, overwrite confirmation |
| Configuration | install/update/configure commands | DSH profile or Bundle operation | high | explicit confirmation, backup/rollback, no raw config overwrite |
| Release/deploy | release and deployment commands | gated workflow | high | preview, approval, provenance, audit and rollback |
| Information | guide, recipes, status, cost | read-only tool | low | no mutation and complete response contract |

## Agent Adaptation Matrix

| Agent role | First DSH destination | Required tool boundary |
| --- | --- | --- |
| Planner/architect | Agent preset | read repository and produce plan; no mutation by default |
| TDD/test guide | Subagent profile | test execution only unless explicitly delegated write access |
| Code reviewer | Subagent profile | read-only source and test evidence; structured findings |
| Security reviewer | Subagent profile | read-only source/config plus security tools; no automatic remediation |
| Build resolver | Agent preset | bounded build/test commands and workspace scope |
| E2E runner | Subagent profile | browser and test surface only; no production mutation |
| Language/framework reviewer | Specialist profile | language-specific Skills plus read-only review tools |
| Loop operator | Controlled orchestration profile | retry, budget, timeout and stop controls |
| Harness optimizer | Host-aware profile | inspect runtime configuration without changing it by default |

Every Agent row must specify model route, tools, workspace, timeout, concurrency, handoff schema and retry policy.

## Rules and Hooks Adaptation Matrix

| Source behavior | DSH destination | Default policy |
| --- | --- | --- |
| Prompt injection defense | Host/profile system prompt | always active |
| Coding conventions | Skill-local or workspace rule | loaded when relevant |
| Security boundary | Host system prompt plus tool guard | fail closed for dangerous operations |
| Pre-tool validation | before-tool Event/guard | block invalid or unauthorized calls |
| Post-tool audit | after-tool Event | record minimal non-secret evidence |
| Session initialization | session lifecycle Event | reversible registration |
| Session persistence | host persistence/lifecycle service | no unmanaged files or processes |
| Stop/cleanup | disposal handler | remove listeners, timers and unfinished tasks |

## Per-Item Record Template

Use this template when adding an individual row to an issue, pull request or future machine-readable manifest:

```yaml
source: commands/review.md
type: command
destination: dsh-command
state: mapped
wave: 3
risk: medium
userInvocation: "dsh review"
modelInvocation: false
permissions:
  - repository.read
acceptance:
  - validates command arguments
  - returns structured findings
  - does not mutate files without confirmation
tests:
  - unit: command schema
  - integration: isolated DSH profile
  - security: unauthorized mutation denied
owner: unassigned
notes: "Backed by the review Skill and code-reviewer profile."
```

## User Workflows After Completion

The finished package must make these workflows possible without Claude Code-specific instructions:

```text
Install:
  dsh plugin --profile web add @liuguanghs/dsh-ecc

Inspect capabilities:
  use the normal DSH Skill catalog and package status command

Use knowledge:
  invoke a discovered Skill; its body and references load on demand

Run a workflow:
  invoke a DSH-native command such as verify, review, plan or tdd

Use a specialist:
  select a DSH agent/subagent profile with its declared tool boundary

Update:
  install a newer package version through the profile manager

Rollback:
  select the previous package version after a failed update

Remove:
  remove the Bundle and verify its provider, commands, agents and events are gone
```

The exact command syntax for future commands is part of each command contract. This document does not claim those commands exist before their rows reach `verified`.

## Matrix Review Gate

Before a wave is marked complete, review:

- no source item is silently omitted;
- no item is marked `ported` without a DSH registration point;
- no item is marked `verified` without the required Harness evidence;
- `not-applicable` has a reason and a user-facing alternative;
- high-risk items have explicit approval and rollback behavior;
- package and upstream manifests agree with the matrix;
- CI can reproduce the reported state from a clean checkout.
