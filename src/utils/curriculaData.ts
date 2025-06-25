
// Comprehensive curricula data based on major educational systems worldwide
export interface Curriculum {
  id: string;
  title: string;
  description: string;
  gradeLevel: string;
  subjects: string[];
  standards: string[];
  country: string;
  system: string;
}

export const curricula: Curriculum[] = [
  // United States - Common Core
  {
    id: 'us-common-core-k5',
    title: 'Common Core State Standards (K-5)',
    description: 'Comprehensive elementary education standards focusing on English Language Arts and Mathematics with cross-curricular connections.',
    gradeLevel: 'K-5',
    subjects: ['Mathematics', 'English Language Arts', 'Science', 'Social Studies'],
    standards: ['CCSS.MATH.CONTENT', 'CCSS.ELA-LITERACY', 'NGSS'],
    country: 'United States',
    system: 'Common Core'
  },
  {
    id: 'us-common-core-6-12',
    title: 'Common Core State Standards (6-12)',
    description: 'Advanced secondary education standards with emphasis on critical thinking, problem-solving, and college readiness.',
    gradeLevel: '6-12',
    subjects: ['Advanced Mathematics', 'Literature & Composition', 'Physics', 'Chemistry', 'Biology', 'History', 'Economics'],
    standards: ['CCSS.MATH.CONTENT.HSA', 'CCSS.ELA-LITERACY.RST', 'NGSS.HS'],
    country: 'United States',
    system: 'Common Core'
  },

  // International Baccalaureate
  {
    id: 'ib-pyp',
    title: 'IB Primary Years Programme (PYP)',
    description: 'Inquiry-based learning framework for students aged 3-12, developing international-mindedness and critical thinking skills.',
    gradeLevel: 'K-5',
    subjects: ['Mathematics', 'Language', 'Science', 'Social Studies', 'Arts', 'Physical Education'],
    standards: ['IB-PYP-MATH', 'IB-PYP-LANG', 'IB-PYP-SCI', 'IB-PYP-SOC'],
    country: 'International',
    system: 'International Baccalaureate'
  },
  {
    id: 'ib-myp',
    title: 'IB Middle Years Programme (MYP)',
    description: 'Comprehensive curriculum encouraging students to make practical connections between studies and the real world.',
    gradeLevel: '6-10',
    subjects: ['Mathematics', 'Language & Literature', 'Sciences', 'Individuals & Societies', 'Arts', 'Physical & Health Education', 'Design'],
    standards: ['IB-MYP-MATH', 'IB-MYP-LANG', 'IB-MYP-SCI', 'IB-MYP-IND'],
    country: 'International',
    system: 'International Baccalaureate'
  },
  {
    id: 'ib-dp',
    title: 'IB Diploma Programme (DP)',
    description: 'Rigorous pre-university curriculum leading to internationally recognized qualifications.',
    gradeLevel: '11-12',
    subjects: ['Mathematics', 'Language A', 'Language B', 'Sciences', 'Individuals & Societies', 'Arts'],
    standards: ['IB-DP-MATH-AA', 'IB-DP-LANG-A', 'IB-DP-PHY', 'IB-DP-CHEM', 'IB-DP-BIO'],
    country: 'International',
    system: 'International Baccalaureate'
  },

  // United Kingdom
  {
    id: 'uk-national-curriculum-ks1-2',
    title: 'UK National Curriculum (Key Stages 1-2)',
    description: 'Statutory curriculum for maintained schools in England covering core subjects and foundation subjects.',
    gradeLevel: 'Ages 5-11',
    subjects: ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Art & Design', 'Music', 'PE'],
    standards: ['NC-MATH-KS1', 'NC-ENG-KS1', 'NC-SCI-KS2', 'NC-HIST-KS2'],
    country: 'United Kingdom',
    system: 'National Curriculum'
  },
  {
    id: 'uk-gcse',
    title: 'GCSE Curriculum',
    description: 'General Certificate of Secondary Education qualifications for students aged 14-16.',
    gradeLevel: 'Ages 14-16',
    subjects: ['Mathematics', 'English Language', 'English Literature', 'Sciences', 'History', 'Geography', 'Modern Languages'],
    standards: ['GCSE-MATH-H', 'GCSE-ENG-LANG', 'GCSE-SCI-COMB', 'GCSE-HIST'],
    country: 'United Kingdom',
    system: 'GCSE'
  },

  // Cambridge International
  {
    id: 'cambridge-primary',
    title: 'Cambridge Primary Programme',
    description: 'International curriculum for learners aged 5-11 developing essential skills in English, Mathematics, and Science.',
    gradeLevel: 'Ages 5-11',
    subjects: ['English', 'Mathematics', 'Science', 'ICT', 'Art & Design', 'Music', 'Physical Education'],
    standards: ['CP-ENG-0844', 'CP-MATH-0845', 'CP-SCI-0846'],
    country: 'International',
    system: 'Cambridge'
  },
  {
    id: 'cambridge-igcse',
    title: 'Cambridge IGCSE',
    description: 'International General Certificate of Secondary Education for students aged 14-16.',
    gradeLevel: 'Ages 14-16',
    subjects: ['Mathematics', 'English First Language', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'],
    standards: ['IGCSE-MATH-0580', 'IGCSE-EFL-0500', 'IGCSE-PHY-0625', 'IGCSE-CHEM-0620'],
    country: 'International',
    system: 'Cambridge IGCSE'
  },

  // Australian Curriculum
  {
    id: 'australia-f-6',
    title: 'Australian Curriculum (Foundation-Year 6)',
    description: 'National curriculum for Australian primary schools focusing on literacy, numeracy, and general capabilities.',
    gradeLevel: 'F-6',
    subjects: ['English', 'Mathematics', 'Science', 'Humanities & Social Sciences', 'The Arts', 'Technologies', 'Health & PE'],
    standards: ['AC-ENG-F-6', 'AC-MATH-F-6', 'AC-SCI-F-6', 'AC-HASS-F-6'],
    country: 'Australia',
    system: 'Australian Curriculum'
  },

  // French System
  {
    id: 'france-primaire',
    title: 'École Primaire (French Primary)',
    description: 'French national curriculum for primary education emphasizing French language, mathematics, and civic education.',
    gradeLevel: 'CP-CM2',
    subjects: ['Français', 'Mathématiques', 'Sciences', 'Histoire-Géographie', 'Arts', 'EPS', 'Anglais'],
    standards: ['FR-FRAN-PRIM', 'FR-MATH-PRIM', 'FR-SCI-PRIM'],
    country: 'France',
    system: 'Éducation Nationale'
  }
];

export const getCurriculaByGradeLevel = (gradeLevel: string) => {
  return curricula.filter(curriculum => 
    curriculum.gradeLevel.toLowerCase().includes(gradeLevel.toLowerCase())
  );
};

export const getCurriculaByCountry = (country: string) => {
  return curricula.filter(curriculum => 
    curriculum.country.toLowerCase().includes(country.toLowerCase())
  );
};

export const getCurriculaBySubject = (subject: string) => {
  return curricula.filter(curriculum => 
    curriculum.subjects.some(s => s.toLowerCase().includes(subject.toLowerCase()))
  );
};
