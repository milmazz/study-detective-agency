"""Dottie's Decimal Bakery video: spoken lines and pauses, in order (see script.md).

Each entry is ("pause", seconds, scene) or (id, speaker, text, scene).
A leading [tag] is an eleven_v3 audio tag: spoken-only, stripped from captions.
Decimals are written out the way a 4th grader reads them aloud ("zero point
five six"), so the narration and the captions say the same thing.
"""

D, B = "dottie", "biscuit"

SCRIPT = [
    # 1: Welcome to the bakery
    ("pause", 1.6, 1),
    ("d1", D, "[cheerful] Welcome to my Decimal Bakery! I'm Dottie, and today we're baking with decimals: tenths, hundredths, money, and more.", 1),
    ("pause", 1.2, 1),
    ("b1", B, "[excited] And I'm Biscuit, the new baker! I already know decimals. They're just numbers with a dot!", 1),
    ("d2", D, "[playful] That dot is a big deal, Biscuit. Let's find out why.", 1),
    ("pause", 1.4, 1),

    # 2: Tenths and hundredths
    ("d3", D, "The decimal point splits wholes from parts. Digits on the left are whole cakes. Digits on the right are parts of a cake.", 2),
    ("pause", 1.0, 2),
    ("d4", D, "Here's one whole tray. If I cut it into ten equal rows, each row is one tenth. We write it zero point one.", 2),
    ("pause", 1.0, 2),
    ("d5", D, "Now cut the same tray into one hundred tiny cookies. Each cookie is one hundredth. That's zero point zero one.", 2),
    ("pause", 0.6, 2),
    ("b2", B, "[proudly] So a hundredth is bigger, because one hundred is bigger than ten!", 2),
    ("d6", D, "[gently] Nope! More pieces means smaller pieces. Ten cookies fill just one row, so a hundredth is much smaller than a tenth.", 2),
    ("pause", 1.0, 2),
    ("d7", D, "Let's bake fifty-six cookies. That's fifty-six hundredths, or five tenths and six hundredths. We write it zero point five six.", 2),
    ("pause", 1.4, 2),
    ("d8", D, "Here's a baker's secret: five tenths equals fifty hundredths. Zero point five is the same as zero point five zero.", 2),
    ("pause", 1.4, 2),

    # 3: Mixed numbers and decimals
    ("d9", D, "Big idea number two: mixed numbers. That's a whole number plus a fraction, like eighteen and four hundredths.", 3),
    ("pause", 0.6, 3),
    ("b3", B, "[confidently] Easy! Eighteen, dot, four. Eighteen point four!", 3),
    ("pause", 0.4, 3),
    ("d10", D, "Careful! Eighteen point four means four tenths. We need four hundredths.", 3),
    ("d11", D, "Here's the trick. Out of ten means one place after the point. Out of one hundred means two places. Four hundredths has no tenths, so a zero holds the tenths place: eighteen point zero four.", 3),
    ("pause", 1.4, 3),
    ("d12", D, "Now try thirty-six and seven tenths. Out of ten, so just one place: thirty-six point seven.", 3),
    ("pause", 1.2, 3),
    ("b4", B, "[thoughtfully] So three point four is three and four hundredths?", 3),
    ("d13", D, "Look at the places. The four is in the tenths place, so it's three and four tenths. That's the same as three and forty hundredths.", 3),
    ("pause", 1.6, 3),

    # 4: Money
    ("d14", D, "Big idea number three: money is decimals! One dollar is one whole.", 4),
    ("d15", D, "A dime is one tenth of a dollar. That's ten cents. A penny is one hundredth of a dollar. That's one cent.", 4),
    ("pause", 0.8, 4),
    ("d16", D, "Maya has four one-dollar bills, two dimes, one nickel, and three pennies. Let's count. Four dollars. Then ten, twenty, twenty-five, twenty-six, twenty-seven, twenty-eight cents.", 4),
    ("pause", 0.6, 4),
    ("b5", B, "[excited] That's four and twenty-eight tenths!", 4),
    ("d17", D, "[laughing] Cents are hundredths, Biscuit! It's four dollars and twenty-eight cents. Four point two eight, or four and twenty-eight hundredths.", 4),
    ("pause", 1.6, 4),

    # 5: The times-ten pattern
    ("d18", D, "Big idea number four: the times ten pattern. Each place is worth ten times the place to its right.", 5),
    ("pause", 0.5, 5),
    ("d19", D, "Watch this four hop. In the hundredths place, it's worth four hundredths. Hop one place left, and it's worth four tenths, ten times as much. Hop again, and it's worth four. Ten times as much again!", 5),
    ("pause", 1.0, 5),
    ("b6", B, "[curious] So the four in the hundredths place is ten times the four in the tenths place?", 5),
    ("d20", D, "Other way around! The place on the left is always worth more. The tenths place is ten times the hundredths place.", 5),
    ("pause", 1.2, 5),
    ("d21", D, "This pattern helps with expanded notation. Twenty-four point seven pounds is two times ten, plus four times one, plus seven times one tenth.", 5),
    ("pause", 1.4, 5),
    ("d22", D, "And if Nina pays fifty-three dollars and forty-seven cents, the four is in the tenths place. It's worth four times one tenth: forty cents.", 5),
    ("pause", 1.4, 5),

    # 6: Grids, number lines and rulers
    ("d23", D, "Last big idea: reading decimal pictures. A big flat is one whole, and each little square is one hundredth.", 6),
    ("pause", 0.4, 6),
    ("d24", D, "Here's one flat and six little squares. What number is that?", 6),
    ("pause", 0.6, 6),
    ("b7", B, "[confidently] One point six!", 6),
    ("d25", D, "Six little squares are six hundredths, not six tenths. There are zero tenths, so it's one point zero six.", 6),
    ("pause", 1.2, 6),
    ("d26", D, "Now let's compare. Which is more, zero point five six or zero point six?", 6),
    ("b8", B, "[proudly] Zero point five six! Fifty-six is bigger than six.", 6),
    ("d27", D, "Line up the decimal points first. Zero point six is the same as zero point six zero. Sixty hundredths is more than fifty-six hundredths, so zero point six is bigger.", 6),
    ("pause", 1.0, 6),
    ("d28", D, "On a number line, bigger numbers are farther to the right. On a ruler, count the whole centimeters, then the tenth spaces. Six whole centimeters and seven tenths is six point seven.", 6),
    ("pause", 1.6, 6),

    # 7: Pop quiz
    ("d29", D, "[excited] Pop quiz! Say your answer out loud before I do.", 7),
    ("pause", 0.6, 7),
    ("d30", D, "One. How do you write eighteen and four hundredths as a decimal?", 7),
    ("pause", 3.5, 7),
    ("d31", D, "Eighteen point zero four. The zero holds the tenths place!", 7),
    ("pause", 1.0, 7),
    ("d32", D, "Two. A student has two quarters, three dimes, and four pennies. How much money is that?", 7),
    ("pause", 3.5, 7),
    ("d33", D, "Eighty-four cents. That's zero point eight four dollars.", 7),
    ("pause", 1.0, 7),
    ("d34", D, "Three. In fifty-three point four seven, what is the value of the four?", 7),
    ("pause", 3.5, 7),
    ("d35", D, "Four tenths, or zero point four.", 7),
    ("pause", 1.0, 7),
    ("d36", D, "Four. Which is greater, zero point five six or zero point six?", 7),
    ("pause", 3.5, 7),
    ("d37", D, "Zero point six! Sixty hundredths is more than fifty-six hundredths.", 7),
    ("pause", 1.2, 7),

    # 8: Goodbye
    ("d38", D, "[cheerful] You're a decimal chef! Now try the quiz in my Decimal Bakery to earn some stars.", 8),
    ("b9", B, "[excited] And remember: a zero can hold a place!", 8),
    ("d39", D, "[surprised] Biscuit... you were listening!", 8),
    ("pause", 3.6, 8),
]

# ElevenLabs default voices (available on every account): Laura (upbeat, quirky)
# for Dottie, Will (young, friendly) for Biscuit. To audition others:
#   python3 tools/video/pipeline/voices.py search "cheerful young woman"
VOICES = {D: "FGY2WhTYpPnrIDTdsKH5", B: "bIHbv24MWmeRgasZH58o"}

# Second at which `make.sh <dir> install` grabs the poster frame.
POSTER_AT = 8
