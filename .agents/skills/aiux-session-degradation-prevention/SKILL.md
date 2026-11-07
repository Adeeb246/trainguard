---
name: aiux-session-degradation-prevention
description: "Use when designing or building an AI product with long conversations where safety or quality can erode: multi-hour chats, an assistant that grows more agreeable over time, boundary drift, session limits and refreshed checks. Design guidance for Session Degradation Prevention: how the product being built keeps late-session behaviour as careful as the first message."
---

# Session Degradation Prevention

Why it matters: AI safety weakens during extended conversations - the system becomes more agreeable and less cautious. ChatGPT maintained harmful conversations for 4+ hours with degrading boundaries.

## The moves

1. **Measure the drift before you build the limit.** Plot refusal rate and classifier scores against message number in real sessions. If late messages are not treated differently from early ones, you do not have this problem and a session cap will only interrupt safe conversations.
2. **Never let history soften the check.** Accumulated rapport is not evidence. A request that would be refused at message three is refused at message three hundred. If your thresholds move at all with session length, they move in one direction only: tighter.
3. **Re-anchor before you cut off.** A hard stop with no warning teaches users to open a fresh session, which resets every counter you built. A re-grounding turn that restates what the assistant is, and re-checks the whole conversation rather than the last message, keeps the person in a session you can still see.
4. **A break has to be honest about why.** Generic timeout copy in a sensitive conversation reads as rejection at the worst possible moment. Say what happened, keep their context so nothing is lost, and offer a human route where one exists.
5. **Design for the person who will not stop on their own.** This pattern exists for sessions where the user's own judgment about when to stop is the thing that has been compromised. Defaults set for a healthy user at message ten are the wrong defaults at hour four, and hour four is the case that put this pattern on the list.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/session-degradation-prevention
