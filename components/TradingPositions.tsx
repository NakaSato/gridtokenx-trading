'use client'

import {
  useCallback,
  useEffect,
  useState,
  memo,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
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
import OpenPositions from './OpenPositions'
import OrderHistory from './OrderHistory'
import { Position } from '@/types/trading'
import { mapApiOrderToOrder } from '@/lib/api/adapters'
import LiveGridStats from './LiveGridStats'
import P2PActivityPanel from './p2p/P2PActivityPanel'
import PriceAlerts from './trading/PriceAlerts'
import { Transaction } from '@/types/wallet'
import Pagination from '@/components/shared/Pagination'
import OpenOptionOrders from './OpenOptionOrders'
import { useAuth } from '@/contexts/AuthProvider'
import { useSidebar } from '@/components/shared/SidebarContext'
import { createApiClient } from '@/lib/api-client'
import type { Order } from '@/types/trading'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { ApiFuturesPosition, ApiOrder, TradeRecord } from '@/types/trading'

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
  const [optioninfos, setOptionInfos] = useState<Position[]>([])
  const [orderInfos, setOrderInfos] = useState<Order[]>([])
  const [doneInfo, setDoneInfo] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

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

  const fetchData = useCallback(async () => {
    if (!token) {
      // Don't leave the skeleton up forever when signed out / token expired
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const apiClient = createApiClient(token)

      // 1. Fetch Futures Positions
      const positionsRes =
        (await apiClient.getFuturesPositions()) as unknown as {
          data: { data: ApiFuturesPosition[] }
        }
      if (positionsRes.data?.data) {
        const mappedPositions: Position[] = positionsRes.data.data.map(
          (pos: ApiFuturesPosition) => ({
            index: pos.id,
            token: pos.product_symbol || 'Unknown',
            logo: '/images/solana.png',
            symbol: pos.product_symbol || 'GRX',
            type: pos.side === 'long' ? 'Long' : 'Short',
            strikePrice: parseFloat(pos.entry_price),
            expiry: 'Perpetual',
            size: parseFloat(pos.quantity),
            pnl: parseFloat(pos.unrealized_pnl || '0'),
            greeks: { delta: 0, gamma: 0, theta: 0, vega: 0 },
          })
        )
        setOptionInfos(mappedPositions)
      }

      // 2. Fetch Trading Orders
      // No status filter server-side — a freshly placed order starts 'pending'
      // and only becomes 'active' once the matcher processes it (trading-api
      // rest.rs submit_order), so filtering to status=active hid every order
      // until that async promotion happened. Fetch everything and keep the
      // still-open statuses client-side instead.
      const OPEN_STATUSES = new Set(['pending', 'active', 'partially_filled'])
      const ordersRes = (await apiClient.getOrders({})) as unknown as {
        data: { data: ApiOrder[] }
      }
      if (ordersRes.data?.data) {
        const mappedOrders: Order[] = ordersRes.data.data
          .filter((o) => OPEN_STATUSES.has(o.status))
          .map(mapApiOrderToOrder)
        setOrderInfos(mappedOrders)
      }

      // 3. Fetch Trade History (API only — no direct on-chain reads; all
      // blockchain access goes through the backend / Chain Bridge)
      const tradesRes = (await apiClient.getTrades({
        limit: 50,
      })) as unknown as { data: { trades: TradeRecord[] } }
      if (tradesRes.data?.trades) {
        const mappedHistory: Transaction[] = tradesRes.data.trades.map(
          (trade: TradeRecord) => ({
            transactionID: trade.id,
            token: {
              name: 'GridToken',
              symbol: 'GRX',
              logo: '/images/grid.png',
            },
            transactionType: trade.role === 'buyer' ? 'Buy' : 'Sell',
            optionType: 'Spot',
            strikePrice: parseFloat(trade.price_per_kwh ?? trade.price),
            quantity: parseFloat(trade.energy_amount ?? trade.quantity),
            totalValue: parseFloat(trade.total_value),
            wheelingCharge:
              trade.wheeling_charge != null
                ? parseFloat(trade.wheeling_charge)
                : undefined,
            effectiveEnergy:
              trade.effective_energy != null
                ? parseFloat(trade.effective_energy)
                : undefined,
            expiry: format(
              new Date(trade.executed_at),
              'dd MMM, yyy HH:mm:ss'
            ),
          })
        )
        setDoneInfo(mappedHistory)
      }
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Error fetching trading data:', err)
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      if (!token) return
      try {
        const apiClient = createApiClient(token)
        const res = await apiClient.cancelOrder(orderId)
        if (res.error) {
          toast.error(res.error)
        } else {
          toast.success('Order canceled successfully')
          fetchData()
        }
      } catch {
        toast.error('Failed to cancel order')
      }
    },
    [token, fetchData]
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
