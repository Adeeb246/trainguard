---
name: aiux-privacy-first-design
description: "Use when designing or building how an AI product handles user data: consent, data minimization, 'what does the AI store about me', transparent privacy controls, trust concerns about collection. Privacy-First Design collects less and explains clearly."
---

# Privacy-First Design

Why it matters: Users are increasingly concerned about AI systems collecting and using their data without clear consent or understanding. Opaque data practices erode trust and create privacy risks, while overly restrictive privacy settings can break functionality.

## The moves

1. **Privacy is what you don't collect, not what you let users switch off.** The strongest privacy move is upstream: never ingest the data in the first place. A settings page is a fallback for the little that remains, not the strategy. If your privacy work is all toggles and no minimization, you have shipped the trap.
2. **Default to collect-nothing, then earn each field.** Opt-in beats opt-out, and a privacy-protective default beats a pre-checked box every time. Every piece of data you turn on by default is a decision you made for the user. Make them opt in for a benefit they can name.
3. **Off has to mean deleted.** A switch that stops future collection but leaves the existing data on your servers is a pause button wearing a privacy label. When a user turns a feature off, the data behind it should go with it, immediately, and if it can't, say so honestly.
4. **Process on the device whenever the feature allows it.** Data that never leaves the user's machine can't leak, can't be subpoenaed, and can't be repurposed later. On-device is slower for heavy tasks, so reserve the cloud for what genuinely needs it and make that boundary visible, not implied.
5. **Name the trade-off at the control, in plain language.** 'Improve your experience' is not consent, it is cover. State what stops working when a setting is off and exactly what data it uses when on. If you can't name a concrete benefit for collecting something, that's your answer: don't collect it.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/privacy-first-design
