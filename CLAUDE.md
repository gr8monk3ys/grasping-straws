# grasping-straws

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
