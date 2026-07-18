'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw, RotateCw } from 'lucide-react'
import { Button } from './button'

// After this many failed retries, resetting state clearly isn't enough —
// offer a full page reload instead of an endless retry loop.
const MAX_RETRIES = 2

interface Props {
    children?: ReactNode
    fallback?: ReactNode
    name?: string
}

interface State {
    hasError: boolean
    error: Error | null
    retryCount: number
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        retryCount: 0,
    }

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'Component'}:`, error, errorInfo)
    }

    private handleRetry = () => {
        this.setState((prev) => ({
            hasError: false,
            error: null,
            retryCount: prev.retryCount + 1,
        }))
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            const { error, retryCount } = this.state
            const exhausted = retryCount >= MAX_RETRIES

            return (
                <div
                    role="alert"
                    className="flex min-h-[200px] w-full flex-col items-center justify-center gap-4 rounded-sm border border-dashed border-destructive/50 bg-destructive/5 p-6 text-center animate-in fade-in duration-300"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold text-foreground">
                            {this.props.name ? `${this.props.name} failed to load` : 'Something went wrong'}
                        </h3>
                        <p className="mx-auto max-w-[320px] text-sm text-muted-foreground">
                            {exhausted
                                ? 'Retrying didn’t help. The rest of the page still works — reload to try a fresh start.'
                                : 'The rest of the page still works. You can retry just this section.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {exhausted ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2"
                            >
                                <RotateCw className="h-4 w-4" aria-hidden="true" />
                                Reload page
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={this.handleRetry}
                                className="flex items-center gap-2"
                            >
                                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                                Try again
                            </Button>
                        )}
                    </div>
                    {process.env.NODE_ENV === 'development' && error && (
                        <details className="w-full max-w-[480px] text-left">
                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                Error details (dev only)
                            </summary>
                            <pre className="mt-2 max-h-40 overflow-auto rounded-sm border bg-background/60 p-3 text-xs text-destructive whitespace-pre-wrap break-words">
                                {error.message}
                                {error.stack ? `\n\n${error.stack.split('\n').slice(1, 6).join('\n')}` : ''}
                            </pre>
                        </details>
                    )}
                </div>
            )
        }

        return this.props.children
    }
}
