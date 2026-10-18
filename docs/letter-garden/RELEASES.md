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
