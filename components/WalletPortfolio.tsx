import { ArrowDown, ArrowUp } from '@/public/svgs/icons'
import Image from 'next/image'
import { Separator } from './ui/separator'
import { useState } from 'react'
import { usePrivacy } from '@/contexts/PrivacyProvider'
import ShieldModal from './ShieldModal'
import PrivateTransferModal from './PrivateTransferModal'
import UnshieldModal from './UnshieldModal'
import StealthLinkGenerator from './StealthLinkGenerator'
import StakePrivateModal from './StakePrivateModal'
import BatchShieldModal from './BatchShieldModal'
import TradeOfferModal from './TradeOfferModal'
import TransparencyDashboard from './TransparencyDashboard'
import TransactionHistory from './TransactionHistory'
import PrivacyRules from './PrivacyRules'
import PerformanceProfiler from './PerformanceProfiler'
import GovernanceDashboard from './GovernanceDashboard'
import IoTSettlement from './IoTSettlement'
import ConfidentialLending from './ConfidentialLending'
import ConfidentialMarketplace from './ConfidentialMarketplace'
import MyOffers from './MyOffers'
import BulkTradeManager from './BulkTradeManager'
import P2PPriceIndex from './P2PPriceIndex'
import IdentityGuard from './IdentityGuard'
import BridgePortal from './BridgePortal'
import RollupExplorer from './RollupExplorer'
import ViewKeyManager from './ViewKeyManager'
import PrivacyLock from './PrivacyLock'
import { Eye, EyeOff, Send, Download, Link2, Landmark, Layers, ShoppingBag, Sun, Wind, Zap } from 'lucide-react'

