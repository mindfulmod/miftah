# Letter Garden — major versions

Local builds; nothing here is committed or deployed until the owner says so.

## v3 — Writing Garden (2026-10-01)
Spec 02 promised stroke-order guidance; the trace had been coverage-only.
- A handwriting model (`src/letters/LettersStrokes.js`) for all 28 isolated
  letters — strokes in writing order and direction, dots as taps — plus
  strokes for fatha, kasra, damma, sukoon, shadda and the three tanween.
- Guided tracing: a pen demonstrates every stroke, then the child follows a
  pulsing start dot and arrow; ink follows the finger along the stroke;
  wandering off rubber-bands back to the last quarter-mark. Nothing fails.
- Joined words keep the coverage trace. Completion and reporting unchanged.
- The meet screen writes each new letter with the same strokes before the
  printed letter settles in.

## v4 — Growing Friend (2026-10-01)
Spec 02: "pet grows with mastery … new tricks as letter families strengthen …
accessory unlocks hang off mastery milestones."
- Seven tricks, one per letter family (twirl, triple hop, sway dance, sing,
  stretch tall, juggle, somersault), learned when ¾ of a family's letters reach
  mastery 0.6 in the quiet strength model. Never bought.
- A tricks tab in the pet room; unlearned tricks are quiet seeds.
- A newly learned trick is shown off once, unasked.
- Milestone gifts: sprout (2 families), medal (4), crown (all 7) — added to
  the wardrobe; nothing is taken away.

## v5 — Sticker Stand (2026-10-01)
Spec 02 declined blind packets ("no loot-box training for a 5-year-old") and
chose "earn the choice: … the child chooses 1 of 3".
- The blind 5-star pack (and its tear-open ceremony) is replaced by a sticker
  stand: three stickers face-up, the child picks one, it flies into its album
  slot. Stars (or a free visit) are spent only at the moment of choosing.
- The day's first daily bouquet earns a free stand visit (up to 9 banked).
- Owned stickers, prices and the star economy are unchanged.

## v6 — Letter Hunt (2026-10-01)
A new practice-garden game. The child's newest land is drawn as a big picture
with six letters they know living on things in it (clouds, kites, tree trunks,
rocks, crates, lily pads, sails, lanterns, flags, shells, pots). The pet asks
for one by name; finding it brings that thing to life and drops the letter in
the basket. Five finds per hunt.
- Honesty matches the Water Garden: with sound on the prompt is heard, not
  shown (`independent_listening`); sound off or after a miss it is shown
  (`supported_visible_matching`). One report per letter tap; scenery taps are
  play and report nothing.
- Upright phones get their own picture (two columns, larger things and letters).
- Appears once the pet knows three letters.

## v7 — Read Together (2026-10-01)
Spec 02's proof that the garden works is the child reading fresh letters to a
grown-up. In the grown-up corner: six cards from what has been taught, weakest
first; the child reads aloud, the grown-up taps "Read it" or "Not yet" (with
"Hear it" to check). The last result shows back in the corner. Results are the
grown-up's and never feed the child's strength model or stars.

