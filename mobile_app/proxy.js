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

  let employeeId = parsedUrl.query.employeeId || null;
  if (!employeeId && token) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        if (payload && payload.employeeId) {
          employeeId = payload.employeeId;
        }
      }
    } catch (_) {}
  }

  const forwardHeaders = { ...req.headers };
  forwardHeaders['host'] = TARGET_HOST;
  delete forwardHeaders['origin'];
  delete forwardHeaders['referer'];
  delete forwardHeaders['accept-encoding']; // Force upstream to return plain UTF-8 JSON so proxy can parse and augment

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

    // ==========================================
    // 1. COLLEGE BRANCHES CRUD (Direct DB Handlers)
    // ==========================================
    if (parsedUrl.pathname === '/api/college-branches') {
      if (req.method === 'GET') {
        try {
          const reqEmpId = parsedUrl.query.employeeId || employeeId || null;
          const whereClause = { isActive: true };
          if (reqEmpId) {
            whereClause.employeeId = reqEmpId;
          }
          const branches = await prisma.collegeBranch.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            include: {
              _count: {
                select: {
                  students: reqEmpId ? { where: { employeeId: reqEmpId } } : true
                }
              }
            }
          });
          const payload = JSON.stringify({ success: true, branches });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
          res.end(payload);
          console.log(`[RES] GET /api/college-branches -> 200 (${Date.now() - start}ms) [${branches.length} branches for employee: ${reqEmpId || 'ALL'}]`);
          return;
        } catch (err) {
          console.error('[PROXY GET BRANCHES ERROR]:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
          return;
        }
      }

      if (req.method === 'POST') {
        try {
          const body = JSON.parse(bodyText);
          const { name, code, location, phone } = body;
          const branchEmpId = body.employeeId || parsedUrl.query.employeeId || employeeId || null;
          if (!name || typeof name !== 'string' || !name.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Branch name is required' }));
            return;
          }

          const branch = await prisma.collegeBranch.create({
            data: {
              name: name.trim(),
              code: code && typeof code === 'string' && code.trim() ? code.trim() : null,
              location: location && typeof location === 'string' && location.trim() ? location.trim() : null,
              phone: phone && typeof phone === 'string' && phone.trim() ? phone.trim() : null,
              employeeId: branchEmpId,
            }
          });

          const payload = JSON.stringify({ success: true, branch });
          res.writeHead(201, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
          res.end(payload);
          console.log(`[RES] POST /api/college-branches -> 201 created branch ${branch.name} for employee: ${branchEmpId}`);
          return;
        } catch (err) {
          console.error('[PROXY POST BRANCH ERROR]:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
          return;
        }
      }
    }

    const matchBranchId = parsedUrl.pathname && parsedUrl.pathname.match(/^\/api\/college-branches\/([a-zA-Z0-9_-]+)$/);
    if (matchBranchId) {
      const branchId = matchBranchId[1];
      if (req.method === 'PUT') {
        try {
          const body = JSON.parse(bodyText);
          const { name, code, location, phone, isActive } = body;
          const updateData = {};
          if (name !== undefined) updateData.name = name.trim();
          if (code !== undefined) updateData.code = code && typeof code === 'string' && code.trim() ? code.trim() : null;
          if (location !== undefined) updateData.location = location && typeof location === 'string' && location.trim() ? location.trim() : null;
          if (phone !== undefined) updateData.phone = phone && typeof phone === 'string' && phone.trim() ? phone.trim() : null;
          if (isActive !== undefined) updateData.isActive = Boolean(isActive);

          const branch = await prisma.collegeBranch.update({
            where: { id: branchId },
            data: updateData,
          });

          const payload = JSON.stringify({ success: true, branch });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
          res.end(payload);
          console.log(`[RES] PUT /api/college-branches/${branchId} -> 200 updated`);
          return;
        } catch (err) {
          console.error('[PROXY PUT BRANCH ERROR]:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
          return;
        }
      }

      if (req.method === 'DELETE') {
        try {
          const studentCount = await prisma.student.count({ where: { collegeBranchId: branchId } });
          if (studentCount > 0) {
            await prisma.collegeBranch.update({
              where: { id: branchId },
              data: { isActive: false },
            });
            const payload = JSON.stringify({ success: true, message: `Archived branch because ${studentCount} students are admitted to it.` });
            res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
            res.end(payload);
            return;
          }

          await prisma.collegeBranch.delete({ where: { id: branchId } });
          const payload = JSON.stringify({ success: true, message: 'Branch deleted' });
          res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
          res.end(payload);
          return;
        } catch (err) {
          console.error('[PROXY DELETE BRANCH ERROR]:', err.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
          return;
        }
      }
    }

    // ==========================================
    // 2. /api/colleges/list (Returns College Branches for Admission Dropdown)
    // ==========================================
    if (parsedUrl.pathname === '/api/colleges/list' && req.method === 'GET') {
      try {
        const reqEmpId = parsedUrl.query.employeeId || employeeId || null;
        const whereClause = { isActive: true };
        if (reqEmpId) {
          whereClause.employeeId = reqEmpId;
        }
        const branches = await prisma.collegeBranch.findMany({
          where: whereClause,
          orderBy: { name: 'asc' },
          select: { id: true, name: true, code: true, location: true, phone: true }
        });
        const payload = JSON.stringify({
          success: true,
          colleges: branches,
          branches,
        });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) });
        res.end(payload);
        console.log(`[RES] GET /api/colleges/list -> 200 (Returned ${branches.length} College Branches for employee: ${reqEmpId || 'ALL'})`);
        return;
      } catch (err) {
        console.error('[PROXY COLLEGES LIST ERROR]:', err.message);
        // Fall through to remote proxy if error
      }
    }

    // ==========================================
    // 3. PUT /api/students/:id (Saving Photos / Admitting to College Branch)
    // ==========================================
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
                                parsedBody.collegeBranchId !== undefined ||
                                parsedBody.applicationNumber !== undefined ||
                                parsedBody.admissionDate !== undefined ||
                                parsedBody.leadStatus !== undefined;

        if (hasPhotoOrAdmit) {
          try {
            const updateData = {};
            if (parsedBody.studentPhoto !== undefined) updateData.studentPhoto = parsedBody.studentPhoto;
            if (parsedBody.applicationPhoto !== undefined) updateData.applicationPhoto = parsedBody.applicationPhoto;

            // Save branch ID to both collegeBranchId and joinedCollegeId for full compatibility
            const branchId = parsedBody.collegeBranchId || parsedBody.joinedCollegeId;
            if (branchId) {
              updateData.collegeBranchId = branchId;
              updateData.joinedCollegeId = branchId;
            }

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
                collegeBranch: { select: { id: true, name: true, code: true, location: true } },
                joinedCollege: { select: { id: true, name: true } }
              }
            });

            console.log(`[DB DIRECT SUCCESS] Persisted to PostgreSQL for ${studentId} (${updatedStudent.studentName}): studentPhoto=${!!updatedStudent.studentPhoto}, branch=${updatedStudent.collegeBranch?.name || updatedStudent.joinedCollegeId}`);

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
          }
        }
      }
    }

    // ==========================================
    // 4. GET /api/students/:id (Fetching Single Student with Branch)
    // ==========================================
    const matchStudentGet = parsedUrl.pathname && parsedUrl.pathname.match(/^\/api\/students\/([a-zA-Z0-9_-]+)$/);
    if (req.method === 'GET' && matchStudentGet) {
      const studentId = matchStudentGet[1];
      try {
        const student = await prisma.student.findUnique({
          where: { id: studentId },
          include: {
            visits: true,
            collegeBranch: { select: { id: true, name: true, code: true, location: true } },
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
      }
    }

    // ==========================================
    // 5. Regular Proxy forwarding to TARGET_HOST
    // ==========================================
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
      // Augment GET /api/students list with DB photos and college branches
      const isStudentsList = req.method === 'GET' && parsedUrl.pathname === '/api/students';

      if (isStudentsList && proxyRes.statusCode === 200) {
        const chunks = [];
        proxyRes.on('data', c => chunks.push(c));
        proxyRes.on('end', async () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (json && Array.isArray(json.students)) {
              const existingIds = new Set(json.students.map(s => s.id));

              // Where clause: include all students belonging to this employee or any with photos/branch
              let whereClause = {
                OR: [
                  { studentPhoto: { not: null } },
                  { applicationPhoto: { not: null } },
                  { collegeBranchId: { not: null } },
                  { joinedCollegeId: { not: null } },
                  { leadStatus: 'Admitted' },
                ]
              };

              if (employeeId) {
                whereClause = {
                  OR: [
                    { employeeId: employeeId },
                    { studentPhoto: { not: null } },
                    { applicationPhoto: { not: null } },
                    { collegeBranchId: { not: null } },
                    { joinedCollegeId: { not: null } },
                    { leadStatus: 'Admitted' },
                  ]
                };
              }

              // Fetch students that have photos, college branches, or belong to current employee
              const dbStudents = await prisma.student.findMany({
                where: whereClause,
                include: {
                  collegeBranch: { select: { id: true, name: true, location: true, code: true } },
                  joinedCollege: { select: { id: true, name: true } },
                  visits: {
                    orderBy: { visitDate: 'desc' },
                    take: 1
                  }
                }
              });

              // 1. Prepend missing admitted/employee students (filtered out by upstream joinedCollegeId bug)
              for (const dbSt of dbStudents) {
                if (employeeId && dbSt.employeeId === employeeId && !existingIds.has(dbSt.id)) {
                  const formatted = {
                    ...dbSt,
                    visits: dbSt.visits || [],
                    collegeBranch: dbSt.collegeBranch || null,
                    joinedCollege: dbSt.collegeBranch ? { name: dbSt.collegeBranch.name } : (dbSt.joinedCollege || null),
                  };
                  json.students.unshift(formatted);
                  existingIds.add(dbSt.id);
                }
              }

              // 2. Augment existing students with DB photos, college branches, leadStatus, etc.
              const dbMap = new Map(dbStudents.map(s => [s.id, s]));
              json.students.forEach(st => {
                if (st && st.id && dbMap.has(st.id)) {
                  const dbData = dbMap.get(st.id);
                  if (dbData.studentPhoto && !st.studentPhoto) st.studentPhoto = dbData.studentPhoto;
                  if (dbData.applicationPhoto && !st.applicationPhoto) st.applicationPhoto = dbData.applicationPhoto;
                  if (dbData.collegeBranch) {
                    st.collegeBranch = dbData.collegeBranch;
                    st.joinedCollege = { name: dbData.collegeBranch.name };
                  }
                  if (dbData.leadStatus) st.leadStatus = dbData.leadStatus;
                  if (dbData.collegeBranchId) st.collegeBranchId = dbData.collegeBranchId;
                  if (dbData.joinedCollegeId) st.joinedCollegeId = dbData.joinedCollegeId;
                  if (dbData.applicationNumber) st.applicationNumber = dbData.applicationNumber;
                  if (dbData.admissionDate) st.admissionDate = dbData.admissionDate;
                }
              });

              json.total = json.students.length;
            }

            const modifiedBody = JSON.stringify(json);
            const headers = { ...proxyRes.headers };
            delete headers['content-length'];
            delete headers['transfer-encoding'];
            delete headers['content-encoding']; // Body is raw JSON, not compressed
            headers['content-type'] = 'application/json; charset=utf-8';
            headers['content-length'] = Buffer.byteLength(modifiedBody);
            res.writeHead(200, headers);
            res.end(modifiedBody);
            console.log(`[RES] ${req.method} ${req.url} -> 200 (AUGMENTED_STUDENTS ${Date.now() - start}ms) [${json.students.length} students]`);
          } catch (err) {
            console.error('[PROXY AUGMENT PARSE ERROR]:', err.message);
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
  console.log(`PRO Mobile Dev Proxy running at http://127.0.0.1:${PORT} -> https://${TARGET_HOST} (College Branches & Direct DB Enabled)`);
});
