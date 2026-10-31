/**
 * NexaChain AI — Automated Staging Smoke Test Suite
 *
 * Repeatable verification tool designed to run against Staging (or Local Pre-Staging) environments.
 * Verifies all 12 core platform requirements:
 *   1. Application health
 *   2. User registration
 *   3. User login and JWT validation
 *   4. Investment plan retrieval
 *   5. Insufficient wallet balance rejection
 *   6. Investment creation
 *   7. Wallet ledger consistency
 *   8. Downline referral registration & hierarchy
 *   9. Multi-tier commission distribution
 *   10. Multi-tenant user data isolation (IDOR protection)
 *   11. Daily ROI scheduler processing & duplicate prevention
 *   12. Administrative security & secret verification
 *
 * Usage:
 *   STAGING_URL=http://localhost:5000 node scripts/run_staging_smoke_tests.js
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.STAGING_URL || 'http://localhost:5000';
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'nexachain_admin_secret_cron_override_key';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;

    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = client.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch (e) {
            json = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runStagingSmokeTests() {
  console.log('===============================================================');
  console.log('       NEXACHAIN AI — STAGING ENVIRONMENT SMOKE TESTS          ');
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================================');

  const ts = Date.now();
  let sponsorToken = null;
  let sponsorReferralCode = null;
  let sponsorInvestmentId = null;
  let downlineToken = null;

  try {
    // 1. Application Health
    console.log('\n[Check 1/12] Verifying Application Health & Database Readiness...');
    const health = await makeRequest('GET', '/api/health');
    assert(health.status === 200, `Health check returned ${health.status}`);
    assert(health.body.status === 'ok', `Expected status ok, got ${health.body.status}`);
    assert(health.body.database === 'connected', `Database not connected: ${health.body.database}`);
    console.log(`  ✓ Health: OK | DB: ${health.body.database} | Topology: ${health.body.databaseTopology || 'detected'}`);

    // 2. User Registration
    console.log('\n[Check 2/12] Testing User Registration (Sponsor)...');
    const sponsorEmail = `staging_sponsor_${ts}@nexachain.test`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      fullName: 'Staging Sponsor Alice',
      email: sponsorEmail,
      mobileNumber: '9888800001',
      password: 'StagingSecurePassword123!',
    });
    assert(regRes.status === 201, `Registration failed with status ${regRes.status}: ${JSON.stringify(regRes.body)}`);
    assert(regRes.body.data.user.referralCode, 'No referral code returned');
    sponsorToken = regRes.body.data.token;
    sponsorReferralCode = regRes.body.data.user.referralCode;
    console.log(`  ✓ Sponsor Registered. Code: ${sponsorReferralCode}`);

    // 3. User Login and JWT Validation
    console.log('\n[Check 3/12] Testing User Login & JWT Authenticated Profile...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: sponsorEmail,
      password: 'StagingSecurePassword123!',
    });
    assert(loginRes.status === 200, `Login failed: ${loginRes.status}`);
    const meRes = await makeRequest('GET', '/api/auth/me', null, {
      Authorization: `Bearer ${sponsorToken}`,
    });
    assert(meRes.status === 200, `Auth /me failed: ${meRes.status}`);
    assert(meRes.body.data.user.email === sponsorEmail, 'Email mismatch in /me');
    console.log('  ✓ JWT Login and Bearer token verification passed.');

    // 4. Investment Plan Retrieval
    console.log('\n[Check 4/12] Testing Investment Plan Retrieval...');
    const plansRes = await makeRequest('GET', '/api/investments/plans', null, {
      Authorization: `Bearer ${sponsorToken}`,
    });
    assert(plansRes.status === 200, `Get plans failed: ${plansRes.status}`);
    const plans = plansRes.body.data.plans;
    assert(Array.isArray(plans) && plans.length >= 3, `Expected at least 3 plans, got ${plans?.length}`);
    const selectedPlan = plans[0];
    console.log(`  ✓ Retrieved ${plans.length} active plans. Selected: ${selectedPlan.name} (${selectedPlan.planId})`);

    // 5. Insufficient Wallet Balance Rejection
    console.log('\n[Check 5/12] Testing Insufficient Balance Rejection...');
    const invalidInv = await makeRequest('POST', '/api/investments', {
      planId: selectedPlan.planId,
      amount: selectedPlan.minAmount,
    }, {
      Authorization: `Bearer ${sponsorToken}`,
    });
    assert(invalidInv.status === 400, `Expected 400 for insufficient balance, got ${invalidInv.status}`);
    console.log('  ✓ Insufficient balance rejected with HTTP 400 (Overdraft prevented).');

    // 6. Wallet Deposit & Investment Creation
    console.log('\n[Check 6/12] Testing Wallet Deposit & Principal Investment Creation...');
    const fundAmount = selectedPlan.minAmount + 500;
    const depRes = await makeRequest('POST', '/api/wallet/deposit', {
      amount: fundAmount,
      note: 'Staging smoke test funding',
    }, {
      Authorization: `Bearer ${sponsorToken}`,
    });
    assert(depRes.status === 200, `Deposit failed: ${depRes.status}`);
    assert(depRes.body.data.walletBalance === fundAmount, 'Balance not updated after deposit');

    const invAmount = selectedPlan.minAmount;
    const createInvRes = await makeRequest('POST', '/api/investments', {
      planId: selectedPlan.planId,
      amount: invAmount,
    }, {
      Authorization: `Bearer ${sponsorToken}`,
    });
    assert(createInvRes.status === 201, `Investment creation failed: ${createInvRes.status}`);
    sponsorInvestmentId = createInvRes.body.data.investment._id;
    const remainingBalance = fundAmount - invAmount;
    assert(createInvRes.body.data.walletBalance === remainingBalance, 'Wallet not debited correctly');
    console.log(`  ✓ Investment created ($${invAmount}). Wallet debited to $${remainingBalance}.`);

    // 7. Wallet Ledger Consistency
    console.log('\n[Check 7/12] Testing Wallet Ledger Audit Trail Consistency...');
    const txRes = await makeRequest('GET', '/api/wallet/transactions', null, {
      Authorization: `Bearer ${sponsorToken}`,
    });
    assert(txRes.status === 200, `Get transactions failed: ${txRes.status}`);
    const txList = txRes.body.data.transactions;
    assert(txList.length >= 2, `Expected at least 2 transactions (deposit + debit), got ${txList.length}`);
    const ledgerSum = txList.reduce((acc, t) => {
      return t.direction === 'CREDIT' ? acc + t.amount : acc - t.amount;
    }, 0);
    assert(Math.abs(ledgerSum - remainingBalance) < 0.01, `Ledger mismatch: ${ledgerSum} vs balance ${remainingBalance}`);
    console.log(`  ✓ Ledger Invariant Verified: Sum(${ledgerSum.toFixed(2)}) == Balance(${remainingBalance.toFixed(2)})`);

    // 8. Downline Referral Registration & Hierarchy
    console.log('\n[Check 8/12] Testing Downline Referral Registration & Tree Hierarchy...');
    const downlineEmail = `staging_downline_${ts}@nexachain.test`;
    const downlineReg = await makeRequest('POST', '/api/auth/register', {
      fullName: 'Staging Downline Bob',
      email: downlineEmail,
      mobileNumber: '9888800002',
      password: 'StagingSecurePassword123!',
      referralCode: sponsorReferralCode,
    });
    assert(downlineReg.status === 201, `Downline registration failed: ${downlineReg.status}`);
    downlineToken = downlineReg.body.data.token;

    const treeRes = await makeRequest('GET', '/api/referrals/tree', null, {
      Authorization: `Bearer ${sponsorToken}`,
    });
    assert(treeRes.status === 200, `Get referral tree failed: ${treeRes.status}`);
    const tree = treeRes.body.data.tree;
    assert(tree.children && tree.children.length === 1, `Expected 1 downline child in tree, got ${tree.children?.length}`);
    console.log(`  ✓ Downline successfully linked to Sponsor tree under Level 1.`);

    // 9. Multi-Tier Commission Distribution
    console.log('\n[Check 9/12] Testing Multi-Tier Referral Commission Distribution...');
    // Downline deposits and invests $1000
    await makeRequest('POST', '/api/wallet/deposit', { amount: 1000 }, { Authorization: `Bearer ${downlineToken}` });
    const downlineInv = await makeRequest('POST', '/api/investments', {
      planId: selectedPlan.planId,
      amount: 1000,
    }, { Authorization: `Bearer ${downlineToken}` });
    assert(downlineInv.status === 201, 'Downline investment failed');

    // Sponsor should receive 5% ($50)
    const sponsorProfile = await makeRequest('GET', '/api/auth/me', null, {
      Authorization: `Bearer ${sponsorToken}`,
    });
    const expectedSponsorBalance = remainingBalance + 50; // 5% of 1000
    assert(
      Math.abs(sponsorProfile.body.data.user.walletBalance - expectedSponsorBalance) < 0.01,
      `Sponsor commission not credited: got ${sponsorProfile.body.data.user.walletBalance}, expected ${expectedSponsorBalance}`
    );
    console.log(`  ✓ Level 1 (5%) commission ($50.00) accurately credited to sponsor.`);

    // 10. Multi-Tenant User Data Isolation (IDOR Check)
    console.log('\n[Check 10/12] Testing Multi-Tenant Data Isolation (IDOR Resistance)...');
    const foreignInvAccess = await makeRequest('GET', `/api/investments/${sponsorInvestmentId}`, null, {
      Authorization: `Bearer ${downlineToken}`,
    });
    assert(
      foreignInvAccess.status === 404 || foreignInvAccess.status === 403,
      `IDOR VULNERABILITY: Downline user was able to access sponsor investment! Status: ${foreignInvAccess.status}`
    );
    console.log('  ✓ Data Isolation Verified: Cross-user investment access correctly denied (HTTP 404).');

    // 11. Daily ROI Processing & Idempotency
    console.log('\n[Check 11/12] Testing Daily ROI Processing & Duplicate Prevention...');
    const todayStr = new Date().toISOString().split('T')[0];
    const roiRun1 = await makeRequest('POST', '/api/admin/roi/process', {
      processingDate: todayStr,
    }, {
      'x-admin-secret': ADMIN_SECRET,
    });
    assert(roiRun1.status === 200, `Admin ROI process failed: ${roiRun1.status}: ${JSON.stringify(roiRun1.body)}`);
    console.log(`  ✓ Batch 1: Credited ${roiRun1.body.data.processedCount || 0} investments ($${roiRun1.body.data.totalRoiAmount || 0})`);

    // Run identical batch again (Idempotency test)
    const roiRun2 = await makeRequest('POST', '/api/admin/roi/process', {
      processingDate: todayStr,
    }, {
      'x-admin-secret': ADMIN_SECRET,
    });
    assert(roiRun2.status === 200, `Admin ROI run 2 failed: ${roiRun2.status}`);
    assert(
      roiRun2.body.data.processedCount === 0 && (roiRun2.body.data.totalRoiAmount === 0 || !roiRun2.body.data.totalRoiAmount),
      `IDEMPOTENCY FAILURE: Batch 2 credited investments instead of skipping! Credited: ${roiRun2.body.data.processedCount}`
    );
    console.log('  ✓ Idempotency Verified: Batch 2 credited exactly 0 duplicate dollars.');

    // 12. Administrative Security Verification
    console.log('\n[Check 12/12] Testing Administrative Endpoint Secret Authorization...');
    const unauthorizedAdmin = await makeRequest('POST', '/api/admin/roi/process', {
      processingDate: todayStr,
    }, {
      'x-admin-secret': 'invalid_secret_key_attack',
    });
    assert(unauthorizedAdmin.status === 403, `Expected 403 Forbidden for bad admin secret, got ${unauthorizedAdmin.status}`);
    console.log('  ✓ Admin Security Verified: Unauthenticated requests rejected with HTTP 403.');

    console.log('\n===============================================================');
    console.log('  ALL 12 STAGING SMOKE TEST CHECKS PASSED WITH ZERO ERRORS!    ');
    console.log('===============================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n[STAGING SMOKE TEST FAILED]', error.message);
    process.exit(1);
  }
}

runStagingSmokeTests();
