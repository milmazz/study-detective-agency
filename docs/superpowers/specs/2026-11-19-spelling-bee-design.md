# Honey's Spelling Hive: design

A bonus study page that helps my kid practice for her class spelling bee
on Friday, November 20, 2026. She practices on her own, and the browser
reads each word aloud.

## Why

The teacher sent the Scripps 2026-27 Classroom Competition List (98
pages) and said the class bee "will begin with fourth grade words and go
from there"; the alternates and winners go on to the school bee. She
wants to compete. The packet is written for a pronouncer, not for a
speller to study from, and she has roughly one evening.

She engages far more when things are fun, so fun is a requirement on par
with correctness, not polish.

## Goals

- Practice exactly what Friday asks of her: hear a word, ask for help
  the way a real speller can, and produce the spelling with no list in
  front of her.
- Cover the words the bee will actually reach, in the bee's order: 4th
  grade (words 76-100) first, then 5th (101-125), then 6th (126-150) as
  a stretch.
- Missed words come back until she gets them right.
- Make it a game: a mascot, a hive she fills, streaks, celebrations, and
  a personal best to beat.

## Non-goals

- Words 1-75 (below where the bee starts), 151-225 (7th and 8th grade)
  and the 75 unstudied tiebreaker words (226-300). If she clears 6th
  grade, 7th grade is a follow-up.
- The packet's optional vocabulary round.
- A lesson video.
- Speech recognition for spelling out loud. Browser letter-by-letter
  recognition is too unreliable to grade a kid fairly.

## Anti-goals

- Showing the spelling before she tries. The definition and sentence
  appear as text as well as being spoken, so the word itself must never
  show up in them.
- Feedback that punishes. A miss gets a kind word, a clear look at what
  went wrong, and the word comes back. Nothing gets taken away.
- Copying the packet. Its definitions and example sentences belong to
  Scripps / Merriam-Webster. The page uses only the words themselves,
  plus facts about them (part of speech, language of origin,
  sound-alikes, alternate spellings). Every definition, sentence and tip
  is written fresh for a 9-year-old.

## Constraints

- It has to be usable tonight. Scope is cut to fit that.
- It follows the site's bonus-page conventions: its own theme with light
  and dark mode, `bonus.css` and the self-hosted Baloo 2, one inline
  `type="module"` script, content in an `assets/js/` module that has no
  side effects on import, a `GAMES_DATA` entry in `index.html`, and tests
  under `test/`.
- Merging to `main` deploys it to the public site.
- Browser voices differ by device. Safari on Mac and iPad sounds good,
  and Chrome is fine. iOS only lets a page speak after a tap, so practice
  starts from a button.

## Approaches

1. **A new bonus page with its own small spelling engine.** (Chosen.)
   Hear the word, ask for information, type it, missed words come back.
   It doesn't touch the three pages that share `bonus-quiz.js`.
2. **A "spell" question type in `bonus-quiz.js`.** It would reuse stars
   and saved progress, but that engine walks a fixed list in a fixed
   order, with no queue for missed words and no grade choice. It would
   also change shared code the night before the bee.
3. **A Words Division case file on `DetectiveGame`.** Multiple choice
   ("which spelling is right?"). Picking a spelling out of a list
   doesn't train producing one, which is what the bee asks for.

The user picked 1. Sharing code with the other bonus pages doesn't matter;
what matters is that she practices.

## The design

**Page:** `games/ela/spelling-hive.html`, Words Division. Mascot: Honey
the bee, drawn as inline SVG with moods (idle, happy, oops, cheer), like
Dottie's bunny. Theme: honey gold and warm amber on a faint hexagon
pattern, plus a dark mode. The top bar shows a 🍯 counter (words
mastered).

Three tabs:

```
┌──────────────────────────────────────────────────────┐
│ ← All Divisions   [Study] [Practice] [Bee Day]  🍯 12 │
├──────────────────────────────────────────────────────┤
│        🐝  "Hi, I'm Honey! Pick a hive to fill."     │
│   ( 4th grade 76–100 ) ( 5th 101–125 ) ( 6th ★ )     │
│                                                      │
│    ⬡⬢⬢⬡⬡   ← one honeycomb cell per word,            │
│   ⬡⬡⬢⬡⬡⬡     gold when she's mastered it            │
└──────────────────────────────────────────────────────┘
```

