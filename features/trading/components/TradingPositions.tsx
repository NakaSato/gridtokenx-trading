'use client'

import {
  useCallback,
  useEffect,
  useState,
  memo,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Activity,
  History,
  BookOpen,
  Clock,
  RotateCw,
  Bell,
  AlertCircle,
  Zap,
  Users,
  type LucideIcon,
} from 'lucide-react'
import OpenPositions from '@/features/trading/components/OpenPositions'
import OrderHistory from '@/features/trading/components/OrderHistory'
import LiveGridStats from '@/features/energy-grid/components/LiveGridStats'
import P2PActivityPanel from '@/features/p2p/components/P2PActivityPanel'
import PriceAlerts from '@/features/trading/components/PriceAlerts'
import { Transaction } from '@/types/wallet'
import Pagination from '@/components/shared/Pagination'
import OpenOptionOrders from '@/features/trading/components/OpenOptionOrders'
import { useAuth } from '@/contexts/AuthProvider'
import { useSidebar } from '@/components/shared/SidebarContext'
import {
  usePositions,
  useOpenOrders,
  useTradeHistory,
  useCancelOrder,
} from '@/features/trading/hooks/usePositionsData'

// ─────────────────────────────────────────────────────────────────────────────
// Tab Configuration
// ─────────────────────────────────────────────────────────────────────────────

type TabValue =
  | 'Positions'
  | 'OpenOrders'
  | 'History'
  | 'Alerts'
  | 'LiveGrid'
  | 'P2PActivity'

interface TabConfig {
  value: TabValue
  label: string
  icon: LucideIcon
  showBadge?: boolean
}

const TABS: TabConfig[] = [
  { value: 'Positions', label: 'Positions', icon: Activity, showBadge: true },
  { value: 'LiveGrid', label: 'Live Grid', icon: Zap },
  { value: 'P2PActivity', label: 'P2P Activity', icon: Users },
  { value: 'OpenOrders', label: 'My Orders', icon: BookOpen, showBadge: true },
  { value: 'History', label: 'History', icon: History },
  { value: 'Alerts', label: 'Alerts', icon: Bell },
]

// Tabs whose content comes from fetchData — only these sit behind the
// loading/error gate. Live Grid, P2P Activity, and Alerts have their own data
// sources and render regardless of fetch state.
const DATA_TABS: ReadonlySet<TabValue> = new Set([
  'Positions',
  'OpenOrders',
  'History',
])

const ITEMS_PER_PAGE = 5

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState Component
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="bg-muted/50 flex h-10 w-10 items-center justify-center rounded-full">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          className="mt-1 h-7 text-xs"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ErrorState Component
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
      <div className="bg-destructive/10 flex h-10 w-10 items-center justify-center rounded-full">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Failed to load data</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-1 h-7 text-xs"
        onClick={onRetry}
      >
        <RotateCw className="mr-1 h-3 w-3" />
        Retry
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel building blocks
// ─────────────────────────────────────────────────────────────────────────────

/** Scrollable list with footer pagination; centered empty state otherwise. */
function PaginatedPanel<T>({
  items,
  page,
  onPageChange,
  renderItem,
  empty,
}: {
  items: T[]
  page: number
  onPageChange: (page: number) => void
  renderItem: (item: T, index: number) => ReactNode
  empty: ReactNode
}) {
  if (items.length === 0) {
    return <div className="flex h-full items-center justify-center">{empty}</div>
  }
  const start = (page - 1) * ITEMS_PER_PAGE
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col space-y-3">
          {items.slice(start, start + ITEMS_PER_PAGE).map(renderItem)}
        </div>
      </div>
      <div className="flex-shrink-0 border-t border-border">
        <Pagination
          currentPage={page}
          totalItems={items.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  )
}

