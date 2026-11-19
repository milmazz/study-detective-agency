# Honey's Spelling Hive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Words Division bonus page where the kid hears a spelling bee
word, asks for help the way a real speller can, types the spelling, and
fills a honeycomb as she masters the 4th-6th grade words (76-150) of the
2026-27 classroom list.

**Architecture:** The page is stand-alone, like the fraction rounds:
- `spelling-hive.js` is the engine. Its pure helpers are named exports.
  `start(content)` is the only side-effecting entry, under
  `export default { start }`.
- `spelling-hive-words.js` is the content. It is hand-written and imports
  nothing.
- The page has one inline module script that imports both and calls
  `SPELLING_HIVE.start(HIVE_WORDS)`.

**Tech Stack:** Plain ES modules, Web Speech API (`speechSynthesis`), Web
Audio for chimes, CSS on top of `bonus.css`, `node --test`, and Vite (the
page is discovered automatically under `games/`).

**Spec:** `docs/superpowers/specs/2026-11-19-spelling-bee-design.md`

## Global Constraints

- Words 76-150 only: grade 4 = 76-100, grade 5 = 101-125, grade 6 = 126-150.
- The definitions, sentences and tips are original, written for a
  9-year-old. Nothing is copied from the Scripps packet. The only things
  taken from it are each word, its part of speech, its language of
  origin, its sound-alikes and its alternate spellings.
- The spelling never appears before she answers. Definitions must not
  contain the word, and sentences are shown with the word blanked.
- The tone is kind. A miss never takes anything away.
- The stylesheet starts with `@import './bonus.css';`, uses no
  `data-theme`, and has light and dark tokens.
- The page has exactly one `<script type="module">`, with no `src`.
- Every `localStorage` access is wrapped in try/catch.
- Motion respects `prefers-reduced-motion`.

## Review Focus

1. **iPad keyboard "fixing" her spelling.** Autocorrect, autocapitalize or
   the spellcheck underline would correct or flag her letters. The input
   must carry `autocomplete="off" autocorrect="off" autocapitalize="off"
   spellcheck="false"`. Pinned by a source test in Task 2.
2. **The first word is silent on Safari/iOS.** Speech only works after a
   tap, and the voice list loads late (`voiceschanged`). Practice starts
   from a button, and `say()` works with the default voice when the list
   is still empty. Checked by hand in Task 4.
3. **Pressing Enter twice.** It must not grade one attempt twice or skip
   the lock-in step. Each word has an `answered` latch. Checked by hand in
   Task 4.
4. **Taps overlapping speech.** Tapping "Sentence" while the word is still
   being spoken must cancel the word first, not queue behind it. `say()`
   calls `speechSynthesis.cancel()` first. Checked by hand in Task 4.
5. **Storage blocked (private mode).** The page must still work and just
   forget progress. try/catch everywhere. Checked by hand in Task 4.

---

### Task 1: Word content

**Files:**
- Create: `assets/js/spelling-hive-words.js`
- Test: `test/spelling-hive.test.js`

**Interfaces:**
- Produces: `export default { key: 'spelling-hive-v1', grades, words }`, where:
  - `grades`: `[{ id: 4, label: '4th grade', first: 76, last: 100 }, { id: 5, … 101, 125 }, { id: 6, … 126, 150 }]`
  - `words`: `[{ n, word, grade, pos, def, sentence, origin, mark, tip, sounds?, alts?, homonym?, say? }]`
  - `mark` is the word with its tricky letters in brackets: `'thim[ble]'`.
  - `sounds` is a list of sound-alike words a kid would know.
  - `homonym: true` when the packet flags the word.
  - `alts` lists other accepted spellings (124: `fertiliser`; 133: `materialise`).

- [ ] **Step 1: Write the failing tests**, `test/spelling-hive.test.js`:
  - `words run 76-150 with no gaps, 25 per grade, each inside its grade's range`
  - `every word has pos, def, sentence, origin, tip and a mark that spells the word`.
    Removing the brackets from `mark` gives back `word`, and `mark`
    contains at least one `[…]`.
  - `no definition gives the word away`. No spelling of the word appears
    as a whole word in `def` (case-insensitive).
  - `every sentence uses the word exactly once`. Count the whole-word,
    case-insensitive matches of every spelling: the total is 1.
- [ ] **Step 2:** Run `node --test test/spelling-hive.test.js`. Expected: FAIL (the module is missing).
- [ ] **Step 3:** Write the 75 entries.
- [ ] **Step 4:** Run the same command. Expected: PASS.

### Task 2: Engine helpers

**Files:**
- Create: `assets/js/spelling-hive.js` (helpers first, `start` in Task 3)
- Test: `test/spelling-hive.test.js`

**Interfaces:**
- Produces (named exports):
  - `normalize(s) -> string`: trim, lowercase, curly to straight apostrophes, collapse whitespace.
  - `spellings(w) -> string[]`: `[w.word, ...(w.alts || [])]`.
  - `isCorrect(w, typed) -> boolean`: the normalized typed text equals any normalized spelling.
  - `blankWord(text, w) -> string`: every whole-word spelling, in any case, becomes `_____`.
  - `letterDiff(typed, answer) -> [{ ch, ok }]`: one item per letter of
    `answer`. `ok` is false for answer letters outside the longest common
    subsequence with the typed text.
  - `pickRound(words, mastered: Set<n>, size, rand = Math.random) -> words[]`:
    unmastered words first (shuffled), then mastered words to fill
    `size`, with no duplicates.
  - `pickVoice(voices) -> voice | null`. Preference order:
    1. an `en-US` voice whose name matches `/Samantha|Google US English|Enhanced|Premium|Natural/`
    2. any `en-US` voice
    3. any `en` voice
    4. `null`
  - `default { start }`.

