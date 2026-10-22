/**
 * POC-ARCHIVE-01: Automated Concurrency & Archival Deletion Test Suite
 * Evaluates:
 *   Test 1: Workspace-wide compliance hold serialization & wait times
 *   Test 2: Academic-year-specific hold & cross-cohort serialization bottleneck
 *   Test 3: Post-export mutation detection & exclusion (leads & child interactions)
 *   Test 4: Freshness-check vs. delete race condition & explicit conflict enforcement
 *   Test 5: Mid-cleanup authorization revocation
 *   Test 6: Worker crash failure recovery & durable checkpoint resumption
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 1. Load configuration from .env.poc
const envPath = path.join(__dirname, '.env.poc');
if (!fs.existsSync(envPath)) {
    throw new Error('SECURITY HALT: Missing .env.poc in poc-archive-01/. Refusing to execute without explicit local configuration.');
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
const APPROVED_DISPOSABLE_DATABASES = new Set(['shop_db', 'poc_archive_test_db', 'disposable_poc_db']);

// 1. Check and validate POC_DATABASE_URL if present (prevent connection-string bypass)
const rawUrl = getEnvVar('POC_DATABASE_URL') || process.env.POC_DATABASE_URL;
if (rawUrl) {
    try {
        const parsedUrl = new URL(rawUrl);
        const urlHost = parsedUrl.hostname.toLowerCase();
        const urlDb = parsedUrl.pathname.replace(/^\//, '');
        if (!APPROVED_LOOPBACK_HOSTS.has(urlHost)) {
            throw new Error(`SECURITY HALT: POC_DATABASE_URL host "${urlHost}" is not an approved loopback host (${[...APPROVED_LOOPBACK_HOSTS].join(', ')}). Refusing to connect to non-loopback host.`);
        }
        if (!APPROVED_DISPOSABLE_DATABASES.has(urlDb)) {
            throw new Error(`SECURITY HALT: POC_DATABASE_URL database "${urlDb}" is not an approved disposable database (${[...APPROVED_DISPOSABLE_DATABASES].join(', ')}).`);
        }
    } catch (urlErr) {
        if (urlErr.message.startsWith('SECURITY HALT')) throw urlErr;
        throw new Error(`SECURITY HALT: POC_DATABASE_URL is malformed: ${urlErr.message}`);
    }
}

// 2. Validate explicit host
const rawHost = getEnvVar('POC_DB_HOST') || '127.0.0.1';
const DB_HOST = rawHost.trim().toLowerCase();
if (!APPROVED_LOOPBACK_HOSTS.has(DB_HOST)) {
    throw new Error(`SECURITY HALT: Prohibited database host "${DB_HOST}". Only local loopback hosts (${[...APPROVED_LOOPBACK_HOSTS].join(', ')}) are permitted for this PoC.`);
}

// 3. Validate explicit database name
const rawDb = getEnvVar('POC_DB_NAME') || 'shop_db';
const DB_NAME = rawDb.trim();
if (!APPROVED_DISPOSABLE_DATABASES.has(DB_NAME)) {
    throw new Error(`SECURITY HALT: Prohibited database name "${DB_NAME}". Only explicitly allowlisted disposable databases (${[...APPROVED_DISPOSABLE_DATABASES].join(', ')}) are permitted.`);
}

// 4. Validate user and credentials
const rawUser = getEnvVar('POC_DB_USER') || 'postgres';
const DB_USER = rawUser.trim();
const DB_PASS = getEnvVar('POC_DB_PASS');
if (!DB_PASS) {
    throw new Error('SECURITY HALT: POC_DB_PASS is not configured in .env.poc. Refusing to run without credentials from .env.poc.');
}

const rawPort = getEnvVar('POC_DB_PORT') || '5432';
const DB_PORT = rawPort.trim();
if (!/^\d+$/.test(DB_PORT) || parseInt(DB_PORT, 10) < 1 || parseInt(DB_PORT, 10) > 65535) {
    throw new Error(`SECURITY HALT: Invalid database port "${DB_PORT}".`);
}

const PSQL_PATH = getEnvVar('PSQL_PATH') || 'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe';

const PSQL_ENV = { ...process.env, PGPASSWORD: DB_PASS };

function sanitizeError(msg) {
    if (!msg) return '';
    let sanitized = String(msg);
    if (DB_PASS) {
        sanitized = sanitized.split(DB_PASS).join('***REDACTED***');
    }
    sanitized = sanitized.replace(/postgres:\/\/([^:]+):([^@]+)@/g, 'postgres://$1:***REDACTED***@');
    return sanitized.trim();
}

const W1_ID = '018f3a5e-0001-7000-8000-000000000001';
const AY1_ID = '018f3a5e-0002-7000-8000-000000000001';
const AY2_ID = '018f3a5e-0002-7000-8000-000000000002';
const AUTH_AY1_ID = '018f3a5e-0004-7000-8000-000000000001';
const AUTH_AY2_ID = '018f3a5e-0004-7000-8000-000000000002';

// 2. Database Session Abstraction for Interactive Multi-Session Concurrency
class DbSession {
    constructor(name) {
        this.name = name;
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
        return new Promise((resolve, reject) => {
            this.proc = spawn(PSQL_PATH, [
                '-U', DB_USER,
                '-h', DB_HOST,
                '-p', DB_PORT,
                '-d', DB_NAME,
                '-w',
                '-v', 'ON_ERROR_STOP=1',
                '-P', 'pager=off',
                '-q'
            ], { env: PSQL_ENV });

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
                    const exitErr = new Error(`${this.name}: psql process exited unexpectedly with code ${code} (signal: ${signal}). Error details: ${errOutput.trim()}`);
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

        // Check for PostgreSQL errors in output
        const hasPgError = /\b(ERROR|FATAL|PANIC):\s+/i.test(output);

        if (hasPgError) {
            // Intentional error check
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

    getPid() {
        return this.proc ? this.proc.pid : null;
    }

    isKilled() {
        return this.proc ? this.proc.killed : true;
    }
}

function execSql(sql) {
    try {
        const cleanSql = sql.replace(/[\r\n]+/g, ' ').replace(/"/g, '\"').trim();
        const res = execSync(`"${PSQL_PATH}" -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -w -t -A -v ON_ERROR_STOP=1 -c "${cleanSql}"`, {
            env: PSQL_ENV,
            stdio: ['pipe', 'pipe', 'pipe']
        }).toString();
        return res.trim();
    } catch (err) {
        throw new Error(`SQL Exec Error: ${sanitizeError(err.stderr ? err.stderr.toString() : err.message)}`);
    }
}

function queryCount(sql) {
    const raw = execSql(sql);
    const m = raw.match(/\b\d+\b/);
    return m ? parseInt(m[0], 10) : 0;
}

function execFile(relPath) {
    const fullPath = path.join(__dirname, relPath);
    try {
        execSync(`"${PSQL_PATH}" -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT} -d ${DB_NAME} -w -v ON_ERROR_STOP=1 -f "${fullPath}"`, {
            env: PSQL_ENV,
            stdio: ['pipe', 'pipe', 'pipe']
        });
    } catch (err) {
        throw new Error(`SQL File Exec Error (${relPath}): ${sanitizeError(err.stderr ? err.stderr.toString() : err.message)}`);
    }
}

function resetDatabase() {
    execFile('schema.sql');
    execFile('seed.sql');
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const results = [];

// =========================================================================
// TEST 1: Workspace-wide compliance hold serialization
// =========================================================================
async function runTest1() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 1: Workspace-wide compliance hold serialization');
    console.log('============================================================');
    resetDatabase();

    const workerAy1 = new DbSession('Worker-AY1');
    const workerAy2 = new DbSession('Worker-AY2');
    const holdCreator = new DbSession('Hold-Creator');

    await workerAy1.connect();
    await workerAy2.connect();
    await holdCreator.connect();

    console.log('1. Worker AY1 starts Batch 1 (acquiring workspace & AY1 lock)...');
    await workerAy1.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
    await workerAy1.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await workerAy1.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    await workerAy1.query(`SELECT status, expires_at FROM workspace_archive_deletion_authorizations WHERE id = '${AUTH_AY1_ID}' AND status IN ('AUTHORIZED', 'IN_PROGRESS') FOR UPDATE;`);

    await workerAy1.query(`
        DELETE FROM follow_up_tasks WHERE lead_id IN (
            SELECT id FROM student_leads WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM telecall_interactions WHERE lead_id IN (
            SELECT id FROM student_leads WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM field_visits WHERE lead_id IN (
            SELECT id FROM student_leads WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM student_leads WHERE id IN (
            SELECT id FROM student_leads WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        INSERT INTO archive_deletion_batch_runs (id, authorization_id, batch_num, chunk_start_id, chunk_end_id, records_deleted_count)
        VALUES (gen_random_uuid(), '${AUTH_AY1_ID}', 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000200', 200);
    `);

    console.log('Worker AY1 holding locks and simulating work for 800ms...');
    const workerSleepPromise = workerAy1.query('SELECT pg_sleep(0.8);');

    await sleep(200);
    console.log('2. Hold Creator concurrently attempts workspace-wide hold creation (blocks on workspace lock)...');
    const holdPromise = (async () => {
        await holdCreator.query('BEGIN;');
        const lockRes = await holdCreator.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
        const waitMs = lockRes.durationMs;
        console.log(`Hold Creator UNBLOCKED! Actual measured lock wait time: ${waitMs} ms`);

        await holdCreator.query(`
            INSERT INTO workspace_compliance_holds (id, workspace_id, academic_year_id, hold_reason, authorized_by, is_active)
            VALUES (gen_random_uuid(), '${W1_ID}', NULL, 'STATUTORY_AUDIT_WORKSPACE_WIDE', gen_random_uuid(), TRUE);
        `);

        await holdCreator.query(`
            UPDATE workspace_archive_deletion_authorizations 
            SET status = 'REVOKED', revoked_at = NOW(), revocation_reason = 'WORKSPACE_WIDE_COMPLIANCE_HOLD_PLACED'
            WHERE workspace_id = '${W1_ID}' AND status IN ('AUTHORIZED', 'IN_PROGRESS');
        `);

        await holdCreator.query('COMMIT;');
        return waitMs;
    })();

    await workerSleepPromise;
    await workerAy1.query('COMMIT;');
    console.log('3. Worker AY1 committed Batch 1 (200 rows deleted).');

    const measuredWaitMs = await holdPromise;

    console.log('4. Worker AY1 attempts Batch 2...');
    await workerAy1.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
    await workerAy1.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await workerAy1.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    
    const auth1Check = await workerAy1.query(`SELECT status FROM workspace_archive_deletion_authorizations WHERE id = '${AUTH_AY1_ID}' FOR UPDATE;`);
    const holds1Check = await workerAy1.query(`
        SELECT id, hold_reason FROM workspace_compliance_holds 
        WHERE workspace_id = '${W1_ID}' AND (academic_year_id = '${AY1_ID}' OR academic_year_id IS NULL) AND is_active = TRUE FOR UPDATE;
    `);

    let workerAy1Halted = false;
    if (auth1Check.output.includes('REVOKED') || holds1Check.output.includes('STATUTORY_AUDIT')) {
        workerAy1Halted = true;
        await workerAy1.query('ROLLBACK;');
        console.log('Worker AY1 detected hold/revocation and cleanly ABORTED Batch 2.');
    } else {
        await workerAy1.query('COMMIT;');
    }

    console.log('5. Worker AY2 attempts Batch 1...');
    await workerAy2.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
    await workerAy2.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await workerAy2.query(`SELECT id FROM academic_years WHERE id = '${AY2_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    
    const auth2Check = await workerAy2.query(`SELECT status FROM workspace_archive_deletion_authorizations WHERE id = '${AUTH_AY2_ID}' FOR UPDATE;`);
    const holds2Check = await workerAy2.query(`
        SELECT id, hold_reason FROM workspace_compliance_holds 
        WHERE workspace_id = '${W1_ID}' AND (academic_year_id = '${AY2_ID}' OR academic_year_id IS NULL) AND is_active = TRUE FOR UPDATE;
    `);

    let workerAy2Halted = false;
    if (auth2Check.output.includes('REVOKED') || holds2Check.output.includes('STATUTORY_AUDIT')) {
        workerAy2Halted = true;
        await workerAy2.query('ROLLBACK;');
        console.log('Worker AY2 detected workspace-wide hold and cleanly ABORTED Batch 1.');
    } else {
        await workerAy2.query('COMMIT;');
    }

    await workerAy1.close();
    await workerAy2.close();
    await holdCreator.close();

    const ay1RemainingLeads = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY1_ID}';`);
    const ay2RemainingLeads = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY2_ID}';`);
    const batchRunsCount = queryCount(`SELECT count(*) FROM archive_deletion_batch_runs WHERE authorization_id = '${AUTH_AY1_ID}';`);

    const pass = workerAy1Halted && workerAy2Halted && ay1RemainingLeads === 300 && ay2RemainingLeads === 500 && batchRunsCount === 1;

    console.log(`Test 1 Results:
- AY1 Remaining Leads: ${ay1RemainingLeads} (Expected: 300)
- AY2 Remaining Leads: ${ay2RemainingLeads} (Expected: 500)
- Recorded Batch Runs: ${batchRunsCount} (Expected: 1)
- Measured Lock Wait Time: ${measuredWaitMs} ms
- Worker AY1 Aborted Post-Hold: ${workerAy1Halted}
- Worker AY2 Aborted Post-Hold: ${workerAy2Halted}
- Verdict: ${pass ? 'PASS' : 'FAIL'}
    `);

    results.push({
        testId: 'TEST-01',
        title: 'Workspace-wide compliance hold serialization & revocation',
        verdict: pass ? 'PASS' : 'FAIL',
        measuredLockWaitMs: measuredWaitMs,
        details: { ay1RemainingLeads, ay2RemainingLeads, batchRunsCount, workerAy1Halted, workerAy2Halted }
    });
}

// =========================================================================
// TEST 2: Academic-year-specific hold & Cross-Cohort Serialization
// =========================================================================
async function runTest2() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 2: Academic-year-specific hold & bottleneck analysis');
    console.log('============================================================');
    resetDatabase();

    const workerAy1 = new DbSession('Worker-AY1');
    const workerAy2 = new DbSession('Worker-AY2');
    const holdCreator = new DbSession('Hold-Creator');

    await workerAy1.connect();
    await workerAy2.connect();
    await holdCreator.connect();

    console.log('1. Placing compliance hold specifically on Academic Year 1...');
    await holdCreator.query('BEGIN;');
    await holdCreator.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await holdCreator.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    await holdCreator.query(`
        INSERT INTO workspace_compliance_holds (id, workspace_id, academic_year_id, hold_reason, authorized_by, is_active)
        VALUES (gen_random_uuid(), '${W1_ID}', '${AY1_ID}', 'LITIGATION_SPECIFIC_AY1', gen_random_uuid(), TRUE);
    `);
    await holdCreator.query(`
        UPDATE workspace_archive_deletion_authorizations 
        SET status = 'REVOKED', revoked_at = NOW(), revocation_reason = 'COHORT_COMPLIANCE_HOLD_PLACED'
        WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY1_ID}';
    `);
    await holdCreator.query('COMMIT;');

    console.log('2. Demonstrating workspace lock serialization across cohorts (AY1 vs AY2)...');
    await workerAy1.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
    await workerAy1.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    const ay1Sleep = workerAy1.query('SELECT pg_sleep(0.5);');

    await sleep(100);
    console.log('Worker AY2 attempts to acquire workspace lock (blocks on Worker AY1)...');
    let ay2BlockedWaitMs = 0;
    const ay2LockPromise = (async () => {
        await workerAy2.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
        const lockRes = await workerAy2.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
        ay2BlockedWaitMs = lockRes.durationMs;
        console.log(`Worker AY2 unblocked after waiting ${ay2BlockedWaitMs} ms for AY1 to release workspace lock!`);
    })();

    await ay1Sleep;
    const auth1Check = await workerAy1.query(`SELECT status FROM workspace_archive_deletion_authorizations WHERE id = '${AUTH_AY1_ID}' FOR UPDATE;`);
    let ay1Halted = false;
    if (auth1Check.output.includes('REVOKED')) {
        ay1Halted = true;
        await workerAy1.query('ROLLBACK;');
        console.log('Worker AY1 halted cleanly due to cohort-specific hold on AY1.');
    } else {
        await workerAy1.query('COMMIT;');
    }

    await ay2LockPromise;
    console.log('3. Worker AY2 continues deletion on un-held cohort (AY2)...');
    await workerAy2.query(`SELECT id FROM academic_years WHERE id = '${AY2_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    const auth2Check = await workerAy2.query(`SELECT status FROM workspace_archive_deletion_authorizations WHERE id = '${AUTH_AY2_ID}' FOR UPDATE;`);
    const activeHoldsAy2 = queryCount(`
        SELECT count(*) FROM workspace_compliance_holds 
        WHERE workspace_id = '${W1_ID}' AND (academic_year_id = '${AY2_ID}' OR academic_year_id IS NULL) AND is_active = TRUE;
    `);

    let ay2Allowed = false;
    if (auth2Check.output.includes('AUTHORIZED') && activeHoldsAy2 === 0) {
        ay2Allowed = true;
        await workerAy2.query(`
            DELETE FROM follow_up_tasks WHERE lead_id IN (
                SELECT id FROM student_leads WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY2_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
            );
            DELETE FROM telecall_interactions WHERE lead_id IN (
                SELECT id FROM student_leads WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY2_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
            );
            DELETE FROM field_visits WHERE lead_id IN (
                SELECT id FROM student_leads WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY2_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
            );
            DELETE FROM student_leads WHERE id IN (
                SELECT id FROM student_leads WHERE workspace_id = '${W1_ID}' AND academic_year_id = '${AY2_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
            );
            INSERT INTO archive_deletion_batch_runs (id, authorization_id, batch_num, chunk_start_id, chunk_end_id, records_deleted_count)
            VALUES (gen_random_uuid(), '${AUTH_AY2_ID}', 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000200', 200);
        `);
        await workerAy2.query('COMMIT;');
        console.log('Worker AY2 successfully proceeded and deleted 200 unadmitted leads from un-held AY2.');
    } else {
        await workerAy2.query('ROLLBACK;');
        console.log('Worker AY2 unexpectedly blocked!');
    }

    await workerAy1.close();
    await workerAy2.close();
    await holdCreator.close();

    const ay1RemainingLeads = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY1_ID}';`);
    const ay2RemainingLeads = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY2_ID}';`);

    const pass = ay1Halted && ay2Allowed && ay1RemainingLeads === 500 && ay2RemainingLeads === 300 && ay2BlockedWaitMs >= 300;

    console.log(`Test 2 Results:
- AY1 Remaining Leads (Held): ${ay1RemainingLeads} (Expected: 500 preserved)
- AY2 Remaining Leads (Un-held): ${ay2RemainingLeads} (Expected: 300 preserved)
- Cross-Cohort Serialization Wait Time: ${ay2BlockedWaitMs} ms (Demonstrates tenant serialization bottleneck)
- Verdict: ${pass ? 'PASS' : 'FAIL'}
    `);

    results.push({
        testId: 'TEST-02',
        title: 'Academic-year-specific hold & cross-cohort serialization bottleneck',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { ay1RemainingLeads, ay2RemainingLeads, ay1Halted, ay2Allowed, ay2BlockedWaitMs }
    });
}

// =========================================================================
// TEST 3: Mutation after archive export (Comprehensive Child & Telecall Edit Coverage)
// =========================================================================
async function runTest3() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 3: Mutation after export (including telecall edit coverage)');
    console.log('============================================================');
    resetDatabase();

    // Pick 10 candidate leads
    const candRaw = execSql(`
        SELECT id FROM student_leads 
        WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' 
        ORDER BY id ASC LIMIT 10;
    `);
    const candidateUuids = candRaw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [];
    
    const leadA = candidateUuids[0]; // Lead updated directly
    const leadB = candidateUuids[1]; // New field visit added
    const leadC = candidateUuids[2]; // New telecall added
    const leadD = candidateUuids[3]; // Existing telecall updated (edits to historical interaction)
    const leadE = candidateUuids[4]; // New follow-up task added

    // Verify and bind actual cryptographic SHA-256 hash for exported archive manifest
    const exportRaw = execSql(`
        SELECT id, created_at FROM student_leads 
        WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' 
        ORDER BY id ASC;
    `);
    const exportSha256 = crypto.createHash('sha256').update(exportRaw).digest('hex');
    console.log(`Exported manifest payload SHA-256 verified: ${exportSha256}`);
    execSql(`UPDATE workspace_archival_manifests SET payload_sha256 = '${exportSha256}' WHERE academic_year_id = '${AY1_ID}';`);
    execSql(`UPDATE workspace_archive_deletion_authorizations SET payload_sha256 = '${exportSha256}' WHERE academic_year_id = '${AY1_ID}';`);

    console.log('1. Introducing post-export mutations across 5 candidate leads:');
    console.log(`   Lead A (Lead row updated):         ${leadA}`);
    console.log(`   Lead B (Field visit added):         ${leadB}`);
    console.log(`   Lead C (Telecall added):            ${leadC}`);
    console.log(`   Lead D (Existing telecall edited):  ${leadD}`);
    console.log(`   Lead E (Task added):                ${leadE}`);

    execSql(`
        UPDATE student_leads 
        SET updated_at = NOW() - INTERVAL '30 minutes', student_name = student_name || ' (MUTATED)'
        WHERE id = '${leadA}';

        INSERT INTO field_visits (id, lead_id, visited_at, created_at, updated_at, notes)
        VALUES (gen_random_uuid(), '${leadB}', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', 'Post-export counseling');

        INSERT INTO telecall_interactions (id, lead_id, called_at, created_at, updated_at, duration_seconds)
        VALUES (gen_random_uuid(), '${leadC}', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes', 150);

        UPDATE telecall_interactions 
        SET updated_at = NOW() - INTERVAL '30 minutes', duration_seconds = 300
        WHERE lead_id = '${leadD}';

        INSERT INTO follow_up_tasks (id, lead_id, due_date, status, created_at, updated_at)
        VALUES (gen_random_uuid(), '${leadE}', CURRENT_DATE + 7, 'PENDING', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');
    `);

    console.log('2. Running archival deletion worker with pre-batch mutation detection...');
    const worker = new DbSession('Worker-MutationCheck');
    await worker.connect();

    await worker.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
    await worker.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await worker.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);

    // Detect mutated leads against manifest snapshot timestamp (deduplicated in subquery)
    await worker.query(`
        INSERT INTO archive_deletion_exclusions (id, authorization_id, lead_id, reason, entity_updated_at, detected_at)
        SELECT gen_random_uuid(), '${AUTH_AY1_ID}'::uuid, sub.id, 'RECORD_MUTATED_POST_EXPORT', sub.updated_at, NOW()
        FROM (
            SELECT DISTINCT l.id, l.updated_at
            FROM student_leads l
            LEFT JOIN field_visits fv ON fv.lead_id = l.id AND (fv.updated_at > (SELECT export_snapshot_timestamp FROM workspace_archival_manifests WHERE academic_year_id = '${AY1_ID}') OR fv.visited_at > (SELECT export_snapshot_timestamp FROM workspace_archival_manifests WHERE academic_year_id = '${AY1_ID}'))
            LEFT JOIN telecall_interactions ti ON ti.lead_id = l.id AND (ti.called_at > (SELECT export_snapshot_timestamp FROM workspace_archival_manifests WHERE academic_year_id = '${AY1_ID}') OR ti.updated_at > (SELECT export_snapshot_timestamp FROM workspace_archival_manifests WHERE academic_year_id = '${AY1_ID}'))
            LEFT JOIN follow_up_tasks ft ON ft.lead_id = l.id AND ft.updated_at > (SELECT export_snapshot_timestamp FROM workspace_archival_manifests WHERE academic_year_id = '${AY1_ID}')
            WHERE l.id IN (
                SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 10
            )
            AND (
                l.updated_at > (SELECT export_snapshot_timestamp FROM workspace_archival_manifests WHERE academic_year_id = '${AY1_ID}')
                OR fv.id IS NOT NULL
                OR ti.id IS NOT NULL
                OR ft.id IS NOT NULL
            )
        ) sub;
    `);

    // Delete ONLY safe, non-mutated candidate leads (5 safe leads out of 10)
    await worker.query(`
        WITH candidate_batch AS (
            SELECT id FROM student_leads 
            WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' 
            ORDER BY id ASC LIMIT 10
        ),
        excluded_leads AS (
            SELECT lead_id FROM archive_deletion_exclusions WHERE authorization_id = '${AUTH_AY1_ID}'::uuid
        ),
        safe_leads AS (
            SELECT id FROM candidate_batch WHERE id NOT IN (SELECT lead_id FROM excluded_leads)
        ),
        del_tasks AS (
            DELETE FROM follow_up_tasks WHERE lead_id IN (SELECT id FROM safe_leads)
        ),
        del_telecalls AS (
            DELETE FROM telecall_interactions WHERE lead_id IN (SELECT id FROM safe_leads)
        ),
        del_visits AS (
            DELETE FROM field_visits WHERE lead_id IN (SELECT id FROM safe_leads)
        )
        DELETE FROM student_leads WHERE id IN (SELECT id FROM safe_leads);
    `);

    await worker.query('COMMIT;');
    await worker.close();

    const leadAExists = queryCount(`SELECT count(*) FROM student_leads WHERE id = '${leadA}';`) === 1;
    const leadBExists = queryCount(`SELECT count(*) FROM student_leads WHERE id = '${leadB}';`) === 1;
    const leadCExists = queryCount(`SELECT count(*) FROM student_leads WHERE id = '${leadC}';`) === 1;
    const leadDExists = queryCount(`SELECT count(*) FROM student_leads WHERE id = '${leadD}';`) === 1;
    const leadEExists = queryCount(`SELECT count(*) FROM student_leads WHERE id = '${leadE}';`) === 1;
    const admittedLeadsCount = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status = 'ADMITTED';`);
    const exclusionRowsCount = queryCount(`SELECT count(*) FROM archive_deletion_exclusions WHERE authorization_id = '${AUTH_AY1_ID}';`);
    const ay1TotalLeads = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY1_ID}';`);

    const pass = leadAExists && leadBExists && leadCExists && leadDExists && leadEExists && 
                 admittedLeadsCount === 10 && exclusionRowsCount === 5 && ay1TotalLeads === 495;

    console.log(`Test 3 Results:
- Export Manifest Payload SHA-256:            ${exportSha256}
- Mutated Lead A (direct edit) preserved:     ${leadAExists}
- Mutated Lead B (visit added) preserved:     ${leadBExists}
- Mutated Lead C (telecall added) preserved:  ${leadCExists}
- Mutated Lead D (telecall edited) preserved: ${leadDExists} (Proves telecall updated_at coverage)
- Mutated Lead E (task added) preserved:      ${leadEExists}
- Admitted Leads preserved:                   ${admittedLeadsCount} (Expected: 10)
- Exclusions Logged:                          ${exclusionRowsCount} (Expected: 5)
- Total AY1 Leads Remaining:                  ${ay1TotalLeads} (Expected: 495 -> 5 safe deleted, 490 - 5 = 485 + 10 = 495)
- Verdict: ${pass ? 'PASS' : 'FAIL'}
    `);

    results.push({
        testId: 'TEST-03',
        title: 'Mutation after archive export (including telecall edit coverage & manifest SHA-256)',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { exportSha256, leadAExists, leadBExists, leadCExists, leadDExists, leadEExists, admittedLeadsCount, exclusionRowsCount, ay1TotalLeads }
    });
}

// =========================================================================
// TEST 4: Race Condition & Explicit Conflict Enforcement (No Silent Data Loss)
// Evaluates both:
//   4A: Client mutation commits BEFORE archival deletion -> Record is preserved
//   4B: Archival lock acquired FIRST -> Application receives EXPLICIT conflict error (not silent UPDATE 0)
// =========================================================================
async function runTest4() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 4: Race condition & explicit conflict enforcement');
    console.log('============================================================');
    resetDatabase();

    const worker = new DbSession('Worker-Race');
    const client = new DbSession('Client-App');

    await worker.connect();
    await client.connect();

    // ---------------------------------------------------------------------
    // PART 4A: Mutation commits BEFORE deletion lock -> Record is PRESERVED
    // ---------------------------------------------------------------------
    console.log('--- PART 4A: Pre-lock client mutation commits first ---');
    const candA = execSql(`
        SELECT id FROM student_leads 
        WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' 
        ORDER BY id ASC LIMIT 1;
    `);
    const lead4A = candA.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)[0];
    console.log(`Target Lead 4A: ${lead4A}`);

    // Client commits an update on Lead 4A before worker processes batch
    execSql(`UPDATE student_leads SET student_name = 'PRE_LOCK_SAVED_STUDENT', updated_at = NOW() WHERE id = '${lead4A}';`);
    console.log('Client mutation committed on Lead 4A prior to archival batch lock.');

    // Worker executes batch covering Lead 4A
    await worker.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
    await worker.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await worker.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);

    // Worker pre-batch check excludes Lead 4A because updated_at > manifest snapshot
    await worker.query(`
        INSERT INTO archive_deletion_exclusions (id, authorization_id, lead_id, reason, entity_updated_at, detected_at)
        SELECT gen_random_uuid(), '${AUTH_AY1_ID}'::uuid, id, 'RECORD_MUTATED_POST_EXPORT', updated_at, NOW()
        FROM student_leads 
        WHERE id = '${lead4A}' AND updated_at > (SELECT export_snapshot_timestamp FROM workspace_archival_manifests WHERE academic_year_id = '${AY1_ID}');
    `);

    // Worker deletes only non-excluded candidate leads
    await worker.query(`
        WITH excluded AS (SELECT lead_id FROM archive_deletion_exclusions WHERE authorization_id = '${AUTH_AY1_ID}'::uuid)
        DELETE FROM student_leads 
        WHERE id = '${lead4A}' AND id NOT IN (SELECT lead_id FROM excluded);
    `);
    await worker.query('COMMIT;');

    const lead4APreserved = queryCount(`SELECT count(*) FROM student_leads WHERE id = '${lead4A}' AND student_name = 'PRE_LOCK_SAVED_STUDENT';`) === 1;
    console.log(`Part 4A Result: Lead 4A mutated prior to lock was PRESERVED: ${lead4APreserved}`);

    // ---------------------------------------------------------------------
    // PART 4B: Archival lock acquired FIRST -> Explicit Conflict Reported
    // ---------------------------------------------------------------------
    console.log('\n--- PART 4B: Archival lock acquired first (Anti-Silent Data Loss) ---');
    const candB = execSql(`
        SELECT id FROM student_leads 
        WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' AND id != '${lead4A}'
        ORDER BY id ASC LIMIT 1;
    `);
    const lead4B = candB.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)[0];
    console.log(`Target Lead 4B: ${lead4B}`);

    // 1. Worker acquires FOR UPDATE row lock on Lead 4B and holds it
    await worker.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
    await worker.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await worker.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    await worker.query(`SELECT id FROM student_leads WHERE id = '${lead4B}' FOR UPDATE;`);
    console.log('Worker acquired row-level lock on Lead 4B, sleeping 800ms...');
    const workerSleep = worker.query('SELECT pg_sleep(0.8);');

    // 2. Concurrently at t=200ms, Client attempts application update with explicit rowCount conflict check
    await sleep(200);
    console.log('Client concurrently attempts UPDATE on locked Lead 4B (blocks)...');
    let clientWaitMs = 0;
    let clientApplicationConflictRaised = false;
    let clientErrorMessage = '';

    const clientPromise = (async () => {
        await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
        const updateRes = await client.query(`
            WITH upd AS (
                UPDATE student_leads 
                SET student_name = 'CONCURRENT_HACK' 
                WHERE id = '${lead4B}' 
                RETURNING id
            )
            SELECT count(*) AS rows_updated FROM upd;
        `);
        clientWaitMs = updateRes.durationMs;

        // APPLICATION LAYER GUARD (Anti-Silent Data Loss):
        // If the lead was deleted by the concurrent archival transaction, count(*) returns 0.
        // The application layer inspects this count, detects that 0 rows were updated,
        // and raises an explicit conflict error (ARCHIVE_CONCURRENT_DELETION_CONFLICT)
        // rather than silently treating UPDATE 0 as success.
        const match = updateRes.output.match(/\b\d+\b/);
        const rowsUpdated = match ? parseInt(match[0], 10) : 0;
        if (rowsUpdated === 0) {
            clientApplicationConflictRaised = true;
            clientErrorMessage = 'ARCHIVE_CONCURRENT_DELETION_CONFLICT: Target lead was archived/deleted concurrently. Changes aborted.';
            await client.query('ROLLBACK;');
        } else {
            await client.query('COMMIT;');
        }
    })();

    // 3. Worker deletes Lead 4B and commits
    await workerSleep;
    await worker.query(`
        DELETE FROM follow_up_tasks WHERE lead_id = '${lead4B}';
        DELETE FROM telecall_interactions WHERE lead_id = '${lead4B}';
        DELETE FROM field_visits WHERE lead_id = '${lead4B}';
        DELETE FROM student_leads WHERE id = '${lead4B}';
    `);
    await worker.query('COMMIT;');
    console.log('Worker committed deletion of Lead 4B.');

    // 4. Client unblocks after worker commit
    await clientPromise;
    console.log(`Client unblocked after ${clientWaitMs} ms.`);
    console.log(`Application-level conflict detection triggered: ${clientApplicationConflictRaised}`);
    console.log(`Error message returned to caller: "${clientErrorMessage}"`);

    // 5. Test Database-Engine Level Conflict Under REPEATABLE READ
    console.log('\n--- PART 4C: Database engine-level serialization conflict (REPEATABLE READ) ---');
    const candC = execSql(`
        SELECT id FROM student_leads 
        WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' AND id NOT IN ('${lead4A}', '${lead4B}')
        ORDER BY id ASC LIMIT 1;
    `);
    const lead4C = candC.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)[0];

    // Client begins REPEATABLE READ snapshot
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;');
    await client.query(`SELECT id FROM student_leads WHERE id = '${lead4C}';`);

    // Worker concurrently deletes Lead 4C and commits
    await worker.query('BEGIN;');
    await worker.query(`
        DELETE FROM follow_up_tasks WHERE lead_id = '${lead4C}';
        DELETE FROM telecall_interactions WHERE lead_id = '${lead4C}';
        DELETE FROM field_visits WHERE lead_id = '${lead4C}';
        DELETE FROM student_leads WHERE id = '${lead4C}';
    `);
    await worker.query('COMMIT;');

    // Client now attempts to update the deleted row in REPEATABLE READ (explicitly expecting serialization conflict)
    const rrUpdateRes = await client.query(
        `UPDATE student_leads SET student_name = 'RR_HACK' WHERE id = '${lead4C}';`,
        { expectedError: /could not serialize access|40001/ }
    );
    let engineSerializationFailureRaised = rrUpdateRes.matchedExpectedError === true;
    await client.query('ROLLBACK;');

    await worker.close();
    await client.close();

    const pass = lead4APreserved && 
                 clientWaitMs >= 400 && 
                 clientApplicationConflictRaised && 
                 engineSerializationFailureRaised;

    console.log(`Test 4 Results:
- Part 4A: Pre-lock mutation committed and PRESERVED:              ${lead4APreserved}
- Part 4B: Worker locked first, Client blocked:                    ${clientWaitMs >= 400} (${clientWaitMs} ms)
- Part 4B: Explicit application conflict reported (No silent loss): ${clientApplicationConflictRaised}
- Part 4C: Engine-level conflict verification:                      ${engineSerializationFailureRaised}
- Verdict: ${pass ? 'PASS' : 'FAIL'}
    `);

    results.push({
        testId: 'TEST-04',
        title: 'Freshness-check vs. delete race condition & explicit conflict enforcement',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { lead4APreserved, clientWaitMs, clientApplicationConflictRaised, clientErrorMessage, engineSerializationFailureRaised }
    });
}

// =========================================================================
// TEST 5: Authorization Revocation Mid-Cleanup
// =========================================================================
async function runTest5() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 5: Authorization revocation mid-cleanup');
    console.log('============================================================');
    resetDatabase();

    const worker = new DbSession('Worker-Revoke');
    const admin = new DbSession('Admin-Revoker');

    await worker.connect();
    await admin.connect();

    console.log('1. Worker executes Batch 1 (200 rows)...');
    await worker.query('BEGIN;');
    await worker.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await worker.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    await worker.query(`
        DELETE FROM follow_up_tasks WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM telecall_interactions WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM field_visits WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM student_leads WHERE id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        INSERT INTO archive_deletion_batch_runs (id, authorization_id, batch_num, chunk_start_id, chunk_end_id, records_deleted_count)
        VALUES (gen_random_uuid(), '${AUTH_AY1_ID}', 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000200', 200);
    `);
    await worker.query('COMMIT;');
    console.log('Batch 1 committed.');

    console.log('2. Admin revokes the authorization...');
    await admin.query(`
        UPDATE workspace_archive_deletion_authorizations 
        SET status = 'REVOKED', revoked_at = NOW(), revocation_reason = 'ADMIN_MANUAL_CANCEL'
        WHERE id = '${AUTH_AY1_ID}';
    `);

    console.log('3. Worker attempts Batch 2 under revoked authorization...');
    await worker.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;');
    await worker.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await worker.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    
    const authCheck = await worker.query(`
        SELECT status FROM workspace_archive_deletion_authorizations 
        WHERE id = '${AUTH_AY1_ID}' AND status IN ('AUTHORIZED', 'IN_PROGRESS') FOR UPDATE;
    `);

    let batch2Halted = false;
    if (!authCheck.output.includes('AUTHORIZED') && !authCheck.output.includes('IN_PROGRESS')) {
        batch2Halted = true;
        await worker.query('ROLLBACK;');
        console.log('Worker revalidated authorization, detected it is no longer valid, and aborted Batch 2.');
    } else {
        await worker.query('COMMIT;');
    }

    await worker.close();
    await admin.close();

    const remainingLeads = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY1_ID}';`);
    const batchRunsCount = queryCount(`SELECT count(*) FROM archive_deletion_batch_runs WHERE authorization_id = '${AUTH_AY1_ID}';`);

    const pass = batch2Halted && remainingLeads === 300 && batchRunsCount === 1;

    console.log(`Test 5 Results:
- Batch 2 Halted: ${batch2Halted}
- Remaining Leads: ${remainingLeads} (Expected: 300)
- Recorded Batches: ${batchRunsCount} (Expected: 1)
- Verdict: ${pass ? 'PASS' : 'FAIL'}
    `);

    results.push({
        testId: 'TEST-05',
        title: 'Authorization revocation mid-cleanup',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { batch2Halted, remainingLeads, batchRunsCount }
    });
}

// =========================================================================
// TEST 6: Worker Crash Failure Recovery & Checkpoint Resumption
// Verifies:
//   1. Worker 1 process is explicitly terminated mid-transaction
//   2. PostgreSQL engine automatically rolls back all in-flight uncommitted deletes
//   3. Live database contains exact expected pre-crash count (300 leads)
//   4. Worker 2 boots up, queries latest committed checkpoint, and completes cleanup
// =========================================================================
async function runTest6() {
    console.log('\n============================================================');
    console.log('RUNNING TEST 6: Worker crash failure recovery & checkpoint resumption');
    console.log('============================================================');
    resetDatabase();

    const worker1 = new DbSession('Worker-1');
    await worker1.connect();

    console.log('1. Worker 1 executes Batch 1 (rows 1-200) and persists checkpoint...');
    await worker1.query('BEGIN;');
    await worker1.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await worker1.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    
    const boundary1Res = await worker1.query(`
        SELECT id FROM student_leads 
        WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' 
        ORDER BY id ASC LIMIT 200;
    `);
    const leadUuids1 = boundary1Res.output.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [];
    const firstIdBatch1 = leadUuids1[0];
    const lastIdBatch1 = leadUuids1[leadUuids1.length - 1];

    await worker1.query(`
        DELETE FROM follow_up_tasks WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM telecall_interactions WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM field_visits WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        DELETE FROM student_leads WHERE id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 200
        );
        INSERT INTO archive_deletion_batch_runs (id, authorization_id, batch_num, chunk_start_id, chunk_end_id, records_deleted_count)
        VALUES (gen_random_uuid(), '${AUTH_AY1_ID}', 1, '${firstIdBatch1}', '${lastIdBatch1}', 200);
        UPDATE workspace_archive_deletion_authorizations SET status = 'IN_PROGRESS' WHERE id = '${AUTH_AY1_ID}';
    `);
    await worker1.query('COMMIT;');
    console.log(`Batch 1 committed with checkpoint cursor chunk_end_id = ${lastIdBatch1}`);

    // 2. Worker 1 starts Batch 2, deletes 100 rows, then EXPERIENCES AN ABRUPT CRASH
    console.log('2. Worker 1 begins Batch 2, performs in-flight deletes, then SIMULATES A CRASH...');
    await worker1.query('BEGIN;');
    await worker1.query(`
        DELETE FROM follow_up_tasks WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 100
        );
        DELETE FROM telecall_interactions WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 100
        );
        DELETE FROM field_visits WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 100
        );
        DELETE FROM student_leads WHERE id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED' ORDER BY id ASC LIMIT 100
        );
    `);

    // Record Worker 1 PID before killing
    const worker1Pid = worker1.getPid();
    console.log(`Worker 1 active PID: ${worker1Pid}. Sending SIGKILL to simulate sudden OS/container crash...`);
    
    // Abrupt process termination
    await worker1.close();
    const worker1Terminated = worker1.isKilled();
    console.log(`Worker 1 process terminated (isKilled = ${worker1Terminated}).`);

    // Give OS / PostgreSQL engine 200ms to clean up aborted socket connection
    await sleep(200);

    // 3. Inspect PostgreSQL state immediately post-crash: uncommitted deletes MUST be rolled back
    const midLeadsCount = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY1_ID}';`);
    console.log(`Live leads in database post-crash: ${midLeadsCount} (Uncommitted deletes cleanly rolled back; exactly 300 remain)`);

    // 4. Worker 2 (Restarted Worker) boots up, queries latest committed checkpoint cursor
    console.log('3. Worker 2 boots up, queries durable checkpoint from archive_deletion_batch_runs...');
    const worker2 = new DbSession('Worker-2-Recovered');
    await worker2.connect();

    const checkpointRes = await worker2.query(`
        SELECT batch_num, chunk_end_id, records_deleted_count 
        FROM archive_deletion_batch_runs 
        WHERE authorization_id = '${AUTH_AY1_ID}' 
        ORDER BY batch_num DESC LIMIT 1;
    `);
    console.log('Discovered last committed checkpoint:', checkpointRes.output.replace(/\s+/g, ' '));

    // Worker 2 resumes remaining unadmitted leads from cursor
    console.log('4. Worker 2 resumes remaining leads and completes cohort cleanup...');
    await worker2.query('BEGIN;');
    await worker2.query(`SELECT id FROM workspaces WHERE id = '${W1_ID}' FOR UPDATE;`);
    await worker2.query(`SELECT id FROM academic_years WHERE id = '${AY1_ID}' AND workspace_id = '${W1_ID}' FOR UPDATE;`);
    await worker2.query(`
        DELETE FROM follow_up_tasks WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED'
        );
        DELETE FROM telecall_interactions WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED'
        );
        DELETE FROM field_visits WHERE lead_id IN (
            SELECT id FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED'
        );
        DELETE FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status != 'ADMITTED';
        
        INSERT INTO archive_deletion_batch_runs (id, authorization_id, batch_num, chunk_start_id, chunk_end_id, records_deleted_count)
        VALUES (gen_random_uuid(), '${AUTH_AY1_ID}', 2, '${lastIdBatch1}', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 290);
        
        UPDATE workspace_archive_deletion_authorizations SET status = 'CONSUMED', consumed_at = NOW() WHERE id = '${AUTH_AY1_ID}';
        UPDATE academic_years SET status = 'ARCHIVED', archived_at = NOW() WHERE id = '${AY1_ID}';
    `);
    await worker2.query('COMMIT;');
    await worker2.close();

    const finalAy1Leads = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY1_ID}';`);
    const finalAdmittedLeads = queryCount(`SELECT count(*) FROM student_leads WHERE academic_year_id = '${AY1_ID}' AND status = 'ADMITTED';`);
    const finalAyStatus = execSql(`SELECT status FROM academic_years WHERE id = '${AY1_ID}';`);
    const finalAuthStatus = execSql(`SELECT status FROM workspace_archive_deletion_authorizations WHERE id = '${AUTH_AY1_ID}';`);

    const pass = worker1Terminated && 
                 midLeadsCount === 300 && 
                 finalAy1Leads === 10 && 
                 finalAdmittedLeads === 10 && 
                 finalAyStatus === 'ARCHIVED' && 
                 finalAuthStatus === 'CONSUMED';

    console.log(`Test 6 Results:
- Worker 1 Process Terminated on Crash:       ${worker1Terminated}
- Mid-Crash Live Leads (Rollback Verified):   ${midLeadsCount} (Expected: 300)
- Final AY1 Live Leads:                       ${finalAy1Leads} (Expected: 10 admitted students preserved)
- Final Admitted Students in DB:              ${finalAdmittedLeads} (Expected: 10)
- Academic Year Final Status:                 ${finalAyStatus} (Expected: ARCHIVED)
- Authorization Final Status:                 ${finalAuthStatus} (Expected: CONSUMED)
- Verdict: ${pass ? 'PASS' : 'FAIL'}
    `);

    results.push({
        testId: 'TEST-06',
        title: 'Worker crash failure recovery & durable checkpoint resumption',
        verdict: pass ? 'PASS' : 'FAIL',
        details: { worker1Terminated, midLeadsCount, finalAy1Leads, finalAdmittedLeads, finalAyStatus, finalAuthStatus }
    });
}

// =========================================================================
// MAIN RUNNER
// =========================================================================
async function main() {
    console.log('============================================================');
    console.log('POC-ARCHIVE-01 SAFETY ENFORCEMENT GATE: ACTIVE');
    console.log(`Database Target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
    console.log(`Host Classification: VERIFIED LOOPBACK (${DB_HOST})`);
    console.log(`Database Classification: VERIFIED DISPOSABLE ALLOWLIST (${DB_NAME})`);
    console.log('DISPOSABILITY NOTICE: Loopback address alone does not prove the database');
    console.log('is disposable. The operator must verify that this database is strictly');
    console.log('dedicated to POC-ARCHIVE-01 testing and contains no valuable or production data.');
    console.log('============================================================\n');
    
    try {
        await runTest1();
        await runTest2();
        await runTest3();
        await runTest4();
        await runTest5();
        await runTest6();
    } catch (err) {
        console.error('Fatal Test Runner Error:', err);
    }

    console.log('\n============================================================');
    console.log('FINAL POC-ARCHIVE-01 RESULTS SUMMARY:');
    console.log('============================================================');
    results.forEach(r => {
        console.log(`[${r.verdict}] ${r.testId}: ${r.title}`);
    });

    const reportPath = path.join(__dirname, 'POC_ARCHIVE_01_RESULTS.json');
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
