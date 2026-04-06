const http = require("http");
const https = require("https");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const HDSI_BASE = process.env.HDSI_BASE_URL || "https://go.apis.huit.harvard.edu/ais-openai-direct-limited-schools/v1";
const HDSI_KEY = process.env.HDSI_API_KEY || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://www.benjaminbdaniels.com,http://localhost,file://").split(",");

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin && origin.startsWith(o));
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || "";
  const cors = corsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "policymaker-formal-proxy" }));
    return;
  }

  // Only POST /chat
  if (req.method !== "POST" || !req.url.startsWith("/chat")) {
    res.writeHead(404, cors);
    res.end("Not found");
    return;
  }

  if (!HDSI_KEY) {
    res.writeHead(500, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "HDSI_API_KEY not configured" }));
    return;
  }

  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    const target = new URL(HDSI_BASE + "/chat/completions");

    const options = {
      hostname: target.hostname,
      port: 443,
      path: target.pathname + target.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": HDSI_KEY,
        "Content-Length": Buffer.byteLength(body)
      }
    };

    const proxy = https.request(options, (upstream) => {
      let data = "";
      upstream.on("data", chunk => { data += chunk; });
      upstream.on("end", () => {
        res.writeHead(upstream.statusCode, {
          ...cors,
          "Content-Type": "application/json"
        });
        res.end(data);
      });
    });

    proxy.on("error", (err) => {
      res.writeHead(502, { ...cors, "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Upstream error: " + err.message }));
    });

    proxy.write(body);
    proxy.end();
  });
});

server.listen(PORT, () => {
  console.log("policymaker-formal-proxy listening on :" + PORT);
});
