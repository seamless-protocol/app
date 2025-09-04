"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { 
  Vote, 
  Clock,
  Users,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageSquare,
  Zap,
  TrendingUp,
  Calendar,
  Target,
  Network
} from "lucide-react"
import { DelegationModal } from "../DelegationModal"

interface Proposal {
  id: string
  title: string
  description: string
  status: 'active' | 'passed' | 'failed' | 'pending'
  votesFor: number
  votesAgainst: number
  totalVotes: number
  quorum: number
  endDate: string
  proposer: string
  category: string
}

export function Governance() {
  const [activeTab, setActiveTab] = useState('proposals')
  const [showDelegationModal, setShowDelegationModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null)
  const [userVotes, setUserVotes] = useState<Record<string, 'for' | 'against' | null>>({})

  // Mock user governance data
  const userGovernanceData = {
    votingPower: '15,240.50',
    delegatedTo: null,
    delegatedFrom: '2,450.25',
    participationRate: 85.7,
    proposalsCreated: 3,
    totalVotesCast: 42
  }

  // Mock proposals data
  const proposals: Proposal[] = [
    {
      id: 'prop-001',
      title: 'Increase Leverage Token Maximum Leverage to 25x',
      description: 'Proposal to increase the maximum leverage available for leverage tokens from 17x to 25x to provide more trading opportunities for advanced users.',
      status: 'active',
      votesFor: 847520,
      votesAgainst: 124380,
      totalVotes: 971900,
      quorum: 500000,
      endDate: '2024-02-15',
      proposer: '0x1234...5678',
      category: 'Protocol'
    },
    {
      id: 'prop-002',
      title: 'Reduce Management Fees for USDC Vault',
      description: 'Proposal to reduce the management fee for the USDC Vault from 2% to 1.5% to increase competitiveness and attract more liquidity.',
      status: 'active',
      votesFor: 652430,
      votesAgainst: 298760,
      totalVotes: 951190,
      quorum: 500000,
      endDate: '2024-02-18',
      proposer: '0xabcd...efgh',
      category: 'Economic'
    },
    {
      id: 'prop-003',
      title: 'Add Support for New Collateral Assets',
      description: 'Proposal to add support for stETH and rETH as collateral assets in the lending protocol to diversify risk and increase TVL.',
      status: 'passed',
      votesFor: 1250000,
      votesAgainst: 180000,
      totalVotes: 1430000,
      quorum: 500000,
      endDate: '2024-01-28',
      proposer: '0x9876...5432',
      category: 'Protocol'
    },
    {
      id: 'prop-004',
      title: 'Treasury Fund Allocation for Development',
      description: 'Proposal to allocate 500,000 SEAM tokens from the treasury for development of new features and protocol improvements.',
      status: 'failed',
      votesFor: 320000,
      votesAgainst: 680000,
      totalVotes: 1000000,
      quorum: 500000,
      endDate: '2024-01-20',
      proposer: '0xdef0...1234',
      category: 'Treasury'
    }
  ]

  // Handle vote
  const handleVote = (proposalId: string, vote: 'for' | 'against') => {
    setUserVotes(prev => ({
      ...prev,
      [proposalId]: vote
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'passed': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Vote
      case 'passed': return CheckCircle
      case 'failed': return XCircle
      case 'pending': return Clock
      default: return Vote
    }
  }

  // Helper function to determine if proposal is inactive (passed or failed)
  const isInactiveProposal = (status: string) => {
    return status === 'passed' || status === 'failed'
  }

  // Helper function to get card styling based on proposal status
  const getCardStyling = (status: string) => {
    if (isInactiveProposal(status)) {
      return "bg-slate-900/40 border-slate-700/50 opacity-60 hover:bg-slate-900/50 transition-all duration-200"
    }
    return "bg-slate-900/80 border-slate-700 hover:bg-slate-900/90 transition-all duration-200"
  }

  // Helper function to get text styling based on proposal status
  const getTextStyling = (status: string, baseClass: string) => {
    if (isInactiveProposal(status)) {
      // Make text more muted for inactive proposals
      const mutedClass = baseClass.replace('text-white', 'text-slate-400')
                                   .replace('text-slate-400', 'text-slate-500')
                                   .replace('text-slate-300', 'text-slate-500')
      return mutedClass
    }
    return baseClass
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Base Chain Network Requirement Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">Base Chain Required</h3>
              <Badge variant="outline" className="border-blue-500/50 text-blue-300 bg-blue-500/10">
                Base
              </Badge>
            </div>
            <p className="text-sm text-blue-200/80 mt-1">
              Governance participation, voting, and delegation are only available on Base Chain. Please ensure your wallet is connected to Base to participate in protocol governance.
            </p>
          </div>
        </div>
      </motion.div>



      {/* Governance Stats */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Your Voting Power</p>
                  <p className="text-2xl font-bold text-white">{userGovernanceData.votingPower}</p>
                  <p className="text-xs text-slate-400 mt-1">SEAM tokens</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Vote className="h-5 w-5 text-purple-400" />
                </div>
              </div>
              
              <Button
                onClick={() => setShowDelegationModal(true)}
                size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-8"
              >
                <Users className="h-3 w-3 mr-2" />
                Delegate Votes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Participation Rate</p>
                <p className="text-2xl font-bold text-white">{userGovernanceData.participationRate}%</p>
                <p className="text-xs text-green-400 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Above average
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Votes Cast</p>
                <p className="text-2xl font-bold text-white">{userGovernanceData.totalVotesCast}</p>
                <p className="text-xs text-slate-400 mt-1">All time</p>
              </div>
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Delegated Power</p>
                <p className="text-2xl font-bold text-white">{userGovernanceData.delegatedFrom}</p>
                <p className="text-xs text-slate-400 mt-1">From others</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="proposals">Active Proposals</TabsTrigger>
            <TabsTrigger value="history">Voting History</TabsTrigger>
            <TabsTrigger value="create">Create Proposal</TabsTrigger>
          </TabsList>

          {/* Active Proposals */}
          <TabsContent value="proposals" className="space-y-4">
            <AnimatePresence>
              {proposals.map((proposal, index) => {
                const StatusIcon = getStatusIcon(proposal.status)
                const userVote = userVotes[proposal.id]
                const votePercentage = proposal.totalVotes > 0 
                  ? (proposal.votesFor / proposal.totalVotes) * 100 
                  : 0
                const quorumReached = proposal.totalVotes >= proposal.quorum
                const isInactive = isInactiveProposal(proposal.status)
                
                return (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className={getCardStyling(proposal.status)}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Badge variant="outline" className={getStatusColor(proposal.status)}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    isInactive 
                                      ? "text-slate-500 border-slate-600/50" 
                                      : "text-slate-400 border-slate-600"
                                  }
                                >
                                  {proposal.category}
                                </Badge>
                              </div>
                              <h3 className={getTextStyling(proposal.status, "text-lg font-semibold text-white mb-2")}>
                                {proposal.title}
                              </h3>
                              <p className={getTextStyling(proposal.status, "text-slate-400 text-sm leading-relaxed")}>
                                {proposal.description}
                              </p>
                            </div>
                          </div>

                          {/* Voting Progress */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className={getTextStyling(proposal.status, "text-slate-400")}>
                                Voting Progress
                              </span>
                              <span className={getTextStyling(proposal.status, "text-white")}>
                                {proposal.totalVotes.toLocaleString()} / {proposal.quorum.toLocaleString()} votes
                              </span>
                            </div>
                            
                            <div className="relative">
                              <Progress 
                                value={votePercentage} 
                                className={isInactive ? "h-3 bg-slate-800/50" : "h-3 bg-slate-700"}
                              />
                              <div className="absolute inset-0 flex">
                                <div 
                                  className={
                                    isInactive 
                                      ? "bg-green-500/60 h-3 rounded-l" 
                                      : "bg-green-500 h-3 rounded-l"
                                  }
                                  style={{ width: `${votePercentage}%` }}
                                />
                                <div 
                                  className={
                                    isInactive 
                                      ? "bg-red-500/60 h-3 rounded-r" 
                                      : "bg-red-500 h-3 rounded-r"
                                  }
                                  style={{ width: `${100 - votePercentage}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-4">
                                <span className={`flex items-center ${
                                  isInactive ? 'text-green-400/70' : 'text-green-400'
                                }`}>
                                  <div className={`w-2 h-2 ${
                                    isInactive ? 'bg-green-500/60' : 'bg-green-500'
                                  } rounded-full mr-1`} />
                                  For: {proposal.votesFor.toLocaleString()}
                                </span>
                                <span className={`flex items-center ${
                                  isInactive ? 'text-red-400/70' : 'text-red-400'
                                }`}>
                                  <div className={`w-2 h-2 ${
                                    isInactive ? 'bg-red-500/60' : 'bg-red-500'
                                  } rounded-full mr-1`} />
                                  Against: {proposal.votesAgainst.toLocaleString()}
                                </span>
                              </div>
                              <span className={`text-xs ${
                                isInactive 
                                  ? (quorumReached ? 'text-green-400/70' : 'text-yellow-400/70')
                                  : (quorumReached ? 'text-green-400' : 'text-yellow-400')
                              }`}>
                                {quorumReached ? 'Quorum Reached' : 'Quorum Needed'}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                            <div className="flex items-center space-x-4 text-sm text-slate-400">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {proposal.status === 'active' ? 'Ends' : 'Ended'} {proposal.endDate}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                By {proposal.proposer}
                              </span>
                            </div>

                            {proposal.status === 'active' && (
                              <div className="flex items-center space-x-2">
                                {userVote ? (
                                  <Badge 
                                    variant="outline" 
                                    className={`${
                                      userVote === 'for' 
                                        ? 'text-green-400 border-green-400/20' 
                                        : 'text-red-400 border-red-400/20'
                                    }`}
                                  >
                                    Voted {userVote}
                                  </Badge>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleVote(proposal.id, 'for')}
                                      className="bg-green-600 hover:bg-green-500 text-white"
                                    >
                                      Vote For
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleVote(proposal.id, 'against')}
                                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                    >
                                      Vote Against
                                    </Button>
                                  </>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-slate-400 hover:text-white"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Discuss
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </TabsContent>

          {/* Voting History */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Your Voting History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposals.filter(p => p.status !== 'active').map((proposal, index) => (
                    <motion.div
                      key={proposal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{proposal.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className={getStatusColor(proposal.status)}>
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </Badge>
                            <span className="text-xs text-slate-400">Ended {proposal.endDate}</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-slate-400">Your vote</div>
                          <Badge 
                            variant="outline" 
                            className="text-green-400 border-green-400/20"
                          >
                            For
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Proposal */}
          <TabsContent value="create" className="space-y-4">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Create New Proposal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Proposal Creation</h3>
                  <p className="text-slate-400 mb-4 max-w-md mx-auto">
                    To create a proposal, you need at least 100,000 SEAM tokens or delegation from other community members.
                  </p>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Delegation Modal */}
      <DelegationModal
        isOpen={showDelegationModal}
        onClose={() => setShowDelegationModal(false)}
        currentDelegation={null}
        votingPower={{
          seam: userGovernanceData.votingPower,
          esSeam: '2,450.25',
          stSeam: '1,234.56'
        }}
      />
    </motion.div>
  )
}