- [ ] **Step 1: Write the failing tests:**
  - `isCorrect`:
    - `isCorrect(buttons, ' Buttons ')` is true.
    - 124 accepts both `fertilizer` and `fertiliser`.
    - Halloween accepts `halloween`.
    - `isCorrect(buttons, 'butons')` is false.
  - `blankWord(sentence, w)`: for every word, the result contains no spelling.
  - `letterDiff('benith', 'beneath')` maps to `[1,1,1,0,0,1,1]` (as `ok` flags).
    `letterDiff('beneath', 'beneath')` is all ok.
  - `pickRound(words.slice(0, 25), new Set([76, 77, …, 90]), 10)`:
    - The first 10 picks are the 10 unmastered words (91-100).
    - With 20 mastered, it returns the 5 unmastered words first and fills to 10.
    - There are never duplicates.
  - `pickVoice`: given an en-GB voice, an en-US "Fred" and an en-US
    "Samantha", it returns Samantha. With no English voice it returns
    `null`.
  - `the answer box tells keyboards not to fix spelling`:
    `spelling-hive.js` source contains `autocorrect="off"`,
    `autocapitalize="off"`, `spellcheck="false"` and
    `autocomplete="off"`.
  - `importing the modules has no side effects`: `document` is still undefined after importing both.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement the helpers.
- [ ] **Step 4:** Run the tests. Expected: PASS.

### Task 3: Page, theme, engine UI, catalog

**Files:**
- Create: `games/ela/spelling-hive.html`, `assets/css/spelling-hive.css`
- Modify: `assets/js/spelling-hive.js` (add `start`), `index.html` (add a `GAMES_DATA` entry), `test/bonus-pages.test.js`
- Modify: `README.md` (Words Division blurb, project structure)

**Interfaces:**
- Consumes: Task 1 content and Task 2 helpers.
- Page script:
  ```js
  import SPELLING_HIVE from '../../assets/js/spelling-hive.js';
  import HIVE_WORDS from '../../assets/js/spelling-hive-words.js';
  SPELLING_HIVE.start(HIVE_WORDS);
  ```
- Views are `#study`, `#practice` and `#beeday`, routed by hash like
  `bonus-quiz.js`. The tab ids are `tab-study`, `tab-practice` and
  `tab-beeday`, and the view ids are `view-study`, `view-practice` and
  `view-beeday`.
- Catalog entry:
  ```js
  { id: 'spelling-hive', title: 'Words Division: Honey’s Spelling Hive', subject: 'ela', icon: '🐝',
    url: 'games/ela/spelling-hive', dateAdded: '2026-11-19', cta: 'Fly to the hive →', grade: 4, blurb: … }
  ```
- `bonus-pages.test.js`:
  - Add `spellingHive: { page, content: 'assets/js/spelling-hive-words.js', url, engine: 'assets/js/spelling-hive.js' }`.
  - Change `QUIZ_PAGES` to filter `b.engine === ENGINE`, so the
    bonus-quiz answer-key checks don't run on the hive.

- [ ] **Step 1:** Add the `BONUS` entry and run `node --test test/bonus-pages.test.js`. Expected: FAIL (the page is missing).
- [ ] **Step 2:** Build the page, the CSS and `start()`, following the
  spec's design section:
  - Honey mascot SVG with the moods idle, happy, oops and cheer.
  - 🍯 counter in the top bar.
  - Study: grade chips, a honeycomb of word cells, a word card, and the
    "How the bee works" panel.
  - Practice:
    - 10-word rounds.
    - Ask buttons: say it again, definition, sentence, part of speech,
      origin.
    - Honey's speech bubble, with the word blanked.
    - Check: a right answer celebrates, a miss shows the letter diff and
      the tip, and she types the word to lock it in. A missed word comes
      back 3 words later.
    - End-of-round summary.
  - Bee Day: the words in order from 76, one try each, a run counter,
    and a saved best run.
  - Mute toggle, and a voice-missing notice with a 2-second peek.
- [ ] **Step 3:** Add the catalog entry and the README lines.
- [ ] **Step 4:** Run `node --test`. Expected: every suite passes.
- [ ] **Step 5:** Run `npm run build`. Expected: the build succeeds and `dist/games/ela/spelling-hive.html` exists.

### Task 4: Check it in the browser

- [ ] Run `npm run dev` and open `/games/ela/spelling-hive`.
- [ ] In Study, Practice and Bee Day, check:
  - Speech plays after the first tap.
  - Every ask button speaks and shows its text with the word blanked.
  - Right and wrong answers behave as specified.
  - Pressing Enter twice is harmless.
  - The round summary appears.
  - The Bee Day best run is saved across a reload.
- [ ] Check dark mode and a 375px-wide phone layout.
- [ ] Commit on a branch, push, and open a PR. Don't merge: merging deploys.
