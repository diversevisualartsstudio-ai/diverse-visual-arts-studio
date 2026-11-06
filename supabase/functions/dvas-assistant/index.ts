import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const watsonxApiKey = Deno.env.get('WATSONX_API_KEY');
const watsonxProjectId = Deno.env.get('WATSONX_PROJECT_ID');
const watsonxUrl = (Deno.env.get('WATSONX_URL') || '').replace(/\/$/, '');
const modelId = Deno.env.get('WATSONX_MODEL_ID') || 'ibm/granite-3-8b-instruct';
const configuredOrigin = Deno.env.get('DASHBOARD_ORIGIN');

function corsHeaders(origin: string | null) {
  const allowOrigin = configuredOrigin || '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });
  if (configuredOrigin && origin !== configuredOrigin) return Response.json({ error: 'Origin not allowed' }, { status: 403, headers });

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return Response.json({ error: 'Sign in required' }, { status: 401, headers });
  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: 'Invalid session' }, { status: 401, headers });

  if (!watsonxApiKey || !watsonxProjectId || !watsonxUrl) {
    return Response.json({ error: 'Assistant is not configured. Set WATSONX_API_KEY, WATSONX_PROJECT_ID, and WATSONX_URL as Edge Function secrets.' }, { status: 503, headers });
  }

  let question: unknown;
  try { ({ question } = await request.json()); } catch { return Response.json({ error: 'Request must contain JSON.' }, { status: 400, headers }); }
  if (typeof question !== 'string' || question.trim().length < 1 || question.length > 4000) {
    return Response.json({ error: 'Question must be between 1 and 4000 characters.' }, { status: 400, headers });
  }

  try {
    const tokenResponse = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ grant_type: 'urn:ibm:params:oauth:grant-type:apikey', apikey: watsonxApiKey })
    });
    if (!tokenResponse.ok) throw new Error('IBM IAM token request failed. Check WATSONX_API_KEY.');
    const tokenData = await tokenResponse.json();

    const generationResponse = await fetch(`${watsonxUrl}/ml/v1/text/generation?version=2023-05-29`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        model_id: modelId,
        project_id: watsonxProjectId,
        input: `You are the DVAS studio assistant. Provide a concise, factual response. Do not claim access to live company data unless provided in the prompt.\n\nUser question: ${question.trim()}`,
        parameters: { max_new_tokens: 350, temperature: 0.3, repetition_penalty: 1.05 }
      })
    });
    const result = await generationResponse.json();
    if (!generationResponse.ok) {
      console.error('watsonx request failed:', generationResponse.status, result);
      return Response.json({ error: 'watsonx.ai request failed. Check the configured region, project, model, and API access.' }, { status: 502, headers });
    }
    const answer = result.results?.[0]?.generated_text;
    if (typeof answer !== 'string' || !answer.trim()) throw new Error('watsonx.ai returned no generated text.');
    return Response.json({ answer: answer.trim() }, { headers });
  } catch (error) {
    console.error('Assistant error:', error);
    return Response.json({ error: 'Assistant service is temporarily unavailable.' }, { status: 502, headers });
  }
});
