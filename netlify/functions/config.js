/**
 * RS Digital Hub — Public Configuration Endpoint (netlify/functions/config.js)
 * Exposes ONLY safe public variables (Supabase URL & Anon Key).
 * NEVER exposes GEMINI_API_KEY or SUPABASE_SERVICE_ROLE_KEY.
 */

export async function handleConfigRequest() {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    },
    body: JSON.stringify(config)
  };
}

// Netlify Function v2 handler
export default async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  const result = await handleConfigRequest();
  return new Response(result.body, {
    status: result.statusCode,
    headers: result.headers
  });
};

// Netlify Function v1 / AWS Lambda style handler
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  return await handleConfigRequest();
};
