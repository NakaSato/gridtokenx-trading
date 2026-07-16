import { meterSerialFromNode } from '../order-form/meterId'
import type { EnergyNode } from '@/components/energy-grid/types'

const node = (over: Partial<EnergyNode>): EnergyNode => ({
    id: 'a3f1c2d4-5b6e-4a7c-8d9e-0f1a2b3c4d5e',
    name: 'Meter',
    buildingCode: 'B-1',
    type: 'generator',
    latitude: 13.7,
    longitude: 100.5,
    capacity: '',
    status: 'active',
    ...over,
})

describe('meterSerialFromNode', () => {
    it('forwards a real backend meter serial', () => {
        expect(meterSerialFromNode(node({}))).toBe('a3f1c2d4-5b6e-4a7c-8d9e-0f1a2b3c4d5e')
    })

    it('forwards a non-UUID serial', () => {
        // Serials are not necessarily UUIDs — the IAM meters table also holds
        // `GRID-<n>` style serials. Nothing here may assume UUID shape.
        expect(meterSerialFromNode(node({ id: 'GRID-1783978204904945000' }))).toBe(
            'GRID-1783978204904945000'
        )
    })

    it('drops synthesized transformer nodes', () => {
        // `transformer-<zone>` is invented client-side (EnergyGridMap) and has no
        // meter row behind it.
        expect(meterSerialFromNode(node({ id: 'transformer-3', type: 'transformer' }))).toBeUndefined()
        // Guard on the id too, not just the type.
        expect(meterSerialFromNode(node({ id: 'transformer-3' }))).toBeUndefined()
    })

    it('drops the synthetic fallback id used when the backend omits meter_id', () => {
        expect(
            meterSerialFromNode(node({ id: 'meter-eng_building-13.7000-100.5000-2' }))
        ).toBeUndefined()
    })

    it('returns undefined with no selected node', () => {
        expect(meterSerialFromNode(null)).toBeUndefined()
        expect(meterSerialFromNode(undefined)).toBeUndefined()
    })
})
