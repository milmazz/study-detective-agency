/*
  Question generators and content for the Lone Star Files (History Division).

  Built against Social Studies Unit 1, Concept 2 (the four physical regions of
  Texas: where they are, what they are like, and how geography shapes jobs and
  traditions) and Concept 3 (how Texans adapt to and modify the environment,
  and what those changes cost as well as give).

  The distinction Concept 3 turns on, and the one cases 06 and 07 drill:
    adapting  = people change what THEY do to fit the land
    modifying = people change the LAND to fit what they need

  Every question is a plain 'mcq-simple', so this game needs no question-type
  module of its own.

  Exports the config object DetectiveGame.start() takes. The page calls start();
  this file deliberately does not, so requiring it has no side effects.

*/
import DetectiveGame from './game-engine.js';
import QUESTION_KIT from './question-kit.js';

var TEXAS_QUESTIONS = (function(){
  "use strict";

  var DG = DetectiveGame;

  var KIT = QUESTION_KIT;

  var choice = DG.choice, shuffle = DG.shuffle;
  var authored = KIT.buildAuthoredOptions;
  var fromPool = KIT.buildOptionsFromPool;

  function brief(inner){
    return '<div class="brief-box"><p class="brief-label">Field Note</p>' + inner + '</div>';
  }
  function line(text){ return '<span class="q-line">' + text + '</span>'; }

  /* ================= THE FOUR REGIONS ================= */
  /*
    One list, used by three cases. Regions are named the same way every time --
    a kid who learns "Mountains and Basins" from one case should meet the same
    words in the next, not a synonym.
  */
  var REGION_POOL = [
    {key:'coastal', label:'The Coastal Plains'},
    {key:'northcentral', label:'The North Central Plains'},
    {key:'greatplains', label:'The Great Plains'},
    {key:'mountains', label:'The Mountains and Basins'}
  ];

  var REGION_ITEMS = [
    { text:'Low, flat land in the east and south that slopes gently down to the Gulf of Mexico. This region gets more rain than any other part of Texas.',
      correct:'coastal',
      explain:'Sloping down to the Gulf and getting the most rain are the two giveaways for the Coastal Plains — it is the only region that reaches the coast.' },
    { text:'The Piney Woods sit at the eastern edge of this region: thick pine forest, damp soil, and the tallest trees in Texas.',
      correct:'coastal',
      explain:'The Piney Woods are part of the Coastal Plains. Heavy rainfall near the Gulf is what lets a forest that thick grow there.' },
    { text:'Rolling prairie and low hills between the Coastal Plains and the Great Plains, with grass and scattered stands of oak and mesquite called the Cross Timbers.',
      correct:'northcentral',
      explain:'The Cross Timbers and rolling grassy prairie mark the North Central Plains — the region sandwiched between the Coastal Plains to the east and the Great Plains to the west.' },
    { text:'Grassland where huge cattle herds once gathered before being driven north, and where the land begins to climb as you travel west.',
      correct:'northcentral',
      explain:'The North Central Plains is cattle country — good grass, and the start of the climb from the low coast up toward the high plains.' },
    { text:'High, flat, nearly treeless land in the northwest called the Llano Estacado. Its eastern edge drops away suddenly at a cliff known as the Caprock.',
      correct:'greatplains',
      explain:'The Llano Estacado and the Caprock Escarpment both belong to the Great Plains — flat, high land that ends in a sudden step down.' },
    { text:'Wide, windy, open country where wind farms turn all day and Palo Duro Canyon cuts a deep gash into otherwise flat land.',
      correct:'greatplains',
      explain:'Palo Duro Canyon and steady wind are Great Plains features. The land is high and flat, which is exactly why the wind never stops.' },
    { text:'The driest region in Texas, out in the far west, where the Chihuahuan Desert spreads between rugged mountain ranges and low, flat basins.',
      correct:'mountains',
      explain:'Desert, mountain ranges, and the basins between them give the Mountains and Basins region both its look and its name.' },
    { text:'Guadalupe Peak, the highest point in Texas at 8,749 feet, rises in this region — and so does the Big Bend of the Rio Grande.',
      correct:'mountains',
      explain:'The highest land in Texas is in the Mountains and Basins region, in the far west corner where the Rio Grande makes its big bend.' }
  ];

  function genRegion(){
    var item = draws.region();
    return {
      type:'mcq-simple',
      prompt: brief(item.text) + line('Which physical region of Texas is being described?'),
      options: shuffle(REGION_POOL.slice()),
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 02: PLACES ON THE MAP ================= */
  var PLACE_ITEMS = [
    { text:'Houston — a huge city near the Gulf, joined to the open water by a dredged ship channel.',
      correct:'coastal',
      explain:'Houston sits on the Coastal Plains. Its port is only possible because the land there is low and flat all the way to the Gulf.' },
    { text:'Galveston — an island city with a long seawall between its streets and the waves.',
      correct:'coastal',
      explain:'Galveston is on the Coastal Plains, right where the region meets the Gulf of Mexico.' },
    { text:'San Antonio — a city built around a river and the missions along it, in the south of the state.',
      correct:'coastal',
      explain:'San Antonio is in the southern part of the Coastal Plains, on the inland edge of the region rather than at the water.' },
    { text:'Fort Worth — a city of stockyards and cattle pens at the eastern edge of prairie country.',
      correct:'northcentral',
      explain:'Fort Worth is in the North Central Plains, where the prairie grass that fed the cattle herds begins.' },
    { text:'Abilene — a town on the Rolling Plains, west of Fort Worth and east of the Caprock.',
      correct:'northcentral',
      explain:'Abilene is in the North Central Plains. The Rolling Plains are part of that region, stopping where the Caprock rises into the Great Plains.' },
    { text:'Amarillo — a windy city high on the flat plains of the northern Panhandle.',
      correct:'greatplains',
      explain:'Amarillo sits on the Great Plains, up on the high flat tableland of the Panhandle.' },
    { text:'Lubbock — a cotton-growing city on the Llano Estacado.',
      correct:'greatplains',
      explain:'Lubbock is on the Llano Estacado, which is part of the Great Plains region.' },
    { text:'El Paso — a desert city in the far western corner of Texas, across the river from Mexico.',
      correct:'mountains',
      explain:'El Paso is in the Mountains and Basins region, the dry far-west corner of the state.' },
    { text:'Big Bend National Park — desert, canyons, and the Chisos Mountains inside a great curve of the Rio Grande.',
      correct:'mountains',
      explain:'Big Bend is in the Mountains and Basins region — mountains rising straight out of desert basins.' }
  ];

  function genPlace(){
    var item = draws.place();
    return {
      type:'mcq-simple',
      prompt: brief(item.text) + line('Which region of Texas is this place in?'),
      options: shuffle(REGION_POOL.slice()),
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 03: COMPARING THE REGIONS ================= */
  var COMPARE_ITEMS = [
    { q:'Which region has the highest land in Texas?', correct:'mountains',
      explain:'The Mountains and Basins region holds Guadalupe Peak at 8,749 feet — the highest point in the state. The Great Plains are high too, but flat rather than mountainous.' },
    { q:'Which region gets the most rain in a normal year?', correct:'coastal',
      explain:'The Coastal Plains get the most rain. Moist air blows in off the Gulf of Mexico, and rainfall drops off steadily as you travel west across Texas.' },
    { q:'Which is the only region that touches the Gulf of Mexico?', correct:'coastal',
      explain:'Only the Coastal Plains reach the Gulf — that coastline is what gives the region its name, its ports, and its rain.' },
    { q:'Which region is the driest, with true desert across much of it?', correct:'mountains',
      explain:'The Mountains and Basins region is the driest. It is farthest from the Gulf, so very little moist air ever reaches it.' },
    { q:'Which region lies in between the Coastal Plains and the Great Plains?', correct:'northcentral',
      explain:'The North Central Plains sit in the middle — east of the Caprock and the Great Plains, west of the Coastal Plains.' },
    { q:'Which region ends at the Caprock Escarpment, a long cliff at its eastern edge?', correct:'greatplains',
      explain:'The Great Plains end at the Caprock. Standing at the bottom you are in the North Central Plains; climbing it puts you on the Great Plains.' },
    { q:'Which region covers the largest part of Texas and holds the most people?', correct:'coastal',
      explain:'The Coastal Plains cover more of Texas than any other region, and cities like Houston and San Antonio make it the most crowded one as well.' },
    { q:'Which region is known for the Cross Timbers — belts of oak and mesquite running through the prairie?', correct:'northcentral',
      explain:'The Cross Timbers run through the North Central Plains, breaking the open prairie up with strips of woodland.' }
  ];

  function genCompare(){
    var item = draws.compare();
    return {
      type:'mcq-simple',
      prompt: brief('Four regions are on the table: the Coastal Plains, the North Central Plains, the Great Plains, and the Mountains and Basins. One of them fits this description better than the others.') +
              line(item.q),
      options: shuffle(REGION_POOL.slice()),
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 04: GEOGRAPHY AND WORK ================= */
  var FEATURE_POOL = [
    {key:'coastline', label:'The Gulf coastline, its bays, and deep water nearby'},
    {key:'forest', label:'Thick pine forests in the east'},
    {key:'wind', label:'Flat, high, open land where the wind rarely stops'},
    {key:'desert', label:'Dry desert basins with room to spread out'},
    {key:'prairie', label:'Rolling prairie grass that cattle can graze'},
    {key:'valley', label:'Rich flat farmland and mild winters near the Rio Grande'},
    {key:'oil', label:'Oil and gas trapped in rock underground'}
  ];
  var WORK_ITEMS = [
    { text:'Shrimp boats leave the docks at Port Aransas before sunrise and come back heavy in the afternoon.',
      correct:'coastline',
      explain:'Shrimping needs salt water, bays, and a place to tie up — all of which the Gulf coastline gives the Coastal Plains.' },
    { text:'Sawmills near Lufkin cut pine logs into lumber and turn the leftover chips into paper.',
      correct:'forest',
      explain:'The Piney Woods of East Texas grow the trees, so the lumber and paper mills are built right there among them.' },
    { text:'Rows of white turbines turn day and night on the flat land outside Amarillo.',
      correct:'wind',
      explain:'Wind farms go where the wind is steady and the land is flat and open — which describes the Great Plains almost exactly.' },
    { text:'A rancher near Alpine runs cattle across many square miles of dry, rocky ground.',
      correct:'desert',
      explain:'Desert grass is thin, so a ranch out in the Mountains and Basins needs enormous acreage to feed the same herd a small East Texas pasture could.' },
    { text:'Growers in the Rio Grande Valley pick grapefruit and oranges in the middle of winter.',
      correct:'valley',
      explain:'The Valley has flat, rich soil and winters mild enough that citrus keeps growing while much of the country is frozen.' },
    { text:'Cargo ships steam up a dredged channel to unload containers at the Port of Houston.',
      correct:'coastline',
      explain:'A port needs the coast. Houston is inland, so the Coastal Plains had to be modified — a ship channel dredged deep enough for ocean ships.' },
    { text:'Pump jacks nod up and down across the Permian Basin, near Midland and Odessa.',
      correct:'oil',
      explain:'The work follows what is under the ground here, not what is on top of it — the Permian Basin holds some of the richest oil rock in the country.' },
    { text:'Cattle graze on prairie grass north of Fort Worth, where the old stockyards still stand.',
      correct:'prairie',
      explain:'Grass is the whole reason for the herds. The North Central Plains grow it well, which is why the stockyards ended up at Fort Worth.' }
  ];

  function genWork(){
    var item = draws.work();
    return {
      type:'mcq-simple',
      prompt: brief(item.text) + line('Which feature of the land makes this work possible?'),
      options: fromPool(FEATURE_POOL, item.correct, 4),
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 05: CUSTOMS AND CELEBRATIONS ================= */
  var ORIGIN_POOL = [
    {key:'mexican', label:'Mexican heritage in South and West Texas'},
    {key:'german', label:'German settlers in the Hill Country'},
    {key:'czech', label:'Czech settlers in Central Texas'},
    {key:'juneteenth', label:'The end of slavery in Texas, announced first at Galveston'},
    {key:'ranching', label:'Cattle ranching and the cowboy way of life'},
    {key:'fishing', label:'Fishing families along the Gulf Coast'}
  ];
  var CUSTOM_ITEMS = [
    { text:'A charreada in San Antonio: riders in wide hats work horses and cattle through roping events, judged on style as much as speed.',
      correct:'mexican',
      explain:'The charreada is the Mexican rodeo, brought north with Mexican ranching families. South Texas has held them for generations.' },
    { text:'Wurstfest in New Braunfels, where sausage, accordions, and polka dancing take over the town every November.',
      correct:'german',
      explain:'German families settled New Braunfels and the Hill Country in the 1840s. Wurstfest keeps their food and music going.' },
    { text:'Westfest in West, Texas: kolaches by the tray, polka bands, and dancing all Labor Day weekend.',
      correct:'czech',
      explain:'Czech settlers farmed the Blackland Prairie of Central Texas and brought the kolache with them. The town of West is still a centre for it.' },
    { text:'Parades, cookouts, and readings held across Texas every June 19.',
      correct:'juneteenth',
      explain:'Juneteenth began in Texas: on June 19, 1865, Union soldiers at Galveston announced that enslaved people in Texas were free. Texans have marked the date ever since.' },
    { text:'The Fort Worth Stock Show and Rodeo each January — bull riding, calf roping, and livestock judging.',
      correct:'ranching',
      explain:'Rodeo events grew out of the real work of ranch hands. Fort Worth, at the edge of cattle country, has held its stock show since 1896.' },
    { text:'The Blessing of the Fleet at Kemah, where decorated boats line up to be blessed before the season opens.',
      correct:'fishing',
      explain:'Gulf Coast fishing and shrimping families hold the Blessing of the Fleet to ask for a safe, full season — a custom that only makes sense where people work the water.' }
  ];

  function genCustom(){
    var item = draws.custom();
    return {
      type:'mcq-simple',
      prompt: brief(item.text) + line('Which part of Texas history or heritage does this celebration come from?'),
      options: fromPool(ORIGIN_POOL, item.correct, 4),
      correctKey: item.correct,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 06: ADAPT OR MODIFY ================= */
  /*
    Two of the four options name the right category and only one of those has
    the right reason, so a kid who guesses "modify" on sight still has to know
    WHY. Every option is authored per item for that reason.
  */
  var ADAPT_ITEMS = [
    { kind:'modify',
      text:'Farmers in the Rio Grande Valley dig canals that carry river water out to fields too dry to plant without it.',
      correct:'Modifying — they changed the land itself by digging canals to move water',
      distractors:[
        'Adapting — they changed their own habits to fit a dry climate',
        'Adapting — they moved to a wetter part of Texas to do their farming',
        'Modifying — they changed the weather so that more rain would fall'
      ],
      explain:'Digging a canal changes the land, which makes it modifying. Nothing about the climate changed — the water was simply moved to where the farmers needed it.' },
    { kind:'adapt',
      text:'Ranchers in West Texas work cattle in the early morning, then rest in the shade through the hottest hours of the afternoon.',
      correct:'Adapting — they changed their own schedule to fit the desert heat',
      distractors:[
        'Modifying — they changed the land to make the ranch cooler',
        'Modifying — they built shade over the whole of the ranch',
        'Adapting — they moved the ranch to the Coastal Plains to escape the heat'
      ],
      explain:'The desert stayed exactly as it was; the ranchers changed their own working hours to fit it. Changing what people do, rather than the land, is adapting.' },
    { kind:'modify',
      text:'A dam across the Colorado River holds back the water to make a lake, storing drinking water and catching floods before they reach the towns below.',
      correct:'Modifying — a dam changes the river and the land around it',
      distractors:[
        'Adapting — people changed how much water they use each day',
        'Adapting — people moved their homes away from the river bank',
        'Modifying — people changed how much rain falls into the river'
      ],
      explain:'A dam is one of the biggest modifications Texans make: the river stops running the way it did and a lake covers land that used to be dry.' },
    { kind:'modify',
      text:'After the hurricane of 1900, Galveston built a seawall along the beach and raised the level of the city behind it.',
      correct:'Modifying — the city changed its shoreline and the height of its own ground',
      distractors:[
        'Adapting — people learned to leave the island whenever a storm came',
        'Adapting — people built their houses out of stronger materials',
        'Modifying — the city changed the path that hurricanes take'
      ],
      explain:'Galveston physically rebuilt its shoreline and lifted the ground it stands on. That is modifying the environment — the storms themselves were never changed.' },
    { kind:'adapt',
      text:'Families along the Gulf Coast board up their windows and drive inland when a hurricane is forecast.',
      correct:'Adapting — they change what they do to stay safe during hurricane season',
      distractors:[
        'Modifying — they change the coastline so storms cannot reach them',
        'Modifying — they build a wall around every house on the coast',
        'Adapting — they stop the storm from coming ashore near their town'
      ],
      explain:'Boarding up and evacuating changes people’s behaviour, not the environment. Adapting is how Texans handle the parts of nature nobody can change.' },
    { kind:'modify',
      text:'Timber companies in the Piney Woods cut stands of pine for lumber and plant rows of seedlings in their place.',
      correct:'Modifying — cutting and replanting changes what grows on the land',
      distractors:[
        'Adapting — the companies changed which trees they use for lumber',
        'Adapting — workers changed the season in which they do the cutting',
        'Modifying — the companies changed the soil into a different type'
      ],
      explain:'Both the cutting and the replanting change the forest itself, so both are modifying — even though replanting is meant to repair some of the damage.' },
    { kind:'adapt',
      text:'High Plains farmers plant sorghum and cotton, crops that will grow on far less water than corn needs.',
      correct:'Adapting — they choose crops that fit a dry climate instead of trying to change it',
      distractors:[
        'Modifying — they changed the crops so that they need less rain',
        'Modifying — they changed the climate of the High Plains',
        'Adapting — they gave up farming and moved to the Coastal Plains'
      ],
      explain:'Choosing a crop that suits the rainfall is adapting: the farmer bends to the land. Irrigating that same field from a well would be modifying it instead.' },
    { kind:'modify',
      text:'Engineers blast and grade a route through the hills so a highway can carry trucks across West Texas.',
      correct:'Modifying — building a road cuts through and reshapes the land',
      distractors:[
        'Adapting — drivers changed the routes they take across the state',
        'Adapting — truck drivers learned to travel more slowly in the hills',
        'Modifying — engineers changed the size of the hills by adding soil'
      ],
      explain:'Blasting and grading physically reshape the ground, so a highway is a modification — one Texans make because the distances here are so long.' }
  ];

  function genAdapt(){
    var item = draws.adapt();
    var opts = authored(item.correct, item.distractors);
    return {
      type:'mcq-simple',
      prompt: brief(item.text) +
              line('Are the Texans in this example adapting to the environment or modifying it — and why?'),
      options: opts.options,
      correctKey: opts.correctKey,
      explain: function(){ return item.explain; }
    };
  }

  /* ================= CASE 07: EFFECTS, GOOD AND BAD ================= */
  /*
    The distractors are the SAME change's effects from the other column, so the
    question cannot be answered by spotting which option is about this change.
    The only way through is to decide whether each effect helps or costs.
  */
  var EFFECT_ITEMS = [
    { change:'Texans build a dam across a river to make a reservoir.',
      positives:[
        'A city has stored water to drink through a long dry summer',
        'Floodwater is held back before it reaches homes downstream',
        'The new lake gives families a place to fish, swim, and camp'
      ],
      negatives:[
        'Land, farms, and homes behind the dam disappear under the new lake',
        'Fish can no longer travel up and down the whole length of the river',
        'Less water and less silt reach the stretch of river below the dam'
      ],
      posExplain:'Water storage, flood control, and recreation are the reasons a dam gets built in the first place.',
      negExplain:'A dam gives a lake and takes a valley: the water rises over land people were using, and the river below is never quite the same.' },

    { change:'Timber companies clear part of the Piney Woods for lumber.',
      positives:[
        'Sawmills and paper mills give small East Texas towns steady work',
        'Lumber for building houses comes from close to home',
        'Cleared land can be replanted with a new crop of pine seedlings'
      ],
      negatives:[
        'Animals lose the older, taller forest they were living in',
        'Bare soil washes away downhill when heavy rain falls on it',
        'A replanted forest takes decades to grow tall again'
      ],
      posExplain:'Timber is one of East Texas’s oldest industries, and the jobs and lumber it provides are why the cutting happens.',
      negExplain:'Clearing a forest costs habitat and topsoil straight away, while the replacement trees take decades to catch up.' },

    { change:'High Plains farmers irrigate their fields with water pumped up from the Ogallala Aquifer.',
      positives:[
        'Crops grow on land that is far too dry to farm without watering',
        'Farms and the towns beside them have steady work all season',
        'Cattle feedlots nearby have grain grown close at hand'
      ],
      negatives:[
        'The underground water is being used faster than rain can refill it',
        'Wells have to be drilled deeper and deeper as the years pass',
        'Some fields have to be dropped altogether when the water runs short'
      ],
      posExplain:'Irrigation is what turned a dry stretch of the Great Plains into some of the most productive farmland in Texas.',
      negExplain:'The Ogallala refills far more slowly than it is pumped, so this modification borrows from water that will not be there later.' },

    { change:'Texas builds highways and bridges across the state.',
      positives:[
        'Crops and goods reach markets faster and more cheaply',
        'People can live in one town and work in another',
        'Ambulances and fire trucks reach places that used to be cut off'
      ],
      negatives:[
        'Roads cut animal habitats into separated pieces',
        'More traffic puts more exhaust into the air',
        'Paved ground sheds rainwater instead of soaking it up, adding to floods'
      ],
      posExplain:'Texas is enormous, and roads are what make its distances workable for goods, workers, and emergency help alike.',
      negExplain:'Every mile of pavement is habitat divided, air quality spent, and one more surface that rain runs off instead of soaking into.' },

    { change:'Companies drill for oil and gas across Texas.',
      positives:[
        'Drilling jobs and taxes on the wells help pay for schools and roads',
        'Fuel is produced for cars, trucks, and power plants',
        'Plastics and other useful materials are made from what comes up'
      ],
      negatives:[
        'A spill can poison soil, groundwater, and wildlife',
        'Burning the fuel adds pollution to the air',
        'A boom town can empty out once the wells stop producing'
      ],
      posExplain:'Oil and gas have paid for a great deal of Texas — schools, roads, and generations of jobs.',
      negExplain:'The costs land on the environment and on the towns themselves: spills and air pollution while the wells run, and empty streets once they stop.' },

    { change:'Wind farms are built across the open land of the Great Plains.',
      positives:[
        'Electricity is generated without burning any fuel',
        'Rent for the turbines gives ranchers a second income',
        'The wind supply will not run out the way an oil field does'
      ],
      negatives:[
        'Turbine blades can kill birds and bats that fly into them',
        'The turbines only make power while the wind is actually blowing',
        'Some neighbours think the towers spoil the view across open land'
      ],
      posExplain:'Clean power and rent cheques for ranchers are why West Texas has taken to wind so quickly.',
      negExplain:'Even a clean modification has costs — to the animals that fly through it, and to the people who liked the horizon the way it was.' }
  ];

  function genEffect(){
    var item = draws.effect();
    var wantPositive = choice([true, false]);
    var from = wantPositive ? item.positives : item.negatives;
    var against = wantPositive ? item.negatives : item.positives;
    var correct = choice(from);
    var opts = authored(correct, shuffle(against).slice(0, 3));
    return {
      type:'mcq-simple',
      prompt: brief(item.change) +
              line('Which of these is a ' +
                   (wantPositive ? '<strong>positive</strong>' : '<strong>negative</strong>') +
                   ' effect of this change?'),
      options: opts.options,
      correctKey: opts.correctKey,
      explain: function(){
        return wantPositive
          ? item.posExplain + ' The same change has costs too — that is what the other three answers were.'
          : item.negExplain + ' The other three answers were the benefits, which is why Texans do it anyway.';
      }
    };
  }

  /* ================= DRAWING ================= */
  var draws = KIT.drawers({
    region: REGION_ITEMS,
    place: PLACE_ITEMS,
    compare: COMPARE_ITEMS,
    work: WORK_ITEMS,
    custom: CUSTOM_ITEMS,
    adapt: ADAPT_ITEMS,
    effect: EFFECT_ITEMS
  });

  /* ================= MODE CONFIG ================= */
  var MODES = [
    { id:'region', caseNo:'01', title:'Name That Region', icon:'🏞️',
      blurb:'Four physical regions of Texas. Match the land, the weather, and the plants to the right one.', gen: genRegion },
    { id:'place', caseNo:'02', title:'Pin It on the Map', icon:'📍',
      blurb:'Cities, parks, and landmarks — work out which region each one sits in.', gen: genPlace },
    { id:'compare', caseNo:'03', title:'Region Face-Off', icon:'⚖️',
      blurb:'Highest, driest, wettest, flattest — compare the four regions against each other.', gen: genCompare },
    { id:'work', caseNo:'04', title:'The Land Sets the Job', icon:'🚜',
      blurb:'Shrimping, timber, wind, oil, ranching. Find the feature of the land behind each job.', gen: genWork },
    { id:'custom', caseNo:'05', title:'Traditions of Texas', icon:'🎉',
      blurb:'Celebrations across Texas and the people and history each one comes from.', gen: genCustom },
    { id:'adapt', caseNo:'06', title:'Adapt or Modify?', icon:'🛠️',
      blurb:'Did Texans change what they do, or change the land itself? Say which, and why.', gen: genAdapt },
    { id:'effect', caseNo:'07', title:'Every Change Has Two Sides', icon:'🌗',
      blurb:'Dams, timber, irrigation, roads, oil, wind — sort the benefits from the costs.', gen: genEffect }
  ];

  return {
    modes: MODES,
    homeIntro: 'Seven case files on the four regions of Texas and the ways Texans work with the land they live on. Every case deals a fresh clue, so you can reopen a file as many times as you need.',
    trailAllFilesWord: 'seven',
    trailTitle: 'The Trail — Cross the State',
    // Six, not the default eight: the smallest item pool here holds six, and a
    // case must not be able to deal the same clue twice.
    questionsPerCase: 6,
    onCaseStart: draws.resetAll,
    // Exported for the tests: the four regions are the vocabulary three of
    // these cases score against, and a fifth key would be a typo, not a region.
    regionKeys: REGION_POOL.map(function(r){ return r.key; })
  };
})();

export default TEXAS_QUESTIONS;
