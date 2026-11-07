---
name: aiux-universal-access-patterns
description: "Use when designing or building an AI product that must work for everyone: screen readers, low literacy, language diversity, motor differences, 'is this accessible', assistive technology support. Universal Access Patterns remove ability and language barriers."
---

# Universal Access Patterns

Why it matters: Many AI interfaces are designed for able-bodied, literate users with specific language backgrounds, creating barriers for users with disabilities, different language needs, or varying levels of technical expertise. This excludes large populations from benefiting from AI capabilities.

## The moves

1. **Name the user and the task, not the standard.** WCAG AA is a floor, not a goal. The real question is whether a screen-reader user can finish the checkout, whether a keyboard-only user can send the message. If you cannot name the assistive technology and the task, you are decorating markup, not providing access.
2. **An overlay is not access. It is a costume.** A floating accessibility widget and a footer badge do not fix an unlabeled button or a keyboard trap. They hide that you never did. The bolt-on overlay is worse than an honest gap because it convinces the team the work is finished while the real users are still locked out.
3. **Give every AI output a text path.** AI introduces new ways to lock people out: generated charts with no alt, audio with no transcript, streaming text that screen readers never announce. Every non-text output needs a real text alternative that carries the same information, and live status needs an aria-live region, not silence.
4. **One product, not a second-class lane.** A separate 'accessible version' drifts out of date the moment the main UI ships a change, and now you maintain two broken things. Build complexity toggles and language switches on the same DOM so access stays in sync with the product people actually use.
5. **A green scanner is necessary, never sufficient.** Automated checks catch missing alt text and contrast failures, which is the floor. They cannot tell you the focus order is nonsense or the label lies. Test the task end to end with a real screen reader and keyboard before you call it accessible.

When this applies, make the smallest change that genuinely realises the pattern. Do not add UI the product does not need, and say what you changed and why.

Reference: https://aiuxdesign.guide/patterns/universal-access-patterns
