// Shared school-admin authorization helper for edge functions.
//
// SECURITY: "admin" in Teachly is NOT a role column — it is ownership of a
// school_accounts row (admin_user_id). Every admin-gated function must:
//   1) require a Bearer JWT,
//   2) verify it via getClaims,
//   3) confirm the caller owns a school_accounts row,
// and then derive school_id SERVER-SIDE so a caller can never act on a school
// they don't own. This extracts the pattern previously inlined in
// send-invitation-email so all provisioning functions share one implementation.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface SchoolAdminContext {
  ok: true;
  userId: string;
  schoolId: string;
  schoolName: string;
  /** anon client carrying the caller's JWT (RLS applies as the caller). */
  callerClient: SupabaseClient;
  /** service-role client (bypasses RLS) for privileged writes. */
  adminClient: SupabaseClient;
}

export interface AuthFailure {
  ok: false;
  response: Response;
}

function jsonError(
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
  extra: Record<string, unknown> = {},
): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Verify the caller is a school admin. On success returns the caller's user id,
 * their school id/name, and ready-to-use Supabase clients. On failure returns a
 * fully-formed Response to return directly.
 */
export async function requireSchoolAdmin(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<SchoolAdminContext | AuthFailure> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, response: jsonError("Unauthorized", 401, corsHeaders) };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!serviceRoleKey) {
    console.error("[adminAuth] missing SUPABASE_SERVICE_ROLE_KEY");
    return { ok: false, response: jsonError("Server misconfiguration", 500, corsHeaders) };
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return { ok: false, response: jsonError("Invalid or expired token", 401, corsHeaders) };
  }

  const userId = claimsData.claims.sub as string;

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Authoritative admin check: caller must own a school_accounts row.
  const { data: schoolData, error: schoolError } = await adminClient
    .from("school_accounts")
    .select("id, school_name")
    .eq("admin_user_id", userId)
    .maybeSingle();

  if (schoolError || !schoolData) {
    return {
      ok: false,
      response: jsonError("Forbidden: only school admins can perform this action", 403, corsHeaders),
    };
  }

  return {
    ok: true,
    userId,
    schoolId: schoolData.id,
    schoolName: schoolData.school_name,
    callerClient,
    adminClient,
  };
}

/** Escape user-controlled strings before embedding them in HTML email bodies. */
export function sanitizeHtml(str: string, maxLen = 200): string {
  return (str || "")
    .substring(0, maxLen)
    .replace(/[<>"'&]/g, (c) =>
      ({ "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "&": "&amp;" }[c] || c),
    );
}
