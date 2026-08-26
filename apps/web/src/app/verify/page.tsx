"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setErrorMessage("No verification token provided.");
        return;
      }

      try {
        await trpc.auth.verifyEmail.mutate({ token });
        setStatus("success");
        await refreshUser();
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Verification failed."
        );
      }
    }

    verify();
  }, [token, refreshUser]);

  return (
    <div className="bg-page font-sans min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-3xl shadow-lg p-8 text-center border border-border-card">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-heading mb-2">Verifying...</h1>
            <p className="text-body text-sm">Please wait while we verify your email.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-heading mb-2">Email verified!</h1>
            <p className="text-body text-sm mb-6">
              Your email has been verified. You&apos;re all set.
            </p>
            <Link
              href="/dashboard"
              className="pill-button dark-btn inline-block py-3 px-8 font-bold text-sm"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-heading mb-2">Verification failed</h1>
            <p className="text-body text-sm mb-6">{errorMessage}</p>
            <Link
              href="/auth"
              className="text-sm text-accent font-semibold hover:underline"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
