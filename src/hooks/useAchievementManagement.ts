export type Achievement = {
  id: string;
  name: string;
  description?: string;
  type?: string;
  icon?: string;
  points?: number;
  criteria?: any;
  created_at?: string;
  creator_id?: string;
};

export const useAchievementManagement = () => {
  return {
    achievements: [] as Achievement[],
    createAchievement: async (_: Partial<Achievement>) => {},
    deleteAchievement: async (_id: string) => {},
  };
};