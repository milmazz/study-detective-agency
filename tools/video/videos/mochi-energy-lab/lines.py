"""Mochi's Energy Lab video: spoken lines and pauses, in order (see script.md).

Each entry is either ("pause", seconds, scene) or (id, speaker, text, scene).
`text` is what is spoken AND captioned. A leading [tag] (an eleven_v3 audio
tag such as [excited]) is spoken-only; it is stripped from the caption.
"""

M, P = "mochi", "pip"

SCRIPT = [
    # Scene 1: Lights on
    ("pause", 2.4, 1),
    ("m1", M, "[cheerful] Welcome to my Energy Lab! I'm Mochi, and today we're learning how energy moves, what it can travel through, and how circuits make things work.", 1),
    ("pause", 1.8, 1),
    ("p1", P, "[excited] And I'm Pip! I'm a wind-up mouse, so I know everything about energy!", 1),
    ("m2", M, "[playful] We'll see about that, Pip.", 1),
    ("pause", 2.0, 1),

    # Scene 2: Energy transfer
    ("m3", M, "Big idea number one: energy can transfer. That means it moves from one object or place to another.", 2),
    ("pause", 0.4, 2),
    ("m4", M, "Watch. When I bat this yarn ball, it moves. A moving object has mechanical energy, the energy of motion. When it bumps the yellow ball, the energy transfers, and now the yellow ball moves!", 2),
    ("pause", 0.3, 2),
    ("p2", P, "[mischievously] And then the energy disappears. Poof!", 2),
    ("m5", M, "Nope! Energy never disappears. It just moves somewhere else, or changes into a different kind of energy.", 2),
    ("pause", 1.2, 2),
    ("m6", M, "Energy moves through water, too. When a pebble splashes into a pond, its energy travels through the water as waves. Those ripples are energy on the move.", 2),
    ("pause", 0.8, 2),
    ("p3", P, "[excited] Twang!", 2),
    ("pause", 0.6, 2),
    ("m7", M, "And that's sound energy. Sound happens when something vibrates, which means it shakes back and forth super fast. The vibrations travel through the air to our ears.", 2),
    ("pause", 2.0, 2),

    # Scene 3: Conductors and insulators
    ("m8", M, "Big idea number two. Some materials let energy pass through easily. Those are conductors. Metals are great conductors, like copper, aluminum, and iron.", 3),
    ("m9", M, "Other materials slow energy down or stop it. Those are insulators, like rubber, plastic, wood, and cloth.", 3),
    ("pause", 0.5, 3),
    ("p4", P, "[confidently] This spoon is a conductor, right?", 3),
    ("m10", M, "Is it made of metal?", 3),
    ("pause", 0.4, 3),
    ("p5", P, "[thoughtfully] ...It's made of tree.", 3),
    ("m11", M, "[laughing] Then it's an insulator!", 3),
    ("pause", 3.6, 3),
    ("m12", M, "Here's a trick: if it's metal, it's a conductor.", 3),
    ("pause", 0.8, 3),
    ("m13", M, "Lots of things use both. A pot has a metal bottom to heat the soup fast, and a plastic handle so your paw doesn't get burned. And electric wires are metal inside, so electricity flows, with plastic outside to keep you safe.", 3),
    ("pause", 1.2, 3),

    # Scene 4: Circuits
    ("m14", M, "Big idea number three: electricity travels in a path called a circuit. To build one, you need a battery for energy, wires for the path, and something to use the energy, like a bulb.", 4),
    ("pause", 1.0, 4),
    ("m15", M, "When the path is complete, with no gaps, it's a closed circuit. Electricity flows, and the light turns on!", 4),
    ("pause", 1.2, 4),
    ("p6", P, "[sheepishly] Oops.", 4),
    ("m16", M, "Now there's a gap. That's an open circuit. Electricity can't flow, so the light goes off.", 4),
    ("pause", 2.2, 4),
    ("p7", P, "[proudly] Fixed it!", 4),
    ("pause", 1.0, 4),
    ("m17", M, "Wood is an insulator, Pip. The circuit is still open. We need a conductor, like a metal paper clip.", 4),
    ("pause", 2.2, 4),

    # Scene 5: Energy changes
    ("m18", M, "Last big idea: a circuit can change electrical energy into other kinds of energy.", 5),
    ("pause", 0.4, 5),
    ("m19", M, "A light bulb changes electrical energy into light and thermal energy. That's why bulbs feel warm.", 5),
    ("pause", 0.4, 5),
    ("m20", M, "A buzzer changes it into sound energy.", 5),
    ("pause", 1.6, 5),
    ("m21", M, "And a fan changes it into mechanical energy, the energy of motion.", 5),
    ("p8", P, "[excited] Wheeeee!", 5),
    ("pause", 1.4, 5),

    # Scene 6: Pop quiz
    ("m22", M, "[excited] Pop quiz! Say your answer out loud before I do.", 6),
    ("pause", 0.6, 6),
    ("m23", M, "One. What kind of energy do you get when a radio plays music?", 6),
    ("pause", 3.5, 6),
    ("m24", M, "Sound energy!", 6),
    ("pause", 1.0, 6),
    ("m25", M, "Two. Is metal a conductor or an insulator?", 6),
    ("pause", 3.5, 6),
    ("m26", M, "A conductor!", 6),
    ("pause", 1.0, 6),
    ("m27", M, "Three. What happens when there's a break in a circuit?", 6),
    ("pause", 3.5, 6),
    ("m28", M, "The circuit is open, so electricity can't flow.", 6),
    ("pause", 1.0, 6),
    ("m29", M, "Four. How do you know energy moved from one object to another?", 6),
    ("pause", 3.5, 6),
    ("m30", M, "You see a change! Something starts moving, makes a sound, gets warmer, or gives off light.", 6),
    ("pause", 1.2, 6),

    # Scene 7: Goodbye
    ("m31", M, "[cheerful] You're fully charged! Now try the quiz in my Energy Lab to earn some stars.", 7),
    ("p9", P, "[excited] And remember: energy never disappears!", 7),
    ("m32", M, "[surprised] Pip... you were listening!", 7),
    ("pause", 4.0, 7),
]

VOICES = {M: "cgSgspJ2msm6clMCkdW9", P: "mdzEgLpu0FjTwYs5oot0"}

# Second at which `make.sh <dir> install` grabs the poster frame.
POSTER_AT = 9
