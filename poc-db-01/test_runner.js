/**
 * POC-DB-01: PostgreSQL Data Access & Tenant Isolation Test Runner
 * Specification Reference: docs/ARCHITECTURE_REVISION_3_1_5.md
 * 
 * Evaluates:
 *   Test 1: Tenant Read & Write Boundary Isolation
 *   Test 2: Fail-Closed Null Context Protection
 *   Test 3: Connection Pooler Context Discard (is_local = true)
 *   Test 4: Atomic Multi-Table Rollback on Operational Failure
 *   Test 5: Tenant-Scoped Phone Blind-Index Uniqueness (phone_blind_index_v2)
 *   Test 6: Staff-Seat Quota Atomic Serialization (Parent Row Lock)
 *   Test 7: Unprivileged Runtime Role Attribute Enforcement
 *   Test 8: Connection Pooler RLS Latency Overhead Benchmark
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

// 1. Load configuration from .env.poc
const envPath = path.join(__dirname, '.env.poc');
if (!fs.existsSync(envPath)) {
    throw new Error('SECURITY HALT: Missing .env.poc in poc-db-01/. Refusing to execute without explicit local configuration.');
}
const envContent = fs.readFileSync(envPath, 'utf8');

function getEnvVar(key) {
    const match = envContent.match(new RegExp(`^${key}="?([^"\\r\\n]+)"?`, 'm'));
    return match ? match[1].trim() : null;
}

// -------------------------------------------------------------------------
// SAFETY ENFORCEMENT GATE: FAIL-CLOSED LOOPBACK & DISPOSABLE DB CHECKS
// -------------------------------------------------------------------------
const APPROVED_LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const APPROVED_DISPOSABLE_DATABASES = new Set(['shop_db', 'poc_db_01_disposable', 'disposable_poc_db']);

// Mandatory Confirmation Flag Check
const disposableConfirmed = getEnvVar('POC_DISPOSABLE_CONFIRMED');
if (disposableConfirmed !== 'YES_I_CONFIRM_THIS_IS_A_DISPOSABLE_TEST_DATABASE') {
    throw new Error(
        'SECURITY HALT: POC_DISPOSABLE_CONFIRMED is not set to "YES_I_CONFIRM_THIS_IS_A_DISPOSABLE_TEST_DATABASE" in .env.poc.\n' +
        'Operator must independently verify and explicitly declare that the target database is a dedicated disposable test database.'
    );
}

// Check and validate POC_DATABASE_URL or DATABASE_URL if present (prevent connection-string bypass)
const potentialUrls = [
    getEnvVar('POC_DATABASE_URL'),
    getEnvVar('DATABASE_URL'),
    process.env.POC_DATABASE_URL,
    process.env.DATABASE_URL
].filter(Boolean);

for (const rawUrl of potentialUrls) {
    try {
        const parsedUrl = new URL(rawUrl);
        const urlHost = parsedUrl.hostname.toLowerCase();
        const urlDb = parsedUrl.pathname.replace(/^\//, '');
        if (!APPROVED_LOOPBACK_HOSTS.has(urlHost)) {
            throw new Error(`SECURITY HALT: Connection URL host "${urlHost}" is not an approved loopback host (${[...APPROVED_LOOPBACK_HOSTS].join(', ')}).`);
        }
        if (!APPROVED_DISPOSABLE_DATABASES.has(urlDb)) {
            throw new Error(`SECURITY HALT: Connection URL database "${urlDb}" is not an approved disposable database (${[...APPROVED_DISPOSABLE_DATABASES].join(', ')}).`);
        }
    } catch (urlErr) {
        if (urlErr.message.startsWith('SECURITY HALT')) throw urlErr;
        throw new Error(`SECURITY HALT: Connection URL is malformed: ${urlErr.message}`);
    }
}

// Ambient environment checks
if (process.env.PGHOST && !APPROVED_LOOPBACK_HOSTS.has(process.env.PGHOST.toLowerCase())) {
    throw new Error(`SECURITY HALT: Ambient PGHOST "${process.env.PGHOST}" is not an approved loopback host.`);
}
if (process.env.PGDATABASE && !APPROVED_DISPOSABLE_DATABASES.has(process.env.PGDATABASE)) {
    throw new Error(`SECURITY HALT: Ambient PGDATABASE "${process.env.PGDATABASE}" is not an approved disposable database.`);
}

// Validate explicit host
const rawHost = getEnvVar('POC_DB_HOST') || '127.0.0.1';
const DB_HOST = rawHost.trim().toLowerCase();
if (!APPROVED_LOOPBACK_HOSTS.has(DB_HOST)) {
    throw new Error(`SECURITY HALT: Prohibited database host "${DB_HOST}". Only local loopback hosts (${[...APPROVED_LOOPBACK_HOSTS].join(', ')}) are permitted.`);
}

// Validate explicit database name
const rawDb = getEnvVar('POC_DB_NAME') || 'shop_db';
const DB_NAME = rawDb.trim();
if (!APPROVED_DISPOSABLE_DATABASES.has(DB_NAME)) {
    throw new Error(`SECURITY HALT: Prohibited database name "${DB_NAME}". Only explicitly allowlisted disposable databases (${[...APPROVED_DISPOSABLE_DATABASES].join(', ')}) are permitted.`);
}

// Validate users and credentials
const rawUser = getEnvVar('POC_DB_USER') || 'postgres';
const DB_USER = rawUser.trim();
const DB_PASS = getEnvVar('POC_DB_PASS');
if (!DB_PASS) {
    throw new Error('SECURITY HALT: POC_DB_PASS is not configured in .env.poc. Refusing to run without credentials.');
}

const rawRuntimeUser = getEnvVar('POC_RUNTIME_USER') || 'poc_db_01_runtime_user';
const RUNTIME_USER = rawRuntimeUser.trim();
const rawRuntimePass = getEnvVar('POC_RUNTIME_PASS') || 'poc_runtime_pass_safe_placeholder';
const RUNTIME_PASS = rawRuntimePass.trim();

const rawPort = getEnvVar('POC_DB_PORT') || '5432';
const DB_PORT = rawPort.trim();
if (!/^\d+$/.test(DB_PORT) || parseInt(DB_PORT, 10) < 1 || parseInt(DB_PORT, 10) > 65535) {
    throw new Error(`SECURITY HALT: Invalid database port "${DB_PORT}".`);
}

const PSQL_PATH = getEnvVar('PSQL_PATH') || 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';

// Clean subprocess environment: explicitly enforce loopback host & database and prevent ambient inheritance
const baseCleanEnv = { ...process.env };
delete baseCleanEnv.PGHOST;
delete baseCleanEnv.PGPORT;
delete baseCleanEnv.PGDATABASE;
delete baseCleanEnv.PGUSER;
delete baseCleanEnv.DATABASE_URL;
delete baseCleanEnv.POC_DATABASE_URL;

const ADMIN_PSQL_ENV = { ...baseCleanEnv, PGPASSWORD: DB_PASS };
const RUNTIME_PSQL_ENV = { ...baseCleanEnv, PGPASSWORD: RUNTIME_PASS };

function sanitizeError(msg) {
    if (!msg) return '';
    let sanitized = String(msg);
    if (DB_PASS) {
        sanitized = sanitized.split(DB_PASS).join('***REDACTED***');
    }
    if (RUNTIME_PASS) {
        sanitized = sanitized.split(RUNTIME_PASS).join('***REDACTED***');
    }
    sanitized = sanitized.replace(/postgres:\/\/([^:]+):([^@]+)@/g, 'postgres://$1:***REDACTED***@');
    return sanitized.trim();
}

const W1_ID = '018f3a5e-0001-7000-8000-000000000001';
const W2_ID = '018f3a5e-0001-7000-8000-000000000002';
const USER_W1_ADMIN = '018f3a5e-0002-7000-8000-000000000001';
const USER_W1_STAFF = '018f3a5e-0002-7000-8000-000000000002';
const USER_W2_STAFF = '018f3a5e-0002-7000-8000-000000000003';
const USER_INACTIVE_W1 = '018f3a5e-0002-7000-8000-000000000099';

// 2. Interactive Multi-Session Concurrency Abstraction
class DbSession {
    constructor(name, userType = 'RUNTIME') {
        this.name = name;
        this.userType = userType; // 'RUNTIME' (poc_db_01_runtime_user) | 'ADMIN' (postgres)
        this.proc = null;
        this.buffer = '';
        this.stderrBuffer = '';
        this.currentResolve = null;
        this.currentReject = null;
        this.currentQueryOptions = null;
        this.currentQueryStartTime = 0;
        this.delimiter = `---TOKEN_${Math.random().toString(36).substring(2)}---`;
        this.exitCode = null;
        this.exitSignal = null;
        this.isExplicitlyClosed = false;
    }

    async connect() {
        const user = this.userType === 'ADMIN' ? DB_USER : RUNTIME_USER;
        const env = this.userType === 'ADMIN' ? ADMIN_PSQL_ENV : RUNTIME_PSQL_ENV;

        return new Promise((resolve, reject) => {
            this.proc = spawn(PSQL_PATH, [
                '-U', user,
                '-h', DB_HOST,
                '-p', DB_PORT,
                '-d', DB_NAME,
                '-w',
                '-v', 'ON_ERROR_STOP=1',
                '-P', 'pager=off',
                '-q'
            ], { env });

            this.proc.stdout.on('data', (chunk) => {
                const str = chunk.toString();
                this.buffer += str;
                if (this.buffer.includes(this.delimiter)) {
                    this._handleDelimiter();
                }
            });

            this.proc.stderr.on('data', (chunk) => {
                const str = chunk.toString();
                this.stderrBuffer += str;
                this.buffer += str;
                if (this.buffer.includes(this.delimiter)) {
                    this._handleDelimiter();
                }
            });

            this.proc.on('error', (err) => {
                const safeErr = new Error(`${this.name}: Process spawn error: ${sanitizeError(err.message)}`);
                if (this.currentReject) {
                    const r = this.currentReject;
                    this.currentResolve = null;
                    this.currentReject = null;
                    r(safeErr);
                }
            });

            this.proc.on('exit', (code, signal) => {
                this.exitCode = code;
                this.exitSignal = signal;
                if (!this.isExplicitlyClosed && code !== 0 && code !== null) {
                    const errOutput = sanitizeError(this.stderrBuffer || this.buffer);
                    const exitErr = new Error(`${this.name}: psql process exited unexpectedly with code ${code} (signal: ${signal}). Details: ${errOutput.trim()}`);
                    if (this.currentReject) {
                        const r = this.currentReject;
                        this.currentResolve = null;
                        this.currentReject = null;
                        r(exitErr);
                    }
                }
            });

            this.query("SELECT 'SESSION_READY';").then(() => resolve(this)).catch(reject);
        });
    }

    _handleDelimiter() {
        if (!this.currentResolve) return;
        const parts = this.buffer.split(this.delimiter);
        const output = parts[0].trim();
        this.buffer = parts.slice(1).join(this.delimiter);
        this.stderrBuffer = '';
        const rResolve = this.currentResolve;
        const rReject = this.currentReject;
        const options = this.currentQueryOptions || {};
        const durationMs = Date.now() - this.currentQueryStartTime;
        this.currentResolve = null;
        this.currentReject = null;
        this.currentQueryOptions = null;

        // Active check for PostgreSQL errors in output
        const hasPgError = /\b(ERROR|FATAL|PANIC):\s+/i.test(output);

        if (hasPgError) {
            // Intentional error scenario
            if (options.expectedError) {
                const matches = typeof options.expectedError === 'string'
                    ? output.includes(options.expectedError)
                    : options.expectedError.test(output);

                if (matches) {
                    return rResolve({
                        output,
                        durationMs,
                        errorDetected: true,
                        matchedExpectedError: true
                    });
                } else {
                    return rReject(new Error(
                        `${this.name}: PostgreSQL returned an unexpected error type. Expected match for ${options.expectedError}, but got: ${sanitizeError(output)}`
                    ));
                }
            } else {
                // Unexpected error on standard query -> REJECT
                return rReject(new Error(
                    `${this.name}: Unexpected PostgreSQL error: ${sanitizeError(output)}`
                ));
            }
        }

        // Query succeeded, but was EXPECTED to error -> REJECT
        if (options.expectedError) {
            return rReject(new Error(
                `${this.name}: Expected PostgreSQL error matching ${options.expectedError}, but query succeeded with output: ${sanitizeError(output)}`
            ));
        }

        rResolve({
            output,
            durationMs,
            errorDetected: false,
            matchedExpectedError: false
        });
    }

    async query(sql, options = {}) {
        if (!this.proc || this.isExplicitlyClosed) {
            throw new Error(`${this.name}: Session not connected or already closed`);
        }
        this.currentQueryStartTime = Date.now();
        this.currentQueryOptions = options;

        return new Promise((resolve, reject) => {
            this.currentResolve = resolve;
            this.currentReject = reject;

            let fullCommand = '';
            if (options.expectedError) {
                fullCommand = `\\set ON_ERROR_STOP 0\n${sql}\n\\echo ${this.delimiter}\n\\set ON_ERROR_STOP 1\n`;
            } else {
                fullCommand = `\\set ON_ERROR_STOP 1\n${sql}\n\\echo ${this.delimiter}\n`;
            }
            this.proc.stdin.write(fullCommand);
        });
    }

    async close() {
        this.isExplicitlyClosed = true;
        if (this.proc) {
            try {
                this.proc.stdin.write('\\q\n');
                this.proc.kill();
            } catch (e) {}
            this.proc = null;
        }
    }
}

function execAdminSql(sql) {
    try {
        const cleanSql = sql.replace(/[\r\n]+/g, ' ').replace(/"/g, '\"').trim();
        const res = execSync(`"${PSQL_PATH}" -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -w -t -A -v ON_ERROR_STOP=1 -c "${cleanSql}"`, {
            env: ADMIN_PSQL_ENV,
            stdio: ['pipe', 'pipe', 'pipe']
        }).toString();
        return res.trim();
    } catch (err) {
        throw new Error(`Admin SQL Exec Error: ${sanitizeError(err.stderr ? err.stderr.toString() : err.message)}`);
    }
}

function queryAdminCount(sql) {
    const raw = execAdminSql(sql);
    const m = raw.match(/\b\d+\b/);
    return m ? parseInt(m[0], 10) : 0;
}

function execFile(relPath) {
    const fullPath = path.join(__dirname, relPath);
    try {
        execSync(`"${PSQL_PATH}" -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -w -v ON_ERROR_STOP=1 -f "${fullPath}"`, {
            env: ADMIN_PSQL_ENV,
            stdio: ['pipe', 'pipe', 'pipe']
        });
    } catch (err) {
        throw new Error(`SQL File Exec Error (${relPath}): ${sanitizeError(err.stderr ? err.stderr.toString() : err.message)}`);
    }
}

function initializeSchema() {
    execFile('schema.sql');
}

function resetDatabase() {
    execFile('seed.sql');
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const results = [];

// =========================================================================
// TEST 1: Tenant Read & Write Boundary Isolation
// =========================================================================
async function runTest1() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 1: Tenant Read & Write Boundary Isolation');
    console.log('============================================================');
    resetDatabase();

    const session = new DbSession('AppUser-T1', 'RUNTIME');
    await session.connect();

    // 1. Scoped to Tenant A (W1)
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);

    const w1ReadRes = await session.query('SELECT count(*) FROM poc_db_01.student_leads;');
    const w1Count = parseInt(w1ReadRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
    console.log(`Leads visible under Tenant A context: ${w1Count} (Expected: 50)`);

    // 2. Querying Tenant B explicitly while in Tenant A context
    const crossReadRes = await session.query(`SELECT count(*) FROM poc_db_01.student_leads WHERE workspace_id = '${W2_ID}';`);
    const crossReadCount = parseInt(crossReadRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
    console.log(`Tenant B leads visible under Tenant A context: ${crossReadCount} (Expected: 0)`);

    // 3. Attempting to mutate Tenant B records while in Tenant A context
    const crossUpdateRes = await session.query(`
        WITH upd AS (
            UPDATE poc_db_01.student_leads 
            SET student_name = 'EXPLOIT_HACK' 
            WHERE workspace_id = '${W2_ID}' 
            RETURNING id
        )
        SELECT count(*) FROM upd;
    `);
    const crossUpdateCount = parseInt(crossUpdateRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
    console.log(`Tenant B rows updated under Tenant A context: ${crossUpdateCount} (Expected: 0)`);

    await session.query('COMMIT;');
    await session.close();

    const pass = w1Count === 50 && crossReadCount === 0 && crossUpdateCount === 0;

    results.push({
        testId: 'TEST-01',
        title: 'Tenant Read & Write Boundary Isolation',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { w1Count, crossReadCount, crossUpdateCount }
    });
}

// =========================================================================
// TEST 2: Fail-Closed Null Context Protection
// =========================================================================
async function runTest2() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 2: Fail-Closed Null Context Protection');
    console.log('============================================================');
    resetDatabase();

    const session = new DbSession('AppUser-T2', 'RUNTIME');
    await session.connect();

    // 1. Transaction starts WITHOUT calling set_tenant_context
    await session.query('BEGIN;');

    const unscopedReadRes = await session.query('SELECT count(*) FROM poc_db_01.student_leads;');
    const unscopedCount = parseInt(unscopedReadRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
    console.log(`Leads visible without tenant context: ${unscopedCount} (Expected: 0)`);

    // 2. Attempt insert without tenant context -> MUST be rejected by RLS WITH CHECK
    let insertRejectedWithRls = false;
    const testLeadId = '018f3a5e-0003-7000-8000-000000000001';
    const insertRes = await session.query(
        `INSERT INTO poc_db_01.student_leads (id, workspace_id, student_name, phone_blind_index_v2, encrypted_phone)
         VALUES ('${testLeadId}', '${W1_ID}', 'Unscoped Student', md5('unscoped_phone'), 'enc_phone');`,
        { expectedError: /violates row-level security policy/ }
    );
    insertRejectedWithRls = insertRes.matchedExpectedError === true;
    console.log(`Insert without context rejected by RLS policy: ${insertRejectedWithRls}`);

    await session.query('ROLLBACK;');
    await session.close();

    const pass = unscopedCount === 0 && insertRejectedWithRls === true;

    results.push({
        testId: 'TEST-02',
        title: 'Fail-Closed Null Context Protection',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { unscopedCount, insertRejectedWithRls }
    });
}

// =========================================================================
// TEST 3: Connection Pooler Context Discard (is_local = true)
// =========================================================================
async function runTest3() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 3: Connection Pooler Context Discard (is_local = true)');
    console.log('============================================================');
    resetDatabase();

    const session = new DbSession('PooledClient-T3', 'RUNTIME');
    await session.connect();

    // Transaction 1: Sets context to Tenant A (W1)
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);
    const tx1Res = await session.query('SELECT count(*) FROM poc_db_01.student_leads;');
    const tx1Count = parseInt(tx1Res.output.match(/\b\d+\b/)?.[0] || '0', 10);
    await session.query('COMMIT;');
    console.log(`Tx 1 (with W1 context) count: ${tx1Count} (Expected: 50)`);

    // Transaction 2: Executed on the EXACT SAME physical connection without setting context
    await session.query('BEGIN;');
    const tx2Res = await session.query('SELECT count(*) FROM poc_db_01.student_leads;');
    const tx2Count = parseInt(tx2Res.output.match(/\b\d+\b/)?.[0] || '0', 10);
    await session.query('COMMIT;');
    console.log(`Tx 2 (same connection, no context) count: ${tx2Count} (Expected: 0)`);

    await session.close();

    const pass = tx1Count === 50 && tx2Count === 0;

    results.push({
        testId: 'TEST-03',
        title: 'Connection Pooler Context Discard (is_local = true)',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { tx1Count, tx2Count }
    });
}

// =========================================================================
// TEST 4: Atomic Multi-Table Rollback on Operational Failure
// =========================================================================
async function runTest4() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 4: Atomic Multi-Table Rollback on Operational Failure');
    console.log('============================================================');
    resetDatabase();

    const session = new DbSession('AppUser-T4', 'RUNTIME');
    await session.connect();

    const testLeadId = '018f3a5e-0004-7000-8000-000000000001';
    const testVisitId = '018f3a5e-0004-7000-8000-000000000002';

    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);

    // 1. Insert parent lead
    await session.query(`
        INSERT INTO poc_db_01.student_leads (id, workspace_id, student_name, phone_blind_index_v2, encrypted_phone)
        VALUES ('${testLeadId}', '${W1_ID}', 'Atomic Rollback Candidate', md5('phone_rb'), 'enc_phone');
    `);

    // 2. Insert child visit
    await session.query(`
        INSERT INTO poc_db_01.field_visits (id, workspace_id, lead_id)
        VALUES ('${testVisitId}', '${W1_ID}', '${testLeadId}');
    `);

    // 3. Operational failure (division by zero) forces transaction abort
    const errorRes = await session.query('SELECT 1/0;', { expectedError: /division by zero/ });
    const divisionByZeroTriggered = errorRes.matchedExpectedError === true;
    console.log(`Operational error triggered: ${divisionByZeroTriggered}`);

    // 4. Client issues rollback
    await session.query('ROLLBACK;');
    await session.close();

    // 5. Verify database contains zero partial records (audited via admin)
    const leadExists = queryAdminCount(`SELECT count(*) FROM poc_db_01.student_leads WHERE id = '${testLeadId}';`) === 1;
    const visitExists = queryAdminCount(`SELECT count(*) FROM poc_db_01.field_visits WHERE id = '${testVisitId}';`) === 1;

    console.log(`Lead record persisted: ${leadExists} (Expected: false)`);
    console.log(`Visit record persisted: ${visitExists} (Expected: false)`);

    const pass = divisionByZeroTriggered && !leadExists && !visitExists;

    results.push({
        testId: 'TEST-04',
        title: 'Atomic Multi-Table Rollback on Operational Failure',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { divisionByZeroTriggered, leadExists, visitExists }
    });
}

// =========================================================================
// TEST 5: Tenant-Scoped Phone Blind-Index Uniqueness (phone_blind_index_v2)
// =========================================================================
async function runTest5() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 5: Tenant-Scoped Phone Blind-Index Uniqueness (phone_blind_index_v2)');
    console.log('============================================================');
    resetDatabase();

    const session = new DbSession('AppUser-T5', 'RUNTIME');
    await session.connect();

    const sharedBlindIndex = crypto.createHash('sha256').update('+919876543210_HMAC_SALT').digest('hex');
    const leadIdW1A = '018f3a5e-0005-7000-8000-000000000001';
    const leadIdW2 = '018f3a5e-0005-7000-8000-000000000002';
    const leadIdW1Duplicate = '018f3a5e-0005-7000-8000-000000000003';
    const leadIdW1Reuse = '018f3a5e-0005-7000-8000-000000000004';

    // 1. Insert into Tenant A (W1) -> MUST succeed
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);
    await session.query(`
        INSERT INTO poc_db_01.student_leads (id, workspace_id, student_name, phone_blind_index_v2, encrypted_phone)
        VALUES ('${leadIdW1A}', '${W1_ID}', 'Tenant A Lead 1', '${sharedBlindIndex}', 'enc_phone');
    `);
    await session.query('COMMIT;');
    console.log('1. Insert into Tenant A succeeded.');

    // 2. Insert IDENTICAL phone into Tenant B (W2) -> MUST succeed (Cross-tenant co-existence)
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W2_STAFF}', '${W2_ID}');`);
    await session.query(`
        INSERT INTO poc_db_01.student_leads (id, workspace_id, student_name, phone_blind_index_v2, encrypted_phone)
        VALUES ('${leadIdW2}', '${W2_ID}', 'Tenant B Lead 1', '${sharedBlindIndex}', 'enc_phone');
    `);
    await session.query('COMMIT;');
    console.log('2. Insert identical phone into Tenant B succeeded (cross-tenant uniqueness preserved).');

    // 3. Attempt duplicate insert into Tenant A (W1) while active -> MUST throw unique constraint violation
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);
    let duplicateRejected = false;
    const dupRes = await session.query(
        `INSERT INTO poc_db_01.student_leads (id, workspace_id, student_name, phone_blind_index_v2, encrypted_phone)
         VALUES ('${leadIdW1Duplicate}', '${W1_ID}', 'Tenant A Duplicate', '${sharedBlindIndex}', 'enc_phone');`,
        { expectedError: /unique constraint.*idx_leads_workspace_phone_v2/ }
    );
    duplicateRejected = dupRes.matchedExpectedError === true;
    await session.query('ROLLBACK;');
    console.log(`3. Duplicate insert into Tenant A rejected by partial index: ${duplicateRejected}`);

    // 4. Soft-delete original lead in Tenant A (deleted_at = NOW())
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);
    await session.query(`UPDATE poc_db_01.student_leads SET deleted_at = NOW() WHERE id = '${leadIdW1A}';`);
    await session.query('COMMIT;');
    console.log('4. Original lead in Tenant A soft-deleted.');

    // 5. Re-insert identical phone into Tenant A -> MUST succeed (partial index allows re-use after soft delete)
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);
    await session.query(`
        INSERT INTO poc_db_01.student_leads (id, workspace_id, student_name, phone_blind_index_v2, encrypted_phone)
        VALUES ('${leadIdW1Reuse}', '${W1_ID}', 'Tenant A Re-used Lead', '${sharedBlindIndex}', 'enc_phone');
    `);
    await session.query('COMMIT;');
    console.log('5. Re-insert after soft-delete succeeded.');

    await session.close();

    const pass = duplicateRejected === true;

    results.push({
        testId: 'TEST-05',
        title: 'Tenant-Scoped Phone Blind-Index Uniqueness (phone_blind_index_v2)',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { duplicateRejected, sharedBlindIndex }
    });
}

// =========================================================================
// TEST 6: Staff-Seat Quota Atomic Serialization (Parent Row Lock)
// =========================================================================
async function runTest6() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 6: Staff-Seat Quota Atomic Serialization (Parent Row Lock)');
    console.log('============================================================');
    resetDatabase();

    // Baseline: Tenant A has 10 seats allocated in workspace_subscriptions; 9 active members exist.
    const worker1 = new DbSession('Provisioner-1', 'RUNTIME');
    const worker2 = new DbSession('Provisioner-2', 'RUNTIME');
    await worker1.connect();
    await worker2.connect();

    console.log('Worker 1 begins provisioning seat #10 and acquires parent subscription lock...');
    await worker1.query('BEGIN;');
    await worker1.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);
    await worker1.query(`
        SELECT id, total_allocated_seats 
        FROM poc_db_01.workspace_subscriptions 
        WHERE workspace_id = '${W1_ID}' FOR UPDATE;
    `);

    // Worker 1 holds lock for 600ms
    const worker1Sleep = worker1.query('SELECT pg_sleep(0.6);');

    await sleep(150);
    console.log('Worker 2 concurrently attempts to provision seat #10 (blocks on parent lock)...');
    let worker2BlockedMs = 0;
    let worker2ApplicationQuotaExceededRaised = false;
    let worker2HttpError = '';

    const worker2Promise = (async () => {
        await worker2.query('BEGIN;');
        await worker2.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);
        const lockRes = await worker2.query(`
            SELECT id, total_allocated_seats 
            FROM poc_db_01.workspace_subscriptions 
            WHERE workspace_id = '${W1_ID}' FOR UPDATE;
        `);
        worker2BlockedMs = lockRes.durationMs;

        // Check active seats under lock
        const activeCountRes = await worker2.query(`
            SELECT count(*) FROM poc_db_01.workspace_memberships 
            WHERE workspace_id = '${W1_ID}' AND is_active = TRUE;
        `);
        const activeCount = parseInt(activeCountRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
        const totalSeats = 10;

        if (activeCount >= totalSeats) {
            // Simulated Application Layer Guard returning HTTP 422
            worker2ApplicationQuotaExceededRaised = true;
            worker2HttpError = 'HTTP 422 Unprocessable Entity (SEAT_QUOTA_EXCEEDED)';
            await worker2.query('ROLLBACK;');
        } else {
            await worker2.query(`
                INSERT INTO poc_db_01.workspace_memberships (id, workspace_id, user_id, role, is_active)
                VALUES (gen_random_uuid(), '${W1_ID}', gen_random_uuid(), 'PRO', TRUE);
            `);
            await worker2.query('COMMIT;');
        }
    })();

    // Worker 1 finishes sleep, verifies active seats (9 < 10), inserts seat #10, and commits
    await worker1Sleep;
    await worker1.query(`
        INSERT INTO poc_db_01.workspace_memberships (id, workspace_id, user_id, role, is_active)
        VALUES (gen_random_uuid(), '${W1_ID}', gen_random_uuid(), 'PRO', TRUE);
    `);
    await worker1.query('COMMIT;');
    console.log('Worker 1 committed seat #10.');

    // Worker 2 unblocks
    await worker2Promise;
    console.log(`Worker 2 unblocked after ${worker2BlockedMs} ms.`);
    console.log(`Worker 2 caught quota exceeded condition: ${worker2ApplicationQuotaExceededRaised}`);
    console.log(`Worker 2 application error: "${worker2HttpError}"`);

    await worker1.close();
    await worker2.close();

    const finalActiveSeats = queryAdminCount(`
        SELECT count(*) FROM poc_db_01.workspace_memberships 
        WHERE workspace_id = '${W1_ID}' AND is_active = TRUE;
    `);
    console.log(`Final active memberships in Tenant A: ${finalActiveSeats} (Expected: 10)`);

    const pass = worker2BlockedMs >= 300 && 
                 worker2ApplicationQuotaExceededRaised === true && 
                 finalActiveSeats === 10;

    results.push({
        testId: 'TEST-06',
        title: 'Staff-Seat Quota Atomic Serialization (Parent Row Lock)',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { worker2BlockedMs, worker2ApplicationQuotaExceededRaised, finalActiveSeats, worker2HttpError }
    });
}

// =========================================================================
// TEST 7: Unprivileged Runtime Role Attribute Enforcement
// =========================================================================
async function runTest7() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 7: Unprivileged Runtime Role Attribute Enforcement');
    console.log('============================================================');

    // 1. Verify poc_db_01_runtime_user in pg_roles
    const roleRes = execAdminSql(`
        SELECT rolsuper, rolbypassrls 
        FROM pg_roles 
        WHERE rolname = '${RUNTIME_USER}';
    `);
    const isSuper = roleRes.includes('t|') || roleRes.startsWith('t');
    const hasBypass = roleRes.includes('|t') || roleRes.endsWith('t');

    console.log(`poc_db_01_runtime_user rolsuper: ${isSuper} (Expected: false)`);
    console.log(`poc_db_01_runtime_user rolbypassrls: ${hasBypass} (Expected: false)`);

    // 2. Verify FORCE ROW LEVEL SECURITY on student_leads in pg_class
    const rlsRes = execAdminSql(`
        SELECT c.relrowsecurity, c.relforcerowsecurity 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'poc_db_01' AND c.relname = 'student_leads';
    `);
    const hasRls = rlsRes.includes('t|') || rlsRes.startsWith('t');
    const hasForceRls = rlsRes.includes('|t') || rlsRes.endsWith('t');

    console.log(`student_leads relrowsecurity: ${hasRls} (Expected: true)`);
    console.log(`student_leads relforcerowsecurity: ${hasForceRls} (Expected: true)`);

    const pass = !isSuper && !hasBypass && hasRls && hasForceRls;

    results.push({
        testId: 'TEST-07',
        title: 'Unprivileged Runtime Role Attribute Enforcement',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { isSuper, hasBypass, hasRls, hasForceRls }
    });
}

// =========================================================================
// TEST 8: Connection Pooler RLS Latency Overhead Benchmark
// =========================================================================
async function runTest8() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 8: Connection Pooler RLS Latency Overhead Benchmark');
    console.log('============================================================');
    resetDatabase();

    const session = new DbSession('Benchmarker-T8', 'RUNTIME');
    await session.connect();

    const ITERATIONS = 200;
    const baselineLatencies = [];
    const injectedLatencies = [];

    // Warm-up
    await session.query('BEGIN; SELECT 1; COMMIT;');

    // 1. Baseline transaction latency
    for (let i = 0; i < ITERATIONS; i++) {
        const start = Date.now();
        await session.query('BEGIN; SELECT 1; COMMIT;');
        baselineLatencies.push(Date.now() - start);
    }

    // 2. Context-injected transaction latency
    for (let i = 0; i < ITERATIONS; i++) {
        const start = Date.now();
        await session.query(`BEGIN; SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}'); SELECT 1; COMMIT;`);
        injectedLatencies.push(Date.now() - start);
    }

    await session.close();

    baselineLatencies.sort((a, b) => a - b);
    injectedLatencies.sort((a, b) => a - b);

    const p95Idx = Math.floor(ITERATIONS * 0.95);
    const p95Baseline = baselineLatencies[p95Idx];
    const p95Injected = injectedLatencies[p95Idx];
    const deltaMs = Math.max(0, p95Injected - p95Baseline);

    console.log(`p95 Baseline Latency: ${p95Baseline} ms`);
    console.log(`p95 Context-Injected Latency: ${p95Injected} ms`);
    console.log(`p95 Delta Latency Overhead: ${deltaMs} ms (Ceiling: < 2.0 ms)`);
    console.log('POOLER LIMITATION NOTE: This measures local SQL loopback overhead.');
    console.log('Live multi-client PgBouncer pooler validation requires an external PgBouncer daemon.');

    const pass = deltaMs <= 2.0;

    results.push({
        testId: 'TEST-08',
        title: 'Connection Pooler RLS Latency Overhead Benchmark',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { p95Baseline, p95Injected, deltaMs }
    });
}

// =========================================================================
// TEST 9: Unauthorized Cross-Tenant Context Switching & Forgery Rejection
// =========================================================================
async function runTest9() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 9: Unauthorized Cross-Tenant Context Switching & Forgery Rejection');
    console.log('============================================================');
    resetDatabase();

    const session = new DbSession('Attacker-T9', 'RUNTIME');
    await session.connect();

    // 1. Authorized user (USER_W1_ADMIN) legitimately establishes Workspace A (W1) context
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W1_ID}');`);
    const w1ReadRes = await session.query('SELECT count(*) FROM poc_db_01.student_leads;');
    const w1Count = parseInt(w1ReadRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
    console.log(`1. Legitimate Workspace A context established. Leads visible: ${w1Count} (Expected: 50)`);

    // 2. The same transaction attempts to switch to Workspace B (W2) -> MUST be rejected by in-transaction immutability guard
    let midTxSwitchRejected = false;
    const midTxRes = await session.query(
        `SELECT poc_db_01.set_tenant_context('${USER_W2_STAFF}', '${W2_ID}');`,
        { expectedError: /AUTHORIZATION_FAILURE: Cannot switch tenant context within an active transaction|42501/ }
    );
    midTxSwitchRejected = midTxRes.matchedExpectedError === true;
    console.log(`2. Mid-transaction context switch rejected by immutability guard: ${midTxSwitchRejected}`);

    // Since the transaction failed due to the error, roll it back
    await session.query('ROLLBACK;');

    // 3. User who belongs ONLY to Workspace A attempts to establish Workspace B context in a fresh transaction -> MUST be rejected
    await session.query('BEGIN;');
    let unauthorizedMembershipRejected = false;
    const unauthRes = await session.query(
        `SELECT poc_db_01.set_tenant_context('${USER_W1_ADMIN}', '${W2_ID}');`,
        { expectedError: /AUTHORIZATION_FAILURE: Invalid tenant context or unauthorized user|42501/ }
    );
    unauthorizedMembershipRejected = unauthRes.matchedExpectedError === true;
    console.log(`3. Unauthorized user establishing Workspace B context rejected: ${unauthorizedMembershipRejected}`);

    // Also verify deactivated member of Workspace A is rejected for Workspace A
    let inactiveUserRejected = false;
    const inactiveRes = await session.query(
        `SELECT poc_db_01.set_tenant_context('${USER_INACTIVE_W1}', '${W1_ID}');`,
        { expectedError: /AUTHORIZATION_FAILURE: Invalid tenant context or unauthorized user|42501/ }
    );
    inactiveUserRejected = inactiveRes.matchedExpectedError === true;
    console.log(`3b. Deactivated user rejected: ${inactiveUserRejected}`);

    await session.query('ROLLBACK;');

    // 4. Cross-tenant reads and writes remain blocked after rejected attempts
    await session.query('BEGIN;');
    const postRejectionReadRes = await session.query('SELECT count(*) FROM poc_db_01.student_leads;');
    const postRejectionReadCount = parseInt(postRejectionReadRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
    console.log(`4. Unauthenticated leads visible after rejected attempts: ${postRejectionReadCount} (Expected: 0)`);

    const crossWriteRes = await session.query(`
        WITH upd AS (
            UPDATE poc_db_01.student_leads 
            SET student_name = 'EXPLOIT_ATTACK' 
            WHERE workspace_id = '${W2_ID}' 
            RETURNING id
        )
        SELECT count(*) FROM upd;
    `);
    const crossWriteCount = parseInt(crossWriteRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
    console.log(`4b. Workspace B rows updated: ${crossWriteCount} (Expected: 0)`);
    await session.query('ROLLBACK;');

    // 5. User who is legitimately authorized for Workspace B establishes context
    await session.query('BEGIN;');
    await session.query(`SELECT poc_db_01.set_tenant_context('${USER_W2_STAFF}', '${W2_ID}');`);
    const w2ReadRes = await session.query('SELECT count(*) FROM poc_db_01.student_leads;');
    const w2Count = parseInt(w2ReadRes.output.match(/\b\d+\b/)?.[0] || '0', 10);
    console.log(`5. Legitimate Workspace B user established context. Leads visible: ${w2Count} (Expected: 50)`);
    await session.query('COMMIT;');

    await session.close();

    // 6. Identity Trust Limitation Check
    console.log('TRUST BOUNDARY AUDIT: Dual-parameter membership check verified.');
    console.log('IDENTITY TRUST LIMITATION: Database trusts caller-supplied p_user_id.');
    console.log('Arbitrary SQL execution by poc_db_01_runtime_user could forge another user UUID if known.');

    const pass = w1Count === 50 && 
                 midTxSwitchRejected === true && 
                 unauthorizedMembershipRejected === true && 
                 inactiveUserRejected === true &&
                 postRejectionReadCount === 0 && 
                 crossWriteCount === 0 && 
                 w2Count === 50;

    results.push({
        testId: 'TEST-09',
        title: 'Unauthorized Cross-Tenant Context Switching & Forgery Rejection',
        verdict: pass ? 'PASS' : 'FAIL',
        details: {
            w1Count,
            midTxSwitchRejected,
            unauthorizedMembershipRejected,
            inactiveUserRejected,
            postRejectionReadCount,
            crossWriteCount,
            w2Count,
            identityTrustLimitation: "UNVERIFIED AT DB LAYER: Caller-supplied p_user_id is trusted by poc_db_01_runtime_user; cryptographic identity token requires application-level signing or database session tokens."
        }
    });
}

// =========================================================================
// MAIN RUNNER
// =========================================================================
async function main() {
    console.log('============================================================');
    console.log('POC-DB-01 SAFETY ENFORCEMENT GATE: ACTIVE');
    console.log(`Database Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log(`Runtime Role: ${RUNTIME_USER} (Unprivileged)`);
    console.log(`Host Classification: VERIFIED LOOPBACK (${DB_HOST})`);
    console.log(`Database Classification: VERIFIED DISPOSABLE ALLOWLIST (${DB_NAME})`);
    console.log('DISPOSABILITY CONFIRMATION: OPERATOR CONFIRMED VIA .ENV.POC');
    console.log('============================================================\n');

    try {
        console.log('--- One-Time Schema & Role Initialization (schema.sql) ---');
        initializeSchema();
        console.log('Schema initialization complete.\n');

        await runTest1();
        await runTest2();
        await runTest3();
        await runTest4();
        await runTest5();
        await runTest6();
        await runTest7();
        await runTest8();
        await runTest9();
    } catch (err) {
        console.error('Fatal Test Runner Error:', err);
        process.exitCode = 1;
    }

    console.log('\n============================================================');
    console.log('FINAL POC-DB-01 RESULTS SUMMARY:');
    console.log('============================================================');
    results.forEach(r => {
        console.log(`[${r.verdict}] ${r.testId}: ${r.title}`);
    });

    const reportPath = path.join(__dirname, 'POC_DB_01_RESULTS.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        executedAt: new Date().toISOString(),
        database: `${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
        summary: {
            total: results.length,
            passed: results.filter(r => r.verdict === 'PASS').length,
            failed: results.filter(r => r.verdict === 'FAIL').length
        },
        tests: results
    }, null, 2));

    console.log(`\nDetailed JSON results written to: ${reportPath}`);
}

main();
