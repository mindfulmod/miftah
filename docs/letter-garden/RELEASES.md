## 2026-10-31 — Game development and reviewed Marin library checkpoint

- Preserve the accumulated local Letter Garden game, learning, world/art, and interaction work on `codex/letter-garden-next-major`.
- Bundle 718 approved local speech keys, including 466 reviewed teacher-library recordings. Teacher WAV files match their approval evidence and source bytes; no missing mapped files were found.
- Verification: all 1,712 Letter Garden Node tests pass. Historical tests now allow later explicitly approved replacements while continuing to exclude rejected recordings. Palette checker completed in reporting mode; existing palette debt remains.
- Audio is not yet 100% integrated: the two carrier phrases for أَذِّ and أَفِّ are approved, but isolated cuts still require extraction and listening approval. Twenty approved spoken descriptions await explicit teaching/UI integration; Alif can reuse its approved name clip. Do not substitute a description for a phonetic learning target silently.
- No new paid generation was performed during this checkpoint. Review candidates and their provenance remain distinct from the runtime audio bank.
- This is a source-branch publication to mindfulmod/miftah, not a production deployment to qandeel.app. No new visual-quality or end-to-end browser-play certification is claimed by this checkpoint.

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

## v27 — The Book Corner: picture-book games (2026-10-02)
Five games, each one a thing picture books do, on one shelf (the Book Corner,
second in the practice garden) with Find My Friend and the Letter Friends book.
- Picture Words (`src/letters/PictureWords.js`): 34 album sticker pictures with
  their vowelled Arabic names (egg بَيْضَة, fig تِين, mountain جَبَل, moon قَمَر…).
  Unlike the friends, a picture doesn't wear its letter, so the answer has to
  come from the sound. Where a picture and a friend are the same thing, they
  share one name.
- Peekaboo Flaps: a word is heard; lift the leafy flap wearing the letter it
  starts with. A wrong flap still hides someone — it says its own name (a
  contrast, never a penalty), closes, and the word is asked again.
- Sound Sort: pictures go into the basket of the letter their name starts
  with. Baskets wear their friends at first (and never a friend that is the
  same thing as the card); once that is solid, plain letters.
- The Hoopoe's Trip: a cumulative tale. On each page a signpost shows a letter
  and friends wait by the road; the one wearing it joins the parade, and the
  refrain grows — every friend so far says its name. Ends at home.
- Friend Shapes: a friend has lost its body — the duck's head and tail are
  there; which letter is missing? The body flies in and the friend calls.
- Busy Market: a crowded market stall and a letter lens; find everything whose
  name starts with it. Free play — nothing is reported.
- Evidence follows garden rules: heard word + plain letters = independent
  listening; anything with a picture or friend showing = supported matching;
  any question after a miss = assisted. Each question is its own learning
  round. All of it is the friend (association) skill the Brain reads.
- Today's Walk now rotates its association stop through these games.
- The sun friend got a face: two of ش's dots are its eyes.

## v28 — The Sand Table (2026-10-02)
Montessori's sandpaper letters for a tablet: write a letter with a fingertip in
a tray of sand. Finger tracing is the research's quiet winner for learning
letter shapes, and touch, sound and sight now all carry it.
- The finger carves a groove (darker sand with a pale lip); the sand whispers
  while it moves; Android tablets buzz softly (iPad has no vibration, so the
  sound and groove carry it). A rake smooths the tray to start again.
- When the letter is finished its friend rises out of the sand around the
  groove — the duck's head and tail around the ب you just wrote — calls, and
  says its name.
- The guide fades as writing takes hold, chosen per letter from the Brain's
  write skill: the pen shows it first → a dotted path → only the start dot and
  arrow → bare sand (hear the letter; the path is still checked with the same
  toddler tolerance, it just isn't drawn, and the letter isn't printed
  anywhere). A little sprout always gets the path.
- Same Writing Garden engine — stroke order, direction, snap-back unchanged.
  Shown letters report participation; bare-sand letters finished without
  wandering report a real right answer for the writing skill.
- In the practice garden beside the other writing toys; Today's Walk now
  favours it for writing stops.

## v29 — Living Books (2026-10-02)
Picture books that read with the child, on a shelf in the Book Corner.
- Four books, cast from the child's own letter friends: أَيْنَ بَطَّة؟ (a
  lift-the-flap hunt — "Where's Batta?" — with a different friend behind each
  bush until the last), مَا هٰذَا؟ (guess who from a friend missing its body),
  صَبَاحُ الْخَيْر (good morning to every friend as the sun comes up) and لَيْلَة
  سَعِيدَة (goodnight to every friend, and last of all the moon).
- Read-along: each word lights as it is spoken, right to left, one at a time
  (concept of word); tap any word to hear it.
- Predictable refrains and a completion pause: from the third page the book
  stops before the refrain's last word, shows its friend, and waits for the
  child to tap it — then carries on by itself after a while.