## v8 — Quran Word Shelf (2026-10-01)
A third album tab (a little rehal): real words from the short surahs that the
child can genuinely decode now — the word chapters' own filter, so every letter
and mark has been taught. Read it first, then tap to hear Mishary Alafasy
recite that very word (Quran.com word-by-word clips; offline it falls back to
the garden's voice). Shelves group words by length.

## v9 — Family Garden (2026-10-02)
Siblings each keep their own garden — pet, progress, stickers, strength.
- The first child keeps the original storage keys, so existing progress is
  theirs with no migration; each further child's keys carry `@pN:`. Sound and
  motion settings are shared by the household.
- With more than one child the app opens on a wordless "who's playing?" —
  each child is their own pet (or unhatched egg). The grown-up corner lists
  the children and adds one (up to six). Switching reloads, so every system
  starts clean on that child's data.

## v10 — Moon Calendar (2026-10-02)
The garden keeps the Islamic calendar (Umm al-Qura, from the browser).
- Ramadan: a lantern garland across every scene (glowing at night) and a
  crescent moon. Eid al-Fitr (1–3 Shawwal) and Eid al-Adha (10–13 Dhul
  Hijjah): bunting with a crescent and star.
- Each Eid gives the pet the crescent pin once (remembered per Eid).
- Decoration and gifts only — no counting, no pressure.

## v11 — Sound Lab (2026-10-02)
The blend machine as free play in the practice garden: any known letter + any
mark a finished chapter has taught → the machine presses out the syllable,
says it, and keeps it on a strip to replay. Nothing is reported or scored.

## v12 — Garden Visitors (2026-10-02)
Animal stickers the child owns visit their garden — flyers in the sky,
swimmers in the river, the rest on the grass. Up to three a day, a different
few each day; tap one and it hops and calls while the pet comes to look.

## v13 — Letter Studio (2026-10-02)
A creative corner in the practice garden: stamp known letters (each says its
name) in five garden inks and sticker friends onto a picture of your land,
then hang it — it becomes a sign in the decorating garden.

## v14 — Real Recitation (2026-10-02)
Quran words in the word chapters (and everywhere a word carries its clip) now
play Mishary Alafasy reciting that word instead of a speech engine reading it.
Prompts keep their timing: a clip that fails or doesn't start within 2.5s hands
over to the garden's voice on the same request. Offline, the garden's voice is
used. Clips are deliberately not cached — sw.js records why (range requests
broke playback in production).

## v15 — Ayah Garden (2026-10-02)
Follow-along reading of the short surahs (Al-Fatiha and 105–114), opened from
the word shelf once the first word chapter is done. Each ayah's words are big
tiles in reading order; ▶ recites the ayah word by word and lights each word
as it is heard; any word can be tapped alone; ayah navigation runs right to
left.

## v16 — Letter Constellations (2026-10-02)
A fourth album tab: the night sky as a progress map. Seven constellations, one
per letter family. A strong letter is a glowing gold star wearing its letter;
a letter still settling is a dim star; an unmet letter a faint dot. Lines join
a family once met and turn gold when the family is strong. Tap a star to hear
it.

## v17 — Gentle mode (2026-10-02)
A per-child grown-up setting: no weather, creatures, seasonal layers or
background sounds; no confetti or drag sparkles; no timed challenge; bigger
round buttons; and if the child pauses 8 seconds, the question repeats itself
(twice at most per screen).

## v18 — Sibling Play Dates (2026-10-02)
Brothers' and sisters' hatched pets visit this child's garden (up to two). Tap
one and it hops and calls in its own species voice while this child's pet
cheers. Visits read a sibling's pet; they never change it.

## Fix — free friends could not be chosen (2026-10-02)
Lumi (the round garden bird the owner calls the owl), Mina and Rafi (the bear)
are free, but choosing one called `spendStars(0)`, which deliberately refuses
zero — so they shook and never became the pet unless already owned. Free
friends now join the child's friends directly. All three were already drawn
and rigged (Lumi flaps, Mina bounces, Rafi stomps).

## v19 — Quran Treasury (2026-10-02)
Stickers whose word appears in the Quran (25 of them — the elephant, hoopoe,
ant, spider, bee, fig, olive, moon, sun…) carry a gold glint in the album.
Opening one shows its word as written in the Quran with its surah and ayah,
and plays Mishary Alafasy reciting that word (once on open, again on tap).
Every reference was taken from the repo's own surah data and is checked
against it by a test.

## v20 — Garden Together (2026-10-02)
Two siblings on one device: a cooperative letter-pairs game. Their two pets
take turns; every pair found goes in one shared basket; at the end both pets
celebrate. No winner, nothing reported. With more than one sibling, the child
picks whose pet plays.

## v21 — Seasons of the Year (2026-10-02)
Spring blossoms, autumn leaves and winter snow fall gently over every scene
(summer is the garden as it is). A grown-up setting picks the hemisphere.
Hidden in gentle mode and under reduced motion.

## Overworld refinement (2026-10-02)
The map did not read as a journey: the same three props (apple tree, reed pond,
basket) alternated the whole way, fruit trees — the orchard's signature —
already stood in the meadow, and every land had the same green ground.
- Each land keeps its own landmarks: meadow wildflowers with a skep hive and
  ponds; orchard fruit trees; lagoon reeds; night lanterns; peaks mountains;
  river jetties and reeds. No fruit trees outside the orchard.
- Each land's stretch of the map has its own feathered ground band (golden
  orchard, teal lagoon, dusky night garden, stony peaks, sandy riverlands) and
  matching edge scenery (tilled rows, ponds, glow-spots, boulders, sandbanks).

## Reach — forgiveness for two-year-olds (2026-10-02)
- A tap that lands on nothing goes to the nearest tappable thing within 32px
  (44 in gentle mode, 52 for a little sprout) — only when exactly one thing is
  that close, so a miss between two answers is never a wrong answer. Home,
  sound, the grown-up dot and drawing surfaces always need a direct touch.
- Drags drop within 28px of their target; blend pieces join when dropped
  anywhere near their partner; the guided trace follows within 13% and only
  rubber-bands past 32%; dots accept a tap within 16%.
- Drawing pencils and the Unfuse helper are now at least 52–56px.

