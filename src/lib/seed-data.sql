-- Session 1: Python Foundations (Python)
INSERT INTO public.topics (title, description, "order", slug)
VALUES (
    'Python Foundations',
    'Python Session 1 — print(), math, variables, strings, len(), indexing. Beginner onboarding path.',
    1,
    'programming-foundations'
)
ON CONFLICT (slug) DO NOTHING;

-- Get the Topic ID
DO $$
DECLARE
    _topic_id UUID;
    _easy_id UUID;
BEGIN
    SELECT id INTO _topic_id FROM public.topics WHERE slug = 'programming-foundations';
    IF _topic_id IS NULL THEN
        SELECT id INTO _topic_id FROM public.topics WHERE slug = 'python-basics';
    END IF;

    -- Rename legacy card title if it exists
    UPDATE public.topics SET title = 'Python Fundamentals' WHERE slug = 'python-basics';

    -- Insert Levels
    INSERT INTO public.levels (topic_id, title, difficulty, "order", mastery_weight)
    VALUES 
        (_topic_id, 'Getting Started', 'easy', 1, 1),
        (_topic_id, 'Intermediate Syntax', 'medium', 2, 2),
        (_topic_id, 'Advanced Basics', 'hard', 3, 3)
    ON CONFLICT (topic_id, difficulty) DO NOTHING;

    SELECT id INTO _easy_id FROM public.levels WHERE topic_id = _topic_id AND difficulty = 'easy';

    -- Insert 10 MCQs for Easy Level
    INSERT INTO public.questions (level_id, type, "order", title, content)
    VALUES 
        (_easy_id, 'mcq', 1, 'Variable Types', '{"question": "What is the output of print(type(5))?", "options": ["<class ''float''>", "<class ''int''>", "<class ''str''>", "<class ''bool''>"], "answer": 1}'),
        (_easy_id, 'mcq', 2, 'User Input', '{"question": "Which function is used to get input from the user?", "options": ["get()", "input()", "read()", "scan()"], "answer": 1}'),
        (_easy_id, 'mcq', 3, 'Comments', '{"question": "How do you start a comment in Python?", "options": ["//", "/*", "#", "--"], "answer": 2}'),
        (_easy_id, 'mcq', 4, 'Variable Names', '{"question": "Which of these is a valid variable name?", "options": ["2myvar", "my-var", "my_var", "my var"], "answer": 2}'),
        (_easy_id, 'mcq', 5, 'String Concatenation', '{"question": "What is the output of print(''Hello'' + ''World'')?", "options": ["Hello World", "HelloWorld", "Hello+World", "Error"], "answer": 1}'),
        (_easy_id, 'mcq', 6, 'Booleans', '{"question": "Which data type is used for true/false values?", "options": ["int", "str", "bool", "float"], "answer": 2}'),
        (_easy_id, 'mcq', 7, 'Floor Division', '{"question": "What is the output of print(10 // 3)?", "options": ["3.33", "3", "4", "3.0"], "answer": 1}'),
        (_easy_id, 'mcq', 8, 'Function Keyword', '{"question": "Which keyword is used to define a function?", "options": ["func", "function", "def", "define"], "answer": 2}'),
        (_easy_id, 'mcq', 9, 'List Creation', '{"question": "Which is the correct way to create a list?", "options": ["(1, 2, 3)", "{1, 2, 3}", "[1, 2, 3]", "<1, 2, 3>"], "answer": 2}'),
        (_easy_id, 'mcq', 10, 'String Length', '{"question": "What is the output of len(''Python'')?", "options": ["5", "6", "7", "Error"], "answer": 1}');

    -- Insert 10 Coding Questions for Easy Level
    INSERT INTO public.questions (level_id, type, "order", title, content)
    VALUES 
        (_easy_id, 'coding', 11, 'Hello World', '{"description": "Print ''Hello, World!'' to the console.", "initial": "# Write your code here\n", "solution": "print(''Hello, World!'')", "tests": [{"input": "", "output": "Hello, World!\\n"}]}'),
        (_easy_id, 'coding', 12, 'Simple Variable', '{"description": "Create a variable named x with the value 10 and print it.", "initial": "# Write your code here\n", "solution": "x = 10\nprint(x)", "tests": [{"input": "", "output": "10\\n"}]}'),
        (_easy_id, 'coding', 13, 'Addition', '{"description": "Add 5 and 7, then print the result.", "initial": "# Write your code here\n", "solution": "print(5 + 7)", "tests": [{"input": "", "output": "12\\n"}]}'),
        (_easy_id, 'coding', 14, 'Dynamic Greeting', '{"description": "Use input() to get the user''s name and print ''Hello '' followed by their name.", "initial": "name = input()\\n# Print greeting here\\n", "solution": "name = input()\\nprint(''Hello '' + name)", "tests": [{"input": "Alice", "output": "Hello Alice\\n"}]}'),
        (_easy_id, 'coding', 15, 'Area of Square', '{"description": "A square has a side of 5. Calculate and print its area.", "initial": "side = 5\\n# Calculate area\\n", "solution": "side = 5\\nprint(side * side)", "tests": [{"input": "", "output": "25\\n"}]}'),
        (_easy_id, 'coding', 16, 'Variable Swap', '{"description": "Swap the values of a and b.", "initial": "a = 5\\nb = 10\\n# Swap them\\n", "solution": "a = 5\\nb = 10\\na, b = b, a\\nprint(a, b)", "tests": [{"input": "", "output": "10 5\\n"}]}'),
        (_easy_id, 'coding', 17, 'Positive Check', '{"description": "Print True if 10 is greater than 0, otherwise False.", "initial": "# Write your code here\\n", "solution": "print(10 > 0)", "tests": [{"input": "", "output": "True\\n"}]}'),
        (_easy_id, 'coding', 18, 'C to F', '{"description": "Convert 25 Celsius to Fahrenheit (C * 9/5 + 32) and print.", "initial": "c = 25\\n# Convert\\n", "solution": "c = 25\\nprint(c * 9/5 + 32)", "tests": [{"input": "", "output": "77.0\\n"}]}'),
        (_easy_id, 'coding', 19, 'Square of Number', '{"description": "Print the square of 8.", "initial": "# Write your code here\\n", "solution": "print(8 ** 2)", "tests": [{"input": "", "output": "64\\n"}]}'),
        (_easy_id, 'coding', 20, 'Concatenation', '{"description": "Join ''Python'' and ''Rocks'' with a space and print.", "initial": "a = ''Python''\\nb = ''Rocks''\\n# Join them\\n", "solution": "a = ''Python''\\nb = ''Rocks''\\nprint(a + '' '' + b)", "tests": [{"input": "", "output": "Python Rocks\\n"}]}');
END $$;
