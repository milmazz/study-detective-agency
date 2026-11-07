/*
  Content for games/social-studies/texas-trail.html (bonus page, chick theme).
  Source: Grade 4 Social Studies Unit 3 Study Guide -- exploration and
  settlement of Texas. Practice questions cover the same skills as the
  guide's with new wording, so they can't be answered from memory.
  Answer keys are checked by test/bonus-pages.test.js.
*/
export function chickSVG(mood){
  const eyes = mood === 'happy'
    ? '<path d="M44 66q6-7 12 0M68 66q6-7 12 0" stroke="var(--chickline)" stroke-width="4" fill="none" stroke-linecap="round"/>'
    : mood === 'think'
    ? '<circle cx="51" cy="64" r="5.5" fill="var(--chickline)"/><circle cx="75" cy="64" r="5.5" fill="var(--chickline)"/><circle cx="53" cy="62" r="2" fill="#fff"/><circle cx="77" cy="62" r="2" fill="#fff"/><path d="M104 46q5 8 0 12q-5-4 0-12z" fill="#8FD3FF"/>'
    : '<circle cx="50" cy="66" r="6" fill="var(--chickline)"/><circle cx="74" cy="66" r="6" fill="var(--chickline)"/><circle cx="52" cy="64" r="2.2" fill="#fff"/><circle cx="76" cy="64" r="2.2" fill="#fff"/>';
  return `<svg class="mascot" viewBox="0 0 124 124" aria-hidden="true">
  <path d="M46 116v-10M78 116v-10M40 117h12M72 117h12" stroke="var(--beak)" stroke-width="4" stroke-linecap="round"/>
  <ellipse cx="62" cy="72" rx="44" ry="38" fill="var(--chick)" stroke="var(--chickline)" stroke-width="3.5"/>
  <path d="M20 78q-10 6-4 16q10-2 12-10" fill="var(--chick)" stroke="var(--chickline)" stroke-width="3" stroke-linejoin="round"/>
  <path d="M104 78q10 6 4 16q-10-2-12-10" fill="var(--chick)" stroke="var(--chickline)" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="62" cy="40" rx="42" ry="7" fill="var(--hat)" stroke="var(--chickline)" stroke-width="3"/>
  <path d="M36 40q2-26 26-26t26 26z" fill="var(--hat)" stroke="var(--chickline)" stroke-width="3" stroke-linejoin="round"/>
  <path d="M38 34h48" stroke="var(--oops)" stroke-width="5"/>
  <path d="M84 30q14-14 20-6q-8 0-14 10z" fill="var(--oops)" stroke="var(--chickline)" stroke-width="2" stroke-linejoin="round"/>
  ${eyes}
  <ellipse cx="38" cy="78" rx="7" ry="4.5" fill="var(--blush)"/><ellipse cx="86" cy="78" rx="7" ry="4.5" fill="var(--blush)"/>
  <path d="M56 74l6 8 6-8z" fill="var(--beak)" stroke="var(--chickline)" stroke-width="2" stroke-linejoin="round"/>
</svg>`;
}

