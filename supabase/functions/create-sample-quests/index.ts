import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Sample quests to create
    const sampleQuests = [
      {
        title: "Daily Learner",
        description: "Send 5 messages to your AI tutor today",
        type: "daily",
        difficulty: "easy",
        target_value: 5,
        created_by: "system",
        rewards: { points: 50, badge: "Daily Learner" },
        requirements: { type: "message_count" }
      },
      {
        title: "Study Streak",
        description: "Study for 30 minutes this week",
        type: "weekly", 
        difficulty: "medium",
        target_value: 30,
        created_by: "system",
        rewards: { points: 100, badge: "Study Champion" },
        requirements: { type: "study_time" }
      },
      {
        title: "Quiz Master",
        description: "Complete 3 quizzes with good scores",
        type: "milestone",
        difficulty: "medium",
        target_value: 3,
        created_by: "system",
        rewards: { points: 150, badge: "Quiz Master" },
        requirements: { type: "quiz_completion" }
      },
      {
        title: "Learning Explorer",
        description: "Ask 10 questions to your AI tutor",
        type: "milestone",
        difficulty: "easy",
        target_value: 10,
        created_by: "system",
        rewards: { points: 75, badge: "Curious Mind" },
        requirements: { type: "question_count" }
      }
    ];

    // Sample achievements to create
    const sampleAchievements = [
      {
        name: "First Steps",
        description: "Complete your first learning session",
        type: "milestone",
        points: 25,
        icon: "🎯",
        criteria: { requirement: "first_session" }
      },
      {
        name: "Dedicated Student",
        description: "Study for 7 days in a row",
        type: "streak",
        points: 200,
        icon: "🔥",
        criteria: { requirement: "7_day_streak" }
      },
      {
        name: "Knowledge Seeker",
        description: "Ask 50 questions total",
        type: "completion",
        points: 150,
        icon: "❓",
        criteria: { requirement: "50_questions" }
      },
      {
        name: "Quiz Champion", 
        description: "Score 90% or higher on 5 quizzes",
        type: "mastery",
        points: 300,
        icon: "🏆",
        criteria: { requirement: "high_quiz_scores" }
      }
    ];

    // Insert sample quests
    const { data: questData, error: questError } = await supabase
      .from('quests')
      .upsert(sampleQuests, { 
        onConflict: 'title',
        ignoreDuplicates: false 
      })
      .select();

    if (questError) {
      console.error('Error creating quests:', questError);
      throw questError;
    }

    // Insert sample achievements
    const { data: achievementData, error: achievementError } = await supabase
      .from('achievements')
      .upsert(sampleAchievements, { 
        onConflict: 'name',
        ignoreDuplicates: false 
      })
      .select();

    if (achievementError) {
      console.error('Error creating achievements:', achievementError);
      throw achievementError;
    }

    console.log('Sample data created successfully:', {
      quests: questData?.length || 0,
      achievements: achievementData?.length || 0
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Sample quests and achievements created successfully',
      data: {
        quests: questData?.length || 0,
        achievements: achievementData?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in create-sample-quests function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});