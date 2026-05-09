-- Code Recall · Session 1: Python Foundations (Python)
-- Run after `topics` table exists. Safe re-run: replaces MCQ/coding rows for this topic only.

CREATE TABLE IF NOT EXISTS public.mcq_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID NOT NULL,
    difficulty INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    mastery_weight INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    language_id TEXT DEFAULT 'python',
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coding_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID NOT NULL,
    difficulty INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    mastery_weight INTEGER NOT NULL DEFAULT 2,
    explanation TEXT,
    language_id TEXT DEFAULT 'python',
    title TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    example_input TEXT,
    example_output TEXT,
    starter_code TEXT,
    expected_output TEXT,
    hints JSONB,
    test_cases JSONB
);

-- Add mastery_weight columns to existing tables (safe for re-runs)
ALTER TABLE public.mcq_questions ADD COLUMN IF NOT EXISTS mastery_weight INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.coding_questions ADD COLUMN IF NOT EXISTS mastery_weight INTEGER NOT NULL DEFAULT 2;

ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.mcq_questions;
CREATE POLICY "Allow public read access" ON public.mcq_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON public.coding_questions;
CREATE POLICY "Allow public read access" ON public.coding_questions FOR SELECT USING (true);

GRANT SELECT ON public.mcq_questions TO anon, authenticated;
GRANT SELECT ON public.coding_questions TO anon, authenticated;

-- ------------------------------------------------------------
-- User progress (per-user + per-topic)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id UUID PRIMARY KEY,
  mcq_solved INTEGER NOT NULL DEFAULT 0,
  coding_solved INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  day_streak INTEGER NOT NULL DEFAULT 0,
  best_day_streak INTEGER NOT NULL DEFAULT 0,
  last_active_day DATE,
  last_active_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backward-compatible for existing DBs
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS day_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS best_day_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.user_progress ADD COLUMN IF NOT EXISTS last_active_day DATE;

