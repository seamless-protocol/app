import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Alert, AlertDescription } from "./ui/alert"
import { Progress } from "./ui/progress"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import { motion, AnimatePresence } from "motion/react"
import { 
  User, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Copy,
  ChevronRight,
  TrendingUp,
  Users,
  Clock,
  Search,
  Filter,
  Shield,
  Zap,
  History,
  X,
  RefreshCw,
  Fuel,
  Sparkles,
  CircleCheck
} from "lucide-react"
import { toast } from "sonner@2.0.3"

interface Delegate {
  address: string
  name: string
  delegatedVotes: string
  proposals: number
  participationRate: string
  description: string
  verified: boolean
  ensName?: string
  avatar?: string
}

interface DelegationHistory {
  date: string
  from: string
  to: string
  action: 'delegated' | 'changed' | 'revoked'
  txHash: string
}

interface DelegationModalProps {
  isOpen: boolean
  onClose: () => void
  currentDelegation?: string | null
  votingPower: {
    seam: string
    esSeam: string
    stSeam: string
  }
}

export function DelegationModal({ isOpen, onClose, currentDelegation, votingPower }: DelegationModalProps) {
  const [selectedTab, setSelectedTab] = useState("self")
  const [customAddress, setCustomAddress] = useState("")
  const [selectedDelegate, setSelectedDelegate] = useState<Delegate | null>(null)
  const [isTransacting, setIsTransacting] = useState(false)
  const [transactionStep, setTransactionStep] = useState(0)
  const [transactionComplete, setTransactionComplete] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [addressValidation, setAddressValidation] = useState<{
    isValid: boolean
    error?: string
    ensName?: string
  }>({ isValid: true })
  const [estimatedGas, setEstimatedGas] = useState("0.0023")
  const [showHistory, setShowHistory] = useState(false)

  const popularDelegates: Delegate[] = [
    {
      address: "0x1234...5678",
      name: "DeFi Advocate",
      delegatedVotes: "2.4M SEAM",
      proposals: 12,
      participationRate: "95%",
      description: "Active participant focused on DeFi innovation and protocol growth",
      verified: true,
      ensName: "defi-advocate.eth"
    },
    {
      address: "0x9876...5432", 
      name: "Community Leader",
      delegatedVotes: "1.8M SEAM",
      proposals: 8,
      participationRate: "88%",
      description: "Long-term community member with focus on sustainable development",
      verified: true,
      ensName: "community-lead.eth"
    },
    {
      address: "0x4567...8901",
      name: "Protocol Expert", 
      delegatedVotes: "3.1M SEAM",
      proposals: 15,
      participationRate: "92%",
      description: "Technical expert with deep understanding of lending protocols",
      verified: true,
      ensName: "protocol-expert.eth"
    },
    {
      address: "0x2468...1357",
      name: "Security Researcher",
      delegatedVotes: "950K SEAM",
      proposals: 6,
      participationRate: "100%",
      description: "Security-focused contributor with expertise in smart contract auditing",
      verified: false
    }
  ]

  const delegationHistory: DelegationHistory[] = [
    {
      date: "2024-01-15",
      from: "Self",
      to: "protocol-expert.eth",
      action: "delegated",
      txHash: "0xabc123..."
    },
    {
      date: "2024-01-10",
      from: "0x0000...0000",
      to: "Self",
      action: "delegated",
      txHash: "0xdef456..."
    }
  ]

  const userAddress = "0x2Fa6...0085"

  // Filter delegates based on search query
  const filteredDelegates = popularDelegates.filter(delegate => 
    delegate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delegate.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delegate.ensName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Validate address input
  useEffect(() => {
    if (customAddress.length === 0) {
      setAddressValidation({ isValid: true })
      return
    }

    setIsValidating(true)
    
    const validateAddress = async () => {
      try {
        // Basic address validation (simplified)
        if (customAddress.length < 42 && !customAddress.endsWith('.eth')) {
          setAddressValidation({
            isValid: false,
            error: "Please enter a valid Ethereum address or ENS name"
          })
          return
        }

        // Simulate ENS resolution
        if (customAddress.endsWith('.eth')) {
          await new Promise(resolve => setTimeout(resolve, 500))
          setAddressValidation({
            isValid: true,
            ensName: customAddress
          })
        } else {
          setAddressValidation({ isValid: true })
        }
      } catch (error) {
        setAddressValidation({
          isValid: false,
          error: "Unable to resolve address"
        })
      } finally {
        setIsValidating(false)
      }
    }

    const timeoutId = setTimeout(validateAddress, 300)
    return () => clearTimeout(timeoutId)
  }, [customAddress])

  const handleDelegate = async () => {
    setIsTransacting(true)
    setTransactionStep(0)
    setTransactionError(null)

    try {
      // Step 1: Preparing transaction
      setTransactionStep(1)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: Estimating gas
      setTransactionStep(2)
      await new Promise(resolve => setTimeout(resolve, 800))

      // Step 3: Waiting for wallet signature
      setTransactionStep(3)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Simulate random failure for demo (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("User rejected transaction")
      }

      // Step 4: Broadcasting transaction
      setTransactionStep(4)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Step 5: Confirming transaction
      setTransactionStep(5)
      await new Promise(resolve => setTimeout(resolve, 2000))

      setTransactionComplete(true)
      
      const delegateAddress = selectedTab === "self" ? userAddress : 
                            selectedTab === "popular" ? selectedDelegate?.address :
                            customAddress

      const delegateName = selectedTab === "self" ? "yourself" :
                          selectedTab === "popular" ? selectedDelegate?.name :
                          addressValidation.ensName || delegateAddress

      toast.success("Delegation successful!", {
        description: `Successfully delegated voting power to ${delegateName}`,
        action: {
          label: "View Transaction",
          onClick: () => window.open("#", "_blank")
        }
      })

      setTimeout(() => {
        onClose()
        setTransactionComplete(false)
        setIsTransacting(false)
        setTransactionStep(0)
        setTransactionError(null)
      }, 3000)

    } catch (error: any) {
      setIsTransacting(false)
      setTransactionStep(0)
      setTransactionError(error.message)
      
      toast.error("Delegation failed", {
        description: error.message || "Please try again or check your wallet connection"
      })
    }
  }

  const handleRetryTransaction = () => {
    setTransactionError(null)
    handleDelegate()
  }

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    toast.success("Address copied to clipboard")
  }

  const getTransactionStepText = () => {
    switch (transactionStep) {
      case 1: return "Preparing transaction..."
      case 2: return "Estimating gas costs..."
      case 3: return "Waiting for wallet signature..."
      case 4: return "Broadcasting transaction..."
      case 5: return "Confirming transaction..."
      default: return "Starting..."
    }
  }

  const isFormValid = () => {
    if (selectedTab === "self") return true
    if (selectedTab === "popular") return selectedDelegate !== null
    if (selectedTab === "custom") return customAddress.length > 0 && addressValidation.isValid
    return false
  }

  const totalVotingPower = parseFloat(votingPower.seam) + parseFloat(votingPower.esSeam) + parseFloat(votingPower.stSeam)

  // Transaction Error State
  if (transactionError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Transaction Error</DialogTitle>
            <DialogDescription>An error occurred during the delegation transaction</DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <X className="h-7 w-7 text-red-400" />
            </motion.div>
            
            <motion.h2 
              className="text-lg font-semibold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              Transaction Failed
            </motion.h2>
            
            <motion.p 
              className="text-slate-400 mb-4 text-sm leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              {transactionError}
            </motion.p>
            
            <motion.div 
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
              <Button
                onClick={handleRetryTransaction}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Transaction Complete State
  if (transactionComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Delegation Complete</DialogTitle>
            <DialogDescription>Your voting power has been successfully delegated</DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div 
              className="relative w-16 h-16 mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <CircleCheck className="h-8 w-8 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-30"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <motion.h2 
              className="text-lg font-semibold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              Delegation Complete!
            </motion.h2>
            
            <motion.p 
              className="text-slate-400 mb-4 text-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              Your voting power has been successfully delegated.
            </motion.p>
            
            <motion.div
              className="flex space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
                onClick={() => window.open("#", "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Tx
              </Button>
            </motion.div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  // Transaction Processing State
  if (isTransacting) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900/90 border-slate-700 max-w-md backdrop-blur-sm">
          <DialogHeader className="sr-only">
            <DialogTitle>Processing Delegation</DialogTitle>
            <DialogDescription>Your delegation transaction is being processed</DialogDescription>
          </DialogHeader>
          
          <motion.div 
            className="text-center py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="relative w-16 h-16 mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-30"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            
            <h2 className="text-lg font-semibold text-white mb-3">Processing Delegation</h2>
            
            <div className="mb-3 px-4">
              <Progress 
                value={(transactionStep / 5) * 100} 
                className="h-2 bg-slate-800"
              />
            </div>
            
            <motion.p 
              className="text-slate-400 mb-2"
              key={transactionStep}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {getTransactionStepText()}
            </motion.p>
            
            {transactionStep === 2 && (
              <div className="flex items-center justify-center text-xs text-slate-500">
                <Fuel className="h-3 w-3 mr-1" />
                Estimated gas: {estimatedGas} ETH
              </div>
            )}
            
            <div className="mt-4 text-xs text-slate-500">
              Step {transactionStep} of 5
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 border-slate-700 max-w-3xl max-h-[85vh] overflow-hidden backdrop-blur-sm">
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center space-x-3 text-white">
                <div className="w-7 h-7 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span>Delegate Voting Power</span>
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Choose how to delegate your SEAM voting power for governance participation
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-slate-400 hover:text-white text-xs h-8"
            >
              <History className="h-3 w-3 mr-2" />
              History
            </Button>
          </div>
        </DialogHeader>

        <div className="flex space-x-4 h-full">
          {/* Main Content */}
          <div className="flex-1 space-y-4 overflow-auto">
            {/* Current Voting Power */}
            <Card className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 border-slate-700 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400">Total Voting Power</span>
                  <span className="text-xl font-bold text-white">{totalVotingPower.toFixed(2)} SEAM</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mb-3">
                  <span>SEAM: {votingPower.seam}</span>
                  <span>esSEAM: {votingPower.esSeam}</span>
                  <span>stSEAM: {votingPower.stSeam}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                  <span className="text-xs text-slate-400">Estimated Gas Cost</span>
                  <div className="flex items-center text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    <Fuel className="h-3 w-3 mr-1" />
                    {estimatedGas} ETH
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delegation Options */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-800 mb-4">
                <TabsTrigger 
                  value="self" 
                  className="text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700"
                >
                  Self Delegate
                </TabsTrigger>
                <TabsTrigger 
                  value="popular" 
                  className="text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700"
                >
                  Popular Delegates
                </TabsTrigger>
                <TabsTrigger 
                  value="custom" 
                  className="text-slate-400 data-[state=active]:text-white data-[state=active]:bg-slate-700"
                >
                  Custom Address
                </TabsTrigger>
              </TabsList>

              <TabsContent value="self" className="space-y-3">
                <Alert className="border-purple-500/20 bg-purple-500/5">
                  <User className="h-4 w-4 text-purple-400" />
                  <AlertDescription className="text-slate-400 text-sm">
                    Self-delegate to retain full control over your voting power. You'll need to vote on proposals yourself.
                  </AlertDescription>
                </Alert>
                
                <Card className="bg-slate-800/70 border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white text-sm">Your Address</p>
                        <p className="text-xs text-slate-400 font-mono">{userAddress}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyAddress(userAddress)}
                        className="text-slate-400 hover:text-white p-2 h-8 w-8"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="popular" className="space-y-3">
                <Alert className="border-cyan-500/20 bg-cyan-500/5">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <AlertDescription className="text-slate-400 text-sm">
                    Delegate to experienced community members who actively participate in governance.
                  </AlertDescription>
                </Alert>

                {/* Search Delegates */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <Input
                    placeholder="Search by name, address, or ENS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-800/70 border-slate-700 text-white text-sm h-9"
                  />
                </div>

                {/* Delegates List */}
                <ScrollArea className="h-56">
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredDelegates.map((delegate, index) => (
                        <motion.div
                          key={delegate.address}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card 
                            className={`cursor-pointer transition-all duration-200 border ${
                              selectedDelegate?.address === delegate.address 
                                ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10' 
                                : 'bg-slate-800/70 border-slate-700 hover:bg-slate-800/90 hover:border-slate-600'
                            }`}
                            onClick={() => setSelectedDelegate(delegate)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h3 className="font-medium text-white text-sm truncate">{delegate.name}</h3>
                                    {delegate.verified && (
                                      <Shield className="h-3 w-3 text-green-400 flex-shrink-0" />
                                    )}
                                    <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-400">
                                      {delegate.participationRate}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-slate-400 mb-2 line-clamp-2">{delegate.description}</p>
                                  <div className="flex items-center space-x-3 text-xs text-slate-500 mb-1">
                                    <span className="flex items-center">
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      {delegate.delegatedVotes}
                                    </span>
                                    <span>{delegate.proposals} proposals</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {delegate.ensName && (
                                      <span className="text-xs text-purple-400 truncate">{delegate.ensName}</span>
                                    )}
                                    <span className="text-xs text-slate-500 font-mono truncate">{delegate.address}</span>
                                  </div>
                                </div>
                                {selectedDelegate?.address === delegate.address && (
                                  <Check className="h-4 w-4 text-purple-400 flex-shrink-0 ml-2" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="custom" className="space-y-3">
                <Alert className="border-yellow-500/20 bg-yellow-500/5">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-slate-400 text-sm">
                    Make sure you trust the address you're delegating to. You can change your delegation at any time.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="custom-address" className="text-white text-sm">
                    Delegate Address or ENS Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="custom-address"
                      placeholder="0x... or name.eth"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      className={`bg-slate-800/70 border-slate-700 text-white text-sm h-9 ${
                        !addressValidation.isValid ? 'border-red-500' : ''
                      }`}
                    />
                    {isValidating && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
                      </div>
                    )}
                  </div>
                  {!addressValidation.isValid && addressValidation.error && (
                    <p className="text-xs text-red-400">{addressValidation.error}</p>
                  )}
                  {addressValidation.ensName && (
                    <p className="text-xs text-green-400">
                      Resolved to ENS: {addressValidation.ensName}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Current Delegation Status */}
            {currentDelegation && (
              <Alert className="border-slate-700 bg-slate-800/50">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                <AlertDescription className="text-slate-400 text-sm">
                  Currently delegated to: <span className="font-mono text-white">{currentDelegation}</span>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <Separator className="my-4" />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                {isFormValid() ? (
                  <>Ready to delegate {totalVotingPower.toFixed(2)} SEAM voting power</>
                ) : (
                  'Select delegation option to continue'
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelegate}
                  disabled={!isFormValid() || totalVotingPower === 0 || isValidating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {currentDelegation ? 'Change Delegation' : 'Delegate Votes'}
                </Button>
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <>
              <Separator orientation="vertical" className="bg-slate-700" />
              <div className="w-72 space-y-3">
                <div className="flex items-center space-x-2">
                  <History className="h-4 w-4 text-purple-400" />
                  <h3 className="font-medium text-white text-sm">Delegation History</h3>
                </div>
                
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {delegationHistory.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs bg-slate-800 text-slate-400 capitalize"
                                >
                                  {entry.action}
                                </Badge>
                                <span className="text-xs text-slate-500">{entry.date}</span>
                              </div>
                              <div className="text-xs">
                                <div className="text-slate-400">
                                  From: <span className="text-white font-mono">{entry.from}</span>
                                </div>
                                <div className="text-slate-400">
                                  To: <span className="text-white font-mono">{entry.to}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-slate-500 hover:text-white h-6"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Transaction
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}