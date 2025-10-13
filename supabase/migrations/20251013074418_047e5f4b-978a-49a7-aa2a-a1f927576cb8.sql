-- Event-driven quest progression system with AI classification

-- 1. Create quest_events table to log all user actions
CREATE TABLE IF NOT EXISTS public.quest_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL, -- 'quiz', 'study_plan', 'chat', 'lesson'
  event_type text NOT NULL, -- 'quiz_completed', 'lesson_completed', 'chat_message', 'study_step_completed'
  subject_id uuid REFERENCES public.subjects(id),
  score numeric,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedup_hash text UNIQUE,
  status text NOT NULL DEFAULT 'pending', -- pending | classified | ignored | failed
  classification_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX idx_quest_events_user_status ON public.quest_events(user_id, status);
CREATE INDEX idx_quest_events_created_at ON public.quest_events(created_at DESC);

-- 2. Create ai_event_classifications table for AI decisions
CREATE TABLE IF NOT EXISTS public.ai_event_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.quest_events(id) ON DELETE CASCADE,
  model text NOT NULL,
  verdict text NOT NULL, -- 'match' | 'no_match' | 'needs_review'
  matched_quests uuid[] NOT NULL DEFAULT '{}'::uuid[],
  increments jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_classifications_event ON public.ai_event_classifications(event_id);

-- 3. Create quest_event_links to track event-quest connections
CREATE TABLE IF NOT EXISTS public.quest_event_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.quest_events(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  increment numeric NOT NULL DEFAULT 1,
  applied boolean NOT NULL DEFAULT false,
  applied_at timestamptz,
  UNIQUE(event_id, quest_id)
);

CREATE INDEX idx_quest_event_links_event ON public.quest_event_links(event_id);
CREATE INDEX idx_quest_event_links_quest ON public.quest_event_links(quest_id);

-- 4. Add foreign key from quest_events to ai_event_classifications
ALTER TABLE public.quest_events 
ADD CONSTRAINT fk_quest_events_classification 
FOREIGN KEY (classification_id) REFERENCES public.ai_event_classifications(id) ON DELETE SET NULL;

-- 5. RLS Policies for quest_events
ALTER TABLE public.quest_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
ON public.quest_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
ON public.quest_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service can update events"
ON public.quest_events
FOR UPDATE
TO authenticated
USING (true);

-- 6. RLS Policies for ai_event_classifications (service-only write, user readonly)
ALTER TABLE public.ai_event_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage classifications"
ON public.ai_event_classifications
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view classifications for their events"
ON public.ai_event_classifications
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.quest_events
  WHERE quest_events.id = ai_event_classifications.event_id
  AND quest_events.user_id = auth.uid()
));

-- 7. RLS Policies for quest_event_links (service-only write, user readonly)
ALTER TABLE public.quest_event_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage event links"
ON public.quest_event_links
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view links for their events"
ON public.quest_event_links
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.quest_events
  WHERE quest_events.id = quest_event_links.event_id
  AND quest_events.user_id = auth.uid()
));