/** Scroll container for tabs that render a single child (History, Alerts, …). */
function ScrollPanel({
  centered,
  children,
}: {
  centered?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-y-auto',
        centered && 'items-center justify-center'
      )}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default memo(function TradingPositions() {
  const { token } = useAuth()
  const { showRightSidebar, toggleRightSidebar } = useSidebar()
  const [activeTab, setActiveTab] = useState<TabValue>('Positions')
  const [currentPage, setCurrentPage] = useState(1)

  const positionsQuery = usePositions()
  const ordersQuery = useOpenOrders()
  const historyQuery = useTradeHistory()
  const cancelOrder = useCancelOrder()

  const optioninfos = positionsQuery.data ?? []
  const orderInfos = ordersQuery.data ?? []
  const doneInfo = historyQuery.data ?? []
  const loading =
    !!token &&
    (positionsQuery.isLoading || ordersQuery.isLoading || historyQuery.isLoading)
  const error =
    (positionsQuery.error || ordersQuery.error || historyQuery.error)?.message ??
    null
  const lastRefreshed = new Date(
    Math.max(
      positionsQuery.dataUpdatedAt,
      ordersQuery.dataUpdatedAt,
      historyQuery.dataUpdatedAt
    ) || Date.now()
  )

  const fetchData = useCallback(() => {
    positionsQuery.refetch()
    ordersQuery.refetch()
    historyQuery.refetch()
  }, [positionsQuery, ordersQuery, historyQuery])

  // "Start Trading" CTA — reveal the P2P order form in the right sidebar
  const handleStartTrading = useCallback(() => {
    if (!showRightSidebar) toggleRightSidebar()
    // Wait a frame so the panel is mounted before scrolling to it
    requestAnimationFrame(() => {
      document
        .getElementById('p2p-order-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [showRightSidebar, toggleRightSidebar])

  // Reset pagination when switching tabs
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue)
    setCurrentPage(1)
  }, [])


  const handleCancelOrder = useCallback(
    (orderId: string) => cancelOrder.mutate(orderId),
    [cancelOrder]
  )

  // Positions come from the futures API only (no direct on-chain reads)
  const allPositions = optioninfos

  // Get badge count for tabs
  const getBadgeCount = (tabValue: TabValue): number | null => {
    switch (tabValue) {
      case 'Positions':
        return allPositions.length > 0 ? allPositions.length : null
      case 'OpenOrders':
        return orderInfos.length > 0 ? orderInfos.length : null
      default:
        return null
    }
  }

  // ── Per-tab content ────────────────────────────────────────────────────────

  const renderDataTab = () => {
    if (loading) {
      return (
        <div className="flex h-full flex-col space-y-3 overflow-hidden p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )
    }
    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      )
    }

    switch (activeTab) {
      case 'Positions':
        return (
          <PaginatedPanel
            items={allPositions}
            page={currentPage}
            onPageChange={setCurrentPage}
            renderItem={(position, index) => (
              <OpenPositions
                key={position.index ?? index}
                index={position.index}
                token={position.token}
                logo={position.logo}
                symbol={position.symbol}
                type={position.type}
                strikePrice={position.strikePrice}
                expiry={position.expiry}
                size={position.size}
                pnl={position.pnl}
                greeks={position.greeks}
              />
            )}
            empty={
              <EmptyState
                icon={Activity}
                title="No Positions Open"
                description="Your active futures positions will appear here."
                actionLabel="Start Trading"
                onAction={handleStartTrading}
              />
            }
          />
        )
      case 'OpenOrders':
        return (
          <PaginatedPanel
            items={orderInfos}
            page={currentPage}
            onPageChange={setCurrentPage}
            renderItem={(pos, idx) => (
              <OpenOptionOrders
                key={pos.index ?? idx}
                orderId={pos.index}
                logo={pos.logo}
                token={pos.token}
                symbol={pos.symbol}
                type={pos.type}
                limitPrice={pos.limitPrice}
                transaction={pos.transaction}
                size={pos.size}
                orderDate={pos.orderDate}
                status={pos.status}
                onCancel={handleCancelOrder}
              />
            )}
            empty={
              <EmptyState
                icon={BookOpen}
                title="No Orders Open"
                description="Your pending limit orders will be listed here."
              />
            }
          />
        )
      case 'History':
        return (
          <ScrollPanel centered={doneInfo.length === 0}>
            {doneInfo.length > 0 ? (
              <OrderHistory doneOptioninfos={doneInfo} />
            ) : (
              <EmptyState
                icon={History}
                title="No History Available"
                description="Your trade history will be compiled once you start trading."
              />
            )}
          </ScrollPanel>
        )
      default:
        return null
    }
  }

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="flex-shrink-0 border-b border-border bg-muted/20 px-1 py-0.5">
        <div className="flex w-full items-center justify-between gap-2">
          {/* Tab strip — scrolls horizontally instead of clipping on narrow panels */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="min-w-0 flex-1"
          >
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="bg-secondary/50 h-6 w-max gap-0.5 rounded-md p-0.5">
                {TABS.map(({ value, label, icon: Icon, showBadge }) => {
                  const badgeCount = showBadge ? getBadgeCount(value) : null
                  return (
                    <TabsTrigger
                      key={value}
                      value={value}
                      data-testid={`positions-tab-${value.toLowerCase()}`}
                      className="h-full whitespace-nowrap rounded-sm px-2 text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                    >
                      <div className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        <span>{label}</span>
                        {badgeCount !== null && (
                          <Badge
                            variant="secondary"
                            className="h-3.5 px-1 text-[8px]"
                          >
                            {badgeCount}
                          </Badge>
                        )}
                      </div>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>
          </Tabs>

          <div className="flex h-6 flex-shrink-0 items-center gap-1.5">
            <div className="hidden items-center gap-1 text-[10px] text-muted-foreground md:flex">
              <Clock className="h-3 w-3" />
              <span>
                {lastRefreshed.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={fetchData}
            >
              <RotateCw
                className={cn('h-3.5 w-3.5', loading && 'animate-spin')}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        {/* Only fetchData-backed tabs sit behind the loading/error gate */}
        {DATA_TABS.has(activeTab) ? (
          renderDataTab()
        ) : (
          <div className="h-full min-h-0 overflow-hidden">
            {activeTab === 'LiveGrid' && <LiveGridStats />}

            {activeTab === 'Alerts' && <PriceAlerts />}

            {activeTab === 'P2PActivity' &&
              (token ? (
                <P2PActivityPanel />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <EmptyState
                    icon={Users}
                    title="Sign In Required"
                    description="P2P matching and settlement activity is only available once you're signed in."
                  />
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})
