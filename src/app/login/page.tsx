"use client";

import { useActionState } from "react";
import { sendMagicLink, type MagicLinkState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: MagicLinkState = {};

export default function LoginPage() {
  const [state, action] = useActionState(sendMagicLink, initial);
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form
        action={action}
        className="w-full max-w-sm space-y-4 rounded-lg border p-6"
      >
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email you a magic link.
        </p>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <Button type="submit" className="w-full">
          Send link
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.sent && <p className="text-sm text-green-600">Check your email.</p>}
      </form>
    </main>
  );
}
