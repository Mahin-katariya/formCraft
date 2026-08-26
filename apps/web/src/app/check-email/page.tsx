"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { trpc } from "@/lib/trpc";
import Link from "next/link";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email";
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setResending(true);
    setError(null);
    setResent(false);
    try {
      await trpc.auth.resendVerification.mutate();
      setResent(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resend.";
      setError(message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="bg-page font-sans min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-3xl shadow-lg p-8 text-center border border-border-card">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✉️</span>
        </div>

        <h1 className="text-2xl font-bold text-heading mb-2">Check your email</h1>
        <p className="text-body text-sm mb-6">
          We sent a verification link to{" "}
          <span className="font-semibold text-heading">{email}</span>. Click the
          link to verify your account.
        </p>

        {resent && (
          <p className="text-sm text-green-600 font-medium mb-4">
            Verification email resent!
          </p>
        )}
        {error && (
          <p className="text-sm text-error font-medium mb-4">{error}</p>
        )}

        {user && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="pill-button dark-btn w-full py-3 font-bold text-sm mb-3"
          >
            {resending ? "Resending..." : "Resend verification email"}
          </button>
        )}

        <Link
          href="/dashboard"
          className="block text-sm text-accent font-semibold hover:underline mt-2"
        >
          Continue to Dashboard →
        </Link>
      </div>
    </div>
  );
}
