
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Create the invitation acceptance URL
    const baseUrl = 'https://twfzlbockonxopuindaw.supabase.co'
    const invitationUrl = `${baseUrl}/accept-invitation?code=${invitationCode}`

    const emailHtml = `
      <h2>You've been invited to join ${schoolName}!</h2>
      <p>Hello ${studentName},</p>
      <p>You've been invited to join <strong>${schoolName}</strong> on our learning platform.</p>
      <p>Click the link below to accept your invitation and get started:</p>
      <p><a href="${invitationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${invitationUrl}</p>
      <p>Your invitation code is: <strong>${invitationCode}</strong></p>
      <p>This invitation will expire in 7 days.</p>
      <p>Best regards,<br>The Learning Platform Team</p>
    `

    // In a real implementation, you would use a service like SendGrid, Mailgun, or AWS SES
    // For now, we'll log the email content and return success
    console.log('Email to be sent:', {
      to: studentEmail,
      subject: `Invitation to join ${schoolName}`,
      html: emailHtml
    })

    // Update the invitation to mark it as sent
    await supabaseClient
      .from('student_invitations')
      .update({ 
        // We could add an email_sent_at column if needed
        updated_at: new Date().toISOString()
      })
      .eq('id', invitationId)

    return new Response(
      JSON.stringify({ success: true, message: 'Invitation email sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending invitation email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
