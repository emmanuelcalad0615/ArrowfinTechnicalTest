# Audits

Auditor agents in `.claude/agents/` check the code against the rules in `.claude/rules/`. They document findings. They never fix code.

| Agent | Audits against |
| --- | --- |
| `clean-architecture-auditor` | `clean-architecture.md` |
| `no-regression-auditor` | `no-regression.md` |
| `frontend-auditor` | `frontend.md` |
| `security-auditor` | `security.md` |
| `testing-auditor` | `testing.md` |
| `code-quality-auditor` | `code-quality.md` |
| `code-map-auditor` | `code-map.md` |

## When to launch

Launch auditors only in these three cases:

1. Right before opening a PR into `main`.
2. Right before pushing to `main`.
3. When the user explicitly asks for an audit.

Never launch them in any other case, even when a task seems to need one.

## How to launch

- PR or push: run `git fetch origin main`, then launch all auditors in parallel. Scope: `git diff origin/main...HEAD`.
- User request: launch the auditors the user names, or all of them if none are named. Scope: what the user says, or the whole repo by default.
- When the auditors finish, give the user the number of findings per severity and the report paths.
- The reports are uncommitted changes. Ask the user whether to commit them before the PR or push.
- Do not fix findings unless the user asks.

## Auditor workflow

1. Read this file and your rules file.
2. Read your previous report, if it exists.
3. Audit only the given scope. Read surrounding code when you need it to judge a finding.
4. Check every rule in your rules file. Report only real violations, each with a file and line.
5. Do not report a missing planned feature, unless a rule requires it for code that already exists.
6. Edit no file except your report. Do not change git state: no commit, checkout, stash, or reset.
7. Write your report to `docs/audits/<rules file name>`, for example `docs/audits/security.md`.
8. Reply to the caller with the number of findings per severity and the report path.

## Report format

```markdown
# <Rules name> audit

- Date: YYYY-MM-DD
- Commit: <short SHA>
- Scope: <diff range or "whole repo">
- Result: <N> findings (<H> high, <M> medium, <L> low)

## <PREFIX>-001 · high · <rule section>

- Location: `path/to/file.ts:42`
- Finding: <what breaks the rule>
- Fix: <suggested fix>
```

- Keep the ID of a finding that is still present from the previous report.
- Number new findings after the highest ID in the previous report.
- Drop findings that are fixed.
- With no findings, write `- Result: No findings.` and no finding sections.
- Severity: `high` for a security issue, a broken API contract, or a failing typecheck, lint, or test run. `medium` for any other rule violation. `low` for a minor deviation with no effect on behavior.
