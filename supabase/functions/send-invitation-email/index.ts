
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured. Please set the RESEND_API_KEY secret in Supabase.' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { invitationId, studentEmail, studentName, schoolName, invitationCode } = await req.json();

    // Validate required fields
    if (!studentEmail || !invitationCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: studentEmail and invitationCode' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailData = {
      from: 'Teachly <noreply@teachly.com>',
      to: [studentEmail],
      subject: `Invitation to join ${schoolName || 'your school'} on Teachly`,
      html: `
        <h1>Welcome to Teachly, ${studentName || 'Student'}!</h1>
        <p>You've been invited to join ${schoolName || 'your school'} on Teachly.</p>
        <p>Your invitation code is: <strong>${invitationCode}</strong></p>
        <p>Click the link below to accept your invitation and create your account:</p>
        <a href="${Deno.env.get('SITE_URL') || 'https://teachly.com'}/accept-invitation?code=${invitationCode}">Accept Invitation</a>
        <p>Best regards,<br>The Teachly Team</p>
      `,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Email service error: ${response.statusText}`,
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);

    return new Response(JSON.stringify({ 
      success: true,
      emailId: data.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-invitation-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
