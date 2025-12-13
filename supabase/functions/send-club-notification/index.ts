import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "supperclub_interest" | "whitelist_request";
  email?: string;
  twitter_handle?: string;
  display_name?: string;
  profile_image_url?: string;
  x_user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    console.log("Received notification request:", data);

    let subject: string;
    let html: string;

    if (data.type === "supperclub_interest") {
      if (!data.email) {
        throw new Error("Email is required for supperclub interest");
      }
      
      subject = "New Cypherpunk Supperclub Interest";
      html = `
        <h2>New Supperclub Interest Registration</h2>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Registered at:</strong> ${new Date().toISOString()}</p>
        <hr />
        <p>This person has expressed interest in the Cypherpunk Supperclub event.</p>
      `;
    } else if (data.type === "whitelist_request") {
      subject = "New Twitter Whitelist Request";
      html = `
        <h2>New Whitelist Request</h2>
        <p><strong>Twitter Handle:</strong> @${data.twitter_handle || "Unknown"}</p>
        <p><strong>Display Name:</strong> ${data.display_name || "Unknown"}</p>
        <p><strong>X User ID:</strong> ${data.x_user_id || "Unknown"}</p>
        ${data.profile_image_url ? `<p><strong>Profile Image:</strong> <img src="${data.profile_image_url}" width="48" height="48" /></p>` : ""}
        <p><strong>Requested at:</strong> ${new Date().toISOString()}</p>
        <hr />
        <p>Please review this whitelist request in the admin panel.</p>
      `;
    } else {
      throw new Error("Invalid notification type");
    }

    // Send email using Resend API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Arubaito <onboarding@resend.dev>",
        to: ["rei@arubaito.app"],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-club-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
