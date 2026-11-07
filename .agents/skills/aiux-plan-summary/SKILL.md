---
name: aiux-plan-summary
description: "Use when designing or building an AI product and users should evaluate an agent's approach before it runs: 'why this plan', goal interpretation, subtask checklists, stated assumptions, strategy review before execution. Plan Summary exposes the reasoning so plans can be judged."
---

# Plan Summary

Why it matters: While Intent Preview shows what the agent will do, users also need to understand why and how. When an agent breaks a complex goal into subtasks, users can't evaluate whether the approach is sound without seeing the reasoning and assumptions behind the plan.

## The moves

1. **Lead with how the goal was read, not what will be done.** 'Research competitor pricing' can mean three different jobs. One sentence naming which one the agent chose catches more bad runs than a twelve-item checklist, because that is the step where the misunderstanding actually happens.
2. **If the user cannot edit it, it is not a plan.** Approve and Cancel is a two-button loading screen. Cancel means losing the work and starting again, so people approve. Make each assumption a field they can change in place, and regenerate the affected steps when they do.
3. **Assumptions are the payload. Everything else is packaging.** Users cannot judge whether a strategy is optimal, but they can instantly spot 'assumed you meant the UK market' being wrong. Put the assumptions where the eye lands first, not in an expandable section under the checklist.
4. **Say which step is the last free exit.** Mark the subtasks that cannot be undone and name the point after which stopping costs something. A plan that reads as uniformly safe gets approved with the same attention whether step four sends email to customers or writes to a scratch file.
5. **Keep the plan alive while it runs.** Replacing it with a progress bar throws away the thing that made it useful. When a step disproves an assumption, show that against the plan, so the user sees the moment the approach stopped matching reality rather than reading it in the summary afterwards.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/plan-summary
