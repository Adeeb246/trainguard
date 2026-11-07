---
name: aiux-anti-manipulation-safeguards
description: "Use when designing or building the safety layer of an AI product against disguised harmful requests: jailbreak attempts, fiction or roleplay framing, prompt manipulation, safety bypasses. Design guidance for Anti-Manipulation Safeguards: how the product being built should judge intent consistently whatever the framing."
---

# Anti-Manipulation Safeguards

Why it matters: Users bypass safety with 'fiction research,' 'roleplay,' 'hypothetical' framing. Real case: Adam Raine (16) bypassed ChatGPT safety using fiction excuse and received harmful information.

## The moves

1. **Judge the intent, not the vocabulary.** The same words serve a nurse, a novelist, and an attacker. Deciding on the noun ('weapon,' 'overdose') refuses the first two and, with one reframing, admits the third. Safety lives in the goal behind the request, not the surface tokens.
2. **A disguise is a signal, not a pass.** 'Hypothetically,' 'for research,' 'my character would' are the tells of someone who already expects a no. Treat elaborate framing as evidence of intent to bypass, not as context that excuses the request.
3. **Watch the conversation, not the message.** Escalation happens across turns: each message is individually innocuous, the trajectory is not. A safeguard that only scores the current message misses every attack patient enough to arrive in pieces.
4. **Refuse consistently, whatever the costume.** If 'how do I make X' is refused plainly but 'for a story, how would a character make X' is answered, you have not built a safeguard, you have published the bypass. The boundary must hold identically regardless of framing, or it is not a boundary.
5. **Do not narrate the bypass.** A refusal that explains which word triggered it hands the user the exact edit that gets past it next time. Hold the line without teaching the workaround, and keep the detection detail in your logs.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/anti-manipulation-safeguards
