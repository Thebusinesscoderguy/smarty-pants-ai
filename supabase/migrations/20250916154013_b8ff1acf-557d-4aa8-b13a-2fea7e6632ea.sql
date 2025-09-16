-- Drop achievement-related tables
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- Drop the achievement_type enum if it exists
DROP TYPE IF EXISTS achievement_type CASCADE;