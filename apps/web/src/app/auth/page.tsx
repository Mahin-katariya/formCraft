"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

type AuthView = "signin" | "signup";

export default function AuthPage() {
  const { user, loading, login, register, googleLogin } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<AuthView>("signin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  function switchView(newView: AuthView) {
    setError(null);
    setView(newView);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(signInForm.email, signInForm.password);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const displayName = signUpForm.username || undefined;
      const result = await register(signUpForm.email, signUpForm.password, displayName);

      if (!result.emailVerified) {
        router.push(`/check-email?email=${encodeURIComponent(signUpForm.email)}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign up failed. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      setError("Google sign in failed — no credential received.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await googleLogin(response.credential);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign in failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-page font-sans h-screen flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <div className="w-full max-w-[1100px] h-full max-h-[720px] bg-surface rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row border border-border-card">
        {/* Left Section: Dark Feature Panel (desktop only) */}
        <div className="hidden md:flex md:w-1/2 relative bg-panel-dark flex-col justify-between p-10 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/auth-bg.png"
              alt=""
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-panel-dark via-transparent to-transparent opacity-60" />
          </div>

          <div className="relative z-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xl">
                <DoveIcon className="w-5 h-5 text-accent" />
              </div>
              <span className="text-white font-bold tracking-tight text-xl">
                PigeonForm
              </span>
            </div>
            <h2 className="text-white text-4xl font-serif italic mb-4 leading-tight">
              Deliver your data <br />
              with elegance.
            </h2>
          </div>

          <div className="relative z-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="p-6 rounded-[2rem] max-w-sm border border-white/12 bg-white/[0.01] shadow-[0_4px_24px_0_rgba(0,0,0,0.02)]">
              <p className="text-white text-base font-semibold leading-relaxed">
                Build forms that people actually enjoy filling out. Seamlessly
                integrated, beautifully designed, and built for modern teams.
              </p>
            </div>
          </div>
        </div>

        {/* Right Section: Auth Form */}
        <div className="w-full md:w-1/2 flex flex-col p-5 md:p-8 bg-surface">
          <div
            className="max-w-[400px] mx-auto w-full mb-5 text-center md:text-left animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="md:hidden flex justify-center mb-5">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-xl">
                <DoveIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-heading mb-2">
              Welcome to PigeonForm
            </h1>
            <p className="text-body font-medium text-sm md:text-base">
              Let&apos;s build your next project.
            </p>
          </div>

          {/* Tab Switcher */}
          <div
            className="max-w-[400px] mx-auto w-full mb-5 p-1 bg-tab-track rounded-full flex animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
            role="tablist"
          >
            <button
              role="tab"
              aria-selected={view === "signin"}
              onClick={() => switchView("signin")}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 ${
                view === "signin"
                  ? "bg-white shadow-sm text-heading"
                  : "text-body hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
            <button
              role="tab"
              aria-selected={view === "signup"}
              onClick={() => switchView("signup")}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-all duration-300 ${
                view === "signup"
                  ? "bg-white shadow-sm text-heading"
                  : "text-body hover:text-slate-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="max-w-[400px] mx-auto w-full mb-4">
              <p className="text-error text-sm font-medium text-center">{error}</p>
            </div>
          )}

          {/* Sign In View */}
          <div
            className={`max-w-[400px] mx-auto w-full ${
              view === "signin" ? "block" : "hidden"
            }`}
          >
            <div className="space-y-3 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign in was cancelled.")}
                width="400"
                text="continue_with"
                shape="pill"
              />
            </div>

            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-divider w-full" />
              <span className="absolute bg-surface px-4 text-[10px] font-bold text-label uppercase tracking-[0.2em]">
                OR EMAIL
              </span>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="block text-[11px] md:text-[10px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={signInForm.email}
                  onChange={(e) =>
                    setSignInForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full bg-input-bg border border-transparent rounded-xl md:rounded-2xl py-3 px-4 md:px-5 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-[11px] md:text-[10px] font-bold text-label uppercase tracking-widest">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] md:text-[10px] font-bold text-accent hover:underline tracking-tight"
                  >
                    <span className="hidden md:inline">Forgot password?</span>
                    <span className="md:hidden">Forgot?</span>
                  </button>
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={signInForm.password}
                  onChange={(e) =>
                    setSignInForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full bg-input-bg border border-transparent rounded-xl md:rounded-2xl py-3 px-4 md:px-5 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="pill-button dark-btn w-full py-3 font-bold text-sm mt-3"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>

          {/* Sign Up View */}
          <div
            className={`max-w-[400px] mx-auto w-full ${
              view === "signup" ? "block" : "hidden"
            }`}
          >
            <div className="space-y-3 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign in was cancelled.")}
                width="400"
                text="continue_with"
                shape="pill"
              />
            </div>

            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-divider w-full" />
              <span className="absolute bg-surface px-4 text-[10px] font-bold text-label uppercase tracking-[0.2em]">
                OR EMAIL
              </span>
            </div>

            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-[11px] md:text-[10px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="janedoe"
                  value={signUpForm.username}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  className="w-full bg-input-bg border border-transparent rounded-xl md:rounded-2xl py-3 px-4 md:px-5 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] md:text-[10px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={signUpForm.email}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full bg-input-bg border border-transparent rounded-xl md:rounded-2xl py-3 px-4 md:px-5 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] md:text-[10px] font-bold text-label uppercase tracking-widest mb-1.5 ml-1">
                  Create Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  value={signUpForm.password}
                  onChange={(e) =>
                    setSignUpForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full bg-input-bg border border-transparent rounded-xl md:rounded-2xl py-3 px-4 md:px-5 outline-none focus:bg-surface focus:border-border-input transition-all text-sm font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="pill-button dark-btn w-full py-3 font-bold text-sm mt-3"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-4 max-w-[400px] mx-auto w-full text-center">
            <p className="text-[11px] text-label font-medium leading-relaxed">
              By continuing, you agree to our <br />
              <a
                href="#"
                className="text-heading underline underline-offset-4 font-bold hover:text-accent transition-colors"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-heading underline underline-offset-4 font-bold hover:text-accent transition-colors"
              >
                Terms of Service
              </a>
              .
            </p>
            <div className="mt-4 text-[10px] md:text-[9px] font-bold text-ghost uppercase tracking-[0.3em] md:tracking-[0.4em]">
              The Pigeon Intelligence Co.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DoveIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="currentColor"
      className={className}
    >
      <path d="M160.8 96.5c14 17 31 30.9 49.5 42.2c25.9 15.8 56.2 27.1 89.8 27.1c34.1 0 56.4-9.5 76.1-18.6l.2-.1c19-8.8 36.7-17 59.6-17c35.3 0 66.3 20.3 82.4 38.1c8 8.8 13.8 17.6 17.4 24.2c1.8 3.3 3.1 6.1 3.9 8.2c.4 1 .7 1.8 .8 2.3l.2 .6 0 .2 0 .1 0 0 0 0s0 0-39.9 12.1l39.9-12.1c4.1 13.4-.6 27.8-11.6 35.8L384 288l-66.7 53.3L256 448l-56-64-64 32-48-80L0 304l96-112 32-48 32.8-40.5zM256 192a32 32 0 1 0 0-64 32 32 0 1 0 0 64z" />
    </svg>
  );
}

