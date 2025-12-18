import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-n8n-signature',
};

interface JobSignal {
  role: string;
  skills: string[];
  seniority?: string;
  employment_type?: string;
  project?: string;
  apply_url?: string;
  fallback_url?: string;
  compensation?: string;
  timestamp?: string;
}

interface IngestPayload {
  signals: JobSignal[];
  source?: string;
}

// Generate a hash for deduplication
function generateSignalHash(signal: JobSignal): string {
  const normalized = `${signal.role?.toLowerCase() || ''}_${(signal.skills || []).sort().join(',').toLowerCase()}_${signal.project?.toLowerCase() || ''}_${signal.apply_url || signal.fallback_url || ''}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `x_signal_${Math.abs(hash).toString(36)}`;
}

// Map skills to role tags
function mapSkillsToRoleTags(skills: string[]): string[] {
  const roleTags: string[] = [];
  const skillsLower = skills.map(s => s.toLowerCase());
  
  if (skillsLower.some(s => s.includes('solidity') || s.includes('rust') || s.includes('typescript') || s.includes('smart contract') || s.includes('frontend') || s.includes('backend') || s.includes('fullstack'))) {
    roleTags.push('dev');
  }
  if (skillsLower.some(s => s.includes('design') || s.includes('ui') || s.includes('ux') || s.includes('figma'))) {
    roleTags.push('design');
  }
  if (skillsLower.some(s => s.includes('product') || s.includes('pm') || s.includes('roadmap'))) {
    roleTags.push('product');
  }
  if (skillsLower.some(s => s.includes('research') || s.includes('analyst') || s.includes('tokenomics'))) {
    roleTags.push('research');
  }
  if (skillsLower.some(s => s.includes('community') || s.includes('marketing') || s.includes('growth') || s.includes('social'))) {
    roleTags.push('community');
  }
  if (skillsLower.some(s => s.includes('ops') || s.includes('operations') || s.includes('hr') || s.includes('finance'))) {
    roleTags.push('ops');
  }
  
  return roleTags.length > 0 ? roleTags : ['dev']; // Default to dev if no match
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    const expectedApiKey = Deno.env.get('N8N_INGEST_API_KEY');
    
    if (!expectedApiKey || apiKey !== expectedApiKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: IngestPayload = await req.json();
    const { signals, source = 'x' } = payload;

    if (!signals || !Array.isArray(signals) || signals.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No signals provided', received: payload }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${signals.length} job signals from ${source}`);

    const results = {
      processed: 0,
      inserted: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    // Calculate TTL (14 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    for (const signal of signals) {
      try {
        results.processed++;

        // Validate required fields
        if (!signal.role) {
          results.errors.push(`Signal missing role: ${JSON.stringify(signal)}`);
          continue;
        }

        const externalId = generateSignalHash(signal);

        // Check for existing signal (deduplication)
        const { data: existing } = await supabase
          .from('jobs')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle();

        if (existing) {
          results.duplicates++;
          console.log(`Duplicate signal skipped: ${externalId}`);
          continue;
        }

        // Build job description from signal data
        const descriptionParts: string[] = [];
        if (signal.seniority) descriptionParts.push(`**Seniority:** ${signal.seniority}`);
        if (signal.employment_type) descriptionParts.push(`**Type:** ${signal.employment_type}`);
        if (signal.skills?.length) descriptionParts.push(`**Skills:** ${signal.skills.join(', ')}`);
        
        const description = descriptionParts.length > 0 
          ? descriptionParts.join('\n\n')
          : `${signal.role} position${signal.project ? ` at ${signal.project}` : ''}`;

        // Insert the job signal
        const { error: insertError } = await supabase
          .from('jobs')
          .insert({
            title: signal.role,
            description,
            company_name: signal.project || null,
            compensation: signal.compensation || null,
            role_tags: mapSkillsToRoleTags(signal.skills || []),
            link: signal.fallback_url || null,
            apply_url: signal.apply_url || null,
            source: 'x_signal',
            external_id: externalId,
            expires_at: expiresAt.toISOString(),
            employer_wallet: 'system_n8n_ingestion',
            payment_tx_signature: 'n8n_automated_signal',
            status: 'active',
          });

        if (insertError) {
          console.error(`Insert error for signal ${externalId}:`, insertError);
          results.errors.push(`Failed to insert ${signal.role}: ${insertError.message}`);
        } else {
          results.inserted++;
          console.log(`Inserted signal: ${signal.role} (${externalId})`);
        }

      } catch (signalError: unknown) {
        console.error('Error processing signal:', signalError);
        results.errors.push(`Processing error: ${signalError instanceof Error ? signalError.message : 'Unknown error'}`);
      }
    }

    console.log(`Ingestion complete: ${results.inserted} inserted, ${results.duplicates} duplicates, ${results.errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Ingestion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
