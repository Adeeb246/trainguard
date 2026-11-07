---
name: aiux-escalation-pathways
description: "Use when designing or building an AI product and an agent should stop and ask a human: 'the agent should check with me when unsure', handoff on ambiguity or missing permissions, approval requests mid-task, avoiding both constant interruptions and silent guessing. Escalation Pathways structure when and how agents ask for guidance."
---

# Escalation Pathways

Why it matters: Agents encounter situations they can't handle - ambiguity, conflicts, authorization limits, or capability gaps. Poor escalation design either interrupts users too frequently (escalation fatigue) or too rarely (the agent guesses wrong on high-stakes decisions).

## The moves

1. **Escalation is not failure. It's the agent knowing its own edges.** Error recovery is for when the agent broke. Escalation is for when it didn't: the task is just above its authority, its confidence, or its capability. Frame the handoff as a competent colleague asking a question, not an error state apologizing. An agent that never escalates isn't confident, it's reckless.
2. **Pause before the irreversible step, not after it.** An escalation that arrives after the email is sent or the card is charged isn't a decision point, it's a confession. The whole value is catching the high-stakes action while it can still be redirected. If 'should I proceed?' shows up as a postmortem, you escalated too late and the pattern bought you nothing.
3. **A handoff that loses context is an eviction, not an escalation.** The single thing that makes escalation worth more than a guess is continuity. Carry the full state across: what the agent did, what it completed, the decision needed, the recommended action. If the human has to re-ask the user what the agent already knew, you've just added a worse middleman than no agent at all.
4. **Send the recommendation, not a blank question.** 'What should I do?' makes the user do the agent's thinking. 'I'd route this to Legal, 62% confident. Approve, or tell me otherwise' makes the decision a one-tap confirmation. The recommendation plus a confidence number is what turns an interruption into a quick yes.
5. **Tune the volume, and learn from the answers.** Too many escalations and users rubber-stamp everything, including the one that mattered. Too few and the agent guesses wrong on the stakes. Let users set sensitivity, batch the non-urgent ones, and when the same answer comes back three times, offer to automate it. An escalation you never stop asking is a decision you failed to learn.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/escalation-pathways
