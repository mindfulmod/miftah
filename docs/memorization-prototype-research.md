# Miftah short-surah memorization research

Date: 2026-08-10

## Scope

This research supports a self-checked memorization module for adults who can
read Arabic script but do not necessarily understand Arabic. The curriculum is
all of Juz ʿAmma, Surahs 78–114, using the Hafs reading and Uthmani text. The
interaction was first prototyped with Surah Al-Fil (105) and Surah At-Tin (95).

The product question is deliberately narrow: what is the lowest-friction loop
that helps a learner accurately recite a short surah without looking, and still
recall it later?

## Executive finding

The strongest overlap between cognitive science, established hifz practice, and
successful memorization products is this sequence:

1. Hear one trusted recitation while following the exact text.
2. Repeat a small unit aloud.
3. Remove the text and retrieve it from memory.
4. Reveal the answer immediately and self-check without penalty.
5. Join the new ayah to the ayahs already learned.
6. Return to it over expanding intervals, mixing new, recent, and older material.

Repetition is useful for initial encoding, but repetition alone can produce
familiarity without reliable recall. The prototype therefore moves quickly from
supported exposure to cue-free recitation and schedules future retrieval.

## Learning science

### High-confidence techniques

| Finding | Evidence | Product implication |
| --- | --- | --- |
| Retrieval practice improves delayed retention more than additional study. | Roediger and Karpicke's testing-effect experiment and the broader review by Dunlosky et al. rate practice testing among the most useful learning techniques. | The learner must attempt the ayah before seeing it again. A visible-text replay does not count as mastery. |
| Distributed practice outperforms massed practice for long-term retention. | Cepeda et al. reviewed hundreds of spacing experiments. A later meta-analysis found a benefit from spacing retrieval episodes. | Review an ayah tomorrow and at expanding later intervals instead of asking for a long single sitting. |
| Successive relearning is especially durable. | Rawson and Dunlosky combine successful retrieval to criterion with spaced relearning sessions. | A self-rated successful recitation schedules the next review. A miss returns the ayah to supported practice. |
| Recall practice is generally a stronger match for a recall goal than recognition practice. | Research comparing free recall and recognition finds stronger testing benefits from free recall in many conditions. | Avoid multiple-choice and word-order puzzles as the main proof of memorization. The target behavior is reciting the whole passage. |
| Correct-answer feedback matters when retrieval is incomplete or wrong. | Retrieval-practice research finds feedback helps correct errors and supports re-encoding. | Reveal the exact text immediately after the attempt. Use neutral choices such as "Again" and "I had it." |
| Sleep supports memory consolidation. | Reviews of sleep-dependent learning find that sleep contributes to stabilizing memory after learning. | Keep sessions short and invite a return on a later day. Do not imply that one long session produces permanent mastery. |

Primary learning-science sources:

