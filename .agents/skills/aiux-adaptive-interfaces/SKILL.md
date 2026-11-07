---
name: aiux-adaptive-interfaces
description: "Use when designing or building an AI product and the UI should adjust to how each person uses it, or when that adaptation has gone wrong: personalized layouts, reordering features by usage, 'the app should learn what I use most'. Equally: 'the layout keeps moving', controls that vanish because usage dropped, 'it changed and now I cannot find anything'. Adaptive Interfaces tune layout to behavior without destabilizing it."
---

# Adaptive Interfaces

Why it matters: Static interfaces treat all users identically, leading to inefficient workflows and feature discovery issues.

## The moves

1. **Adapt the edges, never the anchors.** Surface shortcuts, reorder the secondary, personalize the feed. But the primary nav and the controls people hit by reflex must stay put. The moment a user reaches for 'Save' and it has moved, you've made the interface slower, not smarter.
2. **Predictability beats optimality.** A layout that's the same every time is faster than a 'better' one that's different every time, because the user stops looking and starts reaching. An adaptive UI that wins on paper and loses muscle memory is a net loss.
3. **Earn the change with a strong, stable signal.** Adapt on repeated, unambiguous behavior, not one session. A single odd afternoon shouldn't reorganize someone's workspace. When the signal is thin, do nothing: a wrong adaptation is more disorienting than no adaptation.
4. **Make adaptation visible and reversible.** Say what changed and why ('moved up because you use it daily'), and give a one-click 'put it back' and a way to stop adapting. Silent rearrangement feels like the app is broken, even when the change is technically right.
5. **Start from a good default, then ease in.** Adaptation is a refinement on a layout that already works for a newcomer, not a substitute for designing one. Introduce changes gradually so the ground shifts slowly enough to follow.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/adaptive-interfaces
