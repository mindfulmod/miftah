# Ten interaction fixes — September 8

One coordinated local pass across Pairs, Feed, Build, Dot Garden and Garden Paths. Learning targets, mistake thresholds, curriculum, saved progress and reward calculations are unchanged.

| # | Issue and fix | Evidence |
|---|---|---|
| 1 | Matched Pairs cards become natively disabled, removing completed keyboard stops. | Desktop browser reported two disabled matched cards; regression assertion. |
| 2 | Pairs opening demo ends when the child begins choosing. | First pick removes demo classes; regression assertion. |
| 3 | A second tap on a selected Feed packet puts it down. | Phone keyboard select/cancel/reselect/deliver. |
| 4 | Feed basket uses native disabled state until a packet is selected, and while delivery runs. | Browser enabled true after select, false after cancel and on next round. |
| 5 | Used Build pieces disable; returning them or retrying re-enables usable pieces. Removed decoys stay disabled. | Phone placed ط, confirmed disabled, returned from socket, confirmed enabled; regression assertion for return. |
| 6 | Dot undo disables when history is empty. | Phone initial, add, undo and reset check. |
| 7 | Dot recall mistakes retire the wrong answer and guide toward the correct one. | Phone incorrect ت highlighted ب; rendered screenshot inspected. |
| 8 | Dot success disables activity tools during its feedback pause. | Browser Check disabled immediately; regression covers all buttons. |
| 9 | Clearing Garden Paths releases active pointer capture and resets readiness. | Browser draw/clear/redraw; regression verifies clear mid-stroke and ignored later move. |
| 10 | Garden Paths handlers are tied to their rendered view and lifetime. | Regression invokes old Next after new view and current Next after destroy; neither adds feedback or advances. Browser guided-to-copy transition checked. |

46 tests pass. Modified JS syntax and tracked whitespace checks pass. Browser checks used the local live implementations through isolated fixtures: 320 × 568 phone layouts and 1024 × 768 desktop Pairs with reduced motion. Scope is the ten behaviors above, not an exhaustive retest of every chapter or audio voice quality. Speech synthesis was muted in these fixtures; speech cancellation/replay remains covered by existing tests.

Version: 20260908-batch10. Not published. Recovery archive: .codex-checkpoints/letter-garden-batch10-20260908/before.tar.gz (letters.html, MiniGames.js, GardenPractice.js). Preserve later work when restoring. Fixtures are QA-only and not intended for deployment.
