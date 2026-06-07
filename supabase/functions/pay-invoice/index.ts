import { buildCorsHeaders } from "../_shared/cors.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

// SECURITY (CORS): origin allowlist via shared helper (was wildcard '*').
let corsHeaders = buildCorsHeaders();

const PAYPAL_BASE = 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(clientId: string, secret: string) {
  const resp = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) throw new Error('Failed to get PayPal access token');
  const data = await resp.json();
  return data.access_token as string;
}

Deno.serve(async (req) => {
  corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supaUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supaUser.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const invoiceId = body.invoice_id;
    if (!invoiceId || typeof invoiceId !== 'string') {
      return new Response(JSON.stringify({ error: 'invoice_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: inv, error: invErr } = await admin.from('school_invoices')
      .select('*').eq('id', invoiceId).maybeSingle();
    if (invErr || !inv) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let allowed = inv.parent_id === user.id || inv.student_id === user.id;
    if (!allowed) {
      const { data: rel } = await admin.from('parent_child_relationships')
        .select('id').eq('parent_id', user.id).eq('child_id', inv.student_id).maybeSingle();
      allowed = !!rel;
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (inv.status === 'paid') {
      return new Response(JSON.stringify({ message: 'Already paid' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalSecret = Deno.env.get('PAYPAL_SECRET_KEY');
    if (!paypalClientId || !paypalSecret) {
      return new Response(JSON.stringify({
        message: 'Online payments are not yet enabled by your school. Please contact the school office to pay this invoice.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const accessToken = await getPayPalAccessToken(paypalClientId, paypalSecret);

    const origin = req.headers.get('origin') || 'https://teachlyai.com';
    const currency = (inv.currency || 'usd').toUpperCase();
    const amountValue = (Number(inv.amount_cents) / 100).toFixed(2);

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: invoiceId,
        description: String(inv.title || 'School invoice').slice(0, 127),
        custom_id: invoiceId,
        amount: {
          currency_code: currency,
          value: amountValue,
        },
      }],
      application_context: {
        brand_name: 'Teachly',
        user_action: 'PAY_NOW',
        shipping_preference: 'NO_SHIPPING',
        return_url: `${origin}/invoices?paid=${invoiceId}`,
        cancel_url: `${origin}/invoices?cancelled=1`,
      },
    };

    const orderResp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${invoiceId}-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });
    const order = await orderResp.json();
    if (!orderResp.ok) {
      // SECURITY (info disclosure): log the raw PayPal order response server-side;
      // never return it (`details: order`) to the client.
      console.error('[pay-invoice] PayPal order error:', orderResp.status, order);
      return new Response(JSON.stringify({ error: 'Payment could not be started. Please try again.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const approvalUrl = order.links?.find((l: any) => l.rel === 'approve')?.href;
    if (!approvalUrl) {
      return new Response(JSON.stringify({ error: 'No PayPal approval URL returned' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('school_invoices')
      .update({ stripe_session_id: order.id })
      .eq('id', invoiceId);

    return new Response(JSON.stringify({ url: approvalUrl }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