- Words the child can genuinely decode (every letter in a finished chapter,
  every mark taught — the word chapters' own filter) wear a gold dotted
  underline. Tapping one waits a breath, glowing, so the child can try it,
  then says it. Grammar note: هٰذِهِ for feminine names, هٰذَا otherwise.
- Favourites: the shelf puts the most-read books first and stars a book read
  three times. Today's Walk can now end on the goodnight book.
- Reading is presentation: nothing is reported or scored.
- Owner to review: all book text wants a teacher's eye.

## Landscape phones (2026-10-02)
A phone on its side is ~390px tall; the top bar and prompt took 120px of it,
so the play area shrank and letters were ~25px. Now (`styles/letters-landscape.css`,
short landscape screens only): home, the pet and prompt, and sound live in a
slim rail on the left and every activity gets the full height. Pop packets,
feed food, pairs cards, orchard fruit, workshop tiles and blend parts are
roughly twice the size; the meet screen puts the letter on the left and the
trail and Next in a column on the right (Next used to fall below the screen);
Water Garden and the Sand Table fill the height; Letter Hunt fits its whole
scene (a wide stage used to crop the kite and cloud letters) with bigger
letters and its basket alongside; the books, Find My Friend and the Book Corner
games lay out side by side. Portrait and tablets are unchanged.

## Audio coverage (2026-10-02)
The Marin voice bank (252 approved clips) covers every letter and joining
chapter; the word chapters use Mishary Alafasy's recitation. The system voice
still speaks (by design, until recordings are approved): 194 syllables from
fatha onward (fatha 8, kasra/damma 19, tanween 90, long vowels 24, leen 21,
sukoon 4, shadda 8 — already in the 2026-09-26 recording package, batches
01–23), and everything v26–v29 added: 28 friend names, 22 picture words and 13
book words — now batches 24–26 (`FRIENDS-BOOKS-SUPPLEMENT.md`, generated by
`scripts/export-friends-audio.mjs`). Book words are spoken without punctuation
so a recording will match as soon as it is mapped.

## v30 — The Story of the Garden and the Bismillah graduation (2026-10-02)
- The wind story, wordless, once on the first visit to the map (replayable in
  the Friends' Garden): the friends in a bright garden → a big wind lifts them
  away and the colour drains → the pet alone → a letter learned, and the duck
  comes home.
- Each land on the map returns from pale to full colour as its chapters are
  finished. Restoration, never a lock: the palest land is still gentle.
- The Friends' Garden (a little house on the map, with a count): every friend
  whose letter is learned lives there, in full colour — tap to hear its call
  and name. Friends still on their way are a little burrow, never a ghost.
- The first time a land is finished, its friends march home across the map.
- The Bismillah graduation, when every chapter is done: all the friends
  gather; Mishary Alafasy recites بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ word by word
  as each word lights; then each word glows in turn for the child to read;
  only then does the garden celebrate. A golden Bismillah keepsake stays in
  the Friends' Garden and replays the ceremony.

## v31 — The Puzzle Tree: Big Brain Academy, for letters (2026-10-03)
Researched across all three Big Brain Academy games (DS 2005, Wii Degree 2007,
Brain vs. Brain 2021). Four thinking games, in a new Puzzle Tree in the
practice garden, and as stops on Today's Walk.
- Echo Parade (DS "Sound Bites", Wii/Switch "Reverse Retention"): friends sing
  2–4 letters from behind a hedge; tap them back in order. Holding sounds in
  sequence is the working memory blending needs. The line grows after a clean
  round and shrinks after a missed one; a sprout never holds more than two;
  always forwards. The friends come out and sing the line once it is done.
- Dots Last (Wii/Switch "Fast Focus", DS "Get in Shape"): a letter's body
  draws itself, then its dots arrive one at a time; which letter is it?
  Knowing early earns a little extra sparkle. A tap only counts once the
  letter is certain from what a child can see — how many dots, above or
  below — so a guess before the dots arrive is "not yet", never a miss.
- Letter Train (Wii "Balloon Burst"): pop the balloons in alphabet order
  (ا ب ت ث …); each becomes a carriage behind the engine (right to left), and
  the train sings its letters as it pulls away. Teaches the alphabet order.
- Same Letter (Wii "Train Turn" and "Odd One Out"): one letter has tumbled
  over — find it among its dot-siblings. Upright first, then turned, then (for
  letters that change when mirrored) with a mirror-image trap. It stands back
  up and becomes its friend when found.
- Big Brain Academy's kind rules come too: a little harder after right
  answers, easier after misses; soft miss sounds; a sprout stays easy. Unlike
  the original, nothing is timed or scored.

## v32 — Lantern Hunt and Letter Shadows (2026-10-03)
Two more Big Brain Academy activities, in the Puzzle Tree and on Today's Walk.
- Lantern Hunt (Wii/Switch "Species Spotlight"): the night garden is dark and
  a lantern lights a circle. The pet asks for a letter; find every one hiding
  in the dark. A tap in the dark moves the lantern there — no dragging needed —
  and lighting something up is its own tap, so nothing is picked blind. Finds
  glow into the jar; when all are found the garden lights up. A sprout gets a
  bigger lantern and fewer hiders. Upright screens get a tall garden.
- Letter Shadows (DS "Shadow Shift"): shadows on a puppet-theatre screen; tap
  the letter each belongs to and it steps into the light as itself. A friend's
  shadow first (its features help), then a drifting one, then two plain-letter
  shadows at once, named in any order. A sprout keeps one still friend shadow.

## Chapter friend stops (2026-10-03)
The newer games were only reachable from the practice garden's corners. Now
most chapters end with one of them — a fourth stop, chosen to fit the chapter,
before the party: Find My Friend for the boat, little, tall and round letters
(meet the new letters' friends straight away); Dots Last for the smile and
wave letters (ج ح خ, س ش ص ض — the look-alikes); Letter Shadows for the strong
letters and the first joining chapter; Same Letter for the second; Echo
Parade for the muqattaʿat (they are recited as letter names in sequence);
Lantern Hunt for the night garden's sukoon chapter. Leaving a stop early still
finishes the chapter. Never in the check-up or daily bouquet. Today's Walk
already mixes them in too.

## UI pass (2026-10-03)
- The practice garden had become one long list of look-alike tiles. It is now
  five wordless, colour-coded groups, each with a picture chip: play with
  friends (heart), books (book), puzzles (bulb), writing (pencil), explore
  (magnifier). A little sprout's group with the balloons comes first.
- Touch targets swept on every screen at 302px wide: the map header buttons
  (48→56px, 50px on the very smallest phones), album tabs, book words, lantern
  stones, Water Garden gates, Sound Lab tiles and Letter Studio inks are all
  ≥ 52–56px now. The sound toggle stays a touch smaller on purpose.
- One shared press feel (a small sink on tap) and the standard 4px focus ring
  on every big game tile; tap-highlight flashes removed.
- Echo Parade's singers hide behind a real leafy hedge.

## v33 — Vowel Hats (2026-10-03)
The Letter Friends idea carried into the vowel marks: every mark is something
a friend wears, drawn along the mark's own handwriting stroke so the picture
keeps teaching the real shape. Fatha is a feather above the head; kasra a
skateboard underneath; damma a curly snail-shell cap; sukoon a bubble on top;
shadda a crown; tanween two of the same. بُ is Batta in her snail cap.
- The Hat Shop (practice garden "explore" group, Today's Walk sound stops, and
  the friend stop for the fatha, kasra/damma and tanween chapters): a syllable
  is heard; give the friend the right thing to wear. With only one mark taught
  yet (the fatha chapter) the question turns around — three friends wear the
  feather; which one says بَ? Whatever is chosen says its own sound.
- Alif never visits the hat shop: it carries no vowel of its own (that needs
  a hamza, أَ), matching the curriculum. Evidence is the syllable skill.

## v34 — The Letter Workshop (2026-10-03)
The last two Big Brain Academy ideas worth keeping (multiplayer set aside).
- Build the Letter (DS "Get in Shape"): pick the body, then the dots (its own
  family's dot patterns are the trap), and the letter grows into its friend. A
  dotted outline at first; once the letter's shape is known, only its sound —
  built from memory, which is the honest evidence. A sprout gets the body in
  place and only chooses dots.
- Fill the Gap (Switch "Frame Filler"): a picture and its name with the first
  letter (and its marks) missing; fill the gap and the word joins up and is
  said. Where a letter has no picture, its friend appears without its body.
- Both in the Puzzle Tree and on Today's Walk.

## v35 — Syllables everywhere (2026-10-03)
- The Sand Table writes syllables: a letter and its mark (بَ جِ تً …), the
  mark's own stroke after the letter, same tolerance and snap-back. Once marks
  are taught, one letter in each session comes back wearing one.
- Echo Parade sings syllables in the vowel chapters (بَا بِي بُو), the friends
  wearing their vowel hats; tiles show the syllables.
- Friend stops for the standing, long-vowel and leen chapters (Echo Parade
  with each chapter's own syllables). Every chapter from the boat letters to
  the night garden now ends with one of the newer games.

## v35 — Anonymous counts (2026-10-03)
Startup Qatar prep needs real usage evidence; the garden had none.
- `src/letters/LettersAnalytics.js` + Plausible (no cookies, no personal data):
  page views, "Visit" (days-played and strong-letter buckets), "Activity"
  (game id), "Item Strong" (first time an item reaches mastery 0.7, once per
  device), "Graduated" (Bismillah). Nothing about names, answers or profiles.
- Grown-up page: a Privacy panel says exactly what is sent, with an on/off
  switch that also sets Plausible's own `plausible_ignore`.
- Stamp 20261003-v35, sw v108. Tests: analytics.test.cjs (473 total).

## v36 — Twin Crown (2026-10-05)
Shadda means a letter is said twice. A crowned friend splits into twins and
the two join back up under the crown. Hear a word — is there a crown in it?
Two cards, one crowned (shown with a little gold crown) and one not; real
recited Quran words with and without shadda take turns being the answer, so
"always the crown" never works. The made-up twin only ever moves a crown onto
a letter that carries a short vowel (never an alif). Friend stop for both
shadda chapters, and in the practice garden once shadda is taught.

## v37 — The Quran Word Well (2026-10-05)
For the oldest children, built on Mishary Alafasy's real word recitation (no
device voice):
- Listen & Find: a decodable Quran word is recited; find it among two or three
  written words of similar length. A wrong pick is recited too, so the
  difference is heard. Honest word-reading evidence.
- Word Gap: a decodable Quran word with one letter (and its marks) missing;
  hear it and pick the piece that fills it. Tatweels keep the joined shape on
  both sides of the gap; distractors carry the same marks and are never an
  alif with a vowel.
- Friend stops for the three word chapters; in the practice garden's books
  group once the word shelf has words; and on Today's Walk for readers. Every
  chapter now ends with one of the newer games.

## v38 — Living Friends (2026-10-05)
- Friends blink, everywhere, gently and out of step with each other.
- In calm places — their garden, the friends' book, meeting a letter, the
  story, the hoopoe's parade — they breathe.
- Touch any friend and it answers with a squash-and-stretch while its letter
  body glows gold for a beat: "this is my letter". All of it stops under
  reduced motion.
- The sheep is redrawn: one fluffy cloud of wool with a clean outline (puffs
  inked first, white on top, so no inner lines), a soft face with a wool tuft,
  ears and little legs.

## v39 — Art pass: the weak friends (2026-10-08)
All 28 friends reviewed at full size. Six were redrawn:
- **Bee نَحْلَة**: the bowl of ن had read as a pink cup on a flower stem with a
  tiny bee. Now the bowl IS the bee: yellow, ink-striped across the body,
  wings at her shoulder, a face and antennae on one tip, a stinger on the
  other. The dot is the orange flower she is carrying.
- **Rose وَرْدَة**: was a pink و with a leaf (a worm). The loop now blooms in
  five petals and the tail is the rose's green stem, with a thorn.
- **Lemon لَيْمُون**: the cream blob became a real yellow lemon with pointed
  ends and a face, sitting in the bowl of ل.
- **Horse حِصَان**: the comb of spikes along its whole back became a flowing
  mane at the neck.
- **Crocodile تِمْسَاح** and **seashell صَدَفَة**: the hard water box and sand
  slab became a rippled pond and a soft sand mound.
All in the palette; the dressed parts still fade away as a letter is learned.

## v40 — Game-quality pass (2026-10-08)
An auto-player (`.qa/autoplay.js`, local only) now plays every practice game
to its end and reports how it ended, right/wrong answers, the evidence each
one recorded, console errors, and whether a stray tap after the end counted.
What it found and what changed:
- Six games had an empty "hear it again" handler, so their replay button and
  the 8-second idle repeat did nothing. Hoopoe's Trip repeats its letter,
  Friend Shapes plays the missing friend's call, Busy Market says its lens
  letter, Letter Train hums the next balloon (and counts as helped). Dots
  Last and Same Letter are seeing games with no spoken question, so they hide
  the button instead of showing one that does nothing.
- Busy Market could strand a child on a finished lens (after switching lenses
  by hand) and end on a count rather than on what was left. It now tracks
  what each lens still has, always moves on to a lens with something left,
  and ends when every lens is done.
- Every other game finished cleanly with honest evidence and no late taps.

## v41 — Polish pass (2026-10-08)
- Hints were only an animation, so with reduced motion a child got no hint.
  Every hint is now also a still gold ring.
- A lonely last tile in a practice-garden group sits in the middle of its row
  instead of stranded at the side.
- New rounds fade in gently instead of snapping (opacity only, so no game's
  own motion or placement is touched; off under reduced motion).
- A tiny buzz on a right answer where phones allow it (off under reduced
  motion).

## v42 — Friend Pairs (2026-10-08)
The memory card game. Every friend has a twin card: its own letter. Turn two
over; a friend and its letter make a pair. Each card says who it is as it
turns. A peek at the start shows every card for two seconds. Little Sprout:
two pairs on one board; otherwise three pairs, then four. Memory isn't letter
knowledge, so pairs record participation only. Friend stop for the little
letters chapter.

## v43 — Dot Nests (2026-10-08)
Nests hold dots like eggs. How many dots has this letter (shown orange)? Pop
it into the nest with that many, and its friend peeps out. Older children
then sort by where the dots sit: the nest up in the tree (ن ق) or down on the
ground (ب ي). ج, whose dot sits inside its bowl, never plays "where". Honest
letter-form evidence. Friend stop for the wave letters (س ش ص ض: none,
three, none, one).

## v44 — Friend Jigsaw (2026-10-08)
A friend on a little sky-and-grass picture, cut into two halves (Little
Sprout) or four quarters. A glowing gap asks for its piece. Older children
also see one piece cut from a different friend in the same spot, so the
friend's look has to be known. When it's whole, the friend says its name and
then its letter. Friend stop for the tall letters.

## v45 — Bath Time (2026-10-08)
A muddy friend in the tub. Rub with a finger (or tap the sponge) and the mud
comes off in bubbles. A third of the way clean: "who is in the bath?" — three
letters to choose from, a brave early guess from part of the letter. A guess
from an almost-clean friend counts as helped. The replay button plays the
friend's own call as a clue. Little Sprout just scrubs and hears. Friend stop
for the round letters.

## v46 — Letter Fishing (2026-10-08)
Fish swim slowly by, each carrying a letter. Hear a letter, catch its fish:
the line drops, it's reeled up into the bucket. A wrong fish wriggles free and
says its own name. Fish turn to face the way they swim; under reduced motion
they hold still. Honest listening evidence. Friend stop for the strong
letters, and a regular on Today's Walk.

## v47 — Colour a Friend (2026-10-08)
A colouring page of a friend: every painted part turns to paper, the ink
stays. Eight big crayons (two rows on small phones). Colouring the letter body
makes the friend wiggle and say its name, then its letter. "Hang it in the
garden" saves the page as a garden sign, like Letter Studio pictures. Nothing
is judged.

## v48 — The Toy Box in the world (2026-10-08)
- Chapter stops: the letter chapters each end with a different toy — Find my
  Friend (boat), Dots Last (smile), Friend Pairs (little), Dot Nests (wave),
  Friend Jigsaw (tall), Letter Fishing (strong), Bath Time (round). Letter
  Shadows stays with the first joining chapter.
- Today's Walk can pick Pairs, Jigsaw and Bath for its friend stop, and
  Fishing or Dot Nests for its letter stop.
- Practice garden: Fishing and Bath with the play toys, Pairs, Nests and
  Jigsaw with the thinking games, Colour a Friend with the writing toys.
- Landscape phones and 320px phones checked for every new game.

## v49 — Friend Moves (2026-10-08)
Every friend answers a tap with its own move instead of the shared wiggle:
the rabbit and sheep hop, the frog and gazelle leap, the duck and crocodile
bob, the fish swims, the bee buzzes, the camel, corn, pomegranate and rose
sway, the horse gallops, the bear and elephant stomp, the fox and cat pounce,
the giraffe stretches, the sun shines, the shell, envelope and book open, the
peacock fans, the grapes jiggle, the lemon squeezes, the key turns, the
hoopoe and dove flutter. The letter body still glows gold as it moves. Letters
stay upright and unmirrored; nothing moves under reduced motion.

## v50 — Smart Choices (2026-10-08)
The Garden Brain now picks the wrong answers. While a letter is new (and
always for Little Sprout) the other choices look nothing like it — a different
body and different dots — so the first wins come easily. Once the letter is
known (skill ≥ 0.6) the choices are its look-alikes: the same body with other
dots (ب beside ت and ث), then the same dots in the same place. In between,
any letter. Big Brain Academy's "harder after right answers" with no visible
level, timer or score. Used by Find My Friend, Peek Flaps, Hoopoe's Trip,
Friend Shapes, Fill the Gap, Lantern Hunt, Letter Fishing, Bath Time, Friend
Jigsaw, Spot the Change and Family Buses.

## v51 — Spot the Change (2026-10-08)
Letters on garden stones. Look… the lights blink… one has changed. Which one?
For older children the change is usually just a dot (ح became ج), so the eye
learns to check the dots; Little Sprout sees a swap for a very different
letter, on three stones. The replay button becomes an eye — "look again"
shows the stones as they were, and counts as help. Noticing a change leans on
memory, so it is recorded but never moves a letter's strength.

## v52 — Family Buses (2026-10-08)
Letters that share a body are one family (ب ت ث, ج ح خ, د ذ, ر ز, س ش, ص ض,
ط ظ, ع غ). Each bus is driven by a family member; a passenger boards the bus
whose driver has the same shape — same body, different dots, the idea behind
the curriculum's letter packs. Honest letter-form evidence.
Chapter stops can now rotate: the first joining chapter meets Family Buses
the first time and takes turns with Letter Shadows on replays; the second
joining chapter does the same with Spot the Change and Same Letter, so no
older stop drops off the journey.

## v53 — Big screens (2026-10-08)
The newer games were sized for phones and sat small in the middle of a tablet
or desktop. Each round is now measured after it renders and zoomed up — never
down, at most 1.4× — as far as the stage allows, with a check that nothing
overflows either way. Tablets in both orientations: every game fits, most at
1.25–1.4×. Phones (narrower than 700px or shorter than 560px) are untouched.
On wide screens the family buses park side by side.

## v54 — Keyboard and switch access (2026-10-08)
- Tracing (Sand Table, Garden Paths, the meet screen) can be done a stroke at
  a time with Enter or Space; strokes written that way count as helped, never
  as unaided handwriting.
- Every part of a colouring page can be reached with Tab and coloured with
  Enter.
- When a round re-renders, a keyboard or switch user's focus moves to the new
  round's first choice instead of falling back to the page.

## v55 — Tactile (2026-10-08)
A press should feel like pressing something, even on a tablet with no
vibration. One delegated layer gives every button, card, stone, fish and bus
four channels together:
- **Hold and release.** The thing sinks while the finger is down and its
  raised lip squashes flat; on release it springs back past level and
  settles, like a rubber key. Sliding off lets it rise without pressing it.
  Built from the separate translate/scale properties, so no game's own
  transform or position is disturbed; nothing that is already moving (a
  swimming fish, a driving bus) gets the spring; drawing surfaces (sand,
  tracing, the bath) and parts of a drawing never sink.
- **The sound of pressing.** A soft rubbery thock when a finger lands and a
  light pop when it lifts, replacing the old thin beep. Big things sound
  deeper, small things brighter, with a little wobble so fast tapping never
  sounds mechanical.
- **A ripple at the fingertip.** Every press blooms a small ring where the
  finger landed; taps on empty ground get a fainter, silent one, so the world
  answers every touch.
- **Real ticks on iPhone and iPad.** Safari has no Vibration API, but since
  iOS 18 toggling a native switch control plays the system's own haptic tick.
  A hidden switch is toggled on presses, pops, right answers (a double tick),
  soft misses, and — rate-limited — the grain of sand and mud. Android keeps
  its real buzz.
Reduced motion: no sinking, spring or ripple — a pressed thing darkens
instead; sounds and ticks stay.

## v56 — Feel (2026-10-08)
For devices with no haptics (every iPad): touch felt through the eyes and
ears, built on how fighting games, cartoons, film sound and pseudo-haptics
research make people feel contact (docs/letter-garden/reviews/
feel-without-haptics.md).
- **Right answers hit.** The tile holds its squash for ~70ms (hit-stop), one
  small flash, then pops past full size and settles; cartoon impact lines
  burst from the fingertip; neighbouring tiles lean away and back; the play
  area jolts 3px. Every "correct" anywhere in the game, world mode included.
- **Misses thud.** A dull squash with no bounce, a little grey, and a damped
  "no" shake — information, never scolding.
- **Materials.** Friends are soft: they squash wide when pressed and stretch
  back like rubber. Buttons, stones and cards press firm.
- **Friction.** In Bath Time a sponge is in the child's hand: it trails the
  finger and tilts as it is dragged, and flecks of mud fly off.
Kept child-safe: one small flash, never a train or full screen (WCAG 2.3.1),
no big shakes; none of it under reduced motion.

## v57 — Encouragement pass (2026-10-09)
Goal: nothing should ever feel discouraging enough for a child to step away.
Every moment of missing, waiting or being stuck was audited.
- **A miss sounds curious.** The low "wrong" buzz became a soft "hm?" — two
  gentle notes, the second lifting at its end. The miss animation is a small
  shrug and sway; the grey wash is gone (grey reads as sad). The pet already
  ponders rather than frowns.
- **Stuck never lasts.** A second miss in a row brings a soft cartoon hand
  that points at the answer the game is hinting and taps the air above it.
  Games that had no hint now have one: Lantern Hunt lights a letter after two
  misses, Bath Time's right letter glows, Jigsaw's fitting piece glows, and
  Friend Pairs lets every card peek again after three mismatches. Idle help
  is for every child now, not only gentle mode (gentle: 8s, twice; else 14s,
  once).
- **No empty stars, ever.** The star screen, the chapter party and the map
  show only the stars a child earned — never grey empty slots beside them.
  One star is drawn bigger with twinkles, so a hard round ends proud. Three
  soft outlines remain only on chapters not yet played, as an invitation.
- **"Not yet" is "soon".** The sticker stand is never a dead button: five
  star pips fill toward a visit, and a tap with too few stars makes it hop
  and twinkle instead of shaking with a "wrong" sound. Wardrobe items do the
  same. No "wrong" sound is played for anything that isn't an answer.
- **Finishing is a moment.** A finished practice game plants a flower — the
  stage frosts, three flowers bloom, the pet cheers — before returning.
- **Persistence is the proudest moment.** Getting it right after a miss
  brings a bigger, golder 12-ray burst and an extra chime.
- **Friends greet on replays.** A replayed chapter skipped its reveal step,
  so the friend never arrived on the meet screen; it does now.
- **Tidier map header.** The daily strip's 56px buttons (UI pass) sat over
  the play buttons on phones; they clear it now.
- **Sooner help for the youngest.** In Little Sprout the helping hand comes
  after the first miss, and idle help after 8s (twice), as in gentle mode.
- **The hand follows a moving answer** (a swimming fish) instead of pointing
  at where it was.
- Checked: the optional timed Burst never ends in failure (time running out
  still earns at least a star); the chapter party shows only earned stars.
- **Waiting never feels broken.** After a right answer the other choices
  softly step back (dimmed, a little smaller) until the next round arrives,
  so taps during the pause don't seem ignored. One-answer games only.
- **Fewer choices for the youngest.** The practice garden had grown to ~26
  tiles; a little sprout (2–3) now sees nine simple, physical toys —
  balloons, feeding, the bath, fishing, pairs, colouring, sand, books and
  delivery — instead of a wall of options.
- Checked the older chapter games: wrong options fade away (errorless), a
  fruit that falls past costs nothing and comes back, and the harvest's
  difficulty eases invisibly after misses — no shrinking meters anywhere.
- **Reduced motion gets its moment too.** With motion reduced, a right
  answer glows with a still golden ring (no movement, no flash) instead of
  getting nothing from the feel layer.
- **Full checks (2026-10-09).** Whole-app sweep: 193 steps (every chapter's
  meet, games, stars and party, plus every other screen), none failing.
  Full play-through: all 66 chapter games played to the end, none failing.
  The play-through script now recognises a chapter handing over to its
  friend stop (it had been misreading those 22 hand-offs as errors).
- **Never redo finished games.** A chapter left half-way (a stray tap on
  Home, bedtime) picks up at the next game for six hours, with its stars
  kept; finishing the chapter clears it. (Little Sprout already needs a
  short hold on Home inside a game.)
- **Shown how to start.** When a child sits still (14s; 8s for gentle and
  Little Sprout), the question repeats and the helping hand points at where
  to touch — the game's hint if it has one, otherwise the first thing that
  can be pressed (in Bath Time, the sponge) — never giving away an answer.
- **Greeted every day.** The first visit of the day, the pet waves and calls
  hello on the map — coming back should feel like being missed.
- **The hand in the older chapter games too.** They mark no hint (wrong
  options fade instead), so after repeated misses the hand points at the
  question bubble: hear it again.
- **Mismatches are play.** In Friend Pairs two cards that don't match just
  turn back with a page-flip — no "hm?", no thud; that is how memory is
  played. Jigsaw's wrong piece makes one gentle sound instead of two.
- **A hard patch eases up.** Six misses within three minutes quietly turns
  on Little Sprout settings for the next games (fewer, simpler choices; the
  helping hand after one miss) until five right answers in a row bring the
  normal game back. Nothing is shown — it just gets kinder.
- **Eager taps are answered.** In Dots Last a guess before the dots have
  arrived isn't "wrong" any more: the next dot comes straight away, so
  impatience earns more to look at. In Spot the Change, tapping during the
  "look" time makes the eye bounce with a soft glow — keep looking.
- **Playtest mode, for the real test.** Add `?playtest` to the address and
  the game quietly logs, on that device only, the moments that signal
  frustration — misses, comebacks, helping hands, idle help, games left
  early, hard-patch easing. `?playtest=report` shows a per-game table,
  hardest first; `?playtest=clear` empties it. Off unless asked for; nothing
  leaves the device. A 15-minute observation guide is in
  docs/letter-garden/reviews/playtest-guide.md.
- **Reduced motion sees the flowers too.** Finishing a practice game with
  motion reduced now shows the three flowers, standing still, for a moment
  before returning (it used to just pause).
- **A gift, not a wall of grey.** The first time a child opens an empty
  sticker album, the stand offers one free visit, so the album starts with a
  sticker they chose instead of 24 grey shapes and a stand they can't use.
- **A curious pet, never a sad one.** After a miss the pet tilts its head
  and looks up to think as before, but its ears now perk up instead of
  drooping — drooping ears read as sadness in cartoon body language.
- **No grey in the older pop game either.** A refused bubble used to turn
  its face grey before fading; it now just fades in its own colours.
- **Friends at the party.** The chapter's letter friends hop into the party
  one by one, each doing its own move and calling hello; tapping one makes
  it dance again and say its name. Finishing a chapter feels like being
  cheered on by friends. (One row on phones; still under reduced motion.)
- **Always clear where to go.** The next chapter's glow on the map breathes
  gently, and a child who sits on the map for 10s without touching anything
  is shown the way: the helping hand points at the next chapter (only when
  it is on screen).
- **New toys invite.** In the practice garden, up to three toys a child has
  never tried twinkle in their corner; once one is played, the next untried
  toy starts to twinkle. (Hubs like the Book Corner don't twinkle.)
- **See when to listen.** While the game is speaking, the speaker button
  gently pulses (a still gold ring under reduced motion), so a child can see
  it's time to listen rather than tap.
- **Shown how to hatch.** On the very first screen, if the egg hasn't been
  touched after 6s, the helping hand points at it — nobody gets stuck before
  the garden even begins. After hatching, the same hand points at the big
  tick that opens the garden if nothing is touched for 8s.
- **The way forward, between games.** On the stars screen, the party and
  meeting a new letter, 10s untouched brings the helping hand to the main
  button forward (or to the bud / pieces to tap on the meet screen).
- **A nudge in the toy menus.** In the practice garden, Book Corner and
  Puzzle Tree, 12s untouched brings the helping hand to a toy — an untried,
  twinkling one first — so a child facing many choices is shown where to
  begin.

## v58 — No dead taps (2026-10-09)
The goal stays the same: nothing should ever feel discouraging. This pass walked the app
as a brand-new child and as a stuck one, looking for any tap that gets no answer.
- Locked chapters used to be `disabled`, so a tap did nothing at all. Now the pet
  looks and wonders, the map scrolls to the open stop, and the hand points at it.
- The practice garden (closed until the boat chapter) is a "soon" button: it hops,
  and the hand shows the stop that opens it. It's faded less (.62, not .45).
- Empty decorating plots answer a tap: a decoration hops, or, with nothing grown
  yet, the "play a lesson" card does.
- Missed drops glide home (practice dot patterns, seeds) or float back to the
  shelf (garden decorations) instead of jumping or vanishing. Reduced motion: no glide.
- A muted game: when a still child is helped, the hand points at the speaker first.
- Nothing counts zero at a child: no "★ 0" on the map, album or wardrobe, and no "0"
  on the friends' house.
- First looks: the free welcome visit to the sticker stand is pointed at after 3.5s.
  An empty star chart is a sky of faint, twinkling sleeping stars (tap one: it
  twinkles), not a blank. The wardrobe opens on the free colours when nothing on
  the outfit shelf is affordable yet.
- Idle hands come back once more if the first goes unnoticed, and appear after 5s
  (not 10s) for a child who hasn't finished anything yet.
- Phones: the map has 110px more headroom, so the pet waiting at the last stop
  is no longer hidden behind the header rows.
- **Bug: WordGap could not be won for 9 of its 24 words.** The game rebuilds the word
  from NFC-normalized letter clusters, and NFC reorders shadda + vowel (and composes
  آ), so the right piece never equalled the stored word — even after the hint ring
  pointed at it. Answers are now compared in one Unicode form. Found by a
  random-tapper "struggling child" audit of all 35 practice games (`lgAuto`):
  WordGap went 0 right / 132 wrong; now it finishes in ~17 taps.
- iPad (the main device for this age): checked the map at eight iPad sizes and all 35
  practice games at 1024×768, 768×1024 and 1180×820.
  - 1024 landscape: the walk/practice/house buttons ran 63px under the daily tray,
    hiding the star counter. They now sit beside the sound button (1000–1279px).
  - Games taller than the stage may now shrink (to 0.72×; before, only 1×–1.4×).
    A shrunk game is measured at its natural layout, so its zoom doesn't flip
    between 1× and less as the rows re-wrap. BusyMarket now fits at 0.92×.
  - Sound Lab: on wide, short screens the trays spread wider and the press shrinks,
    so all 28 letter tiles are in reach (two of four rows were cut off).
  - Letter Studio: the 4:3 canvas is capped by the height left over, so the inks
    and stamps are no longer pushed off the bottom (this also fixes landscape phones).
  - Toy menus: on wide, short screens the groups sit two by two, so a little
    sprout's nine toys all fit on one iPad landscape screen (before: two groups
    were below the fold).
  - Result: no button below the fold in any of the 35 games at the three sizes.
- Lantern Hunt: help used to come only after wrong picks; a child sweeping empty
  darkness got none. After six empty sweeps the lantern now drifts to a letter being
  looked for (that find counts as helped).
- Every guessing game now ends in a hint. An audit of all 35 practice games found
  two with none: Busy Market (wrong taps only wobbled; now a thing still to find
  glows after three misses on a lens) and Letter Hunt (a miss only showed the
  letter; now its spot in the picture glows after two). The helping hand points
  at either glow. The original chapter games were audited too: Pairs (a wrong partner
  only shook) now glows the partner after two tries, and Burst glows the right leaf
  after two misses. The rest already helped (Catch/Parade narrow the choices, Pop and
  Feed scaffold, Blend/Chain retire the decoy, Unfuse opens itself, Trace can't fail).
- Letter Delivery: tapping the destination before choosing a packet did nothing; the
  packets now hop, one after another ("pick one of us first").
- New QA measure: `lgAuto` reports `maxDry`, the longest run of taps without a success,
  as a stand-in for frustration. Run twice over all 28 scored practice games: every game
  finished. The long runs come from taps that give feedback but aren't scored answers
  (Busy Market finds, Letter Train balloon pops, lantern moves), not from repeated misses.
- On a roll: every third right answer in a row opens the burst as a ring of petals.
  Nothing counts the run on screen, so a miss that resets it is never seen (the
  no-visible-streak rule holds).
- The skill flower (pet room, parties) drew each petal at the *latest* check-up, so a
  weaker retry shrank a petal in front of the child. Petals now show the best; the
  latest is still stored for grown-ups.
- What a child grew stays grown. One miss resets a letter's streak in the quiet
  strength model, which could dim a bright star on the star chart or shrink a map
  plant from flower back to bud. Both now show a high-water mark
  (`quran-trainer:letters:grown`, per child); the strength model underneath is unchanged.
  The same applies to pet tricks: they were recomputed live, so a few misses could make
  the pet "forget" one. Learned tricks, the gold constellation lines and the pet's
  glow (radiance) now stay.
- Tracing patience (Trace, Sand Table, meet screens): a stroke never became easier for
  a small hand that kept missing its start or wandering off. Each struggle (a snap-back,
  or a press that got nowhere) now widens the path by 35% (up to 3 times) and lets
  the stroke be caught a little further in. After five, the stroke draws itself,
  counted as helped, so no letter is ever a wall. The coverage trace (joined words)
  gets the same patience: every three unfinished tries lower the bar (55% → 45% → 35%
  covered; each letter cluster 45% → 35% → 25%).
- Water Garden: its scene was a hard-cut green block with no frame and read as unfinished;
  it now has the same rounded ink frame as the other play panels (an overlay, so the
  gates stay aligned).
- Hat Shop on phones: three 96px-minimum hats stacked into a tall column and pushed the
  progress dots 60px off-screen; narrower on small screens, they now fit (two and one).
- **Bug: Sound Lab on phones.** The page never scrolls, and on a 302×653 phone the letter
  tray sat 486px below the screen, so most of the 28 letters could not be reached at all.
  On phones the letter and vowel-mark trays are now single swipeable rows (edge fade,
  snap) and the press is smaller, so everything fits. Found by running the
  below-the-fold check at phone size, not only iPad.
  - Landscape phones (844×390): the same rows; their stage already scrolls, so the few
    buttons below the fold (Delivery, Spot the Change, Studio) are reachable.
- **Bug: Friends' Garden on phones.** 28 friends in two tall columns ran ~900px below the
  screen, and nothing scrolled, so 20 of them could never be seen or tapped. The plot bed
  now scrolls inside the screen (the next row peeks at the bottom), and phones fit three
  friends to a row. A whole-app phone check (every chapter game, the meet, stars and party
  screens, and 14 other screens) now finds nothing out of reach.
- Book shelf on phones: four tall books in one column left the fourth out of reach; now
  two to a row (all four on one screen), with the shelf scrolling as a fallback.
- iPhone SE (320×568), checked across every game and screen: Sound Lab (smaller press and
  bench), Colour a Friend (the page shrinks with the height) and Letter Studio now fit.
  Studio had a real layout bug: its grid column took the SVG's default 300px width, so the
  canvas ignored the width cap (936px wide on an iPad, beyond its 620px box). Its column
  can now shrink.
- Landscape phones (844×390): four games were taller than the stage and needed a scroll a
  child may never try. They now use the width: Spot the Change in one row of stones,
  Delivery with a shorter scene, Studio with the canvas beside its inks and stamps, Sound
  Lab with the bench and press beside the trays. All fit without scrolling.
- Landscape phones, the other screens: decorating the garden had its shelf and finish
  button below the screen behind a scroll; the garden now sits left with the shelf and
  tools right. The four books share one row. The rest that scroll (letter book, word shelf,
  toy menus) are long lists by design, with half-shown items at the edge as the cue.
- Arabic text: no clipped glyphs (tall marks cut off) in any of 29 practice games.
- Reduce motion: the new glides and the "soon" hop also respect the app's own
  reduce-motion switch, not only the device setting.
- Little Sprout (age 2–3): every chapter game is 3 rounds, not 4, so a
  toddler finishes on a win before tiring (never longer than the plan; Pairs
  keeps its 2 boards). lgPlay on 3 sprout chapters: 9/9 finished, no errors.
- First screens on a phone (fresh-profile walk-through at 302×653): the wind
  story card was a 3:2 strip in the top third with half the screen empty; on
  portrait phones it is now 4:5, centred, with bigger friends and pet. The
  home map's three place buttons (303px in a 278px row) hung off the left
  edge on ≈300px phones; they tighten to fit below 340px.
- The proud pet smiles visibly: "proud" (reward screens, Read Together's end,
  the decorating pet, in-game proud reactions) had a 3-unit ink-line mouth and
  flat brows; at phone size the mouth vanished and the pet looked blank on
  the reward screen. It is now a filled closed-lip beam with softly lifted
  brows — happy at a glance, still calmer than the open "delighted" grin.
  Chapter games walked at 302×653 (pop, trace, feed, 1-star reward): no layout issues.
- The pet never side-eyes a choice: "thinking" (shown when a child picks up a
  card or starts a stroke) was a half-lidded eye with pursed lips — doubt, at
  the moment of commitment. It now looks up with interest and a small smile.
  "listening", the face seen most of a game, swaps its anxious "o" for a
  small open smile.
- A miss gets a friendly "hmm?": the curious face (what a wrong answer shows)
  swaps its round "oh" — which read as "oh no!" at the 64px game size — for a
  small lopsided smile under the lifted brow. No pet face now has an open
  shocked or doubtful mouth.
- One star never sits beside empty space: on a sideways phone (844×390) the
  boat chapters' reward pill stretched to its grid column and a 1-star round
  showed the star at one end of an empty pill — the "missing stars" look v57
  removed. The pill now hugs and centres its stars (checked 1 and 3 stars at
  844×390 and 1024×768, boat and join chapters). Other pet species (owl,
  rabbit, bear) checked in all moods at 64px: friendly, no change needed.
- The chapter party celebrates the best moment: it used to show the chapter's
  average, so a child who stumbled early and then nailed the last game (1,1,3)
  finished the whole chapter to a 1–2 star party. It now shows the best game
  of the run; the map plaque keeps the honest average to grow into (verified:
  1,1,3 → party 3 stars, map 2). Party screen at 844×390 fits.
- Little Sprout's practice Feed is 3 rounds too (was fixed at 4), matching the
  chapter games; autoplayed: done, no errors. Practice toys end in the finish
  bloom, never a grade (checked).
- The wind story on every screen: the upright-phone fix now covers upright
  iPads too (card 640×800, friends 172px, were 60px in a top-half strip); a
  sideways iPad centres and grows the card (852×568, friends 111px); friends
  and pet are sized from the card (container units). Sideways phones had a
  pre-existing bug — the card was 100vh−30px tall under a 76px top bar, so
  the friends stood below the screen; it now ends at 370 of 390px with every
  friend visible.
- Cut-off content audit: every game of all chapters + 12 rooms at 844×390 and
  320×568, flagging pictures/buttons/cards past the screen edge unless inside
  a real inner scroll list (the screen's own scroll doesn't count — a small
  child won't scroll a game). The scanner was proven on the old wind-story
  rule (caught: screen overflow 74px, friends cut). Result: clean; the one
  hit (decorating, 17px) was falling leaves on a non-scrolling screen.
- Cut-off audit extended to both iPad sizes (clean) and all 40 practice toys
  at 844×390 and 320×568. One fix: on a 320px phone three answer tiles (Fill
  the Gap and other tile games) needed 302px of a 296px row, so the third
  wrapped to the bottom edge and pushed the round dots off screen; tiles trim
  slightly below 360px and share one row. (Letter Balloons rise through the
  screen by design; Workshop's launcher error is a rig artifact — a fresh
  child has no Workshop tile.)
- A silent device never freezes a read-aloud game. A "struggling child"
  autoplay over 37 practice toys showed help always arrives within 2 misses
  in a row — and exposed HoopoeTrip never finishing: its growing refrain
  awaited each spoken name, and with no voice (no TTS voice, blocked audio,
  offline with no clip) every name waited the full 6.5s speech timeout, so a
  3-friend refrain froze taps for ~20s. sayForLearning now gives up on
  speech that never STARTS after 4.5s for a recited Quran word (after the
  clip's 2.5s hand-over to the voice) and 2s for anything else (letter names
  start at once from the clip bank or device voice); started speech keeps
  its 6.5s. Hidden listening prompts on a silent device reveal in 2s. HoopoeTrip's refrain also caps each
  name at 2s. On the silent rig: HoopoeTrip done in 13.6s (was stuck at the
  tap limit), Letter Train 7.3s, Echo Parade 15.1s, Friend Book done;
  lgPlay on 3 chapters 9/9, no errors.
- Enlarged games are centred again on iPads: fitStage zooms a game up to 1.4×
  and set the root's width to 100/zoom % so it fills after zooming — but
  Chromium's standardized zoom doesn't scale a % width, so the root was 71%
  wide and pinned left: 18 practice toys sat 40–109px off centre at
  1024×768. fitStage now measures the zoomed root against the stage and
  falls back to 100% when it didn't fill (correct for either engine). All
  toys centred (offset 0), no overflow, at 1024×768, 768×1024, 1180×820.
- A little sprout gets confetti again: gentle mode turns confetti off, and
  Little Sprout turns gentle on implicitly, so a toddler's reward and party
  screens never had confetti. It now shows for sprout-only; a grown-up's own
  gentle choice (and reduced motion) still keep it off. Verified: sprout 1,
  sprout+chosen gentle 0, gentle 0, neither 1. (Owner may prefer the old
  behaviour — one line to revert.) Drag targets audited: all generous
  (16–32px slop or ~a piece-width), Chain/Unfuse also accept taps.
- Reduce motion: 25 practice toys autoplayed with the app's reduce-motion
  switch on — all finish, no errors (two random-tap runs that ran out of taps,
  FriendPairs and DotGarden, finished on re-run in both motion modes; random
  luck, not motion).
- Dot Garden has no dead ends: its exploring phase only moved on via one
  unmarked button, so a child could loop through the patterns forever — once
  every pattern has been tried, the way on now glows gold (and the idle hand
  points at it). In the repair phase a wrong Check glowed the right zone but
  never more; after three wrong Checks the right dots are placed for the
  child and Check glows for one happy tap. (The glow needed !important to
  beat letters-potting.css's own !important shadow; reduce motion keeps it
  still.) Verified live: glow after all patterns; 3 wrong → dots placed →
  one tap advances.
- Two-finger / palm presses: simultaneous touches on two pieces in fuse,
  chain, unfuse and practice Feed leave nothing stuck held, pieces return
  home, and the game plays on (Feed autoplayed to done afterwards). Sticker
  stand without enough stars hops with filling star pips (never opens to a
  dead tap).
- The map's idle hand comes back: it pointed at the next chapter once, after
  10s, then never again (the in-game hand returns once). It now shows after
  5s for a brand-new child and returns once 15s later if still untouched
  (measured: on 10.9s, again 26.9s). Finishing a chapter on a phone lands on
  the map with the next stop on screen.
- No dead pad after a win: Pop already let a second tap on the found bubble
  carry on; Trace and Feed didn't — a toddler who kept drawing on the
  finished letter, or tapped the fed friend again, got nothing. Both now
  carry on to the next round (after a 0.7s grace so the winning touch
  itself never skips the celebration). Verified: early tap ignored, later
  tap advances; tapping the friend before delivering does nothing; lgPlay on
  2 chapters 6/6, no errors.
- Today's Walk: checked on a phone with 3 chapters done — Little Sprout gets 3
  stones, others 5; 78px stones, all on screen, trail ends at the nap spot.
  It was the one screen without the idle hand; a still child is now pointed
  at the next (already pulsing) stone after 10s (measured 11.0s).
- Decorating gets the idle hand too: a still child is pointed at a decoration
  to pick up, or (nothing grown yet) at the card that leads to a lesson
  (measured: 6.0s for a new child, on the lesson card). Browse-only rooms
  (album, wardrobe, star chart) keep no hand — nothing there is required.
- The wardrobe without a pet goes to hatching: renderPet read
  this.pet.accessories before checking a pet exists (the v58 canShop line),
  so a fresh/cleared profile crashed there; it now sends the child to hatch.
- Release checks after the late-v58 polish: lgSweep 193 steps / 0 failing;
  lgPlay 66/66 chapter games finished, no errors; 561 tests pass.
- The Friends' Garden grows instead of gaping: a new child's bed was 28 dark
  holes ("you have nothing"); each empty plot is now a little earth mound
  with a two-leaf sprout — a friend on the way. Palette-only, same tap
  bounce and rustle. Visual review on a phone, no change needed: album (soft
  outlines invite), star chart (sleeping stars twinkle when tapped),
  wardrobe (opens on free colours at 0 stars).
- Book Corner shelf: all four books open, big covers, no locks; it now sits
  in the middle of the screen instead of the top 60% over empty hills
  (phone 179–532 of 653; sideways one row, fully on screen).
- Puzzle Tree reviewed on a phone (unlocked with 3 chapters): 8 big cards,
  two to a row, last row peeks to show it scrolls. Untried puzzles now
  twinkle like the practice garden's toys (at most three; the idle hand
  prefers them) — verified: tried Echo Parade plain, next three twinkle.
- Book Corner: untried books twinkle too (at most three); a read Living Book
  (logged as 'LivingBook') counts for the 'LivingBooks' card. Verified with
  none tried and with three tried.
- iPad visual review via .qa/landscape.html (1024×768): wind story, pop,
  1-star reward, chapter party (best-game 3 stars, delighted pet), Friends'
  Garden sprouts — all read well. One fix: a child's first decoration sat
  pinned to the left end of a long empty tray; a few decorations now sit
  centred (auto margins, so a full tray still scrolls from its start —
  verified 12px padding at both ends when full).
- Practice garden group chips (heart, book…) were cropped: they sit 14px
  above their group, but the hub's scroll box had 4px of top padding. Now
  20px — whole chips on iPad (1024×768) and phone (375×812).
- Bath Time's mud: on an iPad it read as two striped brown walls in the tub —
  a square grid of blobs whose every-fifth dark blob lined up into a seam.
  It is now a rounded, randomly speckled mud cloud. Still hides every friend:
  all 28 letters fully covered across 4 random layouts (outline sampling).
  Scrubbing autoplayed to done. Find my friend on iPad: big, centred, clear.
- Toy box on iPad, no change needed: Friend Pairs, Dot Nests, Friend Jigsaw,
  Letter Fishing, Colour a Friend (crayons 59×92px; finishing needs any 3
  parts, so the tiny 12px eyes are optional).
- Peekaboo flaps: the third door was always dark green (#4e9677), the same
  colour as its leaf marks, so it looked blank — an odd one out that, about
  one round in four, was the answer (a child could pick it by sight). Doors
  now alternate two light greens, every door shows its leaves. Four doors
  also sit two-and-two instead of three-and-one.
- Book Corner on iPad, no change needed: Sort the pictures, Friend shapes,
  Hoopoe's trip, Busy market. Searched every game for choices styled by
  position (the Peekaboo bug class): the rest give each choice its own colour
  (buses, fish, balloons), so none stands out alone.
- Short practice games are centred on the stage: Spot the change sat in the
  top half of an iPad with the bottom empty. The toy-box/book/puzzle/look/
  workshop roots now centre with auto margins (a tall game still starts at
  the top, never cropped). Re-scanned all practice toys at 1024×768,
  768×1024, 844×390, 320×568: centring and cut-offs unchanged (the few
  small overflows were measured identical without the rule). Puzzle Tree
  and look games reviewed on iPad: Echo Parade, Dots Last, Lantern Hunt,
  Letter Shadows, Build the Letter, Same Letter, Letter Train, Spot the
  change — all clear.
- Family buses and the Hat shop on iPad: clear and centred. The Hat shop's
  tile only appears once a vowel mark is taught, and with one mark and one
  known letter it always has rounds — its tile can never lead to an instant
  empty finish.
- Water Garden's flowers were coral, yellow, pink — coral and pink read as
  one colour, so the yellow middle flower looked like the odd one out. Now
  coral, yellow and lavender (palette). Reading games on iPad, no change:
  Listen and find, Fill the gap, Twin crown (the crown marks the shaddah
  card by design), and Dot Garden.
- Letter Hunt on a landscape screen: letters were 14–27px wide — small to
  recognise at 3 (tap targets were already whole objects, 64–121px). They
  grow 15% where the hiding place has room (cloud, kite, rock, pot, flag,
  lantern…); the tree hollow and shell plate keep their size. Checked in a
  screenshot that every letter still sits inside its object.
- iPad tour of the practice toys complete (1024×768 via .qa/landscape.html):
  Sound Lab (56×62px keys, 23 letters offered, none hidden), Sand Table,
  Letter Studio, a Living Book page, the Letter Friends book — all clear.
- Chapter games on iPad, no change needed: catch, build, blend, chain,
  parade, fuse, unfuse, pairs (pop, trace, feed seen earlier).
- Release checks after the iPad visual pass: lgSweep 193 steps / 0 failing;
  lgPlay 66/66 chapter games finished, no errors; 573 tests pass.
- The hatching egg is bigger on large screens: it was a fixed 190px — most of
  a phone's width but small in an iPad's scene. The hatch hero zooms 1.3×
  from 700×620 up (egg 232×235 at 1024×768); after hatching, the pet,
  colour swatches and enter button still fit (enter ends at 698 of 768).
- Meet screen and album on iPad, no change: the bud to wake is 139×148px;
  the album page and its stand read clearly (the idle hand points at the
  stand when a free visit waits).
- The star chart's frame hugs its sky: the 2:3 sky was drawn inside a
  squarer box, so on an iPad the frame stood wide of the sky with the hills
  showing through both sides. The box keeps the 2:3 shape (and won't flex-
  shrink); tall screens size it to fit, short ones keep it full width and
  scroll so the stars stay tappable (a first try that fit every height
  shrank it to 125×187 on a sideways phone — caught and reverted). Verified:
  2:3 at 768×1024 (488×733), 1024×768 (362×543), 302×653 (253×380),
  844×390 (520×780, scrolls). Wardrobe on iPad: no change.
- Home map on an upright iPad (768×1024): clear; the current stop sits free
  of the header strip (other stops scroll beneath it, as a map should).
- Bismillah graduation on iPad: checked with a real graduate's 28 friends —
  they crowded the top edge at 46px, over the moon, with the bottom of the
  screen empty. On big screens they now gather below the Bismillah and the
  pet at 60px (three centred rows), the keepsake and done buttons last; all
  fits (buttons end at 664 of 768). Phones unchanged.
- Friends' Garden full (all 28 home) on iPad: four rows of seven, fits, no
  scroll. No change.
- A full star chart's stars touched: checked with every letter lit, the
  ~52-unit star discs sat 54–57 apart in places (م ن, و ي, ل م, ا ب), so
  outlines overlapped and letters were partly hidden. Every ring now spans
  1.2π (centred as before) and a family over four letters gets more room —
  chosen by searching layouts for the largest closest-pair distance inside
  the chart. Rendered: closest pair 68, every star inside. (A first fix
  modelled the star too small — 48 needed — and left the overlap; caught by
  measuring the rendered chart.)
- The wardrobe wears one thing per place: it kept up to three items with no
  regard to where they go, so a cap, taqiyah and crown stacked, sunk into
  each other — broken-looking art. Putting on an item now swaps out whatever
  is in the same slot (headwear, head-side, eyes, neck…), using the slots the
  accessory catalog already defines. Verified: cap → crown → taqiyah swap;
  bow → flower swap; glasses stay. A full album (all 36 stickers, gold star
  in place of the stand) checked: no change.
- Decorating garden full (4 placed, 27 in the tray) on iPad: reads well, the
  tray starts at its first item and scrolls; placed ones are ticked. No change.
- lgSweep re-run after the room fixes (star chart, wardrobe, graduation,
  hatch): 193 steps / 0 failing; 578 tests pass.
- Star chart progress reads forwards: a letter met but still growing was a
  dark purple sparkle — darker than a sleeping (unmet) star — so meeting a
  letter made its star look dimmer, with no letter on it. It is now a waking
  star: a soft cream disc with its letter. Three clear tiers: sleeping
  lavender sparkle → waking cream disc → bright golden star. Checked with
  a half-way chart (7 bright, 7 waking, 14 sleeping).
- Map with mixed results (1, 3, 2 stars) on iPad: every finished stop wears
  the same gold ring with its stars centred — a 1-star chapter never looks
  lesser. The idle hand is removed by the touch that starts a scroll, so it
  never points at the wrong stop for a child. No change.
- Wardrobe outfits with too few stars (3) on iPad: unaffordable items are
  full-colour previews of the pet wearing them with a small ★ price — no
  grey, no lock — and tapping hops them as 'soon'. The previews used the
  plain smile, which vanished at 54–62px; they now show the delighted grin
  (readable small, and it suits trying something on).
- Morning / day / sunset looks (every earlier screenshot was at night, since
  the garden follows the clock; phases forced by overriding the clock hour —
  overriding LettersArt.dayPhase alone doesn't reach the backdrop's default):
  the map is top-down and stays bright; game screens use the calm in-game
  garden, soft and neutral by design (dark only at night); buttons keep
  their ink outlines against the pale sky. No change.
- Sideways-phone map header: the practice, decorate and garden buttons sat
  at a fixed left:234px, assuming a narrower daily strip; with its five 56px
  buttons (the small-hands minimum) the strip runs to 328px, so the place
  buttons covered the pet and rewards buttons. They now sit from the right,
  clear of the sound button, and slim to 60px on 667px-wide phones.
  Verified: 844×390 strip 12–328 / places 500–732 / sound 742–832; 667×375
  strip 31–328 / places 349–541 / sound 551–635.
- After hatching on a sideways phone the way in was off screen: the pet,
  colours and 'Enter the garden' stacked 491px tall in a 390px screen, the
  button wholly below the edge (the screen scrolled, but nothing hinted at
  it) — a brand-new child could be stuck on the first screen. Short
  landscape screens now lay it out side by side (pet left; colours and the
  way in right). Verified, no scroll: 844×390 button ends 305; 667×375
  ends 309; the egg is still centred before hatching.
- Cut-off scan at the smallest sideways phone (667×375 — earlier landscape
  scans used 844×390): every room, chapter game and practice toy clean but
  one. Friend shapes stretched its letter choices into tall 317px cards and
  the third ran off the right edge — an answer a child couldn't see. They
  keep their own height now and size to the space beside the friend: 2+1
  square tiles at 667×375, one row of three at 844×390. Meet screen and
  first-chapter games at 667×375 checked visually: fine.
- Cut-off scans at three more common sizes — 932×430 (large phone sideways),
  375×667 and 360×740 (upright): every room, chapter game and practice toy
  clean.
- Cut-off scan of the in-between moments (egg, after hatching, wind story,
  meeting a letter, reward, party, graduation) — the hatch bug hid there
  because earlier scans covered only rooms, games and toys. Clean at
  302×653, 320×568, 375×667, 667×375, 844×390, 932×430, 768×1024 and
  1024×768; proven by turning the hatch fix off (scan then flags the
  colours and the way in).
- Audits (clean, no change needed): miss sound is the soft rising "hm?" on
  every path; no readable English on any kid screen (11 chapters' games + 10
  rooms; only the grown-ups page has words); every kid tap target ≥44px at
  320×568 except the deliberately small, hold-gated grown-ups button.
- Letter Balloons — the first toy a little sprout meets — carries its letter
  big: the cream disc grows from r28 to r33 and the letter from 34 to 48,
  auto-fitted to a 46×46 box on the disc so tall letters never spill
  (on iPad ب is now ~29px wide; every letter checked sits inside its disc).
  Balloons also stop covering each other's letters on phones: three 96px
  lanes plus a converging sway didn't fit a narrow sky (overlap in 60/60
  samples at 320 wide). Lanes are now centred in thirds, sway is at most 3%
  of the width, and balloons size to their lane (96px on iPad, 86 at 375,
  72 at 320); measured 0 overlaps at all three.
- Letter Fishing: fish no longer bump into each other. Rows were shorter
  than the fish (12px overlap on iPad, 17px on a sideways phone), so passing
  fish stacked up to 20% over one another about 40% of the time, inviting a
  wrong catch. The pond is now a size container and each fish is sized to
  its own row below the water line; measured 0 overlaps in 40 samples on
  iPad (fish keep full size) and at 667×375 (five fish shrink to 77×46).
- Overlap sweep (every game, 375×667): two more games had choices covering
  each other. Letter Train's balloons overlapped 12px pairwise; each is now
  centred in its own share of the sky and sized to it (70px at 375, 97px
  sideways), letter scaled inside — 0 overlap. Busy Market's goods were
  56×62, not square (inline-svg baseline gap), reaching into the next shelf
  row; now 56×56 (overlap 12% → 6%, the rest is the 56px small-hands
  minimum). Both play through with autoplay.
  Follow-up at 320 wide: the market's rows were 47px apart (goods 56px,
  20% overlap), so on portrait phones ≤480px the market is square (260×260
  at 320×568, no scroll) and the layout scan reports nothing.
- Sideways-phone sweep (overlap + size, every game at 667×375) found four:
  - Busy Market had VANISHED: the scene's height was a % of an unsized
    parent, so the 4:3 market collapsed to 0×0 — a lens, an empty bar and
    nothing to tap. The lens and bag now stand beside the market, which
    sizes from the screen height (387×290 at 667×375, shelf rows clear of the
    56px goods). Cut-off scans missed it because nothing was off screen; it
    simply had no size.
  - Garden Paths: Home covered the left 16px of the letter pill, so a tap
    meant to hear the letter left the game. The pill now starts at 88px.
  - Letter Delivery: the v58 shorter scene let a 420px garden (338px tall)
    spill out of a 132px scene — sign off the top, packets covered. The
    garden now sits beside the packets (306×246 at 667×375), packets wrap two
    to a row; 0 overlap across a full autoplay, four packets still fit.
  - Letter Studio: the child's picture was 235×177 beside a 300px tool
    column; the column is 200px (inks wrap 3+2) and the picture 335×252.
- Garden Paths colours: the reach pass made swatches 52px but two palette
  grids kept 44px columns, so neighbours overlapped 8px (phones and sideways).
  Columns are 52px now; the sideways palette column 100 → 116px.
- New QA tool `.qa/layout-scan.js` (`await lgLayoutScan()` in the app frame):
  every game checked for covering taps (clipped scroll strips excluded),
  zero-size game areas and nothing-to-tap — the class of bug that hid Busy
  Market on sideways phones.
- Instant-exit probe: every tile in the garden, Book Corner and Puzzle Tree
  opened at 0/1/2/11/12/18 finished worlds (~170 openings). One real bounce:
  Spot the Change with exactly 4 known letters (after the first world) put
  all 4 on the board, had nothing to change one into, skipped every round
  and ended at once (8/8 tries) — a tile that throws the child straight back.
  The board now leaves one known letter off (3 stones at 4 known); autoplay
  plays all 4 rounds to the end.
  The probe is kept as `lgExitProbe()` in `.qa/layout-scan.js` (re-run clean
  at 1 and 2 finished worlds after the fix).
- Muted by a stray tap: "hear it again" answered with silence, and only a
  still child (after the idle wait) was shown the speaker. Now any listen tap
  (replay, question bubble, Delivery's ear, "Hear…" buttons) while muted
  bounces the speaker and points the hand at it at once; nothing changes
  with sound on. Reduced motion skips the bounce, keeps the hand.
- Chapter games get the layout scan too: `lgChapterScan()` (same file) starts
  all 66 chapter games as lgPlay does and checks covering taps, zero-size
  areas and nothing-to-tap. Clean at 320×568, 375×667 and 667×375 — no covering taps
  in any lesson game. The scanner now ignores pop-in buttons scaled to 0 and
  layers switched off by design (catch's basket front); re-proven against
  the old Busy Market rule.
- The first moment: until ~50 scripts loaded, a first visit was an empty
  sky (the loading flower was drawn by JS, so it came last). The flower and
  bouncing seeds are now in letters.html itself and show from the first
  paint (checked with scripts stripped); the app replaces them as before.
  Its petals were currentColor = black — off-palette and gloomy — and are
  now palette pink #ffa798.
- Safety net: a game that throws while it is being built no longer leaves a
  half-made screen with nothing to tap. A chapter game carries on as if
  played (to its stars screen, never blocking the chapter); a toy goes
  quietly back to where the child came from. The error is still logged.
  Checked by forcing Letter Fishing and the chapter pop game to throw.
  Mid-game too: after an uncaught error, if the game offers no live touch
  at two looks (2.5s, then 3s later) the child is carried on / back. A game
  that still answers touch is left alone — an error during Spot the
  Change's look phase did not move the child; an emptied chapter stage did.
- Wind story: on the gust page the friends blew away and the frame was left
  empty (sky and wind lines only) until the next tap. The pet now watches
  the gust from that page on, so a child always has someone to follow.
- Colour a Friend: hanging the picture needed three coloured parts, and on a
  phone 14 of 28 friends (ب ح د ر ز س ش ض ع غ ق ل م ه) had no third part
  bigger than 20px — a nose or a dot a toddler can't hit, so the picture they
  coloured never got hung. Colouring the letter itself now shows the hang
  button (or any three parts, as before); checked on a phone: body → hang →
  bloom.
- Layout scans re-run with animations settled: a hidden Browser pane freezes
  the animation clock, so entrances (dealt cards, pop-ins) sat on their first
  frame and the scan skipped them. The scan now jumps one-off animations to
  their end before measuring. Re-run at 375×667 (practice) and 667×375
  (practice + all 66 chapter games): no covering taps, nothing missing —
  only the known false alarms.
- Small-hands check added to the layout scan: anything tappable in a game
  under 40px a side, measured at rest. At 375×667 every practice and all 66
  chapter games pass; the only hits are Colour a Friend's nose and eyes
  (7–9px), now optional details since colouring the letter hangs the page.
  At 667×375 the same scan found Colour a Friend's crayons 33px wide (eight
  in a row beside the picture); they now sit in two rows of four, 67×74,
  all on screen. All 66 chapter games pass sideways too.
  iPad (1024×768): every practice and chapter game passes; only Colour a
  Friend's optional face details are small.
- Audit, no change: what a child who keeps missing meets in chapter games.
  Pop and Feed offer 2 choices to beginners, 3 to most, 4 to advanced; every
  wrong pick quietly leaves the board (scaffolded retry) and the question is
  said again, so at most three misses leave only the answer; beginners also
  see the right bubble glow after the first miss. Probed in pack-smile,
  pack-round, fatha and decode (fresh profile: one miss, answer alone).
- Guessing-child run (lgAuto, random untried taps) over 28 practice games on
  iPad: 25 finish, 0 errors; the other three are the drawing toys (a tapper
  cannot draw) and Sound Lab without taught marks (its tile is gated on
  them). lgAuto had never really played Letter Hunt — it filtered on
  offsetParent and called .click(), neither of which SVG spots have; fixed,
  and Letter Hunt now finishes in 3/3 runs (5 found, 5–11 misses).
- Drawing toys, worst case (a child who only taps, never drags): Sand Table
  finishes all 4 letters by taps alone (~5 tries per stroke, then the stroke
  draws itself — 138 taps, 19s); Garden Paths never judges a drawing (any
  ink enables Next, saved as a helped attempt). Neither can be failed.
- Map stars: a chapter marked done with no saved star count (older saves)
  showed three empty outlines — on a chapter the child had finished, read as
  "you got nothing". A finished chapter now always shows at least one earned
  star; unplayed chapters keep their three soft outlines as an invitation.
- lgSweep after the Colour a Friend / crayons / map-star / wind-story changes: 193 steps, 0 failing; 599 tests pass.
- A little sprout's toys all fit one phone screen: on a phone, four of the
  nine (Book Corner, Friend Pairs, Sand Table, Colour a Friend) sat below the
  fold of the practice garden, and a 2–3-year-old won't scroll. Sprout-only
  phone layout: three smaller tiles a row, single-toy groups side by side,
  colour groups kept. All nine on screen at 375×667 (tiles ≥97×103) and
  320×568 (≥81×84). Older children's garden unchanged.
  Same below-the-fold problem in the two hubs: the Book Corner (Busy Market,
  the Living Books shelf) and the Puzzle Tree (Build a Letter, Fill the Gap)
  each hid two of eight games on a 320×568 phone. Three a row on phones: all
  eight on screen (last row ends 495px, tiles 85×103).
  Sideways phones were worse: the 185px tiles left six of a sprout's nine
  toys and five of each hub's eight games below the fold. Compact sideways
  tiles (hubs four a row, sprout groups side by side): 0 hidden at 667×375,
  844×390 and 932×430, tiles ≥78px. The older children's long garden still
  scrolls on purpose.
  Upright iPad (768×1024): a sprout's Sand Table and Colour a Friend were
  just below the fold; same arrangement at full tile size, last tile 987px.
  iPad sideways (1024×768) already fit (sprout 752px, hubs 712px).
  Kept as a QA check: `lgHubScan()` in `.qa/layout-scan.js` lists any toy
  tile below or beside the screen in the sprout garden and both hubs; proven
  by restoring the old two-column hub (it names the four hidden games).
- lgSweep after the hub/sprout layout changes: 193 steps, 0 failing; 603 tests pass.
- Who's playing: siblings who hadn't hatched yet all showed the identical
  cream egg, so a toddler couldn't find theirs. Each child's egg now has its
  own palette shell (cream for the first, then yellow, mint, lavender,
  green), and their hatch screen shows that same egg — the one they picked
  is the one that hatches. Checked with three profiles.
- Readability scan (smallest Arabic glyph in every chapter game, 320×568):
  Feed's seed packets — the choices, carrying the word to read — were pinned
  at 48px on short phones, so a Quran word in the last chapters shrank to
  ~21×29px. Taller tray row and packets that grow to 100px (shrinking to fit
  more): a long word's font 16 → ~30px, no scroll;
  sideways phones (80×93 packets) and iPad were already fine.
  Pairs, same scan: two-pair boards on a short phone left cards 63px inside
  100px columns (words ~18px). A taller board and 76×80 cards (+20%),
  bottom row ends above the pots (416 vs 420px), no scroll. Three-pair
  boards unchanged.
  Tile letters (Build, Pairs leaf cards, Catch, Join, Unfuse, Chain,
  Parade): workshopTile's default glyph 42 → 54, so a letter fills its tile
  instead of a third of it; above 42 the glyph is fitted to the tile face, so
  long words (decode-4) still sit inside their cards.
  Answer-card words (Pop bubbles, cards, packets): glyphText's length
  scaling .9/.72/.58 → .95/.85/.78. Every glyph is ink-fitted to its box,
  so nothing spills; a Quran word in Pop on a 320px phone goes 22 → 30px,
  Pairs words in the shadda chapters 22 → 39px.
  Catch fruit: letter cap 40 → 50, ink-fitted to the cream plate — 22–24 →
  24–30px on a 320px phone, every glyph inside its plate.
  Kept as a QA check: `lgGlyphScan()` in `.qa/layout-scan.js` lists chapter
  games whose smallest tappable letter/word is under 24px (Letter Hunt's
  hidden letters skipped). Clean at 320×568 after this pass; proven by
  shrinking the Build tiles to 40px (flags decode/sukoon build at 16/19px).
  Settled measurements put Build letters at 29–31px — earlier 20–22px
  readings were tiles caught mid deal-in with the animation clock frozen.
- Custom art, no emoji: the word chapters' map stops were the emoji 📖/📗
  (drawn by the platform); they are now a drawn open book and a stack of two
  books (MAP_ART in LettersArt, flat + ink, palette only). New Art.artIcon():
  illustrated sun (with a face), flower, star, book, paw, calendar — used on
  the map's daily row, the rewards star, the album's book/star tabs, the
  sticker-stand price and the stamps screen, where one-colour glyphs read as
  stock emoji beside the drawn walk and pet. Button glyphs (next, speaker,
  check…) stay bold one-colour on purpose. QA: `.qa/art-gallery.js`
  (`lgArtGallery('practice')` etc.) shows every art set side by side.
- Art pass 2 (custom everywhere, found with the art gallery):
  - Spot the Change and Family Buses had no tile picture and borrowed Garden
    Paths' drawing board — three toys looked identical. Now: an eye over
    three stepping stones (one sparkling), and a bus carrying ب ت ث.
  - Listen & Find's tile drew the plain speaker glyph; now a drawn listening
    horn with sound waves. Dot Nests is two nests (two dots, three dots) with
    a sprig instead of one sparse nest.
  - The Feed step showed the picnic basket in every story theme; harvest,
    jars, raft and parcel chapters now have their own (a fruit bowl, a seed
    jar, a plank bundle, a wrapped parcel) matching the step's words.
  - Keepsakes from same-theme chapters were identical copies (three picnic
    baskets, four fruit trees…). Each now carries a small tag with its
    chapter's mark — a souvenir of that chapter. The tag sits beside the
    art, so slot/tray sizing is unchanged.
  - The stars a child EARNS (stars screen, chapter party) and the star
    currency (balance chips, wardrobe prices, album-complete) use the drawn
    star — ink contour, highlight, gold — instead of the tinted glyph; the
    old path-recolouring CSS now skips .art-icon so the drawing survives.
  - The pet's colour choices were plain dots; now little paint pots with a
    colour label band, rim and drip in that colour (tapping still recolours
    the pet; the picked pot sits on a gold tile).
  - Today's Walk had no destination — the nap spot was a bare pink oval (it
    asked for a cushion art that never existed). Now a woven nap bed with a
    cushion, blanket and moon flag; when the walk is done the pet lies on it
    with its z z above (it used to hover over the oval).
  - The Friends' Garden was a flat green grid (an inventory, not a place).
    Now a picket fence along the top, grass tufts and small flowers in the
    bed, and each friend at home standing on its own soil-and-grass mound
    beside the sprouts of those still on their way. Phone and iPad checked.
  - The book shelf had no shelf: four books floating on the sky (3 + 1 on a
    tablet). Now a wooden bookcase — cabinet behind, a plank under every row
    — with all four books on one shelf on a tablet, two shelves on a phone,
    centred.
  - The Puzzle Tree had no tree — eight cards floating on the sky. Its games
    now hang in a leafy canopy (fruit at the edges) on a trunk; on a tablet
    they sit 4 × 2 so the leaves frame them and the trunk fits; phones keep
    all eight on screen with the trunk beneath.
  - The Book Corner's games floated on the sky too; they now sit on a giant
    open picture book (red cover, two cream pages, the spine) with a green
    ribbon bookmark hanging below — 4 × 2 on a tablet, all on screen on a
    phone.
  - Word Workshop: the word chapters' card drew the plain black book glyph
    (the emoji look); now the illustrated book. The chapters sit on a wooden
    workbench (top, lip, legs) — 5 × 2 on a tablet; on a phone 3 a row, all
    nine on screen (was 2 a row, five rows deep, ending at 1068px on a 667px
    screen), letters kept at 25px.
  - Stamps calendar: a played day showed the tinted star glyph; it now grows
    a drawn flower (today's on a gold tile). Unplayed days stay plain numbers
    — no gaps, no guilt marks.
  - Ayah garden: the verse card floated on the sky; it now rests on a wooden
    rehal (crossed, inked Quran-stand legs with a hinge pin) — calm and
    reverent, matching the album's rehal tab. Reviewed and already custom:
    letter book, word shelf, chapter meet stage.
  - The practice garden's toy groups are raised wooden garden beds — a
    wooden rim with an ink line and a dotted soil strip along the bottom —
    keeping each group's colour. Sprout layouts still fit (320×568 last tile
    550px; 667×375 352px).
  - Word Gap's tile was a plain rectangle; now a scroll on wooden rollers
    with the gap, and the missing letter swooping in on a wooden tile.
  - The loading flower (first thing a child sees) is the illustrated flower
    now — petals, centre, stem and leaf — in both the static page and JS.
- First-look pass (2026-10-13), the screens a brand-new child meets:
  - The hatched egg used to vanish. The new pet now sits in the bottom
    half of its own shell (same colours and spots as the egg the child
    tapped), the top lies tipped on the grass beside it, and two flecks fall
    nearby. These are decoration only; taps still go to the pet. Checked on
    a tablet, a sideways phone and an upright phone.
    The first time only, the pet comes out wearing the top as a hat, and
    it tumbles onto the grass as the pet stretches awake (about 1s in).
    Under reduced motion the top just lies on the grass.
  - The album's free first sticker was marked by a 16px flower. A drawn
    wrapped present now bobs beside the stand (still under reduced motion),
    and the stand's price tag shows the present too. `artIcon('gift')`.
  - The letter-star sky was empty for a new child: its sleeping stars were
    13-unit sparkles the colour of the dust. Each is now a little star
    asleep (closed eyes, rosy cheeks, a "z" over the first of each family).
    A tap makes it peek open, then doze off again.
  - A new child's own garden was four empty plots and an empty tray, a
    dead end. Every hatched child now owns one keepsake from the start: the
    egg shell their pet came out of, in their egg's colours, with its top
    leaning on it. Tapping it once placed makes the pet walk over and climb
    back in. The shell's front rim is drawn over the pet, so it sits inside;
    the rim leaves when the pet goes home. Catalog: `{ pet, eggShell }`.
    While the shell is all a child owns, the "play a lesson to grow
    flowers" card stays beside it in the tray, made compact so both fit.
    Both centre in the tray. On a tablet they first sat off to the right,
    because the tray's centring margin only looked at its last sticker.
  - A map left untouched for 40s lets the pet doze by its stop: eyes shut,
    head nodding to one side, slow breaths, "z z" above. Any touch wakes
    it with a stretch and a cheer, so a child coming back is greeted. The
    pet rig gained `doze()` / `dozing`. Under reduced motion it still shuts
    its eyes but doesn't breathe or float.
  - Daytime butterflies no longer fly across the letter-star night sky.
  - Bath Time: the friend hid under a heap of brown mud that filled the
    tub. At a glance it read as dirty, even as something worse, and not as
    fun. It is now bubble foam: cream, aqua and lilac suds with little
    shines, flecks of foam flying off where the sponge goes, and pops
    instead of the gritty sand sound. The scrub, the halfway guess and the
    reveal are unchanged, checked by scrubbing in the frame (94 suds down
    to 18, guess offered). The toy-garden tile's two mud spots are suds too.
  - Bigger tap targets, for tiny fingers. A new scan
    (`SMALL=44 … .qa/headless-shot.mjs`) of every screen, every chapter game
    and every toy at 320×568 found two below 44px. Letter Hunt's thin hiding
    places (the flag, the kite) were 35–41px wide: each now has an
    invisible round pad, 61px on a 320px phone and 71px sideways, with no
    two overlapping in any land. The pet room's ball, drum and bubbles were
    42px wide: an invisible 8px ring now widens each. The pictures are
    unchanged. The grown-up dot stays small on purpose.
  - Graduation (the Bismillah, the end of the whole journey): its ending,
    the keepsake scroll and the way back to the garden, appeared in a new
    row below the screen on phones. On a sideways phone it was wholly
    off-screen, and upright only its top edge peeked in. On phones the
    ending now takes the pet's place (sideways: beside the Bismillah), the
    friends are a little smaller on 320px phones, and the screen scrolls
    the ending into view as a safety net. Seen at 320×568, 375×667 and
    667×375.
  - Ayah garden on a sideways phone: the play button and arrows sat below
    the screen (the stage ran 470px in a 375px screen), so a child could
    not start the recitation. Sideways, the controls now stand in a column
    beside the verse and the rehal's legs step aside. Seen at 667×375 and
    844×390.
  - Who's playing: each child's card had a big grey block behind the lower
    half of its pet or egg. The floor-spot gradient had no size, so it
    defaulted to a huge circle clipped by the card. It is now a small
    sized ellipse under each pet. Seen in a real render.
  - My garden's empty spaces were dashed boxes with a "+", a grown-up's
    "add" sign. Each is now a patch of freshly dug soil, with furrows,
    pebbles and two grass tufts. The dashed ring comes back only while
    something is picked up, to show where it can go.
  - Sideways phone, album: the tabs, the stall and the collection stacked,
    so only a sliver of the first sticker row showed at 667×375. A child
    saw almost none of what they own. Sideways, the tabs and stall now sit
    on the left and the collection fills the right, scrolling in place.
    This covers stickers, my letters, Quran words and the star sky. About
    three sticker rows now show at 667×375 and two larger rows at 844×390.
  - Stars screen: after games 1 and 2 the pet wore "proud", a closed
    crescent mouth that looked neutral beside a single star in a real
    render. Every step's reward screen now uses "delighted" (the open
    grin), so a one-star round still ends with the pet visibly happy for
    the child.
  - Wardrobe prices: "★ 8" means nothing to a pre-reader. Under each price
    out of reach, a small gold bar now fills toward it from the child's
    stars ("my stars are growing toward this"). A price in reach turns gold.
    The tap still hops "soon", never "no". Fits the 142px cards at 320×568,
    375×667, 667×375 and 1024×768.
  - A chapter left half-way (a stray tap on Home, bedtime) already resumed
    where the child got to, but the map stop looked untouched. The current
    stop now shows a gold, ink-edged arc around its ring for the share of
    the chapter done, so coming back reads "nearly there", not "start
    again". It uses the same 6-hour window as resuming, `partwayOf(world)`.
  - Friends' Garden: for a new child it was 28 identical sprouts. Each
    waiting plot now has a small wooden label on a stake with its friend's
    letter, in soft ink: a spot saved for that friend. The label is 27px
    tall, so letters that dip below the line (ج ح خ ع غ) stay inside it. The field's flower
    pattern repeats whole, so no flower is half-cut at the panel's edge.
  - The pet's tricks tab was seven grey dashed boxes with grey seeds. Each
    trick still growing is now a seed planted in a soil mound, peeking out
    in its letter family's colour, with a two-leaf sprout, on a solid card.
    A tap wiggles the seed (with the seed sound) and the pet looks at it,
    curious.
  - Chapter party: the letter friends who come to cheer were the smallest
    thing on a phone's party (58px, with ~95px of height to spare). They
    are now 66px on phones, sized from the screen width, so five fit on a
    320px phone too. Five used to spill 9px past the panel there.
    Measured at 320×568, 375×667 and 414×896, with no screen scroll.
  - The practice garden button, before the first chapter opens it, sat
    faded at 62% (a faded button reads "not for you"). It is now full
    colour, with a seedling in a little pot where the arrow goes,
    `artIcon('sprout')`. A tap sways the seedling and the hand still points
    at the chapter that opens it.
- Looked at on real styled screens with headless Brave (`.qa/headless-shot.mjs`
  + `.qa/scene.html`) at 375×667 and 1024×768 while the Browser pane was
  hidden: wardrobe price bar, progress arc, Friends' Garden labels, gift
  stand, my garden tray, hatch hat.
- Off-screen button check (2026-10-13, `OFFSCREEN=only node .qa/headless-shot.mjs`):
  no visible button outside the screen (scrolling panels excepted) across
  21 screens × 5 sizes (320×568, 375×667, 667×375, 844×390, 1024×768),
  and every chapter game (22 worlds × 3 games) at 667×375 and 320×568.
- Release checks after the first-look pass (2026-10-13): lgSweep 193 steps / 0
  failing; lgPlay 66/66 chapter games finished, no errors; 625 tests pass.
## v264 — A clear first moment (2026-10-20)
- On the hatch screen, the page-wide ambient butterflies flew over the pet and across the big confirm button (found tapping through the first-time flow). That layer lives outside the game and sits above it, so it can't slip under the controls. Like the reward, wardrobe and night screens, the hatch screen now hides it. The screen keeps its own sparkles and falling leaves.

## v263 — Near-miss taps reach the village landmarks (2026-10-20)
- Fix, found in the live site's console: the forgiving-tap helper (a tap just beside a target snaps to it) called `.click()`, which SVG elements don't have. The village landmarks are SVG, so a little one tapping just off the cottage, stall or gate got nothing, plus an error. The helper now sends a real click event, which works on any element. Verified with a real tap on the grass beside the cottage, which now opens the pet's room.

## v262 — Clear table legs (2026-10-19)
- On phones the decorative paper boat sat on the joinery table's legs and stretcher bar in the build, blend, fuse, unfuse, chain and parade games. On narrow screens it now steps aside in those games. The pond game, where it sits in open space, keeps it.

## v261 — Leaf emblems on the memory cards (2026-10-19)
- Garden Together's face-down cards were plain dotted green. Each back now carries a leaf on a cream disc, like a real memory-card deck. A turned-up card's face covers it as before.

## v260 — No "undefined" in Garden Together (2026-10-19)
- Fix: with no second player's pet saved, Garden Together printed the word "undefined" in the second player's seat. A friendly pink buddy pet now sits there instead. `.qa/headless-shot.mjs` gained `JUNK=1`, which scans each screen's visible text for "undefined", "NaN", "null" or "[object Object]"; 58 screens now come back clean.

## v259 — A Sound Lab machine that looks like one (2026-10-19)
- The Sound Lab game's machine was a blue box with a gear. Like its picker tile (v194), it now has a speaker grille, two lights, rivets, a top shine and a red-knobbed side lever. The turning gear is unchanged.

## v258 — A real tree in Letter Hunt (2026-10-19)
- Letter Hunt's tree was a lollipop: one green circle on a stick, the shape the owner called out. It is now built like the DetailKit trees: root flare, bark lines, forked limbs, and a clumped canopy with an ink edge, lit tops and leaf curls. The hollow where a letter hides is unchanged.

## v257 — Fluffier bath foam (2026-10-19)
- The Bath Time foam was a near-uniform grid of same-size circles. Bubble sizes now vary (mostly small, a few big), so it reads as fluffy foam. The smallest size is unchanged, so the hiding friend stays fully covered until scrubbed.

## v256 — Growth that always looks like more (2026-10-19)
- The map's mastery plant had four stages, but the second (sprout) showed one leaf while the first (seed) already had a two-leaf shoot, so improving could look like shrinking. The sprout now has two full leaves and a curled tip, so each stage reads as bigger than the last: seed, sprout, bud, flower.

## v255 — A moon over the night calendar (2026-10-19)
- The stamp calendar's header always showed a sun, even at night. After dark it now shows the gold crescent moon (the moon sticker's art).

## v254 — A garden of stamps (2026-10-19)
- Every stamped day on the calendar showed the same pink flower. Each now blooms in coral, gold or lilac depending on the date (palette colours, swapped in the SVG), so a run of played days looks like a little garden. A first try with a CSS hue filter was dropped: it shrank the flowers and pushed colours off the palette.

## v253 — Die-cut stickers on the island (2026-10-19)
- Stickers placed on the decorating island get the same die-cut look as in sticker scenes: the motif with a white shape border and a soft shadow, instead of a round disc on the grass. A `garden-stickers` QA scene was added.

## v252 — Die-cut stickers in the scenes (2026-10-19)
- Stickers placed in a sticker scene sat on the album's round cream discs, so they looked like buttons dropped on the picture. They're now die-cut: the motif with a white border that follows its shape and a soft shadow, like a real sticker stuck onto a page. Dragging, removing and the tray are unchanged.

## v251 — A gold star when the journey's done (2026-10-19)
- After the last chapter, or for an art-icon chapter, the village gate's medal showed a plain black text star. It now holds a drawn gold star, a proper finish to the whole journey.

## v250 — The map balloon comes down (2026-10-19)
- Reverted v244's hot-air balloon. The map's landmarks alternate sides and its layout changes with screen width, so no position stayed clear everywhere: it landed behind the waterwheel, behind the hive's flowers, beside the map button, and against the sound button on a tablet. Decoration must never crowd a control, so it's gone. The map keeps its edge butterflies (v226).

## v249 — A treasure chest, not a locked box (2026-10-19)
- The toy chest's gold plate had a keyhole, so the open, playable chest could read as locked, the kind of "you can't" signal the game avoids. The plate now carries a gold star.

## v248 — Celebrations that never cover the game (2026-10-19)
- On the map a Ramadan lantern hung over a map stop, and in the games the Eid bunting crossed behind the letter prompt. Everywhere except the village (which has open sky for the full-size string), the season string now runs small along the very top edge, above every control, stop and prompt.

## v247 — Bunting above the controls (2026-10-19)
- On the friends' garden and decorating island, the Eid bunting and Ramadan lanterns hung across the sound-wave button and close to the pet. The string now runs smaller along the very top edge on those screens, so every control and the pet stand clear.

## v246 — Ramadan lanterns and Eid bunting come home (2026-10-19)
- Fix: like the weather, the Islamic-calendar decorations (a string of lanterns in Ramadan, coloured bunting on Eid) were hidden behind the village scene, so the home screen never celebrated. The string now hangs across the top of the village sky, above the gate's letter medal, and can't be tapped. The lanterns still sway, and hold still under reduced motion. QA scenes accept `season=`.

## v245 — Weather comes home (2026-10-19)
- Fix: the day's weather (drizzle, breeze, rainbow) showed on every screen except the village home, where the scene covered the weather layer, although the code intended it to show there. The layer now sits above the village scene and can't be tapped. In the village the rainbow rises on the right, clear of the gate's letter medal. Rain and drifting leaves still hide under reduced motion. QA scenes now accept `weather=`.

## v244 — A hot-air balloon over the map (2026-10-19)
- By day a coral hot-air balloon drifts slowly over the map's water, between two stops near the start of the journey and clear of every landmark. It can't be tapped and holds still under reduced motion. It's drawn above the water layer, because the first version sat hidden underneath it.

## v243 — A heart over the door (2026-10-19)
- A small wooden plaque with a coral heart now hangs from the cottage's eave above the door, so the house reads as the pet's own home.

## v242 — Sparkles that say "tap me" (2026-10-19)
- The very first screen is an egg to tap, but with reduced motion on, its wiggle stops and nothing invited a non-reader to tap. Three gold sparkles now frame the unhatched egg, a "tap me" cue that doesn't rely on motion. They disappear once the pet hatches. A `hatch-egg` QA scene (with `cracks=`) was added.

## v241 — Fireflies, not butterflies, after dark (2026-10-19)
- The friends' garden and decorating island butterflies kept flying at night. Like the village, they now become a softly glowing firefly after dark. Reduced motion keeps the glow steady.

## v240 — A lantern on the stall at night (2026-10-19)
- After dark, the sticker stall hangs a small glowing lantern from its awning, so it stays warm and inviting at night. By day it's gone. (New `vg-night-only` class for other night-only touches.)

## v239 — A butterfly over the decorating island (2026-10-19)
- A lilac butterfly now flutters in the sky beside the decorating island, clear of the home button, the pet and every planting spot. It can't be tapped and holds still under reduced motion. All four home screens (village, map, friends' garden, island) now share the same gentle life.

## v238 — A butterfly in the friends' garden (2026-10-19)
- A gold butterfly now flutters over the friends' garden fence, like the village and the map. It can't be tapped and holds still under reduced motion.

## v237 — Morning dew (2026-10-19)
- In the morning a few of the village's lawn tufts carry a small white dew glint, so each time of day now has its own touch: dew in the morning, birds at sunset, and lit windows, a dozing sunflower and twinkling stars at night.

## v236 — Birds flying home at sunset (2026-10-19)
- At sunset two little birds fly home across the village sky, a calm end-of-day picture. They sit in open sky, clear of the gate and the sound button.

## v235 — Twinkling night stars (2026-10-19)
- The village's five night stars now twinkle slowly, each in its own time, so the night sky feels magical. Reduced motion keeps them still.

## v234 — A sleepy sunflower (2026-10-19)
- At night the birdbath sunflower closes its eyes and dozes with a little "z", a gentle "the garden is resting too". By day it is wide awake as before.

## v233 — Lit windows at night (2026-10-19)
- At night the cottage's two windows now glow warm gold instead of daytime blue, so the pet's house feels cosy and safe after dark.

## v232 — No two village bushes alike (2026-10-19)
- Every village bush was identical. Each now takes a flower colour (coral, lilac or gold) and a left or right facing from its position, like the seeded trees.

## v231 — Drifting clouds (2026-10-19)
- The village clouds now drift slowly a little to the left and back over 16 seconds, each at its own offset. They only move leftward, because the big cloud already sits beside the sound button. Reduced motion keeps them still.

## v230 — Twinkling empty spots (2026-10-19)
- On the decorating island, an empty planting spot was a bare patch of soil. Each now has a small gold twinkle that pulses softly, alternating between spots, so a new kid sees where something can go. Filled spots don't twinkle, and reduced motion keeps the twinkle still.

## v229 — A bobbing balloon (2026-10-19)
- The balloon peeking out of the open toy chest now bobs gently on its string, a small "come play" for the games inside. Reduced motion keeps it still.

## v228 — A swaying sunflower (2026-10-19)
- The smiling sunflower in the birdbath now sways gently from its stem, like a wave hello. Reduced motion keeps it still.

## v227 — Smoke from the chimney (2026-10-19)
- The cottage chimney's three smoke puffs now drift up and fade in turn, so the pet's house feels lived in. Reduced motion keeps them still.

## v226 — Butterflies along the map (2026-10-19)
- The map's edge margin, never the route, now has a butterfly every third stop (coral, blue or gold) and a firefly there at night. They use the village's animation, can't be tapped, and hold still under reduced motion.

## v225 — Butterflies and fireflies in the village (2026-10-19)
- The village home now has a little ambient life. By day a coral and a blue butterfly flutter gently over the lawn; at night three fireflies glow softly. They are decoration only: they can't be tapped, sit in open space clear of every landmark, and hold still under reduced motion.

## v224 — A smiling cloud sticker (2026-10-19)
- The cloud sticker was the plainest in the album: a bare puff. Like the sun sticker, it now has a face: two eyes, a small smile and rosy cheeks.

## v223 — A clear left column on sideways phones (2026-10-19)
- Held sideways, the games put the prompt, progress seeds and sound button in a left column, and the decorative shore boat landed behind them in every game (behind the pencil pot, under the sound button, behind the prompt). In short landscape it now steps aside on game screens too.

## v222 — Room on the meet screen (2026-10-19)
- On phones the decorative paper boat crowded the letter-meeting screen. Held sideways it sat on the easel's island, and upright it hid behind the pet's sound button. On phones it now steps aside on that screen. Tablets, which have room, keep it.

## v221 — No empty stars at the sticker stand (2026-10-19)
- The sticker stand's savings row always showed five star slots, so a kid with no stars saw five dim stars, a row of "nothing yet". It now shows only the stars actually saved, followed by a small green sprout while savings grow toward the five a visit costs. At zero it is just the sprout. The spoken label is unchanged.

## v220 — Mossy stepping stones (2026-10-18)
- The three stepping stones at the bottom of the village path (the way into the walk) were plain ovals. Each now has a small crack line and a moss tuft on its rim. They keep their gold or grey colour for walked and not-yet-walked.

## v219 — A raft made of logs (2026-10-18)
- The raft keepsake was one rounded plank. It is now two logs lashed together with rope bindings, with ringed log ends. The letters sit on the taller top log, clear of the seam and the grain.

## v219 — A raft made of logs (2026-10-18)
- The raft keepsake was one rounded plank. It is now two logs lashed together with rope bindings, with ringed log ends. The letters sit on the taller top log, clear of the seam and the grain.

## v218 — A moon for the night pages (2026-10-18)
- Living Books night pages had stars but no moon unless the page drew its own. Those pages now show a small gold crescent, with its shine on the body of the crescent (not in the hollow, where it read as grey), like the village sky.

## v217 — Glossy paint for the pet colours (2026-10-18)
- The pet-colour choices on the hatching screen get a soft wet shine, so they read as glossy paint dollops. A paint drip was tried and dropped because it read as a little handle.

## v216 — A graduation certificate (2026-10-18)
- The Bismillah graduation card was a plain white panel. It is now dressed as a certificate: a gold inner border on the paper, gold corner dots, and a gold rosette with coral and blue ribbons hanging off its corner. Finishing every letter should feel like being handed something special. The tappable words are unchanged.

## v215 — Pots waiting for sprouts (2026-10-18)
- In the pairs game each pot grows its sprout only after a pair is matched, so before that it was a plain coral bowl. The waiting pots now have a rolled rim, dark soil in the opening and a dotted band, so they look like pots ready for a sprout.

## v214 — Grass on the village lawn (2026-10-18)
- On tablets the village lawn showed big flat stretches of green. Fourteen low-contrast grass tufts and a few tiny flowers are now scattered across it, drawn under every landmark and never tappable. They are dimmer at night.

## v213 — The Bath Time tile matches its tub (2026-10-18)
- The game got a clawfoot tub in v159, but its practice tile still showed the old plain basin. The tile now has the same rolled white rim, a curved tap, a panel line and gold claw feet.
- Tried and reverted: letting tile pictures keep their proportions on tablets. The drawings barely grew, and the arrows lost their shared row because two tiles use different picture markup.

## v212 — Mirrored mountains (2026-10-18)
- Every mountain stop on the map was the same picture. Every other one is now mirrored, so the big peak, the trail and the flag swap sides from stop to stop.

## v211 — Varied reed stops (2026-10-18)
- Every reed stop on the map was identical. Each now picks one of three sets of cattail heights and a lily flower colour (coral, lilac or gold) from its place on the map. The lift-the-leaf toy and the ladybug are unchanged.

## v210 — Varied wildflower stops (2026-10-18)
- Every hive-and-wildflower stop on the map was the same picture. Each stop now rotates its three flower colours and heights and shifts its bees, so the meadow no longer repeats itself.

## v209 — Every orchard tree its own (2026-10-18)
- Every orchard stop on the map drew the same tree (one fixed seed). Each now gets its own seed and a slightly different size from its place on the map, so the orchard reads as a group of individual trees. The shake-the-tree toy is unchanged.

## v208 — Vines on the land gates (2026-10-18)
- The land gates (the banner poles where the path enters a new land) were a bare pole with a rolled banner. A vine now climbs the pole, with four leaves and a small coral flower, the crossbar ends in a gold knob, and the stone foot has a peg. The gate stays narrow enough to stand beside a bridge on a phone.

## v207 — Flowers in the meadow (2026-10-18)
- The meadow was the only land with no edge scenery, because the scenery loop skipped lands without a tint, and the meadow is the untinted base ground. It now gets grass tufts with small flowers (coral, lilac and gold in turn) between the edge bushes and the path, and still no tint band.

## v206 — A pinecone with scales (2026-10-18)
- The pinecone find was a brown oval with a few lines. It is now built from overlapping rows of golden scales with lit edges, on a dark cone, with a stem and a small leaf.

## v205 — A built table for the build game (2026-10-18)
- The build game's table (the joinery art) had bare legs and a plain apron. It now has a stretcher bar between the legs, shaped feet, plank seams across the apron, and a drawer with a gold pull in the middle.
- QA note: `.qa/headless-shot.mjs` takes `scene:t:params`, so parameters need a double colon (`play::act=build`). Several earlier screenshots silently ignored their parameters.

## v204 — Peek Flaps opens like a door (2026-10-18)
- The Peek Flaps tile's open flap was drawn as a single teal line that read as a pole through the elephant. It is now a door leaf swung open on its hinge, with panel lines and a gold knob, a stone step under the doorway and a soft shade inside. The elephant moved left so nothing overlaps.

## v203 — Books with covers, and an egg in a nest (2026-10-18)
- Book Corner and Friend Book: the open books were bare outlines. Each now has a cover showing underneath (coral, and blue), stacked page edges, and a ribbon bookmark hanging from the spine.
- Fill Gap: the egg floated above the word. It now sits in a woven nest, and the word and its gap moved down so the vowel marks stay clear of the nest.

## v202 — Real books for Living Books (2026-10-18)
- The Living Books tile's books were plain coloured rectangles on a brown line. Each spine now has two bands in a deeper shade of its own colour and a soft shine. They stand on a wooden shelf plank, with a potted plant as a bookend.

## v201 — A chalk slate and a balloon train (2026-10-18)
- Dots Last: the tile was a white card. It is now a chalkboard slate in a wooden frame with a chalk tray and a stick of chalk. The letter is drawn in chalk, with one dot placed and a dashed ring where the last one goes.
- Letter Train: balloons floated over three bare blocks. It is now a train on a track with sleepers: two coral cars and a blue engine with a smokestack, a window and a headlamp, all on wheels, with a balloon tied to each car.

## v200 — A framed picture and a bracketed shelf (2026-10-18)
- Friend Shapes: the picture sat in a bare square outline. It now hangs in a wooden frame with a lit top edge, on a string from a nail.
- Hat Shop: the shelf was a brown line. It is now a wooden plank on two brackets.

## v199 — A jewelled crown and a real crayon (2026-10-18)
- Twin Crown: the crown was a flat yellow zigzag over two floating friends. It now has a gold band set with three gems, pearl tips, a shine and two sparkles, and the twins sit on lilac velvet cushions with gold tassels.
- Colour Friend: the crayon was a sharp slanted rectangle. It is now a rounded crayon with a striped paper wrapper, a shine and a pointed tip, like the Letter Studio crayon.

## v198 — Build Letter with a real block (2026-10-18)
- The Build Letter tile was a plain card and a flat square. The letter board now sits in a wooden frame with two coloured pins. The dots ride on a 3D wooden block (top, side and front faces), and a dotted green path shows where they go.

## v197 — A signpost for the Hoopoe Trip (2026-10-18)
- The Hoopoe Trip tile's sign was a plain square on a stick. It is now an arrow-shaped wooden signboard pointing the way, with the friend picture on a paper panel, nail heads, an inked post and grass tufts at its base.

## v196 — Bunting for the Echo Parade (2026-10-18)
- The Echo Parade tile was three marchers floating under blue arcs. A string of coloured bunting now hangs overhead, the marchers stand on the grass, and the echo arcs stay above them.

## v195 — A lantern that finds, and a shadow theatre (2026-10-18)
- Lantern Hunt: the lantern was a small yellow box. It now has a carrying ring, a domed cap, frame bars, a flame and a base, and its warm beam falls on the friend hiding in the dark.
- Letter Shadows: the tile was an orange card with a silhouette. It is now a little shadow theatre: coral curtains drawn back with gold tie-backs, a scalloped valance, and a wooden stage board under the glowing screen.

## v194 — A real Sound Lab machine (2026-10-18)
- The Sound Lab tile was a blue box with flaps and one knob, and its letter slipped out of the window onto the knob. It now has a speaker grille, tick marks around the dial, two lights, a lever on the side, and musical notes rising out of the open box. The letter sits back in its window.

## v193 — Garden Together, together (2026-10-18)
- The Garden Together tile was two round faces with an arc and a blank card. It is now two friends with bodies, feet, cheeks and smiles, each reaching toward a shared clay pot. A two-leaf sprout grows from the pot, with a heart above it.

## v192 — A fishing rod for Letter Fishing (2026-10-18)
- The Letter Fishing tile's line hung from nowhere. It now comes from a wooden rod with a reel, with a red-and-white float at the water line. The fish has a fin line, and the lily pad has a small pink flower.

## v191 — A finished family bus (2026-10-18)
- The Family Buses tile's bus had windows and wheels but nothing else. It now has a roof rack on two posts, bumpers front and back, a headlamp and a tail light, and hubcaps with three bolts each.

## v190 — A bench for Spot the Change (2026-10-18)
- In the Spot the Change tile the three friends sat on nothing. They now sit on a wooden plank bench on two legs, and the watching eye has lashes and a lower lid line.

## v189 — A real jigsaw piece (2026-10-18)
- The Friend Jigsaw tile's loose piece was a plain gold square. It is now a jigsaw piece with knobs and a slot, and the board shows a dashed gap where it belongs. The friend peeks out of the other three quarters.

## v188 — Balloons tied with a bow (2026-10-18)
- The Letter Balloons tile's balloons hung on loose strings. Each now has a knot and a shine, and the three strings gather into a coral bow tied to a little stake in the ground.

## v187 — A mailbox for Letter Delivery (2026-10-18)
- The Letter Delivery icon was a sheet of paper and a dashed arrow into a grass patch. It is now an envelope with a coral heart seal flying on a dotted arc into a coral garden mailbox on its post. The mailbox door is open with a letter peeking out, and the gold flag is up. The garden patch and sprout stay.

## v186 — Garden Paths is a path (2026-10-18)
- The Garden Paths tile was a white card with a traced line and a pencil. It is now a lawn with the letter laid out as stepping stones. The stones already traced are solid, the rest are dashed, and a ladybug walks where the tracing has reached. A coral flag marks the end, and the letter's dot is a stone too.

## v185 — A Water Garden tile you can read (2026-10-18)
- The Water Garden tile was a blue disc over a bar and three posts, hard to read. It is now a watering rig: a wooden gutter of water on two posts, a spout over each of three flower pots, and drops falling into the middle pot, whose flower has bloomed bigger. Each pot keeps its blank card.

## v184 — A finished Costume House (2026-10-18)
- The Costume House tile was a purple dome over a bare wall and a door. The roof now has two rows of scalloped shingles. The door has a panel line, a gold knob and a stone step, and a flower pot stands at each side.

## v183 — Tunics on hangers, and a real magnifying glass (2026-10-18)
- The Costume Rail tile hung three coloured rectangles. They are now little tunics on wooden hangers (shoulders, sleeves, a collar), each still showing its letter form.
- The Disguise tile's orange ring now has a wooden handle and a lens shine, so it reads as a magnifying glass. The lens stays clear over the letter it highlights.

## v182 — A real engine for the Shape Train (2026-10-18)
- The Shape Train tile's engine was a red rectangle. It is now an engine: a cab with a window and a roof, a smokestack with two puffs, a headlamp, a stripe and wheels, coupled to the letter cars. The whole train is nudged in so the engine no longer touches the tile's edge.

## v181 — A mown lawn for the friends' garden (2026-10-18)
- The friends' garden field was a flat green slab. It now has diagonal mowing stripes and a scatter of grass flecks. The stripes use the dark leaf green, so they show on both the day and night field colours.

## v180 — Pond life on the bank (2026-10-18)
- The pond games' bank was a plain green band. It now has cattail clumps at both edges, pebbles and grass tufts. They stay on the bank, so the open water is left clear for the answer cards.

## v179 — Leaves on the Word Tree (2026-10-18)
- Each Word Tree branch now ends in a twig with a small leaf, so the limbs look alive instead of cut off. On phones, where every branch runs the same way, the leaf always sits at the left tip.

## v178 — A jetty with a boat (2026-10-18)
- The river jetty landmark was one wooden slab on two posts. It is now built from parts: seven planks with nail heads on a beam, two posts standing in a pool with water rings, a mooring post with a coiled rope, and a little coral rowboat tied alongside. The flag stays at the shore end. The old version is kept as `landingV115`.

## v177 — A wall calendar for stamps (2026-10-18)
- The stamp calendar was a flat grid in a frame. It now hangs like a wall calendar: a row of gold binder rings along its top edge and a string up to a nail. Missed days are still plain numbers, with no marks or crosses.

## v176 — A bound sticker album, and two see-through panels fixed (2026-10-18)
- The sticker album now has gold binder rings down its spine and a coral ribbon bookmark peeking out above the page, clear of every sticker slot.
- Fix: the album page and the word bookcase were see-through (sky and hills showed behind the stickers and word cards). The shared paper rule sets `background-image: var(--paper-grain)`, and that variable carries position and size, so it is invalid there and wiped both panels' own gradients. Both are restored with the `background` shorthand. A scan of 34 scenes found no other affected panels (meet, play prompt and party stages are transparent on purpose).

## v175 — A prize ribbon for the stars (2026-10-18)
- The star plaque on the stars and party screens was a plain wooden pill. It now has nail heads at each end, and coral ribbon tails stick out from behind it, so earning stars feels like being handed a prize ribbon. It still shows only the stars earned, never empty slots.

## v174 — Fresh cache stamps (2026-10-18)
- 33 scripts and stylesheets in letters.html still carried stamps from before their last edit (most from 2026-10-09). The service worker fetches through the browser's HTTP cache and matches entries ignoring the stamp, so a device could install a new version with a few old files. Every stale stamp is now 20261018-v174.
- `.qa/stale-stamps.mjs` lists any stamp older than its file. It is a local check, since file times reset on checkout.

## v173 — A gingham picnic blanket (2026-10-18)
- The Feed and picnic blanket was a thin green grid, like graph paper. Its bands are now wide filled stripes that darken where they cross, so it reads as real gingham. The top-left corner is folded back to show the cloth's underside, with its hem stitching.

## v172 — A friendly stopwatch for Burst (2026-10-18)
- The Burst tile (the optional timed challenge) was a bare circle with hands and a flat green play triangle. It is now a built stopwatch with a winding crown, a side button, dial ticks on an inner ring, a coral centre cap and a shine. Three gold sparkles replace the triangle, so the tile reads as a fun challenge rather than a deadline.

## v171 — Sand Table on legs (2026-10-18)
- The Sand Table tile was a tray of grey sand floating in the air. It now stands on legs with a crossbar. The sand is warm gold with combed ripples, a pink scallop and a pebble, and a wooden drawing stick traces the letter.

## v170 — Dot Garden: the dot is a seed (2026-10-18)
- The Dot Garden tile was a white card with an orange ball. It is now a wooden raised bed with the letter drawn as a furrow in the soil. The dot is a golden seed with a leaf, and a dotted path leads it to a ring where it belongs, so the tile shows the game's idea: plant the dot.

## v169 — Letter Studio on an easel (2026-10-18)
- The Letter Studio tile was a flat framed picture beside a slanted rectangle. The canvas now stands on a wooden easel (three legs, a tray with a groove, a top clamp). The sun has rays and the grass has tufts. The crayon is a crayon: a paper wrapper with stripes and a pointed tip, leaning on the tray.

## v168 — A real tree for the Puzzle Tree tile (2026-10-18)
- The Puzzle Tree tile was a lollipop tree (one green circle on a stick) with coloured dots. It now uses the constructed DetailKit tree (clumped canopy, forked trunk, root flare), with four puzzle pieces hanging from it like fruit. The old drawing stays as the fallback if DetailKit isn't loaded.

## v167 — Same Start tile on cards (2026-10-18)
- The Same Start tile was an elephant and a butterfly floating apart with a thin arc. Both now sit on tilted paper cards, joined by a gold dotted arc with a pin at each end, matching the Odd Sound tile.

## v166 — Fuller Beat Drum and Odd Sound tiles (2026-10-18)
- The Beat Drum tile was a drum with three dots floating above it. It now has a second drumstick resting on the head (a matched pair), and a dotted thread links the beat dots into a rhythm.
- The Odd Sound tile was three loose stickers. Each picture now sits on a paper card, so they read as choices. The odd one keeps its tilt and wobble marks.

## v165 — A proper mushroom (2026-10-18)
- The mushroom find was a red cap on a white block. It now has gills under the cap, a skirt ring on a tapered stem, a cap shine, moss at its base, and a baby mushroom beside it.

## v164 — Water for the waterwheel (2026-10-18)
- The waterwheel turned with no water reaching it. A wooden flume on a trestle post now pours a stream onto the top paddles, so the wheel has a reason to turn. The stream is a static shape, so reduced motion needs no change.

## v163 — A mountain you can climb (2026-10-18)
- The mountain landmark's pines were single blobs and its slopes were bare. The pines now have three tiers. The slopes have rock ledges and a pair of boulders. A dotted trail zig-zags up the big peak to a coral flag at the snow line, so the mountain reads as a climb a kid can make, not a wall. The v104 version is kept as `peaksV104`.

## v162 — The paper boat gets a puddle (2026-10-18)
- The paper boat keepsake sat on dry grass. It now floats in a puddle with ripples, has a yellow flag on a toothpick mast, and a coral crayon heart on the hull, as if the child drew it there.

## v161 — A birdbath for the sunflower (2026-10-18)
- The sunflower stood on a plain column with a flat lid. It now sits in a small stone birdbath: two plinth steps, a fluted column, a collar, a bowl of water, and ivy climbing the side.

## v160 — A real toy chest, a bench for friends, raised beds (2026-10-18)
- The toy chest was a rounded box with a pill lid. Now it's built like a chest:
  - bun feet, a planked box with a lip, gold straps with rivets, rope handles and a hasp;
  - open, the lid swings back and the toys sit inside it instead of balancing on top;
  - closed, it has a domed lid with the sprout.
- The friends' spot was a log behind a row of pickets that hid the friends' feet. It's now a painted garden bench (slatted back, seat, armrests, braced legs) and the friends sit on it. Before any friends arrive, two cushions wait on the seat.
- Both flower beds were flat grey pills. They're now raised wooden beds: a soil mound, two planks with nail heads, and capped corner posts. The watering-can bed gains a seedling to water.
- The v103 chest and bench stay in `classic` for A/B.

## v159 — A clawfoot tub (2026-10-18)
- Bath Time's tub was an outline on stick legs. It's now a clawfoot tub:
  - a rolled white rim and a side panel line;
  - a tap with a curved spout and hot and cold handles;
  - gold ball-and-claw feet;
  - a shine.
- Same footprint, so the bubbles and the hidden friend still fit. Test
  added; 768 pass. sw v221.

## v158 — The fishing pail (2026-10-18)
- Letter Fishing's catch bucket was a blue wedge outline on blue water and
  almost vanished. It's now a coral pail with:
  - rounded sides and two bands;
  - water showing inside, with a ripple;
  - rivets and a wire handle with a wooden grip;
  - a shine.
- Test added; 767 pass. sw v220.

## v157 — Family Buses (2026-10-18)
- The buses were a box with two windows and wheels. Each is now a
  constructed little bus:
  - a roof rack;
  - rounded framed windows, with seat positions unchanged so passengers
    still sit in them;
  - a cream stripe;
  - front and back bumpers, a headlight and a tail light;
  - wheel arches and spoked hubcaps.
- A suitcase on the rack was cropped by the bus's frame, so it was removed
  rather than shifting the seats.
- Test added; 766 pass. sw v219.

## v156 — Catch game framing trees (2026-10-18)
- The catch game's two tall framing trees had outline-less lumpy canopies.
  They're now constructed:
  - an inked trunk with bark lines, a lit edge and root flare;
  - forked branches;
  - a clumped lit canopy with leaf ticks.
- A first pass hung red apples on them, which competed with the golden
  letter apples the child is meant to tap. They carry small white blossoms
  instead.
- New ART.md rule 7: decoration never looks like an answer.
- Test added; 765 pass. sw v218.

## v155 — More constructed trees (2026-10-18)
- The orchard game backdrop's fruit trees (a circle canopy on a stick) are
  now DetailKit trees, with night-tinted leaves after dark.
- The harvest project's tree canopy (one blob) is now overlapping lit
  clumps with leaf ticks and two forked branches. The `.craft-canopy` sway
  hook is kept.
- The far-layer tree silhouettes stay as soft masses on purpose (contour
  law: the far layer gets no outline).
- Test added; 764 pass. sw v217.

## v154 — Storybook trees (2026-10-18)
- The storybook backdrop's side tree (a four-circle blob) is now the
  constructed DetailKit tree: apple by day, dark at night.
- `DetailKit.js` now loads before `LettersArt.js` (it has no dependencies),
  so modules that build art at load time can use it.
- Test added; 763 pass. sw v216.

## v153 — Storybook scenes (2026-10-18)
- The living-book pages sat on a flat sky with one hill, and the cover had
  only the friend on a yellow panel.
- The day backdrop now has puffy clouds, a far sage hill, two meadow bands,
  grass tufts, three flowers and a clumped side tree.
- The night backdrop has twinkle stars, dark hills, tufts and a dark tree.
- The cover is the day scene inside a storybook frame: a honey rim, a dotted
  gold inner line and vine-and-blossom corners.
- Test added; 762 pass. sw v215.

## v152 — The pet's nook, furnished (2026-10-18)
- The wardrobe alcove behind the pet was bare: two thin shelf lines, a
  hanger and a mirror. It's now a cosy nook:
  - faint wallpaper sprigs;
  - two real shelves on brackets;
  - folded clothes and a little hat on the left;
  - a jar of buttons and a potted plant on the right.
- The middle stays clear for the pet. I swapped a white arched card for the
  plant because it could read as a tiny gravestone.
- Test added; 761 pass. sw v214.

## v151 — The meet easel (2026-10-18)
- The board where a child first meets each letter (`Art.letterSign`) stood
  on two square posts. It's now a real easel:
  - splayed front legs with a lit edge;
  - a back leg and a crossbar;
  - a chalk tray holding two chalks and an eraser.
- Test added; 760 pass. sw v213.

## v150 — A stall with goods (2026-10-18)
- With the anatomy lens, a market stall shows what it sells. The sticker
  stall (village and album) now has:
  - four tilted sticker sheets laid out on the counter;
  - a star on the gold shelf front;
  - two crates of goods with plank lines and fruit, standing beside its legs.
- Nothing offscreen and no undersized taps at 375×667, 667×375 or 320×568.
  Test added; 759 pass. sw v212.

## v149 — Treasure details (2026-10-18)
I checked all 18 treasures on `.qa/treasures.html`. Most already had enough
detail for their icon size. The three plainest got more:
- **egg:** a zigzag band and more speckles;
- **clover:** now four-leaf, with leaf veins and a lucky sparkle;
- **butterfly:** a segmented body, wing veins, a second pair of spots and
  knobbed antennae.

Test added; 758 pass. sw v211.

## v148 — A real footbridge (2026-10-18)
- The map's footbridges were a deck between flat rails. They now have six
  knobbed posts with sagging rope railings between them, and planks with
  nail heads.
- Test added; 757 pass. sw v210.

## v147 — A real beehive (2026-10-18)
- The map meadow's hive was one rounded shape with two bands. It's now built
  like a straw skep: five stacked coiled rings narrowing to the top, each
  with straw-texture stitching; an arched entrance with a landing board; a
  plank stand on two legs; and a shine.
- The bees and the `.lm-hive` hook are unchanged. Test added; 756 pass.
  sw v209.

## v146 — Constructed orchard trees on the map (2026-10-18)
- The map's orchard landmark used a single ball canopy. It's now the
  DetailKit tree on a grass mound with tufts.
- The kit gains a `hooks` option that wraps the canopy in `.lm-canopy` and
  the apples in `.lm-fruit[data-y]`, so shake-the-tree still sways the
  canopy and drops the fruit. The v104 tree stays as `orchardV104`.
- The orchard's ground scenery (the v115 hay rolls, which read as bread) is
  now little apple crates: planks, a gold rim and apples heaped on top.
- Test added; 755 pass. sw v208.

## v144–v145 — Construction detail: the DetailKit (2026-10-18)
The owner flagged the sticker scenes' trees ("really bad") and huts ("not
enough geometry … a house isn't just a square"), and asked for a
more-experienced rethink. The new rule, in ART.md "Construction detail", is
to build every object from its anatomy, scaled by importance, with variety,
silhouette, story touches and composition.

- **v144:** a new shared `src/letters/DetailKit.js` (loaded, cached and
  tested):
  - **tree:** flared roots, bark, forked branches, a seeded clumped canopy
    (lit and shaded), leaf ticks, apples or blossom;
  - **palm:** a ringed, tapering, curved trunk, long serrated drooping
    fronds with midribs and coconuts;
  - **house:** foundation stones, planked walls with trims, a tiled
    overhanging roof with eaves and a ridge cap, a chimney with smoke, an
    arched planked door with frame, knob, step and lantern, and a window
    with mullions, sill, shutters and a flower box; it has a night variant;
  - **barn:** a gambrel roof, planks, X-braced doors, a hayloft window and a
    hay pile;
  - **boat:** a planked hull with rim and portholes, a mast, two seamed
    sails and a pennant.

  The sticker scenes now use it. Each has one larger main object plus a
  supporting one: meadow with an apple tree, barn and second tree; beach
  with two palms and a sailboat; night with a cottage and a dark tree; oasis
  with two big palms.
- **v145:** the village's corner trees are DetailKit trees, seeded so no two
  match. The pet's cottage gains a chimney with smoke, a door frame, a
  second round window, a lantern, a foundation-stone row and another
  shingle row.
- Tests added; 754 pass. sw v207.

## v143 — Who is playing? (2026-10-17)
- The profile picker's pet and egg cards were plain cream app cards. They're
  now paper in a honey-wood frame, matching the game tiles.
- Refinement. Test added; 752 pass. sw v205.

## v142 — Costume House hub pictures (2026-10-17)
- The Costume House hub reuses the practice tiles, but its screen class kept
  the tile pictures tiny inside big cards. They now fill the card: 96px on
  phones, 124px on big screens.
- Nothing offscreen at 375×667, 667×375 or 320×568. Refinement. Test added;
  751 pass. sw v204.

## v141 — Night scene moon (2026-10-17)
- The night sticker scene's moon gets one shine, matching the village moon
  (v123).
- Both moons' shines now sit on the crescent itself. They had landed in the
  hollow and read as a grey smudge. The village moon's faint glow disc,
  which read as grey on navy, is removed.
- Refinement. Test added; 750 pass. sw v203.

## v140 — Sticker-scene suns (2026-10-17)
- The meadow and beach scenes' suns were plain ringed discs. They now have
  the village sun's eight soft rounded rays and one shine (v122).
- The oasis keeps its big low sunset sun.
- Refinement. Test added; 749 pass. sw v202.

## v139 — Sticker-scene clouds (2026-10-17)
- The sticker scenes' flat outlined clouds are now the same puffy clouds as
  the village (v121): soft lumps, a pale belly and one shine, with no
  outline.
- Refinement. Test added; 748 pass. sw v201.

## v138 — Sticker-scene trees (2026-10-17)
- The palms (beach and oasis) and the meadow apple tree had thin line trunks
  and thin teal fronds.
- The trunks are now inked trunks in honey wood. The fronds are inked
  leaf-green strokes, using an 8 ink and 4 colour pair so they stay within
  the scene's allowed stroke widths.
- The v48 cache-version pin now accepts three-digit sw numbers (v200).
- Refinement. Test added; 747 pass. sw v200.

## v137 — Sticker-scene backdrops (2026-10-17)
In the sticker-scene pictures where children place their stickers:
- the farm barn and the night house swap their pointed gables for rounded
  walls under scalloped dome roofs;
- the sailboat's wedge hull is now rounded with a lit seam;
- the thin square fence pickets become capsule pickets on a rounded rail.

Preview: `.qa/sticker-scenes.html`. Refinement. Test added; 746 pass.
sw v199.

## v136 — Leaf Home branches (2026-10-17)
- In the Leaf Home game, each branch home was a thin stroked line. It's now
  a chunky inked limb with a lit seam, and its leaves have a firmer edge and
  a vein, matching the v135 Word Tree.
- Refinement. Test added; 745 pass. sw v198.

## v135 — The Word Tree (2026-10-17)
- The Word Tree's branches were thin flat bars. Each is now a chunky inked
  limb with a lit top and a darker underside.
- The root seeds become wooden coins with a lit top edge and one shine. The
  seed letters get a soft ink shadow so they stay readable.
- Refinement. Test added; 744 pass. sw v197.

## v134 — The garland posts (2026-10-17)
- The garland keepsake's posts were thin stroked lines. They're now chunky
  inked capsule posts with a highlight seam; the gold knobs are kept.
- Refinement. Test added; 743 pass. sw v196.

## v133 — The jars shelf (2026-10-17)
- The jars keepsake's shelf stood on thin square legs. The legs are now
  chunky capsules, and the shelf board is rounded with a lit top line.
- Refinement. Test added; 742 pass. sw v195.

## v131–v132 — The harvest basket and tree (2026-10-17)
- Checked the four chapter keepsakes (garland, harvest, jars, raft) on
  `.qa/keepsakes.html`. They were already rounded except the harvest's fruit
  basket, a sharp trapezoid. It's now a rounded basket with a gold rim.
- v132: the harvest tree's tapered trunk is now a chunky capsule trunk with
  bark lines, like the village trees.
- Refinements. Tests added; 741 pass. sw v194.

## v130 — The seed bed's watering can (2026-10-17)
- The watering can beside the finished seed bed was a sharp trapezoid. It's
  now a rounded can with a band and a shine, matching the village yard's can.
- Preview: `.qa/bed-preview.html`. Refinement. Test added; 739 pass.
  sw v192.

## v129 — The letter flower bed (2026-10-17)
- The seed bed with the child's three letter signs (a map keepsake and part
  of the boat adventure) sat in a flat brown tray. It's now a rounded wooden
  planter with an inked rim, plank lines and a shine.
