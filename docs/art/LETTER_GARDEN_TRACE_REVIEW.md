# Trace board calibration

Local preview: `letters.html?v=20260906-trace1`. Only Letter Garden changed; audio and publishing remain untouched.

## Changed

- Warm paper in a restrained wooden frame, with a separate tool tray. The eraser no longer sits over drawable pixels. Its icon and accessible name now describe clearing rather than replay.
- Larger optically positioned letter guide, sage guide edges, and green ink matching the illustrated crayon. The existing riverbank, boat and flowers remain around the board.
- Canvas coordinates account for displayed scaling. Pointer cancellation stops drawing without submitting a stroke.
- Existing coverage thresholds, requirement to cover every dot cluster, three-target sequence, rewards and saved progression remain unchanged. Larger guides also produce a proportionally larger brush through the existing brush formula.

## Checked

- Actual browser play at 320×568: traced ت body first (did not advance), added dots (advanced); partially drew ا, erased and retraced; completed ث and reached rewards; replayed and returned Home.
- Actual 1024×768 layout in a scaled QA iframe, reduced motion: traced first body and dots and advanced. New coordinate mapping keeps ink beneath the pointer when scaled.
- Same-size before/after screenshots inspected. Phone normal motion and desktop reduced motion layouts inspected.
- 20 automated tests pass, including scaled canvas coordinates, protection against strokes during success, and leaving during pending advance. Syntax check passes.
- QA used an isolated origin. User progression was not seeded or reset.

Not yet checked: all later curriculum glyphs/diacritics, physical touch devices, orientation changes during a stroke, or full desktop sequence. Garden Paths is a separate activity and is unchanged. Crayon illustration is a visual material cue, not a new selectable tool.

## Recovery / evidence

`.codex-checkpoints/letter-garden-trace-20260906/before.tar.gz` contains the pre-pass HTML, MiniGames, art stylesheet and tests. Extract into a temporary directory and selectively restore after saving any later work.

`trace-comparison.jpg` and `trace-desktop.jpg` in that directory record this pass. QA fixtures there render the baseline and current implementation with matching seeded state.
