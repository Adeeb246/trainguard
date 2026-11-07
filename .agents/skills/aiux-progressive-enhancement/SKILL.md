---
name: aiux-progressive-enhancement
description: "Use when designing or building an AI product and quality output takes time: streaming rough answers that improve, 'users wait with no feedback', instant draft then detail, skeleton results while the model works. Progressive Enhancement gives something useful immediately and better progressively."
---

# Progressive Enhancement

Why it matters: AI systems often require significant time to generate high-quality, detailed responses. Users are left waiting with no feedback, leading to frustration and uncertainty about whether the system is working.

## The moves

1. **The first tier has to be a real answer, not a teaser.** Progressive enhancement means a usable thing now, then more. If your 'basic' tier only makes sense once the enhancement lands, you shipped a loading state in a content costume. The test: would the user be okay if enhancement never arrived? If not, it is a spinner.
2. **Enhancements add depth, they never reverse meaning.** Layering more detail, citations, or nuance on a standing answer is enhancement. Streaming yes and then correcting to no is a bug the user already acted on. If a later stage can flip the answer, don't render the early one as an answer, label it provisional.
3. **The baseline must survive a failed enhancement.** The payoff of the pattern is resilience: when the model stalls or the upstream times out, the user still holds a complete, simpler answer. If a broken enhancement can blank out or block the baseline, you built a dependency and called it a layer.
4. **Speed is the only reason to tier. Respect it.** You split a response into stages to trade a blank wait for a useful partial. If the result is already fast or atomic, tiering just buys shimmer and reflow. Tier where the wait is real, and nowhere else.
5. **Say which tier the user is looking at.** An unlabeled stream leaves people unsure whether the answer is done or still cooking, so they either wait too long or act too early. Mark the current tier, signal when more is coming, and give them a way to stop at 'good enough.'

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/progressive-enhancement
