# Connected Boat adventure — 2026-09-18

Local preview: `http://letter-garden-next.localhost:8790/letters.html?v=20260918-boat-adventure1`.
Pre-pass checkpoint: `5473287`. Remaining audio review is parked by the owner.
No push, deployment, new voice files or parent-page work in this pass.

## Child experience

Boat now carries one pictorial purpose through the existing Pond → Trace → Feed
sequence: discover seed packets, draw their labels, and deliver them to a pet's
picnic. A compact picture route shows where the child is. Each handoff has one
prominent next-activity picture and a smaller replay button. Practice remains
available on the map instead of competing with the next activity.

The drawing handoff uses small in-memory pictures of the child's actual ink and
chosen pencil colour. Recognition choices keep standard Arabic letterforms.
Drawings are not saved as mastery or extra rewards, and capturing a thumbnail
cannot block completion. Shared packet art keeps the same proportions and target
geometry in Pond and Feed.

The selected pet accompanies entry, play and rewards, reacts to drawing and
packet handling, and serves as the single pet in Feed. Tapping it replays the
current prompt. The final delivery now saves the chapter and goes directly to
one picnic celebration. Replay, decorate and a prominent garden return remain.
A basket memento beside the existing map boat derives from saved completion,
so it survives reload and appears for previously completed Boat chapters too.

The presentation is gated to the exact Boat chapter and its existing game order.
Other chapters, practice/daily plans, learning evidence, difficulty, curriculum,
owned items and best-score reward accounting are unchanged. The shared packet
material also appears in the existing garden contexts that already use packets.

## Verification

- **253/253 automated tests pass.** The new regression file covers chapter
  gating, single-use/repeated/stale transition calls, final completion, final
  replay accounting, saved mementos, one-time drawing callbacks and safe ink
  thumbnails. Existing curriculum, gradual difficulty, save/reward, drawing,
  input, speech cancellation and offline-shell checks pass.
- Actually played entry → four Pond rounds → three drawings → four deliveries
  → final picnic → replay delivery → map on the isolated QA origin at 390×780.
  Used both pointer drag and tap/select delivery, and child-led drawing Next.
  Correct completions raised the synthetic wallet from 20 to 23 to 26 to 29;
  replay left it at 29. Boat was saved once with three stars; the next chapter
  unlocked. Navigating to the normal app on that origin retained these rewards
  and the picnic memento.
- Drew a second set of three blue labels through actual pointer input and
  inspected their pictures in the corrected handoff. The basket originally
  overlapped two labels; raising the cargo removed that overlap. The labels stay
  separate from stars and navigation. An inherited prompt-tail shape also
  interfered with the centered Feed prompt and was removed for this layout.
- At 320×568, exercised wrong-choice comparison and recovery in Feed, with all
  controls visible. At 568×320, inspected Feed, final picnic and Trace; changed
  pencil colour, drew and cleared. The in-play route yields its space in short
  landscape; entry and reward scenes still show it.
- At 1280×800, inspected the drawn-label handoff and delivered using keyboard
  Enter. At 768×1024, inspected and played Pond with Lumi. Mina and Rafi were
  checked in other scenes. This is representative coverage, not the complete
  species/accessory matrix.
- Reduced-motion full chapter and full-motion representative Pond/Feed/picnic
  scenes checked. Actions do not wait for decorative transitions. Exercised
  sound on, pet replay, prompt replay and mute on desktop; browser error log
  remained empty. Audible pronunciation quality was not requalified.
- New presentation JS/CSS are in the service-worker shell, and HTML query stamps
  and worker version were bumped. No installed-PWA update trial this pass.

The QA fixture uses disposable data on `127.0.0.1:8790`; the named-origin user's
progress was not seeded or reset. Its small text footer is absent from live UI.
No physical phone, child session or educator assessment was performed.

## Sighted comparison and limits

Screenshots and command reports are in [boat-adventure](reviews/boat-adventure/).

| Area | Evidence |
|---|---|
| Generic reward to connected handoff | `reward-before-phone.png`, `handoff-phone.png`, `labels-handoff-phone.png` |
| Child-made packet labels | `label-drawn-phone.png`, `labels-handoff-phone.png`, `labels-handoff-desktop.png` |
| Clear single pet and usable controls | `feed-small-phone.png`, `feed-landscape.png`, `trace-landscape.png` |
| Pond and established scenery retained | `pond-before-phone.png`, `pond-tablet.png` (different viewport/content) |
| One final stopping point and lasting change | `picnic-landscape.png`, `map-earned-phone.png` |

New packet paper has warm contours, light/base/shadow bands and a contact shadow;
the shared composition reserves separate room for labels, pet, stars and buttons.
The supplied palette report still finds legacy debt: 663 off-palette values /
920 uses, and 18 off-scale stroke values. This is not a whole-game art-bible pass;
existing cast/detail complexity, numeric composed-frame value quotas and the
complete accessory fit matrix remain outstanding from the art-foundation review.
The repository's `/art-review` command was not available as a session skill;
screenshots were reviewed against ART.md directly. No merge was performed.

This implements pass 2 for Boat and bounded parts of passes 4–5. Exploratory
learning, wider habitat stories and interactive owned garden props remain future
work. The audio bank remains at 57 exact clips; 377 requested new items still
use device speech pending review/mapping. No full-audio or learning-effectiveness
claim is made.

## Recovery

To inspect the pre-adventure baseline without overwriting this work, run from
the durable checkout:

```sh
git worktree add ../letter-garden-before-boat-adventure 5473287
```

The current local candidate is also backed up in the sibling
`letter-garden-next-major.bundle`. Keep `.qa/` disposable and uncommitted.
