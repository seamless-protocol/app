"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { 
  Wallet, 
  ArrowUpDown, 
  Search, 
  DollarSign,
  ChevronRight,
  CheckCircle,
  ArrowLeft
} from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  
  const steps = [
    {
      number: 1,
      title: "Connect Wallet",
      description: "Connect your Web3 wallet to get started",
      icon: Wallet
    },
    {
      number: 2, 
      title: "Bridge Assets",
      description: "Transfer assets to start earning",
      icon: ArrowUpDown
    },
    {
      number: 3,
      title: "Explore Strategies", 
      description: "Find the perfect ILM strategy",
      icon: Search
    },
    {
      number: 4,
      title: "Supply & Earn",
      description: "Supply assets and start earning yield",
      icon: DollarSign
    }
  ]

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-brand-purple/20 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-dark-primary">Connect Your Wallet</h3>
              <p className="text-dark-secondary">
                Connect your Web3 wallet to access Seamless Protocol and start earning yield on your assets.
              </p>
            </div>
            <div className="space-y-3">
              <Button className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white" size="lg">
                <Wallet className="h-4 w-4 mr-2" />
                Connect MetaMask
              </Button>
              <Button variant="outline" className="w-full border-divider-line text-dark-secondary hover:bg-dark-elevated" size="lg">
                <Wallet className="h-4 w-4 mr-2" />
                Connect WalletConnect
              </Button>
              <Button variant="outline" className="w-full border-divider-line text-dark-secondary hover:bg-dark-elevated" size="lg">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Coinbase Wallet
              </Button>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-brand-purple/20 rounded-full flex items-center justify-center">
              <ArrowUpDown className="h-8 w-8 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-dark-primary">Bridge Your Assets</h3>
              <p className="text-dark-secondary">
                Transfer assets from other networks to Base to start participating in yield strategies.
              </p>
            </div>
            <div className="p-4 bg-dark-elevated rounded-lg text-left border border-divider-line">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-dark-muted">From</span>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Ethereum</Badge>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-dark-muted">To</span>  
                <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-600/30">Base</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-muted">Asset</span>
                <span className="text-sm font-medium text-dark-primary">USDC</span>
              </div>
            </div>
            <Button className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white" size="lg">
              Bridge Assets
            </Button>
          </div>
        )
      
      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-brand-purple/20 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-brand-purple" />
            </div>  
            <div>
              <h3 className="text-lg font-medium mb-2 text-dark-primary">Explore Strategies</h3>
              <p className="text-dark-secondary">
                Browse our curated selection of ILM strategies to find the perfect fit for your risk tolerance and goals.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-3 border border-divider-line rounded-lg text-left bg-dark-elevated">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-dark-primary">ETH-USDC Yield</span>
                  <Badge variant="secondary" className="bg-success-green/20 text-success-green border-success-green/30">12.5% APY</Badge>
                </div>
                <p className="text-sm text-dark-secondary">ETH / USDC pair strategy</p>
              </div>
              <div className="p-3 border border-divider-line rounded-lg text-left bg-dark-elevated">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-dark-primary">Stablecoin Optimizer</span>
                  <Badge variant="secondary" className="bg-success-green/20 text-success-green border-success-green/30">8.9% APY</Badge>
                </div>
                <p className="text-sm text-dark-secondary">USDC / USDT pair strategy</p>
              </div>
            </div>
            <Button className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white" size="lg">
              Explore All Strategies
            </Button>
          </div>
        )
      
      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto bg-success-green/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success-green" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2 text-dark-primary">You're All Set!</h3>
              <p className="text-dark-secondary">
                Your wallet is connected and ready. Start supplying assets to strategies and earn yield automatically.
              </p>
            </div>
            <div className="p-4 bg-success-green/10 rounded-lg border border-success-green/30">
              <p className="text-sm text-success-green mb-2">✨ Pro Tip</p>
              <p className="text-sm text-dark-secondary">
                Start with stablecoin strategies if you're new to DeFi for lower risk and steady returns.
              </p>
            </div>
            <Button className="w-full bg-brand-purple hover:bg-brand-purple/90 text-white" size="lg">
              Start Earning
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-dark-card border-divider-line">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-dark-primary">Welcome to Seamless</DialogTitle>
            <Badge variant="outline" className="bg-dark-elevated text-dark-secondary border-divider-line">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
          <DialogDescription className="text-dark-secondary">
            Get started with Seamless Protocol in just a few simple steps
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
          <p className="text-sm text-dark-secondary text-center">
            {steps[currentStep - 1]?.title}
          </p>
        </div>

        {/* Step Content */}
        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-divider-line">
          <Button 
            variant="ghost" 
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="text-dark-secondary hover:text-dark-primary hover:bg-dark-elevated"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <Button onClick={handleNextStep} className="bg-brand-purple hover:bg-brand-purple/90 text-white">
            {currentStep === 4 ? 'Get Started' : 'Next'}
            {currentStep !== 4 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}