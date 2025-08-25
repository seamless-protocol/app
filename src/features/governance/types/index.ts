/**
 * Core types for governance feature
 */

export interface TallyProposal {
  id: string
  onchainId: string
  status: 'active' | 'executed' | 'defeated' | 'expired' | 'canceled'
  originalId: string | null
  createdAt: string
  quorum: string
  voteStats: Array<TallyVoteStats>
  metadata: {
    description: string
  }
  events: Array<TallyProposalEvent>
  start: {
    timestamp: string
  }
  block: {
    timestamp: string
  }
  governor: {
    id: string
    quorum: string
    name: string
    timelockId: string
    token: {
      decimals: number
    }
  }
}

export interface TallyVoteStats {
  votesCount: string
  percent: number
  type: 'for' | 'against' | 'abstain' | 'pendingfor' | 'pendingagainst' | 'pendingabstain'
  votersCount: number
}

export interface TallyProposalEvent {
  type: string
  txHash: string | null
}
