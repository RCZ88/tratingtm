export const DEPARTMENTS = [
  'Mathematics',
  'Sciences',
  'Homeroom',
  'Electives',
  'Humanities',
  'Languages',
];

export const SUBJECTS_BY_DEPARTMENT: Record<string, string[]> = {
  Mathematics: [
    'Math',
    'MAA SL',
    'MAA HL',
    'MAI SL',
    'Maths Extended',
    'Maths Standard',
  ],
  Sciences: ['Science', 'Physics', 'Chemistry', 'ESS', 'Biology'],
  Homeroom: ['Design', 'Care', 'CE (Catholic Education)', 'PE (Physical Education)', 'PKN'],
  Electives: ['Computer Science', 'Visual Arts', 'Music'],
  Humanities: ['Psychology', 'Geography', 'Business', 'Economics'],
  Languages: [
    'English',
    'Bahasa Indonesia (BI)',
    'BI SL',
    'BI HL',
    'ELL',
    'ELA',
  ],
};

export const LEVELS = ['SL', 'HL'];
