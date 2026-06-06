# OTP Code Login (iOS PWA fix)

**Date:** 2026-06-06
**Status:** Approved

## Goal

Let users log in by entering a 6-digit code, so the session is created inside
the installed iOS home-screen PWA (which has its own storage container, separate
from Safari). Magic links open in Safari and never log the PWA in; a typed code
sidesteps that. Desktop magic links keep working.

Email delivery is already handled by Supabase Custom SMTP → SendGrid (dashboard
config). This change is app-side only.

## Decisions

- Passwordless OTP via Supabase `signInWithOtp` / `verifyOtp` (`type: 'email'`).
- Keep the magic link for desktop (`emailRedirectTo` → `/auth/callback`, the
  existing PKCE code-exchange route — unchanged).
- The email carries both: user adds `{{ .Token }}` to the Supabase Magic Link
  email template so the 6-digit code appears alongside the link.

## Components

- `src/server/actions/auth.ts`:
  - `requestOtp(email)` → validates email, `signInWithOtp({ email, emailRedirectTo })`,
    returns `{ error? }`.
  - `verifyEmailOtp(email, token)` → validates, `verifyOtp({ email, token, type: 'email' })`;
    on success `redirect('/')` (session cookie lands in the PWA container).
  - keep `signOut`. Remove `sendMagicLink`.
- `src/lib/validation.ts` — `OtpTokenSchema = z.string().trim().regex(/^\d{6}$/)`.
- `src/app/login/page.tsx` — client component, two steps:
  1. **email** → `requestOtp` → advance to step 2.
  2. **code** → 6-digit input → `verifyEmailOtp`; **Resend code** (re-runs
     `requestOtp`) and **Change email** (back to step 1). Inline errors.

## Error handling

- Invalid email → "Enter a valid email."
- Bad/expired code → "Invalid or expired code. Try again."
- Supabase rate-limit message surfaced as-is.

## Testing

- Unit: `OtpTokenSchema` accepts `"123456"`, rejects `"12345"`, `"abcdef"`,
  `" 12 "`, empty.
- Auth actions / UI are Supabase integration — covered by typecheck + a local
  build, manual verification on device.

## You do (dashboard)

- Supabase → Auth → Email Templates → **Magic Link**: add `Your code is {{ .Token }}`.

## Out of scope

- SendGrid SDK / Send Email hook (deferred; SMTP is fine for now).
- Password auth.
