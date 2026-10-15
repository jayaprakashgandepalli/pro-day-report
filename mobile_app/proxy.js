const http = require('http');
const https = require('https');
const url = require('url');

const TARGET_HOST = 'sri.uniknaturals.in';
const PORT = 5000;

// High-performance keepAlive agent to reuse TLS sockets and eliminate handshake latency
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  keepAliveMsecs: 60000,
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const server = http.createServer((req, res) => {
  // Enable full CORS for Flutter Web
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const token = parsedUrl.query.token ||
                parsedUrl.query.auth_token ||
                (req.headers['authorization'] ? req.headers['authorization'].replace(/^Bearer\s+/i, '') : null);

  const forwardHeaders = { ...req.headers };
  forwardHeaders['host'] = TARGET_HOST;
  delete forwardHeaders['origin'];
  delete forwardHeaders['referer'];

  // Attach auth_token cookie
  if (token) {
    forwardHeaders['cookie'] = `auth_token=${token}`;
  }

  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.url}`);

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: forwardHeaders,
    agent: httpsAgent,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    if (!res.headersSent) {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
    }
    proxyRes.on('end', () => {
      console.log(`[RES] ${req.method} ${req.url} -> ${proxyRes.statusCode} (${Date.now() - start}ms)`);
    });
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy Error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy connection error', details: err.message }));
    } else {
      res.destroy();
    }
  });

  req.on('error', (err) => {
    console.error('Client Req Error:', err.message);
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`PRO Mobile Dev Proxy running at http://127.0.0.1:${PORT} -> https://${TARGET_HOST}`);
});
