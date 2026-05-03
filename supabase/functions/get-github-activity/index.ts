// Aggregates commit activity for the Arubaito repos.
// Caches in-memory for 1 hour to avoid GitHub rate limits.
// Uses GITHUB_TOKEN if available (5000/hr authenticated vs 60/hr).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPOS = ["tenshijinn/arubaito", "tenshijinn/askrei", "tenshijinn/zkprof"];
const DAYS = 182;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cache: { ts: number; data: Record<string, string[]> } | null = null;

async function fetchRepoCommits(repo: string, since: string, token?: string): Promise<string[]> {
  const dates: string[] = [];
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits?since=${since}&per_page=100&page=${page}`,
      { headers }
    );
    if (!res.ok) {
      console.warn(`[${repo}] page ${page} -> ${res.status}`);
      break;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    for (const c of data) {
      const d = c?.commit?.author?.date || c?.commit?.committer?.date;
      if (d) dates.push(d.slice(0, 10));
    }
    if (data.length < 100) break;
  }
  return dates;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const fresh = url.searchParams.get("fresh") === "1";

    const now = Date.now();
    if (!fresh && cache && now - cache.ts < CACHE_TTL_MS) {
      return new Response(
        JSON.stringify({ data: cache.data, cached: true, age_ms: now - cache.ts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = Deno.env.get("GITHUB_TOKEN");
    const since = new Date();
    since.setDate(since.getDate() - DAYS);
    const sinceIso = since.toISOString();

    const results = await Promise.all(
      REPOS.map(async (r) => [r, await fetchRepoCommits(r, sinceIso, token)] as const)
    );
    const map: Record<string, string[]> = {};
    for (const [name, dates] of results) map[name] = dates;

    cache = { ts: now, data: map };

    return new Response(
      JSON.stringify({ data: map, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("get-github-activity error", e);
    // Return cached data even if stale, on failure
    if (cache) {
      return new Response(
        JSON.stringify({ data: cache.data, cached: true, stale: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ data: {}, error: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
