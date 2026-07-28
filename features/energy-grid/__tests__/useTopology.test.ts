import { renderHook, act } from '@testing-library/react'
import { useTopology } from '@/features/energy-grid/hooks/useTopology'
import type { EnergyNode, EnergyTransfer } from '@/types/grid'

const node = (id: string): EnergyNode => ({
  id,
  name: id,
  buildingCode: id,
  type: 'consumer',
  latitude: 13.7,
  longitude: 100.5,
  capacity: '',
  status: 'active',
})

const transfer = (from: string, to: string): EnergyTransfer => ({
  from,
  to,
  power: 1,
  description: 'line',
})

describe('useTopology', () => {
  it('does not re-render when reloaded with equivalent-but-new arrays', () => {
    let renders = 0
    const { result } = renderHook(() => {
      renders += 1
      return useTopology()
    })

    const initial = renders
    act(() => {
      result.current.loadNetwork([node('a'), node('b')], [transfer('a', 'b')])
    })
    const afterFirst = renders
    expect(afterFirst).toBeGreaterThan(initial) // counts actually changed

    // EnergyGridMap re-runs its effect whenever the node arrays change
    // identity. Fresh arrays with identical contents must not keep queueing
    // real state updates, or the effect → setState → re-render cycle never
    // terminates. React is allowed one render before it bails out, so the
    // property under test is that N reloads do not cost N renders.
    act(() => {
      for (let i = 0; i < 20; i += 1) {
        result.current.loadNetwork([node('a'), node('b')], [transfer('a', 'b')])
      }
    })
    expect(renders - afterFirst).toBeLessThanOrEqual(1)
  })

  it('still reports new counts when the network really changes', () => {
    const { result } = renderHook(() => useTopology())

    act(() => {
      result.current.loadNetwork([node('a')], [])
    })
    expect(result.current.getInfo()).toEqual({
      nodeCount: 1,
      lineCount: 0,
      totalLoss: 0,
    })

    act(() => {
      result.current.loadNetwork([node('a'), node('b')], [transfer('a', 'b')])
    })
    expect(result.current.getInfo()).toEqual({
      nodeCount: 2,
      lineCount: 1,
      totalLoss: 0,
    })
  })

  it('drops transfers that reference unknown nodes', () => {
    const { result } = renderHook(() => useTopology())

    act(() => {
      result.current.loadNetwork(
        [node('a'), node('b')],
        [transfer('a', 'b'), transfer('a', 'ghost')]
      )
    })
    expect(result.current.getInfo().lineCount).toBe(1)
  })

  it('finds a path across the loaded graph', () => {
    const { result } = renderHook(() => useTopology())

    act(() => {
      result.current.loadNetwork([node('a'), node('b')], [transfer('a', 'b')])
    })
    expect(result.current.findPath('a', 'b')?.nodeIds).toEqual(['a', 'b'])
    expect(result.current.findPath('a', 'missing')).toBeNull()
  })
})
