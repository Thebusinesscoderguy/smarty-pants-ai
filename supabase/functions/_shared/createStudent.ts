// Shared student-account provisioning used by admin-create-student and
// admin-bulk-create-students. Creates a PRE-CONFIRMED auth account with an
// admin-set or auto-generated password, assigns the student role, and enrolls
// the student in the school. Service-role client only (bypasses RLS).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generatePassword } from "./tokens.ts";

const MIN_PASSWORD_LEN = 8;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface CreateStudentInput {
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  password?: string;
  section_id?: string;
}

export interface CreateStudentResult {
  email: string;
  status: "created" | "failed";
  password?: string;   // only present when created (so the admin can distribute it)
  generated?: boolean; // true when the password was auto-generated
  user_id?: string;
  error?: string;
  code?: string;
}

export async function createStudentAccount(
  admin: SupabaseClient,
  schoolId: string,
  input: CreateStudentInput,
): Promise<CreateStudentResult> {
  const email = (input.email || "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { email: input.email || "", status: "failed", error: "Invalid email", code: "invalid_email" };
  }
  if (!(input.last_name || "").trim()) {
    return { email, status: "failed", error: "Last name is required", code: "missing_last_name" };
  }

  // Password: admin override if valid, else auto-generate.
  let password = (input.password || "").trim();
  let generated = false;
  if (password) {
    if (password.length < MIN_PASSWORD_LEN) {
      return { email, status: "failed", error: `Password must be at least ${MIN_PASSWORD_LEN} characters`, code: "weak_password" };
    }
  } else {
    password = generatePassword();
    generated = true;
  }

  // Block duplicates up front for a clean message.
  const { data: exists, error: existsErr } = await admin.rpc("email_has_account", { _email: email });
  if (existsErr) {
    return { email, status: "failed", error: "Could not verify email", code: "error" };
  }
  if (exists === true) {
    return { email, status: "failed", error: "This email already has an account", code: "email_exists" };
  }

  const fullName = [input.first_name, input.middle_name, input.last_name].filter(Boolean).join(" ").trim() || null;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : {},
  });

  if (createErr || !created?.user) {
    const msg = (createErr?.message || "").toLowerCase();
    if (msg.includes("already") && (msg.includes("registered") || msg.includes("exist"))) {
      return { email, status: "failed", error: "This email already has an account", code: "email_exists" };
    }
    console.error("[createStudent] createUser error:", createErr?.message);
    return { email, status: "failed", error: "Could not create account", code: "error" };
  }

  const userId = created.user.id;

  // The handle_new_user trigger already set user_roles='student'; ensure
  // profiles.role and display_name are correct.
  await admin
    .from("profiles")
    .update({ role: "student", display_name: fullName, onboarding_completed: true, updated_at: new Date().toISOString() })
    .eq("id", userId);

  // Enroll in the school.
  const { error: enrollErr } = await admin
    .from("school_student_relationships")
    .insert({ school_id: schoolId, student_id: userId, is_active: true });
  if (enrollErr) console.error("[createStudent] enroll error:", enrollErr.message);

  // Optional section assignment.
  if (input.section_id) {
    const { error: secErr } = await admin
      .from("section_students")
      .insert({ section_id: input.section_id, student_id: userId });
    if (secErr) console.error("[createStudent] section assign error:", secErr.message);
  }

  return { email, status: "created", password, generated, user_id: userId };
}

/** Remaining student capacity for a school (limit - active enrollments). null = unlimited/unknown error. */
export async function remainingStudentCapacity(admin: SupabaseClient, schoolId: string): Promise<number | null> {
  const { data: school } = await admin
    .from("school_accounts")
    .select("student_limit")
    .eq("id", schoolId)
    .maybeSingle();
  if (!school) return null;
  const { count } = await admin
    .from("school_student_relationships")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("is_active", true);
  return Math.max(0, (school.student_limit ?? 0) - (count ?? 0));
}
