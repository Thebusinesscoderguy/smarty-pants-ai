import { buildCorsHeaders } from "../_shared/cors.ts";
// Public endpoint: accepts Book a Demo form, stores in DB, emails the team.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

let corsHeaders = buildCorsHeaders();

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const NOTIFY_TO = 'aldawoodali50@gmail.com';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

Deno.serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const schoolName = String(body.schoolName || '').trim();
    const schoolSize = String(body.schoolSize || '').trim();
    const role = String(body.role || '').trim();
    const message = String(body.message || '').trim();

    // Validation
    if (!name || name.length > 200) {
      return new Response(JSON.stringify({ error: 'Invalid name' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: 'Message too long' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: inserted, error: insertErr } = await supabase
      .from('demo_requests')
      .insert({
        name, email,
        school_name: schoolName || null,
        school_size: schoolSize || null,
        role: role || null,
        message: message || null,
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('insert error', insertErr);
      return new Response(JSON.stringify({ error: 'Could not save request' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Email the team (best-effort, don't fail the request if email fails)
    try {
      const html = `<!doctype html><html><body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#f97316;">📞 New demo request</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#6b7280;">Name</td><td style="font-weight:600;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${schoolName ? `<tr><td style="padding:8px 0;color:#6b7280;">School</td><td>${escapeHtml(schoolName)}</td></tr>` : ''}
          ${schoolSize ? `<tr><td style="padding:8px 0;color:#6b7280;">Size</td><td>${escapeHtml(schoolSize)}</td></tr>` : ''}
          ${role ? `<tr><td style="padding:8px 0;color:#6b7280;">Role</td><td>${escapeHtml(role)}</td></tr>` : ''}
        </table>
        ${message ? `<div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:8px;"><p style="margin:0;color:#6b7280;font-size:12px;">Message</p><p style="margin:8px 0 0;white-space:pre-wrap;">${escapeHtml(message)}</p></div>` : ''}
        <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Request ID: ${inserted.id}</p>
      </body></html>`;

      await fetch(`${GATEWAY_URL}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: 'Teachly <noreply@teachlyai.com>',
          to: [NOTIFY_TO],
          reply_to: email,
          subject: `📞 Demo request: ${name}${schoolName ? ' · ' + schoolName : ''}`,
          html,
        }),
      });
    } catch (e) {
      console.error('notification email failed', e);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('handler error', e);
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