const TEXAS_TRAIL = {
  key: 'bianca-texas-trail-v1',
  mascot: chickSVG,
  confetti: ['#1F74C9','#FFBE2E','#FF8FA4','#2B9A57','#8FD3FF'],
  confettiEmoji: '🐣',
  cheers: ['Egg-cellent!','Cluck yeah!','Egg-straordinary!','You’re a top explorer!','Peck-fect!','Chick-tastic!'],
  oops: ['Hmm, not quite.','Close, but not yet.','Pepita says check the map again.','Almost!'],
  report: {
    start: 'Ready when you are. Pepita has her map out.',
    great: 'Egg-cellent! You’re a true Texas history explorer.',
    good: 'Great work! Review the topics marked below and you’ll be ready.',
    keep: 'Good start! Go back to the trail stops for the topics below, then try again.'
  },
  tags: {
    explore: { name: 'European exploration', link: 'explorers' },
    skills: { name: 'Sources and map skills', link: 'explorers' },
    missions: { name: 'Missions and settlements', link: 'missions' },
    settlers: { name: 'Mexico and empresarios', link: 'settlers' },
    timeline: { name: 'Timeline and cause/effect', link: 'timeline' },
    vocab: { name: 'Vocabulary', link: 'words' }
  },
  sorters: {
    sources: {
      labels: ['Primary', 'Secondary'],
      items: [
        { e: '📓', t: 'A journal written by an explorer during his trip', a: 0, why: 'It was written at the time by someone who was there.' },
        { e: '📘', t: 'A social studies textbook written last year', a: 1, why: 'It was written much later to explain the past.' },
        { e: '🗺️', t: 'A map drawn during La Salle’s expedition', a: 0, why: 'It was made at the time of the event.' },
        { e: '💻', t: 'A website that summarizes the missions', a: 1, why: 'It explains the past later on.' },
        { e: '🏺', t: 'A clay pot made at a mission long ago', a: 0, why: 'Artifacts from the time are primary sources.' },
        { e: '🎓', t: 'A historian’s book about Coronado', a: 1, why: 'A historian studies and explains the past later.' }
      ]
    }
  },
  orderers: {
    eras: {
      items: ['European explorers travel through Texas', 'Spain builds missions and settlements', 'Mexico wins independence (1821)', 'Empresarios bring new settlers'],
      hint: 'Which happened earliest? Think about the trail stops.',
      done: 'Perfect order! Explorers came first, then missions, then Mexican independence, then empresarios.'
    }
  },
  questions: [
    { id: 't1', tag: 'explore', type: 'multi',
      q: 'Which TWO were reasons European countries explored Texas?',
      opts: ['To find wealth and trade', 'To build railroads', 'To compete with other countries', 'To visit family', 'To stop all trade'],
      answers: [0, 2], hint: 'Remember the three reasons: wealth and trade, competition, and expansion.',
      explain: '<p>Europeans explored for three big reasons:</p><ul><li><b>Wealth and trade</b> (economic opportunities)</li><li><b>Competition</b> with other countries</li><li><b>Expansion</b> of their power and land</li></ul><p>Railroads came much later, and explorers wanted <i>more</i> trade, not less.</p>' },
    { id: 't2', tag: 'explore', type: 'mc',
      q: 'Spain wanted to claim more and more land in the Americas. Which reason for exploring is that?',
      opts: ['Vacation', 'Farming', 'Expansion', 'Avoiding travel'],
      answer: 2, hint: 'Which word means getting bigger?',
      explain: '<p><b>Expansion</b> means growing bigger. When a country claims more land, it expands its power.</p>' },
    { id: 't3', tag: 'explore', type: 'sort',
      q: 'Which explorer matches each fact?',
      labels: ['Cabeza de Vaca', 'Coronado', 'La Salle'],
      items: [
        { t: 'Led a French expedition', a: 2 },
        { t: 'Reported about the land, animals, and people he met', a: 0 },
        { t: 'Traveled across the plains of Texas', a: 1 },
        { t: 'Established Fort St. Louis', a: 2 },
        { t: 'Reached Texas first, back in 1528', a: 0 }
      ],
      hint: 'Only one of them was French. Flip the explorer cards on the Learn page if you need help.',
      explain: '<ul><li><b>Cabeza de Vaca</b> was shipwrecked on the Texas coast in 1528, traveled through Texas, and reported on the land, animals, and people.</li><li><b>Coronado</b> crossed the plains and met American Indian groups.</li><li><b>La Salle</b> was French and built Fort St. Louis.</li></ul>' },
    { id: 't4', tag: 'skills', type: 'sort',
      q: 'Primary source or secondary source?',
      labels: ['Primary', 'Secondary'],
      items: [
        { t: 'A letter written by a soldier at Fort St. Louis', a: 0 },
        { t: 'An encyclopedia article about Spanish missions', a: 1 },
        { t: 'A diary kept by a settler in Austin’s Colony', a: 0 },
        { t: 'A video made this year about Coronado', a: 1 },
        { t: 'A tool found where a mission once stood', a: 0 }
      ],
      hint: 'Ask: was it made back then by someone who was there, or later to explain it?',
      explain: '<ul><li><b>Primary</b> (made at the time): the soldier’s letter, the settler’s diary, the tool (an artifact).</li><li><b>Secondary</b> (made later): the encyclopedia and this year’s video.</li></ul>' },
    { id: 't5', tag: 'skills', type: 'mc',
      q: 'How is a primary source different from a secondary source?',
      opts: ['A primary source is always a map.', 'A primary source comes from the time of the event or from someone who was there. A secondary source explains it later.', 'A secondary source is always false.', 'They are always made at the same time.'],
      answer: 1, hint: 'Think about when each one was made.',
      explain: '<p>A <b>primary</b> source is from the time, or from someone who experienced the event. A <b>secondary</b> source is made <b>later</b> to explain or study it. Both can be true and helpful.</p>' },
    { id: 't6', tag: 'skills', type: 'sort',
      q: 'Which map tool helps with each job?',
      labels: ['Compass rose', 'Legend', 'Scale'],
      items: [
        { t: 'Tells you which way is north', a: 0 },
        { t: 'Explains what the little fort symbol means', a: 1 },
        { t: 'Helps you guess how many miles it is between two missions', a: 2 },
        { t: 'Shows north, south, east, and west', a: 0 },
        { t: 'Lists all the symbols used on the map', a: 1 }
      ],
      hint: 'Compass rose = directions. Legend = symbols. Scale = distance.',
      explain: '<ul><li><b>Compass rose</b>: directions (N, S, E, W).</li><li><b>Legend</b>: what the symbols mean.</li><li><b>Scale</b>: about how far apart places are.</li></ul>' },
    { id: 't7', tag: 'missions', type: 'mc',
      q: 'What was one main purpose of the Spanish missions?',
      opts: ['To build modern highways', 'To write the Mexican Constitution', 'To start Austin’s Colony', 'To spread the Catholic faith and support Spanish settlement'],
      answer: 3, hint: 'Missions were religious settlements built by Spain.',
      explain: '<p>Spain built missions to <b>spread the Catholic faith</b> and to <b>support Spanish settlement</b> and power in Texas.</p>' },
    { id: 't8', tag: 'missions', type: 'mc',
      q: 'Which mission is recognized as the first mission established in Texas?',
      opts: ['Mission Ysleta', 'The Alamo', 'Fort St. Louis', 'Austin’s Colony'],
      answer: 0, hint: 'Fort St. Louis was French, and Austin’s Colony came much later.',
      explain: '<ul><li><b>Mission Ysleta</b> is recognized as the first mission in Texas.</li><li>The Alamo is a famous San Antonio mission, but it came later.</li><li>Fort St. Louis was a French fort, not a mission, and Austin’s Colony was a colony of settlers.</li></ul>' },
    { id: 't9', tag: 'missions', type: 'mc',
      q: 'Pepita is visiting the lower Rio Grande Valley. Which person helped set up settlements there?',
      opts: ['Francisco Coronado', 'La Salle', 'José de Escandón', 'Cabeza de Vaca'],
      answer: 2, hint: 'This person was not an explorer. He started settlements.',
      explain: '<p><b>José de Escandón</b> helped establish settlements in the lower Rio Grande Valley. The other three were explorers.</p>' },
    { id: 't10', tag: 'missions', type: 'multi',
      q: 'Why did settlements often grow near rivers? Pick TWO.',
      opts: ['Rivers stopped people from farming.', 'Water helped crops grow.', 'People did not need water.', 'Rivers could be used for travel.', 'Rivers were only used as borders.'],
      answers: [1, 3], hint: 'Remember: drinking, farming, animals, and travel.',
      explain: '<p>People need water for <b>drinking, farming, animals, and travel</b>. So water helping crops grow and rivers being used for travel are both reasons settlements grew near rivers.</p>' },
    { id: 't11', tag: 'missions', type: 'mc',
      q: 'Which example shows cultural interaction?',
      opts: ['Two groups lived far apart and never met.', 'Spanish settlers and American Indian peoples shared crops, animals, and knowledge.', 'Every tradition stayed exactly the same.', 'Only one group changed Texas.'],
      answer: 1, hint: 'Interaction means groups affecting each other.',
      explain: '<p><b>Cultural interaction</b> happens when groups meet and influence each other, like exchanging crops, animals, knowledge, and ways of doing things. That helped shape Texas culture.</p>' },
    { id: 't12', tag: 'settlers', type: 'mc',
      q: 'What happened in 1821 that changed settlement in Texas?',
      opts: ['Texas became a U.S. state.', 'France took over Mexico.', 'Spain became independent from Mexico.', 'Mexico won independence from Spain.'],
      answer: 3, hint: 'Who ruled Texas before 1821? Who ruled after?',
      explain: '<ol><li>Before 1821, Spain controlled Mexico and Texas.</li><li>In <b>1821, Mexico won independence from Spain</b>.</li><li>The new Mexican government made new rules that let empresarios bring settlers.</li></ol><p>Watch out for choice C. It flips the countries around.</p>' },
    { id: 't13', tag: 'settlers', type: 'mc',
      q: 'Martín De León was an empresario. What did that mean he did?',
      opts: ['He got permission to bring settlers to Texas and start a colony.', 'He led a French exploration.', 'He built every Spanish mission.', 'He drew the symbols on maps.'],
      answer: 0, hint: 'Empresarios had land grants.',
      explain: '<p>An <b>empresario</b> was given permission or a land grant to <b>bring settlers</b> to Texas and help start a colony. Martín De León founded Victoria, and Stephen F. Austin started Austin’s Colony.</p>' },
    { id: 't14', tag: 'settlers', type: 'mc',
      q: 'What was Stephen F. Austin known for?',
      opts: ['Founding Fort St. Louis', 'Bringing hundreds of families to Texas and setting up Austin’s Colony', 'Leading Coronado’s journey', 'Winning Mexico’s independence'],
      answer: 1, hint: 'He was an empresario.',
      explain: '<p>Stephen F. Austin was an empresario who brought <b>hundreds of Anglo-American families</b> to Texas and set up <b>Austin’s Colony</b>.</p>' },
    { id: 't15', tag: 'settlers', type: 'multi',
      q: 'Why did many families move to Austin’s Colony? Pick TWO.',
      opts: ['To get land to farm', 'To build airplanes', 'To work in modern oil refineries', 'To build a new life', 'To find the Alamo'],
      answers: [0, 3], hint: 'Settlers wanted land, farming, trade, and a new life.',
      explain: '<p>Settlers were often motivated by the chance to <b>get land, farm, trade, and build a new life</b>. Airplanes and modern oil refineries didn’t exist yet.</p>' },
    { id: 't16', tag: 'timeline', type: 'order',
      q: 'Put these events in order, from earliest to latest.',
      items: ['European explorers travel through Texas', 'Spain builds missions and settlements', 'Mexico wins independence from Spain', 'Stephen F. Austin brings families to his colony'],
      hint: 'Explorers came before anyone built missions. Austin came after Mexico was independent.',
      explain: '<ol><li><b>Exploration</b> came first.</li><li>Then Spain built <b>missions and settlements</b>.</li><li>Then <b>Mexico won independence</b> in 1821.</li><li>Then <b>empresarios</b> like Austin brought settlers.</li></ol>' },
    { id: 't17', tag: 'timeline', type: 'mc',
      q: 'La Salle built a French fort in Texas. What was one effect?',
      opts: ['Mexico became independent right away.', 'Spain felt more competition from France.', 'Austin’s Colony was founded the next day.', 'Spain left Texas forever.'],
      answer: 1, hint: 'Spain and France both wanted to claim land.',
      explain: '<ol><li><b>Cause:</b> France built Fort St. Louis in Texas.</li><li><b>Effect:</b> Spain felt more <b>competition</b> and worked harder to settle Texas, including building missions in East Texas.</li></ol>' },
    { id: 't18', tag: 'vocab', type: 'sort',
      q: 'Which word matches each meaning?',
      labels: ['Settlement', 'Colonial', 'Economy'],
      items: [
        { t: 'A place where people set up a community', a: 0 },
        { t: 'Related to a colony controlled by another country', a: 1 },
        { t: 'How people make, buy, sell, and use goods and services', a: 2 }
      ],
      hint: 'Buying and selling goes with money words.',
      explain: '<ul><li><b>Settlement</b>: a place where people set up a community.</li><li><b>Colonial</b>: related to a colony controlled by another country.</li><li><b>Economy</b>: how people make, buy, sell, and use goods and services.</li></ul>' },
    { id: 't19', tag: 'missions', type: 'write',
      q: 'Explain one way Spanish missions or settlements influenced the development of Texas. Include one specific example.',
      checklist: ['name a mission, a person, or a settlement?', 'explain how it changed Texas?', 'use a complete sentence?'],
      explain: '<p class="panel tint" style="margin:0">Spanish missions helped start communities in Texas. For example, the San Antonio missions, like the Alamo, brought Spanish settlers and American Indian peoples together. They traded crops, animals like cattle and horses, and ideas, and this helped shape Texas culture. Some of those places grew into the city of San Antonio.</p>' },
    { id: 't20', tag: 'settlers', type: 'write',
      q: 'Explain how Mexican independence and empresarios helped increase settlement in Texas. Include Stephen F. Austin or another empresario.',
      checklist: ['mention 1821 or Mexican independence?', 'explain what an empresario did?', 'name Stephen F. Austin or another empresario?'],
      explain: '<p class="panel tint" style="margin:0">In 1821, Mexico won independence from Spain, and the new government made rules that let empresarios bring settlers to Texas. An empresario got a land grant to start a colony. Stephen F. Austin brought hundreds of families to Austin’s Colony. They came to get land, farm, and build a new life, so more people settled in Texas.</p>' }
  ]
};

