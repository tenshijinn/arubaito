import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  job_id: string;
  job_title: string;
  telegram?: string;
  twitter?: string;
  cv_base64?: string;
  cv_filename?: string;
  cv_content_type?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const data: Payload = await req.json();
    if (!data.job_id || !data.job_title) {
      return new Response(JSON.stringify({ error: "Missing job info" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let cv_path: string | null = null;
    let cv_url: string | null = null;
    let cv_bytes: Uint8Array | null = null;

    if (data.cv_base64 && data.cv_filename) {
      const bin = atob(data.cv_base64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      cv_bytes = arr;
      const safe = data.cv_filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      cv_path = `${data.job_id}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("rei-contributor-files")
        .upload(cv_path, arr, {
          contentType: data.cv_content_type || "application/octet-stream",
          upsert: false,
        });
      if (upErr) {
        console.error("Upload error:", upErr);
      } else {
        const { data: signed } = await supabase.storage
          .from("rei-contributor-files")
          .createSignedUrl(cv_path, 60 * 60 * 24 * 30);
        cv_url = signed?.signedUrl ?? null;
      }
    }

    const { error: insErr } = await supabase
      .from("careers_applications")
      .insert({
        job_id: data.job_id,
        job_title: data.job_title,
        telegram: data.telegram || null,
        twitter: data.twitter || null,
        cv_path,
        cv_url,
      });

    if (insErr) {
      console.error("Insert error:", insErr);
      throw new Error(insErr.message);
    }

    const html = `
      <h2>New Careers Application</h2>
      <p><strong>Role:</strong> ${data.job_title}</p>
      <p><strong>Telegram:</strong> ${data.telegram || "—"}</p>
      <p><strong>Twitter:</strong> ${data.twitter || "—"}</p>
      <p><strong>CV:</strong> ${cv_url ? `<a href="${cv_url}">Download CV</a>` : "Not provided"}</p>
      <p><strong>Submitted:</strong> ${new Date().toISOString()}</p>
    `;

    const attachments = cv_bytes && data.cv_filename
      ? [{ filename: data.cv_filename, content: data.cv_base64 }]
      : undefined;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Arubaito Careers <onboarding@resend.dev>",
        to: ["rei@arubaito.app"],
        subject: `New Application: ${data.job_title}`,
        html,
        ...(attachments ? { attachments } : {}),
      }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      console.error("Resend error:", errTxt);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
