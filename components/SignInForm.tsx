"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SignInFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
  onBack?: () => void;
}

export default function SignInForm({
  onSuccess,
  onSwitchToSignUp,
  onBack,
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        setErrors({ form: "Please fill in all fields" });
        setIsLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrors({ email: "Please enter a valid email address" });
        setIsLoading(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Implement actual sign in logic here
      // Example: const response = await fetch('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password, rememberMe }) });

      toast.success("Sign in successful!");
      setEmail("");
      setPassword("");
      setRememberMe(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setErrors({
        form: error.message || "Failed to sign in. Please try again.",
      });
      toast.error("Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      <form onSubmit={handleSignIn} className="space-y-5">
        {errors.form && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-sm">
            {errors.form}
          </div>
        )}

        <div className="w-full flex flex-col">
          <Label className="text-xs font-medium text-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({});
            }}
            placeholder="you@example.com"
            className={cn(
              "bg-secondary border rounded-sm py-2 px-3 text-xs focus:border-primary",
              errors.email && "border-destructive"
            )}
            required
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="w-full flex flex-col space-y-[14px]">
          <Label className="text-xs font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({});
              }}
              placeholder="Enter your password"
              className={cn(
                "bg-secondary border rounded-sm py-2 px-3 text-xs focus:border-primary pr-10",
                errors.password && "border-destructive"
              )}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-secondary accent-primary"
              disabled={isLoading}
            />
            <span className="text-secondary-foreground">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => toast("Password reset feature coming soon!")}
            className="text-primary hover:text-primary/80 transition-colors"
            disabled={isLoading}
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full text-xs bg-primary hover:bg-gradient-primary text-background"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {onSwitchToSignUp && (
        <div className="text-center text-xs">
          <span className="text-secondary-foreground">
            Don't have an account?{" "}
          </span>
          <button
            onClick={() => {
              setErrors({});
              onSwitchToSignUp();
            }}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
            disabled={isLoading}
          >
            Sign up
          </button>
        </div>
      )}

      {onBack && (
        <Button
          variant="ghost"
          onClick={() => {
            setErrors({});
            onBack();
          }}
          className="w-full text-xs text-secondary-foreground hover:text-foreground"
          disabled={isLoading}
        >
          Back to Wallet
        </Button>
      )}
    </div>
  );
}
