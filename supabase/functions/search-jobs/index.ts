import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query?: string;
  roleTags?: string[];
  limit?: number;
}

interface JobResult {
  id: string;
  title: string;
  description: string;
  company_name: string;
  compensation: string;
  role_tags: string[];
  link: string;
  apply_url?: string;
  created_at: string;
  matchScore?: number;
}

interface TaskResult {
  id: string;
  title: string;
  description: string;
  company_name: string;
  compensation: string;
  role_tags: string[];
  link: string;
  created_at: string;
  matchScore?: number;
  type?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SearchRequest = await req.json();
    const { query, roleTags, limit = 5 } = body;

    console.log("Job search request:", { query, roleTags, limit });

    // Build the query
    let dbQuery = supabase
      .from("jobs")
      .select("id, title, description, company_name, compensation, role_tags, link, apply_url, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 20)); // Cap at 20

    // If role tags provided, filter by overlap
    if (roleTags && roleTags.length > 0) {
      dbQuery = dbQuery.overlaps("role_tags", roleTags);
    }

    const { data: jobs, error } = await dbQuery;

    if (error) {
      console.error("Search error:", error);
      throw error;
    }

    // If a text query is provided, score and sort by relevance
    let results: JobResult[] = (jobs || []) as JobResult[];

    if (query && query.trim()) {
      const queryLower = query.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter(Boolean);

      results = results.map((job) => {
        const titleLower = (job.title || "").toLowerCase();
        const descLower = (job.description || "").toLowerCase();
        const companyLower = (job.company_name || "").toLowerCase();
        const tagsLower = (job.role_tags || []).map((t: string) => t.toLowerCase());

        let score = 0;

        // Score based on term matches
        for (const term of queryTerms) {
          if (titleLower.includes(term)) score += 10;
          if (descLower.includes(term)) score += 3;
          if (companyLower.includes(term)) score += 5;
          if (tagsLower.some((t: string) => t.includes(term))) score += 7;
        }

        // Exact phrase match bonus
        if (titleLower.includes(queryLower)) score += 20;
        if (descLower.includes(queryLower)) score += 8;

        return { ...job, matchScore: score };
      });

      // Sort by score descending
      results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      // Only return jobs with some relevance if query provided
      results = results.filter((j) => (j.matchScore || 0) > 0);
    }

    // Also search tasks table
    let taskQuery = supabase
      .from("tasks")
      .select("id, title, description, company_name, compensation, role_tags, link, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 20));

    if (roleTags && roleTags.length > 0) {
      taskQuery = taskQuery.overlaps("role_tags", roleTags);
    }

    const { data: tasks, error: taskError } = await taskQuery;

    if (taskError) {
      console.error("Task search error:", taskError);
      // Don't throw, just log and continue with jobs
    }

    let taskResults: TaskResult[] = (tasks || []) as TaskResult[];

    if (query && query.trim() && taskResults.length > 0) {
      const queryLower = query.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter(Boolean);

      taskResults = taskResults.map((task) => {
        const titleLower = (task.title || "").toLowerCase();
        const descLower = (task.description || "").toLowerCase();
        const companyLower = (task.company_name || "").toLowerCase();
        const tagsLower = (task.role_tags || []).map((t: string) => t.toLowerCase());

        let score = 0;

        for (const term of queryTerms) {
          if (titleLower.includes(term)) score += 10;
          if (descLower.includes(term)) score += 3;
          if (companyLower.includes(term)) score += 5;
          if (tagsLower.some((t: string) => t.includes(term))) score += 7;
        }

        if (titleLower.includes(queryLower)) score += 20;
        if (descLower.includes(queryLower)) score += 8;

        return { ...task, matchScore: score, type: "task" };
      });

      taskResults = taskResults.filter((t) => (t.matchScore || 0) > 0);
    }

    // Combine and format results
    const jobsFormatted = results.slice(0, limit).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company_name,
      compensation: j.compensation,
      roleTags: j.role_tags,
      link: j.apply_url || j.link,
      matchScore: j.matchScore || 0,
      type: "job",
    }));

    const tasksFormatted = taskResults.slice(0, limit).map((t) => ({
      id: t.id,
      title: t.title,
      company: t.company_name,
      compensation: t.compensation,
      roleTags: t.role_tags,
      link: t.link,
      matchScore: t.matchScore || 0,
      type: "task",
    }));

    // Merge and sort by score
    const combined = [...jobsFormatted, ...tasksFormatted]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    console.log(`Found ${combined.length} results for query: "${query}"`);

    return new Response(
      JSON.stringify({
        jobs: combined,
        totalJobs: jobsFormatted.length,
        totalTasks: tasksFormatted.length,
        query: query || null,
        roleTags: roleTags || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search jobs error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
