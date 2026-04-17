CREATE TABLE IF NOT EXISTS curriculum_frameworks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  name_en      TEXT NOT NULL,
  name_ar      TEXT,
  region       TEXT NOT NULL,
  description  TEXT,
  is_active    BOOLEAN DEFAULT true,
  is_custom    BOOLEAN DEFAULT false,
  school_id    UUID REFERENCES school_accounts(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS curriculum_subjects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES curriculum_frameworks(id) ON DELETE CASCADE,
  name_en      TEXT NOT NULL,
  name_ar      TEXT,
  code         TEXT,
  is_custom    BOOLEAN DEFAULT false,
  school_id    UUID REFERENCES school_accounts(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (framework_id, name_en)
);

CREATE TABLE IF NOT EXISTS curriculum_grade_levels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES curriculum_frameworks(id) ON DELETE CASCADE,
  label_en     TEXT NOT NULL,
  label_ar     TEXT,
  sort_order   INTEGER NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (framework_id, sort_order)
);

CREATE TABLE IF NOT EXISTS curriculum_units (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id   UUID NOT NULL REFERENCES curriculum_frameworks(id) ON DELETE CASCADE,
  subject_id     UUID NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  grade_level_id UUID NOT NULL REFERENCES curriculum_grade_levels(id) ON DELETE CASCADE,
  unit_number    INTEGER NOT NULL,
  title_en       TEXT NOT NULL,
  title_ar       TEXT,
  description    TEXT,
  topics         JSONB NOT NULL DEFAULT '[]',
  is_custom      BOOLEAN DEFAULT false,
  school_id      UUID REFERENCES school_accounts(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (subject_id, grade_level_id, unit_number)
);

CREATE TABLE IF NOT EXISTS school_curriculum_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID NOT NULL REFERENCES school_accounts(id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES curriculum_frameworks(id) ON DELETE CASCADE,
  is_primary   BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_id, framework_id)
);

CREATE TABLE IF NOT EXISTS content_curriculum_tags (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id         UUID NOT NULL,
  content_type       TEXT NOT NULL CHECK (content_type IN ('quiz','study_plan','homework','assessment','lesson_plan','presentation')),
  curriculum_unit_id UUID NOT NULL REFERENCES curriculum_units(id) ON DELETE CASCADE,
  school_id          UUID REFERENCES school_accounts(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (content_id, content_type, curriculum_unit_id)
);

CREATE INDEX IF NOT EXISTS idx_cu_framework  ON curriculum_units(framework_id);
CREATE INDEX IF NOT EXISTS idx_cu_subject    ON curriculum_units(subject_id);
CREATE INDEX IF NOT EXISTS idx_cu_grade      ON curriculum_units(grade_level_id);
CREATE INDEX IF NOT EXISTS idx_cct_content   ON content_curriculum_tags(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_cct_unit      ON content_curriculum_tags(curriculum_unit_id);
CREATE INDEX IF NOT EXISTS idx_scs_school    ON school_curriculum_settings(school_id);

ALTER TABLE curriculum_frameworks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_grade_levels    ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_units           ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_curriculum_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_curriculum_tags    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frameworks_read" ON curriculum_frameworks FOR SELECT TO authenticated USING (true);
CREATE POLICY "frameworks_insert" ON curriculum_frameworks FOR INSERT TO authenticated WITH CHECK (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "frameworks_update" ON curriculum_frameworks FOR UPDATE TO authenticated USING (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "frameworks_delete" ON curriculum_frameworks FOR DELETE TO authenticated USING (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "subjects_read" ON curriculum_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "subjects_insert" ON curriculum_subjects FOR INSERT TO authenticated WITH CHECK (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "subjects_update" ON curriculum_subjects FOR UPDATE TO authenticated USING (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "subjects_delete" ON curriculum_subjects FOR DELETE TO authenticated USING (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "grades_read" ON curriculum_grade_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "units_read" ON curriculum_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "units_insert" ON curriculum_units FOR INSERT TO authenticated WITH CHECK (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "units_update" ON curriculum_units FOR UPDATE TO authenticated USING (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "units_delete" ON curriculum_units FOR DELETE TO authenticated USING (is_custom = true AND school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "scs_read" ON school_curriculum_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "scs_write" ON school_curriculum_settings FOR ALL TO authenticated WITH CHECK (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "cct_read" ON content_curriculum_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "cct_insert" ON content_curriculum_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cct_delete" ON content_curriculum_tags FOR DELETE TO authenticated USING (school_id IN (SELECT id FROM school_accounts WHERE admin_user_id = auth.uid()));

CREATE OR REPLACE VIEW school_curriculum_coverage 
WITH (security_invoker = true) AS
SELECT
  scs.school_id,
  cf.name_en AS framework_name,
  cs.name_en AS subject_name,
  gl.label_en AS grade_label,
  gl.sort_order,
  cu.unit_number,
  cu.title_en AS unit_title,
  cu.title_ar AS unit_title_ar,
  COUNT(cct.id) AS content_count
FROM school_curriculum_settings scs
JOIN curriculum_frameworks cf ON cf.id = scs.framework_id
JOIN curriculum_units cu ON cu.framework_id = cf.id
JOIN curriculum_subjects cs ON cs.id = cu.subject_id
JOIN curriculum_grade_levels gl ON gl.id = cu.grade_level_id
LEFT JOIN content_curriculum_tags cct ON cct.curriculum_unit_id = cu.id AND cct.school_id = scs.school_id
GROUP BY scs.school_id, cf.name_en, cs.name_en, gl.label_en, gl.sort_order, cu.unit_number, cu.title_en, cu.title_ar
ORDER BY scs.school_id, cs.name_en, gl.sort_order, cu.unit_number;