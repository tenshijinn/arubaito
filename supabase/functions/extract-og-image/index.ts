import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching OG image for:', url);

    // Fetch the page with timeout (increased to 10s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Rotate user agents to avoid detection
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract OG image using regex
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    
    let ogImage = ogImageMatch ? ogImageMatch[1] : null;
    
    // Extract title as well for extra context
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    
    let ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;
    
    // Extract description
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                       html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
    
    let ogDescription = ogDescMatch ? ogDescMatch[1] : null;
    
    // Fallback to standard HTML title if no OG title
    if (!ogTitle) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      ogTitle = titleMatch ? titleMatch[1].trim() : null;
    }
    
    // Fallback to meta description if no OG description
    if (!ogDescription) {
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
      ogDescription = descMatch ? descMatch[1].trim() : null;
    }
    
    console.log(`Extraction result - Title: ${ogTitle ? '✓' : '✗'}, Description: ${ogDescription ? '✓' : '✗'}, Image: ${ogImage ? '✓' : '✗'}`);

    return new Response(
      JSON.stringify({
        og_image: ogImage,
        og_title: ogTitle,
        og_description: ogDescription,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error extracting OG image:', error);
    
    let errorType = 'UNKNOWN_ERROR';
    let errorMessage = 'Unknown error occurred';
    
    if (error.name === 'AbortError') {
      errorType = 'TIMEOUT';
      errorMessage = 'Request timed out after 10 seconds. The site may be slow or blocking requests.';
    } else if (error instanceof Error) {
      if (error.message.includes('403') || error.message.includes('401')) {
        errorType = 'BLOCKED';
        errorMessage = 'Access denied. The site is blocking automated requests (common with LinkedIn, Indeed).';
      } else if (error.message.includes('404')) {
        errorType = 'NOT_FOUND';
        errorMessage = 'URL not found (404). Please check the link is correct.';
      } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        errorType = 'SERVER_ERROR';
        errorMessage = 'The website is experiencing issues. Please try again later.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        errorType: errorType,
        og_image: null,
        og_title: null,
        og_description: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});