**Study.** Choose a grade. The words appear as a honeycomb. Tapping a
cell opens a card with:
- the word in big letters, with a 🔊 button to hear it
- its part of speech
- a kid-friendly definition and sentence
- where it comes from
- a "sounds like…" warning for sound-alikes
- a tricky-part tip with the hard letters highlighted (thim**ble**,
  lul**l**aby)

A short "How the bee works" panel covers:
- Say the word, spell it, then say it again.
- You can ask the pronouncer to repeat the word, or for its definition,
  a sentence, its part of speech or where it comes from.
- Say each letter out loud as you type it.

**Practice** (the core loop). Each round is 10 words from the chosen
grade, unmastered words first.

```
┌──────────────────────────────────────────────────────┐
│ 🐝 Honey: "Your word is…"   (spoken)   Word 3 of 10  │
│  [🔁 Say it again] [📖 Definition] [💬 Sentence]      │
│  [🏷️ Part of speech] [🌍 Where's it from?]            │
│  💬 "Rita's house has a cellar ______ the kitchen."   │
│  ┌───────────────────────────────┐                   │
│  │ b e n e a t h                 │  [Check it! 🍯]   │
│  └───────────────────────────────┘   🔥 3 in a row   │
└──────────────────────────────────────────────────────┘
```

- Each "ask" button speaks the answer and shows it in Honey's speech
  bubble. The word is blanked out of the text. For a sound-alike word,
  Honey gives the definition on her own, the way the real pronouncer
  will.
- **Right:** Honey cheers, plays a chime, and 🐝/🍯 confetti flies. A
  honeycomb cell fills, and the streak grows. Encouragement varies so it
  doesn't get stale.
- **Missed:** Honey says something kind. Her spelling shows letter by
  letter next to the right one, with the differences highlighted, plus
  the tricky-part tip. She types it correctly once to "lock it in," and
  the word comes back a few words later in the same round.
- A word is mastered when she spells it right without a miss in that
  round.
- End of round: Honey celebrates and shows how many cells she filled and
  the words to review. Then "Play again."

**Bee Day** (the dress rehearsal). Words come in the bee's own order,
starting at 76, one try each, with the same ask buttons. A miss shows
the right spelling. She keeps going, but her streak resets. The page
records her best run ("you made it through 14 words in a row!") as a
personal best to beat.

**Answer checking:**
- Trimmed and not case-sensitive. Halloween, Japanese and Oregon are
  accepted lowercase, with a note that they start with a capital.
- Any alternate spelling the packet lists counts: fertilizer or
  fertiliser, materialize or materialise.

**Voice:**
- `speechSynthesis` with an English voice, preferring en-US.
- Words are spoken a little slowly. A `say` field can override how a
  word is pronounced when a browser voice gets it wrong.
- If the browser can't speak, a notice says so and a "peek" button shows
  the word for two seconds.

**Sounds:** short Web Audio chimes, with a mute toggle. Animations
respect `prefers-reduced-motion`.

**Progress:** saved in `localStorage` (wrapped in try/catch): mastered
words per grade, honey count, and the Bee Day best.

**Content module:** `assets/js/spelling-hive-words.js`, one entry per
word: number, word, grade, part of speech, definition, sentence, origin,
sound-alikes, alternate spellings, tip, and an optional `say`.

**Tests:**
- The words run 76-150 with no gaps, and each grade covers its range.
- Every entry has all its fields.
- No definition contains its word. Every sentence contains its word
  exactly once, so it can be blanked.
- The checker accepts the alternate spellings and ignores case.
- Importing the modules has no side effects.
- The page wiring and catalog entry are correct.
- The whole existing suite still passes.

## Left to the builder

- The exact SVG for Honey, the palette, the encouragement lines and the
  chime tones.
- How a round picks and re-queues words, within the rules above.
- Which words need a `say` override.
