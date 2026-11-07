"""Pepita's Texas Trail video: spoken lines and pauses, in order (see script.md).

Each entry is ("pause", seconds, scene) or (id, speaker, text, scene).
A leading [tag] is an eleven_v3 audio tag: spoken-only, stripped from captions.
"""

P, D = "pepita", "dilly"

SCRIPT = [
    # 1: On the trail
    ("pause", 1.6, 1),
    ("a1", P, "[cheerful] Howdy, explorers! I'm Pepita, and today we're hiking the trail of early Texas history, from the first European explorers all the way to Austin's Colony.", 1),
    ("pause", 1.0, 1),
    ("b1", D, "[excited] And I'm Dilly! Watch me roll into a ball!", 1),
    ("pause", 1.8, 1),
    ("a2", P, "[gently] Dilly, Texas armadillos can't actually roll up.", 1),
    ("b2", D, "[sheepishly] ...I'm working on it.", 1),
    ("pause", 2.6, 1),

    # 2: European explorers
    ("a3", P, "Stop one: European explorers. Why did countries like Spain and France send explorers? Three big reasons.", 2),
    ("a4", P, "Wealth and trade, because they wanted riches and new things to trade. Competition, because they were racing each other. And expansion, because they wanted more land and more power.", 2),
    ("pause", 1.0, 2),
    ("a5", P, "Cabeza de Vaca was shipwrecked on the Texas coast in 1528. He traveled through Texas for years and reported on the land, the animals, and the American Indian peoples he met.", 2),
    ("pause", 0.5, 2),
    ("a6", P, "Francisco Coronado crossed the plains of Texas in the 1540s. He met American Indian groups, and his journey gave Spain information about the region.", 2),
    ("pause", 0.5, 2),
    ("a7", P, "And La Salle led an expedition that built Fort St. Louis in Texas in 1685.", 2),
    ("b3", D, "[confidently] Another Spanish explorer!", 2),
    ("a8", P, "Nope, La Salle was French! And a French fort in Texas made Spain worried, so the competition between France and Spain grew.", 2),
    ("pause", 1.2, 2),

    # 3: Sources and maps
    ("a9", P, "How do we know all this? From sources. A primary source was made at the time, by someone who was there, like a journal, a letter, a map drawn on the trip, or an artifact.", 3),
    ("a10", P, "A secondary source was made later to explain the past, like a textbook or a history website.", 3),
    ("pause", 0.8, 3),
    ("b4", D, "[proudly] My textbook is super old, so it's a primary source!", 3),
    ("a11", P, "Old doesn't make it primary, Dilly. Was it written by someone who was there? No? Then it's secondary.", 3),
    ("pause", 1.0, 3),
    ("a12", P, "And when you read a map, remember: the compass rose shows directions, the legend explains the symbols, and the scale helps you figure out distance.", 3),
    ("pause", 1.2, 3),

    # 4: Spanish missions
    ("a13", P, "Stop two: Spanish missions. A mission was a religious settlement. Spain built missions to spread the Catholic faith and to support Spanish settlement and power in Texas.", 4),
    ("a14", P, "Back then, Texas was part of a colony controlled by Spain. That's what colonial means.", 4),
    ("pause", 0.5, 4),
    ("a15", P, "Mission Ysleta, near El Paso, is recognized as the first mission in Texas. The San Antonio missions, including the Alamo, are important historic landmarks.", 4),
    ("a16", P, "And José de Escandón helped set up settlements in the lower Rio Grande Valley.", 4),
    ("pause", 0.7, 4),
    ("a17", P, "Notice how settlements grew near rivers? People needed water for drinking, farming, animals, and travel.", 4),
    ("pause", 0.7, 4),
    ("a18", P, "When Spanish settlers and American Indian peoples met, they influenced each other. They exchanged knowledge, crops, animals, and ways of doing things. That's cultural interaction, and it helped shape Texas culture.", 4),
    ("a19", P, "But not everyone experienced the missions the same way. Some people came for food and protection, and others did not want to change their way of life.", 4),
    ("pause", 1.2, 4),

    # 5: Mexico and the empresarios
    ("a20", P, "Stop three! In 1821, Mexico won its independence from Spain. Texas was now part of Mexico, and the new government made new rules about who could settle there.", 5),
    ("b5", D, "[excited] Oh, I know this one! Spain became independent from Mexico!", 5),
    ("a21", P, "[laughing] Other way around, Dilly! Mexico became independent from Spain.", 5),
    ("pause", 0.7, 5),
    ("a22", P, "Mexico let empresarios bring settlers. An empresario was a person given permission, or a land grant, to bring settlers to Texas and start a colony.", 5),
    ("pause", 0.5, 5),
    ("a23", P, "The most famous empresario was Stephen F. Austin. He brought hundreds of Anglo-American families to Texas and set up Austin's Colony. Another empresario, Martín De León, founded the town of Victoria.", 5),
    ("pause", 0.5, 5),
    ("a24", P, "Why did settlers come? To get land, farm, trade, and build a new life. Farming and raising livestock were important jobs for many early settlers.", 5),
    ("pause", 1.2, 5),

    # 6: Timeline
    ("pause", 0.8, 6),
    ("b6", D, "[proudly] I made the timeline! Austin's Colony goes first!", 6),
    ("a25", P, "Let's fix that. First came European explorers. Then Spanish missions and settlements. Then Mexico won independence in 1821. And then empresarios like Austin brought new settlers.", 6),
    ("pause", 0.8, 6),
    ("a26", P, "And each event helped cause the next. La Salle's French fort made Spain worry, so Spain built missions in East Texas. And Mexican independence led to new rules that let empresarios bring settlers.", 6),
    ("pause", 1.4, 6),

    # 7: Pop quiz
    ("a27", P, "[excited] Pop quiz! Say your answer out loud before I do.", 7),
    ("pause", 0.6, 7),
    ("a28", P, "One. Which explorer is connected to Fort St. Louis?", 7),
    ("pause", 3.5, 7),
    ("a29", P, "La Salle!", 7),
    ("pause", 1.0, 7),
    ("a30", P, "Two. What happened in 1821?", 7),
    ("pause", 3.5, 7),
    ("a31", P, "Mexico won independence from Spain!", 7),
    ("pause", 1.0, 7),
    ("a32", P, "Three. What did an empresario do?", 7),
    ("pause", 3.5, 7),
    ("a33", P, "Helped bring settlers to Texas.", 7),
    ("pause", 1.0, 7),
    ("a34", P, "Four. Which came earliest: Austin's Colony, Mexican independence, Spanish missions, or European exploration?", 7),
    ("pause", 3.5, 7),
    ("a35", P, "European exploration!", 7),
    ("pause", 1.2, 7),

    # 8: Goodbye
    ("a36", P, "[cheerful] Egg-cellent work, explorer! Now try the quiz on my Texas Trail to earn some stars.", 8),
    ("b7", D, "[excited] And remember: explorers, missions, Mexico, then empresarios!", 8),
    ("a37", P, "[surprised] Dilly, you got it in order!", 8),
    ("pause", 4.2, 8),
]

VOICES = {P: "Cq8gMra8w0trADKyB4Hi", D: "87n4zM8Wuy87vFILuKvE"}

# Riley reads slower than the Energy voices; speed her up (pitch-preserving atempo).
TEMPO = {P: 1.15}

# Second at which `make.sh <dir> install` grabs the poster frame.
POSTER_AT = 9
