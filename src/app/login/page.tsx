"use client";

import { useState, useTransition } from "react";
import { requestOtp, verifyEmailOtp } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await requestOtp(email);
      if (res.error) {
        setError(res.error);
        return;
      }
      setStep("code");
      setNotice(`We sent a code to ${email}.`);
    });
  };

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success this redirects; only errors return.
      const res = await verifyEmailOtp(email, code);
      if (res?.error) setError(res.error);
    });
  };

  const resend = () => {
    setError(null);
    startTransition(async () => {
      const res = await requestOtp(email);
      setNotice(res.error ? null : "New code sent.");
      if (res.error) setError(res.error);
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      {step === "email" ? (
        <form onSubmit={sendCode} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a 6-digit code.
          </p>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending || !email}>
            {pending ? "Sending…" : "Send code"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      ) : (
        <form onSubmit={verify} className="w-full max-w-sm space-y-4 rounded-lg border p-6">
          <h1 className="text-xl font-semibold">Enter code</h1>
          {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
          <div className="space-y-2">
            <Label htmlFor="code">6-digit code</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center font-mono text-lg tracking-[0.4em]"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending || code.length !== 6}>
            {pending ? "Verifying…" : "Verify & sign in"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-between text-xs text-muted-foreground">
            <button type="button" className="hover:text-foreground" onClick={resend} disabled={pending}>
              Resend code
            </button>
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setNotice(null);
              }}
              disabled={pending}
            >
              Change email
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