- Refinement. Test added; 738 pass. sw v191.

## v128 — Sapling mounds (2026-10-17)
- The little growing plant beside each map stop sat on a flat wedge of soil.
  The mound is now round, with a furrow, a pebble and two grass tufts. The
  four growth stages are unchanged.
- Refinement. Test added; 737 pass. sw v190.

## v127 — Meet screen pencil and eraser (2026-10-17)
- On the meet screen, where a child first sees a new letter, the pencil and
  eraser were sharp-cornered shapes. The pencil now has a rounded body and
  tip with a wood line. The eraser is a rounded two-tone block with a
  sleeve and a shine.
- Stars and party screens checked; no changes needed. Refinement. Test
  added; 736 pass. sw v189.

## v126 — Night bushes stay green (2026-10-17)
- On the night map, the v113 trailside bushes took a dark teal that read as
  grey rocks. They now stay leaf green at night, which still sits naturally
  on the darker night grass.
- Refinement. 735 pass. sw v188.

## v125 — The balloon basket (2026-10-17)
- The visiting hot-air balloon's basket was a sharp trapezoid. It's now a
  rounded woven basket with weave lines and a gold rim.
- Refinement. Test added; 735 pass. sw v187.

## v124 — Tomorrow's bud (2026-10-17)
- The sprout that promises tomorrow's treasure was a thin bud on a flat line
  of soil. It now has:
  - a round soil mound with tufts;
  - two leaves;
  - a chunky closed bud with petal seams and a shine;
  - a faint gold glow;
  - the sleepy "z" kept, so it reads as "something is coming".
