# eval.md — Margaux EN Tutor

## Purpose

This file defines how we measure whether Margaux is a *good English tutor*, and the
process by which the product improves over time. The file itself improves nothing —
the **loop** below does. `eval.md` is the contract that loop runs against.

"Self-improving with use" means: real sessions that go wrong become permanent test
cases, fixes are made against those cases, and a regression gate stops fixes from
breaking what already worked. No magic.

---

## The loop (this is what improves the product)

1. **Capture** — log real tutor sessions + any quality signal (thumbs, learner
   correction, low score).  <!-- ADJUST: where are sessions stored? Supabase / logs / none yet -->
2. **Triage** — review recent low-signal sessions; pick real failures.
3. **Freeze** — turn each failure into a minimal case in `evals/cases/`.
4. **Fix** — make the smallest prompt/code change that passes the new case.
5. **Gate** — re-run the full suite; block if any previously-passing case regresses.
6. **Record** — append the fix to the Changelog at the bottom.

If you do nothing else, do steps 3–5 every time something looks wrong in the wild.

---

## What we evaluate

**Unit under test:** a single tutor turn — the learner's message (+ session context)
in, Margaux's reply out.  <!-- ADJUST: if /brief generated lesson briefs are the main surface, add a second suite that evaluates brief generation -->

**Context each case carries:** learner CEFR level (A1–C2), the lesson brief/objective,
and the domain register.  <!-- ADJUST: domain inferred as barista / café-service English — confirm or change -->

### Rubric

| Dimension | What it checks | Scored by | Weight |
|---|---|---|---|
| **Linguistic correctness** | Grammar/vocab/usage advice is actually *correct* | LLM judge + periodic human spot-check | gate* |
| **Error detection & correction** | Catches the learner's errors, corrects accurately, explains *why* | Programmatic (seeded errors) + judge | 0.25 |
| **Level fit (CEFR)** | Matches the stated level; doesn't over- or under-shoot | Judge vs. stated level | 0.20 |
| **Pedagogy** | Explains, gives an example, checks understanding — doesn't just hand over the answer | Judge | 0.20 |
| **Brief adherence** | Stays on the lesson's objective | Judge vs. brief | 0.15 |
| **Domain register** | Uses vocab/register appropriate to the context | Judge | 0.10 |
| **Tone & safety** | Encouraging, age-appropriate, no harmful/inappropriate content | Judge + filters | gate* |
| **Concision / format** | Not overwhelming; well-structured | Programmatic length + judge | 0.10 |

\* **Gate dimensions hard-fail the case regardless of the weighted average.** Teaching a
wrong rule, or an unsafe reply, is worse than being slightly off-level — so correctness
and safety are pass/fail, not averaged in.

**Pass criteria for a case:** weighted score ≥ **0.80** *and* zero gate failures.
**Suite passes** when ≥ 95% of cases pass and there are **no new gate failures**.

---

## Eval set

Cases live in `evals/cases/*.json`, one case per file. Format:

```json
{
  "id": "err-present-perfect-001",
  "context": { "cefr": "A2", "brief": "ordering at a café", "domain": "barista" },
  "input": "Yesterday I have drink three coffee.",
  "expect": {
    "must_correct": ["have drink -> drank", "three coffee -> three coffees"],
    "must_not": ["introduce C1 vocabulary", "give the corrected sentence with no explanation"],
    "rubric_focus": ["error_detection_correction", "level_fit", "pedagogy"]
  }
}
```

```json
{
  "id": "level-fit-A1-define-001",
  "context": { "cefr": "A1", "brief": "café drinks vocabulary", "domain": "barista" },
  "input": "What is espresso?",
  "expect": {
    "must": ["a short, simple definition", "one concrete example"],
    "must_not": ["etymology", "vocabulary above A1", "a paragraph longer than ~3 sentences"],
    "rubric_focus": ["level_fit", "pedagogy", "concision"]
  }
}
```

**Adding a case from a real failure (the important workflow):** copy the offending
session's input + context into a new file, write the *minimum* `expect` that captures
what went wrong, confirm it fails on the current build, then fix. Keep cases small and
single-purpose — one case should test one thing.

---

## Running evals

```bash
npm run eval            # full suite, prints per-case scores + a summary
npm run eval -- --id=level-fit-A1-define-001   # one case while iterating
```

<!-- ADJUST: assumed TS/Node + npm scripts. Swap for your actual stack/commands. -->

The runner (`evals/run.ts`) loads cases, calls the system under test, scores each via
programmatic checks + an LLM judge against the rubric, and writes a report to
`evals/report.json`. Non-zero exit on suite failure so it can gate CI.

---

## For the coding agent (Claude Code / Cursor)

When asked to *improve Margaux*, follow this procedure exactly:

1. Pull the last N flagged / low-rated sessions from the usage store.  <!-- ADJUST source -->
2. For each genuine failure, write a minimal case in `evals/cases/` that reproduces it.
3. Run `npm run eval`. **Confirm the new cases fail** before changing anything.
4. Propose the *smallest* prompt or code change that makes them pass.
5. Re-run the full suite. **Stop and report if any previously-passing case regresses** —
   do not "fix" the regression by weakening a case.
6. Open a PR containing: cases added, before/after scores, and a one-line rationale.
7. Append a line to the Changelog below.

Do not edit the rubric weights or pass thresholds to make a run pass. Changing the
rubric is a deliberate, separate PR.

---

## Regression gate (CI)

Wire `npm run eval` as a required status check on `main` so a regression can't merge.
In the branch ruleset: **Require status checks to pass** → add the eval workflow.

---

## Changelog

Append-only. Newest at top. One line per fix: date — what failed — what changed — case ids.

```
2026-06-23 — (seed) baseline eval set created — n/a
```
