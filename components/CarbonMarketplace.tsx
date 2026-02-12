'use client'

import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { useTrading } from '@/contexts/TradingProvider'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Leaf, Award, Recycle, ShieldCheck, TrendingUp, Globe, Clock, ArrowRight } from 'lucide-react'

export const CarbonMarketplace: React.FC = () => {
    const { publicKey } = useWallet()
    const { program, mintRecCertificate, retireRecCertificate, createCarbonListing, fillCarbonListing } = useTrading()
    const [stats, setStats] = useState<any>(null)

    // ── Fetch Global Marketplace State ────────────────────────────────
    const { data: marketplace } = useQuery({
        queryKey: ['carbon-marketplace', program?.programId?.toString()],
        queryFn: async () => {
            if (!program || !publicKey) return null
            const [pda] = PublicKey.findProgramAddressSync(
                [Buffer.from("carbon_marketplace"), publicKey.toBuffer()], // For demo, assume authority-based marketplace discovery
                program.programId
            )
            try {
                return await (program.account as any).carbonMarketplace.fetch(pda)
            } catch (e) {
                console.error("No marketplace found:", e)
                return null
            }
        },
        enabled: !!program && !!publicKey,
        refetchInterval: 10000
    })

    // ── Fetch User certificates ──────────────────────────────────────
    const { data: userCerts = [], refetch: refreshCerts } = useQuery({
        queryKey: ['user-recs', publicKey?.toBase58()],
        queryFn: async () => {
            if (!program || !publicKey) return []
            const certs = await (program.account as any).recCertificate.all([
                { memcmp: { offset: 8 + 1 + 8, bytes: publicKey.toBase58() } } // offset: disc(8) + bump(1) + cert_id(8)
            ])
            return certs
        },
        enabled: !!program && !!publicKey
    })

    // ── Fetch Listings ───────────────────────────────────────────────
    const { data: listings = [], refetch: refreshListings } = useQuery({
        queryKey: ['carbon-listings'],
        queryFn: async () => {
            if (!program) return []
            return await (program.account as any).carbonListing.all()
        },
        enabled: !!program
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* ── Global Stats ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Globe className="text-emerald-400" />}
                    label="Global Carbon Offset"
                    value={marketplace ? `${marketplace.totalCarbonOffset.toNumber().toLocaleString()}g` : "0g"}
                    sub="CO2e avoided"
                />
                <StatCard
                    icon={<Award className="text-blue-400" />}
                    label="Total RECs Minted"
                    value={marketplace ? marketplace.totalMinted.toString() : "0"}
                    sub="Verified Certs"
                />
                <StatCard
                    icon={<Recycle className="text-amber-400" />}
                    label="Total Retired"
                    value={marketplace ? marketplace.totalRetired.toString() : "0"}
                    sub="Proven Impact"
                />
                <StatCard
                    icon={<TrendingUp className="text-indigo-400" />}
                    label="Active Listings"
                    value={listings.length.toString()}
                    sub="In Marketplace"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Marketplace Listings ────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Leaf className="text-emerald-500" /> Carbon Marketplace
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {listings.length === 0 ? (
                            <div className="col-span-2 py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/50">
                                <p className="text-slate-400">No active listings available.</p>
                            </div>
                        ) : listings.map((l: any) => (
                            <ListingCard
                                key={l.publicKey.toBase58()}
                                listing={l.account}
                                onBuy={() => fillCarbonListing(l.publicKey, l.account.certificate, l.account.seller, 10).then(() => refreshListings())}
                            />
                        ))}
                    </div>
                </div>

                {/* ── User Inventory & Minting ────────────────────────────── */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ShieldCheck className="text-blue-500" /> Your Portfolio
                    </h2>

                    <div className="space-y-4">
                        {userCerts.length === 0 ? (
                            <div className="p-6 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-700">
                                <p className="text-slate-400 text-sm mb-4">You don't have any REC certificates yet.</p>
                                <button
                                    onClick={() => toast.success("Scanning sensor data...")}
                                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs rounded-lg transition-all border border-emerald-500/20"
                                >
                                    Check Sensors
                                </button>
                            </div>
                        ) : userCerts.map((c: any) => (
                            <CertCard
                                key={c.publicKey.toBase58()}
                                cert={c.account}
                                onRetire={() => retireRecCertificate(c.publicKey, 1, "Voluntary Offset", "2026-Q1").then(() => refreshCerts())}
                                onList={() => createCarbonListing(c.publicKey, 100, 1000000, 86400).then(() => refreshListings())}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const StatCard = ({ icon, label, value, sub }: any) => (
    <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl hover:border-slate-700/80 transition-all group">
        <div className="p-2 w-fit bg-slate-800 rounded-lg mb-4 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{label}</p>
        <h3 className="text-2xl font-black mt-1">{value}</h3>
        <p className="text-slate-500 text-xs mt-1">{sub}</p>
    </div>
)

const ListingCard = ({ listing, onBuy }: any) => (
    <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-xs text-slate-500">Seller</p>
                <p className="text-[10px] font-mono text-emerald-400/70">{listing.seller.toBase58().slice(0, 8)}...</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-500">Price</p>
                <p className="text-sm font-bold text-white">{(listing.pricePerRec.toNumber() / 1e9).toFixed(5)} SOL</p>
            </div>
        </div>
        <div className="flex items-center gap-4 mb-5">
            <div className="flex-1">
                <p className="text-xs text-slate-500 mb-1">Available</p>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-3/4 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{listing.amount.toNumber()} RECs left</p>
            </div>
        </div>
        <button
            onClick={onBuy}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
        >
            Buy Credits <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
    </div>
)

const CertCard = ({ cert, onRetire, onList }: any) => (
    <div className={`p-4 rounded-xl border transition-all ${cert.isRetired ? 'bg-slate-950/40 border-slate-800/30 opacity-60' : 'bg-slate-900/60 border-slate-800/80 hover:border-blue-500/30'}`}>
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                <Award size={14} className={cert.isRetired ? 'text-slate-600' : 'text-blue-400'} />
                <span className="text-xs font-bold">REC #{cert.certificateId.toString()}</span>
            </div>
            {cert.isRetired ? (
                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full">Retired</span>
            ) : (
                <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Active</span>
            )}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
                <p className="text-[10px] text-slate-500">Impact</p>
                <p className="text-xs font-semibold">{cert.carbonOffset.toNumber()}g CO2e</p>
            </div>
            <div>
                <p className="text-[10px] text-slate-500">Energy</p>
                <p className="text-xs font-semibold">{(cert.energyAmount.toNumber() / 1000).toFixed(1)} kWh</p>
            </div>
        </div>
        {!cert.isRetired && (
            <div className="flex gap-2">
                <button
                    onClick={onRetire}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded-lg transition-all"
                >
                    Retire
                </button>
                <button
                    onClick={onList}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all"
                >
                    List
                </button>
            </div>
        )}
    </div>
)
