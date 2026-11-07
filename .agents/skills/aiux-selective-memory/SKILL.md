---
name: aiux-selective-memory
description: "Use when designing or building an AI product and users should control what the AI remembers: memory settings, 'forget what I said earlier', viewing and deleting stored context, outdated or sensitive info resurfacing. Selective Memory makes remembering transparent and editable."
---

# Selective Memory

Why it matters: AI systems remember information without user visibility or control, risking privacy issues and inappropriate responses based on outdated or sensitive context.

## The moves

1. **If 'forget' doesn't delete everywhere, don't call it forget.** A delete that drops the card but leaves the fact in the embeddings, the cache, or the system prompt is the worst outcome in this pattern: the user disclosed something, trusted the button, and you kept it. No delete is merely opaque. A fake delete is a betrayal the user acted on. Either purge every copy or label it 'Hide' and say so.
2. **Show what you actually kept, including what you inferred.** Selective memory starts with a window, not a switch. List stored facts in plain language, when each was captured, and whether the user added it or the system guessed it. Silent inference is the thing users find creepy. If the AI decided to remember it, it belongs on the screen.
3. **Remember what matters, not everything.** Hoarding every trivia detail while missing the two preferences that actually change answers is not control, it's a junk drawer with a search bar. Treat memory as a budget. Rank by what steers future output: stated preferences, constraints, corrections. Let the trivia expire.
4. **Make memory's influence visible at the moment it acts.** A settings page buried three menus deep is not control. When an answer leans on a stored memory, show which one, right there, with a one-click 'this is wrong, forget it.' Control the user can reach mid-conversation beats a dashboard they have to go hunting for.
5. **Forgetting is a feature, not a failure.** Teams treat deletion as data loss to be discouraged with friction and 'are you sure' walls. In a memory product the opposite is true: a clean, trusted forget is what makes users comfortable telling the AI anything in the first place. The off switch is what sells the on switch.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/selective-memory
