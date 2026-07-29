import type { EnergyNode } from '@/types/grid'

/**
 * The meter `serial_number` to attribute an order to, from the selected map node.
 *
 * Map node ids are meter serials (see energy-grid/useMeterMapData.ts#generateMeterId),
 * NOT the `meters.id` that `trading_orders.meter_id` FKs to — so this goes to the
 * API as `meter_serial` and the backend resolves it. Two node kinds have no meter
 * behind them and must not be sent:
 *   - synthesized transformers (`transformer-<zone>`), invented client-side
 *   - the fallback id (`meter-<location>-<lat>-<lng>-<i>`) used when the backend
 *     omitted a real one
 */
export function meterSerialFromNode(node?: EnergyNode | null): string | undefined {
    if (!node || node.type === 'transformer') return undefined
    if (node.id.startsWith('transformer-') || node.id.startsWith('meter-')) return undefined
    return node.id
}
