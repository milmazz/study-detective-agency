/*
  Question generators and content for the Kitoto Files (Words Division).

  Built against HMH ELA Module 1, Lessons 11-15: retelling important events,
  literary elements, theme, author's craft and figurative language, context
  clues, prefixes and suffixes, and punctuating quotations.

  Kitoto the Mighty is a retelling of a traditional African folktale: a mouse
  who believes he is too small to protect himself goes looking for the mightiest
  one in the world, is passed from the Sun to the Cloud to the Wind to the
  Mountain, and learns from the Mountain that a mouse is the one thing it
  cannot stop. Every passage below is written for this file rather than copied
  from the book -- the point is to practice the skills on the story she knows,
  not to reprint it.

  Every question is a plain 'mcq-simple', so this game needs no question-type
  module of its own.

  Exports the config object DetectiveGame.start() takes. The page calls start();
  this file deliberately does not, so requiring it has no side effects.

*/
import DetectiveGame from './game-engine.js';
import QUESTION_KIT from './question-kit.js';

var KITOTO_QUESTIONS = (function(){
  "use strict";

  var DG = DetectiveGame;

  var KIT = QUESTION_KIT;

  var authored = KIT.buildAuthoredOptions;
  var fromPool = KIT.buildOptionsFromPool;

  function box(inner){ return '<div class="passage-box">' + inner + '</div>'; }
  function line(text){ return '<span class="q-line">' + text + '</span>'; }
  function hl(text){ return '<span class="passage-highlight">' + text + '</span>'; }

  /* ================= CASE 01: RETELLING IMPORTANT EVENTS ================= */
  /*
    A retell with one step lifted out. The distractors are events that could
    plausibly belong to this story but do not -- listing other steps already
    visible in the box would make the answer findable without retelling
    anything.
  */
  var RETELL_ITEMS = [
    { title:'Kitoto the Mighty', blank:1,
      steps:[
        'Kitoto decides he is too small to keep himself safe and sets out to find the mightiest one in the world.',
        null,
        'The Cloud sends Kitoto on to the Wind, and the Wind sends him on to the Mountain.',
        'The Mountain admits that a mouse tunnels through it, and Kitoto realizes he has been mighty all along.'
      ],
      correct:'The Sun tells Kitoto that the Cloud is mightier, because a cloud can cover the Sun’s face.',
      distractors:[
        'The Sun agrees to protect Kitoto from every danger in the grassland.',
        'Kitoto changes his mind about the search and goes back home to his nest.',
        'The Mountain warns Kitoto that the Wind is the mightiest of them all.'
      ],
      explain:'The story moves in a chain: Kitoto asks the Sun first, and the Sun passes him on to the Cloud. The step after the blank already mentions the Cloud, so the missing event has to be the one that sends him there.' },

    { title:'Kitoto the Mighty', blank:3,
      steps:[
        'Kitoto sets out to find the mightiest one in the world.',
        'The Sun says the Cloud is mightier, because a cloud can cover the Sun.',
        'The Cloud says the Wind is mightier, and the Wind says the Mountain is mightier.',
        null,
        'Kitoto walks home through the grass, no longer feeling small.'
      ],
      correct:'The Mountain says a mouse is mightier, because mice gnaw tunnels straight through it.',
      distractors:[
        'The Mountain agrees that it is the mightiest thing in the whole world.',
        'Kitoto gives up his search and asks the Cloud the very same question again.',
        'The Wind lifts Kitoto to the top of the Mountain so he can see the grassland.'
      ],
      explain:'The Mountain is the last one Kitoto asks, and its answer is what turns the story around — it names the mouse. That is why the very next step has Kitoto walking home feeling different.' },

    { title:'Kitoto the Mighty', blank:4,
      steps:[
        'Kitoto asks the Sun to protect him, and the Sun points him to the Cloud.',
        'The Cloud points him to the Wind.',
        'The Wind points him to the Mountain.',
        'The Mountain says that a small mouse is the one thing it cannot stop.',
        null
      ],
      correct:'Kitoto understands that the strength he was searching for was his own all along.',
      distractors:[
        'Kitoto asks the Sun one more time to make him bigger and stronger.',
        'Kitoto decides that the Mountain will be his protector from now on.',
        'Kitoto warns the other animals to stay far away from the Mountain.'
      ],
      explain:'The ending is the whole point of the folktale: after the Mountain names the mouse, Kitoto stops looking for a protector because he has found strength in himself.' },

    { title:'Kitoto the Mighty', blank:0,
      steps:[
        null,
        'He asks the Sun for protection, and the Sun sends him to the Cloud.',
        'The Cloud sends him to the Wind, and the Wind sends him to the Mountain.',
        'The Mountain tells him that a mouse is mightier than a mountain.'
      ],
      correct:'Kitoto hides from every shadow that crosses the grass and decides he needs someone mighty to keep him safe.',
      distractors:[
        'Kitoto brags to the other animals that he is the strongest one in the grassland.',
        'Kitoto builds a new nest at the foot of the Mountain and stays hidden there.',
        'Kitoto asks the Wind to carry him all the way to the top of the Mountain.'
      ],
      explain:'A retelling starts with the problem. Kitoto’s problem is that he feels too small to protect himself — that is what sends him off to ask the Sun in the very next step.' },

    { title:'Ada and the Long Harvest', blank:2,
      steps:[
        'Ada looks at the huge field and says her small hands will never finish the harvest.',
        'Her grandmother tells her to fill just one basket each morning, before the sun is high.',
        null,
        'By the end of the season, Ada has filled more baskets than anyone else in the village.'
      ],
      correct:'Ada fills one basket every single morning, even on the days when the field still looks endless.',
      distractors:[
        'Ada asks the whole village to come and harvest the field in one afternoon.',
        'Ada decides the field is too big for anyone and leaves it for next year.',
        'Ada builds a bigger basket so she can carry the whole harvest at once.'
      ],
      explain:'The middle of a retelling is what the character actually does about the problem. Grandmother gives the advice, and the missing step is Ada following it, one basket at a time.' },

    { title:'Ada and the Long Harvest', blank:3,
      steps:[
        'Ada says her small hands will never finish the harvest.',
        'Her grandmother tells her to fill one basket each morning.',
        'Ada fills a basket every morning, even when the field looks endless.',
        null
      ],
      correct:'By the end of the season Ada has filled more baskets than anyone in the village.',
      distractors:[
        'Ada stops after the first week because her hands are too small.',
        'Ada’s grandmother finishes the rest of the harvest by herself.',
        'The village decides to plant a much smaller field the next year.'
      ],
      explain:'The last event of a retelling tells how things turned out. Ada’s steady, one-basket-a-day work is what makes the ending — the harvest gets finished after all.' }
  ];

  function genRetell(){
    var item = draws.retell();
    var steps = item.steps.map(function(s, i){
      return (i === item.blank)
        ? '<li class="retell-blank">?</li>'
        : '<li>' + s + '</li>';
    }).join('');
    var opts = authored(item.correct, item.distractors);
    return {
      type:'mcq-simple',
      prompt: box('<p class="retell-title">' + item.title + ' — what happened, in order</p>' +
                  '<ol class="retell-list">' + steps + '</ol>') +
              line('Which event belongs in the empty box?'),
      options: opts.options,
      correctKey: opts.correctKey,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 02: LITERARY ELEMENTS ================= */
  var ELEMENT_ITEMS = [
    { text:'Kitoto crouched under a wide green leaf at the edge of the grassland. Every shadow that slid across the grass made his small heart pound. “I am too little to keep myself safe,” he whispered.',
      q:'Where does this part of the folktale take place — what is the setting?',
      correct:'Under a leaf at the edge of the grassland',
      distractors:['Inside a cave on the side of a mountain','On a raft in the middle of a wide river','In a busy village market at sunrise'],
      explain:'Setting is where and when a story happens. The passage puts Kitoto “under a wide green leaf at the edge of the grassland” — everything else in the passage is what he feels and says, not where he is.' },

    { text:'Kitoto crouched under a wide green leaf at the edge of the grassland. Every shadow that slid across the grass made his small heart pound. “I am too little to keep myself safe,” he whispered.',
      q:'What is Kitoto’s problem at the beginning of the folktale?',
      correct:'He believes he is too small to protect himself',
      distractors:['He cannot find enough food to last the dry season','He has wandered far from home and cannot find his nest','He has quarreled with the other mice in the grass'],
      explain:'The problem is what pushes the story forward. Kitoto says it out loud — “I am too little to keep myself safe” — and that belief is what sends him off to look for a protector.' },

    { text:'The Sun listened to the little mouse and laughed a warm, golden laugh. “Mighty? Not I,” said the Sun. “Whenever the Cloud drifts across my face, the whole world goes grey. Go and ask the Cloud.”',
      q:'Folktales often turn parts of nature into characters. Which detail shows that the Sun is a character here?',
      correct:'The Sun laughs, speaks to Kitoto, and sends him on to the Cloud',
      distractors:['The Sun rises over the grassland every single morning','The Sun makes the grass warm and dry','The Sun is described as being golden'],
      explain:'A character does things and says things. Warmth and colour are just description — it is the laughing, speaking, and giving advice that make the Sun a character in this folktale.' },

    { text:'The Sun sent Kitoto to the Cloud. The Cloud sent him to the Wind. The Wind sent him to the Mountain. Kitoto’s paws ached, but each time he was turned away he simply asked, “Then who is mightier than you?”',
      q:'Which word best describes Kitoto in this part of the story?',
      correct:'Determined — he keeps asking until he gets an answer',
      distractors:['Boastful — he brags about his own strength','Careless — he acts without thinking first','Impatient — he refuses to listen to anyone'],
      explain:'Character traits come from what a character does. Kitoto is turned away three times and asks the same question again every time — that is determination, not bragging or carelessness.' },

    { text:'The Mountain rumbled when it heard the question. “Mighty? A mouse no bigger than my smallest stone gnaws tunnels straight through me, and I cannot stop it.” Kitoto sat very still. The Mountain was talking about him.',
      q:'Which sentence best states the turning point of the folktale?',
      correct:'Kitoto learns that the Mountain cannot stop a mouse like him',
      distractors:['Kitoto sets out to find someone mighty to protect him','The Cloud sends Kitoto on to the Wind','Kitoto hides beneath a leaf at the edge of the grass'],
      explain:'The turning point is the moment the story changes direction. Everything before this is Kitoto looking outward for strength; the Mountain’s answer is what turns him around to look at himself.' },

    { text:'The Mountain rumbled when it heard the question. “Mighty? A mouse no bigger than my smallest stone gnaws tunnels straight through me, and I cannot stop it.” Kitoto sat very still. The Mountain was talking about him.',
      q:'How is Kitoto’s problem finally solved?',
      correct:'He discovers strength of his own, so he no longer needs a protector',
      distractors:['The Mountain promises to guard him from now on','The Wind carries him somewhere safer to live','The Sun agrees to shine on his nest every day'],
      explain:'The resolution answers the problem the story opened with. Kitoto went looking for someone mighty to protect him and ended up finding that he is mighty himself — nobody else takes the job.' },

    { text:'The storm had knocked the footbridge into the creek, and the water was still running high and brown. Nadia stood on the bank with her library books stacked under her chin. School started in twenty minutes; the long way around took thirty.',
      q:'What is the problem in this passage?',
      correct:'The bridge is gone, and the only other route takes too long',
      distractors:['Nadia has left her library books at home','Nadia does not want to go to school today','The creek has dried up completely'],
      explain:'A problem is what stands between the character and what she wants. Nadia needs to get to school in twenty minutes, and the storm has taken away the only route that is short enough.' },

    { text:'The storm had knocked the footbridge into the creek, and the water was still running high and brown. Nadia stood on the bank with her library books stacked under her chin. School started in twenty minutes; the long way around took thirty.',
      q:'Which phrase describes the setting — the place where this scene happens?',
      correct:'A creek bank beside a footbridge washed out by a storm',
      distractors:['A stack of library books held under a chin','A walk that takes a full thirty minutes','A girl who is worried about being late'],
      explain:'Setting is the place. The creek bank and the washed-out bridge are where Nadia is standing; the books, the walk, and her worry all belong to her, not to the place.' }
  ];

  function genElements(){
    var item = draws.elements();
    var opts = authored(item.correct, item.distractors);
    return {
      type:'mcq-simple',
      prompt: box(item.text) + line(item.q),
      options: opts.options,
      correctKey: opts.correctKey,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 03: THEME ================= */
  /*
    Every item carries a plot-summary distractor on purpose: "what happened" is
    the answer a reader gives when they have not yet separated events from the
    lesson underneath them, and the explanation names the trap directly.
  */
  var THEME_ITEMS = [
    { text:'Kitoto walked home through the grass the same size he had always been. But he walked down the middle of the path now, instead of creeping along its edge.',
      correct:'You can be small and still have real strength of your own.',
      distractors:['Mountains are the mightiest things in the whole world.','It is safer to stay at home than to travel far.','Kitoto walked home through the grass after his journey.'],
      explain:'Nothing about Kitoto’s size changed — only what he believes about himself, which is why he walks down the middle of the path now. “Kitoto walked home” is a retelling of the event, not the lesson underneath it.' },

    { text:'Every time Kitoto met something new, he measured himself against it: smaller than the Sun, smaller than the Cloud, smaller than the Wind. Not once did he ask what a mouse could do that none of them could.',
      correct:'Measuring yourself against others can hide what you are good at.',
      distractors:['The Sun, the Cloud, and the Wind are all larger than a mouse.','You should never ask anyone else for help.','Mice are able to dig tunnels through mountains.'],
      explain:'The passage points straight at Kitoto’s mistake: he keeps comparing sizes and never asks what he can do. “The Sun is larger than a mouse” is true, but it is a detail from the passage, not the lesson.' },

    { text:'The little weaver bird copied every nest she saw — the long one, the round one, the one hung from a thorn. None of them held together. Only when she wove the nest her own beak knew how to make did it hold through the rain.',
      correct:'Being yourself is worth more than copying someone else.',
      distractors:['Round nests are stronger than nests hung from thorns.','Weaver birds build their nests out of grass.','Rain is dangerous for young birds.'],
      explain:'The copied nests all fail and the bird’s own nest holds — that contrast is the author’s point. Facts about nests and rain are details the story uses to make it.' },

    { text:'Ada looked at the field and said her small hands would never finish it. Her grandmother handed her one basket. “Fill this,” she said, “before the sun is high. Then do it again tomorrow.”',
      correct:'Steady effort can finish work that looks impossible at first.',
      distractors:['Harvesting should be done early in the morning.','Ada filled a basket with her grandmother.','Grandmothers always know the right answer.'],
      explain:'The lesson is in the shape of the advice: one basket, then another, until an impossible field is done. The time of day and who was there are the details that carry it.' },

    { text:'The lion roared that he was the strongest animal on the plain. The ants said nothing at all. Then the rains came, and it was the ants’ packed-earth hill that stood while the lion looked for shelter.',
      correct:'Talking about strength is not the same as having it.',
      distractors:['Ants build their homes out of packed earth.','Lions are afraid of heavy rain.','The rains came and the plain was flooded.'],
      explain:'The story sets loud boasting against quiet building and lets the rain decide between them. The ant hill and the rain are how the author makes the point, not the point itself.' },

    { text:'“Who is mightier than you?” Kitoto asked, again and again, until the question finally circled all the way back to a mouse.',
      correct:'The answer you go searching for is sometimes already yours.',
      distractors:['You should ask a question until someone gives you a good answer.','Kitoto asked four different characters the same question.','Mountains are afraid of small animals.'],
      explain:'The question travels from the Sun all the way around to Kitoto himself — the folktale is built so that the search ends where it started. Counting how many characters he asked is retelling the events instead.' }
  ];

  function genTheme(){
    var item = draws.theme();
    var opts = authored(item.correct, item.distractors);
    return {
      type:'mcq-simple',
      prompt: box(item.text) + line('Which statement best states the theme — the lesson the author wants the reader to take away?'),
      options: opts.options,
      correctKey: opts.correctKey,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 04: AUTHOR'S CRAFT ================= */
  var CRAFT_POOL = [
    {key:'simile', label:'Simile — a comparison that uses “like” or “as”'},
    {key:'metaphor', label:'Metaphor — a direct comparison with no “like” or “as”'},
    {key:'personification', label:'Personification — human actions given to something that is not human'},
    {key:'hyperbole', label:'Hyperbole — an exaggeration nobody is meant to believe'},
    {key:'idiom', label:'Idiom — a saying that does not mean what the words literally say'},
    {key:'sensory', label:'Sensory detail — words that let you see, hear, or feel it'},
    {key:'repetition', label:'Repetition — the same words used again on purpose'}
  ];
  var CRAFT_ITEMS = [
    { before:'The grass ', hl:'whispered secrets', after:' as Kitoto hurried through it.', correct:'personification',
      explain:'Grass cannot whisper or keep secrets — those are human things. Handing them to the grass is personification, and it makes the grassland feel alive and a little frightening.' },
    { before:'Beside the Mountain, Kitoto was ', hl:'as small as a single seed', after:'.', correct:'simile',
      explain:'The comparison uses the word “as,” which makes it a simile. It gives the reader a size to picture instead of just saying Kitoto was small.' },
    { before:'The Cloud was ', hl:'a grey blanket pulled over the sky', after:'.', correct:'metaphor',
      explain:'The Cloud is called a blanket outright — no “like” or “as” — so this is a metaphor. It shows how completely the Cloud covers the Sun.' },
    { before:'“I have asked ', hl:'a thousand thousand times', after:'!” Kitoto cried.', correct:'hyperbole',
      explain:'Nobody has really asked a million questions. The exaggeration is there to show how tired and frustrated Kitoto is — that is hyperbole.' },
    { before:'The Wind told Kitoto to ', hl:'keep his chin up', after:' and try the Mountain next.', correct:'idiom',
      explain:'“Keep your chin up” has nothing to do with chins — it means stay hopeful. A saying whose meaning is different from its words is an idiom.' },
    { before:'', hl:'Dust cracked under his paws, and the hot air smelled of dry grass and warm stone', after:'.', correct:'sensory',
      explain:'The author writes what the journey sounded like and smelled like, so the reader can feel it. Language aimed at the five senses is sensory detail.' },
    { before:'', hl:'On he went. On past the thorn trees, on past the dry riverbed, on toward the Mountain', after:'.', correct:'repetition',
      explain:'“On” is repeated at the start of each part on purpose. The repeated word gives the sentence the rhythm of a long walk that keeps going.' },
    { before:'The Mountain’s ', hl:'shoulders', after:' were white with snow.', correct:'personification',
      explain:'A mountain has no shoulders — giving it a body part is personification, and it makes the Mountain feel like the character it turns out to be.' }
  ];

  function genCraft(){
    var item = draws.craft();
    var opts = fromPool(CRAFT_POOL, item.correct, 5);
    return {
      type:'mcq-simple',
      prompt: box(item.before + hl(item.hl) + item.after) +
              line('Which craft move did the author use in the highlighted words?'),
      options: opts,
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 05: CONTEXT CLUES ================= */
  var CONTEXT_ITEMS = [
    { word:'immense',
      before:'The Mountain was so ', after:' that Kitoto could not see the top of it, even leaning all the way back.',
      correct:'Extremely large',
      distractors:['Very old','Far away','Covered in ice'],
      explain:'The clue is what the size does to Kitoto: he cannot see the top even leaning all the way back. That points to “extremely large” — nothing in the sentence is about age, distance, or snow.' },
    { word:'cowered',
      before:'When the hawk’s shadow crossed the grass, Kitoto ', after:' beneath a leaf until it had passed.',
      correct:'Crouched down in fear',
      distractors:['Shouted for help','Ran in wide circles','Fell fast asleep'],
      explain:'A hawk’s shadow and hiding “beneath a leaf until it had passed” are the clues — they add up to crouching in fear, not shouting, running, or sleeping.' },
    { word:'boasted',
      before:'The Wind ', after:' that it could shove whole clouds across the sky — but the Mountain never moved an inch.',
      correct:'Bragged about what it could do',
      distractors:['Asked a polite question','Quietly wondered aloud','Complained about the weather'],
      explain:'The dash sets up the clue: the Wind makes a big claim and then cannot back it up. That is bragging — which is what “boasted” means.' },
    { word:'feeble',
      before:'“I am far too ', after:' to protect myself,” said Kitoto, whose legs shook whenever a shadow passed.',
      correct:'Weak and lacking strength',
      distractors:['Clumsy and slow','Lonely and bored','Young and curious'],
      explain:'The clue is in the same sentence: legs that shake, and a mouse who cannot protect himself. Both point to weakness.' },
    { word:'trudged',
      before:'Kitoto ', after:' across the dry ground, lifting each tired paw as if it were made of stone.',
      correct:'Walked slowly and with great effort',
      distractors:['Ran quickly and lightly','Crawled flat on his belly','Leapt from rock to rock'],
      explain:'“Each tired paw as if it were made of stone” tells you how the walking felt — heavy and slow. That is what trudging is.' },
    { word:'declared',
      before:'The Sun ', after:', in a voice the whole grassland could hear, that the Cloud was mightier.',
      correct:'Said something firmly for everyone to hear',
      distractors:['Whispered a secret','Asked a nervous question','Made a quiet little joke'],
      explain:'“In a voice the whole grassland could hear” is the clue — it rules out whispering and quiet joking, and a declaration is a statement, not a question.' },
    { word:'gnaw',
      before:'Mice ', after:' tunnels through the Mountain, chewing away one small bite at a time.',
      correct:'Chew away at something bit by bit',
      distractors:['Dig with long sharp claws','Push it over with the shoulders','Wash it away with water'],
      explain:'The rest of the sentence defines the word for you: “chewing away one small bite at a time.” Authors often drop a definition right beside a hard word.' },
    { word:'vast',
      before:'The grassland was so ', after:' that Kitoto walked a whole day and it still stretched out ahead of him.',
      correct:'Huge and spread out in every direction',
      distractors:['Thick and hard to walk through','Empty of every living thing','Gently sloping downhill'],
      explain:'Walking a whole day and still having more ahead is the clue — it is about how far the grassland reaches, not how thick, empty, or steep it is.' }
  ];

  function genContext(){
    var item = draws.context();
    var opts = authored(item.correct, item.distractors);
    return {
      type:'mcq-simple',
      prompt: box(item.before + hl(item.word) + item.after) +
              line('Using the clues around it, what does the highlighted word mean?'),
      options: opts.options,
      correctKey: opts.correctKey,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 06: PREFIXES AND SUFFIXES ================= */
  var AFFIX_MEANINGS = [
    {key:'not', label:'Not — the opposite of the base word'},
    {key:'again', label:'Again — do the action one more time'},
    {key:'wrongly', label:'Wrongly — done in an incorrect way'},
    {key:'before', label:'Before — happening ahead of time'},
    {key:'toomuch', label:'Too much — more than there should be'},
    {key:'without', label:'Without — missing that thing completely'},
    {key:'fullof', label:'Full of that quality'},
    {key:'person', label:'A person who does it'},
    {key:'state', label:'The state of being that way'},
    {key:'ableto', label:'Able to be done'},
    {key:'howdone', label:'In that way — how the action is done'}
  ];
  var AFFIX_ITEMS = [
    { word:'unafraid', affix:'un', at:'start', means:'not',
      explain:'The prefix un- flips a word to its opposite. Afraid becomes unafraid — not afraid at all, which is exactly how Kitoto walks home.' },
    { word:'rebuild', affix:'re', at:'start', means:'again',
      explain:'The prefix re- means to do it again. Build becomes rebuild — to build it a second time.' },
    { word:'misjudge', affix:'mis', at:'start', means:'wrongly',
      explain:'The prefix mis- means wrongly. To misjudge is to judge something the wrong way — which is what Kitoto does to himself at the start of the folktale.' },
    { word:'preview', affix:'pre', at:'start', means:'before',
      explain:'The prefix pre- means before. A preview is a look at something before the whole thing happens.' },
    { word:'overcrowded', affix:'over', at:'start', means:'toomuch',
      explain:'The prefix over- means too much. An overcrowded room has more people in it than it should.' },
    { word:'disagree', affix:'dis', at:'start', means:'not',
      explain:'The prefix dis- works like un-: it makes the opposite. To disagree is to not agree.' },
    { word:'fearless', affix:'less', at:'end', means:'without',
      explain:'The suffix -less means without. Fearless means without fear — the opposite of how Kitoto starts the story.' },
    { word:'powerful', affix:'ful', at:'end', means:'fullof',
      explain:'The suffix -ful means full of. Powerful means full of power — which is one way to say mighty.' },
    { word:'traveler', affix:'er', at:'end', means:'person',
      explain:'The suffix -er can turn an action into the person who does it. Someone who travels is a traveler.' },
    { word:'kindness', affix:'ness', at:'end', means:'state',
      explain:'The suffix -ness turns a describing word into a thing. Kind becomes kindness — the state of being kind.' },
    { word:'breakable', affix:'able', at:'end', means:'ableto',
      explain:'The suffix -able means able to be. Something breakable is able to be broken.' },
    { word:'quietly', affix:'ly', at:'end', means:'howdone',
      explain:'The suffix -ly tells how an action is done. To speak quietly is to speak in a quiet way.' }
  ];
  var WHOLEWORD_ITEMS = [
    { word:'powerless', affix:'less', at:'end',
      correct:'Having no power at all',
      distractors:['Full of power','Gaining power again','Power used the wrong way'],
      explain:'Power + the suffix -less (without) gives powerless: having no power. Kitoto believes this about himself until the Mountain corrects him.' },
    { word:'reappear', affix:'re', at:'start',
      correct:'To appear again',
      distractors:['To appear for the very first time','To disappear on purpose','To appear ahead of everyone else'],
      explain:'The prefix re- (again) in front of appear gives reappear — to appear a second time, the way the Sun does after the Cloud drifts past.' },
    { word:'unlock', affix:'un', at:'start',
      correct:'To open something that was locked',
      distractors:['To lock something a second time','To lock something the wrong way','To lock something ahead of time'],
      explain:'The prefix un- undoes the base word. Lock becomes unlock — the opposite action.' },
    { word:'joyful', affix:'ful', at:'end',
      correct:'Full of joy',
      distractors:['Without any joy at all','Joy that happens again','Only a small amount of joy'],
      explain:'The suffix -ful means full of, so joyful means full of joy. Compare it with joyless, which uses -less to mean the opposite.' }
  ];

  function wordWithAffix(word, affix, at){
    return (at === 'start')
      ? '<span class="affix">' + affix + '</span>' + word.slice(affix.length)
      : word.slice(0, word.length - affix.length) + '<span class="affix">' + affix + '</span>';
  }

  function genWordParts(){
    var item = draws.wordparts();
    var display = '<div class="word-build">' + wordWithAffix(item.word, item.affix, item.at) + '</div>';
    var partName = (item.at === 'start') ? 'prefix' : 'suffix';
    if (item.means){
      var opts = fromPool(AFFIX_MEANINGS, item.means, 4);
      return {
        type:'mcq-simple',
        prompt: box(display) + line('What does the highlighted ' + partName + ' add to the meaning of this word?'),
        options: opts,
        correctKey: item.means,
        explain: function(){ return item.explain; }
      };
    }
    var authoredOpts = authored(item.correct, item.distractors);
    return {
      type:'mcq-simple',
      prompt: box(display) + line('Using the ' + partName + ', what does the whole word mean?'),
      options: authoredOpts.options,
      correctKey: authoredOpts.correctKey,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 07: PUNCTUATING QUOTATIONS ================= */
  /*
    Every distractor is the same sentence with the punctuation moved, so the
    only way to answer is to look at the marks. Changing a word instead would
    let a reader pick the answer by meaning without ever reading a comma.
  */
  var QUOTE_ITEMS = [
    { brief:'Kitoto looks up and says these exact words: <em>The Sun must be the mightiest of all</em>. The writer wants to name the speaker first.',
      correct:'Kitoto looked up and said, “The Sun must be the mightiest of all.”',
      distractors:[
        'Kitoto looked up and said “The Sun must be the mightiest of all.”',
        'Kitoto looked up and said, “the Sun must be the mightiest of all.”',
        'Kitoto looked up and said, “The Sun must be the mightiest of all”.'
      ],
      explain:'When the speaker comes first, a comma goes before the quotation marks, the spoken words start with a capital letter, and the period goes INSIDE the closing marks.' },

    { brief:'Kitoto whispers these exact words: <em>I am only a small mouse</em>. The writer wants to name the speaker afterwards.',
      correct:'“I am only a small mouse,” Kitoto whispered.',
      distractors:[
        '“I am only a small mouse.” Kitoto whispered.',
        '“I am only a small mouse”, Kitoto whispered.',
        'I am only a small mouse, Kitoto whispered.'
      ],
      explain:'When the speaker tag comes after the quotation, the spoken words end with a comma — inside the quotation marks — and the sentence’s period comes after the tag.' },

    { brief:'Kitoto asks this exact question: <em>Who is mightier than you</em>? The writer wants to name the speaker afterwards.',
      correct:'“Who is mightier than you?” asked Kitoto.',
      distractors:[
        '“Who is mightier than you”? asked Kitoto.',
        '“Who is mightier than you?” Asked Kitoto.',
        '“Who is mightier than you,” asked Kitoto?'
      ],
      explain:'The question mark belongs to the spoken words, so it goes inside the closing marks — and it replaces the comma. The speaker tag that follows is not a new sentence, so “asked” stays lowercase.' },

    { brief:'The Sun says these exact words: <em>A cloud can cover my face whenever it likes</em>. The writer wants to split them in two and drop the speaker into the middle.',
      correct:'“A cloud,” said the Sun, “can cover my face whenever it likes.”',
      distractors:[
        '“A cloud,” said the Sun, “Can cover my face whenever it likes.”',
        '“A cloud” said the Sun “can cover my face whenever it likes.”',
        '“A cloud,” Said the Sun, “can cover my face whenever it likes.”'
      ],
      explain:'A quotation split by a speaker tag needs marks around BOTH halves and commas on each side of the tag. The second half continues the same sentence, so it starts lowercase.' },

    { brief:'Kitoto shouts these exact words: <em>I have been mighty all along</em>! The writer wants to name the speaker afterwards.',
      correct:'“I have been mighty all along!” Kitoto shouted.',
      distractors:[
        '“I have been mighty all along”! Kitoto shouted.',
        '“I have been mighty all along!”, Kitoto shouted.',
        '“i have been mighty all along!” Kitoto shouted.'
      ],
      explain:'The exclamation point is part of what Kitoto shouted, so it goes inside the marks — and it does the comma’s job, so no comma follows the closing marks.' },

    { brief:'The writer wants to report what Kitoto told the Wind — the idea of it, not his exact words.',
      correct:'Kitoto told the Wind that he was looking for a protector.',
      distractors:[
        'Kitoto told the Wind that “he was looking for a protector.”',
        'Kitoto told the Wind, that he was looking for a protector.',
        '“Kitoto told the Wind that he was looking for a protector.”'
      ],
      explain:'These are not Kitoto’s exact words — the sentence reports what he said instead of quoting it. Retold speech takes no quotation marks at all.' }
  ];

  function genQuotes(){
    var item = draws.quotes();
    var opts = authored(item.correct, item.distractors);
    return {
      type:'mcq-simple',
      prompt: box('<p class="quote-brief">' + item.brief + '</p>') +
              line('Which version writes it with the quotation marks and punctuation in the right places?'),
      options: opts.options,
      correctKey: opts.correctKey,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= DRAWING ================= */
  var draws = KIT.drawers({
    retell: RETELL_ITEMS,
    elements: ELEMENT_ITEMS,
    theme: THEME_ITEMS,
    craft: CRAFT_ITEMS,
    context: CONTEXT_ITEMS,
    wordparts: AFFIX_ITEMS.concat(WHOLEWORD_ITEMS),
    quotes: QUOTE_ITEMS
  });

  /* ================= MODE CONFIG ================= */
  var MODES = [
    { id:'retell', caseNo:'01', title:'Put the Trail in Order', icon:'🐾',
      blurb:'One event is missing from the retelling. Work out which one belongs in the gap.', gen: genRetell },
    { id:'elements', caseNo:'02', title:'Who, Where, What Went Wrong', icon:'🧩',
      blurb:'Find the character, the setting, the problem, and how it gets solved.', gen: genElements },
    { id:'theme', caseNo:'03', title:'The Lesson Underneath', icon:'💡',
      blurb:'Tell the theme of a folktale apart from a plain retelling of what happened.', gen: genTheme },
    { id:'craft', caseNo:'04', title:'The Author’s Fingerprints', icon:'✍️',
      blurb:'Name the craft move: simile, metaphor, personification, hyperbole, idiom, and more.', gen: genCraft },
    { id:'context', caseNo:'05', title:'Surrounded by Clues', icon:'🔎',
      blurb:'Work out what a hard word means from the words sitting around it.', gen: genContext },
    { id:'wordparts', caseNo:'06', title:'Take the Word Apart', icon:'🧱',
      blurb:'Prefixes and suffixes — what each word part adds to the meaning.', gen: genWordParts },
    { id:'quotes', caseNo:'07', title:'Exactly What Was Said', icon:'💬',
      blurb:'Four versions of one line of dialogue. Only one has the quotation marks right.', gen: genQuotes }
  ];

  return {
    modes: MODES,
    homeIntro: 'Seven case files on <em>Kitoto the Mighty</em> and the skills that go with it. Every case deals a fresh clue, so you can reopen a file as many times as you need.',
    trailAllFilesWord: 'seven',
    trailTitle: 'The Trail — Follow the Clues',
    // Six, not the default eight: the smallest item pool here holds six, and a
    // case must not be able to deal the same clue twice.
    questionsPerCase: 6,
    onCaseStart: draws.resetAll
  };
})();

export default KITOTO_QUESTIONS;
