---
name: aiux-action-audit-trail
description: "Use when designing or building an AI product and users need to see or undo what an AI agent did: activity logs, 'what did the agent change', audit history, rollback of agent actions, reviewing multi-step runs. Action Audit Trail makes agent behavior reviewable and correctable after the fact."
---

# Action Audit Trail

Why it matters: After an agent has acted across multiple steps or systems, users need a clear, reviewable record of what happened. Traditional undo/redo doesn't work for agentic actions that span multiple systems, occur asynchronously, and have cascading consequences.

## The moves

1. **Group by goal, not by clock.** A raw chronological feed makes the user reconstruct intent from timestamps. Group entries by what the agent was trying to accomplish, so 'reorganized my inbox' reads as one reviewable unit instead of forty scattered moves. The timeline is the secondary axis, not the primary one.
2. **Every entry answers 'what changed, and why.'** 'Edited spreadsheet' is a receipt, not an audit entry. Show the before/after diff and the reason the agent acted. If a row can't say what changed or what triggered it, you logged the fact that something happened and nothing useful about it.
3. **If you can't query it, it isn't an audit trail.** The whole value shows up during an incident, when someone asks 'what did the agent do to this record.' A log you can only scroll fails exactly then. Filter, search, and jump-to-record are not nice-to-haves; they are the difference between accountability and an append-only pile.
4. **Reversibility is information the user needs before they act.** Color-code reversible, partial, and irreversible so the user knows what's recoverable at a glance, and let them undo one action without unwinding the whole chain. When undoing step three breaks steps four and five, warn them before they confirm. Selective undo with honest cascade warnings is what makes review actionable.
5. **Build the log to be read, not just written.** The failure mode is the write-only log: perfectly complete, perfectly unreadable. Diligence at write time means nothing if the trail collapses under the one question it exists to answer. Test it the way it'll be used: hand someone the incident and a deadline, and see if the trail helps or just proves you stored something.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/action-audit-trail
