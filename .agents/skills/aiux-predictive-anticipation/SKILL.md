---
name: aiux-predictive-anticipation
description: "Use when designing or building an AI product and the product should act before the user asks, or when it already anticipates too much: suggesting next actions, pre-loading likely content, 'it should know what I need next', smart defaults from behavior. Equally, when the prediction itself is the complaint: 'it keeps autofilling things nobody asked for', fields pre-filled with the wrong guess, an action committed that should only have been staged. This is the pattern for pre-filling and pre-staging the user's next step, not for background sensing (Ambient Intelligence) or inline tips (Contextual Assistance)."
---

# Predictive Anticipation

Why it matters: Users waste time waiting for content or searching for next actions. Systems react instead of anticipating needs.

## The moves

1. **Prepare the next step. Don't take it.** The whole pattern lives in the gap between getting ready and acting. Pre-fetch the route, draft the reply, warm the cache, then hand the commit to the user. A prediction that acts on its own isn't anticipation, it's a decision made in your name.
2. **A wrong guess must cost nothing.** If the user can ignore your prediction and reach for what they actually wanted with no penalty, predict freely. The moment a miss costs them lost state or extra clicks to undo, your confidence bar was too low. Make the unhappy path as cheap as the happy one.
3. **Below the confidence bar, stay quiet.** A loud wrong guess is worse than no guess: it interrupts, it has to be rejected, and it teaches the user to distrust the next one. Prepare invisibly when you're unsure. Only surface a prediction when being right is likely enough to earn the interruption.
4. **If a prediction reshapes the screen, say why.** Reordering a list or surfacing a suggestion without explanation feels like the product moving on its own. One short reason ('because you watched 3 action films') plus a one-click way to turn it down keeps anticipation feeling like help, not manipulation.
5. **Anticipating the familiar is a filter bubble.** Predict only what the user already does and you slowly wall them inside their own past. Leave room for the unexpected, and treat 'I never want this prediction again' as a first-class control, not a buried setting.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/predictive-anticipation
