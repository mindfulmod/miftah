# Wardrobe interaction review — September 7

The pet room rebuilt all controls whenever a child selected a color, body or accessory. This reset the horizontal shelves and dropped keyboard focus. Updates now preserve both shelf offsets and the room's vertical position, then restore focus to the originating control without scrolling it. A restored shelf does not repeat the introductory nudge.

Body, color and accessory controls expose their selected state. Accessory buttons have accessible names and unowned items include their existing star cost. Selected bodies and worn accessories also display a small check mark, supplementing the existing color treatment. Costs, ownership, three-accessory limit and save keys remain unchanged.

The shelf demonstration now respects reduced motion and yields to pointer, keyboard focus or wheel input. It also checks reduced motion again when the delayed animation would start. The main pet button uses native click activation so Enter/Space can trigger the same interaction as a tap.

Validation: 33 tests pass, including a focused regression for reduced motion, rerender suppression, focus interruption, detached shelves and the untouched demonstration. In the 320×568 browser fixture, selecting and keyboard-removing the late-shelf moonpin retained scrollLeft=922 and focus on the same item. Changing color retained that shelf position. Keyboard activation of the pet showed its letter bubble. A new desktop page load restored the saved green color, equipped cap and unequipped moonpin. The wallet remained unchanged. Checked selection markers at phone and desktop scale.

This pass does not redraw the fourteen accessories or certify all accessory/species combinations. Those art reviews remain outstanding. QA used an isolated local origin, not a live player's save. Local version: `letters.html?v=20260907-wardrobe1`; not deployed. Recovery and fixtures: `.codex-checkpoints/letter-garden-wardrobe-20260907/`.
