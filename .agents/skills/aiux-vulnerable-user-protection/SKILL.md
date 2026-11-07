---
name: aiux-vulnerable-user-protection
description: "Use when designing or building an AI product that minors or at-risk people may use: age gating, dependency risks, mental-health-sensitive contexts, graduated protections. Design guidance for Vulnerable User Protection: how the product being built should recognise risk and adjust its safeguards."
---

# Vulnerable User Protection

Why it matters: Systems fail to protect minors, crisis users, and those with mental health challenges. Replika enabled romantic interactions with minors and created unhealthy dependency patterns.

## The moves

1. **Build the response before the detector.** Detecting a user in crisis and answering with a stale hotline link is worse than not detecting them, because the product has now made a promise it cannot keep. Verify every resource is live and regional before any signal is allowed to trigger it.
2. **An age gate protects the account, not the person.** A checkbox at signup tells you what someone was willing to click once. Vulnerability is a state that changes within a session, so signals have to be read per message, with the evidence and timestamp stored for review.
3. **Do not infer vulnerability from weak proxies.** Guessing from vocabulary, age band, or writing style restricts real people on the basis of a stereotype, and they rarely have a way to appeal. Act on what the user actually disclosed and on behaviour, not on inference about who they seem to be.
4. **Start with the lightest protection that works.** Adjusting tone, offering a resource, limiting one capability, requiring human review, restricting the account: that is an order, and most signals belong at the top of it. Jumping to the hardest response drives the person to a product with no protections at all.
5. **Never let a protection be silent.** Capability that vanishes without explanation reads as a broken product, and people route around broken products. Say plainly that something changed and why, without telling the user they have been classified, keep their data, and give them a human to reach.
6. **Some surfaces should not ship.** If a feature only becomes acceptable once wrapped in safeguards, the safeguards have become the argument for building it. That is the point to reconsider the feature, and it is a decision for someone with safeguarding expertise, not for the implementation.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/vulnerable-user-protection
