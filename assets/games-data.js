/*
  GAMES DATA
  ----------
  This is the only file you need to touch to add a new game to the site.
  Drop the new game's HTML file into games/<subject>/, then add one entry
  below. The homepage (index.html) reads this file and rebuilds the
  category sections and "recently added" row automatically.

  subject must be one of: 'math', 'ela', 'social-studies'
  dateAdded should be 'YYYY-MM-DD' so sorting works correctly.
*/
window.GAMES_DATA = [
  {
    id: 'numeration-detective-agency',
    title: 'Numbers Division: The Numeration Files',
    subject: 'math',
    icon: '🔢',
    blurb: 'Place value, expanded form, comparing, ordering, and rounding — seven cases, plus a mixed-skill trail.',
    url: 'games/math/numeration-detective-agency',
    dateAdded: '2026-08-20',
    grade: 4
  },
  {
    id: 'words-division',
    title: 'Words Division: Author\u2019s Craft',
    subject: 'ela',
    icon: '📖',
    blurb: 'Author\u2019s purpose, central message, figurative language, and why authors format text the way they do.',
    url: 'games/ela/words-division',
    dateAdded: '2026-08-24',
    grade: 4
  }
];

window.SUBJECTS = [
  { id:'math', label:'Numbers Division', shortLabel:'Math', icon:'🔢',
    desc:'Place value, operations, and working with numbers.' },
  { id:'ela', label:'Words Division', shortLabel:'ELA', icon:'📖',
    desc:'Reading closely and figuring out what authors are really doing.' },
  { id:'social-studies', label:'History Division', shortLabel:'Social Studies', icon:'🏛️',
    desc:'Coming soon.' }
];
