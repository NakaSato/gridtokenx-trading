'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Search,
    Filter,
    Shield,
    Mail,
    Calendar,
    MoreHorizontal,
    Loader2,
    CheckCircle2,
    XCircle
} from 'lucide-react'
import { useAdminUsers, useAuth, useAdminActions } from '@/hooks/useApi'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserManagement() {
    const { token } = useAuth()
    const { users, total, loading, refetch } = useAdminUsers(token ?? undefined)
    const { updateRole, deactivateUser, reactivateUser, loading: actionLoading } = useAdminActions(token ?? undefined)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredUsers = users?.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []

    const handleRoleUpdate = async (userId: string, currentRole: string) => {
        const nextRole = currentRole === 'admin' ? 'user' : 'admin'
        const result = await updateRole(userId, nextRole)
        if (result) {
            toast.success(`User role updated to ${nextRole}`)
            refetch()
        }
    }

    const handleToggleStatus = async (userId: string, isActive: boolean) => {
        const result = isActive ? await deactivateUser(userId) : await reactivateUser(userId)
        if (result) {
            toast.success(`User account ${isActive ? 'deactivated' : 'reactivated'}`)
            refetch()
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Admin</Badge>
            case 'vpp_operator':
                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Operator</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
    }

    if (loading && !users) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-3 text-lg font-medium">Scanning Platform Directory...</span>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-8 rounded-2xl border shadow-lg">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-500/10 rounded-2xl">
                        <Users className="h-10 w-10 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white">User Management</h1>
                        <p className="text-muted-foreground mt-2 text-lg">Manage platform identities, roles, and on-chain linkages.</p>
                    </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-10 bg-white/5 border-white/10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => refetch()}>
                        Refresh
                    </Button>
                </div>
            </header>

            <Card className="border-none shadow-2xl overflow-hidden bg-card/60 backdrop-blur-md">
                <CardHeader className="border-b border-white/5 bg-muted/20 py-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Registered Identities ({total || 0})
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableHead className="font-bold">User</TableHead>
                                <TableHead className="font-bold">Role</TableHead>
                                <TableHead className="font-bold">Wallet Address</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="font-bold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="hover:bg-white/5 transition-colors border-white/5 group">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm uppercase tracking-tight">{user.username}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {user.wallet_address ? `${user.wallet_address.substring(0, 8)}...${user.wallet_address.substring(user.wallet_address.length - 8)}` : 'Not Linked'}
                                    </TableCell>
                                    <TableCell>
                                        {user.is_active ? (
                                            <div className="flex items-center gap-1.5 text-xs text-green-500">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Active
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs text-red-500">
                                                <XCircle className="h-3.5 w-3.5" />
                                                Inactive
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                                    Copy ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleRoleUpdate(user.id, user.role)}
                                                    disabled={actionLoading}
                                                >
                                                    {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className={user.is_active ? "text-red-500" : "text-green-500"}
                                                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                                                    disabled={actionLoading}
                                                >
                                                    {user.is_active ? 'Deactivate User' : 'Reactivate User'}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                        No users matching your search criteria.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
