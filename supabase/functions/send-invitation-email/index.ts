import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth Check: Verify the caller is a school admin ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify the user is actually a school admin
    const { data: schoolData, error: schoolError } = await supabase
      .from('school_accounts')
      .select('id, school_name')
      .eq('admin_user_id', userId)
      .maybeSingle();

    if (schoolError || !schoolData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: only school admins can send invitations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Resend API key check ---
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured', type: 'configuration_error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { studentEmail, studentName, schoolName, invitationCode } = await req.json();

    if (!studentEmail || !invitationCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields', type: 'validation_error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize user-controlled inputs to prevent HTML injection / phishing
    const sanitize = (str: string) => str.replace(/[<>"'&]/g, (c) => ({
      '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;'
    }[c] || c));

    const safeName = sanitize((studentName || '').substring(0, 100));
    const safeSchoolName = sanitize((schoolName || schoolData.school_name || '').substring(0, 200));

    const siteUrl = Deno.env.get('SITE_URL') || 'https://smarty-pants-ai.lovable.app';
    const acceptLink = `${siteUrl}/accept-invitation?code=${encodeURIComponent(invitationCode)}`;

    const emailData = {
      from: 'Teachly <onboarding@resend.dev>',
      to: [studentEmail],
      subject: `You're invited to join ${safeSchoolName} on Teachly!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background: #ffffff; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #fff8f0; border-radius: 12px; padding: 32px; border: 1px solid #fed7aa;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Welcome to Teachly! 🎓</h1>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              Hi ${safeName || 'there'},
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              <strong>${safeSchoolName}</strong> has invited you to join their learning platform on Teachly.
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              Click the button below to create your account and start learning:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${acceptLink}" style="background: #f97316; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                Join & Create Account
              </a>
            </div>
            <p style="color: #888; font-size: 13px; margin-top: 24px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${acceptLink}" style="color: #f97316;">${acceptLink}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #fed7aa; margin: 24px 0;">
            <p style="color: #aaa; font-size: 12px;">The Teachly Team</p>
          </div>
        </body>
        </html>
      `,
    };

    const keyToUse = resendApiKey.replace(/\r\n/g, '').trim();

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyToUse}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Email service error: ${response.statusText}`, details: errorText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ success: true, emailId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-invitation-email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
