const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    const FABRIC_NET = 'D:\\LBG\\Reboot-Hackathon-26\\Trust-Ledger\\fabric-network';
    const WALLET_PATH = 'D:\\LBG\\Reboot-Hackathon-26\\Trust-Ledger\\backend\\wallet';

    // Load connection profile
    const profilePath = path.join(FABRIC_NET, 'organizations/peerOrganizations/org1.example.com/connection-org1.json');
    const connectionProfile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

    console.log('Connection profile orgs:', Object.keys(connectionProfile.organizations));
    console.log('Connection profile peers:', Object.keys(connectionProfile.peers));

    // Load wallet
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);
    const identity = await wallet.get('admin');
    console.log('Identity MSP:', identity ? identity.mspId : 'NOT FOUND');

    // Connect gateway
    const gateway = new Gateway();
    try {
        await gateway.connect(connectionProfile, {
            wallet,
            identity: 'admin',
            discovery: { enabled: false, asLocalhost: true },
        });
        console.log('✅ Gateway connected');

        const network = await gateway.getNetwork('kycchannel');
        console.log('✅ Got network: kycchannel');

        // Check what peers are available
        const peers = network.channel.getEndorsers();
        console.log('Available peers:', peers.map(p => p.name));

        const contract = network.getContract('trustledger');
        console.log('✅ Got contract: trustledger');

        // Try evaluate
        console.log('Trying evaluateTransaction...');
        const result = await contract.evaluateTransaction('GetAllCustomers');
        console.log('✅ Result:', result.toString().substring(0, 200));

    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.responses) {
            console.error('Responses:', JSON.stringify(err.responses, null, 2));
        }
    } finally {
        gateway.disconnect();
    }
}

main().catch(console.error);