export default function WalletPortfolio() {
  const [holdingsOpen, setHoldingsOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [futuresOpen, setFuturesOpen] = useState(false)
  const [privateOpen, setPrivateOpen] = useState(true)
  const [isShieldModalOpen, setIsShieldModalOpen] = useState(false)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [isUnshieldModalOpen, setIsUnshieldModalOpen] = useState(false)
  const [isStealthModalOpen, setIsStealthModalOpen] = useState(false)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [showCommitment, setShowCommitment] = useState(false)
  const [showAmount, setShowAmount] = useState(false)

  const { privateBalance, isUnlocked, isReadOnly, unlockPrivacy, isLoading: isPrivacyLoading } = usePrivacy()

  return (
    <div className="flex w-full flex-col space-y-2">
      {/* Holdings Section */}
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setHoldingsOpen(!holdingsOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              Holdings
            </span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">
              4 Tokens
            </span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              $229.38
            </span>
            {holdingsOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
        {holdingsOpen && (
          <div className="flex w-full flex-col space-y-4 pt-4">
            <Separator />
            <div className="flex w-full items-center justify-between">
              <div className="flex h-fit items-center space-x-[10px]">
                <Image src="/images/solana.png" alt="solana" height={32} width={32} className="rounded-full" />
                <div className="flex flex-col space-y-0.5">
                  <span className="h-4 text-xs font-medium text-foreground">Solana</span>
                  <span className="h-4 text-xs font-medium text-secondary-foreground">0.809 SOL</span>
                </div>
              </div>
              <span className="flex h-6 items-center text-xs font-medium text-secondary-foreground">$152.26</span>
            </div>
            {/* GridToken with Shield Action */}
            <div className="flex w-full items-center justify-between">
              <div className="flex h-fit items-center space-x-[10px]">
                <Image src="/images/grid.png" alt="grid" height={32} width={32} className="rounded-full" />
                <div className="flex flex-col space-y-0.5">
                  <span className="h-4 text-xs font-medium text-foreground">GridToken (Public)</span>
                  <span className="h-4 text-xs font-medium text-secondary-foreground">1,200 GRX</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsShieldModalOpen(true); }}
                className="rounded border border-primary px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
              >
                Shield
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Private Section (ZK) */}
      <div className="flex w-full flex-col rounded-sm border border-primary/30 p-4 pt-3 bg-primary/5">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setPrivateOpen(!privateOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-bold text-primary">
              Private Holdings (ZK)
            </span>
            <span className="flex h-4 items-center rounded-[4px] bg-primary/10 px-[6px] py-[5px] text-[10px] text-primary uppercase tracking-tighter">
              Ristretto Confidential
            </span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">
              {privateBalance?.isInitialized ? 'ACTIVE' : 'NOT INITIALIZED'}
            </span>
            {privateOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>

        {privateOpen && (
          <div className="flex w-full flex-col space-y-4 pt-4">
            <Separator className="bg-primary/20" />

            {!isUnlocked ? (
              <PrivacyLock
                onUnlock={() => unlockPrivacy()}
                isDeriving={isPrivacyLoading}
              />
            ) : (
              <div className="flex w-full items-center justify-between">
                <div className="flex h-fit items-center space-x-[10px]">
                  <div className="relative">
                    <Image src="/images/grid.png" alt="GridToken" height={32} width={32} className="rounded-full opacity-80" />
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-0.5 shadow-sm border border-background">
                      <Eye size={10} className="text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="h-4 text-xs font-medium text-foreground">Confidential GridToken</span>
                      {privateBalance?.isInitialized && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1 rounded font-bold">
                          {showAmount && privateBalance.amount !== null ? `${privateBalance.amount.toLocaleString()} GRX` : '•••••'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[9px] font-bold text-secondary-foreground uppercase block tracking-widest">Energy Units</span>
                      {privateBalance?.origin && (
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase ring-1 ring-inset ${privateBalance.origin === 'Solar' ? 'bg-orange-500/10 text-orange-500 ring-orange-500/20' :
                          privateBalance.origin === 'Wind' ? 'bg-blue-500/10 text-blue-500 ring-blue-500/20' :
                            'bg-primary/10 text-primary ring-primary/20'
                          }`}>
                          {privateBalance.origin === 'Solar' ? <Sun size={8} className="mr-1" /> :
                            privateBalance.origin === 'Wind' ? <Wind size={8} className="mr-1" /> :
                              <Zap size={8} className="mr-1" />}
                          {privateBalance.origin}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="h-4 text-[10px] font-mono text-secondary-foreground truncate max-w-[150px]">
                        {privateBalance?.isInitialized
                          ? (showCommitment ? `C: ${Buffer.from(privateBalance.commitment).toString('hex')}` : 'COMMITMENT HIDDEN')
                          : 'INITIALIZATION REQUIRED'}
                      </span>
                      {privateBalance?.isInitialized && (
                        <div className="flex items-center space-x-1">
                          <button onClick={(e) => { e.stopPropagation(); setShowAmount(!showAmount); }} title="Toggle Amount View">
                            {showAmount ? <EyeOff size={10} className="text-primary" /> : <Eye size={10} />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setShowCommitment(!showCommitment); }} title="Toggle Commitment View">
                            <span className="text-[9px] font-bold border rounded px-0.5 ml-1">{showCommitment ? 'HEX' : 'HID'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {privateBalance?.isInitialized ? (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setIsUnshieldModalOpen(true)}
                      disabled={isReadOnly}
                      className="rounded bg-secondary/50 border border-primary/20 px-2 py-1.5 text-[9px] font-bold text-foreground hover:bg-secondary transition-all flex items-center disabled:opacity-30"
                    >
                      <Download size={10} className="mr-1" /> WITHDRAW
                    </button>
                    <button
                      onClick={() => setIsTradeModalOpen(true)}
                      disabled={isReadOnly}
                      className="rounded bg-secondary/50 border border-primary/20 px-2 py-1.5 text-[9px] font-bold text-foreground hover:bg-secondary transition-all flex items-center disabled:opacity-30"
                      title="Create P2P Private Offer"
                    >
                      <ShoppingBag size={10} className="mr-1" /> TRADE
                    </button>
                    <button
                      onClick={() => setIsBatchModalOpen(true)}
                      disabled={isReadOnly}
                      className="rounded bg-secondary/50 border border-primary/20 px-2 py-1.5 text-[9px] font-bold text-foreground hover:bg-secondary transition-all flex items-center disabled:opacity-30"
                      title="Batch Shield Multiple Meters"
                    >
                      <Layers size={10} className="mr-1" /> BATCH
                    </button>
                    <button
                      onClick={() => setIsTransferModalOpen(true)}
                      disabled={isReadOnly}
                      className="rounded bg-secondary/50 border border-primary/20 px-2 py-1.5 text-[9px] font-bold text-foreground hover:bg-secondary transition-all flex items-center disabled:opacity-30"
                    >
                      <Send size={10} className="mr-1" /> TRANSFER
                    </button>
                    <button
                      onClick={() => setIsStealthModalOpen(true)}
                      disabled={isReadOnly}
                      className="rounded bg-secondary/50 border border-primary/20 px-2 py-1.5 text-[9px] font-bold text-foreground hover:bg-secondary transition-all flex items-center disabled:opacity-30"
                      title="Create Stealth Link"
                    >
                      <Link2 size={10} className="mr-1" /> LINK
                    </button>
                    <button
                      onClick={() => setIsStakeModalOpen(true)}
                      disabled={isReadOnly}
                      className="rounded bg-secondary/50 border border-primary/20 px-2 py-1.5 text-[9px] font-bold text-foreground hover:bg-secondary transition-all flex items-center disabled:opacity-30"
                      title="Stake Privately"
                    >
                      <Landmark size={10} className="mr-1" /> STAKE
                    </button>
                    <button
                      onClick={() => setIsShieldModalOpen(true)}
                      disabled={isReadOnly}
                      className="rounded bg-primary px-2 py-1.5 text-[9px] font-bold text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-30"
                    >
                      SHIELD MORE
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsShieldModalOpen(true)}
                    className="rounded border border-primary/50 px-3 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/5 transition-all"
                  >
                    INITIALIZE
                  </button>
                )}
              </div>
            )}

            {isUnlocked && (
              <div className="mt-8 pt-6 border-t border-primary/10">
                <TransactionHistory />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <TransparencyDashboard />
        <PrivacyRules />
        <PerformanceProfiler />
        <ViewKeyManager />
        <RollupExplorer />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-8">
        <GovernanceDashboard />
        <ConfidentialLending />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-8">
        <IoTSettlement />
        <IdentityGuard />
        <BridgePortal />
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-8">
        <MyOffers />
        <div className="md:col-span-1">
          <ConfidentialMarketplace />
        </div>
        <P2PPriceIndex />
      </div>

      <div className="mt-4 border-t pt-8">
        <BulkTradeManager />
      </div>

      {/* Options Section */}
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setOptionsOpen(!optionsOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">Options</span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">4 Positions</span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">$529.38</span>
            {optionsOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
      </div>

      {/* Futures Section */}
      <div className="flex w-full flex-col rounded-sm border p-4 pt-3">
        <div
          className="flex w-full cursor-pointer justify-between"
          onClick={() => setFuturesOpen(!futuresOpen)}
        >
          <div className="flex items-center space-x-[6px]">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">Futures</span>
            <span className="flex h-4 items-center rounded-[4px] border border-primary px-[6px] py-[5px] text-[10px] text-primary">4 Positions</span>
          </div>
          <div className="flex items-center space-x-4 text-secondary-foreground">
            <span className="flex h-4 items-center text-sm font-medium text-foreground">$129.38</span>
            {futuresOpen ? <ArrowUp /> : <ArrowDown />}
          </div>
        </div>
      </div>

      <ShieldModal
        isOpen={isShieldModalOpen}
        onClose={() => setIsShieldModalOpen(false)}
      />
      <PrivateTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
      <UnshieldModal
        isOpen={isUnshieldModalOpen}
        onClose={() => setIsUnshieldModalOpen(false)}
      />
      <StealthLinkGenerator
        isOpen={isStealthModalOpen}
        onClose={() => setIsStealthModalOpen(false)}
      />
      <StakePrivateModal
        isOpen={isStakeModalOpen}
        onClose={() => setIsStakeModalOpen(false)}
      />
      <BatchShieldModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
      />
      <TradeOfferModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
      />
    </div>
  )
}
