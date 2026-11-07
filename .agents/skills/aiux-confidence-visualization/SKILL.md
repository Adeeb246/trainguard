---
name: aiux-confidence-visualization
description: "Use when designing or building an AI product and users need to know how sure the AI is: confidence scores, uncertainty indicators, 'should I trust this answer', flagging low-certainty output, deciding when to verify. Confidence Visualization shows reliability so trust is calibrated."
---

# Confidence Visualization

Why it matters: Users don't know how much to trust AI predictions, leading to over-reliance on incorrect outputs or unnecessary verification.

## The moves

1. **Only show confidence the model actually has.** A calibrated 70% is gold; a fabricated 92% is a liability. If '80%' doesn't mean right-80%-of-the-time, you aren't visualizing confidence, you're decorating uncertainty with false precision, and users will trust it right up until it burns them.
2. **Tie the signal to an action.** Confidence should change what the user does: trust it, verify it, or pick an alternative. If nothing changes at any level, the indicator is decoration. Always pair low confidence with a concrete way to check.
3. **Round to the resolution people can act on.** '92.4%' implies a precision you don't have and a human can't use. Buckets (high / medium / low, or 'likely / uncertain') usually beat a false-precise number. Match the granularity to the size of the decision, not to what the model happens to emit.
4. **Make low confidence legible, not just visible.** A red bar says 'be careful' but not why or what to do. The most useful uncertainty UI says 'I'm unsure because X, here's how to check.' Visibility without guidance just hands the user anxiety and no exit.
5. **Don't badge everything.** If most outputs are high-confidence, a chip on each one becomes wallpaper people stop seeing. Surface the signal where reliability actually varies and matters; stay quiet where it doesn't, so the indicator keeps its meaning.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/confidence-visualization
