import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

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
    const hookSecret = Deno.env.get('AUTH_HOOK_SECRET');
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify webhook signature if secret is set
    if (hookSecret) {
      const payload = await req.text();
      const headers = Object.fromEntries(req.headers);
      const wh = new Webhook(hookSecret);
      
      try {
        wh.verify(payload, headers);
      } catch (err) {
        console.error('Webhook verification failed:', err);
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

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
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Teachly <teachlyai.com@gmail.com>',
        to: [user.email],
        subject: subject,
        html: htmlContent,
      }),
    });

    console.log('Resend API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
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
