---
name: aiux-intelligent-caching
description: "Use when designing or building an AI product and AI responses feel slow or repeated queries recompute: latency complaints, 'answers take too long', pre-fetching likely requests, caching common results. Intelligent Caching makes frequent AI results instant."
---

# Intelligent Caching

Why it matters: AI systems often require significant computational resources and time to generate responses. Users experience frustrating delays, especially for common or repeated queries that don't need to be recomputed.

## The moves

1. **A correct cache miss beats a confident cache hit.** The point of caching is speed, but speed that returns the wrong answer isn't a win, it's a faster way to be wrong. When freshness is in doubt, recomputing or saying 'I don't know' is the safe move. Optimize hit rate second, correctness first.
2. **Invalidate on the event, not on a clock.** A TTL is a bet that nothing has changed yet, and you lose that bet silently for the entire window. Wire invalidation to the thing that actually makes the answer wrong: the source edit, the price change, the new upload. Use a TTL only as the backstop for changes you can't detect.
3. **Show the age. Let the user tell memory from now.** The dangerous cache hit is the invisible one. If freshness could change a decision, render the age or a timestamp so a remembered answer never masquerades as a recomputed one. A small 'cached 2 min ago' is the difference between trust and a confident lie.
4. **The cache key is a security boundary.** If a result depends on who's asking, the key must too. Caching a personalized or permission-gated answer on the query alone, then replaying it to the next person, is a data leak dressed as a performance optimization. Audit your keys before you audit your hit rate.
5. **Serve stale, refresh behind it.** When an answer is past its freshness window but not yet wrong, you don't have to choose between slow and stale. Return the cached value instantly, recompute in the background, and mark it stale while you do. The user gets speed now and truth a moment later, and never mistakes one for the other.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/intelligent-caching
