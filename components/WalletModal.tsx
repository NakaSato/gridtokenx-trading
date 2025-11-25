"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { XIcon, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import WalletList from "./WalletList";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import type { Wallet } from "../types/wallet";
import { defaultApiClient } from "../lib/api-client";
import type { LoginResponse, RegisterResponse } from "../types/auth";
import { useAuth } from "../contexts/AuthProvider";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Memoized wallet configuration to prevent recreation on every render
export const allWallets: Wallet[] = [
  { name: "Phantom", iconPath: "/images/phantom.png", id: "phantom" },
  { name: "Solflare", iconPath: "/images/solflare.png", id: "solflare" },
  { name: "Trust", iconPath: "/images/trust.png", id: "trust" },
  { name: "SafePal", iconPath: "/images/safepal.png", id: "safepal" },
] as const;

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const router = useRouter();
  const { select, wallets } = useWallet();
  const { login, register, isLoading: authLoading } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [authMode, setAuthMode] = useState<"wallet" | "signin" | "signup">(
    "wallet"
  );

  // Email/Password form states
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("user");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleWalletConnect = useCallback(
    async (walletName: string, iconPath: string) => {
      if (isConnecting) return;

      setIsConnecting(true);
      try {
        const wallet = wallets.find(
          (value) => value.adapter.name === walletName
        );

        if (!wallet) {
          toast.error(`Wallet "${walletName}" not found`);
          return;
        }

        // Check if wallet is ready
        if (
          !wallet.adapter.readyState ||
          wallet.adapter.readyState === "Unsupported"
        ) {
          toast.error(
            `${walletName} wallet is not installed. Please install it first.`
          );
          // Open wallet installation page
          if (walletName === "Phantom") {
            window.open("https://phantom.app/", "_blank");
          } else if (walletName === "Solflare") {
            window.open("https://solflare.com/", "_blank");
          } else if (walletName === "Trust") {
            window.open("https://trustwallet.com/", "_blank");
          } else if (walletName === "SafePal") {
            window.open("https://www.safepal.io/download", "_blank");
          }
          return;
        }

        if (wallet.adapter.readyState === "NotDetected") {
          toast.error(
            `${walletName} wallet not detected. Please install the extension.`
          );
          return;
        }

        select(wallet.adapter.name);
        await wallet.adapter.connect();

        toast.success(`${walletName} Wallet Connected`);

        onClose();
      } catch (error: any) {
        console.error("Wallet connection error:", error);

        // Handle specific wallet errors
        let errorMessage = "Failed to connect";

        if (error?.name === "WalletNotReadyError") {
          errorMessage = `${walletName} wallet is not ready. Please make sure it's installed and unlocked.`;
        } else if (error?.name === "WalletConnectionError") {
          errorMessage = "Connection failed. Please try again.";
        } else if (error?.name === "WalletDisconnectedError") {
          errorMessage = "Wallet was disconnected. Please try again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
      } finally {
        setIsConnecting(false);
      }
    },
    [isConnecting, wallets, select, onClose]
  );

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!username || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (username.length < 3 || username.length > 50) {
      toast.error("Username must be between 3 and 50 characters");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      toast.error("Password must be between 8 and 128 characters");
      return;
    }

    try {
      const loginData = await login(username, password, rememberMe);
      toast.success(`Welcome back, ${loginData.user.username}!`);
      onClose();
    } catch (error: any) {
      console.error("Sign in error:", error);
      const errorMessage =
        error?.message || (typeof error === "string" ? error : "Unknown error");
      toast.error(`Sign in failed: ${errorMessage}`);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !firstName ||
      !lastName
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    // Username validation
    if (username.length < 3 || username.length > 50) {
      toast.error("Username must be between 3 and 50 characters");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Password validation
    if (password.length < 8 || password.length > 128) {
      toast.error("Password must be between 8 and 128 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Name validation
    if (
      firstName.length < 1 ||
      firstName.length > 100 ||
      lastName.length < 1 ||
      lastName.length > 100
    ) {
      toast.error("Names must be between 1 and 100 characters");
      return;
    }

    setIsLoading(true);
    try {
      const response = await defaultApiClient.register({
        username,
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
      });

      if (response.error || !response.data) {
        // Handle specific error codes
        let errorMessage = "Registration failed";

        if (response.status === 400) {
          if (response.error) {
            // Handle error object or string
            if (typeof response.error === "object" && response.error !== null) {
              errorMessage =
                (response.error as any).message ||
                "Validation error or user already exists";
            } else {
              errorMessage = String(response.error);
            }
          } else {
            errorMessage = "Validation error or user already exists";
          }
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (response.error) {
          // Handle error object or string
          if (typeof response.error === "object" && response.error !== null) {
            errorMessage =
              (response.error as any).message || JSON.stringify(response.error);
          } else {
            errorMessage = String(response.error);
          }
        }

        toast.error(errorMessage);
        return;
      }

      const registerData: RegisterResponse = response.data;

      // Check if email verification is required
      if ((registerData as any).verification_required) {
        toast.success(
          "Registration successful! Please check your email to verify your account."
        );
        onClose();
        // Redirect to verification page with email parameter
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      // Store the access token (only if verification not required)
      localStorage.setItem("access_token", registerData.access_token);
      localStorage.setItem(
        "token_expires_at",
        String(Date.now() + registerData.expires_in * 1000)
      );
      localStorage.setItem("user", JSON.stringify(registerData.user));

      toast.success(`Welcome, ${registerData.user.username}!`);
      onClose();

      // Optionally, trigger a page refresh or update global state
      // window.location.reload();
    } catch (error: any) {
      console.error("Sign up error:", error);
      const errorMessage =
        error?.message || (typeof error === "string" ? error : "Unknown error");
      toast.error(`Sign up failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-fit max-w-md md:max-w-lg h-fit max-h-[90vh] flex flex-col bg-accent overflow-y-auto p-4 md:p-10">
        <DialogHeader className="space-y-0 h-fit md:h-auto flex flex-row items-center justify-between pb-4 md:pb-2">
          <div className="space-y-2">
            <DialogTitle className="text-2xl text-foreground font-medium">
              {authMode === "wallet"
                ? "Connect Wallet"
                : authMode === "signin"
                ? "Sign In"
                : "Sign Up"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "wallet"
                ? "Connect your Solana wallet to start trading"
                : authMode === "signin"
                ? "Sign in to your account with email and password"
                : "Create a new account to get started"}
            </DialogDescription>
          </div>
          <Button
            className="bg-secondary p-[9px] shadow-none [&_svg]:size-[18px] rounded-[12px] border-border md:hidden"
            onClick={() => onClose()}
          >
            <XIcon size={18} className="text-secondary-foreground" />
          </Button>
        </DialogHeader>

        {authMode === "wallet" ? (
          <div className="w-full flex flex-col justify-between space-y-5">
            <WalletList
              wallets={allWallets}
              onWalletConnect={handleWalletConnect}
            />
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
              <form
                onSubmit={handleEmailSignIn}
                noValidate
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="h-9 px-3 py-2 rounded-sm border border-border"
                    minLength={3}
                    maxLength={50}
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
                      minLength={8}
                      maxLength={128}
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
                  disabled={isLoading || authLoading}
                  className="w-full rounded-sm"
                >
                  {isLoading || authLoading ? "Signing In..." : "Sign In"}
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

              <div className="mt-6">
                <WalletList
                  wallets={allWallets}
                  onWalletConnect={handleWalletConnect}
                  className="grid grid-cols-3 gap-3"
                />
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
              <form
                onSubmit={handleEmailSignUp}
                noValidate
                className="space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="h-9 px-3 py-2 rounded-sm border border-border"
                    minLength={3}
                    maxLength={50}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-first-name">First Name</Label>
                    <Input
                      id="signup-first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="h-9 px-3 py-2 rounded-sm border border-border"
                      minLength={1}
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-last-name">Last Name</Label>
                    <Input
                      id="signup-last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="h-9 px-3 py-2 rounded-sm border border-border"
                      minLength={1}
                      maxLength={100}
                      required
                    />
                  </div>
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
                      maxLength={128}
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
                      maxLength={128}
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
                  disabled={isLoading || authLoading}
                  className="w-full rounded-sm"
                >
                  {isLoading || authLoading ? "Creating Account..." : "Sign Up"}
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
