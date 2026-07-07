export const mockStudents = [
  { id: 'S101', name: 'Aiden Vance', grade: 'Grade 1', age: 6, guardian: 'David Vance (+1 555-0192)', status: 'Active', score: '88%', attendance: 'Present' },
  { id: 'S102', name: 'Sophia Chen', grade: 'Grade 2', age: 7, guardian: 'Jenny Chen (+1 555-0143)', status: 'Active', score: '94%', attendance: 'Present' },
  { id: 'S103', name: 'Lucas Martinez', grade: 'Nursery', age: 4, guardian: 'Maria Martinez (+1 555-0182)', status: 'Active', score: '78%', attendance: 'Late' },
  { id: 'S104', name: 'Harper Bennett', grade: 'Grade 3', age: 8, guardian: 'Clara Bennett (+1 555-0177)', status: 'Active', score: '82%', attendance: 'Present' },
  { id: 'S105', name: 'Oliver Taylor', grade: 'Grade 4', age: 9, guardian: 'Richard Taylor (+1 555-0155)', status: 'Inactive', score: 'N/A', attendance: 'Absent' },
  { id: 'S106', name: 'Emma Watson', grade: 'Grade 5', age: 10, guardian: 'Sarah Watson (+1 555-0121)', status: 'Active', score: '91%', attendance: 'Present' },
  { id: 'S107', name: 'Liam Neeson', grade: 'Grade 3', age: 8, guardian: 'John Neeson (+1 555-0130)', status: 'Active', score: '85%', attendance: 'Present' },
  { id: 'S108', name: 'Isabella Ross', grade: 'Nursery', age: 4, guardian: 'Peter Ross (+1 555-0199)', status: 'Active', score: '62%', attendance: 'Absent' },
];

export const mockTeachers = [
  { id: 'T201', name: 'Clarissa Mercer', email: 'clarissa.m@wisdomtree.edu', assignment: 'Grade 1 & 2 Math', status: 'Active', role: 'Teacher' },
  { id: 'T202', name: 'Jonathan Vance', email: 'j.vance@wisdomtree.edu', assignment: 'Nursery Reading', status: 'Active', role: 'Teacher' },
  { id: 'T203', name: 'Eleanor Vance', email: 'eleanor.v@wisdomtree.edu', assignment: 'Grade 4 & 5 Science', status: 'Active', role: 'Teacher' },
  { id: 'T204', name: 'Marcus Sterling', email: 'marcus.s@wisdomtree.edu', assignment: 'System Admin Console', status: 'Active', role: 'Administrator' },
];

export const mockClasses = [
  { id: 'C1', name: 'Nursery', studentsCount: 12, subjects: ['English Literacy', 'Numeracy Skills', 'Social Development'] },
  { id: 'C2', name: 'Grade 1', studentsCount: 15, subjects: ['Reading & Phonics', 'Basic Math', 'Environmental Studies'] },
  { id: 'C3', name: 'Grade 2', studentsCount: 18, subjects: ['English Grammar', 'Mathematics', 'General Science'] },
  { id: 'C4', name: 'Grade 3', studentsCount: 20, subjects: ['Comprehension', 'Advanced Math', 'Earth Sciences'] },
  { id: 'C5', name: 'Grade 4', studentsCount: 16, subjects: ['Writing Composition', 'Algebra Basics', 'Physics & Biology'] },
  { id: 'C6', name: 'Grade 5', studentsCount: 22, subjects: ['Literature Studies', 'Pre-Algebra', 'Chemistry Basics'] },
];

