---
name: aiux-safe-exploration
description: "Use when designing or building an AI product and users fear breaking something by trying the AI: sandbox or preview modes, 'let them experiment without consequences', undo-everything trials, test environments. Safe Exploration makes trying risk-free."
---

# Safe Exploration

Why it matters: Users want to experiment with AI capabilities but fear mistakes or unintended consequences.

## The moves

1. **Sandbox the irreversible, not the unfamiliar.** The test is not whether a feature is new or confusing. It is whether the action can be taken back. If undo already covers it, adding a practice mode gives users a second thing to learn and a mode they can be lost in.
2. **A sandbox that differs from production is worse than none.** Run the same model, the same prompt, the same limits. Stub only the final side effect. The moment practice mode is cheaper to run than the real thing, it starts teaching a version of your product that does not exist.
3. **Name the difference you could not remove.** Some gaps are unavoidable: no real customer data, no live inventory. Say so in the sandbox, in a sentence, where the user is working. An unstated gap is the one that surprises them later.
4. **Make the boundary a place, not a badge.** Users do not read status chips. Frame the whole surface, keep it visible without scrolling, and make the exit control look nothing like the button that does the real thing. Every mode error in a sandbox is a design failure, not a user error.
5. **Let the work leave the sandbox.** If a good result has to be recreated by hand in production, people stop practising and go straight to the real thing. One button that promotes the exact input to a real run is what turns a demo into a habit.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/safe-exploration
