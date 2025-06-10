
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("PayPal checkout function started");

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    console.log("User authenticated:", user.email);

    // Parse request body
    const { planType } = await req.json();
    if (!planType) throw new Error("Plan type is required");

    console.log("Plan type:", planType);

    // Get PayPal credentials
    const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID");
    const paypalSecret = Deno.env.get("PAYPAL_SECRET_KEY");
    
    if (!paypalClientId || !paypalSecret) {
      throw new Error("PayPal credentials not configured");
    }

    // Get PayPal access token
    const authResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Language": "en_US",
        "Authorization": `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      throw new Error("Failed to get PayPal access token");
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    console.log("PayPal access token obtained");

    // Define pricing based on plan type
    let priceAmount: string;
    let productName: string;
    let productDescription: string;
    
    if (planType === 'individual') {
      priceAmount = "16.00";
      productName = "Teachly Individual Plan";
      productDescription = "Full access to all Teachly features for individual learners";
    } else if (planType === 'business') {
      priceAmount = "25.00";
      productName = "Teachly Business Plan";
      productDescription = "Multi-user management and advanced features for teams";
    } else {
      throw new Error("Invalid plan type");
    }

    // Create PayPal subscription plan
    const subscriptionData = {
      plan_id: `TEACHLY_${planType.toUpperCase()}_PLAN`,
      start_time: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
      subscriber: {
        email_address: user.email,
      },
      application_context: {
        brand_name: "Teachly",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: `${req.headers.get("origin")}/pricing?success=true`,
        cancel_url: `${req.headers.get("origin")}/pricing?canceled=true`,
      },
    };

    // Create the subscription
    const subscriptionResponse = await fetch("https://api-m.sandbox.paypal.com/v1/billing/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "PayPal-Request-Id": `${user.id}-${Date.now()}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error("PayPal subscription creation failed:", errorData);
      throw new Error("Failed to create PayPal subscription");
    }

    const subscription = await subscriptionResponse.json();
    console.log("PayPal subscription created:", subscription.id);

    // Find the approval URL
    const approvalUrl = subscription.links?.find((link: any) => link.rel === "approve")?.href;
    
    if (!approvalUrl) {
      throw new Error("No approval URL returned from PayPal");
    }

    return new Response(JSON.stringify({ url: approvalUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("PayPal checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