## v22 — Little Sprout (2026-10-02)
A per-child setting for ages 2–3: gentle mode on, the widest near-miss reach,
errorless help (after a wrong pick the right answer glows on the board), and a
short hold on Home to leave an activity so a stray tap can't end the game.

## v23 — World Overview (2026-10-02)
A folded-map button on the map opens the whole world on one page: the six
lands stacked meadow-to-riverlands, a dot per chapter (gold done, pulsing
current), the pet where it waits, and mist over lands not reached yet. Tap a
land to glide there.

## v24 — Letter Balloons (2026-10-02)
Free play for the very youngest: big, slow balloons each carry a letter; pop
one to hear it and a new one floats up. Every letter takes its turn; a child
with no letters yet hears the first family. Nothing is scored or reported.
First in the practice garden for a little sprout.

## v25 — The Garden Brain and Today's Walk (2026-10-02)
One learner model for every letter, and a guided day built from it. The quiet
strength model already recorded every honest outcome; the Brain
(`src/letters/GardenBrain.js`) reads it and never writes.
- Five skills per letter: name, sound (its syllables), write (tracing), friend
  (letter ↔ friend ↔ sound, v26) and shape (in-word forms), each 0..1.
- Spaced, expanding due-ness: a letter just practised rests, and each
  remembered run lets it rest longer (½, 1, 2, 4, 8, 16 days). Never-seen
  letters keep a steady turn.
- Today's Walk: a footprints button leads the map header (ringed in the warm
  "next thing" colour until walked). It opens a short trail of stones — Feed,
  Find My Friend, a recognition game, the weakest skill's game (writing, sound
  or friends) and a closing Letter Friends book page — each loaded with the
  letters that are due. A little sprout gets three gentle stops (balloons,
  find a friend, a book page). Stones run right to left (top to bottom on an
  upright screen) and end at the pet's nap cushion.
- The walk is planned once a day per child (seeded, so it never reshuffles)
  and re-planned when a newly finished chapter changes what the child knows.
- A stop counts as walked when it is finished or given a fair go (20s);
  leaving early is fine and it simply stays open. Any stone can be tapped in
  any order. A finished walk earns the day's stamp on the existing calendar —
  no stars, no streak, no new currency. Free play is untouched.

## v26 — Letter Friends (2026-10-02)
Every letter has a friend whose Arabic name starts with it and whose body IS
the letter — the embedded picture mnemonic from the reading research (letters
drawn as familiar things are learned faster than letters beside unrelated
pictures; it worked for English-speaking preschoolers learning Hebrew, which
is our situation exactly).
- 28 friends (`src/letters/LetterFriends.js`), drawn on the handwriting model
  so the letter traced and the friend loved are one shape: أَرْنَب rabbit, بَطَّة
  duck, تِمْسَاح crocodile, ثَعْلَب fox, جَمَل camel, حِصَان horse, خَرُوف sheep,
  دُبّ bear, ذُرَة corn, رُمَّان pomegranate, زَرَافَة giraffe, سَمَكَة fish, شَمْس
  sun, صَدَفَة seashell, ضِفْدَع frog, طَاوُوس peacock, ظَرْف envelope, عِنَب
  grapes, غَزَال gazelle, فِيل elephant, قِطَّة cat, كِتَاب book, لَيْمُون lemon,
  مِفْتَاح key (the app's own name), نَحْلَة bee, هُدْهُد hoopoe, وَرْدَة rose,
  يَمَامَة dove. Arabic names are taught as names. The friend has the face;
  the letter never does. No dog for ك.
- Each animal friend has its own synthesized call; objects sound like what
  they are (a page, a clink, a chime).
- Three looks — full, soft, plain — chosen from the Brain's friend skill, so
  the picture steps back as the letter becomes known (the scaffold fades).
- Find My Friend (practice garden, and a walk stop): match a shown letter to
  the friend wearing it (supported matching), and once that is solid, hear
  only a friend's name behind a curtain and pick the plain letter it starts
  with (independent listening). The right answer grows the letter into its
  friend. A miss wobbles, the friend peeks, and the round is reported as
  assisted.
- The Letter Friends book: an alphabet book, one spread per friend — the plain
  letter grows its friend, then the letter's name, the friend's call and its
  name with the first letter lit (measured on a canvas, so the Arabic join is
  never broken). Pages turn right to left. Reading reports nothing.
- My Letters (album) shows friends instead of signs; tapping one opens its
  page. Meeting a new letter, its friend arrives beside the sign a moment
  after the letter speaks, grows in, calls and says its name.
- Owner to review: the art is a first pass on all 28 (sheep, sun and gazelle
  are the weakest), and the word list wants a teacher's eye on vowelling.
