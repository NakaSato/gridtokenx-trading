'use client'

import { ExternalLink } from 'lucide-react'

const SOLANA_EXPLORER_BASE = {
    mainnet: 'https://solscan.io',
    devnet: 'https://solscan.io',
    localnet: 'https://explorer.solana.com',
}

interface BlockchainExplorerLinkProps {
    /** Transaction signature or address */
    value: string
    /** Type of the link */
    type: 'tx' | 'address' | 'token'
    /** Network to use (default: devnet) */
    network?: 'mainnet' | 'devnet' | 'localnet'
    /** Custom label (otherwise truncated value is shown) */
    label?: string
    /** Whether to show external link icon */
    showIcon?: boolean
    /** Additional CSS classes */
    className?: string
}

/**
 * Component for displaying blockchain explorer links
 * Supports Solscan for Solana transactions and addresses
 */
export function BlockchainExplorerLink({
    value,
    type,
    network = 'devnet',
    label,
    showIcon = true,
    className = '',
}: BlockchainExplorerLinkProps) {
    if (!value) return null

    const baseUrl = SOLANA_EXPLORER_BASE[network]
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`

    let path = ''
    switch (type) {
        case 'tx':
            path = `/tx/${value}${cluster}`
            break
        case 'address':
            path = `/account/${value}${cluster}`
            break
        case 'token':
            path = `/token/${value}${cluster}`
            break
    }

    const url = `${baseUrl}${path}`
    const displayText = label || truncateAddress(value)

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
                inline-flex items-center gap-1 
                font-mono text-xs 
                text-primary hover:text-primary/80 
                hover:underline transition-colors
                ${className}
            `}
            title={`View on Solscan: ${value}`}
        >
            <span>{displayText}</span>
            {showIcon && <ExternalLink className="h-3 w-3" />}
        </a>
    )
}

/**
 * Truncate address for display (e.g., "5CSC...wXG")
 */
function truncateAddress(address: string, startChars: number = 4, endChars: number = 4): string {
    if (address.length <= startChars + endChars + 3) {
        return address
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Component for displaying a transaction with explorer link
 */
export function TransactionLink({
    signature,
    network = 'devnet',
    label,
}: {
    signature: string
    network?: 'mainnet' | 'devnet' | 'localnet'
    label?: string
}) {
    return (
        <BlockchainExplorerLink
            value={signature}
            type="tx"
            network={network}
            label={label}
            showIcon={true}
        />
    )
}

/**
 * Component for displaying a wallet address with explorer link
 */
export function AddressLink({
    address,
    network = 'devnet',
    label,
}: {
    address: string
    network?: 'mainnet' | 'devnet' | 'localnet'
    label?: string
}) {
    return (
        <BlockchainExplorerLink
            value={address}
            type="address"
            network={network}
            label={label}
            showIcon={true}
        />
    )
}

/**
 * Badge showing transaction status with explorer link
 */
export function TransactionBadge({
    signature,
    status,
    network = 'devnet',
}: {
    signature: string
    status: 'pending' | 'confirmed' | 'failed'
    network?: 'mainnet' | 'devnet' | 'localnet'
}) {
    const statusColors = {
        pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
        confirmed: 'bg-green-500/20 text-green-500 border-green-500/30',
        failed: 'bg-red-500/20 text-red-500 border-red-500/30',
    }

    return (
        <div className={`
            inline-flex items-center gap-2 px-2 py-1 rounded-md border
            ${statusColors[status]}
        `}>
            <span className="text-xs font-medium capitalize">{status}</span>
            <TransactionLink signature={signature} network={network} />
        </div>
    )
}
