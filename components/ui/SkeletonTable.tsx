'use client'

import React from 'react'

interface SkeletonTableProps {
    rows?: number
    columns?: number
    height?: number
}

export default function SkeletonTable({ rows = 10, columns = 5, height = 400 }: SkeletonTableProps) {
    return (
        <div className="w-full bg-background overflow-hidden animate-pulse">
            <div className="flex w-full items-center p-4 border-b border-border">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="flex-1 h-4 bg-secondary/20 rounded-md mx-2"></div>
                ))}
            </div>
            <div className="w-full" style={{ height: `${height}px` }}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex w-full items-center p-4 border-b border-border/50">
                        {Array.from({ length: columns }).map((_, j) => (
                            <div key={j} className="flex-1 h-3 bg-secondary/10 rounded-md mx-2"></div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}
