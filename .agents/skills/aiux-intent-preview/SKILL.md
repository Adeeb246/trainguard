---
name: aiux-intent-preview
description: "Use when designing or building an AI product and an agent is about to act and the user should see the plan first: 'show me what it will do before it does it', dry-run summaries, previewing steps and reversibility, approve or edit before execution. Intent Preview earns informed consent for actions."
---

# Intent Preview

Why it matters: When an agent is about to take a multi-step action, users need to understand what will happen before it happens. Without an intent preview, users experience anxiety leading to constant monitoring or blind trust that erodes at the first mistake.

## The moves

1. **The preview must be the thing that runs, not a description of it.** Render the card from the same plan the executor consumes. The moment the summary is built separately from the instructions, they can drift, and a preview that can lie is worse than none: it collects consent for an action the user never saw.
2. **Preview consequence, not just intent.** 'Send email' and 'send to 400 external addresses' are the same intent and wildly different actions. Show reversibility and blast radius per step so the irreversible, wide-scope move can't hide inside a calm one-liner.
3. **Approval is for the plan as shown, and only that plan.** If the agent re-plans after the user approves, the thing they signed off on no longer exists. A stale yes carried forward is a phantom consent. Re-prompt when the plan changes; never auto-run on a timeout.
4. **Make it editable, or it's just a confirmation dialog.** The value of a preview is catching the misunderstanding before it executes. If the only options are approve and reject, you've reproduced the yes/no you were trying to replace. Let users drop a step or fix a recipient in place.
5. **Record what was shown next to what ran.** Persist the previewed plan alongside the executed actions. If they ever diverge, that's the incident that proves your preview was honest, or proves it wasn't. Without that record, you can't tell a real approval from an alibi.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/intent-preview
