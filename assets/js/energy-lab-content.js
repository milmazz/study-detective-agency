/*
  Content for games/science/energy-lab.html (bonus page, cat theme).
  Source: the Energy Unit Test Study Guide -- TEKS 4.8A (energy transfer),
  4.8B (conductors and insulators), 4.8C (circuits and energy changes).
  Questions are hand-written and fixed (no generators); answer keys are
  checked by test/bonus-pages.test.js.
*/
export function catSVG(mood){
  const eyes = mood === 'happy'
    ? '<path d="M38 60q7-8 14 0M68 60q7-8 14 0" stroke="var(--catline)" stroke-width="4" fill="none" stroke-linecap="round"/>'
    : mood === 'think'
    ? '<circle cx="47" cy="58" r="6" fill="var(--catline)"/><circle cx="77" cy="58" r="6" fill="var(--catline)"/><circle cx="49" cy="56" r="2" fill="#fff"/><circle cx="79" cy="56" r="2" fill="#fff"/><path d="M104 30q5 8 0 12q-5-4 0-12z" fill="#8FD3FF"/>'
    : '<circle cx="45" cy="60" r="6.5" fill="var(--catline)"/><circle cx="75" cy="60" r="6.5" fill="var(--catline)"/><circle cx="47" cy="58" r="2.2" fill="#fff"/><circle cx="77" cy="58" r="2.2" fill="#fff"/>';
  const mouth = mood === 'think' ? '<path d="M55 78q5-3 10 0" stroke="var(--catline)" stroke-width="3" fill="none" stroke-linecap="round"/>'
    : '<path d="M52 74q4 5 8 0q4 5 8 0" stroke="var(--catline)" stroke-width="3" fill="none" stroke-linecap="round"/>';
  return `<svg class="mascot" viewBox="0 0 120 110" aria-hidden="true">
  <path d="M20 46L26 8L52 30Z" fill="var(--cat)" stroke="var(--catline)" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M100 46L94 8L68 30Z" fill="var(--cat)" stroke="var(--catline)" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M28 36L30 18L44 30Z" fill="var(--earin)"/><path d="M92 36L90 18L76 30Z" fill="var(--earin)"/>
  <ellipse cx="60" cy="64" rx="48" ry="39" fill="var(--cat)" stroke="var(--catline)" stroke-width="3.5"/>
  <path d="M63 28l-8 12h7l-5 11 11-14h-7l5-9z" fill="var(--pop)" stroke="var(--catline)" stroke-width="1.5" stroke-linejoin="round"/>
  ${eyes}
  <ellipse cx="33" cy="74" rx="8" ry="5" fill="var(--blush)"/><ellipse cx="87" cy="74" rx="8" ry="5" fill="var(--blush)"/>
  <path d="M58 68h4l-2 3z" fill="var(--catline)"/>
  ${mouth}
  <g stroke="var(--catline)" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="64" x2="22" y2="68"/><line x1="4" y1="76" x2="22" y2="74"/><line x1="116" y1="64" x2="98" y2="68"/><line x1="116" y1="76" x2="98" y2="74"/></g>
</svg>`;
}

