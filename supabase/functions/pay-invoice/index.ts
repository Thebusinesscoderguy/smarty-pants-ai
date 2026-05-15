import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
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

    // Authorize: parent of the invoice, parent of the student, or the student
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

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({
        message: 'Online payments are not yet enabled by your school. Please contact the school office to pay this invoice.',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Stripe Checkout via REST
    const origin = req.headers.get('origin') || 'https://teachlyai.com';
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${origin}/invoices?paid=${invoiceId}`);
    params.append('cancel_url', `${origin}/invoices?cancelled=1`);
    params.append('customer_email', user.email || '');
    params.append('client_reference_id', invoiceId);
    params.append('metadata[invoice_id]', invoiceId);
    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', inv.currency || 'usd');
    params.append('line_items[0][price_data][unit_amount]', String(inv.amount_cents));
    params.append('line_items[0][price_data][product_data][name]', inv.title);
    if (inv.description) {
      params.append('line_items[0][price_data][product_data][description]', String(inv.description).slice(0, 500));
    }

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    const session = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: session?.error?.message || 'Stripe error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('school_invoices').update({ stripe_session_id: session.id }).eq('id', invoiceId);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
