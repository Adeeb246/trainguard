---
name: aiux-feedback-loops
description: "Use when designing or building an AI product and user corrections should improve the AI: thumbs up or down, edit-and-learn, 'it keeps repeating the same mistake', preference learning, ratings that actually change behavior. Feedback Loops turn corrections into cumulative improvement."
---

# Feedback Loops

Why it matters: AI systems remain static despite user interactions, failing to learn from corrections and preferences, causing repeated mistakes and generic experiences.

## The moves

1. **Close the loop, or don't open it.** If a thumbs-down can't change what the same user sees next time, the button is a lie. Collecting feedback you can't act on isn't humility, it's theater. Build the pipeline first and the control second, not the other way around.
2. **Show the user their own dent in the system.** 'Thanks for your feedback' is a receipt, not a loop. The proof is a changed output the user can see: 'Got it, fewer like this.' Learning the user can't observe is learning they won't believe, and won't keep feeding.
3. **Make correcting cheaper than tolerating the error.** One tap to correct, and the result visible where they'll notice it. If giving feedback costs more than living with the wrong answer, people live with the wrong answer and your highest-signal data never arrives.
4. **Let users undo what the system learned.** Adaptation with no reset is its own trap: one odd day of clicks and the model misreads someone for good. A visible 'forget this' is what makes a learning system safe to opt into instead of something to fight.
5. **Decide whose feedback counts before you wire it up.** Naive loops overfit to the loudest user, build filter bubbles, and reward deliberate poisoning. Weight it, aggregate it, and guard the input, or your loop will learn the wrong lesson with total confidence.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/feedback-loops
