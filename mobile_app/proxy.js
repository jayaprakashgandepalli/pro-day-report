const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const dotenv = require('dotenv');

// Load root .env so Prisma has DATABASE_URL
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { PrismaClient } = require(path.resolve(__dirname, '../node_modules/@prisma/client'));
const prisma = new PrismaClient();

const TARGET_HOST = 'sri.uniknaturals.in';
const PORT = 5000;

// High-performance keepAlive agent to reuse TLS sockets and eliminate handshake latency
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  keepAliveMsecs: 60000,
});

process.on('uncaughtException', (err) => {
  console.error('[PROXY UNCAUGHT]:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[PROXY UNHANDLED]:', reason);
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

  // Collect request body
  const bodyChunks = [];
  req.on('data', chunk => bodyChunks.push(chunk));
  req.on('end', async () => {
    const rawBody = Buffer.concat(bodyChunks);
    const bodyText = rawBody.toString('utf8');

    // Check if this is PUT /api/students/:id (saving photos / admitting student)
    const matchStudentPut = parsedUrl.pathname && parsedUrl.pathname.match(/^\/api\/students\/([a-zA-Z0-9_-]+)$/);
    if (req.method === 'PUT' && matchStudentPut) {
      const studentId = matchStudentPut[1];
      let parsedBody = null;
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (_) {}

      if (parsedBody && typeof parsedBody === 'object') {
        const hasPhotoOrAdmit = parsedBody.studentPhoto !== undefined ||
                                parsedBody.applicationPhoto !== undefined ||
                                parsedBody.joinedCollegeId !== undefined ||
                                parsedBody.applicationNumber !== undefined ||
                                parsedBody.admissionDate !== undefined ||
                                parsedBody.leadStatus !== undefined;

        if (hasPhotoOrAdmit) {
          try {
            const updateData = {};
            if (parsedBody.studentPhoto !== undefined) updateData.studentPhoto = parsedBody.studentPhoto;
            if (parsedBody.applicationPhoto !== undefined) updateData.applicationPhoto = parsedBody.applicationPhoto;
            if (parsedBody.joinedCollegeId !== undefined) updateData.joinedCollegeId = parsedBody.joinedCollegeId;
            if (parsedBody.applicationNumber !== undefined) updateData.applicationNumber = parsedBody.applicationNumber;
            if (parsedBody.admissionDate !== undefined && parsedBody.admissionDate) {
              updateData.admissionDate = new Date(parsedBody.admissionDate);
            }
            if (parsedBody.leadStatus !== undefined) updateData.leadStatus = parsedBody.leadStatus;
            if (parsedBody.remarks !== undefined) updateData.remarks = parsedBody.remarks;

            const updatedStudent = await prisma.student.update({
              where: { id: studentId },
              data: updateData,
              include: {
                joinedCollege: { select: { id: true, name: true } }
              }
            });

            console.log(`[DB DIRECT SUCCESS] Persisted to PostgreSQL for ${studentId} (${updatedStudent.studentName}): studentPhoto=${!!updatedStudent.studentPhoto}, appPhoto=${!!updatedStudent.applicationPhoto}`);

            // Forward to upstream in background (fire-and-forget for other audits/webhooks)
            try {
              const fReq = https.request({
                hostname: TARGET_HOST,
                port: 443,
                path: req.url,
                method: req.method,
                headers: { ...forwardHeaders, 'content-length': Buffer.byteLength(rawBody) },
                agent: httpsAgent,
              });
              fReq.on('error', () => {});
              fReq.write(rawBody);
              fReq.end();
            } catch (_) {}

            // Send immediate 200 response to client with updated student from DB
            const responsePayload = JSON.stringify({
              success: true,
              message: 'Student details & photos saved successfully in database!',
              student: updatedStudent,
            });

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(responsePayload),
            });
            res.end(responsePayload);
            console.log(`[RES] ${req.method} ${req.url} -> 200 DIRECT_DB (${Date.now() - start}ms)`);
            return;
          } catch (dbErr) {
            console.error('[DB DIRECT ERROR]:', dbErr.message);
            // Fall through to regular proxy if DB direct fails
          }
        }
      }
    }

    // Check if this is GET /api/students/:id (fetching single student)
    const matchStudentGet = parsedUrl.pathname && parsedUrl.pathname.match(/^\/api\/students\/([a-zA-Z0-9_-]+)$/);
    if (req.method === 'GET' && matchStudentGet) {
      const studentId = matchStudentGet[1];
      // Query DB directly first for instant and complete details with photos
      try {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            visits: true,
            joinedCollege: { select: { id: true, name: true } },
            assessmentReport: true,
          }
        });
        if (student) {
          const responsePayload = JSON.stringify({
            success: true,
            student: student,
          });
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(responsePayload),
          });
          res.end(responsePayload);
          console.log(`[RES] ${req.method} ${req.url} -> 200 DIRECT_DB_GET (${Date.now() - start}ms)`);
          return;
        }
      } catch (dbErr) {
        console.error('[DB GET ERROR]:', dbErr.message);
        // Fall through to proxy
      }
    }

    // Regular Proxy forwarding to TARGET_HOST
    const options = {
      hostname: TARGET_HOST,
      port: 443,
      path: req.url,
      method: req.method,
      headers: {
        ...forwardHeaders,
        ...(rawBody.length > 0 ? { 'content-length': Buffer.byteLength(rawBody) } : {}),
      },
      agent: httpsAgent,
    };

    const proxyReq = https.request(options, (proxyRes) => {
      // Check if we need to augment GET /api/students list with DB photos
      const isStudentsList = req.method === 'GET' && parsedUrl.pathname === '/api/students';

      if (isStudentsList && proxyRes.statusCode === 200) {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', async () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (json && Array.isArray(json.students)) {
              // Fetch any students with photos from DB
              const studentsWithPhotos = await prisma.student.findMany({
                where: {
                  OR: [
                    { studentPhoto: { not: null } },
                    { applicationPhoto: { not: null } },
                  ]
                },
                select: { id: true, studentPhoto: true, applicationPhoto: true }
              });

              const photoMap = new Map(studentsWithPhotos.map(s => [s.id, s]));
              json.students.forEach(st => {
                if (st && st.id && photoMap.has(st.id)) {
                  const dbData = photoMap.get(st.id);
                  if (dbData.studentPhoto && !st.studentPhoto) st.studentPhoto = dbData.studentPhoto;
                  if (dbData.applicationPhoto && !st.applicationPhoto) st.applicationPhoto = dbData.applicationPhoto;
                }
              });
            }

            const modifiedBody = JSON.stringify(json);
            const headers = { ...proxyRes.headers };
            delete headers['content-length'];
            headers['content-length'] = Buffer.byteLength(modifiedBody);
            res.writeHead(200, headers);
            res.end(modifiedBody);
            console.log(`[RES] ${req.method} ${req.url} -> 200 (AUGMENTED_PHOTOS ${Date.now() - start}ms)`);
          } catch (_) {
            const raw = Buffer.concat(chunks);
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            res.end(raw);
          }
        });
      } else {
        if (!res.headersSent) {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
        }
        proxyRes.on('end', () => {
          console.log(`[RES] ${req.method} ${req.url} -> ${proxyRes.statusCode} (${Date.now() - start}ms)`);
        });
        proxyRes.pipe(res, { end: true });
      }
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

    if (rawBody.length > 0) {
      proxyReq.write(rawBody);
    }
    proxyReq.end();
  });

  req.on('error', (err) => {
    console.error('Client Req Error:', err.message);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`PRO Mobile Dev Proxy running at http://127.0.0.1:${PORT} -> https://${TARGET_HOST} (with Direct DB sync)`);
});
