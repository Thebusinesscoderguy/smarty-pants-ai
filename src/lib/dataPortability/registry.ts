import { supabase } from '@/integrations/supabase/client';
import type { EntityDescriptor, EntityContext } from './types';

const safeUpsert = async (
  table: string,
  rows: any[],
  onConflict: string,
): Promise<{ inserted: number; errors: string[] }> => {
  if (!rows.length) return { inserted: 0, errors: ['No rows to import'] };
  const { error, data } = await (supabase as any).from(table).upsert(rows, { onConflict }).select('*');
  if (error) return { inserted: 0, errors: [error.message] };
  return { inserted: (data || rows).length, errors: [] };
};

export const ENTITIES: EntityDescriptor[] = [
  {
    key: 'teachers',
    label: 'Teachers',
    description: 'Staff teaching at the school',
    columns: [
      { key: 'email', label: 'Email', type: 'string', required: true, example: 'jane@school.edu' },
      { key: 'first_name', label: 'First Name', type: 'string', example: 'Jane' },
      { key: 'last_name', label: 'Last Name', type: 'string', example: 'Doe' },
      { key: 'is_active', label: 'Active', type: 'boolean', example: true },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await supabase.from('school_teachers').select('email,first_name,last_name,is_active').eq('school_id', schoolId);
      return data || [];
    },
    upsert: async (rows, { schoolId }) =>
      safeUpsert('school_teachers', rows.map(r => ({ ...r, school_id: schoolId })), 'school_id,email'),
  },
  {
    key: 'students',
    label: 'Students',
    description: 'Active students enrolled at the school',
    columns: [
      { key: 'student_id', label: 'Student ID', type: 'string', required: true },
      { key: 'display_name', label: 'Display Name', type: 'string' },
    ],
    fetch: async ({ schoolId }) => {
      const { data: rels } = await supabase.from('school_student_relationships')
        .select('student_id').eq('school_id', schoolId).eq('is_active', true);
      const ids = (rels || []).map((r: any) => r.student_id);
      if (!ids.length) return [];
      const { data } = await supabase.from('profiles').select('id, display_name').in('id', ids);
      return (data || []).map((d: any) => ({ student_id: d.id, display_name: d.display_name || '' }));
    },
    upsert: async () => ({ inserted: 0, errors: ['Students must be added via the Invite or Bulk Import flow (creates auth accounts).'] }),
  },
  {
    key: 'sections',
    label: 'Sections / Classes',
    description: 'Grade-level sections (classes)',
    columns: [
      { key: 'grade_level', label: 'Grade', type: 'number', required: true, example: 5 },
      { key: 'label', label: 'Section Label', type: 'string', required: true, example: 'A' },
      { key: 'capacity', label: 'Capacity', type: 'number', example: 30 },
      { key: 'room', label: 'Room', type: 'string', example: '101' },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await (supabase as any).from('school_sections')
        .select('grade_level,label,capacity,room').eq('school_id', schoolId);
      return data || [];
    },
    upsert: async (rows, { schoolId }) =>
      safeUpsert('school_sections', rows.map(r => ({ ...r, school_id: schoolId })), 'school_id,grade_level,label'),
  },
  {
    key: 'subjects',
    label: 'Subjects',
    description: 'Subjects taught at the school',
    columns: [
      { key: 'name', label: 'Name', type: 'string', required: true, example: 'Mathematics' },
      { key: 'code', label: 'Code', type: 'string', example: 'MATH' },
      { key: 'grade_level', label: 'Grade Level', type: 'number', example: 5 },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await (supabase as any).from('school_subjects')
        .select('name,code,grade_level').eq('school_id', schoolId);
      return data || [];
    },
    upsert: async (rows, { schoolId }) =>
      safeUpsert('school_subjects', rows.map(r => ({ ...r, school_id: schoolId })), 'school_id,name,grade_level'),
  },
  {
    key: 'attendance',
    label: 'Attendance',
    description: 'Daily attendance records',
    columns: [
      { key: 'attendance_date', label: 'Date', type: 'date', required: true, example: '2026-06-01' },
      { key: 'student_id', label: 'Student ID', type: 'string', required: true },
      { key: 'subject_id', label: 'Subject ID', type: 'string', required: true },
      { key: 'is_present', label: 'Present', type: 'boolean', example: true },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await (supabase as any).from('student_attendance')
        .select('attendance_date,student_id,subject_id,is_present').eq('school_id', schoolId).limit(5000);
      return data || [];
    },
    upsert: async (rows, { schoolId, userId }) =>
      safeUpsert('student_attendance',
        rows.map(r => ({ ...r, school_id: schoolId, created_by: userId })),
        'student_id,subject_id,attendance_date'),
  },
  {
    key: 'semester_marks',
    label: 'Semester Marks',
    description: 'Project / final exam marks per semester',
    columns: [
      { key: 'student_id', label: 'Student ID', type: 'string', required: true },
      { key: 'subject_id', label: 'Subject ID', type: 'string', required: true },
      { key: 'semester', label: 'Semester', type: 'enum', enumValues: ['S1', 'S2'], required: true, example: 'S1' },
      { key: 'project_mark', label: 'Project /10', type: 'number' },
      { key: 'final_exam_mark', label: 'Final Exam /20', type: 'number' },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await (supabase as any).from('student_semester_marks')
        .select('student_id,subject_id,semester,project_mark,final_exam_mark').eq('school_id', schoolId);
      return data || [];
    },
    upsert: async (rows, { schoolId, userId }) =>
      safeUpsert('student_semester_marks',
        rows.map(r => ({ ...r, school_id: schoolId, created_by: userId })),
        'student_id,subject_id,semester'),
  },
  {
    key: 'daily_grades',
    label: 'Daily Grades',
    description: 'Per-assessment scores',
    columns: [
      { key: 'student_id', label: 'Student ID', type: 'string', required: true },
      { key: 'subject_id', label: 'Subject ID', type: 'string', required: true },
      { key: 'grade_date', label: 'Date', type: 'date', required: true },
      { key: 'score', label: 'Score', type: 'number', required: true },
      { key: 'max_score', label: 'Max Score', type: 'number', example: 100 },
      { key: 'category', label: 'Category', type: 'string', example: 'Quiz' },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await (supabase as any).from('student_daily_grades')
        .select('student_id,subject_id,grade_date,score,max_score,category').eq('school_id', schoolId).limit(10000);
      return data || [];
    },
    upsert: async (rows, { schoolId, userId }) =>
      safeUpsert('student_daily_grades',
        rows.map(r => ({ ...r, school_id: schoolId, created_by: userId })),
        'student_id,subject_id,grade_date,category'),
  },
  {
    key: 'report_cards',
    label: 'Report Cards',
    description: 'Generated report cards (export only)',
    columns: [
      { key: 'student_id', label: 'Student ID', type: 'string', required: true },
      { key: 'term', label: 'Term', type: 'string', required: true },
      { key: 'academic_year', label: 'Year', type: 'string', required: true },
      { key: 'overall', label: 'Overall', type: 'number' },
      { key: 'attendance_rate', label: 'Attendance %', type: 'number' },
      { key: 'published', label: 'Published', type: 'boolean' },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await supabase.from('report_cards').select('*').eq('school_id', schoolId);
      return (data || []).map((d: any) => ({
        student_id: d.student_id, term: d.term, academic_year: d.academic_year,
        overall: d.data?.overall ?? null, attendance_rate: d.data?.attendance_rate ?? null,
        published: d.published,
      }));
    },
    upsert: async () => ({ inserted: 0, errors: ['Report cards are generated by the system, not imported.'] }),
  },
  {
    key: 'question_bank',
    label: 'Question Bank',
    description: 'Questions for assessments',
    columns: [
      { key: 'subject', label: 'Subject', type: 'string', required: true },
      { key: 'question_type', label: 'Type', type: 'enum', enumValues: ['multiple_choice', 'true_false', 'short_answer'], required: true },
      { key: 'question_text', label: 'Question', type: 'string', required: true },
      { key: 'correct_answer', label: 'Answer', type: 'string', required: true },
      { key: 'difficulty', label: 'Difficulty', type: 'enum', enumValues: ['easy', 'medium', 'hard'] },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await (supabase as any).from('question_bank')
        .select('subject,question_type,question_text,correct_answer,difficulty').eq('school_id', schoolId);
      return data || [];
    },
    upsert: async (rows, { schoolId, userId }) => {
      const inserts = rows.map(r => ({ ...r, school_id: schoolId, created_by: userId }));
      const { error, data } = await (supabase as any).from('question_bank').insert(inserts).select('*');
      if (error) return { inserted: 0, errors: [error.message] };
      return { inserted: (data || inserts).length, errors: [] };
    },
  },
  {
    key: 'invoices',
    label: 'Invoices',
    description: 'Student invoices',
    columns: [
      { key: 'student_id', label: 'Student ID', type: 'string', required: true },
      { key: 'amount', label: 'Amount', type: 'number', required: true },
      { key: 'due_date', label: 'Due Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'enum', enumValues: ['pending', 'paid', 'overdue', 'cancelled'] },
      { key: 'description', label: 'Description', type: 'string' },
    ],
    fetch: async ({ schoolId }) => {
      const { data } = await (supabase as any).from('school_invoices')
        .select('student_id,amount,due_date,status,description').eq('school_id', schoolId);
      return data || [];
    },
    upsert: async (rows, { schoolId }) => {
      const inserts = rows.map(r => ({ ...r, school_id: schoolId }));
      const { error, data } = await (supabase as any).from('school_invoices').insert(inserts).select('*');
      if (error) return { inserted: 0, errors: [error.message] };
      return { inserted: (data || inserts).length, errors: [] };
    },
  },
];

export const getEntity = (key: string) => ENTITIES.find(e => e.key === key);
