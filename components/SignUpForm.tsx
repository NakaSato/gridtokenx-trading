"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
  onBack?: () => void;
}

export default function SignUpForm({
  onSuccess,
  onSwitchToSignIn,
  onBack,
}: SignUpFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Basic validation
      if (!username || !email || !password || !confirmPassword) {
        setErrors({ form: "Please fill in all fields" });
        setIsLoading(false);
        return;
      }

      // Username validation
      if (username.length < 3) {
        setErrors({ username: "Username must be at least 3 characters" });
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

      // Password validation
      if (password.length < 8) {
        setErrors({ password: "Password must be at least 8 characters" });
        setIsLoading(false);
        return;
      }

      // Password match validation
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: "Passwords do not match" });
        setIsLoading(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Implement actual sign up logic here
      // Example: const response = await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ username, email, password }) });

      toast.success("Account created successfully!");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      setErrors({
        form: error.message || "Failed to create account. Please try again.",
      });
      toast.error("Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-5">
      <div className="mb-3">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Create Account
        </h2>
        <p className="text-xs text-secondary-foreground">
          Sign up to start trading
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-5">
        {errors.form && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-sm">
            {errors.form}
          </div>
        )}

        <div className="w-full flex flex-col space-y-[14px]">
          <Label className="text-xs font-medium text-foreground">
            Username
          </Label>
          <Input
            id="signup-username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors({});
            }}
            required
            disabled={isLoading}
            className={cn(
              "bg-secondary border rounded-sm py-2 px-3 text-xs focus:border-primary",
              errors.username && "border-destructive"
            )}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username}</p>
          )}
          <p className="text-xs text-secondary-foreground">
            At least 3 characters
          </p>
        </div>

        <div className="w-full flex flex-col space-y-[14px]">
          <Label className="text-xs font-medium text-foreground">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({});
            }}
            required
            disabled={isLoading}
            className={cn(
              "bg-secondary border rounded-sm py-2 px-3 text-xs focus:border-primary",
              errors.email && "border-destructive"
            )}
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
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({});
              }}
              required
              disabled={isLoading}
              className={cn(
                "bg-secondary border rounded-sm py-2 px-3 text-xs focus:border-primary pr-10",
                errors.password && "border-destructive"
              )}
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
          <p className="text-xs text-secondary-foreground">
            At least 8 characters
          </p>
        </div>

        <div className="w-full flex flex-col space-y-[14px]">
          <Label className="text-xs font-medium text-foreground">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors({});
              }}
              required
              disabled={isLoading}
              className={cn(
                "bg-secondary border rounded-sm py-2 px-3 text-xs focus:border-primary pr-10",
                errors.confirmPassword && "border-destructive"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-foreground hover:text-foreground transition-colors"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full text-xs bg-primary hover:bg-gradient-primary text-background"
        >
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      {onSwitchToSignIn && (
        <div className="text-center text-xs">
          <span className="text-secondary-foreground">
            Already have an account?{" "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
            onClick={() => {
              setErrors({});
              onSwitchToSignIn();
            }}
            disabled={isLoading}
          >
            Sign in
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
