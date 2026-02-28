/**
 * Cloudflare Worker: Rate Limit Protection for AI-Context /generate Endpoint
 *
 * Purpose: Protect the /generate endpoint from resource exhaustion and abuse
 * - Limits to 100 requests per hour per client IP
 * - Returns 429 Too Many Requests when limit exceeded
 * - Stores rate limit state in Cloudflare KV namespace
 *
 * Deployment Instructions:
 * 1. Install Wrangler: npm install -g wrangler
 * 2. Authenticate: wrangler login
 * 3. Create KV namespace: wrangler kv:namespace create ai-context-rate-limit
 * 4. Update wrangler.toml with namespace ID from output above
 * 5. Deploy: wrangler deploy
 * 6. Update Traefik labels to route through this Worker (see README.md)
 *
 * KV Namespace Binding:
 * [[env.production.kv_namespaces]]
 * binding = "RATE_LIMIT_KV"
 * id = "your-namespace-id-here"
 */

const RATE_LIMIT_PER_HOUR = 100;
const CLEANUP_INTERVAL_MINUTES = 5;

/**
 * Main fetch handler - processes all requests to /generate
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // Only rate limit POST requests to /generate
      const url = new URL(request.url);
      if (request.method !== 'POST' || !url.pathname.startsWith('/generate')) {
        // Pass through non-protected paths
        return fetch(request);
      }

      // Extract client IP (handle CF-Connecting-IP header)
      const clientIP = request.headers.get('CF-Connecting-IP') ||
                       request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                       'unknown';

      // Check rate limit
      const rateLimitKey = `rate-limit:${clientIP}`;
      let rateLimitData = await env.RATE_LIMIT_KV.get(rateLimitKey, 'json');

      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      // Initialize or reset rate limit data
      if (!rateLimitData) {
        rateLimitData = {
          count: 0,
          firstRequestTime: now,
          lastResetTime: now,
          clientIP: clientIP
        };
      }

      // Reset counter if window has passed
      if (rateLimitData.firstRequestTime < oneHourAgo) {
        rateLimitData.count = 0;
        rateLimitData.firstRequestTime = now;
      }

      // Check if limit exceeded
      if (rateLimitData.count >= RATE_LIMIT_PER_HOUR) {
        console.log(`Rate limit exceeded for IP ${clientIP}: ${rateLimitData.count} requests`);

        // Return 429 Too Many Requests
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Maximum ${RATE_LIMIT_PER_HOUR} requests per hour allowed.`,
            retryAfter: Math.ceil((rateLimitData.firstRequestTime + 60 * 60 * 1000 - now) / 1000)
          }),
          {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': RATE_LIMIT_PER_HOUR.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(rateLimitData.firstRequestTime + 60 * 60 * 1000).toISOString(),
              'Retry-After': Math.ceil((rateLimitData.firstRequestTime + 60 * 60 * 1000 - now) / 1000).toString()
            }
          }
        );
      }

      // Increment counter
      rateLimitData.count++;
      rateLimitData.lastRequestTime = now;

      // Store updated rate limit data (expires in 1 hour + 5 minutes buffer)
      await env.RATE_LIMIT_KV.put(
        rateLimitKey,
        JSON.stringify(rateLimitData),
        { expirationTtl: 65 * 60 } // 65 minutes
      );

      // Forward request to origin with rate limit headers
      const response = await fetch(request);

      // Add rate limit headers to response
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit', RATE_LIMIT_PER_HOUR.toString());
      headers.set('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT_PER_HOUR - rateLimitData.count).toString());
      headers.set('X-RateLimit-Reset', new Date(rateLimitData.firstRequestTime + 60 * 60 * 1000).toISOString());

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });

    } catch (error) {
      console.error('Rate limit worker error:', error);
      // Fail open - allow request if worker fails
      return fetch(request);
    }
  }
};

/**
 * Scheduled handler - clean up expired entries (optional)
 * Can be triggered via Cron triggers in wrangler.toml
 */
export async function handleScheduled(event, env, ctx) {
  try {
    console.log('Starting rate limit cleanup...');
    // Cleanup is handled automatically by KV TTL expiration
    // This is optional for monitoring/logging
    console.log('Rate limit cleanup completed');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}