/* The Learn section's own interactives; bonus-quiz.js calls this from start(). */
function setupLearn(){
  const $ = s => document.querySelector(s);
  document.querySelectorAll('.pep').forEach(el => { el.innerHTML = chickSVG('happy'); });
  $('#walkerArt').innerHTML = chickSVG('happy').replace('<svg class="mascot" viewBox="0 0 124 124" aria-hidden="true">', '').replace('</svg>', '');
  const walker = $('#walker');
  walker.style.transform = 'translate(50px, 13px)';
  function goStop(g){
    const x = +g.dataset.x - 30, y = +g.dataset.y - 92;
    walker.style.transform = `translate(${x}px, ${y}px)`;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => { location.hash = g.dataset.go; const el = document.getElementById(g.dataset.go); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }, reduce ? 0 : 650);
  }
  document.querySelectorAll('.stop').forEach(g => {
    g.addEventListener('click', () => goStop(g));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goStop(g); } });
  });
  // map
  const info = {
    compass: '<b>Compass rose:</b> shows directions: north, south, east, and west. On this map, the fort is east of the mission.',
    legend: '<b>Legend:</b> explains what each map symbol means. Here it tells you which symbol is a mission, a fort, or a town.',
    scale: '<b>Scale:</b> helps you estimate distance. This whole bar stands for 50 miles.',
    symbols: '<b>Symbols:</b> little pictures that stand for real places, like the mission, the fort, and the town dot.'
  };
  function hl(p){
    document.querySelectorAll('.mpart').forEach(g => g.classList.toggle('hl', g.dataset.part === p));
    document.querySelectorAll('.mapbtns button').forEach(b => b.setAttribute('aria-pressed', b.dataset.part === p));
    $('#mapinfo').innerHTML = info[p];
  }
  document.querySelectorAll('.mapbtns button, .mpart').forEach(el => el.addEventListener('click', () => hl(el.dataset.part)));
}

TEXAS_TRAIL.setupLearn = setupLearn;

export default TEXAS_TRAIL;
