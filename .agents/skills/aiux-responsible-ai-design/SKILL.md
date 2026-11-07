---
name: aiux-responsible-ai-design
description: "Use when designing or building an AI product and fairness, bias, or accountability is at stake: bias audits, 'could this harm or exclude someone', ethical review of AI decisions, accountability for automated outcomes. Responsible AI Design builds these checks into the lifecycle."
---

# Responsible AI Design

Why it matters: AI systems can perpetuate biases, make unfair decisions, or cause harm without ethical design.

## The moves

1. **If a value can't block a ship, it isn't a value yet.** The whole pattern reduces to one question: name the last time fairness or safety stopped one of your releases. A principle wired to a threshold that can fail the build is responsibility. A principle on a slide is a press release. Everything else in responsible AI is downstream of this.
2. **Name who gets harmed, or you've hidden the harm.** 'It works for most users' is the exact sentence that buries differential failure. Responsible design means measuring outcomes across the specific subgroups who can't walk away, not the average. If your metrics only report aggregates, you've built a tool that can't see the people the pattern exists to protect.
3. **A score is not a safeguard.** An ethics score, a bias dashboard, or a 'reviewed' badge that computes a number and changes nothing about what deploys is the signature failure. It manufactures the feeling of having acted while the model ships unchanged. Worse than doing nothing, because the artifact launders the harm and buys everyone false comfort.
4. **Accountability means a decision is reconstructable later.** When a bad outcome surfaces months after launch, can you say who decided, on what inputs, with which model version, and who signed off? If the answer lives only in someone's memory, you don't have accountability, you have a story. Persist the chain so it survives the people who built it.
5. **The affected person needs a door, not a badge.** The user on the wrong end of a high-stakes decision doesn't need to see your principles. They need a contest path that reaches a human and shows the same evidence the system used. An appeal button that goes nowhere is the trap wearing the costume of the cure.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/responsible-ai-design
