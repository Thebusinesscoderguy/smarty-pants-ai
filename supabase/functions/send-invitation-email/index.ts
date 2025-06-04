
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { invitationId, studentEmail, studentName, schoolName, invitationCode } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if Resend API key is available
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found, falling back to logging')
      
      // Create the invitation acceptance URL
      const baseUrl = Deno.env.get('SUPABASE_URL') || 'https://twfzlbockonxopuindaw.supabase.co'
      const invitationUrl = `${baseUrl.replace('supabase.co', 'lovableproject.com')}/accept-invitation?code=${invitationCode}`

      const emailContent = {
        to: studentEmail,
        subject: `Invitation to join ${schoolName}`,
        message: `Hello ${studentName}, you've been invited to join ${schoolName}! Use code: ${invitationCode} or visit: ${invitationUrl}`
      }
      
      console.log('Email content (API key missing):', emailContent)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invitation created but email not sent - RESEND_API_KEY required',
          emailContent 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey)

    // Create the invitation acceptance URL  
    const baseUrl = Deno.env.get('SUPABASE_URL') || 'https://twfzlbockonxopuindaw.supabase.co'
    const invitationUrl = `${baseUrl.replace('supabase.co', 'lovableproject.com')}/accept-invitation?code=${invitationCode}`

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You've been invited to join ${schoolName}!</h2>
        <p>Hello ${studentName},</p>
        <p>You've been invited to join <strong>${schoolName}</strong> on our learning platform.</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="margin-bottom: 15px;"><strong>Your invitation code:</strong></p>
          <div style="background-color: #fff; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; border: 2px solid #3b82f6;">
            ${invitationCode}
          </div>
        </div>
        
        <p>Click the link below to accept your invitation and get started:</p>
        <p style="margin: 20px 0;">
          <a href="${invitationUrl}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </p>
        
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;">${invitationUrl}</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This invitation will expire in 7 days.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          Best regards,<br>
          The ${schoolName} Learning Platform Team
        </p>
      </div>
    `

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'Learning Platform <onboarding@resend.dev>',
      to: [studentEmail],
      subject: `Invitation to join ${schoolName}`,
      html: emailHtml
    })

    if (emailResult.error) {
      console.error('Resend email error:', emailResult.error)
      throw new Error(`Failed to send email: ${emailResult.error.message}`)
    }

    console.log('Email sent successfully:', emailResult.data)

    // Update the invitation to mark it as sent
    await supabaseClient
      .from('student_invitations')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        emailId: emailResult.data?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending invitation email:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
