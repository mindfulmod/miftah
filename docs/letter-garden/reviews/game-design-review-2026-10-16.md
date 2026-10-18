# Game design review: fun, unlocks, coming back (2026-10-16)

Written from a games-industry view (kids' app studios such as Toca, Sago and
Duolingo ABC): is it fun minute to minute, does each session feel worth it,
and is there a reason to come back tomorrow? Every recommendation stays
inside the Spec 02 rules: no guilt, no new currency, no loot boxes, no timers
or energy, no visible mastery gates, no visible streak, no background music.

## What is already strong
- **The minute-to-minute feel is studio-grade.** Every tap answers: squash,
  burst, neighbours lean away, the pet reacts. Misses are soft, errorless,
  and hinted after two tries.
- **The session shape suits ages 2–6.** Meet a letter, play three short
  games, then a friend stop and a party. That is about 5–8 minutes, ending
  on a high.
- **Lots to collect.** 36 stickers, 14 outfits, 8 pet friends, 7 tricks, 28
  letter friends, chapter keepsakes for the garden, map plants that grow,
  the star sky, 4 books and the ayah garden.
- **A cast with faces.** The pet rig and the letter friends give the game
  characters a child can love, and that matters more than any feature.

## Gaps found (with numbers)
1. **The star economy dries up.** Stars are paid only when a chapter game
   beats its own best (the 2026-07-25 anti-farming rule). The most a child
   can ever earn is about 198 (22 chapters × 3 games × 3 stars). The shops
   ask about 400: outfits 122, pet friends 95, stickers 36 × 5. Replays and
   all 28 practice toys paid nothing. So the "want it, earn it, get it" loop
   stalls just when a child is in the repetition phase they love.
   → **Built 2026-10-16:** each toy pays 1 star the first time it is
   finished each day, 5 a day at most.
2. **A thin reason to come back tomorrow.** The only daily pull was a free
   sticker visit after the daily review, and it ends once the 36 stickers
   are owned. → **Built 2026-10-16: daily treasures.** One find waits on the
   map each new day the child plays; 16 to collect on an album nature shelf.
   No streak, and a missed day costs nothing.
3. **The pet's growing up is silent.** It grows at 5 and 15 chapters with no
   moment at all. In pet games, evolution is a top "I did that" beat.
   → Next: a growing-up ceremony at the party.
4. **The map is calm but small for toddlers.** The pet stands at 64px beside
   beige stops. Toddlers look first at big, saturated, moving things.
   → Recommend: a bigger pet on the map, and small idle actions
   (sniffing a flower, waving at a butterfly).
5. **Collections don't end in a moment.** A full set (all treasures, all
   tricks) should end in something special, such as a shelf trophy or a pet
   pose. → Recommend: a set-complete reward for treasures and tricks.
6. **Art catchiness.** It is cohesive and gentle, but cream panels
   (#fffaf0 / #e5dcc8) dominate many screens, so the UI frame is louder
   than the cast. → Recommend: saturated hero colour on the one focal thing
   per screen, and keep the frames quiet.

## Ranked next builds (model tags per house rule)
| # | Build | Why | Model |
|---|---|---|---|
| 1 | ✅ Pet growing-up ceremony at stages 2 and 3 (built 2026-10-16) | A biggest-moment beat, currently silent | Sonnet |
| 2 | ✅ Bigger map pet + idle micro-actions (built 2026-10-16) | The cast is the hook; toddlers look at motion | Sonnet |
| 3 | ✅ Treasure-set complete: gold trim + golden set (built 2026-10-16) | Completion moment | Haiku |
| 4 | ✅ A letter friend visits the map each day (built 2026-10-16) | Daily surprise + review | Sonnet |
| 5 | ✅ Focal-colour pass: map's next stop, album tab, garden tray (2026-10-16); practice, stars and wardrobe already lead correctly | Art catchiness | Fable |

Sources: first-hand review of the code and real-browser renders (headless
Brave), and the star and shop figures read from LettersGame.js and
LettersArt.js.
