import { Protocol } from '@stackagent/types';

export const mockProtocols: Protocol[] = [
  {
    id: 'alex',
    name: 'ALEX Lab',
    description: 'The premier Bitcoin DeFi platform on Stacks.',
    website: 'https://alexlab.co',
    contracts: {
      router: {
        address: 'SP3K8BC0YWJCXFGLZ8GQVK53EXH514N0860A0DDE2',
        contractName: 'amm-swap-pool-v1-1',
      },
    },
    actions: [
      {
        id: 'swap',
        name: 'Swap Tokens',
        description: 'Swap between supported tokens on ALEX AMM.',
      },
    ],
    riskProfile: {
      auditStatus: 'AUDITED',
      tvlUsd: 100000000,
      ageInDays: 730,
      priorIncidents: true,
    },
  },
  {
    id: 'zest',
    name: 'Zest Protocol',
    description: 'Bitcoin lending market built on Stacks.',
    website: 'https://zestprotocol.com',
    contracts: {
      pool: {
        address: 'SP2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QF4N',
        contractName: 'zest-pool-v1',
      },
    },
    actions: [
      {
        id: 'lend',
        name: 'Lend Bitcoin',
        description: 'Supply sBTC to the lending pool to earn yield.',
      },
    ],
    riskProfile: {
      auditStatus: 'AUDITED',
      tvlUsd: 50000000,
      ageInDays: 180,
      priorIncidents: false,
    },
  },
];