- New QA scene: `village-bud`. Refinement. Test added; 734 pass. sw v186.

## v123 — Moon and twinkles (2026-10-17)
- The night village's moon gets a thin gold rim, one shine and a faint warm
  glow, matching the v122 sun.
- The stars are now four-point twinkles in mixed sizes instead of dots.
- Refinement. Test added; 733 pass. sw v185.

## v122 — A friendlier sun (2026-10-17)
- The village sun was a plain disc. It now has eight soft rounded rays, a
  thin gold rim and one shine, matching the sundial and the pet language.
  It has no face, so it doesn't compete with the cast.
- The morning sun keeps its deeper gold.
- Refinement. Test added; 732 pass. sw v184.

## v121 — Puffy clouds (2026-10-17)
- The village's flat single-path clouds are now puffy cartoon clouds: soft
  lumps, a light belly shade and one shine, with no outline because the sky
  is a mass.
- There are two clouds by day. Sunset has one, gold with a peach belly.
- The clouds sit in open sky, clear of the gate's top and the sound button,
  upright and sideways.
- Refinement. Test added; 731 pass. sw v183.

## v120 — The treasure sparkles (2026-10-17)
- Today's treasure in the village sat on a faded white disc. It now sits in
  a soft gold glow with a dotted gold ring and three little twinkles, so it
  reads as "something special here" to a pre-reader.
- Refinement. Test added; 730 pass. sw v182.

## v119 — Village trees and bushes (2026-10-17)
- The village's corner trees and bushes join the pet language:
  - a chunky capsule trunk with bark lines;
  - a lumpy canopy with an ink edge, leaf curls and one shine;
  - apples on the light trees;
  - bushes get leaf strokes and a five-petal blossom.
- A refinement only; the owner asked for no full passes. Test added; 729
  pass. sw v181.

## v118 — The garden island at night (2026-10-17)
- At night the decorate island glowed bright noon-green under a starry sky.
  Its grass, pond and shine now step one shade down the palette ramp.
- The planted treasures keep their own colours and stand out more, so the
  screen's focal point is stronger.
- Also checked at night: the new village and map art, with no changes
  needed. Test added; 728 pass. sw v180.

## v117 — Clean pairs cards; catch basket verified (2026-10-17)
- On the pairs game's green-framed cards, the v109 stitched inset drew as a
  heavy dark dashed ring. The pairs cards no longer get it; the pond letters
  and practice tiles keep it.
- Verified the catch game in the game itself, showing the v116 basket. New
  scene parameter: `play` takes `act=<game>`.
- Test added; 727 pass. sw v179.

## v116 — The feed and catch basket (2026-10-17)
- The chapter feed game's basket (also the front of the catch game's basket)
  was the old angular one. It now matches the v107 seed basket: a round woven
  body with a colour-matched weave, a chunky gold handle and rim, a shine and
  a sprout.
- Test added; 726 pass. sw v178.

## v115 — The map's land scenery (2026-10-17)
- The per-land ground scenery on the later map now uses the pet language:
  - the orchard's dashed furrows become little inked hay rolls with an
    apple;
  - the peaks' rocks get an ink edge, a seam, a shine and a pebble;
  - the river's reed dashes become rounded leaf blades on a sandbank.
- Lagoon water patches and night firefly glows were already soft and stay as
  they are.
- Checked the orchard, river and later lands in the game (the `home-3` scene
  now takes `done=N`). Test added; 725 pass. sw v177.

## v114 — Rounder practice tiles (2026-10-17)
A sheet of every practice-garden picture tile (`.qa/practice-tiles.html`)
showed which ones were still boxy or sharp. Fixed:
- Letter Fishing: the square pond is now a rounded pond with an ink edge,
  ripples and a lily pad.
- Feed: the trapezoid basket is now a rounded woven basket with a gold rim.
- Costume House: the sharp gable is now a scalloped dome with a gold knob.
- Busy Market: the box and wedge awning are now a rounded stall with a
  striped scalloped awning.
- Sound Sort: the trapezoid pots are now rounded pots with gold rims.
- Word Gap, Sound Lab and Workshop: square bars and panels are now rounded.

Some tiles render blank on the sheet because their art comes from game
modules the sheet doesn't load; in the game they draw normally. Test added;
724 pass. sw v176.

## v113 — Round bushes along the map trail (2026-10-17)
- The map's quiet edge scenery was pale, spiky leaf clusters with sharp tips.
  Each one is now a round chunky bush with three soft lobes, an ink edge, one
  shine and little leaf strokes, plus a tiny five-petal flower (colour varies
  per stop) and two pebbles. At night it takes the night green.
- A first try used a dark teal fill, which read as grey rocks, and fold lines
  that looked like a frowning face. Both are fixed.
- Test added; 723 pass. sw v175.

## v111–v112 — The friends' fence and the garden island (2026-10-17)
- **v111:** the friends' garden fence swaps its pointed pickets on thin rails
  for capsule pickets with an ink edge and a highlight seam on a rounded
  rail, matching the village fence.
- **v112:** the decorate garden's island was a plain mint slab with flat dirt
  patches. It's now a chunky rounded island in the pet language:
  - a flat grass top with one shine and colour-matched grass strokes;
  - a thin soil band with a layer line and pebbles;
  - the pond with ripples and a lily pad;
  - tufts and three small flowers around the rim.

  Every planting space sits on the grass, including in the sideways layout.
  The old island is kept as `landscapeClassic`.
- Nothing offscreen at 375×667, 667×375 or 320×568. Test added; 722 pass.
  sw v174.

## v110 — The pond jetty (2026-10-17)
- The jetty where found letters land, on the most-played board, gets the
  pet-language treatment:
  - rounded posts with a lit band;
  - a chunky deck with a dark drop, a lit top edge, plank seams and faint
    grain;
  - empty slots become soft rounded nests.
- Test added; 721 pass. sw v173.

## v109 — UI touches in the pet's language (2026-10-17)
A preview (`.qa/ui-pet-language.html`) showed the shared UI already sits in
the right shapes after v65–v100. It only lacked the detail the world props
now carry, so this is a light pass:
- the wooden pills (tabs, the star chip, shelf arrows, savings plaque) get a
  little grain and one soft shine, layered as backgrounds so sizes and states
  are untouched;
- paper cards (pond letters, memory cards, practice tiles, second-look
  cards) get a faint stitched inner border.

A first try set the pond's letter cards to `position: relative`, which broke
their absolute placement and pushed a card off the board. That's fixed, and
the test now guards against it. Nothing offscreen at 375×667 or 667×375.
Test added; 720 pass. sw v172.

## v108 — The pond-corner reeds (2026-10-17)
- The reeds in the corner of most chapter-game screens are redrawn to match
  the map's pond (v104): chunky cattails with an ink edge and a seam, rounded
  blades with a midrib, grass tufts and a ladybird. They still take the v92
  night colours.
- The origami paper boat stays sharp on purpose: paper folds are its subject,
  like stars and glyphs (geometry audit exemption).
- Test added; 719 pass. sw v171.

## v107 — Land gates and the seed basket (2026-10-17)
- The map's land gates now match the v104 landmarks: a chunky rounded pole
  with a stone foot and a gold knob, and a soft banner with a scalloped hem.
  The banner and roll hooks are kept, so the arrival unfurl still plays.
- The seed basket (map meadow stop, picnic adventure, garden keepsake) is
  now a round woven basket with a colour-matched weave, a chunky gold handle
  and rim, and sprouts peeking out.
- Preview: `.qa/gates-basket.html`. Test added; 718 pass. sw v170.

## v106 — One sticker stall everywhere (2026-10-17)
- The sticker album and the stand dialog still drew the old spindly room-art
  stand. Both now use the village's pet-language stall through
  `standArt(size)`, which falls back to the old stand.
- The album's supply row still fits at 375×667, 667×375 and 320×568 with 0,
  3 or 6 stars. Test added; 717 pass. sw v169.

## v105 — The whole village in one language (2026-10-17)
- The village's small landmarks are redrawn in the same detailed pet
  language:
  - the yard has a soil bed with furrows, a flower sprout and a watering can
    with a spout and droplets;
  - the stepping stones are rounded pebbles with a paw print, and walked
    stones turn gold;
  - the sundial is a smiling sun with rosy cheeks and soft petal rays on a
    rounded pedestal;
  - the flower bed has three five-petal flowers with leaves.
- Tap pads are kept (v96), and the classic art is kept for A/B.
- Nothing offscreen and no undersized tap targets at 375×667, 667×375 or
  320×568. Test added; 716 pass. sw v168.

## v104 — The map in the pet's language, with the detail back (2026-10-17)
The owner reviewed the first redraws and said "some of those shapes are too
basic; the old style had more detail." The pet-language rules stay (round,
chunky, flat colour plus one shine, the pet's ink weight), and the detail is
back in two ways:
- thin 2.4 detail lines in a deeper shade of each object's own colour (the
  colour-matched lines the owner approved);
- small charming parts.

Map landmarks (`LettersMapArt`):
- the orchard tree has a lumpy canopy, leaf curls, bark and roots, and fruit
  with stems and leaves;
- the pond has ripples, a notched lily pad with a flower, cattails with
  blades and a ladybird;
- the lantern has a curled bracket, a flame, glass panes and moths;
- the mountains have scalloped snowcaps, rock lines and round pines;
- the meadow has a banded hive, bees and five-petal flowers with leaves;
- the jetty has plank lines, rope ties and a pennant;
- the bridge has capsule planks and knobbed posts;
- the waterwheel has a rim, spokes, paddles, splashes and stones.

Every toy hook and pivot is unchanged, so shaking the tree, lifting the leaf,
lighting the lantern and spinning the wheel still work. Classic art is kept
as `LettersMapArt.classic.*`, and an A/B sheet is at
`.qa/map-landmarks-ab.html`.

Village (`VillageArt`, the v103 redraws), with the same detail pass:
- the gate has wood grain, a gilt inner line, stone feet, vines and flowers,
  and a dotted medal ring;
- the cottage has leafy roof scallops, a cross-paned window, a flower box, a
  door with planks and knob, and a step;
- the toy chest has planks, gold rivets, a keyhole lock, a striped ball and a
  party hat;
- the fence has a soil rim, picket highlights and flowers;
- the stall has a striped scalloped awning, a gold finial, a bunting cord,
  patterned sticker balls and a gold shelf.

Checks: nothing offscreen and no undersized tap targets at 375×667, 667×375
or 320×568. Test added; 715 pass. sw v167.

## v103 — The village speaks the pet's language (2026-10-17)
The owner asked whether the world fits the pet. It didn't: the pet is a flat,
round, chunky blob with one even outline, while the landmarks were shaded,
straight-edged furniture with six line weights and lots of fine detail. A
side-by-side comp (`.qa/pet-language.html`) redrew five props in the same
colours under four rules, and the pet looked at home among them:
- flat colour plus one shine;
- chunky, round, low-and-wide shapes;
- one ink weight matching the pet (4, with 3 for small parts);
- fewer, bigger parts.

What changed:
- The village's journey gate (a single arch, with the medal still swinging),
  pet cottage, toy chest (open and closed), friends' fence (capsule pickets,
  with friends standing behind) and the new `VillageArt.stall` are redrawn
  under those rules.
- Colours are unchanged. The map, UI and game boards are untouched for now.
- The current art stays as `VillageArt.classic.*` for instant A/B or
  rollback.

Checks:
- No undersized tap targets and nothing offscreen at 375×667, 667×375,
  320×568 or 1024×768.
- Test added; 714 pass. sw v166.

## v102 — Round joins everywhere (2026-10-16)
This is step 1 of the shared shape language from
`reviews/geometry-audit-2026-10-16.md`. It's style-independent: it holds for
every direction in `.qa/style-explorations.html`, and no colours, materials
or shapes change.
- About 700 outlined shapes met at sharp mitred corners, so props read as
  cut from tin beside the round pets.
- One rule now gives every SVG outline in the game a round join. CSS
  outranks the presentation attribute.
- The only square-cornered prop rectangles (sticker-scene window panes and a
  costume-house block) get rounded corners. Full-scene backgrounds and masks
  stay square on purpose.
- Test added; 713 pass. sw v165.

## v101 — Tap pads stay on screen; an end-game check (2026-10-16)
- The v96 invisible tap pad around the stepping stones (bigger once the walk
  is finished and shows its star) reached past the bottom edge. Pads are now
  nudged back inside the scene.
- End-game states all hold up and fit at 375×667, 667×375 and 320×568:
  - every chapter done;
  - the friends' garden full of friends;
  - the decorate garden full of treasures;
  - the village gate showing its finished star.
- Test added; 712 pass. sw v164.

## v100 — A trophy for a full album (2026-10-16)
Collecting every sticker is a big achievement for a young child, but a full
album was marked by a lone, small plain star.
- It now earns a gold rosette (`ALBUM_ROSETTE`): a scalloped gold medal with
  coral and sky ribbon tails and a big star. It has a soft gold glow and a
  gentle sway, and reduced motion keeps it still.
- New QA scenes: `album-full`, plus a global `stars=N` wallet override.
- Nothing offscreen at 375×667, 667×375 or 320×568. Test added; 711 pass.
  sw v163.

## v99 — The album row fits once you have stars (2026-10-16)
Staging the sticker stand with saved stars (new scene parameter `stars=N`)
found a layout bug. Once a child had stars, the album's supply row (star
count, stall with savings, scenes button) overflowed a 375px phone, so the
count and the scenes button were sliced by the screen edges. Sideways, the
column was too tall and the scenes button fell off the bottom.
- Narrow screens keep one row with tighter gaps and a smaller stall, scenes
  button and chip. There's an extra step down at 360px or less.
- Sideways, the star count and the scenes button share a row above the stall.
- The stall's "★ 5" ready tag was a white app pill. It's now a gold tag on
  wood with a soft glow.
- Nothing offscreen at 375×667, 320×568 or 667×375, with 0, 3 or 6 stars.
  Today's walk "walked" states were verified too (`walked=N`).
- Test added; 710 pass. sw v162.

## v98 — A sleepy yawn at night (2026-10-16)
- The pet rig gains a `yawn` action: eyes squeeze shut, the mouth opens wide,
  and there's a slow stretch with the head back (1.4s).
- In the village at night the pet yawns every 14–22 seconds while idle. It
  never yawns while dozing, and reduced motion skips it.
- It's a gentle cue that it's nearly bedtime, never a nag or a lock.
- New scene parameter `wait=ms` for capturing mid-animation. Test added; 709
  pass. sw v161.

## v97 — Fireflies come out after sunset (2026-10-16)
The ambient creatures (butterflies by day, fireflies at night) were picked
once, when the game started. A child who started before 7 pm and kept
playing saw daytime butterflies flitting under the stars.
- Each screen change now checks the phase. If it has crossed between day and
  night, the creatures are re-picked.
- Reduced motion still turns the layer off.
- Checked the village at 12:00 (butterflies) and 22:00 (fireflies). Test
  added; 708 pass. sw v160.

## v96 — Easy-to-hit landmarks (2026-10-16)
On small or sideways phones the whole village scales down. The sundial, the
stepping stones, the flower bed, the yard and today's find shrank to 26–38px
on screen, too small for a 3-year-old's finger, so taps "did nothing".
- After layout and on resize, every landmark (plus the find and the bud) gets
  an invisible tap pad. It's sized from that landmark's own on-screen scale
  so it's at least 52 screen px.
- The pads are transparent, but `fill-opacity` 0 still catches taps. The art
  is unchanged.
- The size check finds no landmark under 44px at 375×667, 667×375 or
  320×568. The grown-up dot stays small on purpose.
- Test added; 707 pass. sw v159.

## v95 — Seeds that show on wood; a first-run check (2026-10-16)
- On the meet screen's wooden board (v80), the pale "still to come" seeds
  were tan on honey wood and nearly vanished. On wood they now get a
  dark-wood outline and a paper fill.
- I checked the first-run village with nothing finished: the toy chest is
  closed with a sprout on it. Tapping it gives a soft wiggle and a seed
  sound, then a hand points to the journey gate. That's a redirect, not a
  "no", so it stays as is.
- Test added; 706 pass. sw v158.

## v94 — The friends' garden at night (2026-10-16)
The friends' garden kept a pale daytime sky strip and a noon lawn under the
starry backdrop.
- At night its little sky is indigo with a few stars.
- The meadow and beds drop one step down the green ramp. They stay bright
  enough that every friend and sign reads clearly.
- The beds keep their ink frame and grass-tuft pattern: only
  `background-color` is overridden.
- Also checked at night and unchanged: the decorate garden (the lit lawn is
  the focal point), today's walk and the word tree.
- Test added; 705 pass. sw v157.

## v92–v93 — A cozy night (2026-10-16)
At night the pond turned a flat slate-teal (indigo into dark green), and the
land below it kept bright daytime hills and a pale river under a starry sky.
Murky water and mismatched light read as gloomy, not cozy.
- The night pond is now moonlit: indigo at the top, a clear moon-blue middle,
  and the moon's soft gold reflection lying on the surface in two ripples.
- The pond and garden land (`LettersGardenArt.backdrop`) takes the palette's
  night ramp at night, through a hex map applied to that layer only. Daytime
  is unchanged.
- Checked at 22:00 and 12:00 in the pond and Feed. Test added; 703 pass.
  sw v155.
- v93: the shore reeds and the boat's little island join the night ramp too.
  The white paper boat stays white and reads as catching the moonlight.
  Test added; 704 pass. sw v156.

## v91 — Nobody waits alone (2026-10-16)
The "letters didn't load" screen (`renderMissingItems`) was the coldest in
the game: a flower in a plain disc and a retry button, with the top bar
floating mid-screen because the loading screen centres everything.
- The top bar now sits at the top.
- The pet waits beside the flower, which now sits in a wooden coin.
- New QA scene: `missing`. Checked on a phone upright and sideways. Test
  added; 702 pass. sw v154.
- I also confirmed two things are fine as they are:
  - the pet's "inspect" reaction raises its brows (curious), never frowns;
  - Catch's centring `translate` outranks v68's resting state, so nothing
    jumps.

## v90 — Rooms at tablet scale (2026-10-16)
- On big screens, the album's plank tabs (78×68), the wardrobe tabs (84×64,
  46px icons) and the star chip grow to match the larger panels, which had
  dwarfed them.
- Nothing offscreen at 1024×768 or 768×1024. Test added; 701 pass. sw v153.

## v89 — The map keeps the time of day (2026-10-16)
The journey map only had a night version, so at sunset the games and the
village glowed while the map sat at noon.
- A soft light wash now sits over the map: coral at sunset, pale gold in the
  morning, fading out by mid-screen so the stops keep their colours.
- The wash is `.lg-home::after`. It can't be tapped and sits between the map
  (z 1) and the top bar (z 5).
- A first try set the map scroller to `position: relative`, which broke its
  full-screen layout. The test now guards against that.
- Test added; 700 pass. sw v152.

## v88 — The village keeps the time of day (2026-10-16)
The game screens follow four phases, but the village backdrop only knew day
and night. A child playing after school saw a pink sunset in every game and a
noon sky at home.
- `VillageArt.backdrop` now takes `phase`:
  - morning is a pale gold sky with a deeper gold sun;
  - sunset is coral fading to gold, with the sun low and warm over the far
    hills and a gold-lit cloud.
- Day and night are unchanged.
- Checked at 7:00, 12:00, 17:00 and 22:00 using the `hour=` scene parameter.
  Test added; 699 pass. sw v151.

## v87 — Step tiles at tablet scale; night check (2026-10-16)
- On big screens, the chapter step tiles grow to match the v86 prompt row:
  in-game boat tiles 46×42, and the stars and party rows 52×46.
- The scene harness takes `hour=N`, which overrides the iframe clock. At 22:00
  the village, map, a game and the album all hold up at night, and the wood
  and seeds read on the dark sky.
- Nothing offscreen at 1024×768 or 768×1024. Test added; 698 pass. sw v150.

## v86 — The chapter prompt at tablet scale (2026-10-16)
The v85 big-screen rule now covers the chapter games' prompt row as well.
- On screens at least 700×700:
  - the pet is 124×140;
  - the speech bubble is 96px tall, with a 60px glyph and a 36px speaker;
  - the seeds are 14×18, with 17px leaves.
- The boards still fit, including the miss state with the second-look strip.
- Nothing offscreen at 1024×768, 768×1024 or 820×640. Test added; 697 pass.
  sw v149.

## v85 — Big screens get a bigger friend (2026-10-16)
On a tablet, the practice games' pet was about 40px beside a 500px board, and
the progress seeds were specks. The companion who cheers every right answer
barely registered.
- On screens at least 700×700:
  - the heading grows, with the pet at about 104px;
  - the "hear it" card is 96px tall, with a 48px icon;
  - the practice seed rows grow to 15×19 seeds and 18px leaves.
- Nothing offscreen at 1024×768 or 768×1024. Test added; 696 pass.
  sw v148.

## v84 — The pet stays on a sideways phone (2026-10-16)
In the sideways layout the pet and the "hear it" card stack in the left
rail. An older short-screen rule (letters.css, max-height 650px) pinned the
practice heading to 72px, so the stack overflowed upward and the pet slid
behind the home button. Most practice games on a sideways phone had no
friend cheering or leaning in after a miss.
- The rail's column now takes its height from the rail.
- The pet is back above the card in Beat Drum, Build Letter, Dot Garden and
  the others. Feed's own big pet is unchanged.
- Nothing offscreen at 667×375. Test added; 695 pass. sw v147.

## v83 — Every row grows; Build Letter fits (2026-10-16)
I spot-checked 14 more mini-games at 375×667 (toy box, listening, puzzle,
shadow, workshop and book games).
- The last old orange-dot progress rows join the v69 seed row: puzzle
  (`.pz-progress`), friend-find, sand, water garden and the reading-time dots.
- Build Letter's three pieces wrapped to two rows on a 375px phone and pushed
  the seed row off the board. Short portrait screens now use 64px pieces on
  one row. Checked at 320×568 too.
- The word games (Twin Crown, Word Gap, Listen Find) need finished chapters'
  words. The `toy` QA scene now takes `done=N`, and all three fit with seed
  rows.
- Test added; 694 pass. sw v146.

## v81–v82 — Practice group chips; toy-box fixes (2026-10-16)
- Each practice-garden group's picture chip (heart, ear and so on, `.pg-chip`)
  was a plain white circle. It's now a paper coin in a honey-wood rim, like
  the party guests and the walk's stones.
- Spot-checking six toy-box games found two problems, now fixed (v82):
  - The v76 speaker badge doubled up when the "hear it" card is already an
    icon (the speaker in Beat Drum and Odd Sound, the eye in Spot the
    Change). Icon-only cards drop the badge; Workshop's drawn letter keeps
    it.
  - Family Buses' three buses (each up to 26% of the screen height) pushed
    the seed row off the board on a 667px phone. Short portrait screens now
    cap them at 22% (`letters-toybox.css`).
- Tests added; 693 pass. sw v145 (v82).

## v80 — Meet seeds on wood (2026-10-16)
- The boat chapter's meet seed row sat in a white app pill. It now sits on a
  small honey-wood board, like the stars plaque.
- Test added; 691 pass. sw v143.

## v79 — Star spots waiting for stars (2026-10-16)
A chapter not yet played shows three star spots on its stop's wooden board,
as an invitation. Drawn as pale grey stars on honey wood, they read like
"0 of 3".
- They're now carved star hollows in the board (`.map-star-off`: dark wood
  with a honey edge), like the sticker stand's savings (v70): places waiting
  for stars.
- The played-chapter rules are unchanged: only earned stars, and at least
  one.
- Test added; 690 pass. sw v142.

## v78 — The first choice, on a painter's tray (2026-10-16)
A child's very first choice is their friend's colour, and the paints sat in
a white app pill.
- They now sit on a small wooden painter's tray, lit top-left, with an ink
  outline and a dark drop.
- The picked paint wears a bright paper ring and lifts 2px. Gold would have
  vanished against the honey wood. Reduced motion drops the lift.
- No offscreen buttons at 320×568 or 667×375. Test added; 689 pass. sw v141.

## v76–v77 — The "hear it" card speaks; every progress row grows (2026-10-16)
The practice games' letter card (`.practice-replay`) replays the sound, but
it was a cream app card, so a child couldn't tell it was a button.
- It's now paper in a honey-wood frame, like the game tiles.
- A small gold speaker badge sits on its corner, the same gold "tap to hear"
  disc as the pet's bubble (v74).
- The badge is a pseudo-element with an inline SVG in palette inks.
- Checked in Feed and Garden Paths: the badge sits clear, and Dot Garden
  hides the card by design.
- The last progress rows join the v69 seed row:
  - delivery and toy box use the standard on/done states;
  - Dot Garden and Garden Paths use "on" to mean filled, so it shows as a
    leaf;
  - Dot Garden's "letters explored" row shows seeds, then a leaf per letter
    found.
- The old 9–10px rings are now 10×13 seeds.
- Tests added; 688 pass. Stylesheet stamp v77; sw v140 (v77).

## v75 — Today's walk joins the village (2026-10-16)
The walk's stones were plain white discs on a thin grey dotted line.
- The line is now the village's sand trail: a sand ribbon with a soft edge
  and pebbles.
- Each stone is a paper coin in a honey-wood rim, lit top-left.
- A walked stone glows gold with its green check. The next stone keeps its
  warm pulsing halo, so "go here" still reads first.
- The friends' book reader arrows (`.fb-nav`, `.lb-nav`) faded to 35% at the
  ends of a book. They now rest as paper too (the v73 rule).
- Test added; 686 pass. sw v138.

## v74 — "Hear it again" looks alive (2026-10-16)
The speaker in the pet's speech bubble was drawn at 55% ink. That's grey,
the colour of a switched-off control, on the thing a pre-reader most needs to
know they can tap.
- It's now full ink on a soft gold disc, without growing the bubble.
- The village gate's letter medallion (`VillageArt.gate`) gets the v66
  map-coin light: a dark wood drop, a lit rim on the upper left in its own
  hue, a shade on the lower right, and a recessed paper face.
- Tests added; 685 pass. sw v137.

## v73 — "Nothing more this way" rests, it doesn't fade (2026-10-16)
- The remaining disabled buttons rest as quiet paper at full opacity with a
  faint frame, like the wardrobe arrows (v72). A washed-out button reads as
  broken, or as "not for you". They used to drop to 30–45% opacity:
  - the decorate shelf arrows;
  - the ayah reader's back and next at either end;
  - used delivery help buttons;
  - the map's play places;
  - every `.practice-button`, such as the garden's undo and remove.
- The decorate shelf arrows themselves are wooden now.
- The garden's undo, remove and done icons were never centred: an inline SVG
  sat on the text baseline, low and to the left. They're grid-centred now.
- The ayah reader's dots join the v69 seed row.
- Test added; 683 pass. sw v136.

## v72 — The wardrobe catches up (2026-10-16)
The wardrobe still had app-style pieces: cream category tabs (the open one
mint), a white "★ 3" pill, and cream shelf arrows that faded to a cold 40%
grey at the end of the shelf.
- The tabs are now planks. The open tab is paper, lifted, on gold, the same
  as the album.
- The star count (`.lg-star-chip`, also used on the album) sits on a small
  wooden plaque, with a gold star and a white number outlined in ink.
- The shelf arrows are wooden buttons. An arrow with nothing more to show
  rests as quiet paper (full opacity, faint frame) instead of a ghost.
- Sizes are unchanged. Reduced motion drops the tab lift.
- No offscreen buttons at 320×568 or 667×375. Test added; 682 pass. sw v135.