CREATE TABLE IF NOT EXISTS public.user_topic_progress (
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL,
  mcq_done INTEGER NOT NULL DEFAULT 0,
  mcq_total INTEGER NOT NULL DEFAULT 0,
  coding_done INTEGER NOT NULL DEFAULT 0,
  coding_total INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_topic_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own progress" ON public.user_progress;
CREATE POLICY "Users read own progress"
ON public.user_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users upsert own progress" ON public.user_progress;
CREATE POLICY "Users upsert own progress"
ON public.user_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own progress" ON public.user_progress;
CREATE POLICY "Users update own progress"
ON public.user_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own topic progress" ON public.user_topic_progress;
CREATE POLICY "Users read own topic progress"
ON public.user_topic_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users upsert own topic progress" ON public.user_topic_progress;
CREATE POLICY "Users upsert own topic progress"
ON public.user_topic_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own topic progress" ON public.user_topic_progress;
CREATE POLICY "Users update own topic progress"
ON public.user_topic_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- First learning session (Python): title + onboarding pitch
DO $$
DECLARE
  _pf_id UUID;
  _pb_id UUID;
BEGIN
  SELECT id INTO _pf_id FROM public.topics WHERE slug = 'programming-foundations';
  SELECT id INTO _pb_id FROM public.topics WHERE slug = 'python-basics';

  -- If the new slug exists, keep it and just update its display fields.
  IF _pf_id IS NOT NULL THEN
    UPDATE public.topics
    SET
      title = 'Python Foundations',
      description = 'Python • Session 1 — From “what is programming?” to print(), math, variables, strings, len(), and indexing. Your beginner roadmap: ideas first, then superpowers.',
      "order" = 1
    WHERE id = _pf_id;

  -- Otherwise, if legacy python-basics exists, migrate it to the new slug (only safe when pf doesn't exist).
  ELSIF _pb_id IS NOT NULL THEN
    UPDATE public.topics
    SET
      slug = 'programming-foundations',
      title = 'Python Foundations',
      description = 'Python • Session 1 — From “what is programming?” to print(), math, variables, strings, len(), and indexing. Your beginner roadmap: ideas first, then superpowers.',
      "order" = 1
    WHERE id = _pb_id;

  -- Otherwise insert fresh.
  ELSE
    INSERT INTO public.topics (title, description, "order", slug)
    VALUES (
      'Python Foundations',
      'Python • Session 1 — From “what is programming?” to print(), math, variables, strings, len(), and indexing. Your beginner roadmap: ideas first, then superpowers.',
      1,
      'programming-foundations'
    );
  END IF;
END $$;

DO $$
DECLARE
    _topic_id UUID;
BEGIN
    SELECT id INTO _topic_id FROM public.topics WHERE slug = 'programming-foundations';

    IF _topic_id IS NULL THEN
        RAISE EXCEPTION 'Topic not found: programming-foundations';
    END IF;

    DELETE FROM public.mcq_questions WHERE topic_id = _topic_id;
    DELETE FROM public.coding_questions WHERE topic_id = _topic_id;

    -- 25 MCQs · difficulty 1–5 Very Easy · 6–10 Easy · 11–15 Medium · 16–20 Hard · 21–25 Insane Beginner · correct_answer = 0-based index
    INSERT INTO public.mcq_questions (topic_id, difficulty, order_index, explanation, language_id, question, options, correct_answer) VALUES
    (_topic_id, 1, 1, 'A program is a sequence of instructions the computer can execute — your recipe for what should happen.', 'python', 'Imagine you''re giving a very literal friend directions. In one line: what is a program?', '["A brainstorming napkin doodle", "Step-by-step instructions for a computer", "The wallpaper on your desktop", "A comment your friend leaves on your video"]'::jsonb, 1),
    (_topic_id, 2, 2, 'Software is the programs and data that make hardware useful — apps, games, scripts, and tools.', 'python', 'Your laptop hardware is the body. What''s the personality + skills that actually does stuff?', '["Hardware", "Software", "Wi-Fi speed", "RGB lights"]'::jsonb, 1),
    (_topic_id, 3, 3, 'Programming is the art of writing those instructions so the machine behaves exactly how you intend (mostly).', 'python', 'Which activity matches *programming* best?', '["Typing random keys until it works", "Writing instructions a computer can run", "Cleaning dust from a fan", "Downloading more RAM"]'::jsonb, 1),
    (_topic_id, 4, 4, 'Python is a programming language — a formal way humans write instructions that tools turn into machine actions.', 'python', '“Python” in this course is not the snake cosplay. What is *Python* here?', '["A snake upgrade DLC", "A programming language", "A keyboard layout", "A file extension only"]'::jsonb, 1),
    (_topic_id, 5, 5, 'Syntax is the grammar rules of a language — punctuation, keywords, and structure the interpreter expects.', 'python', 'Your code is a sentence. *Syntax* is:', '["How fast you type", "The rules of how code must be written", "The CPU brand", "A kind of bug spray"]'::jsonb, 1),

    (_topic_id, 6, 6, 'Readable code, gentle learning curve, huge community, and batteries-included tools make Python a friendly first language.', 'python', 'Pick the vibe-check: why do beginners often start with Python?', '["Because it hates spaces", "Because it''s readable and forgiving for learning", "Because it only works offline", "Because it can''t do math"]'::jsonb, 1),
    (_topic_id, 7, 7, '`print(...)` sends text to standard output — the console you see as a learner.', 'python', 'You want the screen to show `Hello, space cadet!`. What do you call?', '["say()", "announce()", "print()", "shout()"]'::jsonb, 2),
    (_topic_id, 8, 8, 'Python can evaluate numeric expressions like `7 + 3` directly — it doubles as a calculator.', 'python', 'What does `print(4 + 5)` output?', '["45", "9", "4 + 5", "Error always"]'::jsonb, 1),
    (_topic_id, 9, 9, 'Plus adds; minus subtracts; star multiplies; slash divides; double-slash floor-divides; percent remainder; double-star power.', 'python', 'Which operator gives the remainder after division (example: clocks wrapping around)?', '["** (power)", "% (remainder)", "// (floor divide)", "walrus operator"]'::jsonb, 1),
    (_topic_id, 10, 10, 'Common types include int, float, str, bool — Python figures many of them out from literals.', 'python', 'Which literal is a string (str) in Python?', '["42", "True", "`hello` in double or single quotes", "3.14"]'::jsonb, 2),

    (_topic_id, 11, 11, 'Equals stores a value in a name (assignment); it is not equals from math class.', 'python', 'After score = 10, what does = best mean?', '["Score is exactly equal forever", "Store 10 in the name score", "Compare score to 10", "Delete score"]'::jsonb, 1),
    (_topic_id, 12, 12, 'Python runs top to bottom; later lines can use values created earlier.', 'python', 'If line 1 sets `a = 1` and line 2 sets `b = a + 2`, what is `b` *after* line 2 runs?', '["1", "2", "3", "undefined forever"]'::jsonb, 2),
    (_topic_id, 13, 13, 'Reassigning a variable replaces its value; the old value is forgotten unless copied elsewhere.', 'python', 'What does this print? `x = 3` then `x = x + 2` then `print(x)`', '["3", "32", "5", "x"]'::jsonb, 2),
    (_topic_id, 14, 14, 'Expressions evaluate to a value; here `2 * (3 + 4)` becomes `14` — parentheses first.', 'python', 'What is `2 * (3 + 4)` in Python?', '["14", "10", "24", "SyntaxError"]'::jsonb, 0),
    (_topic_id, 15, 15, '`input()` reads a line from stdin as a *string* — convert if you need numbers.', 'python', 'If `name = input()` and the user types `Zee`, what is the type of `name` in typical Python 3?', '["int", "str", "float", "bool"]'::jsonb, 1),

    (_topic_id, 16, 16, '`+` between strings concatenates (glues) them together with no automatic space.', 'python', 'What is `"Co" + "de"`?', '["Co de", "Code", "C+o+d+e", "Error"]'::jsonb, 1),
    (_topic_id, 17, 17, 'Multiplying a string by `n` repeats it `n` times: `"ha" * 3` → `hahaha`.', 'python', 'What does `"No" * 3` produce?', '["NoNoNo", "No3", "333", "SyntaxError"]'::jsonb, 0),
    (_topic_id, 18, 18, '`len(s)` returns how many characters are in the string `s`.', 'python', 'What is `len("radar")`?', '["6", "5", "r", "True"]'::jsonb, 1),
    (_topic_id, 19, 19, 'Indexing uses `[]` — position 0 is the first character.', 'python', 'For `word = "Python"`, what is `word[0]`?', '["P", "y", "n", "Error"]'::jsonb, 0),
    (_topic_id, 20, 20, 'Negative indices count from the end: `-1` is last, `-2` second last.', 'python', 'What is `"sleep"[-1]`?', '["s", "p", "e", "sleep"]'::jsonb, 1),

    (_topic_id, 21, 21, '`//` is floor division — it drops the fractional part toward negative infinity for ints.', 'python', 'If you *only* want whole buckets (floor division), what do you use for `7 // 3`?', '["7 / 3", "7 // 3", "7 ** 3", "7 % 3"]'::jsonb, 1),
    (_topic_id, 22, 22, 'Never add strings and ints directly — 5 plus a string without converting is a TypeError.', 'python', 'Which expression is likely to raise TypeError in Python 3?', '["5 + 5", "two strings joined with +", "integer plus string literal", "int of string plus integer"]'::jsonb, 2),
    (_topic_id, 23, 23, 'Spaces inside a string count as characters — `"a b"` has length 3.', 'python', 'What is `len("a b")`?', '["2", "3", "4", "1"]'::jsonb, 1),
    (_topic_id, 24, 24, 'Chained assignment `a = b = 0` assigns the same value to multiple names.', 'python', 'After `x = y = 3`, what is `x + y`?', '["3", "6", "33", "Error"]'::jsonb, 1),
    (_topic_id, 25, 25, 'Slice of indexing: first + last letters from `"byte"` → `"b"` + `"e"` → `"be"`.', 'python', 'Little boss battle: what does `"byte"[0] + "byte"[-1]` produce?', '["byte", "be", "byee", "ye"]'::jsonb, 1);

    -- 25 Coding challenges · stdin matches Piston-style execution (newline after prints from print())
    INSERT INTO public.coding_questions (topic_id, difficulty, order_index, explanation, language_id, title, problem_statement, example_input, example_output, starter_code, expected_output, hints, test_cases) VALUES
    (_topic_id, 1, 1, 'print adds a newline by default — your output should match exactly.', 'python',
        'Mission: Say Hi',
        'Print exactly this line (character-for-character): Hello, I can code!',
        '(none)',
        'Hello, I can code!',
        '# Your first victory lap\n',
        'Hello, I can code!\n',
        '["Use print() with the string in quotes.", "Copy punctuation and spaces exactly."]'::jsonb,
        '[{"input": "", "expected": "Hello, I can code!\\n"}]'::jsonb),

    (_topic_id, 2, 2, 'Separate print() calls → separate lines in the output.', 'python',
        'Two-Line Intro',
        'Print `Line A` on the first line and `Line B` on the second line (two print statements are fine).',
        '(none)',
        'Line A\nLine B',
        '# Print two lines\n',
        'Line A\nLine B\n',
        '["Each print() is its own line by default."]'::jsonb,
        '[{"input": "", "expected": "Line A\\nLine B\\n"}]'::jsonb),

    (_topic_id, 3, 3, 'Store a value with `=` then print the variable without quotes around its name.', 'python',
        'Name Tag',
        'Create a variable `alias` with the value `"Neo"` (string). Print the variable so the output shows Neo.',
        '(none)',
        'Neo',
        '# alias = ???\n\n',
        'Neo\n',
        '["alias = \"Neo\"", "print(alias) — no quotes around alias"]'::jsonb,
        '[{"input": "", "expected": "Neo\\n"}]'::jsonb),

    (_topic_id, 4, 4, 'Arithmetic inside print evaluates before displaying.', 'python',
        'Energy Points',
        'You have 12 points. You earn 9 more. Print only the total (single number on one line).',
        '(none)',
        '21',
        '# total = ...\n\n',
        '21\n',
        '["12 + 9 works inside print(total)."]'::jsonb,
        '[{"input": "", "expected": "21\\n"}]'::jsonb),

    (_topic_id, 5, 5, 'The `*` operator multiplies integers.', 'python',
        'Triple Batch',
        'Each crate holds 8 apples. You have 5 crates. Print how many apples in total (one integer).',
        '(none)',
        '40',
        '# crates = 5\n# per_crate = 8\n\n',
        '40\n',
        '["Multiply crates by apples per crate."]'::jsonb,
        '[{"input": "", "expected": "40\\n"}]'::jsonb),

    (_topic_id, 6, 6, 'Floor division `//` answers “how many whole groups”.', 'python',
        'Pizza Fair Share',
        'You have 17 slices and groups of 3 slices make a mini-meal. Print how many *whole* mini-meals (use //).',
        '(none)',
        '5',
        'slices = 17\nsize = 3\n\n',
        '5\n',
        '["Whole meals = slices // size"]'::jsonb,
        '[{"input": "", "expected": "5\\n"}]'::jsonb),

    (_topic_id, 7, 7, '`%` gives remainder — perfect for wrap-around / leftover questions.', 'python',
        'Leftovers',
        'Print the remainder when 23 is divided by 5 (use %).',
        '(none)',
        '3',
        '# print(23 % 5)\n\n',
        '3\n',
        '["Modulo: 23 % 5"]'::jsonb,
        '[{"input": "", "expected": "3\\n"}]'::jsonb),

    (_topic_id, 8, 8, 'Exponents use `**` — 2 to the power 10.', 'python',
        'Power Tiny',
        'Print `2 ** 10` as a single number (1024).',
        '(none)',
        '1024',
        '# You can print the expression directly\n\n',
        '1024\n',
        '["print(2 ** 10)"]'::jsonb,
        '[{"input": "", "expected": "1024\\n"}]'::jsonb),

    (_topic_id, 9, 9, 'Convert strings to int with int() before numeric ops if needed.', 'python',
        'String Math (Careful)',
        'Given `a = "7"` and `b = "3"` as strings, print the integer sum `10` (convert with int()).',
        '(none)',
        '10',
        'a = "7"\nb = "3"\n\n',
        '10\n',
        '["int(a) + int(b)"]'::jsonb,
        '[{"input": "", "expected": "10\\n"}]'::jsonb),

    (_topic_id, 10, 10, 'Combine strings with `+`; mind spaces — add literal `" "` if needed.', 'python',
        'Handle With Care',
        'Variables: `emoji = ":)"` and `msg = "You got this"`. Print: `You got this :)` with a space between.',
        '(none)',
        'You got this :)',
        'emoji = ":)"\nmsg = "You got this"\n\n',
        'You got this :)\n',
        '["msg + \" \" + emoji"]'::jsonb,
        '[{"input": "", "expected": "You got this :)\\n"}]'::jsonb),

    (_topic_id, 11, 11, 'input() returns text; you may print it directly.', 'python',
        'Echo Chamber', 
        'Read one line from input() into `nick` and print it unchanged.',
        'coder42',
        'coder42',
        'nick = input()\n\n',
        'coder42\n',
        '["stdin is provided when you run tests — just input() and print(nick)."]'::jsonb,
        '[{"input": "coder42\n", "expected": "coder42\\n"}]'::jsonb),

    (_topic_id, 12, 12, 'f-strings or concatenation can format — keep output exact.', 'python',
        'Cheer For',
        'Read a name from input(). Print exactly: `Go, <name>, go!` (with comma and spaces as shown).',
        'Sam',
        'Go, Sam, go!',
        'name = input()\n\n',
        'Go, Sam, go!\n',
        '["print(\"Go, \" + name + \", go!\") or an f-string"]'::jsonb,
        '[{"input": "Sam\n", "expected": "Go, Sam, go!\\n"}]'::jsonb),

    (_topic_id, 13, 13, 'Strip newlines from input if you compare; here printing twice on one line isn''t needed — just eval sum.', 'python',
        'Double Tap',
        'Read an integer from input() (single number). Print double that number.',
        '11',
        '22',
        'n = int(input())\n\n',
        '22\n',
        '["n = int(input()) then print(n * 2)"]'::jsonb,
        '[{"input": "11\n", "expected": "22\\n"}, {"input": "0\n", "expected": "0\\n"}]'::jsonb),

    (_topic_id, 14, 14, 'String repetition: `char * k` repeats k times.', 'python',
        'Beat Repeater',
        'Print the character `X` repeated exactly 6 times in a row (no spaces, no newline tricks — one print).',
        '(none)',
        'XXXXXX',
        '# char = "X"\n\n',
        'XXXXXX\n',
        '["print(\"X\" * 6)"]'::jsonb,
        '[{"input": "", "expected": "XXXXXX\\n"}]'::jsonb),

    (_topic_id, 15, 15, 'len(string) for character counts.', 'python',
        'Spell Length',
        'Variable `spell = "abracadabra"`. Print how many characters (use len).',
        '(none)',
        '11',
        'spell = "abracadabra"\n\n',
        '11\n',
        '["print(len(spell))"]'::jsonb,
        '[{"input": "", "expected": "11\\n"}]'::jsonb),

    (_topic_id, 16, 16, 'Index 0 is first character.', 'python',
        'Initial Force',
        '`code = "RECALL"`. Print only the first character.',
        '(none)',
        'R',
        'code = "RECALL"\n\n',
        'R\n',
        '["print(code[0])"]'::jsonb,
        '[{"input": "", "expected": "R\\n"}]'::jsonb),

    (_topic_id, 17, 17, '-1 index = last character.', 'python',
        'Snap Finish',
        '`snap = "clap"`. Print the last character.',
        '(none)',
        'p',
        'snap = "clap"\n\n',
        'p\n',
        '["print(snap[-1])"]'::jsonb,
        '[{"input": "", "expected": "p\\n"}]'::jsonb),

    (_topic_id, 18, 18, 'len(s)-1 is last index going left-to-right.', 'python',
        'Index Detective',
        'Without negative indexing, print the last character of `word = "glow"` using len(word).',
        '(none)',
        'w',
        'word = "glow"\n\n',
        'w\n',
        '["idx = len(word) - 1", "print(word[idx])"]'::jsonb,
        '[{"input": "", "expected": "w\\n"}]'::jsonb),

    (_topic_id, 19, 19, 'Slice mentally: first + last chars.', 'python',
        'Edge Letters',
        'For `s = "bytes"`, print the concatenation of first and last character (e.g. first + last). Output should be `bs`.',
        '(none)',
        'bs',
        's = "bytes"\n\n',
        'bs\n',
        '["s[0] + s[-1]"]'::jsonb,
        '[{"input": "", "expected": "bs\\n"}]'::jsonb),

    (_topic_id, 20, 20, 'Multiple steps: read, compute, print.', 'python',
        'Tip Jar',
        'Read a float from input() as a bill amount. Print the total after a 15% tip (one line, default float formatting is ok). Use: `bill = float(input())`.',
        '20',
        '23.0',
        '# bill = float(input())\n\n',
        '23.0\n',
        '["total = bill * 1.15", "print(total)"]'::jsonb,
        '[{"input": "20\n", "expected": "23.0\\n"}]'::jsonb),

    (_topic_id, 21, 21, 'Combine input, int conversion, and arithmetic.', 'python',
        'Sum of Inputs',
        'Read two integers from two separate input() lines. Print their sum.',
        '12\n7\n',
        '19',
        'a = int(input())\nb = int(input())\n\n',
        '19\n',
        '["print(a + b)"]'::jsonb,
        '[{"input": "12\n7\n", "expected": "19\\n"}]'::jsonb),

    (_topic_id, 22, 22, 'String + int() + indexing mashup.', 'python',
        'Secret Door Code',
        'Given: `pin = "48291"`. Print the sum of the first digit and the last digit as an integer (4 + 1 = 5). Use indexing, not loops.',
        '(none)',
        '5',
        'pin = "48291"\n\n',
        '5\n',
        '["int(pin[0]) + int(pin[-1])"]'::jsonb,
        '[{"input": "", "expected": "5\\n"}]'::jsonb),

    (_topic_id, 23, 23, 'Expression practice: average without importing statistics.', 'python',
        'Fair Mean',
        'Read three integers from three separate input() lines. Print their average as a float (e.g. `(a+b+c)/3` — Python 3 gives float division).',
        '4\n5\n6\n',
        '5.0',
        'a = int(input())\nb = int(input())\nc = int(input())\n\n',
        '5.0\n',
        '["(a + b + c) / 3"]'::jsonb,
        '[{"input": "4\n5\n6\n", "expected": "5.0\\n"}]'::jsonb),

    (_topic_id, 24, 24, 'len, repetition, and concat.', 'python',
        'Banner Builder',
        'Read a non-empty string `s` from input(). Print: `*` repeated len(s) times, then newline, then `s`, then newline, then `*` repeated len(s) times.',
        'Yo',
        '**\nYo\n**',
        's = input()\n\n',
        '**\nYo\n**\n',
        '["top = \"*\" * len(s)", "print(top); print(s); print(top)"]'::jsonb,
        '[{"input": "Yo\n", "expected": "**\\nYo\\n**\\n"}, {"input": "A\n", "expected": "*\\nA\\n*\\n"}]'::jsonb),

    (_topic_id, 25, 25, 'Capstone: variables, I/O, expressions, indexing.', 'python',
        'Coder Username',
        'Read a single word from input() into `handle`. Let `tag` be the first letter, uppercased, plus the last letter, lowercased (e.g. `Py` → `Py`). Print `tag` twice separated by a single `|` with no extra spaces — e.g. `Py|Py`. Assume the word has at least 2 letters.',
        'Code',
        'Ce|Ce',
        'handle = input()\n\n',
        'Ce|Ce\n',
        '["first = handle[0].upper()", "last = handle[-1].lower()", "tag = first + last", "print(tag + \"|\" + tag)"]'::jsonb,
        '[{"input": "Code\n", "expected": "Ce|Ce\\n"}, {"input": "ab\n", "expected": "Ab|Ab\\n"}]'::jsonb);

END $$;

-- ------------------------------------------------------------
-- Code Recall · Session 2: Logic & Decision Making (Python)
-- ------------------------------------------------------------

DO $$
DECLARE
  _topic_id UUID;
BEGIN
  -- Check if topic already exists
  SELECT id INTO _topic_id FROM public.topics WHERE slug = 'logic-decision-making';

  IF _topic_id IS NOT NULL THEN
    UPDATE public.topics
    SET
      title = 'Logic & Decision Making',
      description = 'Python • Session 2 — Mastering type conversion, string slicing, and the core of programming logic: relational operators, boolean algebra, and conditional decision-making.',
      "order" = 2
    WHERE id = _topic_id;
  ELSE
    INSERT INTO public.topics (title, description, "order", slug)
    VALUES (
      'Logic & Decision Making',
      'Python • Session 2 — Mastering type conversion, string slicing, and the core of programming logic: relational operators, boolean algebra, and conditional decision-making.',
      2,
      'logic-decision-making'
    ) RETURNING id INTO _topic_id;
  END IF;

  -- Clean up existing questions if re-running
  DELETE FROM public.mcq_questions WHERE topic_id = _topic_id;
  DELETE FROM public.coding_questions WHERE topic_id = _topic_id;

  -- 25 MCQs
  INSERT INTO public.mcq_questions (topic_id, difficulty, order_index, mastery_weight, explanation, language_id, question, options, correct_answer) VALUES
  -- 1-5 Very Easy
  (_topic_id, 1, 1, 1, 'type() returns the class of an object. type(42) is <class ''int''>.', 'python', 'What is the output of `print(type(42))`?', '["<class ''str''>", "<class ''float''>", "<class ''int''>", "<class ''bool''>"]'::jsonb, 2),
  (_topic_id, 2, 2, 1, 'int() converts a string or float to an integer. "10" becomes 10.', 'python', 'What does `int("10") + 5` result in?', '["105", "15", "Error", "10.05"]'::jsonb, 1),
  (_topic_id, 3, 3, 1, 'The == operator checks if two values are equal. 5 == 5 is True.', 'python', 'Which operator checks if two values are exactly equal?', '["=", "==", "===", "!="]'::jsonb, 1),
  (_topic_id, 4, 4, 1, '!= checks if values are NOT equal. 5 != 3 is True.', 'python', 'Which operator returns True if values are different?', '["<>", "not", "!=", "=="]'::jsonb, 2),
  (_topic_id, 5, 5, 1, 'bool() converts a value to True or False. Most non-zero numbers are True.', 'python', 'What is `bool(1)` in Python?', '["True", "False", "1", "Error"]'::jsonb, 0),

  -- 6-10 Easy
  (_topic_id, 6, 6, 1, 'The and operator requires BOTH sides to be True.', 'python', 'What is the result of `True and False`?', '["True", "False", "None", "Error"]'::jsonb, 1),
  (_topic_id, 7, 7, 1, 'The or operator requires at least ONE side to be True.', 'python', 'What is the result of `True or False`?', '["True", "False", "None", "Error"]'::jsonb, 0),
  (_topic_id, 8, 8, 1, 'not flips a boolean value. not True is False.', 'python', 'What is `not (5 > 10)`?', '["True", "False", "None", "Error"]'::jsonb, 0),
  (_topic_id, 9, 9, 1, 'A basic if statement only runs the block if the condition is True.', 'python', 'In `if x > 0:`, what happens if x is -5?', '["The block runs", "The block is skipped", "Python crashes", "The block runs twice"]'::jsonb, 1),
  (_topic_id, 10, 10, 1, 'else provides a fallback when the if condition is False.', 'python', 'Which keyword provides a code block to run when the `if` condition is False?', '["elif", "then", "else", "otherwise"]'::jsonb, 2),

  -- 11-15 Medium
  (_topic_id, 11, 11, 2, 'String slicing [start:end] includes start index but EXCLUDES end index.', 'python', 'What is `"Python"[0:2]`?', '["Py", "Pyt", "yt", "P"]'::jsonb, 0),
  (_topic_id, 12, 12, 2, 'Leaving start or end empty in a slice means "from start" or "to end".', 'python', 'What is `"Hello"[:3]`?', '["Hell", "Hel", "lo", "H"]'::jsonb, 1),
  (_topic_id, 13, 13, 2, 'Negative indices in slices count from the end.', 'python', 'What is `"Apple"[-3:]`?', '["Ap", "ple", "ppl", "le"]'::jsonb, 1),
  (_topic_id, 14, 14, 2, 'elif (else if) allows checking multiple conditions in order.', 'python', 'Which keyword is used for "else if" in Python?', '["elseif", "else if", "elif", "case"]'::jsonb, 2),
  (_topic_id, 15, 15, 2, 'Strings can be compared; "a" < "b" because it comes earlier alphabetically.', 'python', 'What is the result of `"apple" < "banana"`?', '["True", "False", "Error", "None"]'::jsonb, 0),

  -- 16-20 Hard
  (_topic_id, 16, 16, 3, 'Operator precedence: not > and > or.', 'python', 'What is the result of `True or False and False`?', '["True", "False", "Error", "None"]'::jsonb, 0),
  (_topic_id, 17, 17, 3, 'Slicing [::step] allows skipping characters. [::-1] reverses the string.', 'python', 'How do you reverse a string `s` in Python using slicing?', '["s[rev]", "s[-1:0]", "s[::-1]", "s[0:-1:-1]"]'::jsonb, 2),
  (_topic_id, 18, 18, 3, 'Nested if statements are if blocks inside other if blocks.', 'python', 'What is the indentation rule for nested `if` statements?', '["No indentation needed", "Must be indented further than the parent if", "Must be at the same level as parent", "Only comments need indentation"]'::jsonb, 1),
  (_topic_id, 19, 19, 3, 'Comparing different types (like int and str) with < or > usually raises a TypeError.', 'python', 'What happens if you run `5 > "3"` in Python 3?', '["True", "False", "TypeError", "SyntaxError"]'::jsonb, 2),
  (_topic_id, 20, 20, 3, 'Empty strings, 0, and None are "Falsy".', 'python', 'Which of these is considered `False` in a boolean context?', '["1", "[0]", "\"\"", "\"False\""]'::jsonb, 2),

  -- 21-25 Insane Beginner
  (_topic_id, 21, 21, 4, 'Multiple conditions are evaluated left-to-right but follow precedence.', 'python', 'What is the result of `10 > 5 and 5 > 10 or 3 == 3`?', '["True", "False", "None", "Error"]'::jsonb, 0),
  (_topic_id, 22, 22, 4, 'Slicing with step: "AbCdEf"[::2] -> "ACE".', 'python', 'What is `"Programming"[::3]`?', '["Pgmn", "Prg", "Pami", "rrmn"]'::jsonb, 2),
  (_topic_id, 23, 23, 4, 'Conditionals can use expressions as conditions.', 'python', 'What prints if `x = 10` and we run `if x % 2 == 0:`?', '["Nothing", "True", "It runs if x is even", "Error"]'::jsonb, 2),
  (_topic_id, 24, 24, 4, 'Boolean short-circuiting: `or` stops at the first True.', 'python', 'In `True or (1/0)`, does the error occur?', '["Yes, immediately", "No, because of short-circuiting", "Only on Thursdays", "Depends on Python version"]'::jsonb, 1),
  (_topic_id, 25, 25, 5, 'Mastery check: combined slice and conditional.', 'python', 'What prints? `s = "Recall"`; `if s[0] == "r": print("A") else: print("B")`', '["A", "B", "SyntaxError", "Recall"]'::jsonb, 1);

  -- 25 Coding Challenges
  INSERT INTO public.coding_questions (topic_id, difficulty, order_index, mastery_weight, explanation, language_id, title, problem_statement, example_input, example_output, starter_code, expected_output, hints, test_cases) VALUES
  -- 1-5 Very Easy
  (_topic_id, 1, 1, 2, 'type() identifies the data type.', 'python',
      'The Truth Finder',
      'Read a value from input. Check if it is a digit string. Use val = input(). Print the type of val. (Note: input always returns str).',
      '42',
      '<class ''str''>',
      'val = input()\n',
      '<class ''str''>\n',
      '["input() always returns a string.", "Use print(type(val))"]'::jsonb,
      '[{"input": "42\n", "expected": "<class ''str''>\\n"}]'::jsonb),

  (_topic_id, 2, 2, 2, 'int() conversion.', 'python',
      'The Converter',
      'Read a string from input. Convert it to an integer and print its value plus 10.',
      '5',
      '15',
      's = input()\n',
      '15\n',
      '["n = int(s)", "print(n + 10)"]'::jsonb,
      '[{"input": "5\n", "expected": "15\\n"}]'::jsonb),

  (_topic_id, 3, 3, 2, 'Comparison ==.', 'python',
      'Match Maker',
      'Read two strings from input (separate lines). Print True if they are identical, False otherwise.',
      'Hi\nHi',
      'True',
      'a = input()\ b = input()\n',
      'True\n',
      '["print(a == b)"]'::jsonb,
      '[{"input": "Hi\nHi\n", "expected": "True\\n"}, {"input": "Hi\nBye\n", "expected": "False\\n"}]'::jsonb),

  (_topic_id, 4, 4, 2, 'Basic if statement.', 'python',
      'Positive Vibe',
      'Read an integer from input. If it is greater than 0, print "Positive".',
      '7',
      'Positive',
      'n = int(input())\n',
      'Positive\n',
      '["if n > 0:", "  print(\"Positive\")"]'::jsonb,
      '[{"input": "7\n", "expected": "Positive\\n"}, {"input": "-1\n", "expected": ""}]'::jsonb),

  (_topic_id, 5, 5, 2, 'if-else fallback.', 'python',
      'Odd or Even',
      'Read an integer. Print "Even" if it is even, and "Odd" if it is odd. (Use n % 2 == 0).',
      '4',
      'Even',
      'n = int(input())\n',
      'Even\n',
      '["if n % 2 == 0:", "else:"]'::jsonb,
      '[{"input": "4\n", "expected": "Even\\n"}, {"input": "7\n", "expected": "Odd\\n"}]'::jsonb),

  -- 6-10 Easy
  (_topic_id, 6, 6, 2, 'Relational ops <, >.', 'python',
      'Age Filter',
      'Read an age (integer). If 18 or older, print "Adult". Otherwise print "Minor".',
      '20',
      'Adult',
      'age = int(input())\n',
      'Adult\n',
      '["Use >= 18 for adult."] '::jsonb,
      '[{"input": "20\n", "expected": "Adult\\n"}, {"input": "15\n", "expected": "Minor\\n"}]'::jsonb),

  (_topic_id, 7, 7, 2, 'Logical and.', 'python',
      'In Range',
      'Read an integer. Print True if it is between 1 and 100 (inclusive), False otherwise.',
      '50',
      'True',
      'n = int(input())\n',
      'True\n',
      '["n >= 1 and n <= 100"]'::jsonb,
      '[{"input": "50\n", "expected": "True\\n"}, {"input": "150\n", "expected": "False\\n"}]'::jsonb),

  (_topic_id, 8, 8, 2, 'Logical or.', 'python',
      'Weekend Vibe',
      'Read a day from input. If it is "Saturday" or "Sunday", print "Weekend". Otherwise print "Workday".',
      'Sunday',
      'Weekend',
      'day = input()\n',
      'Weekend\n',
      '["if day == \"Saturday\" or day == \"Sunday\":"]'::jsonb,
      '[{"input": "Sunday\n", "expected": "Weekend\\n"}, {"input": "Monday\n", "expected": "Workday\\n"}]'::jsonb),

  (_topic_id, 9, 9, 2, 'Logical not.', 'python',
      'Anti-Pattern',
      'Read a boolean string ("True" or "False"). Convert it to bool and print its opposite.',
      'True',
      'False',
      'val = input() == "True"\n',
      'False\n',
      '["print(not val)"]'::jsonb,
      '[{"input": "True\n", "expected": "False\\n"}, {"input": "False\n", "expected": "True\\n"}]'::jsonb),

  (_topic_id, 10, 10, 2, 'Basic elif.', 'python',
      'Grade Scout',
      'Read a score (0-100). If >= 90 print "A", elif >= 80 print "B", else print "C".',
      '85',
      'B',
      'score = int(input())\n',
      'B\n',
      '["Use if-elif-else."] '::jsonb,
      '[{"input": "95\n", "expected": "A\\n"}, {"input": "85\n", "expected": "B\\n"}, {"input": "70\n", "expected": "C\\n"}]'::jsonb),

  -- 11-15 Medium
  (_topic_id, 11, 11, 3, 'Slicing Basics.', 'python',
      'First Three',
      'Read a string. Print only its first three characters.',
      'Python',
      'Pyt',
      's = input()\n',
      'Pyt\n',
      '["s[0:3]"]'::jsonb,
      '[{"input": "Python\n", "expected": "Pyt\\n"}]'::jsonb),

  (_topic_id, 12, 12, 3, 'Slicing Endings.', 'python',
      'Last Three',
      'Read a string. Print only its last three characters.',
      'CodeRecall',
      'all',
      's = input()\n',
      'all\n',
      '["s[-3:]"]'::jsonb,
      '[{"input": "CodeRecall\n", "expected": "all\\n"}]'::jsonb),

  (_topic_id, 13, 13, 3, 'Type casting float to int.', 'python',
      'The Chopper',
      'Read a decimal number (float). Convert it to an integer (chopping off the decimal) and print it.',
      '3.99',
      '3',
      'f = float(input())\n',
      '3\n',
      '["int(f) removes the decimal part."] '::jsonb,
      '[{"input": "3.99\n", "expected": "3\\n"}]'::jsonb),

  (_topic_id, 14, 14, 3, 'Chained comparisons.', 'python',
      'Middle Child',
      'Read three integers (a, b, c). Print "Yes" if b is strictly between a and c (a < b < c). Otherwise "No".',
      '1\n5\n10',
      'Yes',
      'a = int(input())\nb = int(input())\nc = int(input())\n',
      'Yes\n',
      '["if a < b < c:"]'::jsonb,
      '[{"input": "1\n5\n10\n", "expected": "Yes\\n"}, {"input": "1a0\n5\n1\n", "expected": "No\\n"}]'::jsonb),

  (_topic_id, 15, 15, 3, 'String comparison case sensitivity.', 'python',
      'Identity Crisis',
      'Read a word. If it is exactly "PYTHON" (all caps), print "Upper". If "python" (all lower), print "Lower". Otherwise "Other".',
      'PYTHON',
      'Upper',
      'word = input()\n',
      'Upper\n',
      '["Strings are case sensitive."] '::jsonb,
      '[{"input": "PYTHON\n", "expected": "Upper\\n"}, {"input": "python\n", "expected": "Lower\\n"}]'::jsonb),

  -- 16-20 Hard
  (_topic_id, 16, 16, 4, 'Nested conditionals.', 'python',
      'VIP Access',
      'Read age (int) and has_ticket (boolean "True"/"False"). If age >= 18: if has_ticket is True print "Entry", else print "Buy Ticket". If age < 18: print "Too Young".',
      '20\nFalse',
      'Buy Ticket',
      'age = int(input())\nticket = input() == "True"\n',
      'Buy Ticket\n',
      '["Use an if inside an if."] '::jsonb,
      '[{"input": "20\nTrue\n", "expected": "Entry\\n"}, {"input": "20\nFalse\n", "expected": "Buy Ticket\\n"}, {"input": "15\nTrue\n", "expected": "Too Young\\n"}]'::jsonb),

  (_topic_id, 17, 17, 4, 'Reverse Slice.', 'python',
      'Mirror Mirror',
      'Read a string. Print the string reversed.',
      'Cool',
      'looC',
      's = input()\n',
      'looC\n',
      '["s[::-1] reverses a string."] '::jsonb,
      '[{"input": "Cool\n", "expected": "looC\\n"}]'::jsonb),

  (_topic_id, 18, 18, 4, 'Complex Logical Expression.', 'python',
      'Leap Year Lite',
      'Read a year. Print "Leap" if the year is divisible by 4 AND (not divisible by 100 OR divisible by 400). Otherwise "Normal".',
      '2000',
      'Leap',
      'year = int(input())\n',
      'Leap\n',
      '["(year % 4 == 0) and (year % 100 != 0 or year % 400 == 0)"]'::jsonb,
      '[{"input": "2000\n", "expected": "Leap\\n"}, {"input": "1900\n", "expected": "Normal\\n"}, {"input": "2024\n", "expected": "Leap\\n"}]'::jsonb),

  (_topic_id, 19, 19, 4, 'Slicing with Step.', 'python',
      'Secret Message',
      'Read a string. Print every second character starting from the first (index 0, 2, 4...).',
      'H-e-l-l-o',
      'Hello',
      's = input()\n',
      'Hello\n',
      '["s[::2] skips every other character."] '::jsonb,
      '[{"input": "H-e-l-l-o\n", "expected": "Hello\\n"}]'::jsonb),

  (_topic_id, 20, 20, 4, 'Type checking logic.', 'python',
      'Universal Validator',
      'Read a string. If it is numeric (use s.isdigit()), print "Number". If it is alphabetical (use s.isalpha()), print "Letter". Otherwise print "Mix".',
      '123',
      'Number',
      's = input()\n',
      'Number\n',
      '["Use .isdigit() and .isalpha()."] '::jsonb,
      '[{"input": "123\n", "expected": "Number\\n"}, {"input": "ABC\n", "expected": "Letter\\n"}, {"input": "1A\n", "expected": "Mix\\n"}]'::jsonb),

  -- 21-25 Insane Beginner Level
  (_topic_id, 21, 21, 5, 'Multi-stage decision tree.', 'python',
      'The Gatekeeper',
      'Read a username and a password. If username is "admin": if password is "1234" print "Welcome", else print "Wrong Pass". If username is not "admin" print "Unknown User".',
      'admin\n1234',
      'Welcome',
      'user = input()\npw = input()\n',
      'Welcome\n',
      '["Nested if structures are best here."] '::jsonb,
      '[{"input": "admin\n1234\n", "expected": "Welcome\\n"}, {"input": "admin\n0000\n", "expected": "Wrong Pass\\n"}, {"input": "guest\n1234\n", "expected": "Unknown User\\n"}]'::jsonb),

  (_topic_id, 22, 22, 5, 'Slicing and logic combo.', 'python',
      'Palindrome Check',
      'Read a string. Print "Palindrome" if it is the same forwards and backwards, otherwise "Regular". (Case sensitive).',
      'racecar',
      'Palindrome',
      's = input()\n',
      'Palindrome\n',
      '["if s == s[::-1]:"]'::jsonb,
      '[{"input": "racecar\n", "expected": "Palindrome\\n"}, {"input": "hello\n", "expected": "Regular\\n"}]'::jsonb),

  (_topic_id, 23, 23, 5, 'Type casting safety.', 'python',
      'Safe Addition',
      'Read two inputs. If both are digits, print their sum as an integer. If either is not a digit, print "Invalid".',
      '10\n20',
      '30',
      'a = input()\nb = input()\n',
      '30\n',
      '["Check .isdigit() for both before converting."] '::jsonb,
      '[{"input": "10\n20\n", "expected": "30\\n"}, {"input": "10\nHi\n", "expected": "Invalid\\n"}]'::jsonb),

  (_topic_id, 24, 24, 5, 'Advanced Slicing Logic.', 'python',
      'Middle Snipper',
      'Read a string. If its length is at least 3, print its content EXCEPT the first and last character. If length < 3, print "Short".',
      'Python',
      'ytho',
      's = input()\n',
      'ytho\n',
      '["s[1:-1] removes first and last."] '::jsonb,
      '[{"input": "Python\n", "expected": "ytho\\n"}, {"input": "Hi\n", "expected": "Short\\n"}]'::jsonb),

  (_topic_id, 25, 25, 5, 'Logical Conclusion.', 'python',
      'FizzBuzz Lite',
      'Read an integer. If divisible by 3 and 5 print "FizzBuzz". If only by 3 print "Fizz". If only by 5 print "Buzz". Else print the number itself.',
      '15',
      'FizzBuzz',
      'n = int(input())\n',
      'FizzBuzz\n',
      '["Order of if/elif matters! Check 3 and 5 first."] '::jsonb,
      '[{"input": "15\n", "expected": "FizzBuzz\\n"}, {"input": "9\n", "expected": "Fizz\\n"}, {"input": "10\n", "expected": "Buzz\\n"}, {"input": "7\n", "expected": "7\\n"}]'::jsonb);

END $$;
