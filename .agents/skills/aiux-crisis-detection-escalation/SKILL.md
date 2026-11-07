---
name: aiux-crisis-detection-escalation
description: "Use when designing or building an AI product that may receive messages about self-harm or crisis: how the product spots risk signals, which current hotline or human it routes the person to, and how escalation works. Design guidance for Crisis Detection and Escalation in the product being built; it does not respond to anyone in crisis itself."
---

# Crisis Detection & Escalation

Why it matters: AI systems fail to respond appropriately to crisis signals, sometimes providing harmful encouragement instead of resources. Real case: Zane Shamblin chatted with ChatGPT for hours expressing suicidal intent; the bot responded encouragingly instead of escalating.

## The moves

1. **Build the destination before the trigger.** Detection is the easy half. The hard, load-bearing half is a resource that is current, reachable, and right for the person's region. A trigger that surfaces a dead hotline does active harm at the worst possible moment. If you cannot stand behind the destination, do not ship the detection.
2. **Detect in layers, and bias toward recall.** Keywords alone miss the person who says 'nobody would miss me' and the one who hides behind 'asking for a story.' Combine direct phrases, context across the session, behavior, and bypass framing. A false positive costs an awkward moment. A missed signal can cost a life, so the defaults are not symmetric.
3. **Escalation is a hard stop with a path, not a banner.** Printing '988' and then continuing the chat is the smoke alarm wired to nothing: it looks like a response and provides no help. Interrupt the flow, hold the resources in front of the user, and route to a human where one exists. Performing concern is not the same as providing it.
4. **Over-triggering is its own failure.** An alarm that fires at every mention of sadness teaches people that honesty gets them shut down, so they learn to hide the signals you most need to see. Watch your false-positive rate as closely as your miss rate. A system everyone routes around protects no one.
5. **Treat detection thresholds as clinical decisions, and log the seams.** Where to draw the line between distress and crisis is not a product call to make alone; review thresholds with people trained in this. Log every escalation for safety review, never raw content beyond what that review needs, and never explain the detection method to users, since that just teaches evasion.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/crisis-detection-escalation