## v71 — The album as a colouring book (2026-10-16)
A sticker not found yet was a solid beige blob on a beige die-cut in a beige
slot, so a fresh album was a wall of dust.
- Each missing sticker is now its own line drawing in warm tan on white
  paper, in a dashed spot, like a colouring page waiting for its colours.
- The faces show (the sun smiles, the bee and cat look back), so the page
  reads "things to find", not "things I don't have".
- Found stickers are unchanged and still stand apart with colour, tilt, lift
  and sparkle.
- CSS override only; the old ghost pins still hold. Test added; 681 pass.
  sw v134.

## v70 — Star savings in carved wood (2026-10-16)
The sticker stand's five pips fill toward the next visit. With few stars
they were grey outlines in a pale app pill, a row of "you have none".
- They now sit on the map plaque's honey-wood board (lit top edge, ink
  outline, dark drop).
- An empty spot is a star-shaped hollow carved into the wood, waiting like a
  coin slot. A saved star sits in its hollow in gold.
- The chapter's friends at the party were in translucent white app circles.
  Each is now a paper coin in a honey-wood rim, lit top-left, with the
  touchable ink edge, matching the map stops.
- Tests added; 680 pass. sw v133.

## v69 — Progress that grows (2026-10-16)
The round dots under the prompt (and in the meet, story and leaf games) were
thin app rings, only 9px on the play screen.
- Now the row is a little seed row:
  - rounds still to come are pale seeds;
  - the round you're on is a gold seed with a soft glow;
  - every finished round has sprouted into a green leaf with a dark-green
    outline.
- Progress reads as "look how much has grown", never as empty slots.
- The play-screen dots grew from 9px to 10×13 (leaves 12px).
- The shapes are border-radius only, with no markup change.
- Preview: `.qa/dots-preview.html`. Test added; 678 pass. sw v132.

## v68 — A wrong pick rests, it doesn't die (2026-10-16)
After a miss, the scaffolded retry quietly takes the child's pick out of play
(`.is-scaffolded`, used across the choice games). It dropped to 10% opacity
and went grey, leaving a lifeless husk on the board, which broke the v57
rule: "fade in its own colours, never to a sad grey".
- Now the pick settles to rest in its own colours: 86% size, 6px lower and
  30% opacity. It's still untappable.
- It uses the independent `scale` and `translate` properties, so it combines
  with each game's own positioning transform and nothing jumps.
- Reduced motion keeps only the fade.
- The delivery game's removed wrong packet (`.delivery-packet.is-removed`,
  previously 22% opacity) gets the same resting treatment.
- Test added to `step-stones-v66`; 677 pass. sw v131.

## v67 — The second look (2026-10-16)
After a mix-up, the game shows the child's pick beside the letter it wanted.
That strip was a cream app pill with an arrow between the two letters. The
arrow read like a correction slip: "yours → the right one".
- Now it's a small spot-the-difference: a paper slip in a wood frame with two
  equal paper cards and a magnifying glass between them (`LOOK_GLASS`).
- The wanted letter is lit gold and bobs twice. The dots and marks feature
  rings still show.
- The child's pick is never crossed out, faded or marked. It's shown as an
  equal, because the two letters really are look-alikes.
- Sizes are unchanged. Reduced motion drops the bob.
- Test added to `step-stones-v66`; 676 pass. Stylesheet stamp
  20261016-v67; sw v130.

## v66 — Step tiles and map stops join the art system (2026-10-16)
The last two app-kit shapes on the journey were the chapter step pills
(cream rounded rectangles, grey hairline, mint "done") and the flat map
medallions. Both now use the village's materials and its single light.
- **Step tiles** (`styles/letters-materials.css`, both the plain chapter row
  and the adventure row): small paper tiles in honey-wood frames, joined by a
  dotted sand trail.
  - Finished steps glow gold, and the trail between them turns gold too.
  - The step you're on is paper in a full ink frame, lifted 2px, with a soft
    gold halo. The plain row now marks it (`is-now`, `aria-current="step"`).
  - Upcoming steps are quiet paper in a faint frame. They aren't dimmed or
    locked.
  - The check badge is a green leaf-coin with an ink ring.
  - Sizes are unchanged. Reduced motion drops the lift.
- **Map stops** (`Art.mapStop`):
  - A carved coin sits in the land with a contact shadow and a dark wood
    drop.
  - Light comes from the top left: a lit rim on the upper left and a shade on
    the lower right. The current stop's shade comes from its own hue.
  - The paper face looks set into the coin, with its own shade on the upper
    left edge.
  - The stars sit on a honey-wood board with a lit top edge and a darker drop.
  - Locked seed stops stay flat and recessive, as before.
  - The partway arc, the "only earned stars" rule and the "at least one star"
    rule are unchanged.
- Checks:
  - headless shots at 375×667, 667×375 and 1024×768 (map, stars, play,
    meet);
  - nothing offscreen;
  - new test `step-stones-v66` (3); 675 pass.
- Stylesheet stamp 20261016-v66; sw v129.

## v65 — The art system: map, materials and boards (2026-10-16)
The rest of the approved art-direction plan, after the village.
- **The journey map**, now "the land beyond the gate":
  - The ground was a left-to-right grass, soil, grass gradient that read as
    vertical stripes down the whole map. It's now one base colour with soft
    hill terraces between stops (a lit rise and a shaded fold) under the
    lit-from-the-left wash; the darker left verge is much softer.
  - The trail was a thin dotted ribbon. It's now the village's sand trail
    (a mass, no contour) with pebbles.
  - Repeated landmarks vary in three sizes and mirror every other pair, so
    there are no identical copies. The tappable toy landmarks gain ink
    outlines on their main masses (the fruit tree's canopy and trunk, the
    reed pond).
  - The mastery plant's seed stage read as a brown lump on a brown mound.
    It's now a gold seed peeking out with a two-leaf shoot.
  - Rainbow days no longer lay a sky rainbow across the map's grass; it
    still shows in the village, which has a sky.
- **UI materials** (new styles/letters-materials.css, loaded last): the
  interface is made of the garden's materials instead of app cards:
  - **cards and panels:** paper with a faint grain in a honey-wood frame
    (ink outline, lit top edge, darker wood drop);
  - **album tabs:** wooden planks; the open one is paper, lifted, on gold;
  - **the reward star pill:** a wooden plaque the gold stars sit on;
  - **trays and shelves:** a wooden shelf with a lip;
  - **round buttons:** a paper disc on a wooden rim.
- **Play boards:** every practice game's stage is the same paper board in a
  wooden frame. Toy and listening games (bath, puzzles, Ears First, the
  Costume House, the Word Tree) used to float on the sky. The frame is drawn
  with shadows only, so it takes no layout space, and has no padding on
  short screens. The off-screen check passes for 20 games at 320×568,
  375×667 and 667×375. The first version did push two games off a 320px
  phone; that was caught and fixed.
- Tests: art-system-v65.

