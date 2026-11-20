const allowedOrigins = new Set([
  'https://stefbrame-nawlou.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : 'null'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-family-code',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin')
  const headers = corsHeaders(origin)

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse({ error: 'Origin not allowed.' }, 403, headers)
  }

  if (!['GET', 'POST'].includes(request.method)) {
    return jsonResponse({ error: 'Method not allowed.' }, 405, headers)
  }

  const expectedCode = Deno.env.get('FAMILY_ACCESS_CODE')
  const suppliedCode = request.headers.get('x-family-code')
  if (!expectedCode || !suppliedCode || suppliedCode !== expectedCode) {
    return jsonResponse({ error: 'Invalid family code.' }, 401, headers)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase configuration is incomplete.' }, 500, headers)
  }

  const restHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }

  try {
    if (request.method === 'GET') {
      const response = await fetch(`${supabaseUrl}/rest/v1/family_state?id=eq.1&select=state,updated_at`, {
        headers: restHeaders,
      })
      if (!response.ok) return jsonResponse({ error: 'Unable to read shared data.' }, 502, headers)
      const rows = await response.json() as Array<{ state: unknown; updated_at: string }>
      if (!rows.length) return jsonResponse({ state: null, updatedAt: null }, 200, headers)
      return jsonResponse({ state: rows[0].state, updatedAt: rows[0].updated_at }, 200, headers)
    }

    const payload = await request.json() as { state?: unknown }
    if (!payload.state || typeof payload.state !== 'object' || Array.isArray(payload.state)) {
      return jsonResponse({ error: 'Invalid shared data format.' }, 400, headers)
    }

    const updatedAt = new Date().toISOString()
    const response = await fetch(`${supabaseUrl}/rest/v1/family_state?on_conflict=id`, {
      method: 'POST',
      headers: { ...restHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: 1, state: payload.state, updated_at: updatedAt }),
    })
    if (!response.ok) return jsonResponse({ error: 'Unable to save shared data.' }, 502, headers)
    return jsonResponse({ saved: true, updatedAt }, 200, headers)
  } catch {
    return jsonResponse({ error: 'Shared database is temporarily unavailable.' }, 503, headers)
  }
})
