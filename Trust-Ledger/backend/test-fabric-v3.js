/**
 * Fabric blockchain query tool
 * Usage:
 *   node test-fabric-v3.js                  → list all customers on-chain
 *   node test-fabric-v3.js KYC-HH-21        → look up a specific credential ID
 */
const grpc = require('@grpc/grpc-js');
const { connect, hash, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const FABRIC_NET = 'D:/LBG/Reboot-Hackathon-26/Trust-Ledger/fabric-network';
const ORG1_MSP   = FABRIC_NET + '/organizations/peerOrganizations/org1.example.com';

async function main() {
  const lookupId = process.argv[2] || null;

  const tlsCert = fs.readFileSync(ORG1_MSP + '/tlsca/tlsca.org1.example.com-cert.pem');
  const credentials = grpc.credentials.createSsl(tlsCert);
  const client = new grpc.Client('localhost:7051', credentials, {
    'grpc.ssl_target_name_override': 'peer0.org1.example.com',
  });

  const certPath = ORG1_MSP + '/users/Admin@org1.example.com/msp/signcerts/cert.pem';
  const keystoreDir = ORG1_MSP + '/users/Admin@org1.example.com/msp/keystore';
  const keyFile = fs.readdirSync(keystoreDir).find(f => f.endsWith('_sk'));
  const cert = fs.readFileSync(certPath);
  const key  = crypto.createPrivateKey(fs.readFileSync(path.join(keystoreDir, keyFile)));

  const gateway = connect({
    client,
    identity: { mspId: 'LloydsMSP', credentials: cert },
    signer: signers.newPrivateKeySigner(key),
    hash: hash.sha256,
  });

  try {
    const network  = gateway.getNetwork('kycchannel');
    const contract = network.getContract('trustledger');
    console.log('✅ Connected to Hyperledger Fabric  [kycchannel / trustledger]\n');

    if (lookupId) {
      // ── Look up a specific customer by credential ID ──────────────────────
      console.log(`🔍 Looking up: ${lookupId}`);
      try {
        const result = await contract.evaluateTransaction('ReadCustomer', lookupId);
        const customer = JSON.parse(Buffer.from(result).toString('utf8'));
        console.log('\n✅ FOUND ON BLOCKCHAIN:');
        console.log('  Customer ID  :', customer.customerId);
        console.log('  Full Name    :', customer.fullName);
        console.log('  Email        :', customer.email);
        console.log('  KYC Status   :', customer.kycStatus || customer.status || 'N/A');
        console.log('  Issuing Bank :', customer.issuingBank);
        console.log('  DOB          :', customer.dateOfBirth);
        console.log('\n  Full record  :', JSON.stringify(customer, null, 2));
      } catch (e) {
        console.log(`❌ NOT FOUND on blockchain: ${lookupId}`);
        console.log('   Error:', e.message.substring(0, 150));
      }

      // Also fetch KYC history if available
      try {
        const hist = await contract.evaluateTransaction('GetCustomerHistory', lookupId);
        const history = JSON.parse(Buffer.from(hist).toString('utf8'));
        console.log(`\n📜 On-chain history (${history.length} event(s)):`);
        history.forEach((h, i) => console.log(`  [${i+1}] txId=${h.txId?.substring(0,16)}... value=${JSON.stringify(h.value).substring(0,80)}`));
      } catch (_) { /* history function may not exist */ }

    } else {
      // ── List all customers ────────────────────────────────────────────────
      const result = await contract.evaluateTransaction('GetAllCustomers');
      const customers = JSON.parse(Buffer.from(result).toString('utf8'));
      console.log(`📋 Total customers on-chain: ${customers.length}\n`);
      customers.forEach((c, i) => {
        console.log(`  [${String(i+1).padStart(2)}] ${c.customerId.padEnd(18)} | ${(c.fullName||'').padEnd(20)} | ${c.email||''}`);
      });
      console.log('\n💡 To look up a specific credential:');
      console.log('   node test-fabric-v3.js KYC-HH-21');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.details) console.error('Details:', err.details);
  } finally {
    gateway.close();
    client.close();
  }
}

main().catch(console.error);

