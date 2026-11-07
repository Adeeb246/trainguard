---
name: aiux-guided-learning
description: "Use when designing or building an AI product and a complex AI feature overwhelms newcomers: step-by-step walkthroughs, wizards, 'users do not know where to start', tutorials that adapt to skill level. Guided Learning breaks the task into steps matched to the user's knowledge."
---

# Guided Learning

Why it matters: Complex AI systems overwhelm users with too many options, causing confusion and poor adoption.

## The moves

1. **The tutorial should end with something real in their account.** Not a congratulations screen. A working project, a first result, a configured setup. If the flow produces nothing but a completion badge, the user has practised clicking Next and learned the product no better than before they started.
2. **Teach the decision, not where the button is.** Button locations are discoverable. Knowing which option to pick and why is not. Any step that highlights a control without naming the choice behind it should be removed and done for the user instead.
3. **A tutorial is often a bug report about the interface.** If a screen needs explaining, the cheap move is a walkthrough and the right move is usually fixing the screen. The walkthrough has to be maintained every time the UI changes, and it hides the evidence that something is wrong.
4. **Make leaving free.** Skip has to be as prominent as Next and has to keep the work done so far. The moment exiting costs progress, people finish the flow to protect their work rather than because it is helping them, and your completion metric stops meaning anything.
5. **Measure whether they can do it again alone.** The only honest test is unaided repeat performance, compared against people who skipped the tutorial. Completion rate measures how well you built a corridor, not whether anyone can walk without it.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/guided-learning