- [Dunlosky et al., Improving Students' Learning With Effective Learning Techniques](https://journals.sagepub.com/stoken/rbtfl/Z10jaVH/60XQM/full)
- [Roediger and Karpicke, Test-enhanced learning](https://pubmed.ncbi.nlm.nih.gov/16507066/)
- [Cepeda et al., Distributed practice meta-analysis](https://augmentingcognition.com/assets/Cepeda2006.pdf)
- [Latimier et al., Meta-analysis of spaced retrieval practice](https://eric.ed.gov/?id=EJ1310148)
- [Rawson and Dunlosky, Successive relearning](https://journals.sagepub.com/doi/pdf/10.1177/09637214221100484)
- [Free recall versus recognition practice](https://www.sciencedirect.com/science/article/pii/S0749596X19300026)
- [Sleep-dependent learning and memory consolidation](https://pubmed.ncbi.nlm.nih.gov/15450165/)

### Design cautions

- Familiarity is not recall. Seeing a line repeatedly can feel fluent while the
  learner still cannot produce it without the page.
- Excessive scaffolding can become a crutch. Word hiding should fade toward a
  fully blank recall state.
- More controls do not mean more learning. Repetition counts, reciter settings,
  quiz types, goals, and analytics should not crowd the practice surface.
- English meaning can provide a semantic route into an otherwise unfamiliar
  sound sequence, but it can also split attention. In this prototype it appears
  only for Al-Fil, only while learning or checking, and disappears during recall.
  This makes it an intentional comparison rather than permanent chrome.
- The most relevant supporting cognition advice is ordinary: adequate sleep,
  manageable sessions, focused attention, and repeated retrieval. The prototype
  should not make broad "brain training" claims.

## Quran memorization practices used around the world

Different traditions vary in schedule, order, and physical materials, but their
core mechanics are remarkably consistent.

### Talaqqi and mushafahah

The learner receives the recitation directly from a teacher, observes its oral
production, repeats it, and is corrected. Malaysian tahfiz research treats
talaqqi, mushafahah, tasmi', and repetition as central practices.

Prototype translation: use one consistent expert reciter as the oral model. The
prototype cannot replace a teacher or certify tajwid, so it makes no such claim.

- [Implementation of talaqqi and mushafahah in Malaysian tahfiz teaching](https://ejournal.ukm.my/islamiyyat/article/view/33552)
- [Study of effective techniques at a Malaysian tahfiz school](https://eprints.um.edu.my/9406/1/Dr._Sedek-_Effective_Techniques_of_Memorizing_the_Quran_A_Study_at_Madrasah_tahfiz_Al-quran%2C_Terengganu%2C_Malaysia.pdf)

### Takrar or tikrar, and tasmi'

Takrar is deliberate repetition, normally aloud. Tasmi' is reciting memorized
material for checking. These form a loop of model, rehearsal, production, and
correction rather than passive listening alone.

Prototype translation: provide replay, but progress only after a hidden-text
recitation and an honest self-check.

### Sabaq, sabqi, and manzil

This South Asian and madrasa-derived organization separates new memorization,
recent memorization, and older memorization. The exact quantities vary, but the
important idea is that acquiring new text never replaces maintenance.

Prototype translation: maintain one quiet queue with due review first, then the
next new ayah. The learner never has to configure three lists.

- [Study of the sabaq, sabqi, and manzil method](https://ojs.staialfurqan.ac.id/alqiyam/article/view/788)

### Lawh or luh traditions in North and West Africa

Learners write passages on a wooden tablet, read and chant them, recite to a
teacher, and reuse the tablet after mastery. Research describes this as a visual,
auditory, written, and embodied practice. It also gives the text a stable spatial
location.

Prototype translation: preserve the same Uthmani font, word order, wrapping, and
ayah layout through supported and hidden stages. Progressive word removal keeps
the spatial scaffold while removing the answer. Repeated handwriting is not part
of this first mobile prototype because Arabic keyboard or stylus entry would add
friction for this audience.

- [Sensory mnemonic learning in southwestern Morocco](https://www.journals.uchicago.edu/doi/pdfplus/10.1086/731525)
- [The Walking Qur'an: Islamic Education and Embodied Knowledge in West Africa](https://academic.oup.com/north-carolina-scholarship-online/book/22278)
- [North African wooden-board memorization method](https://dergipark.org.tr/tr/pub/tasavvur/article/1531532)

### Ottoman page rotation

The Turkish/Ottoman system commonly builds through corresponding end-pages of
each juz before moving backward through the page positions. It is a sophisticated
whole-Quran organization method, not a better interaction for learning two short
surahs.

Prototype decision: do not copy it into this MVP. Its useful lesson is that the
order of acquisition and the order of review can differ, which the due queue can
support later.

- [Academic description of the traditional Ottoman-derived method](https://openaccess.ihu.edu.tr/bitstreams/aa698c1b-5c5b-4a0a-bcaa-6ecd5b7aacdd/download)

## Competitor and adjacent-product review

| Product or method | Useful pattern | Limitation or lesson for Miftah |
| --- | --- | --- |
| Tarteel | Hide all ayahs, peek, recite from memory, track mistakes, separate memorization and review plans. | Its strongest correction features depend on speech recognition and premium access. Users praise it for solo revision but also report that detection is not perfect. Miftah should keep self-checking honest and free of false authority. |
| Quran.com and audio-focused readers | Trusted text, consistent Mushaf presentation, verse audio, range repeat, word audio. | They provide excellent materials but mostly leave the memorization procedure to the learner. Miftah should guide the next action. |
| Quran Companion and planning-oriented hifz apps | Plans, review queues, repeat controls, progress, groups, and challenges. | Planning systems can become setup work. Miftah should open directly to the learner's next ayah. |
| QuranTrainer.com | Progressive cumulative audio chaining: 1, then 1-2, then 1-2-3. | This is effective but can remain passive if the learner never turns the text and audio off. Miftah adds hidden recall and self-checking. |
| Quranly | Habit framing, daily progress, and reminders. | Reddit feedback includes paywall frustration. Streaks and subscription mechanics are not the learning engine and are intentionally absent here. |
| Bible Memory and Remember Me | Progressive word removal, first-letter cues, typing, and spaced review for verbatim scripture. | Progressive deletion transfers well. Typing Latin first letters does not transfer cleanly to a reader of Arabic script and could encourage transliteration dependence. |

Official product sources:

- [Tarteel hide-ayah workflow](https://support.tarteel.ai/en/articles/12414416-hide-ayahs)
- [Tarteel memorization and review goals](https://support.tarteel.ai/en/articles/12782033-how-do-i-use-the-goals-feature)
- [Tarteel free and premium feature split](https://support.tarteel.ai/en/articles/12267535-can-i-use-tarteel-for-free)
- [QuranTrainer progressive chain repetition](https://www.qurantrainer.com/)
- [Quran.com connected apps and memorization tools](https://quran.com/apps)
- [The Bible Memory App's progressive removal and spaced review](https://biblememory.com/pages/iphone-app)
- [Remember Me's first-letter, typing, audio, and spaced-review modes](https://play.google.com/store/apps/details?id=org.bible.remember_me)

### User sentiment

Social posts are anecdotal and not a representative survey, but repeated themes
are useful directional signals:

- Hidden text and verse-range repetition are repeatedly requested and praised.
- Learners describe revision, not initial acquisition, as the point where their
  memorization breaks down.
- A familiar physical or Madani-page layout is important to some memorizers.
- Tarteel is frequently praised as a solo revision partner, while users warn
  that automatic detection misses some errors and does not replace a teacher.
- People ask for a simple, structured next step rather than another general
  Quran utility.
- Paywalls around core memorization feedback create resentment.

Examples:

- [Reddit discussion of Tarteel for revision](https://www.reddit.com/r/Hifdh/comments/1ushfnr/thoughts_on_tarteel_ai/)
- [Requests for verse repetition and mobile reliability](https://www.reddit.com/r/Hifdh/comments/1om7cw5/just_launched_a_quran_recitation_memorization/)
- [Feedback emphasizing page layout and multi-verse loops](https://www.reddit.com/r/Hifdh/comments/1q0iezn/update_free_recitation_memorization_quran_webapp/)
- [Feedback separating new memorization from review](https://www.reddit.com/r/Quran/comments/1u6qxxp/wirdee_a_free_spacedrepetition_app_for_memorizing/)
- [Quranly paywall discussion](https://www.reddit.com/r/Muslim/comments/1uednfc/any_free_quran_app_similar_to_quranly/)

## What memorization books contribute

Printed guides tend to contribute two things that apps often separate:

1. A catalog of practical methods, including listening, repetition, writing,
   keeping one Mushaf, linking ayahs, and structured revision.
2. Identity, intention, examples, and accountability that help the learner stay
   with a long project.

Yahya Al-Ghawthani's guide explicitly presents more than twenty practical
memorization methods and treats revision as part of the method rather than an
afterthought. Saadia Mian's *The Crowning Venture* combines practical techniques
with stories that make the goal feel possible for adults with ordinary lives.
The adjacent planner turns a distant ambition into measured steps.

Product implication: the prototype should not expose twenty methods. It should
use one strong default loop, preserve a calm sense of intention, and give the
learner a visible next step. The book-like motivational layer can be added later
without entering the recall surface.

- [How Do You Memorise the Glorious Quran?](https://madinahmedia.com/product/how-do-you-memorise-the-glorious-quran/)
- [Publisher description of Al-Ghawthani's methodical approach](https://daralzaman.sa/en/product/how-to-memorize-the-quran-basic-rules-and/)
- [The Crowning Venture, Daybreak Press](https://bookshop.rabata.org/products/the-crowning-venture)

## Prototype concept: Guided Hifz

The practice surface has one main action at a time.

### New ayah loop

1. **Follow**: exact Arabic stays visible while a single reciter models the ayah.
   Verified word timestamps move the highlight with the recitation, giving the
   learner an external visual pace instead of asking them merely to stare at the
   line.
2. **Echo**: the learner reads the same line aloud after the recording.
3. **Chase**: the reciter plays again, but each word disappears after it is
   spoken. A blank word can be tapped for a brief peek. The app records the peek
   as a weak spot while preserving the line's spatial layout.
4. **Recall**: all words disappear except a minimal first-word cue. The learner
   recites, reveals the text, and chooses "I hesitated" or "Clean recall."
5. **Recover when needed**: a hesitation opens two purposeful options. The
   learner can tap the first weak word and rehearse a three-word bridge around
   it, or reconstruct the ayah from its exact Quran words. Either path ends by
   returning to a complete unaided recitation; neither counts as mastery alone.
6. **Link**: the learner recites from ayah 1 through the new ayah, then checks.
   A weak transition can be repaired with the final word of one ayah and the
   opening words of the next.
7. **Return**: the ayah enters a local review schedule.

For surahs of ten ayahs or fewer, linking remains fully cumulative. In longer
Juz ʿAmma surahs, the daily link is a rolling five-ayah bridge so one new ayah
does not trigger an impractically long test. Finishing the chapter still
requires one full-surah recall before it is marked linked.

### What the app contributes beyond a paper copy

- It synchronizes attention to the reciter at word level and progressively
  removes support at the moment each word passes.
- It remembers where the learner peeked or hesitated rather than treating every
  word as equally weak.
- It turns a vague failed attempt into a short, exact repair loop, then verifies
  that the repair transfers back to full recall.
- It schedules future retrieval on the device and adapts the next interval when
  unresolved weak spots remain.

These are intentionally modest interventions. The app does not claim to judge
pronunciation, certify tajwid, or replace recitation to a qualified teacher.

### Review loop

- Due material appears before new material.
- Review begins with hidden text, not listening.
- "I hesitated" opens targeted repair and shortens the next interval.
- "Clean recall" advances through approximately 1, 3, 7, 14, 30, and 60-day
  intervals. These are transparent MVP defaults, not a claim of a universally
  optimal schedule.
- Full-surah practice remains available at any time.

### Deliberate omissions

- No microphone or automatic correctness claim.
- No transliteration.
- No typing Arabic.
- No multiple-choice proof of mastery.
- No streak, leaderboard, points, confetti, or guilt copy.
- No repetition-count setup before practice.
- No reciter picker in the first prototype.

## Quran text accuracy protocol

The module does not retype Quran text. It reads the existing generated files:

- `data/surah-78.json` through `data/surah-114.json`
- `data/surah-1.json` for the basmala

For all 37 target surahs, every local word token is checked byte-for-byte
against the Quran.com verse-by-chapter word API, including its diacritics. The
joined ayah is also checked against the official Tanzil Uthmani text with
combining marks folded only for this independent cross-source comparison.
Counts, order, and every base letter must match Tanzil, while the Quran.com gate
remains exact. The local Uthmani Hafs font is used for display. The automated
check also retrieves Quran Foundation chapter-recitation timestamps, discards
malformed segment artifacts, and requires one valid timing triplet for every
verified local Quran word before synchronized flow is enabled.

Reference sources:

- [Quran.com Surah Al-Fil](https://quran.com/al-fil)
- [Quran.com Surah At-Tin](https://quran.com/tin)
- [Quran Foundation chapter-recitation timestamps](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/chapter-reciter-audio-file/)
- [Tanzil's verified Uthmani text project](https://tanzil.net/docs/tanzil_project)
- [Tanzil text license and update requirement](https://tanzil.net/docs/Text_License)
- [Quranic Arabic Corpus word analysis for Al-Fil](https://corpus.quran.com/treebank.jsp?chapter=105&verse=1)

## MVP success criteria

- A first-time user reaches audible practice in one tap.
- At every moment there is one clear next action.
- The Arabic line never reflows when words are hidden.
- The user can finish an ayah without understanding any UI terminology from
  traditional hifz systems.
- Al-Fil retains the prototype's restrained English meaning cue; other surahs
  keep meaning hidden while this interaction is evaluated.
- Progress and review dates survive reloads on the same device.
- Keyboard, touch, reduced-motion, light, and dark modes work.
- All 564 Juz ʿAmma ayahs, 2,308 exact target words, the basmala, and every
  target word timing pass the automated multi-source accuracy check.
