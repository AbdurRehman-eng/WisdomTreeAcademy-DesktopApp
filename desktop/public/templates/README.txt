WISDOM TREE ACADEMY — Question Bank CSV Import Template
========================================================

This file explains the format required to bulk-import questions
into the Wisdom Tree Academy question bank.

HOW TO IMPORT
-------------
1. Open the desktop application and navigate to "Question Bank".
2. Click the "Import CSV Template" button.
3. Select your completed CSV file.
4. The application will validate and import all rows automatically.

HOW TO GET THE TEMPLATE
-----------------------
Click "Get Template" on the Question Bank page to download
the file "sample_questions.csv" as a starting point.

CSV FORMAT (required columns in order)
---------------------------------------
Column 1:  class         — Grade level. Must be one of:
                           Nursery, Grade 1, Grade 2, Grade 3,
                           Grade 4, Grade 5
Column 2:  subject       — Subject name. Examples:
                           English, Mathematics, Science
Column 3:  text          — The question text displayed to the student.
Column 4:  option_a      — Text for answer choice A.
Column 5:  option_b      — Text for answer choice B.
Column 6:  option_c      — Text for answer choice C.
Column 7:  option_d      — Text for answer choice D.
Column 8:  correct_answer — The letter of the correct option: A, B, C, or D.
Column 9:  audio_text    — The text read aloud to the student via TTS.
                           If left blank, the question text is used.

RULES
-----
- The first row must be the header row (already included in the template).
- Do not leave the class, text, options, or correct_answer columns blank.
- correct_answer must be exactly A, B, C, or D (uppercase).
- Use commas to separate columns. If a cell contains a comma, wrap
  the cell content in double-quotes.
- Encoding: UTF-8

EXAMPLE ROW
-----------
Grade 1,Mathematics,What is 2 + 2?,2,3,4,5,C,"What is 2 plus 2?"
