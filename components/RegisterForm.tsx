"use client";

import React, { useState } from "react";
import { register as registerApi } from "../lib/api/auth";
import type { RegistrationRequest } from "../types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Role is assigned by backend, not selected during registration

export default function RegisterForm({
  onSuccess,
}: {
  onSuccess?: (resp: any) => void;
}) {
  const [form, setForm] = useState<RegistrationRequest>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof RegistrationRequest>(
    key: K,
    value: RegistrationRequest[K]
  ) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function validate() {
    if (
      !form.username ||
      form.username.length < 3 ||
      form.username.length > 50
    ) {
      return "Username must be 3-50 characters.";
    }
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      return "Please enter a valid email address.";
    }
    if (
      !form.password ||
      form.password.length < 8 ||
      form.password.length > 128
    ) {
      return "Password must be 8-128 characters.";
    }
    if (!form.first_name || form.first_name.length > 100) {
      return "First name is required (max 100 characters).";
    }
    if (!form.last_name || form.last_name.length > 100) {
      return "Last name is required (max 100 characters).";
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const payload = await registerApi(form);
      setSuccess(
        payload.message ||
        "Registration successful. Please check your email to verify your account and generate your wallet."
      );
      onSuccess?.(payload);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Register to start trading on GridTokenX
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                placeholder="john_doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="john.doe@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
          </div>



          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
                placeholder="John"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Registering…" : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
