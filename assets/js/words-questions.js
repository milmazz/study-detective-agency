/*
  Question generators and content for the Words Division.

  Every question here is a plain 'mcq-simple', so this game needs no
  question-type module of its own.

  Lives here rather than inline in the page for two reasons. Assets under
  /assets/ are served immutable and cached for a year against their ?v= token,
  where the page's own HTML expires in 300s -- and this file is ~89% of what
  that page used to weigh, so a returning player was re-downloading all of it
  every five minutes. And a module can be require()d directly by the tests
  instead of being regex'd out of the HTML and run in a vm.

  Exports the config object DetectiveGame.start() takes. The page calls start();
  this file deliberately does not, so requiring it has no side effects.

  Load AFTER game-engine.js and question-kit.js.
*/
var WORDS_QUESTIONS = (function(){
  "use strict";

  // Browser: the engine is already a global. Node: pull it in directly, so the
  // tests get the real randInt/choice/shuffle/fmt rather than stand-ins.
  var DG = (typeof DetectiveGame !== 'undefined') ? DetectiveGame
         : (typeof require === 'function') ? require('./game-engine.js')
         : null;
  if (!DG) throw new Error('assets/js/words-questions.js: load game-engine.js first');

  var KIT = (typeof QUESTION_KIT !== 'undefined') ? QUESTION_KIT
          : (typeof require === 'function') ? require('./question-kit.js')
          : null;
  if (!KIT) throw new Error('assets/js/words-questions.js: load question-kit.js first');

  var shuffle = DG.shuffle;
  var buildOptionsFromPool = KIT.buildOptionsFromPool;

  /* ================= CONTENT: passages & craft-move data ================= */

  var PURPOSE_ITEMS = [
    { text:'Every kid should get at least one pet. Pets teach us responsibility, keep us active, and are always happy to see us after a long day. If your family hasn\u2019t gotten a pet yet, now is the perfect time to ask!',
      correct:'persuade',
      explain:'The author gives reasons ("teach us responsibility... keep us active") and ends with a call to action ("ask!") \u2014 classic signs of persuasive writing.' },
    { text:'Honey bees visit about two million flowers to make just one pound of honey. Inside the hive, worker bees fan their wings to keep the temperature steady at around 95 degrees. A single hive can hold up to 60,000 bees.',
      correct:'inform',
      explain:'The passage is packed with facts and numbers (two million flowers, 95 degrees, 60,000 bees) and has no opinions or story \u2014 that\u2019s typical of informational writing.' },
    { text:'Milo tiptoed down the creaky stairs, his flashlight trembling in his hand. Somewhere in the dark kitchen, something clattered to the floor. He froze. Was that... giggling?',
      correct:'entertain',
      explain:'This passage builds suspense with a character, setting, and action \u2014 hallmarks of a story meant to entertain the reader.' },
    { text:'Our school playground needs new equipment. The swings are rusty, the slide has a crack, and there\u2019s only one working seesaw for the whole third grade. Please vote yes for the new playground fund so every student can play safely.',
      correct:'persuade',
      explain:'The author lists problems and asks the reader to take an action ("vote yes"), which is the goal of persuasive writing.' },
    { text:'The Great Wall of China stretches over 13,000 miles. It was built over many centuries by different Chinese dynasties to protect against invasions. Today, sections of the wall attract millions of visitors every year.',
      correct:'inform',
      explain:'Dates, measurements, and historical facts with no opinion or story make this informational writing.' },
    { text:'Penny\u2019s stomach did a flip as the roller coaster clicked slowly up the first hill. She grabbed her brother\u2019s arm. "I changed my mind!" she squeaked, right as the coaster tipped over the edge.',
      correct:'entertain',
      explain:'A character, feelings, and a moment of action pull the reader into a story \u2014 that\u2019s writing meant to entertain.' }
  ];

  var MESSAGE_ITEMS = [
    { text:'Jae practiced his violin every single day, even when his fingers ached and his friends were outside playing. At the winter concert, his hard work finally paid off \u2014 his solo was the best one all night.',
      options:[
        {key:'a', label:'Hard work and practice lead to success.'},
        {key:'b', label:'Playing outside is more fun than practicing.'},
        {key:'c', label:'Jae played the violin at a winter concert.'},
        {key:'d', label:'Music concerts happen in winter.'}
      ], correctKey:'a',
      explain:'The passage focuses on Jae\u2019s daily effort paying off, which points to a message about hard work and practice \u2014 not just a summary of what happened.' },
    { text:'When Ravi saw a boy sitting alone at lunch, he almost kept walking to his usual table. But he stopped, turned around, and asked, "Mind if I sit here?" By the end of lunch, they were already planning to trade comic books.',
      options:[
        {key:'a', label:'Ravi likes comic books.'},
        {key:'b', label:'It\u2019s important to always sit with your usual friends.'},
        {key:'c', label:'A small act of kindness can start a new friendship.'},
        {key:'d', label:'Lunchtime is the best part of the school day.'}
      ], correctKey:'c',
      explain:'Ravi\u2019s choice to include someone new is what the story is really about \u2014 a small kind action leading to a friendship.' },
    { text:'The tortoise moved slower than every other animal in the race, and the other animals laughed. But while the hare stopped to nap, the tortoise kept walking, one slow step at a time \u2014 and crossed the finish line first.',
      options:[
        {key:'a', label:'Tortoises are faster than hares.'},
        {key:'b', label:'The hare won the race.'},
        {key:'c', label:'Naps are bad for you.'},
        {key:'d', label:'Slow, steady effort can win over speed and overconfidence.'}
      ], correctKey:'d',
      explain:'The tortoise wasn\u2019t actually faster \u2014 it just kept going steadily while the hare got overconfident. That\u2019s the real lesson, not a fact about the animals themselves.' },
    { text:'Every day, Grandma Lucia saved a little money in a jar labeled "Someday." Years later, when Mia needed help paying for her first year of college, Grandma Lucia handed her the jar, now overflowing with bills and coins.',
      options:[
        {key:'a', label:'Mia went to college.'},
        {key:'b', label:'Small, consistent efforts can add up to something big over time.'},
        {key:'c', label:'You should never spend your money.'},
        {key:'d', label:'Grandmothers are always generous.'}
      ], correctKey:'b',
      explain:'The jar filling up slowly, day by day, is the whole point of the story \u2014 small steps adding up over time.' },
    { text:'Sam\u2019s science project fell apart the night before it was due \u2014 literally, the volcano crumbled. He almost gave up, but instead he stayed up rebuilding it with cardboard and tape. It wasn\u2019t perfect, but it was his, and he was proud when he presented it.',
      options:[
        {key:'a', label:'Sam built a volcano for his science project.'},
        {key:'b', label:'Science projects should always be perfect.'},
        {key:'c', label:'Cardboard and tape are good building materials.'},
        {key:'d', label:'Perseverance and pride in your own effort matter more than perfection.'}
      ], correctKey:'d',
      explain:'Sam didn\u2019t end up with a perfect project \u2014 he ended up with one he was proud of because he didn\u2019t give up. That\u2019s the message.' }
  ];

  var FIGLANG_POOL = [
    {key:'simile', label:'Simile \u2014 compares using "like" or "as"'},
    {key:'metaphor', label:'Metaphor \u2014 compares directly, no "like/as"'},
    {key:'personification', label:'Personification \u2014 gives human traits to something non-human'},
    {key:'hyperbole', label:'Hyperbole \u2014 an obvious exaggeration'},
    {key:'idiom', label:'Idiom \u2014 a phrase that doesn\u2019t mean what it literally says'}
  ];
  var FIGLANG_ITEMS = [
    { before:'The wind ', hl:'howled through the trees', after:' all night long.', correct:'personification',
      explain:'Wind can\u2019t literally howl like an animal \u2014 giving it a human/animal action like "howling" is personification.' },
    { before:'Her smile was ', hl:'as bright as the sun', after:'.', correct:'simile',
      explain:'This compares two things using "as... as," which makes it a simile.' },
    { before:'The classroom was ', hl:'a zoo', after:' after the substitute left the room.', correct:'metaphor',
      explain:'Calling the classroom "a zoo" directly, without "like" or "as," makes this a metaphor.' },
    { before:'I\u2019ve told you ', hl:'a million times', after:' to clean your room.', correct:'hyperbole',
      explain:'No one has really said something a literal million times \u2014 this is an obvious exaggeration, or hyperbole.' },
    { before:'Grandpa said the news really ', hl:'let the cat out of the bag', after:'.', correct:'idiom',
      explain:'"Let the cat out of the bag" doesn\u2019t literally involve a cat \u2014 it\u2019s an idiom that means revealing a secret.' },
    { before:'The old floorboards ', hl:'groaned and complained', after:' under every footstep.', correct:'personification',
      explain:'Floorboards can\u2019t really complain \u2014 giving them a human ability like complaining is personification.' },
    { before:'His backpack was ', hl:'a heavy boulder', after:' on his shoulders by the end of the day.', correct:'metaphor',
      explain:'The backpack is directly called "a heavy boulder" \u2014 a direct comparison without "like" or "as" is a metaphor.' },
    { before:'She ran ', hl:'like a cheetah', after:' to catch the bus.', correct:'simile',
      explain:'Comparing her running to a cheetah using the word "like" makes this a simile.' }
  ];

  var FORMAT_POOL = [
    {key:'shout', label:'Shows a character is shouting or speaking loudly'},
    {key:'emphasis', label:'Emphasizes the single most important idea'},
    {key:'vocab', label:'Signals an important vocabulary word being defined'},
    {key:'sarcasm', label:'Shows sarcasm \u2014 the word means the opposite'},
    {key:'title', label:'Marks the title of a book, movie, or show'},
    {key:'thought', label:'Shows a character\u2019s silent, inner thought'}
  ];
  var FORMAT_ITEMS = [
    { before:'Coach blew the whistle and yelled, "', hl:'STOP RIGHT THERE!', after:'"', hlClass:'fmt-caps', correct:'shout',
      explain:'Writing words in ALL CAPS often shows that a character is shouting or speaking very loudly.' },
    { before:'The most important rule of the science lab is this: ', hl:'never touch the chemicals without gloves', after:'.', hlClass:'fmt-bold', correct:'emphasis',
      explain:'Bold text draws the reader\u2019s eye to the single most important idea in the sentence. Bold can also flag a vocabulary word \u2014 the difference is whether the sentence goes on to define it. This one states a rule instead.' },
    { before:'A ', hl:'habitat', after:' is the natural home or environment where a plant or animal lives.', hlClass:'fmt-bold', correct:'vocab',
      explain:'Bolding a word right before it\u2019s defined is a common way authors flag an important vocabulary term. The giveaway is the sentence shape: \u201cA <b>habitat</b> is\u2026\u201d is a definition, not just emphasis.' },
    { before:'After Marco spilled juice all over his homework, his sister said, "Nice job, ', hl:'\u2018genius\u2019', after:'."', hlClass:'', correct:'sarcasm',
      explain:'Marco clearly didn\u2019t do a nice job \u2014 putting "genius" in quotes signals sarcasm, where the word means the opposite of what it says.' },
    { before:'Have you read ', hl:'Because of Winn-Dixie', after:'? It\u2019s one of my favorite books.', hlClass:'fmt-italic', correct:'title',
      explain:'Italics are the standard way authors format the title of a book, movie, or show.' },
    { before:'', hl:'I can\u2019t believe I forgot my lines,', after:' Zoe thought as she walked on stage.', hlClass:'fmt-italic', correct:'thought',
      explain:'Italics are often used to show what a character is thinking silently, rather than saying out loud.' }
  ];

  /* ================= ITEM DRAWING ================= */
  /*
    Draw without replacement, and refill every bag when a case starts. These
    generators used choice(), which samples WITH replacement, from pools of 5-8
    across 8 clues -- so every single generated case repeated a passage and
    about three in four repeated one back-to-back. A kid answering the same
    passage twice in a row answers the second one from memory rather than by
    reading it. The mechanics live in question-kit.js, which every pool-driven
    game on the site shares.

    The no-repeat guarantee is per CASE, not global: with a fresh bag and
    questionsPerCase at or below the smallest pool, a case cannot repeat an item
    at all. A trail is 10 stops shared out over 4 modes, so a mode can come up
    more often than its pool has entries -- MESSAGE_ITEMS holds 5, and drawing
    it 6 times has to reuse one. Measured at 0.49% of trails over 50,000;
    back-to-back is ruled out inside the drawer. Closing it entirely would mean
    either more passages or a shorter trail.
  */
  var draws = KIT.drawers({
    purpose: PURPOSE_ITEMS,
    message: MESSAGE_ITEMS,
    figlang: FIGLANG_ITEMS,
    format:  FORMAT_ITEMS
  });

  /* ================= QUESTION GENERATORS ================= */

  function genPurpose(){
    var item = draws.purpose();
    var opts = shuffle([
      {key:'persuade', label:'To persuade the reader'},
      {key:'inform', label:'To inform the reader with facts'},
      {key:'entertain', label:'To entertain the reader with a story'}
    ]);
    return {
      type:'mcq-simple',
      prompt: '<div class="passage-box">' + item.text + '</div><span class="q-line">What is the author\u2019s main purpose for writing this passage?</span>',
      options: opts,
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }

  function genMessage(){
    var item = draws.message();
    return {
      type:'mcq-simple',
      prompt: '<div class="passage-box">' + item.text + '</div><span class="q-line">Which statement best captures the central message of this passage?</span>',
      // Shuffled like every other generator here. Unshuffled, a repeated item
      // came back in the same order and could be answered from position memory.
      options: shuffle(item.options),
      correctKey: item.correctKey,
      explain: function(){ return item.explain; }
    };
  }

  function genFigLang(){
    var item = draws.figlang();
    var opts = buildOptionsFromPool(FIGLANG_POOL, item.correct, 5);
    return {
      type:'mcq-simple',
      prompt: '<div class="passage-box">' + item.before + '<span class="passage-highlight">' + item.hl + '</span>' + item.after + '</div><span class="q-line">What kind of figurative language is highlighted above?</span>',
      options: opts,
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }

  function genFormat(){
    var item = draws.format();
    var opts = buildOptionsFromPool(FORMAT_POOL, item.correct, 4);
    var hlContent = '<span class="format-target ' + (item.hlClass||'') + '">' + item.hl + '</span>';
    return {
      type:'mcq-simple',
      prompt: '<div class="passage-box">' + item.before + hlContent + item.after + '</div><span class="q-line">Why did the author format the highlighted text that way?</span>',
      options: opts,
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }
  /* ================= MODE CONFIG ================= */
  var MODES = [
    { id:'purpose', caseNo:'01', title:'What\u2019s the Angle?', icon:'🎯',
      blurb:'Work out whether the author is trying to persuade, inform, or entertain.', gen: genPurpose },
    { id:'message', caseNo:'02', title:'Between the Lines', icon:'💭',
      blurb:'Read a short story and find the message the author is really making.', gen: genMessage },
    { id:'figlang', caseNo:'03', title:'Word Detective', icon:'🔍',
      blurb:'Spot similes, metaphors, personification, hyperbole, and idioms.', gen: genFigLang },
    { id:'format', caseNo:'04', title:'Fine Print', icon:'🖋️',
      blurb:'Work out why the author used bold, italics, CAPS, or quotes.', gen: genFormat }
  ];
  return {
    modes: MODES,
    homeIntro: 'Four case files. Every case pulls a fresh passage or example, so you can reopen a file as many times as you need to practice.',
    trailAllFilesWord: 'four',
    // Five, not the default eight. The smallest item pool here has 5 entries,
    // so this is the longest a case can run and still show every passage at
    // most once. The math game keeps 8 because its generators build fresh
    // numbers each time rather than drawing from a fixed pool.
    questionsPerCase: 5,
    onCaseStart: draws.resetAll
  };
})();

if (typeof window !== 'undefined') { window.WORDS_QUESTIONS = WORDS_QUESTIONS; }
if (typeof module !== 'undefined' && module.exports) { module.exports = WORDS_QUESTIONS; }
