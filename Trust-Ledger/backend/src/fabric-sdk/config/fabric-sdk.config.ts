/**
 * Fabric SDK Configuration
 * 
 * Centralized configuration for Hyperledger Fabric SDK integration
 */

export interface FabricNetworkConfig {
  channelName: string;
  chaincodeName: string;
  mspId: string;
  walletPath: string;
  connectionProfilePath: string;
  userId: string;
  peerEndpoint: string;
  peerHostAlias: string;
  tlsCertPath: string;
}

export const LLOYDS_FABRIC_CONFIG: FabricNetworkConfig = {
  channelName: 'kycchannel',
  chaincodeName: 'trustledger',
  mspId: 'LloydsMSP',
  walletPath: './wallet',
  connectionProfilePath:
    '../fabric-network/organizations/peerOrganizations/org1.example.com/connection-org1.json',
  userId: 'admin',
  peerEndpoint: 'localhost:7051',
  peerHostAlias: 'peer0.org1.example.com',
  tlsCertPath:
    '../fabric-network/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem',
};

export const HALIFAX_FABRIC_CONFIG: FabricNetworkConfig = {
  channelName: 'kycchannel',
  chaincodeName: 'trustledger',
  mspId: 'HalifaxMSP',
  walletPath: './wallet',
  connectionProfilePath:
    '../fabric-network/organizations/peerOrganizations/org2.example.com/connection-org2.json',
  userId: 'admin',
  peerEndpoint: 'localhost:9051',
  peerHostAlias: 'peer0.org2.example.com',
  tlsCertPath:
    '../fabric-network/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem',
};

/**
 * Get configuration for a specific organization
 */
export function getFabricConfig(org: 'lloyds' | 'halifax'): FabricNetworkConfig {
  return org === 'lloyds' ? LLOYDS_FABRIC_CONFIG : HALIFAX_FABRIC_CONFIG;
}
