import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { user, email_data } = body;
    
    console.log('Auth email request:', { 
      email: user.email, 
      type: email_data.email_action_type 
    });

    // Determine email subject and content based on action type
    let subject = '';
    let htmlContent = '';
    
    const siteUrl = email_data.site_url || Deno.env.get('SITE_URL') || 'https://teachly.com';
    const confirmUrl = `${siteUrl}/auth/confirm?token_hash=${email_data.token_hash}&type=${email_data.email_action_type}`;
    
    switch (email_data.email_action_type) {
      case 'signup':
        subject = 'Confirm your email for Teachly';
        htmlContent = `
          <h1>Welcome to Teachly!</h1>
          <p>Thank you for signing up. Please confirm your email address by clicking the link below:</p>
          <p><a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Confirm Email</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${confirmUrl}</p>
          <p style="margin-top: 20px; color: #999; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
        `;
        break;
        
      case 'recovery':
      case 'magiclink':
        subject = 'Reset your Teachly password';
        htmlContent = `
          <h1>Reset Your Password</h1>
          <p>You requested to reset your password for Teachly. Click the link below to set a new password:</p>
          <p><a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${confirmUrl}</p>
          <p style="margin-top: 20px; color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        `;
        break;
        
      case 'email_change':
        subject = 'Confirm your new email for Teachly';
        htmlContent = `
          <h1>Email Change Request</h1>
          <p>You requested to change your email address. Please confirm your new email by clicking the link below:</p>
          <p><a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Confirm New Email</a></p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${confirmUrl}</p>
          <p style="margin-top: 20px; color: #999; font-size: 12px;">If you didn't request this, please contact support immediately.</p>
        `;
        break;
        
      default:
        subject = 'Teachly Account Notification';
        htmlContent = `
          <h1>Account Notification</h1>
          <p>Please click the link below to continue:</p>
          <p><a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #FF6B35; color: white; text-decoration: none; border-radius: 5px;">Continue</a></p>
        `;
    }

    // Send email via Resend
    console.log('Sending email via Resend...');
    
    const { data, error } = await resend.emails.send({
      from: 'Teachly <onboarding@resend.dev>',
      to: [user.email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, emailId: data.id }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-auth-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
