# grasping-straws

## How we work

`.claude/settings.json` loads four plugins from the `lorenzos-claude-code`
marketplace (gr8monk3ys/skills), in every clone and every cloud session. Use
them every time, not only when one happens to trigger:

- **Matt Pocock's skills** (`mattpocock-skills`) for the engineering process:
  `grilling` before building something new, `tdd` for any behaviour change,
  `diagnosing-bugs` for bugs, `code-review` before calling work done and `pr`
  for the PR body. Prefer them over overlapping skills from other plugins.
- **Impeccable** for any UI, layout, styling or on-screen copy: run
  `/impeccable critique` or `/impeccable audit` on it before you're done.
- **Ponytail** is always on: the simplest code that works, no unrequested
  abstractions or dependencies. Run `ponytail-review` on the diff before
  opening a PR and cut what the task didn't need.
- **Tests:** `./scripts/verify` is the fast gate (`npm run verify:check` minus
  the build: card and rules validation, print-and-play freshness, eslint,
  dependency-cruiser, typecheck, unit tests). A hook runs it before a session
  can finish and won't let it end while it fails. Still run `npm run verify`
  (it adds the build and the Chromium e2e) before a PR, as "Checks" says.
  Never skip, weaken or delete a test to get it green.

## Checks

Run `npm run verify` before opening a PR. It is exactly what CI runs: `verify:check` (card and rules validation, eslint, dependency-cruiser module boundaries, print-and-play freshness, typecheck with `noUncheckedIndexedAccess` and ts-reset, unit tests, build), then `verify:e2e` (the built site driven in Chromium). Get the evidence lines with `python3 scripts/verify_summary.py unit reports/unit.xml` and `python3 scripts/verify_summary.py e2e reports/e2e.xml`, and paste the `VERIFY stage=...` lines into the PR body under "Evidence". CI writes the same lines to its job summary and uploads screenshots and a trace as the `ui-evidence` artifact.

## Agent skills

### Issue tracker

GitHub Issues on `gr8monk3ys/grasping-straws`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Vendored skills

Third-party skills are checked in under `.claude/skills/` so they load in every session, including remote ones. Do not edit them in place; re-copy from upstream to update.

| Source | Version | What is vendored |
|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills) | 1.2.3 (`c55ee46`) | The 25 skills listed in the upstream `.claude-plugin/plugin.json` (engineering + productivity). Repo setup for them lives in `docs/agents/`. |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 4.3.1 (`83c2c73`) | `.claude/skills/impeccable/` and its four subagents in `.claude/agents/`. Run `/impeccable init` once to write `PRODUCT.md`. The launcher downloads the engine binary on first use; the optional edit hooks are not installed. |
