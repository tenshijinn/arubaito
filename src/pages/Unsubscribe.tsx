import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import arubaitoLogo from "@/assets/arubaito-logo-black.png";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "loading" | "ready" | "success" | "invalid" | "already" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setState("invalid");
        return;
      }

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`, {
          headers: { apikey: supabaseAnonKey },
        });
        const result = await response.json().catch(() => ({}));

        if (response.ok && result.valid) {
          setState("ready");
          return;
        }

        if (result.reason === "already_unsubscribed") {
          setState("already");
          return;
        }

        setState("invalid");
      } catch {
        setState("error");
      }
    };

    validate();
  }, [token]);

  const handleConfirm = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });

      if (error) throw error;
      if (data?.reason === "already_unsubscribed") {
        setState("already");
        return;
      }
      if (!data?.success) throw new Error("Unable to update email preference");
      setState("success");
    } catch {
      setState("error");
    }
  };

  const copy = {
    loading: { title: "Checking link", body: "Validating your email preference request." },
    ready: { title: "Unsubscribe from app emails", body: "You’ll stop receiving non-essential one-to-one updates from Arubaito." },
    success: { title: "You’re unsubscribed", body: "Your email preference has been updated." },
    invalid: { title: "Invalid link", body: "This unsubscribe link is missing or expired." },
    already: { title: "Already unsubscribed", body: "This email address has already been removed from app emails." },
    error: { title: "Something went wrong", body: "Please try the link again in a moment." },
  }[state];

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: "#f5ead7" }}>
      <Link to="/" className="fixed top-4 left-4 flex items-center gap-2 z-50">
        <img src={arubaitoLogo} alt="Arubaito" className="h-14 w-auto object-contain" />
      </Link>

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md border p-6 md:p-8 space-y-5" style={{ borderColor: "#181818", color: "#181818", fontFamily: "Consolas, monospace" }}>
          <div className="space-y-2">
            <h1 className="text-xl font-bold uppercase tracking-wide">{copy.title}</h1>
            <p className="text-sm leading-relaxed">{copy.body}</p>
          </div>

          {state === "ready" && (
            <Button
              onClick={handleConfirm}
              className="rounded-full px-6 border-0 hover:opacity-90"
              style={{ backgroundColor: "#ed565a", color: "#faf1e1" }}
            >
              Confirm unsubscribe
            </Button>
          )}

          <Link to="/" className="inline-block text-sm underline" style={{ color: "#181818" }}>
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
