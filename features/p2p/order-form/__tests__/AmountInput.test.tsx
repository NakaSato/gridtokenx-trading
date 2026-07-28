import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AmountInput } from '../AmountInput'
import { P2P_CONFIG } from '@/lib/constants'

/**
 * Controlled harness — mirrors how OrderForm wires AmountInput so userEvent
 * typing behaves against a real value prop. `onChange` sees every committed value.
 */
function Harness({
    balance = 100,
    initial = '',
    onChange,
}: {
    balance?: number | null
    initial?: string
    onChange?: (v: string) => void
}) {
    const [amount, setAmount] = useState(initial)
    return (
        <AmountInput
            amount={amount}
            setAmount={(v) => {
                onChange?.(v)
                setAmount(v)
            }}
            balance={balance}
        />
    )
}

const getInput = () => screen.getByTestId('order-amount-input') as HTMLInputElement

describe('AmountInput', () => {
    describe('rendering', () => {
        it('renders label, range hint, suffix, and placeholder', () => {
            render(<Harness />)
            expect(screen.getByText('Amount')).toBeInTheDocument()
            expect(screen.getByText('Range: 1–5 kWh')).toBeInTheDocument()
            expect(screen.getByText('kWh')).toBeInTheDocument()
            expect(getInput()).toHaveAttribute('placeholder', '0.00')
        })

        it('is a number input with min/max/step constraints', () => {
            render(<Harness />)
            const input = getInput()
            expect(input).toHaveAttribute('type', 'number')
            expect(input).toHaveAttribute('min', '1')
            expect(input).toHaveAttribute('max', '5')
            expect(input).toHaveAttribute('step', '0.01')
        })

        it('renders a quick-amount pill for every configured percentage', () => {
            render(<Harness />)
            for (const percent of P2P_CONFIG.quickAmountPercentages) {
                expect(screen.getByRole('button', { name: `${percent}%` })).toBeInTheDocument()
            }
        })
    })

    describe('typed input — all value cases', () => {
        it.each([
            ['whole number', '5', '5'],
            ['sub-1 decimal (below min, still forwarded raw)', '0.1', '0.1'],
            ['two-decimal value', '12.34', '12.34'],
            ['zero', '0', '0'],
            ['large value', '999999', '999999'],
            ['leading-dot decimal (normalized)', '.5', '0.5'],
        ])('forwards %s verbatim', async (_label, typed, expected) => {
            const onChange = jest.fn()
            render(<Harness onChange={onChange} />)
            await userEvent.type(getInput(), typed)
            expect(getInput().value).toBe(expected)
            expect(onChange).toHaveBeenLastCalledWith(expected)
        })

        it('rejects non-numeric characters (number input sanitizes to empty)', async () => {
            render(<Harness />)
            const input = getInput()
            await userEvent.type(input, 'abc')
            expect(input.value).toBe('')
        })

        it('clearing the field forwards an empty string', () => {
            const onChange = jest.fn()
            render(<Harness initial="42" onChange={onChange} />)
            fireEvent.change(getInput(), { target: { value: '' } })
            expect(onChange).toHaveBeenLastCalledWith('')
            expect(getInput().value).toBe('')
        })

        it('accepts a negative value at the input layer (business validation is upstream)', () => {
            const onChange = jest.fn()
            render(<Harness onChange={onChange} />)
            fireEvent.change(getInput(), { target: { value: '-5' } })
            expect(onChange).toHaveBeenLastCalledWith('-5')
        })
    })

    describe('active styling', () => {
        it('uses muted styling when empty', () => {
            render(<Harness initial="" />)
            // Active branch adds a standalone `text-primary`; empty must not have it.
            // (`border-primary` is skipped here — it also appears in `focus-visible:border-primary`.)
            expect(getInput().className).not.toContain('text-primary')
            expect(getInput().className).toContain('text-foreground')
            expect(screen.getByText('kWh').className).toContain('text-muted-foreground')
        })

        it('uses primary styling when a value is present', () => {
            render(<Harness initial="5" />)
            expect(getInput().className).toContain('border-primary')
            expect(getInput().className).toContain('text-primary')
            expect(screen.getByText('kWh').className).toContain('text-primary/70')
        })
    })

    describe('quick-amount pills (percentage of MAX 5 kWh)', () => {
        it.each(
            P2P_CONFIG.quickAmountPercentages.map((p) => [
                p,
                ((P2P_CONFIG.maxOrderKwh * p) / 100).toFixed(2),
            ]),
        )('%i%% sets amount to %s (of 5 kWh)', async (percent, expected) => {
            const onChange = jest.fn()
            render(<Harness onChange={onChange} />)
            await userEvent.click(screen.getByRole('button', { name: `${percent}%` }))
            expect(onChange).toHaveBeenCalledWith(expected)
            expect(getInput().value).toBe(expected)
        })

        it('produces the exact expected pill values', async () => {
            const onChange = jest.fn()
            render(<Harness onChange={onChange} />)
            for (const [pct, expected] of [
                ['25%', '1.25'],
                ['50%', '2.50'],
                ['75%', '3.75'],
                ['100%', '5.00'],
            ]) {
                await userEvent.click(screen.getByRole('button', { name: pct }))
                expect(onChange).toHaveBeenLastCalledWith(expected)
            }
        })

        it('every pill value lands inside the valid 1–5 kWh range', async () => {
            const onChange = jest.fn()
            render(<Harness onChange={onChange} />)
            for (const percent of P2P_CONFIG.quickAmountPercentages) {
                await userEvent.click(screen.getByRole('button', { name: `${percent}%` }))
                const value = parseFloat(onChange.mock.calls.at(-1)![0])
                expect(value).toBeGreaterThanOrEqual(P2P_CONFIG.minOrderKwh)
                expect(value).toBeLessThanOrEqual(P2P_CONFIG.maxOrderKwh)
            }
        })

        it('fires regardless of balance (balance no longer gates pills)', async () => {
            const onChange = jest.fn()
            render(<Harness balance={null} onChange={onChange} />)
            await userEvent.click(screen.getByRole('button', { name: '50%' }))
            expect(onChange).toHaveBeenLastCalledWith('2.50')
        })
    })

    describe('range validation (1–5 kWh)', () => {
        it.each([
            ['below min', '0.5'],
            ['zero', '0'],
            ['above max', '5.01'],
            ['far above max', '999'],
            ['negative', '-3'],
        ])('shows an error and marks invalid for %s', (_label, value) => {
            render(<Harness initial={value} />)
            expect(screen.getByRole('alert')).toHaveTextContent('Amount must be between 1 and 5 kWh')
            expect(getInput()).toHaveAttribute('aria-invalid', 'true')
            expect(getInput().className).toContain('border-destructive')
        })

        it.each([
            ['min boundary', '1'],
            ['mid range', '2.5'],
            ['max boundary', '5'],
        ])('accepts %s with no error', (_label, value) => {
            render(<Harness initial={value} />)
            expect(screen.queryByRole('alert')).not.toBeInTheDocument()
            expect(getInput()).toHaveAttribute('aria-invalid', 'false')
            expect(getInput().className).toContain('border-primary')
        })

        it('shows no error when empty', () => {
            render(<Harness initial="" />)
            expect(screen.queryByRole('alert')).not.toBeInTheDocument()
            expect(getInput()).toHaveAttribute('aria-invalid', 'false')
        })
    })
})
