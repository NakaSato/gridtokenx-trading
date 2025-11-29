'use client'
import { DialogTitle } from '@radix-ui/react-dialog'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useState, useRef } from 'react'
import { User, Upload, Copy, Check } from 'lucide-react'
import Image from 'next/image'
import { useWallet } from '@solana/wallet-adapter-react'

export default function Profile() {
  const { publicKey, connected } = useWallet()
  const [username, setUsername] = useState<string>('GridTrader')
  const [email, setEmail] = useState<string>('trader@gridtokenx.com')
  const [isEditing, setIsEditing] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    // Save profile logic here
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Reset to original values
    setIsEditing(false)
  }

  const handleCopyAddress = async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <Dialog>
      <DialogTrigger className="hidden sm:flex">
        <div className="rounded-sm bg-secondary p-[9px] text-foreground hover:text-primary">
          <User className="h-4 w-4" />
        </div>
      </DialogTrigger>
      <DialogContent className="flex w-[520px] flex-col border-none bg-accent p-5 sm:rounded-sm">
        <DialogTitle className="text-base font-medium text-foreground">
          Profile
        </DialogTitle>
        <Separator className="bg-secondary" />
        <div className="flex w-full flex-col space-y-5">
          {/* Profile Picture */}
          <div className="flex w-full flex-col items-center space-y-3">
            <div
              className="group relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-primary"
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-background" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="ghost"
              className="text-xs text-primary hover:text-primary/80"
              onClick={handleAvatarClick}
            >
              Change Avatar
            </Button>
          </div>

          {/* Wallet Address */}
          {connected && publicKey && (
            <div className="flex w-full flex-col space-y-[14px]">
              <Label className="text-xs font-medium text-foreground">
                Wallet Address
              </Label>
              <div className="flex items-center justify-between rounded-sm border bg-secondary px-3 py-2">
                <span className="font-mono text-xs text-foreground">
                  {shortenAddress(publicKey.toBase58())}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-6 w-6 p-0 hover:bg-accent"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-secondary-foreground" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Username */}
          <div className="flex w-full flex-col space-y-[14px]">
            <Label className="text-xs font-medium text-foreground">
              Username
            </Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-sm border bg-secondary px-3 py-2 text-xs focus:border-primary"
              disabled={!isEditing}
            />
          </div>

          {/* Email */}
          <div className="flex w-full flex-col space-y-[14px]">
            <Label className="text-xs font-medium text-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-sm border bg-secondary px-3 py-2 text-xs focus:border-primary"
              disabled={!isEditing}
            />
          </div>

          {/* Stats */}
          <div className="flex w-full flex-col space-y-3">
            <Label className="text-xs font-medium text-foreground">
              Trading Stats
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col rounded-sm bg-secondary p-3">
                <span className="text-xs text-secondary-foreground">
                  Total Trades
                </span>
                <span className="text-base font-semibold text-foreground">
                  156
                </span>
              </div>
              <div className="flex flex-col rounded-sm bg-secondary p-3">
                <span className="text-xs text-secondary-foreground">
                  Total Volume
                </span>
                <span className="text-base font-semibold text-foreground">
                  12,450 GRIDX
                </span>
              </div>
              <div className="flex flex-col rounded-sm bg-secondary p-3">
                <span className="text-xs text-secondary-foreground">
                  Win Rate
                </span>
                <span className="text-base font-semibold text-green-500">
                  68.5%
                </span>
              </div>
              <div className="flex flex-col rounded-sm bg-secondary p-3">
                <span className="text-xs text-secondary-foreground">
                  Total PnL
                </span>
                <span className="text-base font-semibold text-green-500">
                  +2,340 GRIDX
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {isEditing ? (
              <>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 border-secondary text-xs hover:border-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-xs text-background hover:bg-gradient-primary"
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-primary text-xs text-background hover:bg-gradient-primary"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
