export default {
  async fetch(request, env) {
    const ALLOWED = (env.ALLOWED_ORIGINS || "https://www.benjaminbdaniels.com,http://localhost,null").split(",");
    const origin = request.headers.get("Origin") || "null";
    const allowed = ALLOWED.some(o => origin === o || origin.startsWith(o));
    const cors = {
      "Access-Control-Allow-Origin": allowed ? origin : "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === "GET") {
      return new Response(JSON.stringify({ status: "ok", service: "policymaker-formal-proxy" }), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors });
    }

    if (!env.HDSI_API_KEY) {
      return new Response(JSON.stringify({ error: "HDSI_API_KEY not configured" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const baseUrl = env.HDSI_BASE_URL || "https://go.apis.huit.harvard.edu/ais-openai-direct-limited-schools/v1";
    const body = await request.text();

    const upstream = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": env.HDSI_API_KEY
      },
      body: body
    });

    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json" }
    });
  }
};
