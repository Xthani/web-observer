# AI Summary

`getSummary()` is the first payload to give an AI analyst. Do not send large raw
event dumps by default. Send the summary first, then attach selected raw events
only as evidence for a specific question.

## Recommended Prompt

```txt
You are a product analyst. Analyze this Web Observer summary.

Treat this as behavioral evidence, not final truth.
Do not overgeneralize from one short session.
Focus on UX signals, noisy SDK events, and hypotheses to verify.

Data:
<summary json>
```

## Summary Fields

- `totals` describes total events, sessions, and routes.
- `eventTypes` shows the event type mix.
- `topRoutes` shows the most observed route patterns.
- `topEvents` shows the most repeated normalized actions.
- `problemSignals` contains `dead_click`, `rage_click`, and `error` signals.
- `flowSummaries` shows short action chains per session.
- `dropOffs` shows the last meaningful action in sessions.
- `roleBreakdown` groups behavior by `user.role` when provided.
- `periodComparison` compares the first and second half of the local period.
- `localAggregates` groups events by day and session.

## Current Test Interpretation

For `fantasy-predictions`, the latest test produced one session on `/login`.
Multiple `page_view` events are valid if reloads were part of the test. The most
useful signals are repeated auth tab clicks, login/register submit clicks,
field interactions, and dead clicks in non-interactive areas.

## What AI Should Not Conclude

The AI should not decide that a feature is useless from one short session. It
should produce hypotheses, for example:

- Some non-interactive areas receive clicks and may look clickable.
- A submit button received repeated clicks and may need visible validation.
- The SDK collected useful flow data, but more sessions are required.
