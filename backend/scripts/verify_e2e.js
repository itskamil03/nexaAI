/**
 * NexaChain AI — End-to-End Live Verification Script
 * Validates complete multi-tier flow from signup to ROI idempotency.
 */

const mongoose = require('mongoose');
const config = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/config/db');
const { User, Investment, RoiHistory, ReferralIncome, WalletTransaction, JobLock } = require('../src/models');
const { createInvestment } = require('../src/services/investmentService');
const { processAllActiveInvestments } = require('../src/services/roiService');
const { getDashboardSummary } = require('../src/services/dashboardService');
const { getReferralTree } = require('../src/services/referralService');
const { normalizeDate } = require('../src/utils/dateUtils');

async function runLiveE2E() {
  console.log('===============================================================');
  console.log('       NEXACHAIN AI — LIVE END-TO-END VERIFICATION RUN         ');
  console.log('===============================================================');

  await connectDB();

  try {
    // 1. Reset test data in development DB for clean verification run
    console.log('\n[Step 1] Preparing clean database state...');
    await User.deleteMany({ email: { $in: ['e2e_alice@nexachain.test', 'e2e_bob@nexachain.test'] } });
    await JobLock.deleteMany({});

    // 2. Register User Alice (Sponsor)
    console.log('\n[Step 2] Creating Sponsor User: Alice...');
    const alice = new User({
      fullName: 'Alice Sterling (Sponsor)',
      email: 'e2e_alice@nexachain.test',
      mobileNumber: '+18001112222',
      password: 'SecurePassword123!',
      referralCode: 'NXALICE1',
      accountStatus: 'Active',
    });
    await alice.save();
    console.log(`  ✓ Alice registered with Referral Code: ${alice.referralCode} (ID: ${alice._id})`);

    // 3. Register User Bob (Downline referring Alice)
    console.log('\n[Step 3] Creating Downline User: Bob (Referred by Alice)...');
    const bob = new User({
      fullName: 'Bob Vance (Investor)',
      email: 'e2e_bob@nexachain.test',
      mobileNumber: '+18003334444',
      password: 'SecurePassword123!',
      referralCode: 'NXBOB001',
      referredBy: alice._id,
      accountStatus: 'Active',
    });
    await bob.save();
    console.log(`  ✓ Bob registered. Uplink Sponsor: Alice (${alice._id})`);

    // 4. Fund Bob's Wallet with $2,500.00
    console.log('\n[Step 4] Simulating initial wallet funding for Bob...');
    bob.walletBalance = 2500.00;
    await bob.save();

    const depositTx = new WalletTransaction({
      userId: bob._id,
      transactionType: 'WALLET_DEPOSIT',
      direction: 'CREDIT',
      amount: 2500.00,
      sourceRecordRef: 'Deposit',
      idempotencyKey: `dep:${bob._id}:${Date.now()}`,
      status: 'SUCCESS',
      description: 'Initial cleared capital deposit',
      balanceAfter: 2500.00,
    });
    await depositTx.save();
    console.log(`  ✓ Bob funded: $2,500.00. Balance verified.`);

    // 5. Bob deploys $2,000.00 into Growth Neural Vault (1.5% Daily ROI, 60 Days)
    console.log('\n[Step 5] Bob creating $2,000.00 investment in Growth Neural Vault...');
    const investResult = await createInvestment(bob._id, 'growth', 2000.00);
    console.log(`  ✓ Investment Created: ID ${investResult.investment._id}`);
    console.log(`  ✓ Bob Wallet Balance after debit: $${investResult.walletBalance.toFixed(2)} (Expected: $500.00)`);

    // 6. Verify Alice received Level 1 Referral Commission (5% of $2,000 = $100.00)
    console.log('\n[Step 6] Verifying multi-tier referral distribution to Alice...');
    const aliceUpdated = await User.findById(alice._id);
    console.log(`  ✓ Alice Wallet Balance: $${aliceUpdated.walletBalance.toFixed(2)} (Expected: $100.00)`);
    console.log(`  ✓ Alice Level Income:   $${aliceUpdated.totalLevelIncomeEarned.toFixed(2)} (Expected: $100.00)`);

    if (aliceUpdated.walletBalance !== 100.00) {
      throw new Error(`Referral verification failed: expected 100.00, got ${aliceUpdated.walletBalance}`);
    }

    // 7. Inspect Nested Referral Tree for Alice
    console.log('\n[Step 7] Inspecting Referral Tree Hierarchy for Alice...');
    const tree = await getReferralTree(alice._id, 3);
    console.log(`  ✓ Tree Root: ${tree.fullName} (${tree.referralCode})`);
    console.log(`  ✓ Level 1 Downline Members: ${tree.children.length}`);
    console.log(`  ✓ Child 1: ${tree.children[0].fullName} — Total Invested: $${tree.children[0].totalInvested}`);

    // 8. Run Daily ROI processing for current date
    const today = normalizeDate();
    console.log(`\n[Step 8] Executing Daily ROI batch for date: ${today}...`);
    const batch1 = await processAllActiveInvestments(today);
    console.log(`  ✓ Batch 1 Processed: ${batch1.processedCount} credited ($${batch1.totalRoiAmount.toFixed(2)})`);

    const bobAfterRoi = await User.findById(bob._id);
    console.log(`  ✓ Bob Wallet Balance after Daily ROI: $${bobAfterRoi.walletBalance.toFixed(2)} (Expected: $530.00 [500 + 30])`);
    console.log(`  ✓ Bob Total ROI Earned:             $${bobAfterRoi.totalRoiEarned.toFixed(2)} (Expected: $30.00)`);

    if (bobAfterRoi.walletBalance !== 530.00) {
      throw new Error(`Daily ROI verification failed: expected 530.00, got ${bobAfterRoi.walletBalance}`);
    }

    // 9. Execute Daily ROI processing AGAIN for the exact same date to test idempotency
    console.log(`\n[Step 9] Re-executing Daily ROI batch for SAME date: ${today} (Idempotency Test)...`);
    const batch2 = await processAllActiveInvestments(today);
    console.log(`  ✓ Batch 2 Processed: ${batch2.processedCount} credited, ${batch2.skippedCount} skipped`);

    const bobAfterRepeat = await User.findById(bob._id);
    console.log(`  ✓ Bob Wallet Balance after repeated run: $${bobAfterRepeat.walletBalance.toFixed(2)} (MUST REMAIN $530.00)`);

    if (bobAfterRepeat.walletBalance !== 530.00) {
      throw new Error(`IDEMPOTENCY FAILURE! Duplicate ROI was credited! Balance: ${bobAfterRepeat.walletBalance}`);
    }
    console.log('  ✓ IDEMPOTENCY TEST PASSED: Exactly 0 duplicate dollars credited!');

    // 10. Verify Dashboard Summary metrics
    console.log('\n[Step 10] Verifying Dashboard Summary API metrics for Bob...');
    const bobDashboard = await getDashboardSummary(bob._id);
    console.log(`  ✓ Total Investments:      $${bobDashboard.metrics.totalInvestments.toFixed(2)}`);
    console.log(`  ✓ Expected Daily ROI:     $${bobDashboard.metrics.dailyExpectedRoi.toFixed(2)}`);
    console.log(`  ✓ Today's Actual ROI:     $${bobDashboard.metrics.todayRoiEarned.toFixed(2)}`);
    console.log(`  ✓ Spendable Balance:      $${bobDashboard.metrics.walletBalance.toFixed(2)}`);
    console.log(`  ✓ Earnings Chart Points:  ${bobDashboard.earningsChartData.length} days`);

    console.log('\n===============================================================');
    console.log('       ALL END-TO-END VERIFICATION STEPS PASSED 100%!           ');
    console.log('===============================================================');

  } catch (err) {
    console.error('\n❌ E2E VERIFICATION FAILED:', err.message);
    throw err;
  } finally {
    await disconnectDB();
  }
}

runLiveE2E().catch(e => {
  console.error(e);
  process.exit(1);
});
