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
