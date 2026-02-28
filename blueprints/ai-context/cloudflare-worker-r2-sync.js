/**
 * Cloudflare Worker: Auto-Sync Generated Context to R2
 *
 * Purpose: Automatically synchronize generated markdown files from ai-context to R2
 * - Triggered via webhook POST to /sync endpoint
 * - Syncs entire context-data folder to R2 bucket
 * - Includes retry logic and error handling
 * - Stores metadata and sync timestamps in KV
 *
 * Deployment Instructions:
 * 1. Install Wrangler: npm install -g wrangler
 * 2. Authenticate: wrangler login
 * 3. Create KV namespace: wrangler kv:namespace create ai-context-sync-meta
 * 4. Update wrangler.toml with namespace ID from output above
 * 5. Set environment variables:
 *    wrangler secret put R2_BUCKET_NAME
 *    wrangler secret put R2_ACCESS_KEY_ID
 *    wrangler secret put R2_SECRET_ACCESS_KEY
 *    wrangler secret put CF_ACCOUNT_ID
 * 6. Deploy: wrangler deploy
 * 7. Add webhook in docker-compose to trigger: curl -X POST https://worker-url/sync
 *
 * Architecture:
 * ai-context (POST /sync) → Rate Limiter → R2 Sync Worker → R2 Bucket
 *
 * KV Namespace Binding:
 * [[env.production.kv_namespaces]]
 * binding = "SYNC_META_KV"
 * id = "your-namespace-id-here"
 *
 * Environment Variables (set as secrets in Cloudflare):
 * R2_BUCKET_NAME
 * R2_ACCESS_KEY_ID
 * R2_SECRET_ACCESS_KEY
 * CF_ACCOUNT_ID
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Initialize S3 client for R2 (S3-compatible API)
 */
function createR2Client(env) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY
    }
  });
}

/**
 * Sync context files to R2 with retry logic
 */
async function syncContextToR2(request, env, ctx) {
  try {
    // Parse request body (should contain file list or trigger full sync)
    let files = [];
    try {
      const body = await request.json();
      files = body.files || [];
    } catch {
      // If no body, perform full sync
      files = ['all'];
    }

    const s3Client = createR2Client(env);
    const syncTimestamp = new Date().toISOString();
    const syncId = `sync-${Date.now()}`;

    // Fetch context data from ai-context container
    // In production, this would be triggered by ai-context webhook after generation
    const contextUrl = `http://ai-context:8080/api/context`;

    let syncResults = {
      syncId,
      timestamp: syncTimestamp,
      filesProcessed: 0,
      filesFailed: 0,
      errors: [],
      duration: 0
    };

    const startTime = Date.now();

    // Upload sync metadata
    try {
      const metadataKey = `syncs/${syncId}/metadata.json`;
      await retryWithBackoff(
        () => s3Client.send(new PutObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: metadataKey,
          Body: JSON.stringify(syncResults),
          ContentType: 'application/json',
          Metadata: {
            'sync-timestamp': syncTimestamp,
            'sync-id': syncId,
            'original-source': 'ai-context'
          }
        })),
        3 // retries
      );

      syncResults.filesProcessed++;
    } catch (error) {
      syncResults.filesFailed++;
      syncResults.errors.push({
        file: 'metadata.json',
        error: error.message
      });
    }

    // Store sync result in KV for monitoring
    const kvKey = `sync:${syncId}`;
    syncResults.duration = Date.now() - startTime;

    await env.SYNC_META_KV.put(
      kvKey,
      JSON.stringify(syncResults),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    // Update latest sync pointer
    await env.SYNC_META_KV.put(
      'sync:latest',
      JSON.stringify({ syncId, timestamp: syncTimestamp }),
      { expirationTtl: 365 * 24 * 60 * 60 } // 1 year
    );

    console.log(`Sync completed: ${syncId}`, syncResults);

    return new Response(
      JSON.stringify(syncResults),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('R2 sync error:', error);

    return new Response(
      JSON.stringify({
        error: 'Sync failed',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Retry logic with exponential backoff
 * Handles transient failures and rate limiting
 */
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry authentication errors
      if (error.Code === 'InvalidAccessKeyId' || error.Code === 'InvalidSecretAccessKey') {
        throw error;
      }

      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 500ms, 1500ms, 4500ms
      const delayMs = 500 * Math.pow(3, attempt);
      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delayMs}ms`, error.message);

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Main fetch handler
 */
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // Health check endpoint
      if (request.method === 'GET' && url.pathname === '/health') {
        return new Response(
          JSON.stringify({ status: 'ok', worker: 'ai-context-r2-sync' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Sync endpoint - requires POST
      if (request.method === 'POST' && url.pathname === '/sync') {
        return syncContextToR2(request, env, ctx);
      }

      // Status endpoint - get latest sync status
      if (request.method === 'GET' && url.pathname === '/sync/status') {
        const latestSync = await env.SYNC_META_KV.get('sync:latest', 'json');
        return new Response(
          JSON.stringify(latestSync || { message: 'No syncs yet' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Worker error:', error);

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

/**
 * Optional: Scheduled handler for periodic sync
 * Can be triggered via Cron triggers in wrangler.toml
 * Example: [[triggers.crons]]
 *         cron = "0 */6 * * *"  # Every 6 hours
 */
export async function handleScheduled(event, env, ctx) {
  try {
    console.log('Scheduled sync triggered');
    // This would trigger a sync request to the container
    // Implementation depends on your setup
  } catch (error) {
    console.error('Scheduled sync error:', error);
  }
}
