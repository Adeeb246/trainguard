---
name: aiux-trust-calibration
description: "Use when designing or building an AI product and users trust the AI too much or too little: over-reliance on wrong output, micromanaging a capable agent, per-domain track records, 'earn more autonomy over time'. Trust Calibration aligns perceived reliability with actual performance."
---

# Trust Calibration

Why it matters: Users either over-trust or under-trust AI agents. Over-trust leads to missed errors; under-trust leads to micromanagement. Trust calibration aligns user perception of agent reliability with actual performance, but it evolves over time per domain.

## The moves

1. **Start supervised, earn autonomy.** Default a new agent to high visibility and human-in-the-loop, then widen its latitude only when its track record warrants it. Granting autonomy on day one is borrowing trust the agent hasn't earned, and the bill comes due on the first unattended mistake.
2. **Show the track record, per domain.** 'Trustworthy' is not global. An agent excellent at scheduling may be unreliable at spending. Show competence per domain so users calibrate where it actually matters, instead of collapsing everything into one misleading score.
3. **Tie the trust signal to performance, not usage.** A trust level that rises with time-spent or clicks is a vanity metric. It has to move with measured accuracy and outcomes, or it's the same lie as a fabricated confidence number, and it quietly trains users to over-trust.
4. **Repair trust proactively after a mistake.** Trust builds slowly and breaks fast. After an error, surface what happened, what changed, and dial oversight back up yourself. Don't wait for the user to lose faith in silence and walk away, you rarely get told why they left.
5. **Treat under-trust as a failure too.** If a user is double-checking every action the agent reliably gets right, calibration has failed on the other side: the agent is being micromanaged into uselessness. Surface the track record to earn back appropriate delegation, not only to warn.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/trust-calibration
