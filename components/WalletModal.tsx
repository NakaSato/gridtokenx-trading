"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { XIcon, Mail, Lock, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { cn } from "@/lib/utils";
import WalletButton from "./WalletButton";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Wallet {
  name: string;
  iconPath: string;
}

export const allWallets: Wallet[] = [
  { name: "Phantom", iconPath: "/images/phantom.png" },
  { name: "Solflare", iconPath: "/images/solflare.png" },
  { name: "Trust", iconPath: "/images/trust.png" },
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { select, wallets } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [authMode, setAuthMode] = useState<"wallet" | "email">("wallet");

  // Email/Password form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleWalletConnect = async (walletName: string, iconPath: string) => {
    if (isConnecting) return;

    setIsConnecting(true);
    try {
      const wallet = wallets.find((value) => value.adapter.name === walletName);

      if (!wallet) {
        toast.error(`Wallet "${walletName}" not found`);
        return;
      }

      select(wallet.adapter.name);
      await wallet.adapter.connect();

      toast.success(`${walletName} Wallet Connected`);

      onClose();
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      toast.error(`Failed to connect: ${error?.message || "Unknown error"}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual sign-in logic with your backend
      // const response = await fetch('/api/auth/signin', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, password })
      // });

      // Simulated sign-in
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Signed in successfully");
      onClose();
    } catch (error: any) {
      toast.error(`Sign in failed: ${error?.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual sign-up logic with your backend
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   body: JSON.stringify({ email, password, fullName })
      // });

      // Simulated sign-up
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Account created successfully");
      onClose();
    } catch (error: any) {
      toast.error(`Sign up failed: ${error?.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-full flex flex-col md:h-auto md:max-w-2xl md:max-h-[90%] p-10 bg-accent overflow-y-auto">
        <DialogHeader className="space-y-0 h-fit md:h-auto flex flex-row items-center justify-between md:pb-5">
          <DialogTitle className="text-2xl">
            {authMode === "wallet" ? "Connect Wallet" : "Sign In / Sign Up"}
          </DialogTitle>
          <Button
            className="bg-secondary p-[9px] shadow-none [&_svg]:size-[18px] rounded-[12px] border md:hidden"
            onClick={() => onClose()}
          >
            <XIcon size={18} className="text-secondary-foreground" />
          </Button>
        </DialogHeader>

        {/* Auth Mode Toggle */}
        <div className="flex gap-2 w-full mb-4">
          <Button
            variant={authMode === "wallet" ? "default" : "outline"}
            className="flex-1 rounded-sm"
            onClick={() => setAuthMode("wallet")}
          >
            Wallet
          </Button>
          <Button
            variant={authMode === "email" ? "default" : "outline"}
            className="flex-1 rounded-sm"
            onClick={() => setAuthMode("email")}
          >
            Email
          </Button>
        </div>

        {authMode === "wallet" ? (
          <div className="w-full flex flex-col justify-between space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {allWallets.map((wallet) => (
                <WalletButton
                  key={wallet.name}
                  {...wallet}
                  onClick={() =>
                    handleWalletConnect(wallet.name, wallet.iconPath)
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-sm bg-primary hover:bg-gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm text-muted-foreground"
                  onClick={() =>
                    toast("Password reset coming soon", { icon: "ℹ️" })
                  }
                >
                  Forgot password?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-sm bg-primary hover:bg-gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our Terms of Service and Privacy
                  Policy
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