const ENERGY_LAB = {
  key: 'bianca-energy-lab-v1',
  mascot: catSVG,
  confetti: ['#6E43F0','#FFC531','#FF8FB1','#4FCB9F','#8FD3FF'],
  confettiEmoji: '⚡',
  cheers: ['Purr-fect!','Paw-some!','You’re electric!','Meow-velous!','Shocking good work!','Bright idea!'],
  oops: ['Hmm, not quite.','Close, but not yet.','Mochi thinks you can fix this.','Almost!'],
  report: {
    start: 'Ready when you are. Mochi is waiting with a lightbulb.',
    great: 'You’re fully charged! You really know your energy.',
    good: 'Great work! Review the topics marked below and you’ll be glowing.',
    keep: 'Good start! Go back to the Learn page for the topics below, then try again.'
  },
  tags: {
    transfer: { name: 'Energy transfer', link: 'motion' },
    materials: { name: 'Conductors and insulators', link: 'materials' },
    circuits: { name: 'Open and closed circuits', link: 'circuits' },
    changes: { name: 'Energy changes', link: 'circuits' }
  },
  sorters: {
    materials: {
      labels: ['⚡ Conductor', '🧤 Insulator'],
      items: [
        { e: '🪙', t: 'Copper wire', a: 0, why: 'Copper is a metal, and metals are conductors.' },
        { e: '👢', t: 'Rubber boots', a: 1, why: 'Rubber is an insulator.' },
        { e: '🥄', t: 'Wooden spoon', a: 1, why: 'Wood is an insulator, so the spoon doesn’t get hot fast.' },
        { e: '🔩', t: 'Iron nail', a: 0, why: 'Iron is a metal, so it’s a conductor.' },
        { e: '🥤', t: 'Plastic straw', a: 1, why: 'Plastic is an insulator.' },
        { e: '🌯', t: 'Aluminum foil', a: 0, why: 'Aluminum is a metal, so it’s a conductor.' },
        { e: '🧣', t: 'Cloth scarf', a: 1, why: 'Cloth is an insulator. It keeps your warmth in.' },
        { e: '🍳', t: 'Steel frying pan', a: 0, why: 'Steel is a metal, so heat moves through it quickly.' }
      ]
    }
  },
  orderers: {},
  questions: [
    { id: 'e1', tag: 'transfer', type: 'mc',
      q: 'Mochi bats a yarn ball. It rolls across the floor and bumps a toy mouse, and the mouse slides away. What happened to the energy?',
      opts: ['The energy disappeared when the yarn ball stopped.', 'The toy mouse made its own energy.', 'The yarn ball transferred its motion energy to the toy mouse.', 'The yarn ball turned all its energy into light.'],
      answer: 2, hint: 'Energy doesn’t disappear. Where did it go?',
      explain: '<ol><li>The rolling yarn ball has <b>mechanical (motion) energy</b>.</li><li>When it bumps the mouse, that energy <b>moves into</b> the mouse.</li><li>Now the mouse moves. That’s an <b>energy transfer</b>.</li></ol>' },
    { id: 'e2', tag: 'transfer', type: 'mc',
      q: 'A radio is playing music in the kitchen. What kind of energy travels from the radio to your ears?',
      opts: ['Thermal energy', 'Mechanical energy', 'Light energy', 'Sound energy'],
      answer: 3, hint: 'What do your ears sense?',
      explain: '<ol><li>Your ears hear sound.</li><li>The radio speaker <b>vibrates</b> and makes the air vibrate.</li><li>Those vibrations carry <b>sound energy</b> to your ears.</li></ol>' },
    { id: 'e3', tag: 'transfer', type: 'mc',
      q: 'Sound is made when something…',
      opts: ['vibrates', 'melts', 'freezes', 'stops moving'],
      answer: 0, hint: 'Think about the guitar string you plucked.',
      explain: '<p>Sound happens when something <b>vibrates</b>, which means it shakes back and forth very fast. A plucked guitar string vibrates, and the vibrations move through the air to your ears.</p>' },
    { id: 'e4', tag: 'transfer', type: 'multi',
      q: 'Which TWO show energy moving through water as waves?',
      opts: ['Mochi’s water bowl sitting still on the floor', 'Dropping a rock into a pond and seeing ripples', 'An ice cube sitting in the freezer', 'Splashing in the bathtub and making waves', 'A closed bottle of water on a shelf'],
      answers: [1, 3], hint: 'Look for water that is moving because something added energy.',
      explain: '<ol><li>A rock dropping into a pond gives energy to the water. The <b>ripples</b> are that energy spreading out.</li><li>Splashing in the tub gives energy to the water too, so <b>waves</b> move across it.</li><li>Still water, ice in a freezer, and a closed bottle aren’t making waves.</li></ol>' },
    { id: 'e5', tag: 'materials', type: 'sort',
      q: 'Is each one a conductor or an insulator?',
      labels: ['Conductor', 'Insulator'],
      items: [
        { t: 'Copper wire', a: 0 }, { t: 'Rubber gloves', a: 1 }, { t: 'Aluminum can', a: 0 },
        { t: 'Wooden ruler', a: 1 }, { t: 'Iron key', a: 0 }, { t: 'Wool mittens', a: 1 }
      ],
      hint: 'Metals are conductors. Rubber, plastic, wood, and cloth are insulators.',
      explain: '<ul><li><b>Conductors</b> (metals): copper wire, aluminum can, iron key.</li><li><b>Insulators</b>: rubber gloves, wooden ruler, wool mittens (cloth).</li></ul><p>Trick to remember: if it’s <b>metal</b>, it’s a conductor.</p>' },
    { id: 'e6', tag: 'materials', type: 'mc',
      q: 'Is metal a conductor or an insulator?',
      opts: ['An insulator, because it stops heat', 'A conductor, because heat and electricity pass through it easily', 'Neither, because metal has no energy', 'An insulator, because it is hard'],
      answer: 1, hint: 'What are electric wires made of inside?',
      explain: '<p>Metal is a <b>conductor</b>. Heat and electricity move through it easily. That’s why wires are metal inside and pots are metal on the bottom.</p>' },
    { id: 'e7', tag: 'materials', type: 'mc',
      q: 'Why are electric wires covered in plastic?',
      opts: ['Plastic makes electricity flow faster.', 'Plastic is a conductor, so it carries the electricity.', 'Plastic is an insulator, so it keeps electricity in the wire and keeps people safe.', 'Plastic makes the wire heavier.'],
      answer: 2, hint: 'Is plastic a conductor or an insulator?',
      explain: '<ol><li>The <b>metal</b> inside the wire is a conductor, so electricity flows through it.</li><li>The <b>plastic</b> outside is an insulator, so electricity doesn’t get out.</li><li>That keeps your hands safe when you touch the cord.</li></ol>' },
    { id: 'e8', tag: 'materials', type: 'mc',
      q: 'Chef Mochi’s soup pot has a metal bottom and a plastic handle. Why?',
      opts: ['The metal is a conductor to heat the soup quickly, and the plastic is an insulator so Mochi’s paw doesn’t get burned.', 'Both parts are insulators, so the pot stays cold.', 'Both parts are conductors, so the handle gets hot fast.', 'The plastic heats the soup, and the metal protects Mochi’s paw.'],
      answer: 0, hint: 'Which part should get hot, and which part should stay cool?',
      explain: '<ul><li><b>Metal bottom = conductor.</b> Heat moves quickly from the stove into the soup.</li><li><b>Plastic handle = insulator.</b> Heat moves slowly, so the handle stays safe to hold.</li></ul>' },
    { id: 'e9', tag: 'circuits', type: 'mc',
      q: 'What happens when there is a break in a circuit?',
      opts: ['The circuit becomes closed and the bulb gets brighter.', 'The circuit is open, so electricity can’t flow and the bulb turns off.', 'Electricity jumps across the gap.', 'The battery makes more energy.'],
      answer: 1, hint: 'A break is a gap. Can electricity cross a gap?',
      explain: '<ol><li>A break means there is a <b>gap</b> in the path.</li><li>A path with a gap is an <b>open circuit</b>.</li><li>Electricity can’t flow, so the bulb, buzzer, or fan stops working.</li></ol>' },
    { id: 'e10', tag: 'circuits', type: 'sort',
      q: 'Open circuit or closed circuit?',
      labels: ['Open', 'Closed'],
      items: [
        { t: 'The switch is on and the bulb glows.', a: 1 },
        { t: 'A wire came loose from the battery.', a: 0 },
        { t: 'The toy fan is spinning.', a: 1 },
        { t: 'There’s a gap between two wires.', a: 0 },
        { t: 'The buzzer is quiet because the switch is off.', a: 0 }
      ],
      hint: 'If something is working, electricity is flowing. If there’s a gap, it isn’t.',
      explain: '<ul><li><b>Closed</b> (no gaps, it works): the bulb glows, the fan spins.</li><li><b>Open</b> (a gap, it doesn’t work): the loose wire, the gap between wires, the switch turned off.</li></ul><p>A switch that is off makes a gap on purpose.</p>' },
    { id: 'e11', tag: 'circuits', type: 'mc',
      q: 'Mochi builds a circuit with a battery, wires, and a toy fan. There is one gap left, and Mochi fills it with a wooden stick. Will the fan spin?',
      opts: ['No. Wood is an insulator, so the circuit is still open.', 'Yes. Wood is a conductor.', 'Yes. Any object can close a gap.', 'No. Fans only work with buzzers.'],
      answer: 0, hint: 'Is wood a conductor or an insulator?',
      explain: '<ol><li>Wood is an <b>insulator</b>, so electricity can’t pass through it.</li><li>That means there is still a gap for electricity, and the circuit is <b>open</b>.</li><li>To close it, Mochi needs a <b>conductor</b>, like a metal paper clip.</li></ol>' },
    { id: 'e12', tag: 'changes', type: 'sort',
      q: 'What does each one change electrical energy into?',
      labels: ['Light + thermal', 'Sound', 'Mechanical'],
      items: [
        { t: 'Light bulb', a: 0 }, { t: 'Buzzer', a: 1 }, { t: 'Electric fan', a: 2 },
        { t: 'Doorbell', a: 1 }, { t: 'Flashlight', a: 0 }, { t: 'Electric mixer', a: 2 }
      ],
      hint: 'Does it glow, make noise, or move?',
      explain: '<ul><li><b>Glows</b> (light and thermal): light bulb, flashlight. Bulbs also get warm.</li><li><b>Makes noise</b> (sound): buzzer, doorbell.</li><li><b>Moves</b> (mechanical): fan, mixer.</li></ul>' },
    { id: 'e13', tag: 'changes', type: 'multi',
      q: 'A light bulb is on in a closed circuit. Which TWO statements are true?',
      opts: ['The bulb changes electrical energy into sound energy.', 'The bulb changes electrical energy into light energy.', 'The bulb needs an open circuit to work.', 'The bulb changes electrical energy into thermal energy, so it feels warm.', 'The bulb stops all the electricity forever.'],
      answers: [1, 3], hint: 'What can you see from a bulb, and what can you feel if you hold your hand near it?',
      explain: '<ol><li>You can <b>see</b> the bulb glow, so it makes <b>light energy</b>.</li><li>A bulb gets <b>warm</b>, so it also makes <b>thermal energy</b>.</li><li>Bulbs need a <b>closed</b> circuit, and they don’t make sound.</li></ol>' },
    { id: 'e14', tag: 'changes', type: 'order',
      q: 'Put the energy story of a flashlight in order.',
      items: ['The battery stores energy.', 'The switch closes the circuit.', 'Electrical energy flows through the wires.', 'The bulb changes it into light and thermal energy.', 'Light reaches Mochi’s eyes.'],
      hint: 'Start where the energy is stored. End where it is used.',
      explain: '<ol><li>The <b>battery</b> is the energy source.</li><li>Closing the <b>switch</b> makes the path complete.</li><li>Electricity flows through the <b>wires</b>.</li><li>The <b>bulb</b> changes electrical energy into light and thermal energy.</li><li>The light travels to your <b>eyes</b>.</li></ol>' },
    { id: 'e15', tag: 'transfer', type: 'multi',
      q: 'How do you know energy has transferred? Pick TWO clues.',
      opts: ['A bell starts ringing after Mochi taps it.', 'A rock sits still on the ground all day.', 'A cold metal spoon gets warm in hot soup.', 'A book stays closed on a shelf.', 'Nothing changes at all.'],
      answers: [0, 2], hint: 'Look for something that starts moving, makes sound, gets warmer, or gives off light.',
      explain: '<p>When energy transfers, you can notice a <b>change</b>: something moves, makes a sound, gets warmer, or gives off light.</p><ul><li>The bell <b>rings</b>: energy from the tap became sound.</li><li>The spoon <b>gets warm</b>: thermal energy moved from the soup into the metal.</li></ul>' },
    { id: 'e16', tag: 'materials', type: 'sort',
      q: 'True or false?',
      labels: ['True', 'False'],
      items: [
        { t: 'Energy can disappear forever.', a: 1 },
        { t: 'Energy can change from one form to another.', a: 0 },
        { t: 'Rubber is a good conductor.', a: 1 },
        { t: 'A closed circuit has no gaps.', a: 0 }
      ],
      hint: 'Remember what Mochi said: energy moves or changes.',
      explain: '<ul><li>Energy <b>doesn’t disappear</b>. It moves or changes form. (False, then True)</li><li>Rubber is an <b>insulator</b>, not a conductor. (False)</li><li>A closed circuit is a complete path with <b>no gaps</b>. (True)</li></ul>' },
    { id: 'e17', tag: 'changes', type: 'write',
      q: 'Explain how energy changes when you turn on an electric fan. Use the words <i>electrical</i>, <i>mechanical</i>, and <i>closed circuit</i>.',
      checklist: ['say what kind of energy goes into the fan?', 'say what kind of energy comes out?', 'explain why the circuit has to be closed?'],
      explain: '<p class="panel tint" style="margin:0">When I turn on the fan, the switch makes a <b>closed circuit</b>, so electricity can flow. The fan’s motor changes <b>electrical energy</b> into <b>mechanical energy</b>, and the blades spin and move the air.</p>' }
  ]
};

