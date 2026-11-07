---
name: aiux-error-recovery
description: "Use when designing or building an AI product and the AI fails or hits something it cannot handle: error states, fallbacks, 'what happens when the model is wrong or down', retry paths, degraded modes. Error Recovery and Graceful Degradation fails clearly with a way forward."
---

# Error Recovery & Graceful Degradation

Why it matters: AI systems inevitably make mistakes or encounter unhandleable situations, potentially frustrating users.

## The moves

1. **Every error needs an exit, not just an apology.** 'Something went wrong' is where bad UIs stop. The useful move is the next action: retry with a change, switch modes, use a partial result, or reach a human. An error message with no path is a dead-end with manners.
2. **Degrade, don't collapse.** When the best answer isn't available, return the next-best one: a cached result, a simpler model, a partial answer with the gap flagged, instead of failing wholesale. Partial and honest beats nothing, as long as you don't pass it off as the full answer.
3. **Say what happened in the user's terms.** A stack trace or 'Error 500' just transfers your problem to the user. Name the issue in their language and, where you can, why, so they can actually decide what to do next. Keep the technical detail in your logs.
4. **Make 'try again' actually different.** Retry on an unchanged input only reproduces the failure. Either change something (rephrase, adjust, route differently) or tell the user what to change. A button that repeats the same error is a trap dressed as a lifeline.
5. **Catch the error, don't swallow it.** A friendlier message that hides the real failure from your logs is worse than the raw error: the user is still stuck and now you're blind to it. Recover gracefully on screen and surface the truth to monitoring.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/error-recovery
