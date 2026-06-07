// Stub kept for backward compatibility after curriculum feature removal.
export interface Curriculum {
  id: string;
  title: string;
  description?: string;
  content?: any;
  grade_level?: string;
  subject_id?: string;
  is_active?: boolean;
  created_at?: string;
}

export const useCurriculumManagement = () => {
  return {
    curricula: [] as Curriculum[],
    createCurriculum: async (_data: Partial<Curriculum>) => null,
    deleteCurriculum: async (_id: string) => null,
    isLoading: false,
  };
};