export const mockQuestions = [
  {
    id: 'Q301',
    grade: 'Nursery',
    subject: 'English Literacy',
    difficulty: 'Easy',
    text: 'Which letter makes the "ah" sound like in the word APPLE?',
    options: ['A', 'B', 'C', 'D'],
    correct: 'A',
    audioText: 'Hello there! Let’s find the right letter. Which letter makes the "ah" sound like in the word APPLE? Look at the options and choose the correct letter.'
  },
  {
    id: 'Q302',
    grade: 'Grade 1',
    subject: 'Basic Math',
    difficulty: 'Medium',
    text: 'What is the sum of 8 + 5?',
    options: ['11', '12', '13', '14'],
    correct: '13',
    audioText: 'Let’s calculate. What is the sum of 8 plus 5? Think about it, then select the number that represents the answer.'
  },
  {
    id: 'Q303',
    grade: 'Grade 2',
    subject: 'General Science',
    difficulty: 'Hard',
    text: 'Which of the following is a mammal?',
    options: ['Goldfish', 'Dolphin', 'Eagle', 'Frog'],
    correct: 'Dolphin',
    audioText: 'Here is a science question. Which of the following is a mammal? Goldfish, Dolphin, Eagle, or Frog? Choose the correct option.'
  },
  {
    id: 'Q304',
    grade: 'Grade 3',
    subject: 'Advanced Math',
    difficulty: 'Medium',
    text: 'Calculate: 6 multiplied by 8.',
    options: ['42', '46', '48', '54'],
    correct: '48',
    audioText: 'Solve this multiplication: What is 6 multiplied by 8? Look carefully at the numbers and tap the correct option.'
  },
  {
    id: 'Q305',
    grade: 'Grade 4',
    subject: 'Physics & Biology',
    difficulty: 'Hard',
    text: 'Which organ is responsible for pumping blood throughout the human body?',
    options: ['Lungs', 'Stomach', 'Heart', 'Brain'],
    correct: 'Heart',
    audioText: 'Let’s think about the human body. Which organ is responsible for pumping blood throughout the human body? Select the correct organ.'
  },
  {
    id: 'Q306',
    grade: 'Grade 5',
    subject: 'Chemistry Basics',
    difficulty: 'Hard',
    text: 'What is the chemical symbol for Water?',
    options: ['CO2', 'O2', 'H2O', 'NaCl'],
    correct: 'H2O',
    audioText: 'What is the chemical formula or symbol for water? Check the four options listed and make your choice.'
  }
];

export const mockActivityLog = [
  { id: 'act1', type: 'attendance', message: 'Attendance recorded for Grade 1 (14 present, 1 late, 0 absent)', user: 'Clarissa Mercer', time: '10 minutes ago' },
  { id: 'act2', type: 'assessment', message: 'Aiden Vance completed the Grade 1 Diagnostic Assessment', user: 'Clarissa Mercer', time: '1 hour ago' },
  { id: 'act3', type: 'question', message: 'Added new English Literacy question "Which letter..." to Nursery Bank', user: 'Administrator', time: '2 hours ago' },
  { id: 'act4', type: 'sync', message: 'Automated database synchronization completed successfully', user: 'System', time: 'Today, 8:00 AM' },
  { id: 'act5', type: 'student', message: 'Registered new student Harper Bennett in Grade 3', user: 'Administrator', time: 'Yesterday, 3:45 PM' }
];

export const mockPendingSync = [
  { type: 'Attendance', detail: 'Grade 1 Roster - July 5', date: 'Jul 5, 2026' },
  { type: 'Attendance', detail: 'Grade 2 Roster - July 5', date: 'Jul 5, 2026' },
  { type: 'Assessment', detail: 'Sophia Chen - Grade 2 Math Diagnostic', date: 'Jul 5, 2026' },
  { type: 'Assessment', detail: 'Lucas Martinez - Nursery English Diagnostic', date: 'Jul 5, 2026' },
  { type: 'Student Edit', detail: 'Sophia Chen - Updated contact details', date: 'Jul 5, 2026' }
];

export const mockStudentScores = [
  { id: '1', studentId: 'S101', studentName: 'Aiden Vance', subject: 'Basic Math', date: 'Jul 5, 2026', score: '3/3', performance: 'Exceeded Expectations' },
  { id: '2', studentId: 'S102', studentName: 'Sophia Chen', subject: 'Advanced Math', date: 'Jul 5, 2026', score: '2/3', performance: 'Met Expectations' },
  { id: '3', studentId: 'S103', studentName: 'Lucas Martinez', subject: 'English Literacy', date: 'Jul 4, 2026', score: '1/3', performance: 'Below Expectations' },
  { id: '4', studentId: 'S104', studentName: 'Harper Bennett', subject: 'Basic Math', date: 'Jul 3, 2026', score: '3/3', performance: 'Exceeded Expectations' },
  { id: '5', studentId: 'S106', studentName: 'Emma Watson', subject: 'Chemistry Basics', date: 'Jul 2, 2026', score: '2/3', performance: 'Met Expectations' }
];
