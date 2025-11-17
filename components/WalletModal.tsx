"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { XIcon, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import WalletButton from "./WalletButton";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
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
  const [authMode, setAuthMode] = useState<"wallet" | "signin" | "signup">(
    "wallet"
  );

  // Email/Password form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

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

    if (!agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
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
      <DialogContent className="w-full h-full flex flex-col md:h-auto md:max-w-1xl md:max-h-[90%] md:p-10 bg-accent overflow-y-auto">
        <DialogHeader className="space-y-0 h-fit md:h-auto flex flex-row items-center justify-between pb-4 md:pb-5">
          <DialogTitle className="text-2xl text-foreground font-medium">
            {authMode === "wallet"
              ? "Connect Wallet"
              : authMode === "signin"
              ? "Sign In"
              : "Sign Up"}
          </DialogTitle>
          <Button
            className="bg-secondary p-[9px] shadow-none [&_svg]:size-[18px] rounded-[12px] border-border md:hidden"
            onClick={() => onClose()}
          >
            <XIcon size={18} className="text-secondary-foreground" />
          </Button>
        </DialogHeader>

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
            <div className="text-center">
              <button
                onClick={() => setAuthMode("signin")}
                className="text-secondary-foreground hover:text-primary text-sm font-medium transition-colors"
              >
                Or sign in with email →
              </button>
            </div>
          </div>
        ) : authMode === "signin" ? (
          <div className="w-full max-w-md mx-auto">
            <>
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 px-3 py-2 rounded-sm border border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-9 px-3 py-2 rounded-sm pr-10 border border-border"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked === true)
                      }
                    />
                    <Label
                      htmlFor="remember-me"
                      className="text-sm text-secondary-foreground cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toast("Password reset coming soon", { icon: "ℹ️" })
                    }
                    className="text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-sm"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-accent text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {allWallets.map((wallet) => (
                  <Button
                    key={wallet.name}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      handleWalletConnect(wallet.name, wallet.iconPath)
                    }
                    className="h-10 rounded-sm"
                  >
                    <img
                      src={wallet.iconPath}
                      alt={wallet.name}
                      className="w-6 h-6"
                    />
                  </Button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-secondary-foreground text-center text-sm">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </>
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto">
            <>
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="h-9 px-3 py-2 rounded-sm border border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 px-3 py-2 rounded-sm border border-border"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password (min 8 characters)"
                      className="h-9 px-3 py-2 rounded-sm pr-10 border border-border"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="h-9 px-3 py-2 rounded-sm pr-10 border border-border"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agree-terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) =>
                      setAgreeToTerms(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="agree-terms"
                    className="text-xs text-muted-foreground cursor-pointer leading-4"
                  >
                    I agree to the{" "}
                    <a href="#" className="text-primary hover:text-primary/80">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary hover:text-primary/80">
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-sm"
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-secondary-foreground text-center text-sm">
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signin")}
                    className="text-primary hover:text-primary/80 font-semibold transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
