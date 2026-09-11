# Expo Run TUI Build Plan

## Outcome

Add a dedicated, reusable `expo-run` skill to Basics. The skill configures Expo projects so `pnpm start` launches Expo Go through Expo's ngrok-backed tunnel and renders Expo's native terminal QR, while `pnpm run start:local` opens Expo Web through a localhost-only server.

## Resolved decisions

- **D-EXPO-001 — Dedicated skill:** create `expo-run`; keep the generic `run` skill unchanged.
- **D-EXPO-002 — Tunnel default:** set the project script to `node scripts/expo-go-launch.mjs tunnel`; the migrated launcher invokes the project-local Expo CLI with `start --go --tunnel --clear` and treats Expo's published `exp://` URL as authoritative.
- **D-EXPO-003 — Durable terminal QR:** after Expo publishes the exact `exp://` URL, render that URL as terminal text, write the same QR to a project-specific file under the platform temporary directory, print the path and plain URL, and require an invoking agent to read the file back into its own response. Do not generate a PNG, invoke `qrencode`, or open a browser in tunnel mode.
- **D-EXPO-004 — Local mode:** set `start:local` to `node scripts/expo-go-launch.mjs local`; the launcher invokes the project-local Expo CLI with `start --web --localhost --clear`, allowing Expo to open the local browser.
- **D-EXPO-005 — Project mutation:** when the skill is invoked to configure an Expo project, it may update that project's `package.json`; dependency installation remains separately approval-gated.
- **D-EXPO-006 — Migration baseline:** move the existing Mias skill's workflow into `expo-run`, preserving and adapting its preflight, prerequisites, launch, health-check, logs, stop, and known-failure structure. Replace only its Mias-specific paths, Windows-only commands, web-only launch, fixed port, and process-kill assumptions with the approved portable behavior; do not design an unrelated skill from scratch.

## Assumption coverage

| ID | Type | Resolution | Evidence |
| --- | --- | --- | --- |
| A-001 | fact | Expo CLI prints a QR in the terminal and supports `--tunnel`. | Expo start and CLI documentation reviewed 2026-09-10. |
| A-002 | constraint | Tunnel mode may be slower than LAN but is the required mobile/internet default. | User requirement and Expo documentation. |
| A-003 | implementation | `--go` prevents an installed `expo-dev-client` package from silently changing the intended target. | Expo CLI launch-target documentation. |
| A-004 | scope | The external Mias skill is the migration baseline and its original tracked directory will be deleted only after verified migration. | User explicitly authorized deletion and acknowledged the information-loss consequence. |
| A-005 | risk | A fixed localhost port or guessed tunnel URL would be misleading. | Expo can choose ports; user asked for both usable endpoint classes. |
| A-006 | release | Canonical and generated adapters must version and package consistently. | Repository `AGENTS.md`. |

## Scope

In scope:

- New canonical `.agents/skills/expo-run/` skill, deterministic configurator, and behavioral tests.
- Codex metadata for `expo-run`.
- Claude adapter generation for the portable skill.
- Codex semantic patch/version cachebuster update, generated package refresh, release checks, and `basics@personal` installation.
- Build plan/report and durable handoffs.
- Post-verification deletion of `/mnt/coding/Avalion-Solutions/Mias Method/.agents/skills/run-mias-method/`.

Out of scope:

- Launching or otherwise modifying the Mias Method application beyond deleting the exact migrated skill directory after verification.
- Opening a public tunnel during automated verification.
- Installing dependencies into any Expo application during this repository Build.
- Changing the generic `run` skill.
- Merging into or pushing `devel`; that requires later explicit approval.

## Acceptance criteria

- **C-EXPO-001:** `expo-run` is independently discoverable in canonical Basics, generated Codex package, and Claude adapter.
- **C-EXPO-002:** the configurator maps `start` and `start:local` to the migrated launcher; its tunnel and local modes invoke exact Expo argument sets `start --go --tunnel --clear` and `start --web --localhost --clear`, preserving unrelated package fields and scripts.
- **C-EXPO-003:** tunnel mode renders a terminal QR only after Expo publishes the exact `exp://` URL, persists the identical QR as a project-specific temporary text file, prints its path and plain URL, and instructs an agent to read and reproduce that file in its response; no PNG, `qrencode`, guessed URL, or browser launch occurs.
- **C-EXPO-004:** tunnel output/reporting distinguishes the mobile internet URL from observed local endpoints; it never promises a fixed port.
- **C-EXPO-005:** configuration rejects non-Expo projects, supports a non-mutating check/preview, and reports missing project-local `@expo/ngrok` or terminal QR dependency with an approval-gated installation command.
- **C-EXPO-006:** `start:local` is explicitly local-only Expo Web and browser behavior; automated checks never launch a browser or public tunnel.
- **C-EXPO-007:** child lifecycle remains owned by pnpm/Expo, with foreground signal propagation and no fixed-port process killing.
- **C-EXPO-008:** focused tests, skill checks, adapter/package drift checks, full release checks, plugin installer tests, installed-hook materialization, and installed enabled version all pass.

## Implementation plan

1. Seed focused failing tests for preservation of the original skill's operational stages plus package mapping, preview/non-mutation, Expo detection, missing dependency guidance, exact-URL QR gating, temporary QR-file output/readback instructions, unrelated-data preservation, and invalid input.
2. Copy the existing Mias skill into the canonical `expo-run` location, then adapt it in place with the cross-platform configurator/launcher and Codex UI metadata.
3. Patch-bump Codex from `2.1.10` to `2.1.11` with a new cachebuster, and patch-bump the Claude adapter from `2.1.5` to `2.1.6` because its generated deliverable changes.
4. Regenerate the Codex package and Claude adapter, then run focused and complete validation.
5. Run one scoped Red review and at most one Fixer/Judge batch for eligible findings.
6. Integrate the accepted candidate into the preserved Build integration branch, verify end to end without exposing a live tunnel, install `basics@personal`, and generate the Build report.

## Risks and mitigations

- Expo, ngrok, or the terminal QR renderer may vary by SDK/runtime: use project-local dependencies and install their newest versions compatible with the project's declared Expo and Node constraints at use time.
- Tunnel verification would expose a network service: keep release tests deterministic and non-interactive; live tunnel launch is a future, explicit runtime action.
- Generated Codex packaging replaces a directory: approval names the exact generated target and consequence; canonical sources remain authoritative and reproducible.
- Expo Web may not be installed in every native-only project: surface the first actionable Expo error instead of silently changing dependencies.

## Handoff notes

The source Mias skill is Windows-specific and hard-codes a web-only localhost workflow. Its workflow structure is retained as the migration baseline. Official Expo documentation defines the replacement tunnel, terminal-QR, and local-mode mechanics.

## Remaining open decisions

None. Implementation awaits consolidated approval of this updated plan, scope, and authorization envelope.