## v64 — The Garden Village (2026-10-16, owner-approved art direction)
- From the art-direction review (docs/letter-garden/reviews/art-direction-
  review-2026-10-16.md): the characters were illustration-tier, but the
  props were clip-art and the UI an app toolbar. The home screen was a
  scrolling path plus eight cream buttons. **Home is now a place**, and
  every destination is a landmark drawn to the cast's tier:
  - **The journey gate:** a wooden arch whose swinging medallion holds the
    next letter in its chapter colour, with the one warm light pool. It
    leads to the journey map.
  - **The pet's cottage** (leaf roof, round door) is the wardrobe; **its
    yard** (a dug bed and watering can) is My garden.
  - **The sticker stall** is the album, with a star badge when stars are
    saved.
  - **The friends' bed:** a picket fence with the latest friends standing
    in it.
  - **The toy chest** is the practice garden. Before the first chapter it
    holds a seedling, wiggles, and the hand shows the gate.
  - **Stepping stones** (today's walk), **the sun sundial** (daily practice)
    and **the flower bed** (check-up) appear when available.
  - Today's treasure and tomorrow's bud live in the village grass. Tapping
    the treasure flies it into the stall. The pet stands on the trail,
    rigged, and looks at whatever is tapped.
- **The art system:**
  - one light (the sun at top left, a sunlight wash, contact shadows to the
    lower right);
  - masses (sky, hills, banded ground, the sand trail) have no contour;
  - landmarks use chunky warm ink and shaded fills;
  - one warm light pool;
  - chrome is only sound and the grown-up dot.
- **Three compositions:** upright phone, tablet (4:3 to 3:2, landmarks about
  20% bigger) and wide sideways phone. Seen on real renders at 375×667,
  1024×768 and 667×375.
- **The journey map is now one level in.** Its two header rows are hidden;
  a cottage button leads back. Home inside a chapter (a session with a
  gameIndex) returns to the map; everywhere else, including toys, hubs and
  rooms, it returns to the village. Opening the game and hatching land in
  the village.
- Files: src/letters/VillageArt.js (new), renderVillage, routing in
  wireTopBar. Tests: garden-village-v64.

## v63 — The Word Tree: the roots bridge (2026-10-16, owner-approved)
- Quran words come in families that share three root letters. A new album
  tab (a little tree) opens with the Ayah Garden. Its families come from the
  surahs read there, 22 of them with two or more words: عبد has 7 (نَعْبُدُ,
  أَعْبُدُ, عَـٰبِدُونَ…), ربب has 6, then أله, دين, رأي, صلو, أنس, رحم, حمد,
  ملك…
  - **The tree:** each root is a branch, with a seed holding the root
    letters on the trunk and a leaf per word.
  - **Tapping a leaf:** the word is recited (word-by-word audio) and its root
    letters glow orange inside it.
  - **Tapping a seed:** they glow in every leaf on its branch: "these words
    are family".
  - **Growing:** the tree starts with four branches and grows one more each
    new day it is visited (the new branch springs in); a bud shows that
    more will come.
  - **Leaf Home:** a leaf drifts down with its root letters hidden. Which
    branch is its home? A miss reveals the letters; two misses make the
    home glow.
- Roots come from the Quranic Arabic Corpus, already in data/surah-*.json;
  LettersWorlds now keeps them. Root letters are matched letter by letter,
  with hamza seats as hamza and each root letter used once. Outcomes report
  a "root-family" skill that doesn't affect letter strength.
- On phones the trunk runs down the right edge so leaves can wrap across the
  full width. Six album tabs narrow to fit a 320px phone.
- Files: src/letters/WordTree.js (new), renderWordTree / treeState /
  addTreeTab, key quran-trainer:letters:word-tree. Tests: word-tree-v63.

## v62 — The Costume House: positional forms (2026-10-16, owner-approved land)
- A letter changes shape with its place in a word: at the start it reaches
  forward (بـ), in the middle it holds hands both ways (ـبـ), at the end it
  lets go (ـب). The friends "wear a costume" for each place. A violet
  costume-house tile opens in the practice garden's read group once the
  joining chapter (join-1) is done and three letters are known:
  - **Friend in Disguise:** a friend, a picture and its word. Tap where
    the friend hides inside the word, in its costume (letters in the middle
    or at the end come first).
  - **Costume Rail:** a word with one letter missing. Pick the costume of
    that same letter that fits the gap (start, middle or end; non-joining
    letters offer only alone or end). The word becomes whole and is spoken.
  - **Shape Train:** a letter's three costumes ride a train whose couplings
    match their joining tails. The car after the engine couples only behind
    it, the middle car both ways, the last car only in front.
  - After two misses the answer glows. Outcomes report the letter-form
    skill.
- Words are drawn letter by letter, each piece forced into its joined shape
  with zero-width joiners, so a real word reads connected while every letter
  can be tapped and lit. A real render caught a reversed word (`dir=rtl`
  plus `row-reverse` cancel out); fixed and pinned.
- Phase 2, not built: Costume House chapters on the map itself.
- Files: src/letters/CostumeHouse.js (new), renderCostumeHouse, art in
  LettersGardenArt, styles in letters-friends.css. Tests: costume-house-v62.

## v61 — Ears First (2026-10-16, owner-approved strand)
- Listening games that come before letters. Hearing that words are made of
  beats and begin with sounds is the strongest early predictor of reading,
  and every sound game so far also showed a letter. These show only
  pictures and play only words. They're a new "listen" group (ear chip) in
  the practice garden, needing no letters at all:
  - **Beat Drum:** a picture's name is spoken, and the child taps the drum
    once per beat as dots fill; then the word plays again with the dots
    pulsing. Beats come from the vowel marks (one vowel per syllable), so
    بَيْضَة has 2 and عَنْكَبُوت has 3. All 34 picture words were checked in
    pause pronunciation. Rounds never repeat a beat count back to back.
  - **Same Start:** hear فِيل; which picture starts with the same sound,
    فَرَاشَة or شَمْس? On a right answer the two words play together.
  - **Odd Sound Out** (age 4+): three pictures say their names in turn;
    tap the one that starts differently.
  - After two misses the answer glows. Nothing is reported to the letter
    model; this is ears, not letters.
- Little sprouts get Beat Drum in place of Letter Delivery, which needs
  letters. Still nine toys on one screen.
- Files: src/letters/EarsGames.js (new), art in LettersGardenArt, the
  listen chip in LettersGame. Tests: ears-first-v61.

## v60 — Living Friends' Garden (2026-10-16)
- The friends a child brought home used to stand still in a grid. Now up to
  six of them (four on phones, a different group each day) play in a meadow
  above the plots:
  - **Strolling:** every couple of seconds one strolls to a new spot,
    hopping and facing the way it walks.
  - **Meeting:** two that end up side by side dance together and a music
    note rises. Letter siblings that share a shape (ب ت ث, ج ح خ …) get a
    heart instead, quietly teaching that they're family.
  - **Tapping:** a friend dances, calls and says its name.
  - Under reduced motion they stand still, and taps still work.
- The plots of friends still on the way (with their wooden labels) stay
  below the fence.
- Files: StoryGarden.meadowFriends / wireMeadow, styles in
  letters-friends.css. Tests: living-garden-v60.

## v59 — Sticker Scenes (2026-10-16)
- The stickers a child chose become toys. A framed-picture button on the
  album page opens four drawn scenes: a meadow farm, the seaside, a night
  sky and a desert oasis.
  - **Placing:** tap a sticker in the tray (the easiest for a two-year-old)
    or drag it in.
  - **Playing:** drag it anywhere; tap it to make it wiggle; drag it off the
    picture to take it away.
  - **Saving:** each scene keeps its own arrangement (up to 24 stickers), and
    the last scene played opens next time.
  - Nothing is scored and it never runs out.
- Landmarks sit in the middle of each scene so they survive the crop on an
  upright phone. Sideways, the scene picker and tray stand beside the picture.
- Files: src/letters/StickerScenes.js (new), LettersGame.renderStickerScenes,
  key quran-trainer:letters:sticker-scenes, styles in letters-rooms.css.
  Tests: sticker-scenes-v59.

- Coming-back pass (2026-10-16), from a games-industry review
  (docs/letter-garden/reviews/game-design-review-2026-10-16.md):
  - **Practice pays.** Stars came only from beating a chapter game's best
    (about 198 earnable against about 400 of stickers, outfits and pet
    friends), so replays and all 28 toys paid nothing. Each toy now pays 1
    star the first time it is finished each day, 5 a day at most. A gold
    star rises out of the finishing bloom. Farming one toy still pays
    nothing.
  - **Daily treasures.** Each new day the child plays, one small find waits
    on the map below the pet's stop: 16 drawn treasures (shell, feather,
    acorn, maple leaf, pinecone, ladybug, snail, heart pebble, daisy, robin
    egg, starfish, clover, berries, butterfly, crystal, mushroom), bobbing
    with a glint. The pet looks at it. A tap hops it up big and flies it
    into the album, and the album gains a treasures tab: a wooden nature
    shelf with a sparkling "more to find" cubby. No streak; a missed day
    costs nothing; not a currency.
  - **Growing up.** The pet grows at 5 and 15 chapters, but silently. Now
    the party's way home goes through a ceremony: the pet as it was wiggles
    in a ring of sparkles, flashes, and pops in grown, with a fanfare. Each
    stage is celebrated once; pets that already grew get theirs at their
    next party.
  - **A full treasure set** gets gold trim, with a fanfare when its last
    find is picked up. It then opens a golden set: the same 16 on gold
    medallions, on a second honey-wood shelf. The daily find keeps coming
    for a month, not just 16 days.
  - **The map pet is the star.** 68px → 88px on phones (108px on big
    screens). Between taps it lives a little: every 12–20s it sniffs a
    landmark or today's find, waves, hops or wonders. Never while walking
    or dozing.
  - **A daily visitor.** Once letters are met, one of those letter friends
    (a different one each day) stands beside the latest finished stop and
    dances hello when the map opens. A tap makes it dance, call and say its
    name: a daily surprise and a light review, with no question asked.
  - **Focal colour.** The current map stop, where the child goes next, was
    a pale wash while finished stops wore bold gold, so the past shouted
    louder than the next step. It now has the most saturated ring on the
    map (its chapter's hue at 68%/56%) around a bright centre. The album's
    open page is a gold, lifted tab instead of white on cream.
    In My garden, a keepsake waiting to be placed is a warm gold tile (it was
    cream on a cream tray); placed ones stay quiet with their tick. The
    practice garden, stars screen and wardrobe were checked and already lead
    with the right thing (the bed, the orange next button, the pet).
  - **Tomorrow's bud.** Once today's treasure is picked up, a closed pink
    bud sleeps where it was, with a floating z. Tomorrow it is the next
    treasure. That's anticipation without pressure: skip days and the bud
    simply waits. A tap wiggles it and the pet looks.
  - **A balloon now and then.** On about one map visit in four, a hot-air
    balloon drifts across (below the header buttons) with a met letter
    friend peeking from its basket. A tap makes the friend call and say its
    name, with a little confetti. There's nothing to collect; it's "you never
    know what you'll see". Off under reduced motion.
  - **Treasures go in the garden.** Everything found (golden ones too)
    joins My garden's tray as a keepsake, so a child can place the mushroom
    or the ladybug they found. Collections feed each other.
  - **The garden grows with the pet:** 4 spaces, 6 when the pet reaches
    stage 2, and 8 at stage 3 (three or four across, two rows). Old
    4-space layouts keep their places.
    The growing-up ceremony shows this: after the pet pops in grown, a
    little drawing of the garden appears beside the way home, with its two
    new spaces gold-rimmed under a sparkle. Tapping it goes straight to My
    garden.
  - **Special-day finds.** During Ramadan, the day's find is a glowing fanous
    lantern (once); on Eid, a crescent with a star. They sit on their own
    night-blue shelf above the nature shelf, and can be placed in the
    garden. They are not part of the daily set: a missed one simply comes
    next year, and nothing is shown as missing.
- Release checks after the overlap/layout round (2026-10-10): lgSweep 193
  steps / 0 failing; lgPlay 66/66 finished, no errors; 590 tests pass;
  lgLayoutScan clean at 320×568, 667×375, 844×390, 932×430 and 1024×768
  (known false alarms only).
- Release checks: lgSweep 193 steps / 0 failing; lgPlay 66/66 chapter games finished, no errors.
- sw v128 (2026-10-16, v65 art system); sw v127 (2026-10-16, v64 Garden Village); sw v126 (2026-10-16, v63 Word Tree); sw v125 (2026-10-16, v62 Costume House); sw v124 (2026-10-16, v61 Ears First); sw v123 (2026-10-16, v60 Living Friends' Garden); sw v122 (2026-10-16, v59 Sticker Scenes); sw v121 (2026-10-16, coming-back pass: practice stars, daily treasures, growing up); sw v120 (2026-10-13, first-look pass: hatched shells, gift stand, sleeping stars); sw v119 (2026-10-10, after art pass 3: hubs as places, workbench, bookcase, friends garden, nap bed, paint pots, stamps flowers, rehal); sw v118 (2026-10-10, after the art passes: map books, art icons, toy pictures, themed feed icons, keepsake tags, illustrated loading flower); sw v117 (2026-10-10, after the hub/readability/egg changes); before that sw v116 (2026-10-10) so cached devices pick up the late-v58 layout,
  safety-net and loading fixes. Stamp 20261009-v58, sw v115 before that. Tests: no-dead-taps-v58 (7); two older pins
  updated (locked stops are aria-disabled now).


## v265 — Audio reliability and Marin inventory (2026-10-20, local)
- Approved exact Marin recordings take priority even on Quran-word screens carrying a remote recitation path. Uncovered speech retains its existing fallback pending generation and review; this is not complete Marin coverage.
- Expired learning speech cancels the actual player/loading request so a late clip cannot interrupt the next question.
- Beat Drum, Same Start and Odd Sound wait for completed words instead of cutting them off at fixed intervals. Rapid choices invalidate obsolete sequences; leaving a game cancels pending continuation.
- Sound Lab uses visible practice chunks for consonant sukūn and shadda, highlights the selected consonant, and respects a new selection made during the press animation. Alif combinations and remaining ambiguous curriculum requests are still held for teaching review.
- A reproducible inventory covers curriculum, dynamic name chains, all book casts, picture words, Sound Lab and the 11 reading surahs. Recovered ten October 3 Marin files with matching hashes; quarantined for pronunciation review. No candidate is silently installed.
- Sound Lab’s stage now actually widens on short desktop screens, keeping all letter rows inside the viewport.
- Generation package and owner review: `docs/letter-garden/reviews/marin-complete-20261020/`. Hank handoff required because this Codex session has no Dot messaging capability. Production remains unchanged.

## v266 — Toys that follow the child (2026-10-20, local)
- Audio generation/import is parked at the owner's request. The new Hank ZIP has not been imported; the pending v265 work is preserved.
- Shared dragging now owns its return animation. A child can catch a returning piece at its visible position, move it again immediately, or cancel a drag without submitting an answer. Leaving a game releases pointer capture and cancels the return animation.
- Feed, calm Catch, Pairs, letter-form exploration and Letter Delivery now tell the shared drag control when a drop has been accepted. Successful pieces no longer start a competing flight back to their starting place.
- Feed distinguishes the friend from the basket, retains the existing 32px forgiving margin, excludes the tray from drop targets and highlights only the approached receiver. A packet dropped on the pet goes to the pet; a basket delivery leaves the packet in the basket. Tap-then-tap and keyboard delivery remain available.
- Removed two legacy visual/input conflicts: picnic CSS no longer suppresses the delivery animation, and the pet can receive taps. A small receiver anticipation uses the illustration without shifting the button layout. Reduced motion settles immediately.
- Pond keeps the final packet's flight visible before handing off to the reward screen. The source and waiting dock slot do not show duplicate packets during flight. Completion is guarded against repeated taps, missing/canceled animation events and leaving mid-flight; intermediate rounds still start immediately.
- No curriculum, option-count, reward, saved-progress or difficulty rules changed. Existing art and environments retained. This is an interaction pass, not a claim that all games have received a final art pass.
- Validation: 892 automated checks pass. Nine new behavior checks cover interrupted returns, cancellation, accepted feeding, receiver selection, reduced motion, final pond handoff and stale callbacks; existing Pairs/Catch/Delivery checks now assert the accepted-drop contract. Browser play verified Feed through four rounds using drag, tap and keyboard; Pond through its four rounds into the reward screen; Catch, Pairs, Forms and Delivery accepted drops. Layouts inspected at 320×568, 375×568, 375×812, 812×375 and 1440×900. Browser console: no errors during those checks. Palette checker remains report-only with existing art debt; this pass adds no new palette colors.
- Recovery snapshot of all pending work before this pass: `../letter-garden-gamefeel-baseline-20261020/RESTORE.md` from this checkout's root. Test isolation: `.qa/gamefeel-20261020.html` on the separate `letter-garden-gamefeel.localhost` origin. Screenshots: `.qa/shots/gamefeel-*-20261020.png`. Production unchanged.


## v267 — Garden Adventures (2026-10-20, local)

A three-stage adventure now links seed delivery, a child-made letter sign and Water Garden through a chosen butterfly patch or bird nook. Existing curriculum chapters remain in place. The village walk entrance and personal garden reach this route; unfinished older walks remain available.

- Two pictured projects, progress shown through seeds → sign → flowers, a responsive visitor, explicit home / garden / another-adventure finish choices.
- Taught-only plans with a familiar opener and due review; separate listening/matching/help/motor signals. Two-choice visible matching can become two-choice listening, then three choices after independent evidence across sessions. All three activities share one learning-session identity.
- The child's selected drawing and each project's water layout survive reloads. Free play never reports letter mastery or repeats completion rewards. Existing practice payout limits and daily stamps remain in use.
- Water Garden fixes: distinct novice choices, no pre-answer bend hint, guarded speech/replay and arrival callbacks, all free-play channels operable, and a finish control that covers neither a flower nor the playfield.
- Drawing support remains visible for beginners; ordinary matching is distinguished from actual help. Failed activity construction/rescue returns to the route without completing a step.

Verification: full automated suite and desktop/phone/landscape play checks recorded in `V3-GARDEN-ADVENTURES.md`. A 5–8 minute session is the owner-approved pacing target, not measured child playtest evidence. Audio generation remains parked; no production publish.

## v268 — Tactile mini-games and shared learning (2026-10-21, local)

Existing mini-games now carry the garden adventure's support rules into ordinary chapter play. This is a local pass; audio generation and production publishing remain parked.

- Orchard: a framed tree canopy and fruit twigs, calm wrong-fruit feedback, fixed gentle falling speed, and duplicate-touch protection. Stars and correct-answer streaks no longer accelerate falling fruit.
- Matching: cards fit inside the seed tray on short screens; each completed pair grows a small labelled plant. Repeated letters on a later board begin a fresh matching evidence round.
- Building: draggable pieces with a generous 24px landing margin around the next slot, visible receiving cues, retained tap/undo controls, seating motion, and a visible return beat for the incorrect suffix. Cancelling a drag or dropping outside does not count as an answer.
- Joining and splitting: extra pieces depend on successful practice across visits instead of appearing automatically in later rounds. Gesture demonstrations stop after two invitations. Same-kind combinations respond without a penalty. A beginner's split-letter quiz offers two choices.
- Art: richer seed-tray materials and joinery tools, larger bounded picnic packets, a short finished-paper response. Added bench tools yield to result controls on small screens; the established pond, picnic and world scenery remain.
- Learning: familiar practice openers, due/weak review, taught distractors, one session identity across chapter activities, and help carried to later encounters. More assembly pieces and decoys arrive on separate steps. Construction, matching, assistance and independent listening remain distinct. Participation alone cannot refresh answer recency or cancel newer help.
- Reliability: a game that fails to construct or encounters the rescue path returns to retry without awarding a completed activity.

Validation: 934 automated tests pass. Actual browser play checked desktop 1280×720, phone 390×844, small phone 320×568 and landscape 844×390. Played matching retries/drag/completion, building drag/tap/repair, orchard retry/drag harvest, picnic selection/delivery/advance, joining exploration, splitting quiz, and pink finger tracing through the reward handoff. Reduced-motion joining verified. Test origins were separate from the user's saved game. No browser errors observed in those checks. This is simulated viewport testing, not child usability testing or physical-device validation.

Recoverable starting snapshot: `../letter-garden-minigames-baseline-20261021/RESTORE.md` (sibling of this worktree). Review screenshots are local in `.qa/shots/v268-*`. Palette check reports existing repository debt; the new scenery/feel sheets and changed activity art use the established palette.

## v269 — Remaining mini-games and sticker cleanup (2026-10-21, local)

The 25 remaining toy, book, puzzle, shadow, word, hat and workshop games now share the garden's learning support rules. Audio generation/import and production publishing remain parked. Three lower-cost workers handled bounded game families while integration and browser review stayed together.

- Shared practice planning uses taught material, a familiar opener and due/helped review. Beginner choices stay visible, calm and limited to two. Extra choices and puzzle pieces depend on successful evidence across separate visits, rather than appearing because a round or streak increased. Help carries into later encounters in the same session.
- Friend Jigsaw grows from two halves to three strips to four quarters, with no simultaneous decoy increase. Letter Shadows starts with one stationary complete friend. Fishing keeps beginner fish still and a visible reference. Echo Parade keeps the example visible for matching, aligns both lines right to left, and waits for the actual spoken sequence before accepting input.
- Matching, listening and motor participation remain distinct. Replay or unavailable speech cannot become independent listening evidence; obsolete speech callbacks cannot change a newer target. Free painting and scrubbing report participation without a correctness verdict. Each completed pair/jigsaw begins its own evidence round. Unavailable games return without awarding completion.
- Letter Train, Family Buses, Hat Shop, Word Gap, Build Letter and Jigsaw use shared dragging, generous receiving areas, nearby-target feedback and retained tap controls. Outside/canceled drops return without submitting an answer; leaving destroys pending gestures and callbacks.
- Art and layout: warm toy benches, paper book pages, nature boards and a tailor's surface retain the existing world and cast. Bounded tools and props stay clear of play on small screens. Cards have consistent material depth and seating feedback; reduced motion removes the new movement. Jigsaw's landscape layout puts its board beside reachable pieces.
- Sticker scenery now has a large wordless coral rubbish bin. Select a placed sticker and tap the bin, or drag it there. Only that placement is removed: the collection and reusable tray stay intact. Dropping outside the picture restores its position. Switching scenes or leaving cancels an active gesture; saved layouts survive reloads.

Validation: 975 automated checks pass; JavaScript syntax and diff checks pass. All 25 games were opened and checked at 320×568, 390×844, 844×390 and 1280×720. Actual interaction checks covered hat placement, bus boarding, jigsaw drag/tap completion, picture sorting, sticker tap/drag/keyboard removal, outside-drop return, scene switching, reload persistence and reduced-motion bin behavior. Test origins were separate from the user's saved game. These are simulated browser viewports, not physical-device or child usability tests. The full palette checker still reports existing repository debt.

Recoverable starting snapshot: `../letter-garden-remaining-baseline-20261021/RESTORE.md`. Screenshot evidence: `.qa/shots/v269-*`. No curriculum, earned collection or production files were reset.

## v270 — Waterside play (2026-10-21, local)

Continues the broader art/gameplay goal through Letter Fishing and Bath Time. The direction borrows Animal Crossing's relaxed action → visible world response, using Letter Garden's existing paper art, cast and learning rules. Reference: https://animalcrossing.nintendo.com/new-horizons/explore/ . This is progress on the whole-game goal, not a claim that every screen is finished.

- Fishing becomes a small pond with an organic bank, shallow water, reeds, stones and a landing deck. New fish use coral/gold/sky ramps with a clear letter medallion. Small props retain their proportions at different aspect ratios; only background masses stretch. The generic surrounding board is removed from this activity, keeping the existing chapter environment visible.
- A caught fish travels into the pail; its letter remains in the catch tray across rounds. Arrival has a guarded fallback, so canceled animations or duplicate taps cannot create a second catch or completion. Reduced motion settles immediately. Tapping the water makes a brief ripple without recording an answer.
- Fishing now reveals a stationary matching target after unavailable speech, a wrong choice or replay. Replayed/failed prompts never earn independent listening credit, and late speech cannot affect a newer round. No audio asset or generation work was performed.
- Bath Time has a tiled wash corner, a yellow sponge, a smaller irregular foam cloud, and three quiet water drops showing cleaning progress. Plant and towel art are separate from the responsive room backdrop. Fast swipes clean the whole path; only the initiating pointer owns the sponge, and cancel/leave releases capture and pending motion. Keyboard/tap scrubbing stays available.
- Existing bath recognition choices, supported evidence, motor participation, practice rewards and saved progression are preserved. No timer or new difficulty gate is added.

Validation: 982 automated checks pass, including seven new behavior checks for pointer ownership, fast paths, speech fallback, assisted replay, stale callbacks and exactly-once catch arrival. Actual browser play covered phone scrubbing through reveal, keyboard scrubbing, recognition miss → hint → correct, fishing miss → correct → second catch, persistent catches, reward handoff and reduced motion. Both games fit simulated 320×568, 390×844, 844×390 and 1280×720 viewports. New art colors were compared directly with ART.md; the full palette checker still reports pre-existing debt. No physical-device or child playtest claim.

Local evidence: `.qa/shots/v270-*`; pre-pass copies of changed existing files are in `.qa/baselines/v270/`. Preview: `letters.html?v=20261021-waterside1`. Production remains untouched. Other activity families and their end-to-end rewards remain candidates for subsequent art/play review under the active goal.


## v271 — Picture-book play (2026-10-21, local)

Continues the whole-game art/play goal through Peekaboo Flaps, Sound Sort, the Hoopoe's Trip, Friend Shapes and Busy Market. Existing characters, letter progression and reward rules remain. Lower-cost workers handled the bounded art helpers, initial interaction work and shared drag correction; integration and browser play were reviewed together.

- Garden doors gain hinges, knobs and inset letter labels. Choices stay equally bright. Failed speech and replay reveal the pictured reference and mark the response supported; old speech callbacks cannot change a newer round. The correct revealed picture is still named during the open-door moment.
- Picture sorting uses woven baskets and real card dragging, with a 24px receiving margin, a visible nearby-basket cue, retained basket taps/keyboard controls, and a card flight that starts where the child released it. Outside/canceled drops return without an answer. Collected pictures remain in their baskets. Shared dragging now converts screen movement to local coordinates on enlarged desktop stages, including re-grabbing a returning object.
- Friend Shapes is a shallow craft recess with a faint complete letter body, replacing the disconnected floating features. Pieces can be dragged into the recess or tapped. An accepted piece restores the friend; a wrong piece returns with a hint. This remains supported matching, never a substitute for independent listening evidence.
- The Hoopoe's Trip has a continuous clearing, a legible sign and a house with a chimney, framed window, flower box and step. Friends join the procession with finite movement; the journey keeps at least two taught choices even after earlier friends have joined. A rejected voice no longer strands the procession. All collected friends appear at home before the normal completion reward.
- Busy Market uses separate fixed-proportion awnings, posts and shelves with reserved picture cells. Only eligible taught pictures enter the page. The existing 6/12 beginner/experienced caps remain. Found pictures persist across lens changes; both manual and automatic changes skip finished lenses, and stale automatic changes cannot override a manual choice. Exploring the market does not award mastery.
- Responsive corrections keep three baskets inside a 320px phone and prevent landscape answer cards from stretching. Reduced motion keeps the same usable states without the new movement. No audio asset generation/import or production work was performed.

Validation: 992 automated checks pass, including nine new book-game behavior checks and a zoom/re-grab regression test. Syntax and diff checks pass. Actual browser play completed all five games; checks included wrong/outside/correct sorting drops, accepted puzzle drags, keyboard/tap puzzle completion, rapid door taps and replay fallback, all five journey friends arriving home, market bag persistence/manual switching, and return to the world. The final 20-view matrix covered all five games at 320×568, 390×844, 844×390 and 1280×720: no controls outside the viewport or smaller than 44px, and no active CSS animations in the games under reduced motion. These are simulated viewports, not physical-device or child playtests.

New art/CSS colors match ART.md; the global palette checker continues to report existing debt elsewhere. Screenshots and the layout audit are local in `.qa/shots/v271-*` and `.qa/v271-layout-check.json`. Pre-pass copies are in `.qa/baselines/v271/`. Preview: `letters.html?v=20261021-books1`. The broader art/gameplay goal remains active: other activity families still need comparable scene and end-to-end play review.

## v272 — Puzzle Tree toys (2026-10-21, local)

Continues the broader art and gameplay pass through Echo Parade, Dots Last, Letter Train and Same Letter. Three lower-cost workers handled bounded art, logic and review; integration and browser review stayed together. Audio generation/import and production publishing remain parked.

- Letter Train has a detailed locomotive, carriage slots before the first answer, a station shelter and a visible next-letter guide. Tap or drag to the whole train with a 24px landing margin. Incorrect train drops give the same gentle help as taps; outside/canceled drops are not answers. Wheels meet the track, filled cars seat briefly, and the train stays for its refrain before a finite departure. Short taught runs no longer repeat the final ride because of conflicting stride/count calculations.
- Echo Parade uses a canopy stage, right-to-left matching recesses and a next-position cue. Answers wait for the played sequence; replay is support. Unavailable, rejected or unconfirmed speech reveals the line without waiting through more failed clips. Leaving settles pending waits; stale speech cannot unlock another sequence.
- Dots Last sits in a stamp tray with an unobstructed letter field. Each delayed reveal belongs to its own round. Early guesses do not earn mastery; completed visual comparisons report letter-form evidence.
- Same Letter has a wooden reference frame and pieces in a shallow tray. Difficulty is fixed for the visit: two upright choices, then three upright choices, later rotations, and mirrored distractors only after more visual successes across four visits. Choices and rotations do not increase at the same milestone.
- Letter and syllable pools reject explicitly untaught/locked records, unmet prerequisites and conflicting duplicates. Train length follows its least-established letter. Curriculum, collections and payout rules remain.
- Fixed-aspect props, finite responses and tighter panels keep the garden visible around the toys. Reduced motion removes the added movement.

Validation: **1,001 automated checks pass**, including nine new behavioral regressions. Syntax and diff checks pass; new art/CSS colors match ART.md. Played all four games through completion handoffs, including train wrong/right drag, tap and keyboard input, matching retries, sequence replay and dot choices during reveal. All four games were checked at 320×568, 390×844, 844×390 and 1280×720 with larger choice sets and reduced motion; no play button was outside the viewport or below 44px. These are simulated viewports, not physical-device or child playtests.

Recovery: `.qa/baselines/v272/RESTORE.md`. Screenshots: `.qa/shots/v272-final-*`; layout evidence: `.qa/v272-layout-check.json`. Preview: `letters.html?v=20261021-puzzles1`. Other activity families still need comparable art/play review; the whole-game goal remains active.

## v273 — Letter workshop and shadow theatre (2026-10-21, local)

Continues the existing art/play pass through Build Letter, Fill the Gap, Lantern Hunt and Letter Shadows. Three lower-cost workers handled bounded art, layout and logic tasks; integration and actual play were reviewed together. Audio generation/import remains parked, and nothing was published.

- The workshop has a fixed-proportion wooden assembly board with pictured body/dot steps and a tactile piece tray. Beginners get the body preplaced for dotted letters; later visits add the body step before increasing choices. Body-only letters remain playable. Pools without a distinct matching choice return without awarding completion. Stale step handlers cannot place a second piece.
- Fill the Gap uses a picture easel, a complete joined Arabic word reference and a separately highlighted initial letter. The word remains joined after completion. Fallback friends stay whole instead of leaving detached features. Children can tap or drag a letter into the generous receiving space; wrong drops give help, while outside/canceled drops do not answer. This is supported initial-letter/friend matching, not independent word-reading evidence.
- Lantern Hunt has a layered night clearing, a fixed-proportion tree and lantern, and a collection jar outside the hiding field. Beginner searches have two distinct choices; the beam stays generous when choices increase. A dark tap reveals before selecting. Pointer ownership, lost capture, obsolete handlers and duplicate finds are guarded. Failed, rejected, stalled or replayed prompts show a supported reference; early guesses before a verified prompt do not strengthen learning.
- Letter Shadows uses a wooden puppet theatre and finite arrival feedback. Difficulty stays fixed during a visit: more choices, then a second stationary shadow, then plain forms after a later evidence milestone. Dragging matches the specific silhouette under the drop; taps still allow either remaining shadow. Unrelated/outside drops and old-round handlers cannot complete a target.
- Taught eligibility and item identity are preserved across helpers, hints and outcome reporting. No curriculum, earned collection or reward economy changes. Small-screen fixes keep the easel and night scene inside the play area; app/OS reduced motion keeps the same interactions without the added movement.
- Rechecked the requested sticker scenery bin: drag a placed sticker into the large coral bin, or tap a placed sticker and then tap the bin. Removal saves only the arrangement, preserving the reusable sticker and collection. Desktop and phone removal and reload persistence were verified again.

Validation: **1,019 automated checks pass**, including 18 new workshop/shadow behavior checks. Syntax and whitespace checks pass. All four games were played through their completion callbacks and return to the world, including workshop retry/drag/keyboard, word-gap wrong/outside/correct drops, lantern reveal/search/collection and two-shadow wrong-target/correct-target drops. Layouts were inspected at 320×568, 390×844, 844×390 and 1280×720, including three-choice support, silent-speech fallback and reduced motion. No play buttons were outside the viewport or below 44px; no active CSS animation remained under reduced motion. These are simulated viewports, not physical-device or child playtests.

New art/CSS colors match ART.md. The global palette check still reports existing repository debt (54 off-palette colors and 12 off-scale widths). Recovery: `.qa/baselines/v273/RESTORE.md`. Screenshots: `.qa/shots/v273-*`; layout evidence: `.qa/v273-layout-check.json`. Preview: `letters.html?v=20261021-workshop1`. The broader whole-game art/play goal remains active; this entry covers the four games above, not every remaining activity family.

## v274 — Word and Wardrobe Play (2026-10-21, local)

- Hat Shop now has a fixed-aspect timber dressing stand, a visible landing place for a waiting friend, and a warm shelf that fits all three later-stage choices on a 320px phone. A successful friend choice arrives in the stand. Existing above/below mark artwork still follows the handwriting paths.
- Twin Crown opens with a letter friend on a small puppet stage, retains its two-choice crown contrast, and gives both cards equal prominence. The two-to-one demonstration stays inside the same stage rather than changing the layout. This remains supported matching, not independent decoding.
- Listen and Find uses a reading stand, a clear replay button, and large answer cards. Word Gap uses an open book with an uninterrupted Arabic word field; the fully joined word returns after the missing piece lands. Arabic references and cards reserve space for low vowel marks.
- Both families filter locked, explicitly untaught, prerequisite-blocked and duplicate display aliases before planning. Visit choice ceilings are frozen: two for beginners, at most three later. Hat Shop keeps its task mode stable where the taught pool permits. Word Gap distractors are actual clusters from eligible words; tatweel and punctuation can no longer become missing letters.
- Prompt outcomes use verified playback, guarded current rounds and current controls. Replay and failed/unavailable speech expose a supported reference, stalled listening falls back, pending guesses cannot strengthen learning, and verified unassisted Hat Shop answers can strengthen listening. Late callbacks, replaced controls, outside drops and cancellation cannot submit another round's answer. Feedback speech rejection is consumed.
- The requested sticker bin is present throughout the scenery editor. It supports drag-to-bin or select-then-tap-bin, a generous drop zone and a visible selection cue. Removal saves the arrangement while preserving the sticker collection and reusable tray.

Validation: **1,038 automated checks pass**, including the new word/hat behavior cases and updated compatibility fixtures. All four games were played through completion, with both Hat Shop modes, wrong/correct/outside drags, keyboard input, replay and silent-speech fallback. All four were inspected at 320×568, 390×844, 844×390 and 1280×800; no play control was under 44px, no direct game content escaped the play area, and no horizontal page overflow was found. Reduced motion disabled the family animations. Sticker tap removal, drag removal, reload persistence and reuse were rechecked in an isolated local test scene. No console errors during these browser checks. These are simulated viewports, not physical-device or child playtests.

New art/CSS use the established palette and stroke scale. Global palette debt remains unchanged at 54 off-palette colors and 12 off-scale stroke widths elsewhere. Audio generation/import and production were not touched. Recovery: `.qa/baselines/v274/RESTORE.md`. Browser evidence: `.qa/shots/v274-*`, `.qa/shots/sticker-bin-selected-v274.png`, `.qa/v274-layout-check.json`. Preview: `letters.html?v=20261021-word-wardrobe1`. This is progress on the continuing whole-game goal; other activity families still need dedicated review.


## v275 — Toy Studio (2026-10-21, local)

- Friend Pairs uses leaf-backed cards on a small picnic mat. Matched cards remain readable, introductory peeks have useful accessible labels, and two, three and four pairs fit small phones without overlapping. Four pairs require established practice across four distinct visits; the board size is frozen for the visit.
- Dot Nests has larger nests, a letter on a paper-faced branch and a tree for later above/below sorting. Counting stays the task for the whole early visit. Position sorting is a separate later visit using eligible planned letters. Actual nest bounds win over overlapping drag tolerance, then the nearest nest wins; wrong and outside drops cannot advance the round.
- Friend Jigsaw has a timber picture frame and a separate piece tray. Two, three and four pieces form a gradual progression without an unrelated decoy. The three strip widths match the cropped picture. Guided drop feedback and keyboard placement work. Completion callbacks capture the round that created them, fixing a stall after the last piece. Planning and participation use the construction skill; assembly remains motor participation with no recall verdict.
- Colour a Friend has a drawing easel and eight named crayons, including Pink and Paper. The pet's colour sets the starting crayon. Crayon selection and painted pages survive page changes during the visit. Keyboard painting works even on narrow stroked letters. Export snapshots the page before decoding, blocks page changes while saving, and re-enables controls on failure instead of saving a blank or stale drawing.
- These games share strict eligibility and actual curriculum item IDs. Explicit empty plans remain empty. Old controls, replaced pages and late callbacks cannot submit another round's results. Existing pets, chapter rules and rewards are preserved; audio generation/import stays parked.

Validation: **1,048 automated checks pass**, plus syntax and diff checks. Browser play completed beginner memory, counting and position-sorting visits, a two-puzzle beginner visit and hanging a coloured drawing. Three- and four-piece puzzles were assembled; wrong/correct/outside drags, keyboard placement/painting, draft restoration and Pink selection were exercised. Four baseline layouts (320×568, 390×844, 844×390 and 1280×800) were inspected for each game, with additional intermediate/established checks at 320×568 and 844×390. No overlapping card/piece controls or controls below 44px in the final later-level checks. Reduced motion disables the family animations. These are simulated viewports, not physical-device or child playtests. Palette debt remains the same 54 off-palette colours and 12 off-scale widths elsewhere.

Recovery: `.qa/baselines/v275/RESTORE.md`. Evidence: `.qa/shots/v275-*`, `.qa/v275-layout-check.json`, `.qa/v275-later-layout-check.json`. Preview: `letters.html?v=20261021-toy-studio1`. Changes remain local. Other game families still need dedicated review under the continuing whole-game goal.


## v276 — Look and Ride (2026-10-21, local)

- Spot the Change has readable cream stones on a small observation table. Children now decide when they are ready: the eye-and-arrow control hides the arrangement briefly and reveals the changed letter. There is no forced observation countdown. The same control then offers Look Again, which restores the original arrangement and records help. Beginners see two stones across three rounds; later visits use at most three stones across four rounds, with dot-family differences when the taught pool permits.
- Family Buses has a garden stop, a warm parking surface and larger separate driver/passenger windows. The passenger boards beside a different letter with the same body. Both tap and drag remain available. Drops within 28px of a bus are accepted; exact bounds take priority, then nearest centre resolves overlapping margins. Wrong drops receive a gentle hint and outside drops leave the passenger waiting. Departure follows the boarding animation, with a static equivalent under reduced motion.
- Both games plan from eligible taught items once, retain actual curriculum IDs, and freeze the visit's difficulty. Explicit empty plans stay empty; sparse later pools can use two valid choices. Unknown/locked/prerequisite-blocked aliases and unplanned distractors cannot enter the visit. Visual/memory outcomes remain separate from recall strength. Replay, feedback, replaced DOM nodes, stale timers and old drags cannot submit extra answers. Speech failures are safely consumed without changing the parked audio pipeline.
- Code review found browser NodeList methods being treated as array methods in the new drag path; this was corrected before delivery and covered with a NodeList-shaped fixture. Drag cleanups now run at each round boundary.

Validation: **1,058 automated checks pass**, with syntax and diff checks. Browser play completed beginner Spot the Change, its later four-round dot-change visit, and Family Buses. Checked wrong/correct/outside/near-edge drags, keyboard answers, reference replay, self-paced waiting, boarding, completion, and reduced motion. Both games were reviewed at 320×568, 390×844, 844×390 and 1280×800 with early and later difficulty. The later three-bus phone scene was adjusted after its progress row clipped; final phone captures keep it visible. Answer controls meet 44px and the layouts have no horizontal page overflow. No console errors appeared in these checks. These are simulated viewports, not physical-device or child playtests; whether a new child understands the ready icon still needs observation with children.

Palette debt remains unchanged at 54 off-palette colours and 12 off-scale stroke widths elsewhere. Local preview: `letters.html?v=20261021-look-play1`. Recovery: `.qa/baselines/v276/RESTORE.md`; screenshots and checks: `.qa/shots/v276-*`, `.qa/v276-layout-check.json`, `.qa/v276-final-phone-check.json`. Production and audio generation/import were not touched. Listening, costume/form and word-tree families remain to be reviewed under the continuing whole-game goal.

## v277 — Form Play and sticker cleanup verification (2026-10-21, local)

- Disguise presents the complete joined word on a reading stand, with separate large matching choices. Costume Rail uses the same stand and a timber rack; filling the gap restores the original cluster and its vowel marks. Shape Train has an engine, separate car seats and introductory shape guides. The complete train produces one matching outcome, rather than credit for each partial placement.
- Leaf Home uses a large leaf and hanging branch labels. Root radicals fit inside their paper labels, and three branches form a two-plus-one arrangement on phones. Matching includes only words with the full root visibly present in order; prefixes are skipped when highlighting radicals. This fixes the prefix hamza in أَرَأَيْتَ being highlighted instead of the root hamza. The public Word Tree corpus remains unchanged, and filtering preserves unlocked branch boundaries.
- Visits use eligible taught items and validated plans, with stable two-choice introductions and at most three later choices. These visible matching tasks do not count as independent recall. Wrong feedback, replay, replaced controls, delayed callbacks and cancellation cannot advance another round. Drag targets are forgiving, and reduced motion preserves the task without the added movement.
- The scenery bin supports drag-to-bin and select-then-tap-bin. Its 24px drop margin was checked again on a phone layout. Both removal paths save the arrangement while keeping all eight fixture stickers reusable; reload preserves the cleaned scene. Existing user scenery was left intact.

Validation: **1,083 automated checks pass**, including nine sticker cleanup checks, with syntax and diff checks. Browser play completed all four form games; the final Leaf Home visit used the real corpus with silent speech and reduced motion. Phone and desktop captures cover 320×568, 390×844, 844×390 and 1280×800. Final branch labels and Costume Rail were rechecked after fixing label alignment, card-width specificity and landscape progress clipping. Controls meet 44px, final inspected layouts have no horizontal overflow, and progress remains inside the play area. No active family CSS animations remained under reduced motion. These are simulated viewports, not physical-device or child playtests.

Recovery: `.qa/baselines/v277/RESTORE.md`. Evidence: `.qa/shots/v277-*`, `.qa/v277-layout-check.json`, `.qa/v277-final-layout-check.json`, `.qa/shots/sticker-bin-ready-final.png`. Preview: `letters.html?v=20261021-form-play1`. Palette debt remains unchanged elsewhere. Changes remain local and audio generation/import stays parked. The broader game-polish goal is still in progress; listening games remain to be reviewed.


## v278 — The listening corner (2026-10-21, local)

- Beat Drum now has a rounded coral drum with skin, rim, lacing and feet, a timber picture stand, and a seed tray that responds to each tap. Beginner visits use three rounds with one- and two-beat words; established guided practice can introduce three beats. This is recorded as guided motor success, never independent segmentation or letter recall.
- Same Start plays the target and each choice before opening selection. Tapping the target replays just its name; each answer has its own separate speaker button. A separate control repeats the whole question. Two choices grow to at most three across visits, with the visit's difficulty frozen. Existing picture vocabulary remains available before letter learning.
- Odd Sound keeps its three-picture contrast and gains the same separate listening controls, a centered replay stand and clear picture feedback. Unavailable speech shows a supported comparison and hints the answer. Speech failure, replay and help cannot count as independent listening.
- Both sound-choice games use eligible, deduplicated picture records and validated plans. Empty or unusable plans cancel without rewards. Outcomes retain picture IDs and the selected picture, use a separate first-sound skill, and do not change letter recall strength. Shared progression reads first-sound listening evidence and guided-beat motor evidence from their own buckets.
- Playback waits for actual completion and is bounded if a promise never settles. A failed word ends that sequence and opens supported play; it cannot accumulate a separate timeout for every choice. Late speech, replaced controls, repeated taps, old rounds and leaving during feedback cannot submit another answer. The last speaking highlight clears when listening finishes.
- The generic board was replaced with a small listening corner while preserving the surrounding garden. Larger desktop props, centered composition, generous phone controls, non-overlapping landscape controls and static reduced-motion feedback were checked. The existing drum icon now uses the new artwork too.

Validation: **1,096 automated checks pass**, with syntax and diff checks. New constructor/lifecycle coverage verifies empty-plan cancellation, target-plus-choice playback, stale controls, a hung utterance, per-picture replay, motor outcome integrity and a complete three-round visit. Browser play completed all three games, plus a four-round established drum visit ending in a three-beat word. Replay, wrong-answer retry, keyboard input, unavailable speech, completion and return to the world were exercised. All three games were reviewed at 320×568, 390×844, 844×390 and 1280×800 at early and later levels. Final controls meet 44px, have no overlaps or horizontal overflow, keep progress inside the play area, and disable family CSS motion under reduced motion. These are simulated viewports, not physical-device or child playtests. Spoken content correctness was not re-reviewed; audio generation/import remains parked.

Palette debt elsewhere is unchanged: 54 off-palette colours and 12 off-scale widths. Recovery: `.qa/baselines/v278/RESTORE.md`. Evidence: `.qa/shots/v278-*`, `.qa/v278-layout-check.json`, `.qa/v278-final-layout-check.json`. Preview: `letters.html?v=20261021-listening1`. Changes remain local. The next whole-game review should follow complete child journeys through entry, play, reward and return, now that the individual game families have received their dedicated passes.


## v279 — A child-led finish and reliable practice rewards (2026-10-22, local)

- Finished practice stays visible until the child chooses Continue or optional Replay. The selected pet shares a planted clearing with three flowers; the earned-star tag appears only when the existing practice payment succeeds. The old timed flower overlay is retired. Completed game inputs, idle prompts and delayed sounds stop on exit, and connected chapter/adventure callbacks retain their existing progression.
- The pet's actual contact shadow is aligned to the same clearing for both blob and animal companions, including after resizing. Reduced motion keeps the ending still.
- The practice star and its same-day receipt now save together in the wallet. A failed write leaves the in-memory balance and allowance unchanged. A failed legacy receipt mirror cannot enable another payment. Existing once-per-kind and five-per-day limits remain.
- An activity only loses its new invitation after it has actually launched; unavailable, empty, failed and cancelled starts keep it. Practice returns restore the source toy's scroll position and focus.
- Decorative strokes on Colour a Friend no longer intercept taps meant for the underlying paintable shape. Browser play painted the letter pink, hung the picture, returned to its source toy, placed the new drawing in the garden and verified that placement after reload.

Validation: 1,109 automated checks passed. Blob and Lumi endings were checked at 320×568, 390×844, 844×390 and 1280×800, including reduced motion and a measured common ground line. Actual play covered a complete drum visit, replay, colouring, payment and return. These are simulated viewports, not physical-device or child playtests. Palette debt elsewhere was unchanged. Evidence: `.qa/shots/v279-*`, `.qa/v279-layout-check.json`; recovery: `.qa/baselines/v279/RESTORE.md`. Local only; audio generation/import remained parked.


## v280 — A pictured toy chest and a remembered place (2026-10-23, local)

- The main practice garden now opens one pictured family at a time: play, listening, books, puzzles, drawing and garden discoveries. Six new native SVG family icons sit above a warm timber cabinet. Larger activity pictures replace repeated play-arrow badges, and the selected pet remains visible in the feeding invitation. The cabinet fits its contents instead of leaving a tall empty surface on short shelves.
- Family tabs keep a steady position as the child explores. The selected family, shelf scroll position and source toy are remembered through ordinary practice and nested hub returns. Tab keyboard navigation, focus restoration, one-shot launches and stale-control guards share one small navigation controller. Existing special daily/adventure routes retain their flow.
- A large arrow handle appears only when a shelf has more toys below; at the bottom it points back to the first toys. The 320px phone's five-toy play shelf fits without unnecessary scrolling. Crowded desktop shelves use four centered columns and keep all seven toys visible. The landscape top bar no longer intercepts taps intended for the family tabs.
- Existing eligibility and the exact nine Little Sprout toys are preserved. At most three untried invitations remain stable across family changes; visiting a tab alone cannot consume them. Learning mechanics, chapter rules, rewards and saved progress are unchanged. Audio generation/import remains parked.

Validation: **1,117 automated checks pass**, including navigation, overflow, teardown and reduced-motion behavior. Twenty-four final layout checks cover all six families at 320×568, 390×844, 844×390 and 1280×800: one visible family, no horizontal page overflow, controls at least 44px and correctly signposted overflow. Actual play covered a full drum visit, its child-led ending and return to the listening family; book and colouring returns; and leaving a jigsaw from a scrolled shelf, restoring the source focus and scroll position. Early-reader and Little Sprout eligibility were checked through the visible UI. Reduced motion disables shelf animations/transitions; no console warnings or errors appeared in the final checks. These are simulated browser layouts, not physical-device or child playtests.

Recovery: `.qa/baselines/v280/RESTORE.md`. Evidence: `.qa/shots/v280-*`, `.qa/v280-final-layout-check.json`, `.qa/v280-eligibility-check.json`. Preview: `letters.html?v=20261023-toychest1`. Changes remain local. This completes the toy-chest entry/return pass; the broader artwork and gameplay objective remains active.

## v281 — A child-led sand table (2026-10-23, local)

- Sand Table now has a fitted timber tray, quiet sand grain, a pictured rake and a small bucket/stone/sprout setting. A separate eye button repeats the demonstration. The rake, help, progress and Next controls remain reachable in portrait and short landscape; the old desktop rake clipped below the viewport. The handwriting model has eight units of breathing room so low vowel marks and rounded strokes remain inside the tray.
- A finished letter stays until the child chooses Next. Raking lets them draw the same letter again without another outcome. A two-item beginner visit and up to three later items lead to the existing child-led practice ending and return. The activity uses eligible taught items, original curriculum IDs and validated plans; it no longer invents letter-plus-mark targets.
- Drawing guidance fades across successful visits: full path, dotted path, start cue, then memory. The visit's support is fixed at entry. Recent help restores support. Unavailable or hung speech reveals the reference without discarding completed strokes; this changes presentation fallback only, with audio generation/import still parked.
- Completed tracing records drawing-specific motor evidence. It cannot increase aggregate letter mastery or independent listening evidence. Help, keyboard assistance and automatic patience assistance are routed to assisted evidence by the real learning session. Duplicate callbacks and redrawing cannot add another result. Integration checks cover durable storage and support progression, not just raw outcome objects.
- The shared stroke guide now cancels old demo/snap timers on reset, releases pointer capture on reset/destroy, and treats pointer cancellation or lost capture as interruption rather than a failed attempt. The sand game retires old guide and speech callbacks at each boundary. Reduced motion removes its demonstration movement, cue pulse, grain feedback and ink/tool/friend transitions.

Validation: **1,133 automated checks pass**, plus syntax and diff checks. Actual browser play includes a pointer-drawn Alif with the padded coordinate system, keyboard-assisted marked letters, rake/help replacement, explicit Next, the normal finish screen and return to the toy chest. Kasra and controls were measured and visually checked at 320×568, 390×844, 844×390 and 1280×800; all inspected buttons are at least 50px, no page overflow appears, and the full marked stroke fits. The reduced-motion visit remains playable with no active sand-family animation or transition. These are simulated browser viewports, not physical-device or child usability tests. Palette debt elsewhere remains 54 off-palette colours and 12 off-scale widths.

Recovery: `.qa/baselines/v281/RESTORE.md`. Evidence: `.qa/shots/v281-*`, `.qa/v281-final-layout-check.json`. Preview: `letters.html?v=20261023-sand1`. Changes remain local. The larger game/artwork goal remains active; this pass completes Sand Table's dedicated review.

## v282 — The stamp-making table and saved pictures (2026-10-23, local)

- Letter Studio has a fitted wooden easel, illustrated land scenery, ink pads, letter stamps and a pictured hanging control. Shared pink and pet-colour defaults are available; the selected ink stays visible after resizing. Scroll handles reveal later stamps and return to the first choices. The desktop and short landscape layouts keep the tools inside the screen.
- Letter stamps use eligible taught items with their original curriculum IDs, preserving prerequisite boundaries. The prompt shows the selected letter and disappears for a picture sticker. Creative placement and keyboard stamping do not submit learning evidence. Stamps remain within the picture edge; Undo removes only the last stamp, and a 24-stamp limit keeps the picture bounded.
- The saved picture uses the same scene, sticker motifs, colours and letter positions as the live canvas. Saving locks editing and takes a snapshot; font/image failures or storage failure keep the art and expose a retry, without awarding completion. Leaving cancels pending image work. The three art slots now rotate by age instead of repeatedly replacing the same slot. Memory updates only after successful persistence. Colour a Friend also treats a false save result as a failure.
- Sticker scenery cleanup remains available through the large pictured bin: drag a placed sticker into it, or select a sticker and tap the bin. Removed placements save without consuming owned stickers. The bin and its extra 24px drop margin were rechecked in actual play; existing user scenery was preserved.

Validation: **1,148 automated checks pass**, including save-failure, cancellation, duplicate completion, eligibility, edge placement, ink/undo, art-slot rotation and sticker cleanup coverage. Browser play saved a picture containing two pink letters and a sticker, inspected its exported PNG, reloaded it and placed it in the decorating garden. A failed-save visit retained its stamp and enabled retry. Studio layouts were inspected at 320×568, 390×844, 844×390 and 1280×800: no horizontal page overflow, controls at least 46px, the selected ink visible and reduced-motion transitions disabled. Sticker select-and-bin and drag-and-bin both worked at phone size; reload retained the empty scene and all eight reusable test stickers. The desktop bin measures 100px; the phone bin measures 76px. These are simulated viewports, not physical-device or child playtests. Syntax and diff checks pass; existing palette debt elsewhere remains.

Recovery: `.qa/baselines/v282/RESTORE.md`. Evidence: `.qa/shots/v282-*`, `.qa/shots/sticker-bin-ready-v282.png`, `.qa/v282-final-layout-check.json`, `.qa/v282-tests.txt`. Changes remain local; audio generation/import remains parked. The broader artwork and gameplay goal is still active.

## v283 — A child-led Water Garden (2026-10-23, local)

- Water Garden now has a stone spring pool, timber channels and turning spouts, planted soil pockets and three coloured flowers. The existing surrounding pond and garden remain visible. Fitted Arabic glyphs and separate help, progress, Next and finish controls replace the crowded board edge.
- A beginner visit offers two supported choices over three rounds. The learning profile is fixed for each visit: matching leads to two-choice listening, then three choices across successful visits. Channel turning arrives only for established players. Items and plans are checked against taught content, prerequisites, locked records and duplicate glyphs. Answer positions are shuffled, and the channel direction never reveals the correct letter.
- Water reaches the flower before completion is recorded. Each grown flower stays until the child chooses Next; finishing guided play leads to optional garden play. Turning channels remains a toy action and earns no letter-recall evidence. Supported matching, help and independent listening retain separate learning records. Duplicate taps, old speech callbacks and delayed water arrivals cannot complete another round.
- Replay preserves confirmed listening; unavailable or hung speech opens supported matching. Its deadline is independent of reduced-motion settings. Free play remembers gates, channel directions and flowers across reload. The connected adventure marks its water stop once, preserves completion and returns to its existing finish screen. Existing practice rewards remain in place; audio generation/import is still parked.
- Controls remain at least 56px in the measured phone and desktop layouts. Reduced motion removes water, hint and control movement. A shared helping-hand cue now retires when the viewport resizes, preventing a stale pointer after phone rotation.

Validation: **1,152 automated checks pass**, plus syntax and diff checks. Actual browser play covered beginner matching with a wrong-answer retry, established listening and replay, channel-turning rounds, hung-speech fallback, optional free play, saved channels after reload, the normal practice reward/return, and the connected adventure's completion/revisit after reload. Nine layout checks cover guided play and revisits at 320×568, 390×844, 844×390 and 1280×800, plus a completed adventure round on the smallest layout. No measured control overlaps, offscreen controls or horizontal page overflow. Reduced-motion animations and transitions are disabled, and the rotation check removes the old hand. No browser warnings or errors were captured. These are simulated viewports, not physical-device or child playtests. Existing palette debt elsewhere remains 54 off-palette colours and 12 off-scale widths.

Recovery: `.qa/baselines/v283/RESTORE.md`. Evidence: `.qa/shots/v283-*`, `.qa/v283-layout-check.json`, `.qa/v283-tests.txt`, `.qa/v283-palette.txt`. Changes remain local. The broader game/artwork objective remains active; this pass completes Water Garden's dedicated review.

## v284 — Letter Hunt's six little worlds (2026-10-23, local)

- Letter Hunt keeps its six familiar environments and gains a native paper-diorama prop family: built trees, kites, boats, flags, pots, crates, shells, lilies, rocks, clouds and lanterns. Quiet paper labels appear only where a letter is present. Arabic ink is fitted to those labels. The complete scene fits in portrait and landscape without cropping hiding places; help, the collection basket and Next have their own space.
- Waterside composition was corrected during screenshot review: the bank is continuous green land, boats and lilies sit on water, and shells, trees and flags stay on land. Lanterns hang from visible cords or rest on feet. Touchable tree canopies now share the other props' warm outline. The original renderer remains available as `LetterHunt.classic`.
- Beginner visits use two supported choices over three rounds. Later visits move from two-choice matching to two-choice listening and then at most three choices, with support fixed for the visit. Targets come from eligible, deduplicated taught items and validated plans. An explicitly empty or invalid plan cancels without awarding completion. Matching and helped answers stay separate from independent listening evidence.
- Each find flies into the basket, and the child chooses when to continue. Plain props respond to play without submitting answers. Replay, repeated taps, stale controls and old speech promises cannot advance another round. Rotation preserves the question, basket and keyboard focus; leaving or continuing cancels any flying label cleanly. Reduced motion keeps the same feedback without movement.
- Independent listening waits for confirmed playback. A stalled prompt opens visible matching after six seconds; replay preserves an already confirmed prompt. The audio pipeline itself is unchanged.

Validation: **1,159 automated checks pass**, with syntax and diff checks. Browser play covered beginner and established visits, wrong-answer support, replay, repeated taps, keyboard selection, rotation during collection, completion, replay reset and return to the toy chest. Stalled speech was checked with reduced motion enabled. Thirteen layout captures cover all six environments in portrait and landscape, including 320×568, 390×844, 844×390 and 1280×800. Measured targets are at least 54.5px, with no offscreen controls or horizontal page overflow. Sampled actual Arabic ink is centered and contained; font-em rectangles were excluded from that measurement. No browser warnings or errors were captured. These are simulated browser viewports, not physical-device or child playtests.

Recovery: `.qa/baselines/v284/RESTORE.md`. Evidence: `.qa/shots/v284-*`, `.qa/v284-layout-check.json`, `.qa/v284-tests.txt`, `.qa/v284-palette.txt`. The palette scan adds no new debt; existing debt elsewhere remains 54 off-palette colours and 12 off-scale widths. Preview: `letters.html?v=20261023-hunt1`. Changes remain local, audio generation/import stays parked, and the whole-game polish goal remains active.


## Sticker scenery cleanup — undo follow-up (2026-10-23, local)

The existing coral rubbish bin now has a wordless Undo control beside it after a removal. Children can drag a placed sticker into the generous bin target, or select it and tap the bin. Undo restores the removed placement at its original position and stacking order; each picture keeps its own removal history for the current visit. Owned stickers stay in the reusable tray. Undo never evicts a later sticker from a full picture.

Validation: 15 focused sticker tests pass, plus JavaScript syntax and diff checks. Browser interaction verified tap removal, drag removal, pointer and keyboard undo, keyboard focus after restoration, and the reusable tray. Layouts checked at 1280×720, 390×844, 320×568 and 844×390; the bin is 76px and Undo 56px wide on the smallest portrait layout. No browser errors or warnings were captured. These are simulated browser viewports. Audio and the other game work remain untouched by this follow-up.

Recovery snapshot: `.qa/baselines/sticker-undo-20261023/RESTORE.md`. Screenshot: `.qa/shots/sticker-bin-undo-phone.png`. Local only.


## v285 — A friend puppet show and garden balloons (2026-10-23, local)

- Find My Friend now stages its existing letter-shaped animals in a small timber puppet booth, with coral curtains, separate wooden perches and a clear help/progress/Next row. A correct choice opens the booth and grows the animal features. The child controls when to continue; the final round has a distinct Finish action. The original curtain drawing remains in `FriendPlayArt.classic`.
- Beginner visits have three supported rounds and two choices. Later visits use a fixed support tier, progressing from two-choice matching to two-choice listening and then three choices between visits. Only eligible, taught, deduplicated letters enter the plan. Empty or invalid plans cancel without completion. Help and errors remain supported evidence, and help cannot disappear for a repeated target during the same visit.
- Independent listening requires confirmed prompt playback. Failed or stalled playback opens the visible model after six seconds. Replay keeps a confirmed prompt usable. Round tokens and teardown cancel stale speech and reveals; keyboard focus follows the child's next action, including waiting for a prompt.
- Letter Balloons has larger fitted letter labels and a quiet clearing with planted boxes, soft clouds and layered grass. The three hit areas stay still while the balloon art gently bobs. Pops use a short seed burst and the pet cheers. A replacement stays in its original slot and preserves keyboard focus only if the child has not moved to another control. Reduced motion keeps the controls still. The toy remains open-ended, with no completion or learning-score claims.
- Rapid balloon pops keep only the latest queued prompt. The visible letter changes when that prompt starts, so it stays synchronized with playback. Replay targets the child's latest selection; leaving clears replacements and queued speech. Audio generation/import remains parked.

Validation: **1,178 automated checks pass**, plus syntax and diff checks. Browser play covered beginner matching with an assisted retry, the child-led reveal, completion and replay, ordinary toy-chest entry/return, confirmed listening, replay during a round, keyboard continuation, stalled-prompt fallback, rapid balloon pops, replacement focus and reduced motion. Controlled speech fixtures exercised timing without generating or importing audio. Ten layout captures cover two- and three-choice Friend play and balloons at 320×568, 390×844, 844×390 and 1280×800. All measured controls remain visible; the smallest is 56px, with no horizontal overflow. No browser warnings/errors were captured. These are simulated browser viewports, not child or physical-device playtests.

Recovery: `.qa/baselines/v285/RESTORE.md` (preserve the later sticker-undo follow-up when restoring shared shell files). Evidence: `.qa/shots/v285-*`, `.qa/v285-layout-check.json`, `.qa/v285-*-outcomes.json`, `.qa/v285-tests.txt`, `.qa/v285-palette.txt`. Palette debt adds nothing new: the existing 54 off-palette colours and 12 off-scale widths remain elsewhere. Preview: `letters.html?v=20261023-friends1`. Changes remain local. This completes the two early-letter toys' dedicated pass; the broader game/artwork goal remains active.


## v286 — A child-operated Sound Lab (2026-10-23, local)

Sound Lab now uses a larger illustrated sound press with two ingredient funnels, a fitted live-ink window, speaker grille, turning gear, coral press button and wooden base. The earlier machine is retained as `SoundLabArt.classic()`. Its own responsive stylesheet keeps the machine, button and ingredient trays together in portrait and landscape; the existing garden scenery and pet stay in view.

The first eligible consonant is ready on entry. Children choose a taught mark, then press the coral button to make the sound. Three letters and three marks are visible per page, replacing the long scrolling trays. Letter choices respect taught/locked/prerequisite flags, deduplicate IDs and glyphs, and exclude bare alif consistently with the vowel/hat curriculum. Sukūn and shadda retain their existing complete practice chunks and highlighted focus consonant. This remains open-ended exploration: no scored outcomes, completion rewards or new progression rules.

A shelf holds the eight most recent distinct sounds. Replaying a shelf card restores its ingredients and the matching tray pages. Changing an ingredient clears the old output and cancels an unfinished mix; an old callback cannot clear a newer timer. Leaving cancels pending output. The press keeps keyboard focus during its short animation, keyboard paging moves focus to a visible choice, and reduced motion produces the same result without the movement or delay. Unavailable speech does not block the toy.

Validation: **1,190 tests pass**, including 14 focused Sound Lab checks. JavaScript syntax and diff checks pass. Browser play verified explicit mixing, interruption before completion, replay/history restoration, contextual shadda, keyboard paging/focus, a one-mark beginner tray, reduced motion, unavailable speech and leaving mid-mix. Five simulated layouts (320×568, 390×844, 667×375, 844×390, 1280×800) have no off-screen active controls or horizontal page overflow; active targets are at least 44px. No browser errors or warnings were captured. New art adds no palette debt; the existing global baseline remains 54 off-palette colours and 12 off-scale widths elsewhere.

Recovery: `.qa/baselines/v286/RESTORE.md`. Evidence: `.qa/v286-tests.txt`, `.qa/v286-layout-check.json`, `.qa/v286-palette.txt`, `.qa/shots/v286-*`. Ordinary preview: `letters.html?v=20261023-sound-lab1`. Sound Lab correctly remains unavailable on profiles that have not learned any vowel marks; `.qa/lab-v286.html?mode=preview` on the separate `letter-garden-lab.localhost:8790` origin offers an isolated review with all ingredients and the existing speech playback, without changing the main preview profile. A lower-cost Luna agent handled focused tests; integration and visual checks were reviewed by the parent. Changes remain local, audio generation/import stays parked, and the broader game-art and gameplay goal remains active.


## v287 — A shared matching picnic (2026-10-23, local)

Garden Together now places its two full-colour pets around a stitched picnic mat and woven collection basket. Rounded sprout-backed cards carry fitted Arabic letters; a gold seat and paw token show whose turn it is. Each matched pair adds a little letter card to the basket. The original surrounding garden remains visible, and the playmat rearranges for short landscape screens.

The difficulty steps change one demand at a time: two visible pairs, then two hidden pairs, then three hidden pairs. The support tier is fixed for the visit and draws only from eligible, taught, deduplicated letters through the existing practice planner. Insufficient content exits without completion. The eye button can reveal unmatched cards and retains that help across turns. This remains cooperative matching/memory play, with no competitive score or listening-evidence claims.

Both matching and mismatching pairs stay visible until the child passes the turn. Finishing the final pair waits for a distinct Finish action; the existing practice reward is claimed once. Keyboard focus follows the next available action. Repeated taps, unavailable speech and leaving mid-turn cannot advance stale play. Decorative pet movement respects reduced motion; game state has no timers. Browser inspection caught and fixed an undefined visibility flag that could reveal concealed cards, with a regression check using native class-toggle semantics.

Validation: **1,197 automated checks pass**, including seven focused Garden Together checks, plus JavaScript syntax and diff checks. Browser play covered mismatch/turn passing, matching and basket collection, explicit finish, reward/return, both memory levels, help reveal/hide, keyboard focus, reduced motion, rejected speech and exit. Five simulated layouts (320×568, 390×844, 667×375, 844×390, 1280×800) show no offscreen child controls or horizontal overflow; the smallest measured child control is 44px. No browser errors or warnings were captured. These are browser viewport checks, not physical-device or child playtests. Palette debt remains unchanged at 54 off-palette colours and 12 off-scale widths elsewhere.

Recovery: `.qa/baselines/v287/RESTORE.md`. Evidence: `.qa/v287-tests.txt`, `.qa/v287-layout-check.json`, `.qa/v287-palette.txt`, `.qa/shots/v287-*`. The separate `letter-garden-together.localhost:8790/.qa/together-v287.html?mode=preview` origin provides a guided review using existing speech without changing the main child's profile; ordinary entry retains the existing sibling-pet gate. Lower-cost agents supplied the art module and focused tests; the parent reviewed integration, corrected the visual/visibility issues and played the result. Sticker scenery cleanup and Undo remain available. Changes are local, audio generation/import stays parked, and the broader artwork/gameplay objective remains active.


## v288 — The Letter Friends field guide (2026-10-23, local)

The Letter Friends book now has a rounded foliage cover, cream page stack, right-hand binding, stitched edges and coral bookmark. A quieter ground patch frames the existing letter-shaped characters. Larger fitted letter and name cards keep Arabic ink centered and joined; the first-letter highlight uses the fitted SVG's coordinates so rotation does not move it away from the word. Portrait keeps the picture above its labels; short landscape places them side by side. Next is the warm primary action until the final page, when Close takes that role.

Children can tap the letter card to hear it and hold the plain shape still, or tap the name card to hear the whole name and restore its friend. The picture reads the existing letter → friend call → name sequence. Page turns animate only the illustration, keeping touch targets fixed. The idle hand targets the small speaker on the picture rather than the letter body. Reduced motion disables page, character and reveal movement. All 28 existing friends remain intact.

Book pages now respect taught/locked/prerequisite flags and deduplicate IDs and glyphs across the current and known items. The existing page order is retained. Empty content cancels without completion; reading and exploration still report no learning evidence. Direct controls can interrupt narration, repeated full-page replay does not queue duplicate stories, and page changes/close/exit cancel pending delays and invalidate stale speech. A six-second deadline frees a stalled reading sequence independently of motion preferences. Closing remains explicit and uses the existing reward/replay/return flow once.

Validation: **1,208 automated checks pass**, including eleven focused Friend Book checks. Syntax and diff checks pass. Browser review covered every one of the 28 pages at 320×568, plus 390×844, 667×375, 844×390 and 1280×800 layouts. No measured child control is offscreen, there is no horizontal overflow, and active child targets are at least 44px (56px in portrait). Actual play checked plain-letter/name switching, page navigation, keyboard focus at the end, closing/replay/return, reduced motion, rejected speech, a hung prompt and exit during narration. Browser warning/error logs were empty. Existing recordings are used in the review preview, but this pass does not validate pronunciation or fill missing audio. These are simulated viewports, not physical-device or child playtests. Palette debt is unchanged: 54 off-palette colours and 12 off-scale widths elsewhere.

Recovery: `.qa/baselines/v288/RESTORE.md`. Evidence: `.qa/v288-tests.txt`, `.qa/v288-layout-check.json`, `.qa/v288-palette.txt`, `.qa/shots/v288-*`; the all-page contact sheet is `.qa/shots/v288-all-pages.jpg`. Isolated review: `http://letter-garden-book.localhost:8790/.qa/book-v288.html?mode=preview`, with the existing speech and all pages for review without modifying the main child's profile. Lower-cost agents supplied initial page art and focused tests; the parent revised grounding, control priorities and motion, then integrated and visually reviewed the result. Changes remain local. Audio generation/import stays parked, and the broader artwork/gameplay objective remains active.

## v289 — Child-operated Living Books (2026-10-23, local)

- Rebuilt all four Living Books around a bound paper page, distinct illustrated covers, a detailed liftable bush, proportionate edge scenery and readable day/night colour. The Letter Friends book supplies the shared binding art; new scenery lives in `LivingBookArt.js`. Character contact shadows follow the actual ink bounds. The old renderer remains available as `LivingBooks.classic.art`, and the pre-pass files are in the recovery snapshot.
- Covers and casts now use eligible familiar/current friends only, with no automatic padding by untaught letters. A child with one familiar letter can use every story. The search book adapts its name and cover to that friend; the morning sun can be scenery without introducing an unknown letter friend. The shelf has distinct bush, hidden-friend, sun and moon pictures, so its four books do not depend on reading their titles. Travelling foreground insects step aside while browsing or reading a book, keeping cover cues and Arabic ink unobscured; the garden backdrop remains.
- Picture-name blanks wait for the child's tap. Flap/guess answers appear once, remain revealed when paging back, and are included in page replay. Individual words can interrupt reading; decodable words keep a brief opportunity to try before hearing them. Reading remains presentation and does not award independent-recall evidence.
- Removed timed endings. The final page stays open until the child presses Finish; the final hidden friend must first be revealed. Read counts and completion are claimed once. Page changes and leaving cancel outstanding reading and delayed sound cues; rejected, missing or stalled speech releases the reader, with a six-second deadline for a stalled request. Existing speech is reused; no audio files were generated or imported.
- The shelf requires one familiar letter, consistent with the actual activity entry. Finishing returns through the existing reward screen to the shelf. Saved favourite-book counts and the star marker remain intact.

Validation: **1,219 automated checks pass**, including 11 new behavioral tests for eligibility, no fallback cast, empty entry, blank/resume, reveal persistence, replay, cancellation, failed/stalled speech and one-time finishing. All four books were played through every page to the reward screen on desktop. Phone/landscape checks cover 320×568, 390×844, 667×375 and 844×390, plus 1280×800 desktop: 35 recorded page/layout samples have no horizontal overflow, outside controls or picture/caption overlap; child controls are at least 44px. Keyboard finishing, reduced-motion styles, rejected/stalled speech, leaving during narration and a beginner's one-letter stories were checked in the browser. Three actual shelf→book→reward→shelf visits produced the favourite marker, which survived reload. No application errors or warnings were captured. These are simulated viewports, not physical-device or child playtests; pronunciation and missing audio remain parked.

Syntax and diff checks pass. New art uses the existing palette; unrelated global palette debt is unchanged at 54 off-palette colours and 12 off-scale widths. Recovery: `.qa/baselines/v289/RESTORE.md`. Evidence: `.qa/v289-tests.txt`, `.qa/v289-layout-check.json`, `.qa/v289-palette.txt`, `.qa/shots/v289-*`. Local review: `http://letter-garden-stories.localhost:8790/.qa/living-v289.html?shelf=1`; its separate origin protects the main child's progress. No publishing. The broader goal remains active: the next pass should audit connected world→activity→reward→return journeys, including fresh/progressed profiles and leaving/resuming, against the now-polished activity families.


## v290 — Garden journey art and reliable returns (2026-10-23, local)

The bird and butterfly adventures now have constructed timber beds, seed packets, distinct flowers, a framed sign carrying the child's actual pink/pet-colour drawing, water and supporting trees. The bird sits on a branch perch; tapping either visitor makes only its illustration hop while its target stays still and the pet responds. Reduced motion keeps the visitor still. The original scene and visitor remain under `GardenAdventureArt.classic`. Short portrait screens show both destination choices together; short landscape keeps the complete garden inside the frame. Existing teaching targets, support rules and route sequence are unchanged.

Adventure progress must save before a step pays or stamps the day. Failed drawing/water writes stay in a bounded in-memory draft, and finishing or leaving offers a wordless retry without claiming saved completion. The same pending adventure survives returning from the village within the page session. An unsaved draft cannot survive a full browser reload while storage remains unavailable; the last successfully saved route remains authoritative. Repeated and detached retry callbacks cannot pay again.

A chapter left at its last stars screen now resumes its completion rather than restarting. The checkpoint also remains while the optional friend stop is open, so reloading there does not restart the chapter. Invalid, future, fractional and expired checkpoints are rejected. Book Corner and Puzzle Tree activity returns restore their shelf position and originating toy focus on Back and completion Continue.

Validation: **1,234 automated checks pass**, including save failure/retry, exact-once completion, pending drawings/channels, intermediate/final chapter resume, reload during the friend stop, ordinary replay best-delta payouts and nested returns. Browser play completed Delivery → two sign drawings → Water Garden → finished butterfly garden; a forced save failure paid nothing until retry. Reload preserved the sign, route and water. Final-checkpoint entry reached the friend stop and chapter celebration without replaying the final lesson. A completed Build Letter activity returned through Continue to the same lower puzzle shelf position; Back was checked in both hubs. Visitor repeated taps and reduced motion were inspected. Final layouts were checked at 320×568, 390×844, 844×390 and 1280×800; finish controls remain at least 48px with no horizontal overflow or clipped scene. The small-phone choice screen exposes both gardens. No browser warnings or errors were captured. These are simulated viewports, not physical-device or child playtests.

Recovery: `.qa/baselines/v290/RESTORE.md`. New files are `GardenAdventurePlayArt.js` and the three v290 test files. Evidence: `.qa/v290-tests.txt`, `.qa/v290-layout-check.json`, `.qa/v290-palette.txt`, `.qa/shots/v290-*`. The palette checker reports unchanged existing debt elsewhere (54 colours, 12 stroke widths). Lower-cost agents supplied the art module and the chapter/hub fixes; parent integration corrected composition, sizing and save handling and verified actual play. Preview: `letters.html?v=20261023-garden-journey1`. Local only; audio generation/import remains parked. The broader game/artwork goal remains active; Letter Delivery's own garden presentation and deeper shelf transitions still merit a dedicated pass.

## v291 — Finish the Letter Delivery release (2026-10-23, local)

Letter Delivery now uses paper seed packets and a constructed timber planter. Each successful delivery adds a plant; the Arabic sign stays separate from the flowers. Tap-select-then-plant remains available alongside dragging, with a 24px receiving margin. The hint follows the current action: packets, then planter, then Continue. Success holds until the child chooses Next or Finish; animations cannot advance or pay a round twice. The old drawings remain accessible through `LetterDelivery.classic`.

Only eligible, distinct taught items enter the plan. The shared learning profile sets a stable choice limit for the visit; beginners start with two visible choices. Help, an error or unavailable listening keeps subsequent rounds supported. Help releases a stalled prompt immediately, and the initial listening deadline also provides a fallback. Visible matching, assistance and confirmed independent listening remain separate evidence. Empty content cancels without completion; leaving cancels speech and pending gestures. Audio assets and generation were not changed.

Validation: **1,245 automated checks pass**, including 28 focused Delivery/integration checks. Two legacy source checks were updated for the retained classic renderer and current guarded input. Actual browser play completed four phone rounds with tap, keyboard, a deliberate mistake and a drag released 17px outside the planter. The test log records one completion payment and return to the toy shelf. Established listening offered three choices; Help revealed the target and the following round returned to two choices. A stalled prompt could be released through Help, reduced motion removed plant/pet movement, and leaving returned safely. Final layouts were inspected at 320×568, 844×390 and 1280×800. The landscape Next control is 64×52px and fits inside the viewport. No browser warnings or errors were captured. These are simulated browser viewports, not physical-device or child playtests.

Syntax and diff checks pass. Palette debt elsewhere remains 54 colours and 12 stroke widths; the new Delivery art introduces none. Recovery: `.qa/baselines/v291/RESTORE.md`. Evidence: `.qa/v291-tests.txt`, `.qa/v291-focused-tests.txt`, `.qa/v291-browser-checks.json`, `.qa/v291-phone-outcomes.json`, `.qa/v291-palette.txt`, `.qa/shots/v291-delivery-*`. Ordinary preview: `letters.html?v=20261023-delivery-release`.

**Release closure:** the owner accepted a finite-release workflow on October 23. The completed v267–v290 work is retained; v291 closes its pending Delivery integration. The checklist and stopping rule in `V3-GARDEN-ADVENTURES.md` supersede historical invitations above to keep finding another pass. Completed features are reopened only for a new reproducible defect, a directly relevant change, or an explicit request. No commit, push or production publish was performed. Audio remains parked.

## v292 — A challenge that waits for the child (2026-10-23, local)

The owner subsequently chose an ongoing goal delivered through closed finite revisions. This batch addressed a specific remaining mismatch: Burst grew from four to six choices with its winning streak and started its clock before the child was ready. The completed bin and Delivery work were not reopened.

Burst now prepares its targets through the shared learning plan using distinct eligible taught items. The 30-second clock remains the optional challenge; choice demand follows prior learning and cannot grow during the visit. Beginners see two choices. A wrong choice is recorded before help, then rests disabled; corrected and subsequent supported answers carry assisted evidence. Current choices and selections travel with each outcome. The prepared targets cycle without re-planning from the child's current streak.

A large coral Play button starts the clock. Previewing the board does not start response-time evidence. Replay also begins at this ready state. Existing pause, background handling, completion thresholds, reward keys and receipt movement are preserved. Because listening mode now uses the shared prompt policy, the shell limits pending-prompt input blocking to Burst's answer grid: Pause stays reachable, and a late speech reply cannot unlock a paused board. Unavailable eligible content returns to the existing retry screen without claiming completion.

Validation: **1,250 combined automated checks pass**, including 12 Burst engine checks. Actual browser play covered phone readiness, a mistake and correction, supported continuation, keyboard input, a real timed finish, replay, leaving and unavailable-content recovery. A controlled pending prompt verified Pause and a late reply while paused. Screens were inspected at 320×568, 390×844, 844×390 and 1280×800; the new Start target is 64×64px, and landscape choices remain at least 104×110px. Reduced-motion completion worked. No console warnings/errors were captured. These are simulated viewport checks, not physical-device or child playtests. Existing global palette debt is unchanged (54 colours, 12 stroke widths).

Recovery: `.qa/baselines/v292/RESTORE.md`. Evidence: `.qa/v292-tests.txt`, `.qa/v292-browser-checks.json`, `.qa/v292-phone-outcomes.json`, `.qa/v292-palette.txt`, `.qa/shots/v292-burst-*`. A lower-cost Luna agent updated only the bounded Burst behavior tests; the primary agent owned design, implementation, integration and browser verification. Local preview: `letters.html?v=20261023-burst-support`. No push, publish or audio generation/import.

The batch is closed. The next distinct candidate is chapter replay evidence: verify whether replaying a hidden prompt can still receive independent-listening credit before defining that correction's scope. The ongoing goal remains active; closed work stays closed.

## v293 — Replay is learning support (2026-10-23, local)

A controlled browser comparison confirmed that the ordinary chapter shell recorded both an unreplayed answer and an answer after Replay as independent listening. Replay now reveals the letter and marks the open attempt assisted. Asking for Replay or Help immediately retains support for that letter within the visit, without inventing an answer. A later encounter uses the existing supported matching rules. Replaying a completed prompt does not mark the next letter assisted.

The shared chapter playback callback also consumes synchronous and rejected playback failures, releases a supported question, and ignores stale results after a prompt/session change or exit. Existing audio assets, generation, voices, curriculum, rewards and progression storage are unchanged.

Validation: **1,257 combined checks pass**, including 14 focused checks for the actual chapter shell and shared support. Browser before/after evidence shows Replay changes from independent listening to assistance, while an unreplayed target still earns independent-listening credit. In a four-round Pond visit, the helped letter returned with a visible model and two choices; an intervening different letter remained independent. Pending Replay and rejected playback left questions answerable, and the run reached the normal three-star handoff. The affected state was visually inspected at 320×568 and 1280×800 with reduced motion enabled. No browser errors/warnings were captured. Deferred playback controls isolated the learning boundary; this was not an audio pronunciation test, native-device test or child learning study.

Recovery: `.qa/baselines/v293/RESTORE.md`; new tests: `src/letters/tests/chapter-replay-v293.test.cjs`. Evidence: `.qa/v293-before.json`, `.qa/v293-after.json`, `.qa/v293-focused-tests.txt`, `.qa/v293-tests.txt`, `.qa/v293-browser-checks.json`, `.qa/shots/v293-replay-*`. Syntax and diff checks pass. Preview: `letters.html?v=20261023-replay-support`. No push or publish; audio generation/import remains parked. This small shared-learning change was kept with the primary agent rather than adding delegation overhead.

The batch is closed. The next candidate is the separate practice-header Replay fallback: verify whether it informs each game's support state before proposing a change. Do not reopen the completed chapter correction, bin, Delivery or Burst batches without new evidence.

## v294 — Practice Replay gives help (2026-10-23, local)

Actual Water Garden play reproduced a separate practice-path issue: header Replay repeated speech while the model stayed hidden, and the next answer still counted as independent listening. Water Garden, Letter Hunt and Friend Find now reveal their existing letter/picture model immediately on active Replay, release waiting input and keep the attempt assisted. Replay and Help remember the target within the visit. Returning helped targets use visible support and at most two choices; Water Garden also omits the additional routing task on that supported return. Unrelated targets retain their planned level. No synthetic answer is recorded for asking for help.

The practice header only dispatches to its own live game. Finished, cancelled and detached screens cannot replay through stale handlers; cancelled practice cannot record outcomes or pay. Playback fallback failures are contained. Existing curriculum, audio files, save format, rewards, art and touch targets are preserved.

Validation: **1,268 combined tests pass**. Focused coverage exercises replay/help, stale speech, support retention, independent intervening targets and practice completion/cancellation. A lower-cost model handled bounded tests in three existing files; the primary model owned learning behavior and integration. Browser play covered all three four-target sequences with actual practice-shell reporting, phone/desktop layouts and reduced motion. Water Garden completed into free play, a paid finish and the practice garden; Hunt and Friend Find reached their ordinary paid finishes. Controlled pending and rejected playback verified Friend Find remained usable. No browser warnings/errors were captured. These are browser and automated checks, not pronunciation review, physical-device tests or child learning measurements.

Recovery: `.qa/baselines/v294/RESTORE.md`. Evidence: `.qa/v294-browser-checks.json`, `.qa/v294-*-outcomes.json`, `.qa/v294-tests.txt`, `.qa/shots/v294-*`. Preview: `letters.html?v=20261023-practice-support`. All changes remain local; audio generation/import and publishing stay parked.

This batch is closed. Next candidate: inspect the 800ms automatic final-word exit in WordGames before deciding whether a child-led ending would give children more time to enjoy their successful word. This is a distinct pacing question, not another replay or art audit.

## v295 — The child keeps the successful word (2026-10-23, local)

Actual Word Gap play showed a completed joined word disappearing into the next question without input. Twin Crown, Listen and Find, and Word Gap now retain every successful result until the child chooses a wordless Next button or the final checkmark. The 56px control shares the existing paper/coral treatment and sits beside centered progress. Answer controls rest after success; the word can still be heard again. Listen and Find also reveals its word reference after the accepted correct answer.

Continuation owns the round transition, invalidates old controls and clears delayed feedback from the prior round. Finishing is single-shot. Keyboard continuation focuses the new answer or listening control, and success focuses Next without scrolling. Reduced motion keeps the same available actions. Existing word eligibility, curriculum, learning rules, art, rewards and saved-data formats are preserved.

Validation: **1,270 combined tests pass**. Bounded test work was delegated to a lower-cost model in the existing word-game test file; primary work covered interaction design, shared state, styling and integration. Browser checks played all three sequences through their ordinary paid finishes. Word Gap also returned to the practice garden. Checks covered completed-word replay, keyboard continuation, 320×568 phone, 844×390 landscape, 1280×800 desktop and reduced motion. Phone/landscape controls measured 56×56px and remained within the viewport. No application warnings/errors occurred after correcting an initial QA-only world fixture omission. Playback results were controlled; audio pronunciation, physical devices and child playtesting were not assessed.

Recovery: `.qa/baselines/v295/RESTORE.md`. Evidence: `.qa/v295-browser-checks.json`, `.qa/v295-*-outcomes.json`, `.qa/v295-tests.txt`, `.qa/shots/v295-*`. Syntax and diff checks pass. Preview: `letters.html?v=20261023-word-pace`. No push or publish; audio generation/import remains parked.

This revision is closed. Next candidate: determine whether repeated taps on a rejected word choice are counted as separate failures. This is a distinct error-recovery question; do not repeat completed pacing or art work.

## v296 — One mistaken choice, one gentle recovery (2026-10-23, local)

Browser Word Gap recorded three failures from three taps on the same rejected tile. Twin Crown, Listen and Find, and Word Gap now consume each incorrect choice once per round before reporting it. Repeated clicks, keyboard handlers and drag attempts cannot add mistakes or queue more feedback. The tried choice rests in place on an opaque paper surface with a quieter contour; the correct hint remains actionable. Correction retains assisted credit, and new rounds start with fresh choices.

Validation: **1,273 combined tests pass**, including 16 focused word-game tests. A lower-cost model handled bounded tests; primary work owned recovery behavior, styling, integration and browser play. Coverage includes delayed-feedback duplication, direct repeated callbacks, new-round reset, stale handlers and repeated drag. An older prototype-only drag fixture was updated to provide the round state normally initialized by the constructor. Actual practice-shell browser checks covered all three games, phone/desktop, keyboard correction, replay after rejection, reduced motion and ordinary Twin Crown completion. No browser errors or warnings. Controlled playback, isolated test progress; no pronunciation review, physical-device or child playtesting. Reward/save implementation is unchanged; this revision does not claim a new independent persistence audit.

Recovery: `.qa/baselines/v296/RESTORE.md`. Evidence: `.qa/v296-before.json`, `.qa/v296-browser-checks.json`, `.qa/v296-tests.txt`, `.qa/shots/v296-word-gap-phone.png`, `.qa/shots/v296-word-gap-desktop.png`. Syntax/diff checks pass. Preview: `letters.html?v=20261023-word-recovery`. Changes remain local; audio and publishing remain parked.

Closed. Next candidate: the full-screen repeating rain visible in these screenshots. Assess a distinct atmospheric-art refinement that keeps the garden intact while reducing competing motion during learning; do not reopen completed word recovery or other closed work.

## v297 — Weather belongs in the garden (2026-10-23, local)

The previous drizzle painted continuous diagonal lines across the screen. Its map overlay also sat above the isolated scrolling map, including letter stops. Rain is now sixteen short, irregularly positioned drops with staggered 3.2–4.1 second cycles. Lessons and introduction screens keep only the eight outer drops, leaving the central teaching area quiet. Day/night use existing palette colours. Existing garden scenery and daily weather selection are preserved.

Map rain moves into the map’s stacking context, below stops and props. It stays viewport-sized while the map scrolls. The layer remains decorative and pointer-transparent; both reduced motion and gentle mode hide it. No audio, learning, reward or save behavior changed. The art bible now states the short-drop and behind-controls rules.

Validation: **1,273 combined tests pass**, including the existing weather checks. Browser checks cover day/night, 320×568 and 390×844 phones, 1280×800 desktop, map scrolling and chapter entry, ordinary word input, introductions, in-app reduced motion and gentle mode. Rain stayed at y=0/height=844 when map scroll changed from 3246 to 2402; map stops paint above it. No browser warnings/errors or new off-palette literals. Isolated controlled-weather/phase fixture; no physical-device testing or measured child-attention claim. OS reduced-motion CSS remains unchanged. Kept this small rendering change with the primary agent to avoid delegation overhead.

Recovery: `.qa/baselines/v297/RESTORE.md`. Evidence: `.qa/v297-browser-checks.json`, `.qa/v297-tests.txt`, `.qa/v297-weather-tests.txt`, `.qa/v297-palette-delta.json`, `.qa/shots/v297-*`. Syntax/diff checks pass. Preview: `letters.html?v=20261023-quiet-rain`. Local only; audio and publishing remain parked.

Closed. Next investigation: first-time Practice Garden entry—whether the available games provide a clear place for a beginner to start. Inspect the actual flow before proposing a change; no defect is assumed.


## v302 — Rehearse the syllables just constructed (2026-10-23, local)

An observed first fatha visit built four syllables, then Pond asked for two syllables outside that constructed set. First fatha and kasra/damma visits now choose at most four authored syllables (three in Sprout), including the introduction examples. Joining begins with those examples and constructs the whole set. The following matching, drawing or fruit-picking activity draws from that same set. Completed chapter replay and other chapter selection are unchanged.

New guided-vowel checkpoints retain bounded, deduplicated item IDs. Resume resolves IDs against the chapter catalogue; invalid sets fall back safely. Existing step, stars, rewards and curriculum remain intact. Legacy checkpoints never stored item IDs, so their old random selection cannot be reconstructed.

Validation: 1,303 automated tests pass, including nine runtime checks covering selection, warmup order, save normalization, save/reload round trip, invalid IDs, legacy checkpoints and unchanged other chapters. Browser play verified fatha introduction/joining/Pond/Trace entry, a real reload preserving items and checkpoint stars without extra payment or learning outcomes, and kasra/damma introduction/joining/Pond/Catch. Phone 390×844, desktop 1280×800 and in-app reduced motion inspected; no browser warnings/errors. Trace target selection was verified without repeating its unchanged completion mechanics. Playback was controlled for lifecycle testing; pronunciation, physical devices and child learning outcomes were not reviewed.

Recovery: `.qa/baselines/v302/RESTORE.md`. Evidence: `.qa/v302-tests.txt`, `.qa/v302-browser-checks.json`, `.qa/shots/v302-*`. A lower-cost agent produced eight narrowly scoped runtime tests; the primary reviewed them, added the save-schema round trip and owned learning selection, integration and browser play. Local preview: `letters.html?v=20261023-v302`. No publishing or audio changes.

Closed. Next distinct discovery: inspect the first tanween contrast lesson before deciding whether its new marks and mixed example pool need a gentler introduction.


## v303 — Notice the tanween mark (2026-10-23, local)

The observed first tanween visit chose four questions from 22 mixed syllables, changing both base and mark between choices. First visits now isolate the new distinction on Baa: بً/بَ, بٍ/بِ, بٌ/بُ, then the reverse بَ/بً comparison. Three-round Sprout visits cover all three tanween forms. The ordinary vowels reuse the exact authored earlier-chapter content.

Pond, Build and Feed keep the same target sequence; matching stays visible with two still choices and randomized answer positions. Building retains its parts and motor-practice evidence. The opt-in authored plan resolves contrasts against lesson items and eligible review references, falling back to adaptive planning if incomplete. Completed tanween replays and other worlds remain adaptive. Resuming reconstructs the deterministic first lesson while retaining the existing checkpoint and stars; no save schema or reward changes.

Validation: 1,309 automated tests pass, including six focused runtime checks. A lower-cost model wrote bounded tests; primary work owned learning design, implementation, review and integration. Actual first introduction→Pond→Build→Feed, existing Hat Shop, chapter celebration and return/reload verified. Checks include a wrong comparison and replay-assisted correction, keyboard continuation, phone 390×844, desktop 1280×800, in-app reduced motion, no extra payment/outcomes on resume, and persisted earned stars/completion. No browser warnings/errors. Controlled playback; no pronunciation, physical-device or child learning claims.

Recovery: `.qa/baselines/v303/RESTORE.md`. Evidence: `.qa/v303-tests.txt`, `.qa/v303-browser-checks.json`, `.qa/shots/v303-*`. Preview: `letters.html?v=20261023-v303`. Local only; audio and publishing remain parked.

Closed. Separate next candidate: the existing automatic friend-stop handoff adds Hat Shop after the three illustrated activities, before the party, and expands to a broader review pool. Assess a more predictable ending without reopening this contrast pass or changing progression silently.

## v304 — Finish the chapter, choose the extra (2026-10-23, local)

Completing the pictured chapter route now saves its existing stars and progress and shows its celebration immediately. The previous automatically opened friend game remains available through a wordless picture button. Home stays the prominent action. On narrow phones and short landscape layouts the three optional actions share a row above Home; desktop and wider phones keep a single action row. Existing practice art, focus tokens and restrained press feedback are reused.

The extra game runs in its own session and returns to the same earned celebration on completion, Home or cancellation. It cannot repeat chapter awards. Session/screen guards reject duplicate launches and stale callbacks. Old final-step checkpoints finish directly; daily/checkup completion and bonus content stay unchanged.

Validation: 1,317 automated tests pass, including eight focused chapter-ending runtime tests. A lower-cost agent supplied bounded tests and updated two obsolete assertions; primary review added active-stale/double-launch coverage and owned implementation, integration and browser checks. Actual final Feed play from an isolated checkpoint led directly to the party. Optional Hat Shop keyboard launch, early Home return, full completion, focus restoration, unchanged stars/progress/wallet and reload verified. Phone 390×844 and 320×568, landscape 667×375 and desktop 1280×800 controls are visible and at least 52px; reduced motion and keyboard focus checked. No browser warnings/errors. New CSS stays on palette; existing global palette debt is deferred.

Evidence: `.qa/v304-tests.txt`, `.qa/v304-browser-checks.json`, `.qa/shots/v304-chapter-party-*`. Recovery: `.qa/baselines/v304/RESTORE.md`. Preview: `letters.html?v=20261023-v304`. Browser QA uses controlled prompt playback and seeded prior chapter steps; no audio, physical-device or child-learning claims. Local only.

Closed. Next distinct candidate: observe the first standing-vowel practice handoff, where three introduced Baa examples lead to a pool of 18 randomly based syllables. Verify the actual child-facing difficulty before selecting an implementation scope.

## v305 — A familiar bridge into long vowels (2026-10-23, local)

The first standing-vowel lesson previously introduced three Baa examples, then sampled 18 mixed syllables: the observed Pond opener asked خٗ versus طٗ. The adjoining long-vowel chapter introduced Baa then opened Build on لُو from a 12-item pool. First visits now keep their three authored Baa forms, comparing each with its familiar short vowel. A fourth reversed comparison asks for بَ rather than the long aa form.

Both lessons reuse the existing authored-lesson planner, canonical speech/parts and eligible earlier-chapter review items. Standing Pond/Feed/Catch keep one target sequence; long-sounds Build/Pond/Pairs keep the same lesson set (two beginner matching beds cover all four). Recognition choices remain visible and still, with randomized sides. Sprout's three rounds cover all three new long forms. Completed replay retains the original 18/12-item pools. No curriculum order, game mechanics, art, audio, reward or save-schema changes.

Validation: 1,324 tests pass, including seven bounded runtime tests supplied by a lower-cost model and tightened by primary review. Both full introductions and three-game routes were played. Standing wrong-choice comparison, assisted correction, midpoint reload/continued selection and unchanged resume wallet verified; long building retains motor evidence, replay stays assisted, and keyboard matching continuation works. Both chapter completions persist across reload without new payment. Phone390×844, desktop1280×800 and app reduced motion checked; no browser warnings/errors.

Evidence: `.qa/v305-before.json`, `.qa/v305-tests.txt`, `.qa/v305-browser-checks.json`, `.qa/shots/v305-*`. Recovery: `.qa/baselines/v305/RESTORE.md`. Normal preview: `letters.html?v=20261023-v305`. Isolated first-visit preview: `.qa/vowel-review.html?preview=1&lesson=standing&v=305` (existing audio enabled). Browser evidence uses controlled prompt playback; no pronunciation, physical-device or child-learning claims. Local only.

Closed. Next distinct candidate: observe the untouched first-glide chapter handoff, whose two Baa introductions currently lead to ten randomly based syllables. No implementation decision until its actual play reveals a specific problem.

## v306 — Notice the glide (2026-10-23, local)

After introducing بَوْ and بَيْ, the first Leen Pond previously opened on لَيْ versus يَيْ from ten mixed syllables. First visits now keep the introduced Baa base and compare بَوْ/بُو and بَيْ/بِي, followed by the reversed comparisons. The familiar long-vowel twins reuse the preceding chapter's canonical objects; their review references carry its prerequisite.

Pond, Build and Feed retain the same four-example schedule through the existing authored-lesson planner. Three-round Sprout includes both glides. Recognition choices are visible and still with shuffled sides. Original speech/parts, game/curriculum order, rewards and checkpoint schema remain unchanged; completed replay retains its ten-item mixed pool.

Validation: 1,329 tests pass, including five focused runtime tests. Full introduction and three-game route played. Wrong long-vowel selection produced the vowel-mark hint and assisted correction; midpoint reload preserved the same examples and wallet. Canonical build parts, keyboard Next, reduced motion, phone390×844 and desktop1280×800 checked. Final completion/stars/wallet persisted across reload without extra payout. No browser warnings/errors.

Evidence: `.qa/v306-before.json`, `.qa/v306-tests.txt`, `.qa/v306-browser-checks.json`, `.qa/shots/v306-*`. Recovery: `.qa/baselines/v306/RESTORE.md`. Normal preview: `letters.html?v=20261023-v306`; isolated fresh-lesson preview: `.qa/vowel-review.html?preview=1&lesson=leen&v=306`. QA used controlled prompt playback; no audio/pronunciation, physical-device or child-learning claims. Local only.

Closed. Next candidate: examine the first general short-word chapter (no meet cards, up to eight words, Feed→Build→Pond) to identify a specific decoding/interaction issue before making changes. Intervening small authored syllable sets do not justify repeating this item-pool revision automatically.

## v307 — One collection for the first word raft (2026-10-23)

The first short-word Feed gathered four words, but Build independently selected another four from an eight-word pool. Two observed words changed between gathering and building.

- An unfinished `words-2` visit now selects four eligible words with the existing adaptive planner (three in Sprout), and all three games cover that collection. Completed replay and other chapters retain their existing pools.
- Optional bounded `wordItemIds` checkpoint metadata restores canonical curriculum words, in the saved order, after an interruption. Invalid/foreign IDs fall back to a safe small set; legacy step/star checkpoints still work.
- Curriculum order, pronunciation content, rewards, assembly and matching evidence are unchanged. This is rehearsal continuity, not a claim of independent decoding.

Verification: 1,338 tests pass, including nine focused selection/save/recovery tests. Full phone Feed→desktop reduced-motion Build→phone Pond→party→return/reload played; same collection across all three, wrong/replay support, midpoint restoration, persisted completion and no reload payment verified. Browser console clean and diff whitespace check passes. Controlled speech and isolated prerequisite fixtures were used; audio review, physical-device and child tests remain outstanding. Evidence: `.qa/v307-browser-checks.json`, `.qa/v307-tests.txt` and `.qa/shots/v307-*`. Recovery: `.qa/baselines/v307/RESTORE.md`. Local only.

October 25 recovery follow-up: Retry after missing word data now uses the same selection policy and resolves saved IDs once the catalogue loads. Fresh and saved recovery were reproduced and checked in the browser; a delayed response cannot resurrect an abandoned session. The isolated direct preview waits for initial word loading.

## v308 — Carry longer words through the adventure (2026-10-25)

The first three-letter route gathered four words, then replaced two when construction began. The remaining word chapters now share the first-word visit policy: four adaptively selected words (three in Sprout), carried through their existing activities and restored after an interruption. Three-letter and four/five-letter bands, game order, prepared construction pieces, matching support, rewards and broad eight-word completed replay remain.

Catalogue verification also found three legitimate three-letter words (`مَـٰلِكِ`, `هَـٰذَا`, `إِلَـٰهِ`) were omitted from construction because tatweel was counted as a fourth piece. Segmentation now ignores that decorative extender and keeps following vowel marks on the preceding letter. Original whole-word display and audio references stay intact.

Verification: 1,342 automated tests pass. Both complete browser routes, same-set coverage, three-letter midpoint resume, final saves and no reload reward verified; all three repaired words were assembled. Phone and desktop layouts, reduced motion and keyboard continuation inspected. Four bounded tests were delegated to a lower-cost model and reviewed/strengthened by the primary model. Controlled speech and isolated fixtures were used; pronunciation review, physical-device testing and child learning validation remain outstanding. Evidence: `.qa/v308-browser-checks.json`, `.qa/v308-tests.txt`, `.qa/shots/v308-*`. Recovery: `.qa/baselines/v308/RESTORE.md`. Local only.


## v327 — Your creation stays yours (2026-10-26, local)
- Completed lanterns, fruit, seed jars, rafts and flower beds keep the labels used in their celebration. Returning through the village or reloading no longer reshuffles the creation.
- The four drawing chapters retain up to three PNG signs each, independently of the rolling drawing history. Saved data is bounded, validated and scoped to the child; replay replaces only that chapter after completion.
- Older completions use authored catalogue/meeting order without altering progress. Browser storage failures retain the previous disk copy and use the existing save-status notification.
- Verification: 1,425 tests passed (10 new identity/save cases), plus phone browser final Unfuse → party → garden → village → garden → reload. Drawing identity also checked through a fixture-supplied pink sign. Audio/SFX stubbed in QA; no physical-device or child test.
- Evidence: `.qa/v327-browser-checks.json`, `.qa/v327-tests.txt`, `.qa/v327-*-phone.png`, `.qa/v327-drawn-bed-*.png`. Recovery: `.qa/baselines/v327/RESTORE.md`.


## v328 — Show me how to fish (2026-10-26, local)
- A first beginner visit demonstrates tapping the target fish with the existing interruptible hand cue. A pictured hand button can repeat the demonstration on any active round; returning visits are not automatically coached again.
- Help reveals the target and preserves swimming fish positions before stopping their motion. Demonstrated catches remain assisted learning evidence; unused help does not downgrade an independently heard answer.
- Catching, completing, or leaving retires the cue. The controls fit 320px phones, and reduced motion uses a static hand. Existing fish art, catch flight, readiness and rewards remain intact.
- Verification: 1,431 tests pass (6 new fishing cases); 390×844 full two-catch browser visit with a deliberate miss, 1-star finish and replay; 320×568 help layout; 1280×800 static help and exit during cue. A QA control forced swimming solely to check cue geometry; this was not a new mastery-progression test. Audio/SFX were stubbed; no physical-device or child playtest.
- Evidence: `.qa/v328-browser-checks.json`, `.qa/v328-tests.txt`, `.qa/v328-fishing-help-phone.png`, `.qa/v328-help-small-phone.png`, `.qa/v328-help-desktop-still.png`. Recovery: `.qa/baselines/v328/RESTORE.md`.


## v329 — See why the dots belong (2026-10-26, local)
- Dot Nests uses the letter's orange dot colour in its nests. On help, actual letter/nest dots briefly pulse in corresponding order, while the shared hand demonstrates moving the letter to its nest. Empty nests remain empty.
- The first beginner visit gets one automatic example. Later rounds and visits retain a pictured hand button; wrong placements offer the comparison. Dragging and tap-to-place remain available, and shown answers are recorded as assisted letter-form practice.
- Comparisons stop on input, placement, round changes and exit. Reduced motion keeps static guidance. Existing choices, above/below readiness, rewards and artwork layout are preserved.
- Verification: 1,439 tests pass (8 new cases), 32 focused. Browser: complete390×844 count visit (wrong drag, correct tap, correct drag);320×568 reduced-motion repeat (drag during guidance, correct empty-nest tap, no additional star);1280×800 fixture-selected above/below layout; exit cleanup. Fishing's shared help shell smoke checked. No physical-device/child test; prerequisites seeded and audio/SFX stubbed. Above/below fixture checks rendering, not mastery progression.
- Evidence: `.qa/v329-browser-checks.json`, `.qa/v329-tests.txt`, `.qa/v329-dot-comparison-phone.png`, `.qa/v329-help-small-phone-still.png`, `.qa/v329-where-help-desktop.png`. Recovery: `.qa/baselines/v329/RESTORE.md`.


## v330 — The same help in standalone play (2026-10-26, local)
- Standalone Feed and Workshop now connect the existing mini-game gesture demonstrations to the practice header. First visits can demonstrate the first move; repeat visits keep optional pictured help. No new tutorial system or lesson mechanic.
- Showing an answer marks the current prompt assisted. Correct outcomes retire the helper until the next round; finishing/cancelling gates retained callbacks. Fishing and Dot Nests retain their own assistance callbacks.
- Verification: 1,448 tests pass (9 new shell-integration cases),26 focused. Browser completed4 Feed rounds via pet drag and tap-to-basket, then4 Workshop constructions including prepared pieces and guided undo. Both paid1star; only helped answers were assisted, later untouched construction retained motor evidence. Both replays had firstActionDemo=false.320px/390px phone and1280px desktop layouts, reduced motion and exit-during-help checked.
- Limits: adult browser QA with seeded prerequisites and stubbed audio/SFX; no physical-device or child test. All changes remain local.
- Evidence: `.qa/v330-browser-checks.json`, `.qa/v330-tests.txt`, `.qa/v330-feed-help-phone.png`, `.qa/v330-workshop-help-small-phone.png`, `.qa/v330-workshop-desktop-still.png`, `.qa/v330-feed-small-phone-still.png`. Recovery: `.qa/baselines/v330/RESTORE.md`.


## v331 — A puzzle that accepts the child's order (2026-10-26, local)
- A correctly fitting piece used to be rejected when its gap was not highlighted. Each piece now targets its own remaining gap. The highlight suggests a start; dragging and tapping work in any order.
- Wrong-gap drops return home. Stale/duplicate callbacks remain gated, with one completion record per picture. Difficulty, artwork, rewards and motor-only learning evidence are unchanged.
- Verification: 1,451 tests pass; 13 focused tests include all32 placement orders across2/3/4-piece boards and actual drag callback wiring. Browser:390px full two-picture visit, wrong drop, unlit correct drop, tap alternative and1star.320px reduced-motion four-piece board completed out of order;1280px layout and exit cleanup checked.
- Limits: adult browser QA, seeded prerequisites and stubbed audio/SFX. Four-piece fixture checks layout, not mastery progression. No child or physical-device playtest. Local only.
- Evidence: `.qa/v331-browser-checks.json`, `.qa/v331-all-tests.txt`, `.qa/v331-jigsaw-before-phone.png`, `.qa/v331-jigsaw-free-order-phone.png`, `.qa/v331-jigsaw-four-piece-still.png`, `.qa/v331-jigsaw-desktop.png`. Recovery: `.qa/baselines/v331/RESTORE.md`.


## v332 — Discoveries inside Letter Hunt (2026-10-26, local)
- The existing11 props now respond according to what they are: clouds rain, kites lift, flags flutter, plants bloom, ladybugs appear on rocks/crates, water ripples, lanterns glow and shells reveal a pearl. Touching plain scenery or finding its letter triggers the response.
- One brief reaction at a time keeps attention clear. Quick taps retarget it; render, resize, round changes and exit clean it up. Reduced motion shows static discoveries. Letter-bearing choices retain their original learning response.
- Existing replay already changes targets/locations and was preserved. Scenery adds no answer evidence or rewards; wrong-answer recovery, child-led next and payout limits remain intact.
- Verification:1,459 tests pass;19focused including8new scenery/lifecycle cases.390px full four-find visit with wrong-answer recovery and1star;320px reduced-motion four-find replay retained wallet1; keyboard scenery play;1280px lagoon and exit checks. All11 reaction artworks visually reviewed together.
- Limits: adult browser QA, seeded prerequisites, stubbed audio/SFX. Lagoon chosen by fixture for layout, not progression. No child/physical-device test. Local only.
- Evidence:`.qa/v332-browser-checks.json`,`.qa/v332-all-tests.txt`,`.qa/v332-hunt-blooms-phone.png`,`.qa/v332-hunt-rain-small-still.png`,`.qa/v332-hunt-water-desktop.png`,`.qa/v332-hunt-art-review.png`. Recovery:`.qa/baselines/v332/RESTORE.md`.


## v333 — See the family, send the bus (2026-10-26, local)
- Family Buses now offers pictured help and shows a side-by-side whole-letter comparison after misses. Matching body colour and distinct orange dots explain what the letters share while retaining their differences.
- Correct boarding shows that comparison without changing the answer's assistance record. The bus waits with a large arrow; the child sends it away. A brief boarding gate prevents the placement tap from also departing. Duplicate/stale handlers remain guarded.
- Family selection, taught-only choices, readiness and rewards are preserved. Small3bus layouts stack the comparison; reduced motion retains the comparison and shortens departure.
- Verification:1,464 tests pass;21focused including5new cases.390px complete3rider visit through drag, wrong-drop recovery, optionalhelp and tap;1star.320x568 reduced-motion3bus fixture completed with keyboard departures; wallet stayed1.1280px comparison and exit during departure verified.
- Limits: adult browser QA, seeded prerequisites, stubbed audio/SFX;3bus fixture is a layout/interaction check rather than progression testing. No child or physical-device test. Local only.
- Evidence:`.qa/v333-browser-checks.json`,`.qa/v333-all-tests.txt`,`.qa/v333-bus-ready-phone.png`,`.qa/v333-family-help-phone.png`,`.qa/v333-family-small-three-still.png`,`.qa/v333-family-desktop.png`. Recovery:`.qa/baselines/v333/RESTORE.md`.


## v334 — Time to notice the change (2026-10-26, local)
- Beginner Spot Change now chooses a position that can change body shape when the taught pool permits. Previously a random position could force a subtle dot swap despite an easier body change elsewhere. Later same-body comparisons remain available.
- Look-again keeps the original board visible until the child chooses to continue. Success shows the old and new letters at equal size, emphasizing the changed body or dots, and waits for an explicit next action. Arabic comparison reads right-to-left.
- Assistance, memory-task evidence, taught-only choices, visit difficulty and reward rules remain intact. Duplicate/stale callbacks cannot report or advance again.
- Verification:1,468 tests pass;4new behavior tests plus21existing focused tests.390px complete beginner visit included repeated review, wrong-answer recovery, unassisted find and1star.320x568 reduced-motion3choice fixture completed by keyboard, with1→3dot emphasis; no extra replay star.1280px layout and exit during blink checked.
- Limits: adult browser QA with seeded prerequisites and stubbed audio/SFX.3choice fixture verifies layout/interaction, not progression. No physical-device or child test. Local only.
- Evidence:`.qa/v334-browser-checks.json`,`.qa/v334-all-tests.txt`,`.qa/v334-spot-body-comparison-phone.png`,`.qa/v334-spot-dots-small-still.png`,`.qa/v334-spot-desktop.png`. Recovery:`.qa/baselines/v334/RESTORE.md`.


## v335 — Help keeps the child's drawing (2026-10-26, local)
- Sand Table help now demonstrates the unfinished stroke or dot on the existing guide. Previously it destroyed that guide and erased completed work. Only the cue pen moves; partial and completed ink remain intact.
- New input interrupts the demonstration and resumes at the child's current position. Repeated help, reset, capture cancellation and exit retire old callbacks. Reduced motion uses static guidance. Raking remains an intentional reset; learning participation and one-outcome rules are unchanged.
- Verification:1,472 tests pass, including4new guide-help cases and20existing focused cases.390px actual pointer-drawn body and partial stroke survived help; dot input interrupted the demo and finished; rake/redraw did not duplicate the outcome;1star.320px keyboard/static-help replay retained wallet1.1280px keyboard-body/static-help and exit cleanup checked.
- Limits: adult browser QA, single-letter fixture, audio/SFX stubbed. Compact native touch simulation mapped coordinates into the toolbar, so320px pointer behavior was not verified; that size was checked for layout, statichelp and keyboard only. No child or physical-device test. Local only.
- Evidence:`.qa/v335-browser-checks.json`,`.qa/v335-all-tests.txt`,`.qa/v335-sand-help-preserves-body.png`,`.qa/v335-sand-help-small-still.png`. Recovery:`.qa/baselines/v335/RESTORE.md`.


## v336 — Different adventures on return visits (2026-10-26, local)
- User observation: repeated play feels too similar. Both existing garden projects always used Delivery → Drawing → Water. Return visits now rotate through three short routes: Delivery → Drawing → Water; Picture Hunt → Drawing → Feed; Fishing → Drawing → Water. Wordless picture strips show the activities before choosing and throughout play.
- First-ever and single-letter visits retain the original route. A route is saved when started; only completing it advances the bounded recent-route history. Old active saves resume their original route. Projects, real child drawings, original curriculum, and reward limits remain in their existing stores.
- Activities use the saved taught-letter pool. Help carries across activities and keeps matching/two-choice support. Fishing follows the adventure targets without importing the wider known-letter pool. Feeding now commits the finale through the normal completion path; Water retains its guided-to-free-play handoff.
- Verification: 1,481 tests pass, including 9 new route/migration/resume/support/finale/save-retry cases. Actual 390px play completed the entire hunt/draw/feed route, including help on ب, two pointer-made drawings and reload before Feed. Completed fishing/draw/water next; history became grow/picnic/pond and the following visit showed delivery. Wallet increased 3 then 2; the shared drawing activity did not repay. First-visit entry/exit preserved the original route. 320px keyboard/reduced-motion fishing and pictured cards checked; 1280px cards aligned with no horizontal overflow. Browser warnings/errors empty.
- Limits: adult browser QA with a seeded completed Boat chapter and stubbed audio/SFX. No child or physical-device testing; compact pointer gestures were not claimed. Routes deliberately retain the familiar drawing step and existing garden payoff. Audio remains parked. Local only.
- Evidence: `.qa/v336-browser-checks.json`, `.qa/v336-all-tests.txt`, `.qa/v336-next-route-small.png`, `.qa/v336-pictured-routes-phone.png`, `.qa/v336-resumed-picnic-sign.png`, `.qa/v336-rotated-route-desktop.png`. Recovery: `.qa/baselines/v336/RESTORE.md`.


## v337 — Two ways to play Friend Pairs (2026-10-26, local)
- Repeated standalone visits previously always hid the cards after the same peek. The child now chooses, through pictures, between visible matching and the original memory game. Guided/chapter launches retain the existing memory path.
- In visible play, bring a letter to its animal friend by dragging or by tapping the letter and then the friend. Large receiving targets use the existing forgiving hit test. Correct letters settle into the friend's slot; mismatches reset gently. The completed group stays until the child chooses to continue or finish. All characters come from the taught pool and the existing board-size policy remains intact.
- Visible play records letter-form matching only. A corrected mismatch is assisted; it earns no memory or listening mastery and does not increase memory-board difficulty. Both modes use the same FriendPairs reward cap.
- Art/layout: pictured mode cards reuse the native letter animals and leaf-backed cards; warm matching mat with receiving slots. The four-pair compact layout keeps every target and loose letter visible. Empty trays fold away on completion. Explicit grid tracks keep tall letters centered inside their slots.
- Verification: 1,488 tests pass, including 7 new bounded runtime tests (lower-cost model, reviewed and strengthened). Actual 390px wrong/retry, pointer drag, tap and finish; 320px keyboard/reduced-motion visible replay; 1280px original memory completion with mismatch recovery. Wallet remained 1 across replays. Four-pair layout fixture completed one board and advanced, with 320px portrait and 844px landscape checks. Guided entry still starts memory directly; exit clean; no browser warnings/errors.
- Limits: adult browser QA with seeded Boat prerequisite and stubbed audio/SFX, no child/physical-device claim. Larger-board fixture checks layout/interactions, not attainment of that difficulty. Audio parked; local only.
- Evidence: `.qa/v337-browser-checks.json`, `.qa/v337-all-tests.txt`, `.qa/v337-modes-focused.txt`, `.qa/v337-mode-choice-phone.png`, `.qa/v337-visible-pairs-desktop.png`. Recovery: `.qa/baselines/v337/RESTORE.md`.


## v338 — A picnic shaped by the child's choices (2026-10-26, local)
- Feeding already accepted either the pet or the basket, but the basket was emptied every round. Standalone visits now retain collected snacks. After the four learning rounds, the pet and up to two familiar animal friends gather at an optional picnic; snacks given directly to the pet are already on its plate.
- Children can share basket snacks with any friend by dragging or tapping, tap the characters for a brief reaction, or finish immediately. A visit with no basket snacks also finishes freely. This is unscored play: no additional questions, mastery, stars or persistent storage. Chapter/adventure feeding retains its original completion path.
- Native art provides the cloth, plates and seed packets. Portrait, short-screen and landscape layouts keep the controls accessible. Reduced motion skips the character hop. Input and completion guards prevent duplicate sharing or rewards; the old feeding scenery retires when the picnic takes over.
- Verification: 1,496 tests pass, including 8 new bounded cases authored by a lower-cost model and reviewed/strengthened. Adult browser play completed mixed pet/basket deliveries and native drag/tap sharing at 390px; keyboard/reduced-motion sharing at 320px; pet-only and all-basket replays, including finishing without sharing. Learning stayed at the four original outcomes; wallet stayed at one star across replays. Desktop 1280×800, portrait 390×844 and 320×568, landscape 844×390 inspected. No browser warnings/errors.
- Limits: seeded Boat prerequisite and stubbed speech/SFX in the QA fixture; no child or physical-device test, no 320px native pointer claim. Collection lasts for the visit only. Audio remains parked. Local only.
- Evidence: `.qa/v338-browser-checks.json`, `.qa/v338-all-tests.txt`, `.qa/v338-picnic-phone.png`, `.qa/v338-picnic-desktop.png`, `.qa/v338-pet-only-small.png`, `.qa/v338-picnic-landscape.png`. Recovery: `.qa/baselines/v338/RESTORE.md`.


## v339 — Make your own picture puzzle (2026-10-26, local)
- Repeated jigsaw visits previously chose the picture for the child and automatically replaced the completed board. Standalone jigsaw now offers the original puzzles alongside a picture maker. Children arrange one or two familiar animal friends, then assemble that exact picture with the existing piece-count and matching rules.
- Friends can be dragged or selected and placed by tapping. Occupied positions swap, choices can be replaced or removed, and a single friend is enough to begin. Completed custom pictures stay until the child chooses to change the picture or finish. Native framed scenery, familiar letter animals and large controls support portrait and landscape play.
- Guided launches still start the original jigsaw directly. Custom pictures produce at most one construction participation record per visit, with no letter mastery; subsequent pictures remain free play. Existing reward limits, curriculum and saves are unchanged. Pictures are not stored beyond the visit.
- Verification: 1,503 automated tests pass; 7 new bounded tests from the lower-cost model were reviewed and strengthened. Adult browser play covered 390px native drag/tap creation, swapping and assembly; 320px keyboard/reduced-motion removal, one-friend creation and completion; full original replay and four-piece maker layout completion. Wallet remained at one across replays, and changing the custom picture did not add learning credit. Desktop 1280×800, portrait 390×844 and 320×568, landscape 844×390 inspected. A conflicting landscape grid rule was caught and corrected. Guided entry, back/exit cleanup and console checks passed.
- Limits: seeded prerequisite and stubbed speech/SFX in the QA fixture; no child or physical-device test, no 320px native pointer claim. Four-piece layout fixture does not claim that the beginner earned that difficulty. Audio parked; local only.
- Evidence: `.qa/v339-browser-checks.json`, `.qa/v339-all-tests.txt`, `.qa/v339-maker-tests.txt`, `.qa/v339-made-picture-phone.png`, `.qa/v339-complete-picture-phone.png`, `.qa/v339-picture-desktop.png`, `.qa/v339-maker-landscape.png`. Recovery: `.qa/baselines/v339/RESTORE.md`.


## v340 — Wash, discover and continue at the child's pace (2026-10-26, local)
- Bath Time now offers a precise sponge and a broader rinse tool. Both work by moving over the bath or tapping their button, and the selected tool follows the pointer. The rinse has new native shower art; selection carries to the next friend.
- Recognition help is visible: after a mismatch or near-full uncovering, a bare-letter card appears beside the animal. Using that comparison records assisted evidence. Fully exhausted tools disable. Existing readiness and taught-letter selection still determine whether recognition questions are offered.
- Finished baths now wait for the child’s Next/Finish action. Beginner scrubbing participation is recorded before continuation so quick taps cannot lose it. Input and feedback callbacks from old rounds are retired, and completion cannot record or pay twice. Existing round counts and reward limits remain intact.
- Verification: 1,509 automated tests pass, including six bounded tests written by a lower-cost model and reviewed/strengthened. Adult browser play covered 390px native sponge/rinse gestures, a complete two-round beginner visit, and a three-round recognition fixture with wrong/correct, full-uncover assistance and early visual matching. Replaying retained one star. 320px keyboard/reduced motion, the three-choice answer row, desktop 1280×800 and landscape 844×390 were checked. Compact spacing was adjusted to retain visible progress markers. No browser warnings/errors; next-round reset and exit passed.
- Limits: seeded prerequisite and stubbed speech/SFX; recognition and three-choice fixtures do not claim actual learner readiness. No child or physical-device test, no 320px native-pointer claim. Audio parked; local only.
- Evidence: `.qa/v340-browser-checks.json`, `.qa/v340-all-tests.txt`, `.qa/v340-letter-help-phone.png`, `.qa/v340-three-choices-small.png`, `.qa/v340-bath-desktop.png`, `.qa/v340-bath-landscape.png`. Recovery: `.qa/baselines/v340/RESTORE.md`.


## v341 — Familiar games in a different daily order (2026-10-26, local)
- Daily letter selection already balances comfortable, due and lightly practised targets; the repeated physical activity order was the remaining friction. The first two recognition activities now rotate using existing review history and only mechanics from completed chapters. The first Boat visit remains Pond → Feed → Trace; the next becomes Feed → Pond → Trace. Later taught Catch/Pairs join the rotation.
- The selected letters, their exact per-step order, support, two rounds per activity, build-family handling and final motor activity remain unchanged. Planning does not mutate history; starting a visit still uses the existing beginReview path. No new storage or menu. Timed challenge, legacy planner, rewards and daily reopening behavior are preserved.
- Verification: 1,515 automated tests pass, including six new bounded tests from a lower-cost model, reviewed by the primary agent. Focused curriculum/daily/reward checks: 19 pass. Actual browser play completed the original daily route and a saved-history return with the new order. Wallet stayed at nine stars, sticker visits at one and daily stamp at one. A third visit rotated back and advanced history at entry. 390px mouse/tap, 320px keyboard/reduced motion and 1280px route layout checked; no warnings/errors.
- Limits: adult browser QA with seeded Boat prerequisite and stubbed speech/SFX; tracing used keyboard. No child or physical-device test. Later Catch/Pairs and Build branches tested automatically, not through full browser visits. Daily still opens as a fresh short visit; no resume rewrite. Audio parked; local only.
- Evidence: `.qa/v341-browser-checks.json`, `.qa/v341-all-tests.txt`, `.qa/v341-rotated-daily-phone.png`, `.qa/v341-rotated-progress-small.png`, `.qa/v341-next-visit-desktop.png`. Recovery: `.qa/baselines/v341/RESTORE.md`.


## v342 — Play in the garden you grew (2026-10-26, local)
- Earned adventure gardens previously became a small thumbnail above generic watering gates, with a short visitor bounce on the finish screen. Completion and earned revisits now make the original habitat the play space, retaining the child's garden sign.
- Invite the butterfly to the leaf or flowers; guide the bird to its branch, sunflower or stream. Tap a landing, tap the visitor to move, or drag and release nearby. The friend flies from its current position, responds at its destination and remains available for another choice. Every drop resolves to a nearby place. Reduced motion uses immediate placement; targets stay at least 52px and the pet stays clear.
- Watering remains available and returns to the same habitat. Existing water/drawing saves, other unfinished adventures, earning rules and learning evidence are preserved. This is unscored play with no new storage or audio. The return-visit button now shows the relevant visitor.
- Verification: 1,524 automated tests pass; nine bounded runtime cases from a lower-cost model were reviewed and strengthened. Final focused habitat/adventure run: 18 pass. Actual browser completion of four feeding rounds reached the butterfly habitat, followed by tap/drag play, watering, return and reload. Bird drag and rapid retarget, 320px keyboard/reduced motion, 390px pointer, 1280px desktop and 844px landscape checked. An unfinished butterfly route survived a bird-garden visit. Wallet remained one star; habitat play added no learning/reward changes. No warnings/errors; clean exit.
- Limits: adult browser QA with seeded earlier steps, prerequisites, projects and drawings; speech/SFX stubbed, no child or physical-device test. Native pointer cancellation was covered by runtime tests. Palette report still contains earlier repository debt; new art uses the locked colours. Local only; audio parked.
- Evidence: `.qa/v342-browser-checks.json`, `.qa/v342-all-tests.txt`, `.qa/v342-bird-stream-phone.png`, `.qa/v342-habitat-small-keyboard.png`, `.qa/v342-bird-desktop.png`, `.qa/v342-habitat-landscape.png`. Recovery: `.qa/baselines/v342/RESTORE.md`.

## v343 — Child-led colouring studio (2026-10-26, local)

Standalone Colour a Friend now lets children move between three pictured familiar friends, keep their drafts, undo ink and save without ending the visit. A saved page can be recoloured and updated in its own garden-art slot; the child chooses when to finish. Guided colouring keeps its existing automatic ending.

Pink, pet-colour default, taught-letter selection, once-per-letter motor participation, existing reward cap and drawing storage limits are preserved. Saved checks distinguish the saved picture from later edits. Small-screen and landscape layouts use the existing easel and crayons. Audio remains parked.

Verified: 1,532 automated checks; adult browser play covering two-page saves, undo, draft switching, same-page replacement, reload and actual garden signs, explicit and guided completion, keyboard/reduced motion and phone/desktop/landscape layouts. No browser warnings/errors. Visit drafts do not persist after leaving; saved pictures do. Evidence: `.qa/v343-browser-checks.json` and `.qa/v343-*.png`. Recovery: `.qa/baselines/v343/RESTORE.md`. Nothing published.

## v344 — Pump and release balloons (2026-10-26, local)

The standalone Letter Balloons toy now offers a pictured pump mode alongside popping. Three presses inflate a balloon; the next releases it. Children can pause one balloon and work on another, with no timer or failure. Native pump artwork shows compression, growth, pressure dots and a release arrow; a brief first-use hand cue demonstrates a press. Reduced motion uses static feedback.

Switching modes preserves the three familiar letters and cancels old replacements. Guided launches keep original popping. Existing speech hooks and taught-letter filtering remain; free play awards no learning credit, currency or progress. Audio work is still parked.

Verified: 1,539 automated checks, plus adult browser play at phone, small phone, desktop and landscape sizes; independent inflation, release, mode switching, keyboard focus, reduced motion, guided compatibility and clean exit. Browser learning/reward state unchanged and no warnings/errors. Landscape planters were reduced to keep pump silhouettes clear. Evidence: `.qa/v344-browser-checks.json` and `.qa/v344-*.png`. Recovery: `.qa/baselines/v344/RESTORE.md`. Local only.

## v345 — The child drives the Letter Train (2026-10-26, local)

The assembled Letter Train now waits at the platform. Children can replay its completed carriages or the whole sequence, then press the locomotive to depart. The locomotive remains usable during the refrain; departure and late callbacks cannot advance twice. Finished scenes reduce empty sky so the completed train is the focus.

The existing hand guide now demonstrates boarding and follows the next carriage. Tap and broad rail-drop alternatives remain. The idle hand points to the ready locomotive and never drives it. Alphabet runs, taught-letter safeguards, least-ready choice count, once-per-ride motor participation and practice rewards are preserved. Existing speech assets and pipeline are unchanged; audio work stays parked.

Verified: 1,551 automated checks; adult browser play from helped drag/tap boarding through two child-driven rides and one reward, plus carriage/sequence replay, departure during refrain, keyboard focus, reduced motion, out-of-order feedback, saved progress, phone/desktop/landscape layouts. Evidence: `.qa/v345-browser-checks.json` and `.qa/v345-*.png`. Recovery: `.qa/baselines/v345/RESTORE.md`. Local only.


## v346 — A chorus the child can keep (2026-10-26)
Echo Parade now holds each completed sequence for a replay or the child's Next/Finish. Consecutive identical orders rotate the same selected letters, with no extra choices or increase in sequence length. A miss reveals the matching line, retains the accepted prefix and highlights the next singer; subsequent outcomes become assisted matching-memory. Replay carries no new learning credit or payment. Round guards protect replaced controls and late speech; keyboard focus and idle guidance point to the available action.

Validation: all 1,563 tests pass; four-round browser play including deliberate miss, prefix replay, completed encore, keyboard progression, reduced motion, small phone/landscape/desktop layouts and reward/save reload. The isolated browser fixture used known Boat letters, two-choice profiles and speech stubs. Audio quality and child play were not tested. Local only. Evidence and recovery: `.qa/v346-browser-checks.json`, `.qa/baselines/v346/RESTORE.md`.


## v347 — The child's shadow theatre (2026-10-26)
After matching the familiar shadows, children can keep the scene and play with its stick puppets: move them by drag or arrow keys, tap for a hop/name replay, and switch the lantern between silhouettes and coloured friends. Next/Finish belongs to the child. Puppet play neither reports learning outcomes nor pays extra; the existing taught pool, readiness milestones, matching mechanics, error support and rewards are unchanged. The visual game no longer shows its previously nonfunctional replay control. The same theatre artwork remains, with its outer rectangular backing removed.

Validation: 1,572 tests pass, including eight new runtime puppet checks and idle guidance. Browser play covered all four scenes, tap/drag/keyboard, deliberate miss, puppet dragging and outside return, lantern states, reduced motion, 320/390px phone, landscape and desktop; reward1 and learning/wallet survived return/reload. Beginner still has one shadow and two choices. Adult isolated QA with seeded Boat letters, forced levels and stubbed speech; no child/physical-device or audio-quality claim. Local only. Evidence: `.qa/v347-browser-checks.json`; recovery: `.qa/baselines/v347/RESTORE.md`.


## v348 — Print the distinguishing dots (2026-10-26)
Dots Last now has a large wooden stamp: a press prints one dot onto the familiar letter body. There are no timed dot reveals. Early choices, including lucky guesses, reveal more information without earning credit or skipping the matching step. Response timing starts when the visible marks distinguish the target; existing matching/assistance evidence then applies. A first-use hand and optional help explain the action. The finished print stays for the child's Next/Finish, with keyboard focus carried between controls.

The taught dot-family pool, readiness choices, original dot positions, rewards and saves remain. All 1,583 tests pass. Browser verification covered one-, two-, and three-dot letters, early guesses, a visible mistake and correction, hand help, reduced motion, keyboard, phone/landscape/desktop, one reward and save/reload. Adult isolated QA with known Boat letters and speech stubs; no child/physical-device/audio-quality claim. Local only. Evidence: `.qa/v348-browser-checks.json`; recovery: `.qa/baselines/v348/RESTORE.md`.


## v349 — More taught friends in each adventure (2026-10-26)
The adventure planner keeps its familiar opener and first review priority, then rotates the third target through other taught letters. Previously, beginners using visible matching could keep receiving the same three letters. A bounded least-recent history updates only when the adventure is completed; opening menus, leaving and resuming do not consume the rotation. Existing unfinished adventures keep their targets, activity route and progress. New targets retain the existing readiness-based support; untaught letters are never introduced by this rotation.

All 1,593 automated checks pass, including coverage of all28 taught letters over repeated visits, save retry and chooser integration. Browser play verified final WaterGarden completion, one reward, the next cast changing from ا/ب/ت to ا/ب/ث, reload preserving it, and the actual new target retaining two visible choices in Letter Hunt. Phone and desktop checked. First two adventure steps were seeded; speech was stubbed. No child, physical-device or audio-quality claim. Local only. Evidence: `.qa/v349-browser-checks.json`; recovery: `.qa/baselines/v349/RESTORE.md`.


## v350 — Letter turntables (2026-10-26)
Same Letter now lets experienced players turn the tumbled cards in quarter turns before choosing. Turning preserves mirrored forms and earns no answer credit. Beginners still begin with two upright choices. A correct match stays as a friendly toy: turn it, replay its name, then press Next/Finish. Wrong choices report once; correction retains assistance. The existing taught pool, readiness milestones, fixed difficulty and rewards remain intact.

Native wooden turntables and a light play surface frame the existing letter art, with explicit keyboard focus,50px turn controls, reduced motion, and a centered desktop layout. Short-phone spacing keeps the letter, turn control, Next and progress visible.

Validation:1,603 tests pass, including9 new runtime cases and idle guidance. Actual browser checks covered turn/answer separation, mistake/correction, held completion and replay, full3-round mirror session, one reward and persisted learning/wallet, beginner play, keyboard, reduced motion and phone/landscape/desktop sizes. Final composed desktop value bands meet ART.md. Existing palette/stroke debt is unchanged. Adult isolated QA with taught-letter fixtures and speech stubs; no child, physical-device or audio-quality claim. Local only. Evidence:`.qa/v350-browser-checks.json`; recovery:`.qa/baselines/v350/RESTORE.md`.


## v351 — Pull, peek and discover (2026-10-26)
Peekaboo Flaps now accepts a horizontal pull as well as a tap. A partial peek offers visual help without submitting an answer; the later answer receives assisted credit. Unexpected discoveries stay available and their miss is recorded once. After the correct find, the page becomes a toy: open the other doors, hear their pictures, close them and play again. Next/Finish is the child's decision. Persistent letter tags connect the discovered pictures with their letters. Existing taught targets, readiness, picture assets and audio pipeline are preserved.

The hinge follows the pointer and supports reversal from its displayed angle. Fresh taps after a drag are responsive; cancelled/vertical gestures and extra pointers cannot become answers. Keyboard focus, idle guidance, reduced motion and stale-page guards remain consistent with the other updated games. The door area uses a richer garden green, with a pictured close control and pictures fitted to short phone layouts.

Validation:1,619 tests pass. Browser play covered partial/fullopening/closing, wrongfind/correction, exploration and repeatplay without extra credit, full3-page completion with1reward and persisted learning/wallet, two/three choices, keyboard, reduced motion and phone/landscape/desktop. A fast confirmed prompt retained independent listening; peeks and idle help correctly became assisted. Adult isolated QA with seeded taught letters and stubbed speech; pointer cancellation/multitouch/retargeting use runtime tests, with no child/physical-device/audio-quality claim. Final composed artwork meets ART.md value bands; palette/stroke debt unchanged. Local only. Evidence:`.qa/v351-browser-checks.json`; recovery:`.qa/baselines/v351/RESTORE.md`.


## v352 — Choose and carry (2026-10-26, local)
SoundSort now offers two pictures to choose between. Carry either picture to a basket, or tap the picture and then the basket. Replacements keep the unused picture in its place. Per-picture support survives switching; accidental repeated wrong placements are recorded once. Existing taught pool and readiness remain.

The filled baskets stay for replay until the child chooses Finish. Delivery and old-input guards preserve one outcome/reward, with keyboard focus, idle guidance and reduced motion. A centered tray and warmer basket shelf carry the existing book art forward. Audio work stays parked.

Validation: 1,625 tests pass. Adult browser sessions at desktop, phone, small phone and landscape cover drag/tap, outside release, wrong/retry/switch, four-picture refill, keyboard completion, reduced motion and persisted reward. No child/physical-device/audio-quality claim. Palette/stroke debt unchanged. Evidence and restore instructions are recorded in work-state.json. Not committed or published.


## v353 — The friends choose when to walk (2026-10-26, local)
In HoopoeTrip, children can carry the matching friend into a footprint place beside the hoopoe, or tap the friend. Gathered friends are available for individual replay and an optional growing refrain; the child chooses when the procession walks to its next stop. Missing or interrupted speech cannot strand the walk control. Reaching home holds the scene until Finish.

The existing taught choices, supported-matching evidence and rewards remain. Per-choice wrong-answer deduplication, first-use hand coaching, released-position flight, stale-input guards, keyboard focus and reduced motion support the new interaction. The existing landscape and house now frame a warm procession tray, including five friends on small phones.

Validation:1,633 tests pass. Full adult browser play covers wrong/correct/outside drops, replay without extra evidence, held completion, savedreward,3/4-stop sets,keyboard and reducedmotion at390x844,320x568,844x390 and1280x800. No child/physicaldevice/audioquality claim. Artvalue bands pass;palette/stroke debt unchanged. Restore instructions and evidence are in work-state.json. Local only;audio generation parked.


## v354 — Take-apart letter friends (2026-10-26, local)
FriendShapes keeps the assembled character available after matching. Children can pull its letter out or use the lift button, then carry/tap the cutout back into place. Tap the whole friend to hear it and see a small response; choose Next/Finish when ready. Exploration never repeats the learning outcome or earns extra rewards.

The taught silhouette task and readiness remain. Released-position fitting, deduplicated misses, hand coaching, keyboard focus, reduced motion, stale-input guards and child-owned completion support the new interaction. A warm craftboard and tray sit inside the existing book, with small-phone choices and centered landscape controls.

Validation:1,643 tests pass. Adult browser play verified a full beginner session, repeat rebuilding, tap/drag/keyboard controls, completion and savedreward,3-choice smallphone,reducedmotion anddesktop/landscape art. No child/physicaldevice/audioquality claim. Artvalue bands pass;existingpalette/stroke debt unchanged. Evidence and restoreinstructions in work-state.json. Local only;audio generation parked.


## v355 — Play shopkeeper (2026-10-26, local)
BusyMarket keeps collected pictures large and usable in a paged bag. After the taught-letter hunt, children can unpack them onto any empty shelf, arrange their shop, and pack them again. Taps remain an alternative to dragging; hand help shows both directions. Finish stays available until the child chooses it.

Warm shelf places, packing flights and receiving highlights use the existing art. Per-picture animation cleanup, stale-input guards, keyboard focus, reduced motion and three-picture bag pages keep the interaction manageable. Existing curriculum eligibility, difficulty caps, free-play learning rules and daily reward protection remain.

Validation: 1,655 checks pass. Adult browser sessions covered the beginner hunt and ten-picture market, wrong-choice hints, replay, drag/tap/keyboard placement, rejected drops, all bag pages, reverse help, completion and saved reward at desktop, phone, small-phone and landscape sizes. No child/physical-touch/audio-quality claim. Art value bands pass; palette/stroke debt unchanged. Recovery and evidence are in work-state.json. Local only; audio work parked.


## v356 — Letters settle into words (2026-10-26, local)
WordGap uses larger letter blocks and a generous gap on the existing book. Arabic letters and vowel marks are measured and centered. A correct tap or drop carries the block into its place before the complete joined word appears; tapping that word replays it. First-use and manual hand guidance explains the action and records support honestly.

The one-gap task, eligible word pool, choice policy, learning evidence and child-owned Next/Finish remain. Repeated input during fitting and old controls cannot add outcomes; reduced motion settles immediately. The warm tray, landscape layout and compact portrait spacing keep three choices and long words visible. Completed words stay inside the book page.

Validation:1,660 checks pass. Adult browser play covered a full session with wrong/correct/outside input, drag/tap/keyboard controls, replay, guidance, reduced motion, reward and learning persistence, and long-word layouts across desktop and phone sizes. No child/physical-touch/audio-quality claim. Art value bands pass and palette/stroke debt is unchanged. Recovery and evidence are in work-state.json. Local only; audio work parked.


## v357 — Lift the water gates (2026-10-26, local)
WaterGarden's letter handles now follow a child's finger upward to open and downward to close. Partial or cancelled pulls return safely, and regrabbing a settling handle feels continuous. Taps and keyboard remain available. Wordless hand guidance demonstrates the movement and records assistance honestly.

The existing guided choices, water-arrival feedback, bend challenge, flowers, free exploration and reward rules remain. Earned gardens retain their channel arrangement after reload. A light wooden rim keeps the existing scene readable at night, with clearance for all controls.

Validation: 1,669 tests pass. Adult browser play covered beginner and later three-choice rounds, wrong/partial/correct pulls, tap/keyboard alternatives, reduced motion, opening/closing, bends, reward and earned-garden persistence across desktop and phone layouts. No child, physical-touch or audio-quality claim. Final composed frames pass the art value bands; palette/stroke debt unchanged. Evidence and recovery are in work-state.json. Local only; audio work parked.


## v359 — Whole-art inventory and proportion pass (2026-10-28, local)

Full source inventory and 523 rendered samples across 44 families preceded the
coordinated revision. The cottage now reads as a home; chest, bench and stall have
believable relative scale across phone/tablet/wide layouts. Fixed the missing
village pet and stale layout after rotation. Unified older cast/prop materials,
accessory palette, glasses attachment, sticker contours, packet construction,
boat paper, waterside edges and matching-board felt. Night village grass stays
green; existing scenery and learning/reward rules remain.

See `docs/art/LETTER_GARDEN_ART_SYSTEM_REVIEW_20261028.md` for retained families,
full inventory, before/after evidence and limitations. 1,678 tests pass; 523
recipes render; palette scanner has zero off-palette hex colours. Actual composed
phone/tablet/desktop screens reviewed; no claim of child testing or every game
playthrough. Audio/publishing parked. Unfinished v358 drum work remains preserved.


## v360 — Purposeful detail and calmer motion (2026-10-28, local)

Reviewed all 44 existing art families for useful detail and attention hierarchy.
Simplified distant trees while retaining constructed scenery and approved scale.
Learning screens rest secondary creatures/weather/particles and idle pet fidgets;
the companion still follows touch and responds. Slower, interruptible hand demos
hold their destination. Village accents have resting periods, celebrations settle,
particle bursts cannot stack, and system/in-game reduced motion align.

1,682 tests pass; 523 art recipes render; zero off-palette colours. Desktop/phone
intro, matching-to-reward, feeding, night village and reduced-motion play checked.
Child/physical-device testing remains outstanding. Audio and publishing parked;
unfinished v358 preserved. See docs/art/LETTER_GARDEN_DETAIL_MOTION_V360.md.


## v361 — Gentle interaction, without impact effects (2026-10-28, local)

Removed shared hit-stop/flash/impact rays, stage and neighbour recoil, and
comeback/streak visual escalation. Touch returns smoothly; nine game families
acknowledge retries without shaking. Restrained card/letter/star reveals,
stationary matched letters, smoother piece placement and a smaller unrotated
pond transfer. Useful gestures, callbacks, learning, assistance and rewards stay.

1,685 tests pass. Adult desktop/phone checks cover wrong/correct matching,
peekaboo, drag/tap feeding, reduced motion, introduction and rewards. Audio and
publishing parked. See docs/art/LETTER_GARDEN_GENTLE_INTERACTION_V361.md.


## v358 — Child-made drum rhythms: integration completed (2026-10-29, local)

Completed the previously suspended drum pass against the current gentle-motion implementation. After matching a picture’s beats, children can keep making short rhythms and replay their own taps. Tap locations and timing drive the response; new taps, prompt replay and Next interrupt playback safely. Learning credit remains participation, and rewards stay once per visit/day policy.

The remaining established three-beat session, desktop/phone/landscape layout, keyboard, reduced motion, completion and saved-progress checks pass. All 1,685 game tests pass; no extra runtime edits were needed to close the pass. Audio quality review and publishing remain held. Evidence: `docs/letter-garden/reviews/drum-rhythm-complete/`.


## v363 — Home gestures stay with their screen (2026-10-29, local)

A held Home button could finish its timer after the child had already advanced, pulling them out of the next screen. Home now cancels on screen replacement, focus loss, tab hiding and the owning finger's release. Other fingers cannot take over the hold; old callbacks and repeated activation cannot navigate twice. The 800 ms child-safe hold, ordinary tap navigation and keyboard access remain.

Five regressions reproduced before the fix; all 1,690 game tests now pass. Desktop/phone browser checks cover short tap, a screen replacement during a hold, intentional hold and Enter. No audio, art, curriculum, rewards or production changes. Evidence: `docs/letter-garden/reviews/home-navigation-v363/`.


## v364 — A child chooses which picture to replace (local, 2026-10-29)

A full three-picture shelf now previews an explicit replacement in Letter Studio and Colour a Friend. Back keeps the current drawing editable; save failure and screen changes preserve prior work. Tracing no longer evicts art or overwrites displayed signs, and all retained pictures remain available in the garden. Storage is bounded to three art pictures plus eight tracing keepsakes, each at most 60,000 data-URL characters.

1,695 game tests pass. Desktop, phone/landscape, cancellation, failure/retry, reload, pending-screen exit and reduced motion checked. See `reviews/saved-art-choice-v364/README.md`. Local only; audio generation remains parked.


## v365 — Take your own picture into the garden (local, 2026-10-29)

Standalone drawing and colouring finishes now display the child's saved artwork beside their pet. Tapping it opens the decorating garden with that exact picture selected; placement remains the child's choice. Continue and Replay stay available, with no extra reward or automatic placement. Adventure routing remains unchanged.

1,706 tests pass. The complete creation-to-garden route, placement/Undo, optional Continue, phone/landscape/desktop layouts and reduced motion were checked. Review: `reviews/picture-invitation-v365/README.md`.
