'use client'

import { useAuth } from '@/contexts/AuthProvider'
import Link from 'next/link'

export default function Footer() {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) return null

    return (
        <footer className="w-full border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6 mt-auto">
            <div className="container flex flex-col items-center justify-between gap-6 md:h-12 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {new Date().getFullYear()} GridTokenX. All rights reserved.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <Link
                        href="/privacy-policy"
                        className="hover:text-foreground transition-colors"
                    >
                        Privacy Policy
                    </Link>
                    <Link
                        href="/terms-and-conditions"
                        className="hover:text-foreground transition-colors"
                    >
                        Terms & Conditions
                    </Link>
                    <Link
                        href="https://gridtokenx.com"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground transition-colors"
                    >
                        Website
                    </Link>
                </div>
            </div>
        </footer>
    )
}