/* The Learn section's own interactives; bonus-quiz.js calls this from start(). */
function setupLearn(){
  const $ = s => document.querySelector(s);
  $('#heroCat').innerHTML = catSVG('idle');
  $('#remCat').innerHTML = catSVG('happy');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let AC = null;
  function tone(freq, dur, type){
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain();
      o.type = type || 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(.12, AC.currentTime); g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + dur);
      o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + dur); } catch (e) {}
  }
  // hero lamp
  const lamp = $('#lamp'), lb = $('#lampbtn');
  lb.addEventListener('click', () => {
    const on = !lamp.classList.contains('lit');
    lamp.classList.toggle('lit', on); lb.setAttribute('aria-pressed', on);
    lb.textContent = on ? 'Turn off the light' : 'Turn on the light';
    $('#heroCat').innerHTML = catSVG(on ? 'happy' : 'idle');
    $('#lampnote').textContent = on ? 'Closed circuit! Electrical energy is changing into light and thermal energy.' : 'Open circuit. The switch made a gap, so the light is off.';
  });
  // demos
  function demo(id, cls, before, after, ms, sound){
    const el = $(id), btn = el.querySelector('button'), cap = el.querySelector('.cap');
    btn.addEventListener('click', () => {
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      if (sound) sound();
      setTimeout(() => { cap.innerHTML = after; }, reduce ? 0 : ms);
    });
  }
  const ball = $('#demoBall'), ballBtn = ball.querySelector('button');
  ballBtn.addEventListener('click', () => {
    if (ball.classList.contains('go')) { ball.classList.remove('go'); ballBtn.textContent = 'Roll it'; return; }
    ball.classList.add('go'); ballBtn.textContent = 'Reset';
    setTimeout(() => ball.querySelector('.cap').innerHTML = 'The purple ball <b>transferred</b> its motion energy to the yellow ball, so the yellow ball started moving.', reduce ? 0 : 1000);
  });
  demo('#demoPond', 'plop', '', 'The pebble’s energy moved into the water and spread out as <b>ripples</b>. Waves carry energy through water.', 900);
  demo('#demoGuitar', 'buzz', '', 'The string <b>vibrated</b>. The vibrations moved through the air to your ears as <b>sound energy</b>.', 500, () => tone(196, .9, 'triangle'));
  // circuit
  const C = $('#circuit'), sw = $('#swbtn'), st = $('#cstatus');
  let closed = false, rec = 'bulb';
  const info = {
    bulb: ['bulb', 'light and thermal energy', 'The bulb glows and gets warm.'],
    buzzer: ['buzzer', 'sound energy', 'The buzzer buzzes.'],
    fan: ['fan', 'mechanical energy', 'The fan spins.']
  };
  function draw(){
    C.classList.toggle('closed', closed); C.classList.toggle('open', !closed);
    C.querySelectorAll('.recv').forEach(g => g.classList.toggle('show', g.dataset.r === rec));
    C.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.r === rec));
    sw.textContent = closed ? 'Open the switch' : 'Close the switch'; sw.setAttribute('aria-pressed', closed);
    const [n, e, s] = info[rec];
    st.innerHTML = closed
      ? `<b>Closed circuit.</b> No gaps, so electricity flows. ${s}<br><span class="change">electrical → ${e}</span>`
      : `<b>Open circuit.</b> The switch makes a gap, so electricity can’t flow. The ${n} is off.`;
  }
  sw.addEventListener('click', () => { closed = !closed; draw(); if (closed && rec === 'buzzer') tone(520, .35, 'square'); });
  C.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => { rec = b.dataset.r; draw(); if (closed && rec === 'buzzer') tone(520, .35, 'square'); }));
  draw();
}

ENERGY_LAB.setupLearn = setupLearn;

export default ENERGY_LAB;
